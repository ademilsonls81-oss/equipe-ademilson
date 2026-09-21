import { NextRequest, NextResponse } from "next/server";
import {
  createSocialAccount,
  updateSocialAccount,
  getSocialAccountByPlatformAccount,
  upsertPlatformConfig,
  createAgentLog,
} from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { validateNonce } from "@/lib/oauth-nonce";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";

const TOKEN_URLS: Record<string, string> = {
  youtube: "https://oauth2.googleapis.com/token",
  instagram: "https://api.instagram.com/oauth/access_token",
  facebook: "https://graph.facebook.com/v19.0/oauth/access_token",
  tiktok: "https://open.tiktokapis.com/v2/oauth/token/",
  pinterest: "https://pinterest.com/oauth/token",
  reddit: "https://www.reddit.com/api/v1/access_token",
};

const INFO_URLS: Record<string, (token: string) => { url: string; headers?: Record<string, string> }> = {
  youtube: (token) => ({
    url: "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    headers: { Authorization: `Bearer ${token}` },
  }),
  instagram: (token) => ({
    url: `https://graph.instagram.com/me?fields=id,username&access_token=${token}`,
  }),
  facebook: (token) => ({
    url: `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${token}`,
  }),
  tiktok: (token) => ({
    url: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    headers: { Authorization: `Bearer ${token}` },
  }),
  pinterest: (token) => ({
    url: "https://api.pinterest.com/v5/user_account",
    headers: { Authorization: `Bearer ${token}` },
  }),
  reddit: (token) => ({
    url: "https://oauth.reddit.com/api/v1/me",
    headers: { Authorization: `Bearer ${token}` },
  }),
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  console.log(`[OAUTH CALLBACK] Received code=${code?.substring(0, 16)}... state=${state}`);

  // Se veio erro do OAuth
  if (error) {
    console.log(`[OAUTH CALLBACK] OAuth error: ${error}`);
    return NextResponse.redirect(
      new URL(`/admin/acquisition/content-engine?tab=networks&error=${encodeURIComponent(error)}`, BASE_URL)
    );
  }

  // Se não tem code nem state
  if (!code || !state) {
    console.log(`[OAUTH CALLBACK] Missing params: code=${!!code} state=${!!state}`);
    return NextResponse.redirect(
      new URL(`/admin/acquisition/content-engine?tab=networks&error=missing_params`, BASE_URL)
    );
  }

  // Validar state: formato "platform:nonce"
  const stateParts = state.split(":");
  if (stateParts.length !== 2 || !stateParts[0] || !stateParts[1]) {
    console.log(`[OAUTH CALLBACK] Invalid state format: ${state}`);
    return NextResponse.redirect(
      new URL(`/admin/acquisition/content-engine?tab=networks&error=invalid_state`, BASE_URL)
    );
  }

  const platform = stateParts[0];
  const nonce = stateParts[1];

  console.log(`[OAUTH CALLBACK] platform=${platform} nonce=${nonce.substring(0, 16)}...`);

  // Validar nonce contra banco de dados
  // Também aceita cookie como fallback (compatibilidade)
  const cookieNonce = request.cookies.get("oauth_nonce")?.value;
  console.log(`[OAUTH CALLBACK] cookieNonce=${cookieNonce?.substring(0, 16) || "none"}`);
  
  const nonceValid = await validateNonce(nonce, platform) || (cookieNonce && cookieNonce === nonce);
  
  console.log(`[OAUTH CALLBACK] nonceValid=${nonceValid}`);
  
  if (!nonceValid) {
    return NextResponse.redirect(
      new URL(`/admin/acquisition/content-engine?tab=networks&error=invalid_nonce`, BASE_URL)
    );
  }

  // Limpar cookie após uso
  const redirectResponse = NextResponse.redirect(
    new URL(`/admin/acquisition/content-engine?tab=networks&connected=${platform}`, BASE_URL)
  );
  redirectResponse.cookies.delete("oauth_nonce");

  try {
    const clientIdKey = getClientIdKey(platform);
    const clientId = process.env[clientIdKey];
    const clientSecret = process.env[getClientSecretKey(platform)];

    if (!clientId || !clientSecret) {
      await createAgentLog({
        agent_type: "social_accounts",
        action: "oauth_callback_error",
        details: `Missing credentials for ${platform}: clientId=${clientId ? "set" : "missing"}, clientSecret=${clientSecret ? "set" : "missing"}`,
        status: "error",
        error_message: "missing_credentials",
      });
      return NextResponse.redirect(
        new URL(`/admin/acquisition/content-engine?tab=networks&error=missing_credentials`, BASE_URL)
      );
    }

    // Trocar code por token
    const tokenData = await exchangeCodeForToken(platform, code, clientId, clientSecret);

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL(`/admin/acquisition/content-engine?tab=networks&error=token_exchange_failed`, BASE_URL)
      );
    }

    // Obter info da conta
    const accountInfo = await fetchAccountInfo(platform, tokenData.access_token);

    const accountId = accountInfo?.id || `${platform}_${Date.now()}`;
    const accountName = accountInfo?.name || `${platform}_account`;
    const avatarUrl = accountInfo?.avatar;

    // Criptografar tokens antes de salvar
    const encAccessToken = encryptToken(tokenData.access_token);
    const encRefreshToken = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : undefined;

    // Verificar se já existe
    const existing = await getSocialAccountByPlatformAccount(platform, accountId) as any;

    if (existing) {
      // Atualizar token
      await updateSocialAccount(existing.id, {
        access_token: encAccessToken,
        refresh_token: encRefreshToken,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : undefined,
        status: "connected",
        error_message: undefined,
      });
    } else {
      // Criar nova conta
      await createSocialAccount({
        platform,
        account_name: accountName,
        account_id: accountId,
        avatar_url: avatarUrl,
        access_token: encAccessToken,
        refresh_token: encRefreshToken,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : undefined,
        scopes: tokenData.scope,
        status: "connected",
      });
    }

    // Atualizar platform_config APENAS status (NÃO duplicar token)
    await upsertPlatformConfig(platform, {
      api_configured: 1,
      enabled: 1,
    });

    await createAgentLog({
      agent_type: "social_accounts",
      action: "oauth_callback",
      details: `Conta ${accountName} conectada via OAuth na plataforma ${platform}`,
      status: "success",
    });

    return redirectResponse;
  } catch (e: any) {
    await createAgentLog({
      agent_type: "social_accounts",
      action: "oauth_callback_error",
      details: `Erro no callback OAuth para ${platform}: ${e.message}`,
      status: "error",
      error_message: e.message,
    });

    const errResponse = NextResponse.redirect(
      new URL(`/admin/acquisition/content-engine?tab=networks&error=${encodeURIComponent(e.message)}`, BASE_URL)
    );
    errResponse.cookies.delete("oauth_nonce");
    return errResponse;
  }
}

async function exchangeCodeForToken(
  platform: string,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string }> {
  const tokenUrl = TOKEN_URLS[platform];
  if (!tokenUrl) throw new Error(`Token URL não configurada para ${platform}`);

  const redirectUri = `${BASE_URL}/api/social-accounts/callback`;
  console.log(`[OAUTH TOKEN] platform=${platform} redirect_uri="${redirectUri}" base_url="${BASE_URL}" code=${code.substring(0, 16)}...`);

  switch (platform) {
    case "youtube":
    case "facebook": {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const r = await fetch(tokenUrl, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      const d = await r.json();
      console.log(`[OAUTH TOKEN] ${platform} exchange: status=${r.status}`);
      if (!r.ok || !d.access_token) {
        const errMsg = `${platform} token exchange failed: ${r.status} ${r.statusText} | ${JSON.stringify(d)} | client_id=${clientId} | redirect_uri=${redirectUri}`;
        throw new Error(errMsg);
      }
      return d;
    }

    case "instagram": {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const r = await fetch(tokenUrl, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      const d = await r.json();
      console.log(`[OAUTH TOKEN] Instagram exchange: status=${r.status}`);
      if (!r.ok || !d.access_token) {
        const errMsg = `Instagram token exchange failed: ${r.status} ${r.statusText} | ${JSON.stringify(d)} | client_id=${clientId} | redirect_uri=${redirectUri}`;
        throw new Error(errMsg);
      }

      // Trocar por long-lived token
      let accessToken = d.access_token;
      try {
        const llUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`;
        const llR = await fetch(llUrl);
        const llD = await llR.json();
        console.log(`[OAUTH TOKEN] Instagram long-lived exchange: status=${llR.ok ? "ok" : "failed"}`);
        if (llR.ok && llD.access_token) {
          accessToken = llD.access_token;
        }
      } catch (e: any) {
        console.log(`[OAUTH TOKEN] Instagram long-lived token failed, using short-lived: ${e.message}`);
      }

      return {
        access_token: accessToken,
        expires_in: d.expires_in,
      };
    }

    case "tiktok": {
      const params = new URLSearchParams({
        code,
        client_key: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const r = await fetch(tokenUrl, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!r.ok) throw new Error(`Token exchange failed: ${r.statusText}`);
      const d = await r.json();
      return {
        access_token: d.data?.access_token,
        refresh_token: d.data?.refresh_token,
        expires_in: d.data?.expires_in,
        scope: d.data?.scope,
      };
    }

    case "pinterest": {
      const params = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const r = await fetch(tokenUrl, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!r.ok) throw new Error(`Token exchange failed: ${r.statusText}`);
      return r.json();
    }

    case "reddit": {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const params = new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const r = await fetch(tokenUrl, {
        method: "POST",
        body: params,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (!r.ok) throw new Error(`Token exchange failed: ${r.statusText}`);
      return r.json();
    }

    default:
      throw new Error(`Plataforma ${platform} não suportada`);
  }
}

async function fetchAccountInfo(platform: string, token: string): Promise<{ id?: string; name?: string; avatar?: string } | null> {
  const config = INFO_URLS[platform];
  if (!config) return null;

  try {
    const { url, headers } = config(token);
    const r = await fetch(url, { headers });
    if (!r.ok) return null;
    const d = await r.json();

    switch (platform) {
      case "youtube": {
        const ch = d.items?.[0];
        return { id: ch?.id, name: ch?.snippet?.title, avatar: ch?.snippet?.thumbnails?.default?.url };
      }
      case "instagram":
        return { id: d.id, name: d.username };
      case "facebook":
        return { id: d.id, name: d.name, avatar: d.picture?.data?.url };
      case "tiktok":
        return { id: d.data?.user?.open_id, name: d.data?.user?.display_name, avatar: d.data?.user?.avatar_url };
      case "pinterest":
        return { id: d.id, name: d.username, avatar: d.profile_image };
      case "reddit":
        return { id: d.id, name: d.name, avatar: d.icon_img };
    }
  } catch {
    return null;
  }
  return null;
}

function getClientIdKey(platform: string): string {
  const map: Record<string, string> = {
    youtube: "GOOGLE_CLIENT_ID",
    instagram: "INSTAGRAM_CLIENT_ID",
    facebook: "FACEBOOK_CLIENT_ID",
    tiktok: "TIKTOK_CLIENT_KEY",
    pinterest: "PINTEREST_CLIENT_ID",
    reddit: "REDDIT_CLIENT_ID",
  };
  return map[platform] || "";
}

function getClientSecretKey(platform: string): string {
  const map: Record<string, string> = {
    youtube: "GOOGLE_CLIENT_SECRET",
    instagram: "INSTAGRAM_CLIENT_SECRET",
    facebook: "FACEBOOK_CLIENT_SECRET",
    tiktok: "TIKTOK_CLIENT_SECRET",
    pinterest: "PINTEREST_CLIENT_SECRET",
    reddit: "REDDIT_CLIENT_SECRET",
  };
  return map[platform] || "";
}
