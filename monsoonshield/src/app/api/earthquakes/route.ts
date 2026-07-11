import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEarthquakes } from "@/lib/realData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "18.52");
    const lng = parseFloat(searchParams.get("lng") || "73.86");

    const earthquakes = await fetchNearbyEarthquakes(lat, lng);
    return NextResponse.json(earthquakes);
  } catch (error: unknown) {
    console.error("API /earthquakes error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch earthquake data" }, { status: 500 });
  }
}
