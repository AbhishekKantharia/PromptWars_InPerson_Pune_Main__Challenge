import { NextResponse } from "next/server";
import { fetchRealAlerts } from "@/lib/realData";

interface CacheEntry { data: unknown; expiresAt: number; }
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — alerts update slowly

export async function GET() {
  try {
    if (cache && Date.now() < cache.expiresAt) {
      return NextResponse.json(cache.data);
    }

    const alerts = await fetchRealAlerts();
    cache = { data: alerts, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(alerts);
  } catch (error: unknown) {
    console.error("API /alerts error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
