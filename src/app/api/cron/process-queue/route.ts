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
  getSocialAccounts,
  checkPlatformDailyLimit,
  isDuplicatePublication,
} from "@/lib/db";
import { decryptToken } from "@/lib/crypto";

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
  const config = await getPlatformConfig(platform);

  if (!config || !config.api_configured) {
    return { success: false, error: `API do ${platform} não configurada. Configure as credenciais em Platform Config.` };
  }

  if (!config.enabled) {
    return { success: false, error: `Plataforma ${platform} está desabilitada.` };
  }

  // Verificar duplicação
  if (item.content_id && await isDuplicatePublication(item.content_id, platform)) {
    return { success: false, error: `Publicação já realizada para este conteúdo na plataforma ${platform}.` };
  }

  const limitCheck = await checkPlatformDailyLimit(platform);
  if (!limitCheck.allowed) {
    return { success: false, error: `Limite diário do ${platform} atingido (${limitCheck.current}/${limitCheck.limit}).` };
  }

  // Ler token da social_accounts (criptografado) e descriptografar
  const accounts = await getSocialAccounts(platform);
  const connectedAccount = accounts.find((a: any) => a.status === "connected" && a.access_token);
  if (!connectedAccount) {
    return { success: false, error: `Nenhuma conta conectada para ${platform}. Conecte uma conta em Conectar Redes.` };
  }
  const accessToken = decryptToken(connectedAccount.access_token);
  const refreshToken = connectedAccount.refresh_token ? decryptToken(connectedAccount.refresh_token) : undefined;

  // Montar config com token descriptografado
  const liveConfig = {
    ...config,
    api_token: accessToken,
    api_secret: refreshToken || config.api_secret,
    api_key: config.api_key,
  };

  try {
    let result: { success: boolean; external_post_id?: string; error?: string };

    switch (platform) {
      case "youtube":
        result = await publishToYouTube(item, liveConfig);
        break;
      case "tiktok":
        result = await publishToTikTok(item, liveConfig);
        break;
      case "instagram":
        result = await publishToInstagram(item, liveConfig);
        break;
      case "facebook":
        result = await publishToFacebook(item, liveConfig);
        break;
      case "pinterest":
        result = await publishToPinterest(item, liveConfig);
        break;
      case "reddit":
        result = await publishToReddit(item, liveConfig);
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
    const caption = `${item.title}\n\n${item.content}\n\n${item.destination_url || ""}`;

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          caption,
          access_token: config.api_token,
        }).toString(),
      }
    );

    if (!containerResponse.ok) {
      const err = await containerResponse.json();
      return { success: false, error: `Instagram API error: ${err.error?.message || containerResponse.statusText}` };
    }

    const containerData = await containerResponse.json();
    const mediaId = containerData.id;

    // Step 2: Publish container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: mediaId,
          access_token: config.api_token,
        }).toString(),
      }
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
    // Buscar páginas do usuário e usar a primeira com Page Token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${config.api_token}`
    );
    const pagesData = await pagesResponse.json();

    let pageId: string;
    let pageToken: string;

    if (pagesResponse.ok && pagesData.data?.length > 0) {
      const page = pagesData.data[0];
      pageId = page.id;
      pageToken = page.access_token;
    } else {
      // Fallback: usar token do usuário (funciona para timelines pessoais)
      pageId = "me";
      pageToken = config.api_token;
    }

    const message = `${item.title}\n\n${item.content}\n\n${item.destination_url || ""}`;
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message,
          access_token: pageToken,
        }).toString(),
      }
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
    const mode = await getAgentMode();
    if (mode.mode === "paused") {
      await createAgentLog({
        agent_type: "cron",
        action: "process_queue",
        details: "Fila pausada — nenhuma publicação processada",
        status: "success",
      });
      return NextResponse.json({ success: true, message: "Queue paused", results: [], duration_ms: Date.now() - startTime });
    }

    await setAgentConfig("cron_last_run", new Date().toISOString());
    const nextRun = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await setAgentConfig("cron_next_run", nextRun);

    const pendingItems = await getPendingPublications();
    const retryItems = await getFailedRetries();
    const allItems = [...pendingItems, ...retryItems];

    const uniqueItems = allItems.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    );

    for (const item of uniqueItems) {
      if (mode.mode === "test") {
        await updatePublicationQueue(item.id, { status: "approved" });
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "approved_for_review",
          message: "Modo teste: item aprovado para revisão manual",
        });
        continue;
      }

      await updatePublicationQueue(item.id, { status: "publishing" });

      const result = await publishToPlatform(item);

      if (result.success) {
        await markAsPublished(item.id, result.external_post_id || "manual");
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "published",
          external_post_id: result.external_post_id,
        });
      } else {
        await markAsFailed(item.id, result.error || "Erro desconhecido");
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "failed",
          error: result.error,
        });
      }
    }

    await createAgentLog({
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
    await createAgentLog({
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
