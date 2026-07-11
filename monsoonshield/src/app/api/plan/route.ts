import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fetchAllRealData } from "@/lib/realData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Cache for preparedness plans (keyed by profile params)
interface CacheEntry { data: string; expiresAt: number; }
const planCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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

    // Check cache
    const cacheKey = `${location}:${familySize}:${hasChildren}:${hasElderly}:${hasMedicalConditions}:${homeType}:${hasVehicle}:${floodRiskScore}`;
    const cached = getCachedPlan(cacheKey);
    if (cached) {
      return NextResponse.json({ plan: cached, cached: true });
    }

    // Fetch real-time data + initialize Gemini model in parallel
    const userLat = parseFloat(lat) || 18.52;
    const userLng = parseFloat(lng) || 73.86;

    const [realtimeData, genAI] = await Promise.all([
      fetchAllRealData(userLat, userLng, location),
      Promise.resolve(new GoogleGenerativeAI(API_KEY)),
    ]);

    const systemPrompt = `You are Varsha, MonsoonShield's AI preparedness planning assistant grounded in NDMA guidelines.

CRITICAL RULES:
- ONLY use the factual data provided below. Do NOT make up any numbers, costs, or references.
- For cost estimates: state that costs are approximate ranges based on typical Indian market prices, not exact quotes. Clearly label them as "estimated" or "approximate".
- Do NOT invent specific NDMA guideline numbers. Only reference NDMA guidelines in general terms.
- Be specific to the household's actual situation and the actual risk data provided.
- Always include emergency contacts from the provided data.
- Include the data source attribution.`;

    const prompt = `Generate a personalized monsoon preparedness plan for this Indian household:
Location: ${location}
Family Size: ${familySize || 4} members
Has Children: ${hasChildren || false}
Has Elderly Members: ${hasElderly || false}
Medical Conditions: ${hasMedicalConditions || false}
Home Type: ${homeType || "apartment"}
Has Vehicle: ${hasVehicle || false}
Flood Risk Score: ${floodRiskScore || 58}/100

${realtimeData}

Create a structured plan with:
1. CRITICAL actions (this week)
2. IMPORTANT actions (this month)
3. ONGOING actions (throughout monsoon)
4. EMERGENCY protocol (if flood warning)

Format: [PRIORITY] Action - Why - Time - Cost in ₹ (labeled as "estimated")
Include emergency contacts from the data above.
Do NOT invent specific NDMA guideline numbers. Only reference NDMA in general terms.
All cost figures must be labeled as "estimated" and are approximate Indian market prices.`;

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
    setPlanCache(cacheKey, text);

    return NextResponse.json({ plan: text });
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
