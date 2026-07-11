import { NextRequest, NextResponse } from "next/server";
import { fetchRealFloodData } from "@/lib/realData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "18.52");
    const lng = parseFloat(searchParams.get("lng") || "73.86");

    const flood = await fetchRealFloodData(lat, lng);
    return NextResponse.json(flood);
  } catch (error: unknown) {
    console.error("API /flood error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch flood data" }, { status: 500 });
  }
}
