import { NextRequest, NextResponse } from "next/server";
import { fetchRealFloodData } from "@/lib/realData";

interface CacheEntry { data: unknown; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — flood data changes slowly

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

    const flood = await fetchRealFloodData(lat, lng);
    cache.set(key, { data: flood, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(flood);
  } catch (error: unknown) {
    console.error("API /flood error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch flood data" }, { status: 500 });
  }
}
