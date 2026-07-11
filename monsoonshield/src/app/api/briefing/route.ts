import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fetchAllRealData } from "@/lib/realData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// ============================================================
// RESPONSE CACHE — critical for staying under 20 req/day free tier
// ============================================================

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const briefingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string): string | null {
  const entry = briefingCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  if (entry) briefingCache.delete(key);
  return null;
}

function setCache(key: string, data: string) {
  briefingCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max = 10, windowMs = 300000): boolean {
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
    const { location, language, lat, lng } = body;

    if (!location || typeof location !== "string" || location.length > 200) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const lang = language === "hi" ? "Hindi" : "English";

    // Check cache first — saves Gemini API quota
    const cacheKey = `briefing:${location}:${lang}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ briefing: cached, cached: true });
    }

    // Fetch real-time data + initialize Gemini model in parallel
    const userLat = parseFloat(lat) || 18.52;
    const userLng = parseFloat(lng) || 73.86;

    const [realtimeData, genAI] = await Promise.all([
      fetchAllRealData(userLat, userLng, location),
      Promise.resolve(new GoogleGenerativeAI(API_KEY)),
    ]);

    const systemPrompt = `You are Varsha, MonsoonShield's AI monsoon briefing assistant grounded in IMD and NDMA guidelines.

CRITICAL RULES:
- ONLY use the factual data provided below. Do NOT make up any weather numbers, river levels, alert details, or any other data.
- If data is insufficient for a part of the briefing, clearly state what is known and what is uncertain.
- Do NOT invent NDMA guideline numbers or references.
- Be factual, calm, and actionable. Use IMD and NDMA language.
- Do NOT fabricate tomorrow's forecast beyond what the data shows.`;

    const prompt = `Generate a concise daily monsoon briefing for a user in ${location}.

${realtimeData}

Write a 3-4 sentence briefing in ${lang}:
1. Current situation summary (based on actual weather data above)
2. Key risk for today (based on actual alerts and flood prediction above)
3. One action to take (based on actual alert actionRequired)
4. Tomorrow's outlook (based on actual 7-day forecast data above)

Use NDMA/IMD language. Be factual, calm, actionable. ONLY cite data that is provided above.
Include the data source attribution (e.g., "Source: Open-Meteo, NDMA SACHET").`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: systemPrompt,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent(prompt);
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

    const text = result!.response.text();
    setCache(cacheKey, text);

    return NextResponse.json({ briefing: text });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("API /briefing error:", errMsg);

    if (errMsg.includes("429") || errMsg.includes("quota")) {
      return NextResponse.json(
        { error: "AI service quota reached. Briefing temporarily unavailable." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
