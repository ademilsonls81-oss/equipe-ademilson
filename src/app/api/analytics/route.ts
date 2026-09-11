import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analytics = getAnalytics();
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
