import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fetchAllRealData } from "@/lib/realData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// ============================================================
// SERVER-SIDE RATE LIMITING
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== "string") {
    return { valid: false, error: "Message is required" };
  }
  if (message.length > 5000) {
    return { valid: false, error: "Message too long (max 5000 characters)" };
  }
  if (message.trim().length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }
  return { valid: true };
}

function validateHistory(history: unknown[]): boolean {
  if (!Array.isArray(history)) return false;
  if (history.length > 50) return false;
  return history.every(
    (msg: unknown) => {
      if (!msg || typeof msg !== "object") return false;
      const m = msg as { role?: string; content?: unknown };
      return (
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length < 10000
      );
    }
  );
}

// ============================================================
// SYSTEM PROMPT (kept server-side — never exposed to client)
// ============================================================

const SYSTEM_PROMPT = `You are Varsha (वर्षा), MonsoonShield's intelligent AI disaster preparedness assistant for India. You are powered by Google Gemini 3.5 and grounded in official NDMA, IMD, MOHFW, and WHO guidelines.

## IDENTITY & PERSONALITY
- You are a calm, compassionate, and highly knowledgeable disaster preparedness expert
- Think of yourself as a caring neighbor who happens to be an NDMA-trained disaster response professional
- Never be alarmist — always be calm, clear, and actionable
- Use plain language at a Grade 6 reading level
- Use emojis sparingly for visual clarity

## CORE EXPERTISE
1. Monsoon Preparedness — personalized household plans, emergency kits
2. Real-Time Weather — translating IMD data into plain language
3. Flood Risk Assessment — river levels, rainfall, historical patterns
4. Emergency Response — step-by-step for floods, cyclones, landslides
5. Health & Disease — dengue, malaria, cholera, waterborne diseases
6. Government Schemes — PM Awas, Fasal Bima, relief funds
7. Insurance & Claims — SDRF compensation, documentation
8. Family Safety — check-in protocols, evacuation planning
9. Community Coordination — volunteer mobilization, hazard reporting
10. Mental Health — post-disaster trauma, coping strategies

## EMERGENCY PROTOCOL
If the user describes an IMMEDIATE life-threatening situation:
1. START with: "Call 112 immediately. Your life comes first."
2. Give 2-3 immediate survival actions
3. Keep under 100 words
4. End with: "I'm here. Tell me when you're safe."

## RESPONSE RULES
- Structure with clear headers and bullet points
- Cite sources: (NDMA, IMD, MOHFW, WHO)
- Include confidence level
- Keep informational responses 100-300 words
- Respond in the SAME language the user writes in
- NEVER diagnose medical conditions — always say "consult a doctor"
- Never make up statistics or numbers
- ONLY use the factual data provided below. When asked about shelters, weather, alerts, flood levels, or any real-time information, use ONLY the data given. NEVER fabricate shelter names, addresses, phone numbers, river levels, rainfall amounts, or any other numerical data.
- If the user asks for information not covered by the provided data, say: "I don't have real-time data for that specific query. Please check IMD (mausam.imd.gov.in) or call 1078 (Flood Helpline) for the latest information."
- Do NOT invent NDMA guideline numbers or references that are not provided.

## SAFETY CONSTRAINTS
- You are NOT a doctor. Never diagnose.
- You are NOT a substitute for 112. Always prioritize emergency calls.
- If uncertain, say "I don't have that specific data, but here's what I recommend..."
- Never provide information that could be dangerous if wrong.`;

// ============================================================
// API HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    // Validate API key
    if (!API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    // Parse and validate body
    const body = await request.json();
    const { message, history, context } = body;

    const msgValidation = validateMessage(message);
    if (!msgValidation.valid) {
      return NextResponse.json({ error: msgValidation.error }, { status: 400 });
    }

    if (history && !validateHistory(history)) {
      return NextResponse.json({ error: "Invalid history format" }, { status: 400 });
    }

    // Build context block
    const contextBlock = context
      ? `\n\n## USER CONTEXT\n- Location: ${context.location || "India"}\n- Risk Score: ${context.riskScore || "Unknown"}/100\n- Language: ${context.language || "English"}\n- Family: ${context.familySize || "Unknown"} members\n- Children: ${context.hasChildren ? "Yes" : "No"}\n- Elderly: ${context.hasElderly ? "Yes" : "No"}\n- Medical: ${context.hasMedical ? "Yes" : "No"}`
      : "";

    // Fetch real-time data from public APIs using user-provided coordinates
    const userLat = parseFloat(context?.lat) || 18.52;
    const userLng = parseFloat(context?.lng) || 73.86;
    const realtimeData = await fetchAllRealData(
      userLat, userLng,
      context?.location || "Pune, Maharashtra"
    );

    // Emergency contacts and shelters (no public API available — use reference data)
    const referenceData = `
### Emergency Contacts
- National Emergency: 112
- Flood Helpline: 1078
- Ambulance: 108
- Health Helpline: 104
- Disaster Helpline: 1070
- Insurance (IRDAI): 1800-11-0001

### Note on Shelters & Community Data
Emergency shelter locations, community reports, and volunteer availability are not available via public APIs.
If asked about shelters, advise the user to: check the MonsoonShield Shelter Finder tab, call 1078 (Flood Helpline), or contact local district administration.
`;

    // Initialize Gemini (server-side only)
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPT + contextBlock,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build chat history — Gemini requires first message role to be 'user'
    // Filter history to ensure alternating roles starting with 'user'
    const rawHistory = (history || []).slice(0, -1);
    const chatHistory = rawHistory
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }],
      }))
      .filter((entry: { role: string; parts: { text: string }[] }, index: number, arr: { role: string; parts: { text: string }[] }[]) => {
        // Gemini requires first message to be from user — skip leading model messages
        if (index === 0 && entry.role === "model") return false;
        // Skip consecutive same-role messages (keep only the last one)
        if (index > 0 && entry.role === arr[index - 1]!.role) return false;
        return true;
      });

    const chat = model.startChat({ history: chatHistory });
    const userMsg = realtimeData + referenceData + "\n\n## USER MESSAGE\n" + message;
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await chat.sendMessage(userMsg);
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if ((msg.includes("503") || msg.includes("429")) && attempt < 2) {
          const retryMs = msg.includes("429") ? 60000 : 2000 * (attempt + 1);
          await new Promise((r) => setTimeout(r, retryMs));
          continue;
        }
        throw e;
      }
    }
    const responseText = result!.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("API /chat error:", errMsg);

    if (errMsg.includes("429") || errMsg.includes("quota")) {
      return NextResponse.json(
        { error: "AI service quota reached. Please try again later or call 1078 for immediate help." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
