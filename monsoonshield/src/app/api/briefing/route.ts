import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { location, riskScore, weather, alerts, language } = body;

    if (!location || typeof location !== "string" || location.length > 200) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const lang = language === "hi" ? "Hindi" : "English";

    const prompt = `Generate a concise daily monsoon briefing for a user in ${location}.

Current conditions:
- Risk Score: ${riskScore || 58}/100
- Weather: ${weather || "Heavy Rain, 24°C"}
- Active Alerts: ${Array.isArray(alerts) ? alerts.slice(0, 5).join(", ") : "None"}

Write a 3-4 sentence briefing in ${lang}:
1. Current situation summary
2. Key risk for today
3. One action to take
4. Tomorrow's outlook

Use NDMA/IMD language. Be factual, calm, actionable.`;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);

    return NextResponse.json({ briefing: result.response.text() });
  } catch (error: any) {
    console.error("API /briefing error:", error?.message);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
