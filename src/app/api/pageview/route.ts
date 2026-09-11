import { NextRequest, NextResponse } from "next/server";
import { createSession, markSessionClickedWhatsApp } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, landing_page, utm_source, utm_medium, utm_campaign, event } = body;

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    if (event === "whatsapp_click") {
      markSessionClickedWhatsApp(session_id);
      return NextResponse.json({ ok: true });
    }

    createSession({
      session_id,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      user_agent: req.headers.get("user-agent") || undefined,
      referrer: req.headers.get("referer") || undefined,
      landing_page: landing_page || undefined,
      utm_source: utm_source || undefined,
      utm_medium: utm_medium || undefined,
      utm_campaign: utm_campaign || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
