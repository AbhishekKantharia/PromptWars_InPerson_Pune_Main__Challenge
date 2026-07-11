import { NextResponse } from "next/server";
import { fetchRealAlerts } from "@/lib/realData";

export async function GET() {
  try {
    const alerts = await fetchRealAlerts();
    return NextResponse.json(alerts);
  } catch (error: unknown) {
    console.error("API /alerts error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
