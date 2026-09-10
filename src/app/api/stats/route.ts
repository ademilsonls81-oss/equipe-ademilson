import { NextResponse } from "next/server";
import { getCount, getStats } from "@/lib/db";

export async function GET() {
  try {
    const total = getCount();
    const stats = getStats();
    return NextResponse.json({
      total,
      recent_week: stats.recent_week,
      by_state: stats.by_state,
    });
  } catch {
    return NextResponse.json({ total: 0, recent_week: 0, by_state: [] });
  }
}
