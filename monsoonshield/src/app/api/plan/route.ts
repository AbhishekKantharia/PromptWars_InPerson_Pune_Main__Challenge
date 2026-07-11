import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import {
  MOCK_SHELTERS,
  MOCK_FLOOD_PREDICTION,
  RISK_SCORE_FACTORS,
} from "@/lib/mockData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

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
    const { location, familySize, hasChildren, hasElderly, hasMedicalConditions, homeType, hasVehicle, floodRiskScore } = body;

    if (!location || typeof location !== "string" || location.length > 200) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const systemPrompt = `You are Varsha, MonsoonShield's AI preparedness planning assistant grounded in NDMA guidelines.

CRITICAL RULES:
- ONLY use the factual data provided below. Do NOT make up any numbers, costs, or references.
- For cost estimates: state that costs are approximate ranges based on typical Indian market prices, not exact quotes. Clearly label them as "estimated" or "approximate".
- Do NOT invent specific NDMA guideline numbers. Only reference NDMA guidelines in general terms.
- Be specific to the household's actual situation and the actual risk data provided.
- Always include emergency contacts from the provided data.`;

    const factualData = `
## CURRENT FACTUAL DATA (Use ONLY this data)

### Risk Score Factors
${RISK_SCORE_FACTORS.map(f => `- ${f.label}: ${f.score}/100 (Weight: ${(f.weight*100).toFixed(0)}%)`).join("\n")}

### Flood Prediction (Mula River)
- Danger Threshold: ${MOCK_FLOOD_PREDICTION[0]?.danger ?? 60}%
- Peak Level: ${Math.max(...MOCK_FLOOD_PREDICTION.map(p => p.level))}% at ${MOCK_FLOOD_PREDICTION.reduce((max, p) => p.level > max.level ? p : max, MOCK_FLOOD_PREDICTION[0]!).time}
- Trend: Rising until evening, then receding

### Nearby Emergency Shelters
${MOCK_SHELTERS.map(s => `- ${s.name}: ${s.address} (${s.distanceKm} km) — ${s.currentOccupancy}/${s.capacity} capacity — Contact: ${s.contact}`).join("\n")}

### Emergency Contacts
- National Emergency: 112
- Flood Helpline: 1078
- Ambulance: 108
- Health Helpline: 104
- Disaster Helpline: 1070
- Insurance (IRDAI): 1800-11-0001
`;

    const prompt = `Generate a personalized monsoon preparedness plan for this Indian household:
Location: ${location}
Family Size: ${familySize || 4} members
Has Children: ${hasChildren || false}
Has Elderly Members: ${hasElderly || false}
Medical Conditions: ${hasMedicalConditions || false}
Home Type: ${homeType || "apartment"}
Has Vehicle: ${hasVehicle || false}
Flood Risk Score: ${floodRiskScore || 58}/100

${factualData}

Create a structured plan with:
1. CRITICAL actions (this week)
2. IMPORTANT actions (this month)
3. ONGOING actions (throughout monsoon)
4. EMERGENCY protocol (if flood warning)

Format: [PRIORITY] Action - Why - Time - Cost in ₹ (labeled as "estimated")
Include the nearest shelter and emergency contacts from the data above.
Do NOT invent specific NDMA guideline numbers. Only reference NDMA in general terms.
All cost figures must be labeled as "estimated" and are approximate Indian market prices.`;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
    const result = await model.generateContent(prompt);

    return NextResponse.json({ plan: result.response.text() });
  } catch (error: unknown) {
    console.error("API /plan error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
