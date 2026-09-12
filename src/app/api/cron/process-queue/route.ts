import { NextRequest, NextResponse } from "next/server";
import {
  getPendingPublications,
  getFailedRetries,
  updatePublicationQueue,
  markAsPublished,
  markAsFailed,
  getAgentMode,
  getAgentConfig,
  setAgentConfig,
  createAgentLog,
  getPlatformConfig,
  checkPlatformDailyLimit,
} from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === CRON_SECRET) return true;
  return false;
}

async function publishToPlatform(item: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  const platform = item.platform;
  const config = getPlatformConfig(platform);

  if (!config || !config.api_configured) {
    return { success: false, error: `API do ${platform} não configurada. Configure as credenciais em Platform Config.` };
  }

  if (!config.enabled) {
    return { success: false, error: `Plataforma ${platform} está desabilitada.` };
  }

  const limitCheck = checkPlatformDailyLimit(platform);
  if (!limitCheck.allowed) {
    return { success: false, error: `Limite diário do ${platform} atingido (${limitCheck.current}/${limitCheck.limit}).` };
  }

  try {
    let result: { success: boolean; external_post_id?: string; error?: string };

    switch (platform) {
      case "youtube":
        result = await publishToYouTube(item, config);
        break;
      case "tiktok":
        result = await publishToTikTok(item, config);
        break;
      case "instagram":
        result = await publishToInstagram(item, config);
        break;
      case "facebook":
        result = await publishToFacebook(item, config);
        break;
      case "pinterest":
        result = await publishToPinterest(item, config);
        break;
      case "reddit":
        result = await publishToReddit(item, config);
        break;
      default:
        result = { success: false, error: `Plataforma ${platform} não suportada.` };
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Erro desconhecido na publicação" };
  }
}

async function publishToYouTube(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_key) {
    return { success: false, error: "YouTube API key não configurada." };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&key=${config.api_key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.api_token}` },
        body: JSON.stringify({
          snippet: {
            title: item.title,
            description: `${item.content}\n\n${item.destination_url || ""}`,
            tags: ["ia", "videos", "renda", "trabalho"],
            categoryId: "22",
          },
          status: { privacyStatus: "public" },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: `YouTube API error: ${err.error?.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, external_post_id: data.id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no YouTube: ${error.message}` };
  }
}

async function publishToTikTok(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_key || !config.api_token) {
    return { success: false, error: "TikTok API credentials não configuradas." };
  }

  try {
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_token}`,
      },
      body: JSON.stringify({
        post_info: {
          title: item.title,
          description: `${item.content}\n\n${item.destination_url || ""}`,
        },
        source_info: { source: "FILE_UPLOAD" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: `TikTok API error: ${err.error?.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, external_post_id: data.data?.publish_id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no TikTok: ${error.message}` };
  }
}

async function publishToInstagram(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_token) {
    return { success: false, error: "Instagram Graph API token não configurado." };
  }

  try {
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media?caption=${encodeURIComponent(`${item.title}\n\n${item.content}\n\n${item.destination_url || ""}`)}&access_token=${config.api_token}`,
      { method: "POST" }
    );

    if (!containerResponse.ok) {
      const err = await containerResponse.json();
      return { success: false, error: `Instagram API error: ${err.error?.message || containerResponse.statusText}` };
    }

    const containerData = await containerResponse.json();
    const mediaId = containerData.id;

    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media_publish?creation_id=${mediaId}&access_token=${config.api_token}`,
      { method: "POST" }
    );

    if (!publishResponse.ok) {
      const err = await publishResponse.json();
      return { success: false, error: `Instagram publish error: ${err.error?.message || publishResponse.statusText}` };
    }

    const publishData = await publishResponse.json();
    return { success: true, external_post_id: publishData.id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no Instagram: ${error.message}` };
  }
}

async function publishToFacebook(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_token) {
    return { success: false, error: "Facebook Graph API token não configurado." };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/feed?message=${encodeURIComponent(`${item.title}\n\n${item.content}\n\n${item.destination_url || ""}`)}&access_token=${config.api_token}`,
      { method: "POST" }
    );

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: `Facebook API error: ${err.error?.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, external_post_id: data.id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no Facebook: ${error.message}` };
  }
}

async function publishToPinterest(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_token) {
    return { success: false, error: "Pinterest API token não configurado." };
  }

  try {
    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: item.title,
        description: `${item.content}\n\n${item.destination_url || ""}`,
        link: item.destination_url || undefined,
        board_id: config.api_key,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: `Pinterest API error: ${err.error?.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, external_post_id: data.id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no Pinterest: ${error.message}` };
  }
}

async function publishToReddit(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_key || !config.api_secret || !config.api_token) {
    return { success: false, error: "Reddit API credentials não configuradas." };
  }

  try {
    const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.api_key}:${config.api_secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${config.api_token}`,
    });

    if (!tokenResponse.ok) {
      return { success: false, error: "Erro ao autenticar no Reddit." };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const response = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `sr=${config.api_secret}&kind=self&title=${encodeURIComponent(item.title)}&text=${encodeURIComponent(item.content)}`,
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `Reddit API error: ${err}` };
    }

    const data = await response.json();
    return { success: true, external_post_id: data.id };
  } catch (error: any) {
    return { success: false, error: `Erro ao publicar no Reddit: ${error.message}` };
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: any[] = [];

  try {
    const mode = getAgentMode();
    if (mode.mode === "paused") {
      createAgentLog({
        agent_type: "cron",
        action: "process_queue",
        details: "Fila pausada — nenhuma publicação processada",
        status: "success",
      });
      return NextResponse.json({ success: true, message: "Queue paused", results: [], duration_ms: Date.now() - startTime });
    }

    setAgentConfig("cron_last_run", new Date().toISOString());
    const nextRun = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    setAgentConfig("cron_next_run", nextRun);

    const pendingItems = getPendingPublications();
    const retryItems = getFailedRetries();
    const allItems = [...pendingItems, ...retryItems];

    const uniqueItems = allItems.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );

    for (const item of uniqueItems) {
      if (mode.mode === "test") {
        updatePublicationQueue(item.id, { status: "approved" });
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "approved_for_review",
          message: "Modo teste: item aprovado para revisão manual",
        });
        continue;
      }

      updatePublicationQueue(item.id, { status: "publishing" });

      const result = await publishToPlatform(item);

      if (result.success) {
        markAsPublished(item.id, result.external_post_id || "manual");
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "published",
          external_post_id: result.external_post_id,
        });
      } else {
        markAsFailed(item.id, result.error || "Erro desconhecido");
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "failed",
          error: result.error,
        });
      }
    }

    createAgentLog({
      agent_type: "cron",
      action: "process_queue",
      details: `Processados ${results.length} itens: ${results.filter(r => r.action === "published").length} publicados, ${results.filter(r => r.action === "failed").length} falhas, ${results.filter(r => r.action === "approved_for_review").length} aguardando revisão`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      published: results.filter(r => r.action === "published").length,
      failed: results.filter(r => r.action === "failed").length,
      review: results.filter(r => r.action === "approved_for_review").length,
      results,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    createAgentLog({
      agent_type: "cron",
      action: "process_queue",
      details: `Erro no processamento: ${error.message}`,
      status: "error",
      error_message: error.message,
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
