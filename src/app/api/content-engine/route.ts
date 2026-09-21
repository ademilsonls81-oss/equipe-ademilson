import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import {
  createTopic, getTopics, updateTopicStatus,
  createDraft, getDrafts, updateDraft, getDraftStats,
  scheduleContent, getSchedule, getContentEngineDashboard,
  generateContentForTopic, setPlatformLimit,
  createAgentLog, getAgentConfig, setAgentConfig,
  calculateWeightedScore, getLearningInsights, getAgentMode, setAgentMode, setMinDataThreshold,
  getCampaignContents, getCampaignStats, updateCampaignContent, seedPrimeiraCampanha,
  getPublicationQueue, getPublicationQueueStats, addToPublicationQueue, updatePublicationQueue,
  getAutomationStatus, getAllPlatformConfigs, upsertPlatformConfig, seedPlatformConfigs,
  getPlatformConfig, deletePublicationQueueItem,
} from "@/lib/db";

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    if (url.searchParams.get("dashboard") === "true") {
      return NextResponse.json(await getContentEngineDashboard());
    }
    if (url.searchParams.get("topics") === "true") {
      const status = url.searchParams.get("status") || undefined;
      return NextResponse.json(await getTopics(status));
    }
    if (url.searchParams.get("drafts") === "true") {
      const platform = url.searchParams.get("platform") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      return NextResponse.json(await getDrafts({ platform, status, limit }));
    }
    if (url.searchParams.get("schedule") === "true") {
      return NextResponse.json(await getSchedule());
    }
    if (url.searchParams.get("stats") === "true") {
      return NextResponse.json(await getDraftStats());
    }
    if (url.searchParams.get("agent") === "true") {
      return NextResponse.json({
        ...(await getAgentMode()),
        enabled: (await getAgentConfig("content_agent_enabled")) !== "false",
        lastRun: await getAgentConfig("content_agent_last_run"),
        nextRun: await getAgentConfig("content_agent_next_run"),
      });
    }
    if (url.searchParams.get("learning") === "true") {
      return NextResponse.json(await getLearningInsights());
    }
    if (url.searchParams.get("learning_full") === "true") {
      const insights = await getLearningInsights();
      return NextResponse.json(insights);
    }
    if (url.searchParams.get("score") === "true") {
      return NextResponse.json(await calculateWeightedScore());
    }
    if (url.searchParams.get("mode") === "true") {
      return NextResponse.json(await getAgentMode());
    }
    if (url.searchParams.get("campaign") === "true") {
      const campaignId = url.searchParams.get("campaign_id") || "primeiro-100-membros";
      const contents = await getCampaignContents(campaignId);
      const stats = await getCampaignStats(campaignId);
      return NextResponse.json({ contents, stats });
    }
    if (url.searchParams.get("queue") === "true") {
      const status = url.searchParams.get("status") || undefined;
      const platform = url.searchParams.get("platform") || undefined;
      const campaignId = url.searchParams.get("campaign_id") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const items = await getPublicationQueue({ status, platform, campaign_id: campaignId, limit, offset });
      const stats = await getPublicationQueueStats();
      return NextResponse.json({ items, stats });
    }
    if (url.searchParams.get("automation") === "true") {
      return NextResponse.json(await getAutomationStatus());
    }
    if (url.searchParams.get("platforms") === "true") {
      await seedPlatformConfigs();
      const configs = await getAllPlatformConfigs();
      return NextResponse.json(configs);
    }

    return NextResponse.json(await getContentEngineDashboard());
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
      await createTopic({ topic_id: topicId, title, description, category, relevance, traffic_potential, conversion_potential, priority, tags });
      await createAgentLog({ agent_type: "content_engine", action: "add_topic", details: `Topic "${title}" added`, status: "success" });
      return NextResponse.json({ ok: true, topic_id: topicId });
    }

    if (action === "update_topic_status") {
      const { topic_id, status } = body;
      if (!topic_id || !status) return NextResponse.json({ error: "topic_id and status required" }, { status: 400 });
      await updateTopicStatus(topic_id, status);
      return NextResponse.json({ ok: true });
    }

    if (action === "generate_content") {
      const { topic_id, platform } = body;
      if (!topic_id || !platform) return NextResponse.json({ error: "topic_id and platform required" }, { status: 400 });
      const draftId = await generateContentForTopic(topic_id, platform);
      if (!draftId) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      await createAgentLog({ agent_type: "content_engine", action: "generate_content", details: `Generated ${platform} content for topic ${topic_id}`, status: "success" });
      return NextResponse.json({ ok: true, draft_id: draftId });
    }

    if (action === "update_draft") {
      const { draft_id, ...data } = body;
      if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });
      await updateDraft(draft_id, data);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const { draft_id } = body;
      if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });
      await updateDraft(draft_id, { status: "aprovado" });
      await createAgentLog({ agent_type: "content_engine", action: "approve", details: `Draft ${draft_id} approved`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "schedule") {
      const { draft_id, scheduled_for } = body;
      if (!draft_id || !scheduled_for) return NextResponse.json({ error: "draft_id and scheduled_for required" }, { status: 400 });
      const scheduleId = await scheduleContent(draft_id, scheduled_for);
      if (!scheduleId) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      await createAgentLog({ agent_type: "content_engine", action: "schedule", details: `Draft ${draft_id} scheduled for ${scheduled_for}`, status: "success" });
      return NextResponse.json({ ok: true, schedule_id: scheduleId });
    }

    if (action === "set_platform_limit") {
      const { platform, daily_limit } = body;
      if (!platform || !daily_limit) return NextResponse.json({ error: "platform and daily_limit required" }, { status: 400 });
      await setPlatformLimit(platform, daily_limit);
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_agent") {
      const current = await getAgentConfig("content_agent_enabled");
      const newValue = current === "false" ? "true" : "false";
      await setAgentConfig("content_agent_enabled", newValue);
      await createAgentLog({ agent_type: "content_engine", action: "toggle_agent", details: `Content agent ${newValue === "true" ? "enabled" : "disabled"}`, status: "success" });
      return NextResponse.json({ ok: true, enabled: newValue === "true" });
    }

    if (action === "toggle_pause") {
      const current = await getAgentConfig("acquisition_paused");
      const newValue = current === "true" ? "false" : "true";
      await setAgentConfig("acquisition_paused", newValue);
      await createAgentLog({ agent_type: "content_engine", action: "toggle_pause", details: `Acquisition ${newValue === "true" ? "paused" : "resumed"}`, status: "success" });
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
      for (const t of topics) {
        const topicId = "TOP" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
        await createTopic({ topic_id: topicId, ...t });
        created++;
      }
      await createAgentLog({ agent_type: "content_engine", action: "seed_topics", details: `${created} topics seeded`, status: "success" });
      return NextResponse.json({ ok: true, created });
    }

    if (action === "set_mode") {
      const { mode } = body;
      if (!mode || !["test", "autonomous", "paused"].includes(mode)) {
        return NextResponse.json({ error: "mode must be 'test', 'autonomous', or 'paused'" }, { status: 400 });
      }
      if (mode === "autonomous") {
        const score = await calculateWeightedScore();
        if (!score.hasEnoughData) {
          return NextResponse.json({ error: "Dados insuficientes para modo autônomo. Continúe em modo teste.", hasEnoughData: false }, { status: 400 });
        }
      }
      await setAgentMode(mode);
      return NextResponse.json({ ok: true, mode });
    }

    if (action === "set_min_data") {
      const { threshold } = body;
      if (!threshold || typeof threshold !== "number" || threshold < 1) {
        return NextResponse.json({ error: "threshold must be a positive number" }, { status: 400 });
      }
      await setMinDataThreshold(threshold);
      return NextResponse.json({ ok: true, threshold });
    }

    if (action === "seed_campaign") {
      const result = await seedPrimeiraCampanha();
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "update_campaign_content") {
      const { campaign_id, content_index, platform, ...data } = body;
      if (!campaign_id || content_index === undefined || !platform) {
        return NextResponse.json({ error: "campaign_id, content_index, and platform required" }, { status: 400 });
      }
      await updateCampaignContent(campaign_id, content_index, platform, data);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_to_queue") {
      const { campaign_id, content_id, platform, title, content, media_url, destination_url, utm_source, utm_medium, utm_campaign, utm_content, scheduled_at } = body;
      if (!campaign_id || !content_id || !platform || !title || !content || !scheduled_at) {
        return NextResponse.json({ error: "campaign_id, content_id, platform, title, content, and scheduled_at required" }, { status: 400 });
      }
      const item = await addToPublicationQueue({
        campaign_id, content_id, platform, title, content,
        media_url, destination_url, utm_source, utm_medium, utm_campaign, utm_content,
        scheduled_at, status: "draft",
      });
      await createAgentLog({ agent_type: "content_engine", action: "add_to_queue", details: `Content "${title}" added to queue for ${platform}`, status: "success" });
      return NextResponse.json({ ok: true, item });
    }

    if (action === "approve_queue_item") {
      const { item_id } = body;
      if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
      await updatePublicationQueue(item_id, { status: "approved" });
      await createAgentLog({ agent_type: "content_engine", action: "approve_queue_item", details: `Queue item ${item_id} approved`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "schedule_queue_item") {
      const { item_id, scheduled_at } = body;
      if (!item_id || !scheduled_at) return NextResponse.json({ error: "item_id and scheduled_at required" }, { status: 400 });
      await updatePublicationQueue(item_id, { status: "scheduled", scheduled_at });
      await createAgentLog({ agent_type: "content_engine", action: "schedule_queue_item", details: `Queue item ${item_id} scheduled for ${scheduled_at}`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "cancel_queue_item") {
      const { item_id } = body;
      if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
      await updatePublicationQueue(item_id, { status: "paused" });
      await createAgentLog({ agent_type: "content_engine", action: "cancel_queue_item", details: `Queue item ${item_id} cancelled`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_queue_item") {
      const { item_id } = body;
      if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
      await deletePublicationQueueItem(item_id);
      await createAgentLog({ agent_type: "content_engine", action: "delete_queue_item", details: `Queue item ${item_id} deleted`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "bulk_add_to_queue") {
      const { campaign_id, items: queueItems } = body;
      if (!campaign_id || !queueItems || !Array.isArray(queueItems)) {
        return NextResponse.json({ error: "campaign_id and items array required" }, { status: 400 });
      }
      let added = 0;
      for (const item of queueItems) {
        await addToPublicationQueue({
          campaign_id,
          content_id: item.content_id || `${campaign_id}-${item.platform}-${item.title?.substring(0, 20)}`,
          platform: item.platform,
          title: item.title,
          content: item.content,
          media_url: item.media_url,
          destination_url: item.destination_url,
          utm_source: item.utm_source,
          utm_medium: item.utm_medium,
          utm_campaign: item.utm_campaign,
          utm_content: item.utm_content,
          scheduled_at: item.scheduled_at || new Date().toISOString(),
          status: item.status || "draft",
        });
        added++;
      }
      await createAgentLog({ agent_type: "content_engine", action: "bulk_add_to_queue", details: `${added} items added to queue for campaign ${campaign_id}`, status: "success" });
      return NextResponse.json({ ok: true, added });
    }

    if (action === "update_platform_config") {
      const { platform, api_configured, api_token, api_secret, api_key, daily_limit, enabled } = body;
      if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
      await upsertPlatformConfig(platform, { api_configured, api_token, api_secret, api_key, daily_limit, enabled });
      await createAgentLog({ agent_type: "content_engine", action: "update_platform_config", details: `Platform ${platform} config updated`, status: "success" });
      return NextResponse.json({ ok: true });
    }

    if (action === "seed_platforms") {
      await seedPlatformConfigs();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
