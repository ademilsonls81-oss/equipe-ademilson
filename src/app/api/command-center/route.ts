import { NextResponse } from "next/server";
import { getCommandCenterData, getAlerts, getChannelStatus, toggleChannel } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    if (url.searchParams.get("alerts") === "true") {
      const alerts = getAlerts();
      return NextResponse.json(alerts);
    }

    if (url.searchParams.get("channels") === "true") {
      const channels = getChannelStatus();
      return NextResponse.json(channels);
    }

    const data = getCommandCenterData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { channel, enabled } = body;

    if (!channel) {
      return NextResponse.json({ error: "channel required" }, { status: 400 });
    }

    toggleChannel(channel, enabled !== false);
    const channels = getChannelStatus();
    return NextResponse.json({ ok: true, channels });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
