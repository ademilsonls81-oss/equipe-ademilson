import { NextRequest, NextResponse } from "next/server";
import { getAllRegistrations, getStats } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Basic realm=\"Admin\"" } });
  }
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;
  const registrations = getAllRegistrations(limit, offset);
  const stats = getStats();
  return NextResponse.json({ registrations, stats, page, limit });
}