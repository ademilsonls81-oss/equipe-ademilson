import { NextRequest, NextResponse } from "next/server";
import { getReferralStats, getTopReferrers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const stats = getReferralStats(code);
    if (!stats) {
      return NextResponse.json({ error: "Código não encontrado." }, { status: 404 });
    }
    return NextResponse.json(stats);
  }

  const top = getTopReferrers(10);
  return NextResponse.json({ top });
}
