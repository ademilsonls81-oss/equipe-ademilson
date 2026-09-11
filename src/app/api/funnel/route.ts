import { NextResponse } from "next/server";
import { getFunnelStats } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = getFunnelStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch funnel stats" }, { status: 500 });
  }
}
