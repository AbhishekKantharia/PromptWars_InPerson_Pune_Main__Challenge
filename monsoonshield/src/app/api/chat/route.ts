import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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

const SYSTEM_PROMPT = `You are Varsha (वर्षा), MonsoonShield's intelligent AI disaster preparedness assistant for India. You are powered by Google Gemini 2.5 and grounded in official NDMA, IMD, MOHFW, and WHO guidelines.

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

    // Initialize Gemini (server-side only)
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT + contextBlock,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Build chat history (exclude last message)
    const chatHistory = (history || [])
      .slice(0, -1)
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error: any) {
    console.error("API /chat error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
