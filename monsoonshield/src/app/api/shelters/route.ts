import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { location, lat, lng } = body;

    if (!location || typeof location !== "string") {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `You are a disaster shelter database for India. Given a location, provide known emergency shelter information based on your training data.

RULES:
- Only provide shelters that you are confident exist in or near the given location
- Include: name, approximate address, phone if known, capacity estimate, amenities
- If you don't have specific data for the location, say so and recommend calling 1078
- Never fabricate shelter names or addresses
- Include government schools, community halls, and stadiums commonly used as shelters
- Format as JSON array`,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const prompt = `List 3-5 emergency shelters near ${location} (coordinates: ${lat || 18.52}, ${lng || 73.86}).

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Shelter Name",
    "address": "Full address",
    "lat": 0.0,
    "lng": 0.0,
    "capacity": 200,
    "currentOccupancy": 0,
    "contact": "phone or N/A",
    "managedBy": "Authority name",
    "amenities": { "water": true, "food": true, "medical": false },
    "petFriendly": false,
    "wheelchairAccessible": false,
    "womensSection": false
  }
]

If no specific data is available, include a note in the response explaining that the user should call 1078 for shelter information.`;

    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("503") && attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }

    const text = result!.response.text();
    return NextResponse.json({ shelters: text });
  } catch (error: unknown) {
    console.error("API /shelters error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch shelter data" }, { status: 500 });
  }
}
