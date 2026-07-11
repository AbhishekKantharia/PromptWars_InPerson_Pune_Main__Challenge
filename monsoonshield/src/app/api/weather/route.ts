import { NextRequest, NextResponse } from "next/server";
import { fetchRealWeather } from "@/lib/realData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "18.52");
    const lng = parseFloat(searchParams.get("lng") || "73.86");

    const weather = await fetchRealWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (error: unknown) {
    console.error("API /weather error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
