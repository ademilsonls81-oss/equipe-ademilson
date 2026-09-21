import { NextRequest, NextResponse } from "next/server";
import { createAgentLog, getAgentLogs, getAgentConfig, setAgentConfig } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  try {
    if (url.searchParams.get("config") === "true") {
      const config = {
        enabled: (await getAgentConfig("agent_enabled")) !== "false",
        lastAnalysis: await getAgentConfig("last_analysis"),
        lastGeneration: await getAgentConfig("last_generation"),
      };
      return NextResponse.json(config);
    }
    const logs = await getAgentLogs(limit);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "log") {
      const { agent_type, action: logAction, details, status, error_message } = body;
      await createAgentLog({ agent_type, action: logAction, details, status, error_message });
      return NextResponse.json({ ok: true });
    }

    if (action === "config") {
      const { key, value } = body;
      await setAgentConfig(key, value);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle") {
      const current = await getAgentConfig("agent_enabled");
      const newValue = current === "false" ? "true" : "false";
      await setAgentConfig("agent_enabled", newValue);
      await createAgentLog({
        agent_type: "system",
        action: "toggle_agent",
        details: `Agent ${newValue === "true" ? "enabled" : "disabled"}`,
      });
      return NextResponse.json({ ok: true, enabled: newValue === "true" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
