import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const prompt = `Generate a personalized monsoon preparedness plan for this Indian household:
Location: ${location}
Family Size: ${familySize || 4} members
Has Children: ${hasChildren || false}
Has Elderly Members: ${hasElderly || false}
Medical Conditions: ${hasMedicalConditions || false}
Home Type: ${homeType || "apartment"}
Has Vehicle: ${hasVehicle || false}
Flood Risk Score: ${floodRiskScore || 58}/100

Create a structured plan with:
1. CRITICAL actions (this week)
2. IMPORTANT actions (this month)
3. ONGOING actions (throughout monsoon)
4. EMERGENCY protocol (if flood warning)

Format: [PRIORITY] Action - Why - Time - Cost in ₹
Cite NDMA guidelines. Be specific to their situation.`;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);

    return NextResponse.json({ plan: result.response.text() });
  } catch (error: unknown) {
    console.error("API /plan error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
