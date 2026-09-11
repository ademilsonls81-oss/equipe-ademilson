import { NextRequest, NextResponse } from "next/server";
import { createContentPerformance, updateContentPerformance, getContentPerformance, getContentStats } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "100");

  try {
    if (url.searchParams.get("stats") === "true") {
      const stats = getContentStats();
      return NextResponse.json(stats);
    }
    const content = getContentPerformance({ platform, status, limit });
    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { content_id, title, platform, content_type, theme, keywords, utm_source, utm_medium, utm_campaign, url } = body;
      if (!content_id || !title || !platform || !content_type) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      createContentPerformance({ content_id, title, platform, content_type, theme, keywords, utm_source, utm_medium, utm_campaign, url });
      return NextResponse.json({ ok: true });
    }

    if (action === "update") {
      const { content_id, sessions, registrations, whatsapp_clicks, whatsapp_joins, referrals, score, status } = body;
      if (!content_id) {
        return NextResponse.json({ error: "content_id required" }, { status: 400 });
      }
      updateContentPerformance(content_id, { sessions, registrations, whatsapp_clicks, whatsapp_joins, referrals, score, status });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
