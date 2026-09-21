import { NextRequest, NextResponse } from "next/server";
import { getReferralStats, getTopReferrers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const stats = await getReferralStats(code);
    if (!stats) {
      return NextResponse.json({ error: "Código não encontrado." }, { status: 404 });
    }
    // Retornar apenas dados seguros (sem PII)
    return NextResponse.json({
      my_referral_code: stats.my_referral_code,
      referrals_count: stats.referrals_count,
    });
  }

  const top = await getTopReferrers(10);
  return NextResponse.json({ top });
}
