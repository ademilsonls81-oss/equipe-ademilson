import { NextRequest, NextResponse } from "next/server";
import {
  getPendingPublications,
  getFailedRetries,
  updatePublicationQueue,
  markAsPublished,
  markAsFailed,
  resetStalePublishing,
  getAgentMode,
  getAgentConfig,
  setAgentConfig,
  createAgentLog,
  getPlatformConfig,
  getSocialAccounts,
  updateSocialAccount,
  checkPlatformDailyLimit,
  isDuplicatePublication,
  getLastPublishedAt,
} from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";

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
      case "google":
        result = await publishToGoogleBusiness(item, liveConfig);
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

// Imagem das publicações com mídia: usa media_url do item ou gera PNG via /social-image
function buildSocialImage(item: any): string {
  if (item.media_url) return item.media_url;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";
  return `${siteUrl}/social-image?title=${encodeURIComponent(String(item.title || "").slice(0, 90))}&text=${encodeURIComponent(
    String(item.content || "").replace(/\s+/g, " ").slice(0, 140)
  )}`;
}

// Token usado na Graph API do Instagram: prefere o usuário Facebook (escopos
// instagram_basic + instagram_content_publish); usa o token IGA como fallback.
async function getInstagramAccessToken(): Promise<string | null> {
  try {
    const fbAccounts = await getSocialAccounts("facebook");
    const fb = fbAccounts.find((a: any) => a && a.status === "connected" && a.access_token);
    if (fb) return decryptToken(fb.access_token);
    const igAccounts = await getSocialAccounts("instagram");
    const ig = igAccounts.find((a: any) => a && a.status === "connected" && a.access_token);
    if (ig) return decryptToken(ig.access_token);
  } catch {
    // ignora — retorna null abaixo
  }
  return null;
}

async function publishToInstagram(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  // A Graph API do Instagram (graph.facebook.com) exige token de usuário Facebook
  // com instagram_basic + instagram_content_publish e conta IG vinculada a uma
  // Página. O token IGA vendo do OAuth direto do Instagram não é aceito aqui.
  const accessToken = (await getInstagramAccessToken()) || config.api_token;
  if (!accessToken) {
    return { success: false, error: "Nenhum token disponível para Instagram. Conecte Facebook ou Instagram em Conectar Redes." };
  }

  try {
    // Limite de caption do Instagram: 2200 caracteres
    const caption = `${item.title}\n\n${item.content}\n\n${item.destination_url || ""}`.slice(0, 2200);

    // Alvo da publicação: o ID da conta profissional do Instagram conectada.
    // Com token de usuário Facebook, "/me" resolve para o usuário FB (não a IG).
    const igAccounts = await getSocialAccounts("instagram");
    const igConnected = igAccounts.find((a: any) => a && a.status === "connected" && a.account_id);
    const target = igConnected?.account_id || "me";

    // A Graph API exige imagem raster (JPEG/PNG) publicamente acessível.
    const imageUrl = buildSocialImage(item);

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/${target}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          caption,
          image_url: imageUrl,
          access_token: accessToken,
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
      `https://graph.facebook.com/v19.0/${target}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: mediaId,
          access_token: accessToken,
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
      // Sem Página vinculada ao app: postar na timeline pessoal exige permissões
      // extras e normalmente falha com erro #200. Falha rápida com instrução clara.
      const fbError = pagesData?.error?.message;
      return {
        success: false,
        error: `Nenhuma Página do Facebook está visível para o app (${fbError || "/me/accounts vazio"}). ` +
          `No Developer Console do app, adicione a Página "Equipe Ademilson" em Configurações → Básico → ` +
          `Ativos de Negócio (ou vincule a Página ao app) e reconecte a conta em Conectar Redes.`,
      };
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

// Reddit — usa o access token salvo pelo OAuth (o código antigo tratava o token
// como se fosse um "authorization code" e usava o client secret como nome do
// subreddit, o que nunca poderia funcionar).
// ==================== Google Business Profile ====================
// Publica "Atualizações" no Perfil da Empresa (Busca/Mapa do Google).
// Regras exigidas: só empresas onde a conta autenticada é OWNER/CO-OWNER/MANAGER,
// rate limiting (intervalo mínimo + limite diário), validação de conteúdo e
// OAuth 2.0 com renovação automática de access token (expira em 1h).

const GOOGLE_ALLOWED_ROLES = ["OWNER", "CO_OWNER", "MANAGER"];
const GBP_ACCOUNTS_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const GBP_LOCATIONS_URL = "https://mybusinessbusinessinformation.googleapis.com/v1/locations";
const GBP_POSTS_BASE = "https://mybusiness.googleapis.com/v4";

// Renova o access token Google via refresh token salvo no OAuth (dura 1h).
async function refreshGoogleToken(config: any): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !config.api_secret) return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.api_secret,
        grant_type: "refresh_token",
      }).toString(),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !d?.access_token) return null;
    // Persiste o token renovado para as próximas execuções
    try {
      const accounts = await getSocialAccounts("google");
      const account = accounts.find((a: any) => a && a.status === "connected");
      if (account) {
        await updateSocialAccount(account.id, {
          access_token: encryptToken(d.access_token),
          expires_at: d.expires_in ? new Date(Date.now() + d.expires_in * 1000).toISOString() : undefined,
        });
      }
    } catch {
      // persistência é best-effort
    }
    return d.access_token;
  } catch {
    return null;
  }
}

// Valida o conteúdo antes de enviar ao Google (política de posts + limites).
function validateGooglePost(item: any): { ok: true; summary: string } | { ok: false; error: string } {
  const summary = `${item.title || ""}\n\n${item.content || ""}`.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (summary.length < 20) {
    return { ok: false, error: "Conteúdo rejeitado no Google: texto muito curto (mínimo 20 caracteres)." };
  }
  if (summary.length > 1500) {
    return { ok: false, error: `Conteúdo rejeitado no Google: ${summary.length} caracteres (máximo 1500).` };
  }
  const hashtags = (summary.match(/#\w+/g) || []).length;
  if (hashtags > 4) {
    return { ok: false, error: `Conteúdo rejeitado no Google: ${hashtags} hashtags (máximo 4).` };
  }
  if (!/[a-zA-ZÀ-ÿ]{3}/.test(summary)) {
    return { ok: false, error: "Conteúdo rejeitado no Google: sem texto significativo." };
  }
  return { ok: true, summary };
}

async function publishToGoogleBusiness(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  if (!config.api_token) {
    return { success: false, error: "Conta Google (Perfil da Empresa) não conectada. Conecte em Conectar Redes." };
  }

  // 1) Validação de conteúdo
  const content = validateGooglePost(item);
  if (!content.ok) return { success: false, error: content.error };

  // 2) Rate limiting: intervalo mínimo entre publicações
  const minIntervalMin = Number(process.env.GOOGLE_POST_MIN_INTERVAL_MIN || "60");
  const lastPublished = await getLastPublishedAt("google");
  if (lastPublished) {
    const minsSince = (Date.now() - new Date(lastPublished).getTime()) / 60000;
    if (minsSince < minIntervalMin) {
      return {
        success: false,
        error: `Google: aguardando intervalo mínimo de ${minIntervalMin} min entre posts (último há ${Math.floor(minsSince)} min). Reagendado automaticamente.`,
      };
    }
  }

  let token = config.api_token;

  // 3) Contas de negócio acessíveis com este token
  let accountsResponse = await fetch(GBP_ACCOUNTS_URL, { headers: { Authorization: `Bearer ${token}` } });
  if (accountsResponse.status === 401) {
    const fresh = await refreshGoogleToken(config);
    if (fresh) {
      token = fresh;
      accountsResponse = await fetch(GBP_ACCOUNTS_URL, { headers: { Authorization: `Bearer ${token}` } });
    }
  }
  if (!accountsResponse.ok) {
    const body = await accountsResponse.text();
    const hint =
      accountsResponse.status === 403
        ? " → Verifique se a API 'Google Business Profile API' está habilitada no Cloud Console e se o escopo business.manage foi adicionado à tela de consentimento."
        : "";
    return { success: false, error: `Google Business Profile API: HTTP ${accountsResponse.status} ${body.slice(0, 220)}${hint}` };
  }
  const accounts: any[] = ((await accountsResponse.json()).accounts || []).filter((a: any) => a?.name);
  if (!accounts.length) {
    return { success: false, error: "Nenhuma conta do Google Business Profile acessível com esta conta Google." };
  }

  // 4) Filtro de segurança: só OWNER / CO-OWNER / MANAGER
  const forcedAccount = (process.env.GOOGLE_BUSINESS_ACCOUNT || "").trim();
  const roleSummary = accounts.map((a) => `${a.name}=${String(a.role || "?").toUpperCase()}`).join(", ");
  let eligible = accounts.filter((a) => GOOGLE_ALLOWED_ROLES.includes(String(a.role || "").toUpperCase()));
  if (forcedAccount) {
    const forced = accounts.find((a) => a.name === forcedAccount);
    if (!forced) {
      return { success: false, error: `Conta ${forcedAccount} não está entre as contas acessíveis (${roleSummary}).` };
    }
    if (!GOOGLE_ALLOWED_ROLES.includes(String(forced.role || "").toUpperCase())) {
      return {
        success: false,
        error: `Bloqueado por segurança: papel '${String(forced.role || "desconhecido").toUpperCase()}' não é OWNER/CO-OWNER/MANAGER em ${forcedAccount}.`,
      };
    }
    eligible = [forced];
  }
  if (!eligible.length) {
    return {
      success: false,
      error: `Nenhuma conta com papel OWNER/CO-OWNER/MANAGER (vistas: ${roleSummary}). Conecte a conta que é dona ou administradora do perfil.`,
    };
  }

  // 5) Localizações (empresas) das contas elegíveis
  const maxLocations = Number(process.env.GOOGLE_MAX_LOCATIONS || "10");
  const wanted = (process.env.GOOGLE_BUSINESS_LOCATIONS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const locations: any[] = [];
  const listErrors: string[] = [];
  for (const account of eligible) {
    if (locations.length >= maxLocations) break;
    const lr = await fetch(
      `${GBP_LOCATIONS_URL}?parent=${encodeURIComponent(account.name)}&pageSize=${maxLocations}&readMask=name,title,languageCode`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!lr.ok) {
      listErrors.push(`${account.name}: HTTP ${lr.status} ${(await lr.text()).slice(0, 140)}`);
      continue;
    }
    const ld = await lr.json().catch(() => ({}));
    for (const loc of ld.locations || []) locations.push(loc);
  }
  if (!locations.length) {
    return {
      success: false,
      error: `Nenhuma localização (empresa) encontrada${listErrors.length ? ` → ${listErrors.join(" | ")}` : ` nas contas: ${eligible.map((a) => a.name).join(", ")}`}`,
    };
  }

  // 6) Seleção alvo (opcional: GOOGLE_BUSINESS_LOCATIONS = nomes/códigos separados por vírgula)
  let targets = locations;
  if (wanted.length) {
    targets = locations.filter(
      (l) => wanted.includes(l.name) || wanted.includes(String(l.storeCode || "")) || wanted.includes(String(l.placeId || ""))
    );
    if (!targets.length) {
      return { success: false, error: `GOOGLE_BUSINESS_LOCATIONS não corresponde a nenhuma localização acessível (${locations.length} disponíveis).` };
    }
  }
  targets = targets.slice(0, maxLocations);

  // 7) Publicar em cada empresa alvo
  const imageUrl = buildSocialImage(item);
  const published: string[] = [];
  const failed: string[] = [];
  for (const location of targets) {
    const body: any = {
      languageCode: location.languageCode || "pt-BR",
      summary: content.summary,
      topicType: "STANDARD",
    };
    if (item.destination_url) {
      body.callToAction = { actionType: "LEARN_MORE", url: item.destination_url };
    }
    if (imageUrl) {
      body.media = [{ mediaFormat: "PHOTO", sourceUrl: imageUrl }];
    }

    const send = () =>
      fetch(`${GBP_POSTS_BASE}/${location.name}/localPosts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    let response = await send();
    if (response.status === 401) {
      const fresh = await refreshGoogleToken(config);
      if (fresh) {
        token = fresh;
        response = await send();
      }
    }

    if (response.ok) {
      const data = await response.json().catch(() => null);
      published.push(data?.name || location.name);
    } else {
      const errBody = await response.text();
      failed.push(`${location.title || location.name}: HTTP ${response.status} ${errBody.slice(0, 160)}`);
    }
  }

  if (!published.length) {
    return { success: false, error: `Google: falhou em ${failed.length}/${targets.length} empresa(s) → ${failed.slice(0, 3).join(" | ")}` };
  }
  const note = failed.length ? ` (${published.length}/${targets.length} empresas — falhas: ${failed.slice(0, 2).join("; ")})` : "";
  return { success: true, external_post_id: `${published[0]}${note}` };
}

async function publishToReddit(item: any, config: any): Promise<{ success: boolean; external_post_id?: string; error?: string }> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!config.api_token) {
    return { success: false, error: "Conta Reddit não conectada. Conecte em Conectar Redes (OAuth)." };
  }

  const subreddit = (process.env.REDDIT_SUBREDDIT || (await getAgentConfig("reddit_subreddit")) || "")
    .trim()
    .replace(/^\/?r\//i, "");
  if (!subreddit) {
    return {
      success: false,
      error: "REDDIT_SUBREDDIT não definido. Adicione REDDIT_SUBREDDIT no Vercel (ex.: r/beermoney) para informar onde publicar.",
    };
  }

  // Rate limit do Reddit: máx. 1 post a cada 10 min. Se o intervalo não foi
  // respeitado, falha com mensagem clara — o retry automático tenta mais tarde.
  const lastPublished = await getLastPublishedAt("reddit");
  if (lastPublished) {
    const minsSince = (Date.now() - new Date(lastPublished).getTime()) / 60000;
    if (minsSince < 10) {
      return {
        success: false,
        error: `Reddit: aguardando intervalo mínimo de 10 min entre posts (último há ${Math.max(1, Math.floor(minsSince))} min). Reagendado automaticamente.`,
      };
    }
  }

  // User-Agent identificativo é OBRIGATÓRIO — o Reddit bloqueia chamadas genéricas.
  const userAgent = "web:equipe-ademilson:v1.0 (by /u/EquipeAdemilson)";
  const title = item.title.slice(0, 300); // limite do Reddit
  const link = item.destination_url || "";
  const text = link && !String(item.content || "").includes(link) ? `${item.content}\n\n${link}` : item.content;

  const submit = async (token: string) =>
    fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
      },
      body: new URLSearchParams({
        api_type: "json",
        sr: subreddit,
        kind: "self",
        title,
        text,
      }).toString(),
    });

  try {
    let accessToken = config.api_token;
    let response = await submit(accessToken);

    // Access token expirado → renova com o refresh token (OAuth duration=permanent)
    if (response.status === 401 && clientId && clientSecret && config.api_secret) {
      const refreshResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": userAgent,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: config.api_secret,
        }).toString(),
      });
      const refreshData = await refreshResponse.json().catch(() => null);
      if (refreshResponse.ok && refreshData?.access_token) {
        accessToken = refreshData.access_token;
        response = await submit(accessToken);
        // Persiste o token renovado para as próximas publicações
        try {
          const accounts = await getSocialAccounts("reddit");
          const account = accounts.find((a: any) => a && a.status === "connected");
          if (account) {
            await updateSocialAccount(account.id, {
              access_token: encryptToken(accessToken),
              expires_at: refreshData.expires_in
                ? new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
                : undefined,
            });
          }
        } catch {
          // persistência é best-effort — não bloqueia a publicação
        }
      }
    }

    const data = await response.json().catch(() => null);
    const errors = data?.json?.errors;

    // O Reddit responde HTTP 200 mesmo com erro — conferir data.json.errors.
    if (!response.ok || (Array.isArray(errors) && errors.length > 0)) {
      const detail =
        Array.isArray(errors) && errors.length > 0
          ? errors.map((e: any) => `${e[0]}: ${e[1]}`).join("; ")
          : `HTTP ${response.status}`;
      return { success: false, error: `Reddit API error no subreddit r/${subreddit}: ${detail}` };
    }

    const created = data?.json?.data?.things?.[0]?.data;
    const externalPostId = created?.name || created?.id || "reddit";
    return { success: true, external_post_id: externalPostId };
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

    // Recupera itens presos em "publishing" por execuções anteriores interrompidas
    await resetStalePublishing();

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

      // Falha isolada: um item problemático não pode derrubar a execução inteira
      // nem deixar o item preso em "publishing".
      try {
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
      } catch (itemError: any) {
        try {
          await markAsFailed(item.id, `Erro interno: ${itemError.message}`);
        } catch {
          await updatePublicationQueue(item.id, { status: "scheduled" });
        }
        results.push({
          id: item.id,
          platform: item.platform,
          title: item.title,
          action: "failed",
          error: itemError.message,
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
