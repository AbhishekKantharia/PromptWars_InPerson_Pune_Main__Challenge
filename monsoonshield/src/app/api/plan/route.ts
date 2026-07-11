import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fetchAllRealData } from "@/lib/realData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

interface CacheEntry { data: string; expiresAt: number; }
const planCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCachedPlan(key: string): string | null {
  const entry = planCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  if (entry) planCache.delete(key);
  return null;
}

function setPlanCache(key: string, data: string) {
  planCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max = 5, windowMs = 600000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are Varsha, MonsoonShield's disaster preparedness planner. You generate PERSONALIZED, ACTIONABLE household emergency plans grounded in real data.

RULES — ZERO HALLUCINATION:
- ONLY reference facts from the real-time data block below.
- For cost estimates: label them "estimated" and use typical Indian market ranges. Never fabricate exact prices.
- Never invent specific NDMA guideline numbers. Say "NDMA recommends" without fake reference IDs.
- Every action item must be specific to THIS household's profile (location, family composition, home type, risk level).
- If the real-time data shows active alerts or flood risk, PRIORITIZE those threats in the plan.
- If data is missing for a category, say what is known and what is uncertain.
- Always include the emergency contacts from the provided data.
- Format as a structured markdown plan with clear priority levels.`;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { location, familySize, hasChildren, hasElderly, hasMedicalConditions, homeType, hasVehicle, floodRiskScore, lat, lng } = body;

    if (!location || typeof location !== "string" || location.length > 200) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const cacheKey = `${location}:${familySize}:${hasChildren}:${hasElderly}:${hasMedicalConditions}:${homeType}:${hasVehicle}:${floodRiskScore}`;
    const cached = getCachedPlan(cacheKey);
    if (cached) {
      return new Response(cached, { headers: { "Content-Type": "text/plain" } });
    }

    const userLat = parseFloat(lat) || 18.52;
    const userLng = parseFloat(lng) || 73.86;

    const [realtimeData, genAI] = await Promise.all([
      fetchAllRealData(userLat, userLng, location),
      Promise.resolve(new GoogleGenerativeAI(API_KEY)),
    ]);

    const familyProfile = [
      `${familySize || 4} members`,
      hasChildren ? "includes children under 12" : null,
      hasElderly ? "includes elderly members (65+)" : null,
      hasMedicalConditions ? "has members with regular medical needs (insulin, dialysis, etc.)" : null,
      `home type: ${homeType || "apartment"}`,
      hasVehicle ? "has family vehicle" : "no personal vehicle",
    ].filter(Boolean).join(", ");

    const prompt = `Generate a personalized monsoon preparedness plan for a household at ${location}.

HOUSEHOLD PROFILE: ${familyProfile}
FLOOD RISK SCORE: ${floodRiskScore || 50}/100

REAL-TIME DATA:
${realtimeData}

INSTRUCTIONS:
1. Start with a 2-sentence situation assessment based on the actual weather and alert data above.
2. Then provide a structured plan with these sections:
   - 🔴 CRITICAL (do THIS WEEK) — 4-6 items, each with specific action, why it matters for THIS household, estimated time, and estimated cost in ₹
   - 🟡 IMPORTANT (do THIS MONTH) — 4-6 items same format
   - 🟢 ONGOING (throughout monsoon) — 3-4 items
   - 🚨 EMERGENCY PROTOCOL — only if active flood/cyclone alerts exist in the data
3. Each action must account for the household's special conditions (children, elderly, medical needs, vehicle access).
4. Include specific emergency contacts from the data above.
5. End with data source attribution.

Format as clear markdown. Be direct and actionable — no generic advice.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    let stream;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        stream = await model.generateContentStream(prompt);
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

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream!.stream) {
            const text = chunk?.text?.();
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(JSON.stringify({ t: text }) + "\n"));
            }
          }
          setPlanCache(cacheKey, fullText);
          controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Stream interrupted" }) + "\n"));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("API /plan error:", errMsg);

    if (errMsg.includes("429") || errMsg.includes("quota")) {
      return NextResponse.json(
        { error: "AI service quota reached. Plan generation temporarily unavailable." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
