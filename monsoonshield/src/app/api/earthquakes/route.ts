import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyEarthquakes } from "@/lib/realData";

interface CacheEntry { data: unknown; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "18.52");
    const lng = parseFloat(searchParams.get("lng") || "73.86");

    const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    const earthquakes = await fetchNearbyEarthquakes(lat, lng);
    cache.set(key, { data: earthquakes, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(earthquakes);
  } catch (error: unknown) {
    console.error("API /earthquakes error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch earthquake data" }, { status: 500 });
  }
}
