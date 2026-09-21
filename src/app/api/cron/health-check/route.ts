import { NextRequest, NextResponse } from "next/server";
import { createAgentLog, setAgentConfig } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === CRON_SECRET) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const now = new Date();
    await setAgentConfig("health_check_last_run", now.toISOString());

    // Verificar variáveis de ambiente críticas
    const envChecks: { key: string; ok: boolean; note: string }[] = [
      {
        key: "CRON_SECRET",
        ok: !!process.env.CRON_SECRET,
        note: process.env.CRON_SECRET ? "✅ Configurado" : "❌ Ausente",
      },
      {
        key: "NEXT_PUBLIC_SITE_URL",
        ok: !!process.env.NEXT_PUBLIC_SITE_URL,
        note: process.env.NEXT_PUBLIC_SITE_URL || "❌ Ausente",
      },
      {
        key: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
        ok: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        note: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "❌ Ausente",
      },
      {
        key: "NEXT_PUBLIC_META_PIXEL_ID",
        ok: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
        note: process.env.NEXT_PUBLIC_META_PIXEL_ID || "❌ Ausente",
      },
      {
        key: "ADMIN_PASSWORD",
        ok: !!process.env.ADMIN_PASSWORD,
        note: process.env.ADMIN_PASSWORD ? "✅ Configurado" : "❌ Ausente",
      },
    ];

    const allOk = envChecks.every((c) => c.ok);

    // Verificar se os cron jobs estão definidos corretamente (leitura do vercel.json não é possível em runtime, apenas log)
    const cronSchedule = [
      { path: "/api/cron/daily-content", schedule: "0 11 * * *", description: "Conteúdo diário (08h BRT)" },
      { path: "/api/cron/process-queue", schedule: "*/15 * * * *", description: "Processar fila (a cada 15min)" },
      { path: "/api/cron/weekly-plan", schedule: "0 10 * * 0", description: "Plano semanal (Domingo 07h BRT)" },
      { path: "/api/cron/health-check", schedule: "0 12 * * *", description: "Health check (09h BRT)" },
    ];

    await createAgentLog({
      agent_type: "cron",
      action: "health_check",
      details: `Health check: ${allOk ? "✅ TUDO OK" : "⚠️ ATENÇÃO: algumas variáveis ausentes"}. Verificadas ${envChecks.length} configs.`,
      status: allOk ? "success" : "warning",
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      status: allOk ? "healthy" : "degraded",
      environment: envChecks,
      cron_schedule: cronSchedule,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    await createAgentLog({
      agent_type: "cron",
      action: "health_check",
      details: `Erro no health check: ${error.message}`,
      status: "error",
      error_message: error.message,
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
