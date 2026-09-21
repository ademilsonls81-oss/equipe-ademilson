import { NextRequest, NextResponse } from "next/server";
import { getCommandCenterData, getAlerts, getEnhancedAlerts, getChannelStatus, toggleChannel, getAcquisitionScore, getAgentRecommendations, getGoalForecast, getAutonomousStatus, toggleAutonomousMode, calculateAcquisitionScore, getContentQueueStats, createAgentLog } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    if (url.searchParams.get("alerts") === "true") {
      return NextResponse.json(await getEnhancedAlerts());
    }
    if (url.searchParams.get("channels") === "true") {
      return NextResponse.json(await getChannelStatus());
    }
    if (url.searchParams.get("score") === "true") {
      return NextResponse.json(await getAcquisitionScore());
    }
    if (url.searchParams.get("recommendations") === "true") {
      return NextResponse.json(await getAgentRecommendations());
    }
    if (url.searchParams.get("forecast") === "true") {
      return NextResponse.json(await getGoalForecast());
    }
    if (url.searchParams.get("autonomous") === "true") {
      return NextResponse.json(await getAutonomousStatus());
    }
    if (url.searchParams.get("queue") === "true") {
      return NextResponse.json(await getContentQueueStats());
    }

    const data = await getCommandCenterData();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "toggle_channel") {
      const { channel, enabled } = body;
      if (!channel) return NextResponse.json({ error: "channel required" }, { status: 400 });
      await toggleChannel(channel, enabled !== false);
      return NextResponse.json({ ok: true, channels: await getChannelStatus() });
    }

    if (action === "toggle_autonomous") {
      const { enabled } = body;
      await toggleAutonomousMode(enabled === true);
      return NextResponse.json({ ok: true, autonomous: await getAutonomousStatus() });
    }

    if (action === "calculate_score") {
      const result = await calculateAcquisitionScore();
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "run_analysis") {
      await createAgentLog({ agent_type: "analysis", action: "manual_analysis", details: "Análise manual executada pelo admin", status: "success" });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
