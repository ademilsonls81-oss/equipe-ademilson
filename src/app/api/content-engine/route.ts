import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import {
  createTopic, getTopics, updateTopicStatus,
  createDraft, getDrafts, updateDraft, getDraftStats,
  scheduleContent, getSchedule, getContentEngineDashboard,
  generateContentForTopic, setPlatformLimit,
  createAgentLog, getAgentConfig, setAgentConfig,
  calculateWeightedScore, getLearningInsights, getAgentMode, setAgentMode, setMinDataThreshold,
} from "@/lib/db";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    if (url.searchParams.get("dashboard") === "true") {
      return NextResponse.json(getContentEngineDashboard());
    }
    if (url.searchParams.get("topics") === "true") {
      const status = url.searchParams.get("status") || undefined;
      return NextResponse.json(getTopics(status));
    }
    if (url.searchParams.get("drafts") === "true") {
      const platform = url.searchParams.get("platform") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      return NextResponse.json(getDrafts({ platform, status, limit }));
    }
    if (url.searchParams.get("schedule") === "true") {
      return NextResponse.json(getSchedule());
    }
    if (url.searchParams.get("stats") === "true") {
      return NextResponse.json(getDraftStats());
    }
    if (url.searchParams.get("agent") === "true") {
      return NextResponse.json({
        ...getAgentMode(),
        enabled: getAgentConfig("content_agent_enabled") !== "false",
        lastRun: getAgentConfig("content_agent_last_run"),
        nextRun: getAgentConfig("content_agent_next_run"),
      });
    }
    if (url.searchParams.get("learning") === "true") {
      return NextResponse.json(getLearningInsights());
    }
    if (url.searchParams.get("score") === "true") {
      return NextResponse.json(calculateWeightedScore());
    }
    if (url.searchParams.get("mode") === "true") {
      return NextResponse.json(getAgentMode());
    }

    return NextResponse.json(getContentEngineDashboard());
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "add_topic") {
      const { title, description, category, relevance, traffic_potential, conversion_potential, priority, tags } = body;
      if (!title || !category) return NextResponse.json({ error: "title and category required" }, { status: 400 });
      const topicId = "TOP" + Date.now().toString(36).toUpperCase();
      createTopic({ topic_id: topicId, title, description, category, relevance, traffic_potential, conversion_potential, priority, tags });
      createAgentLog({ agent_type: "content_engine", action: "add_topic", details: `Topic "${title}" added`, status: "success" });
      return NextResponse.json({ ok: true, topic_id: topicId });
    }

    if (action === "update_topic_status") {
      const { topic_id, status } = body;
      if (!topic_id || !status) return NextResponse.json({ error: "topic_id and status required" }, { status: 400 });
      updateTopicStatus(topic_id, status);
      return NextResponse.json({ ok: true });
    }

    if (action === "generate_content") {
      const { topic_id, platform } = body;
      if (!topic_id || !platform) return NextResponse.json({ error: "topic_id and platform required" }, { status: 400 });
      const draftId = generateContentForTopic(topic_id, platform);
      if (!draftId) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      createAgentLog({ agent_type: "content_engine", action: "generate_content", details: `Generated ${platform} content for topic ${topic_id}`, status: "success" });
      return NextResponse.json({ ok: true, draft_id: draftId });
    }

    if (action === "update_draft") {
      const { draft_id, ...data } = body;
      if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });
      updateDraft(draft_id, data);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const { draft_id } = body;
      if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });
      updateDraft(draft_id, { status: "aprovado" });
      createAgentLog({ agent_type: "content_engine", action: "approve", details: `Draft ${draft_id} approved`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "schedule") {
      const { draft_id, scheduled_for } = body;
      if (!draft_id || !scheduled_for) return NextResponse.json({ error: "draft_id and scheduled_for required" }, { status: 400 });
      const scheduleId = scheduleContent(draft_id, scheduled_for);
      if (!scheduleId) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      createAgentLog({ agent_type: "content_engine", action: "schedule", details: `Draft ${draft_id} scheduled for ${scheduled_for}`, status: "success" });
      return NextResponse.json({ ok: true, schedule_id: scheduleId });
    }

    if (action === "set_platform_limit") {
      const { platform, daily_limit } = body;
      if (!platform || !daily_limit) return NextResponse.json({ error: "platform and daily_limit required" }, { status: 400 });
      setPlatformLimit(platform, daily_limit);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_agent") {
      const current = getAgentConfig("content_agent_enabled");
      const newValue = current === "false" ? "true" : "false";
      setAgentConfig("content_agent_enabled", newValue);
      createAgentLog({ agent_type: "content_engine", action: "toggle_agent", details: `Content agent ${newValue === "true" ? "enabled" : "disabled"}`, status: "success" });
      return NextResponse.json({ ok: true, enabled: newValue === "true" });
    }

    if (action === "toggle_pause") {
      const current = getAgentConfig("acquisition_paused");
      const newValue = current === "true" ? "false" : "true";
      setAgentConfig("acquisition_paused", newValue);
      createAgentLog({ agent_type: "content_engine", action: "toggle_pause", details: `Acquisition ${newValue === "true" ? "paused" : "resumed"}`, status: "success" });
      return NextResponse.json({ ok: true, paused: newValue === "true" });
    }

    if (action === "seed_topics") {
      const topics = [
        { title: "Gravação de vídeos para IA", category: "ia", relevance: 90, traffic_potential: 85, conversion_potential: 80, priority: 95 },
        { title: "Treinamento de inteligência artificial", category: "ia", relevance: 85, traffic_potential: 80, conversion_potential: 75, priority: 85 },
        { title: "Trabalhos relacionados à IA", category: "trabalho", relevance: 90, traffic_potential: 90, conversion_potential: 85, priority: 90 },
        { title: "Oportunidades de trabalho online", category: "oportunidade", relevance: 95, traffic_potential: 95, conversion_potential: 90, priority: 95 },
        { title: "Renda complementar pelo celular", category: "renda", relevance: 90, traffic_potential: 90, conversion_potential: 85, priority: 90 },
        { title: "Trabalhos que pagam por vídeo", category: "renda", relevance: 85, traffic_potential: 85, conversion_potential: 80, priority: 85 },
        { title: "Como ganhar dinheiro com IA", category: "renda", relevance: 90, traffic_potential: 95, conversion_potential: 85, priority: 90 },
        { title: "Oportunidades para brasileiros", category: "oportunidade", relevance: 85, traffic_potential: 85, conversion_potential: 80, priority: 85 },
        { title: "Criação de conteúdo para redes sociais", category: "conteudo", relevance: 80, traffic_potential: 80, conversion_potential: 75, priority: 80 },
        { title: "Como trabalhar de casa", category: "trabalho", relevance: 85, traffic_potential: 90, conversion_potential: 85, priority: 85 },
        { title: "Emprego remoto 2026", category: "trabalho", relevance: 80, traffic_potential: 85, conversion_potential: 80, priority: 80 },
        { title: "Dinheiro extra no celular", category: "renda", relevance: 90, traffic_potential: 90, conversion_potential: 85, priority: 90 },
      ];
      let created = 0;
      topics.forEach(t => {
        const topicId = "TOP" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
        createTopic({ topic_id: topicId, ...t });
        created++;
      });
      createAgentLog({ agent_type: "content_engine", action: "seed_topics", details: `${created} topics seeded`, status: "success" });
      return NextResponse.json({ ok: true, created });
    }

    if (action === "set_mode") {
      const { mode } = body;
      if (!mode || !["test", "autonomous", "paused"].includes(mode)) {
        return NextResponse.json({ error: "mode must be 'test', 'autonomous', or 'paused'" }, { status: 400 });
      }
      if (mode === "autonomous") {
        const score = calculateWeightedScore();
        if (!score.hasEnoughData) {
          return NextResponse.json({ error: "Dados insuficientes para modo autônomo. Continúe em modo teste.", hasEnoughData: false }, { status: 400 });
        }
      }
      setAgentMode(mode);
      return NextResponse.json({ ok: true, mode });
    }

    if (action === "set_min_data") {
      const { threshold } = body;
      if (!threshold || typeof threshold !== "number" || threshold < 1) {
        return NextResponse.json({ error: "threshold must be a positive number" }, { status: 400 });
      }
      setMinDataThreshold(threshold);
      return NextResponse.json({ ok: true, threshold });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
