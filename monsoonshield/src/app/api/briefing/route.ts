import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import {
  MOCK_ALERTS,
  MOCK_WEATHER,
  MOCK_FLOOD_PREDICTION,
  RISK_SCORE_FACTORS,
} from "@/lib/mockData";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

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
    const { location, language } = body;

    if (!location || typeof location !== "string" || location.length > 200) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const lang = language === "hi" ? "Hindi" : "English";

    const systemPrompt = `You are Varsha, MonsoonShield's AI monsoon briefing assistant grounded in IMD and NDMA guidelines.

CRITICAL RULES:
- ONLY use the factual data provided below. Do NOT make up any weather numbers, river levels, alert details, or any other data.
- If data is insufficient for a part of the briefing, clearly state what is known and what is uncertain.
- Do NOT invent NDMA guideline numbers or references.
- Be factual, calm, and actionable. Use IMD and NDMA language.
- Do NOT fabricate tomorrow's forecast beyond what the data shows.`;

    const factualData = `
## CURRENT FACTUAL DATA (Use ONLY this data)

### Weather (IMD)
- Temperature: ${MOCK_WEATHER.current.temp}°C (Feels like ${MOCK_WEATHER.current.feelsLike}°C)
- Condition: ${MOCK_WEATHER.current.condition}
- Humidity: ${MOCK_WEATHER.current.humidity}%
- Rainfall (24h): ${MOCK_WEATHER.current.rainfall24h} mm
- Wind Speed: ${MOCK_WEATHER.current.windSpeed} km/h
- Visibility: ${MOCK_WEATHER.current.visibility} km
- IMD Description: ${MOCK_WEATHER.current.description}
- Hourly Forecast: ${MOCK_WEATHER.hourly.map(h => `${h.time}: ${h.temp}°C, ${h.rain}mm rain`).join(" | ")}
- 7-Day Forecast: ${MOCK_WEATHER.forecast.map(f => `${f.day}: ${f.condition}, ${f.high}/${f.low}°C, ${f.rain}% rain`).join(" | ")}

### Active Alerts
${MOCK_ALERTS.map(a => `- [${a.severity.toUpperCase()}] ${a.title} (${a.source})\n  Area: ${a.area}\n  Description: ${a.description}\n  Action Required: ${a.actionRequired}\n  Valid Until: ${a.validUntil}`).join("\n")}

### Flood Prediction (Mula River)
- Danger Threshold: ${MOCK_FLOOD_PREDICTION[0]?.danger ?? 60}%
- Water Level Trend: ${MOCK_FLOOD_PREDICTION.map(p => `${p.time}: ${p.level}%`).join(" | ")}
- Peak: ${Math.max(...MOCK_FLOOD_PREDICTION.map(p => p.level))}% at ${MOCK_FLOOD_PREDICTION.reduce((max, p) => p.level > max.level ? p : max, MOCK_FLOOD_PREDICTION[0]!).time}

### Risk Score Factors
${RISK_SCORE_FACTORS.map(f => `- ${f.label}: ${f.score}/100 (Weight: ${(f.weight*100).toFixed(0)}%)`).join("\n")}
`;

    const prompt = `Generate a concise daily monsoon briefing for a user in ${location}.

${factualData}

Write a 3-4 sentence briefing in ${lang}:
1. Current situation summary (based on actual weather data above)
2. Key risk for today (based on actual alerts and flood prediction above)
3. One action to take (based on actual alert actionRequired)
4. Tomorrow's outlook (based on actual 7-day forecast data above)

Use NDMA/IMD language. Be factual, calm, actionable. ONLY cite data that is provided above.`;

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

    return NextResponse.json({ briefing: result.response.text() });
  } catch (error: unknown) {
    console.error("API /briefing error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
