import { NextRequest, NextResponse } from "next/server";
import { createReferralTracking, markReferralConverted, getReferralStatsAdvanced } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = getReferralStatsAdvanced();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "track") {
      const { referrer_uid, referral_code, link_used, utm_source, utm_medium, utm_campaign, platform, share_text, ab_test_id, visitor_session_id } = body;
      if (!referrer_uid || !referral_code) {
        return NextResponse.json({ error: "referrer_uid and referral_code required" }, { status: 400 });
      }
      createReferralTracking({ referrer_uid, referral_code, link_used, utm_source, utm_medium, utm_campaign, platform, share_text, ab_test_id, visitor_session_id });
      return NextResponse.json({ ok: true });
    }

    if (action === "convert") {
      const { visitor_session_id, converted_uid } = body;
      if (!visitor_session_id || !converted_uid) {
        return NextResponse.json({ error: "visitor_session_id and converted_uid required" }, { status: 400 });
      }
      markReferralConverted(visitor_session_id, converted_uid);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
