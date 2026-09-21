import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import {
  getSocialAccounts,
  getSocialAccountsByPlatform,
  getSocialAccount,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  getSocialConnectionStatus,
  upsertPlatformConfig,
  getPlatformConfig,
  createAgentLog,
} from "@/lib/db";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { randomBytes } from "crypto";
import { storeNonce } from "@/lib/oauth-nonce";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";

const OAUTH_CONFIGS: Record<string, {
  auth_url: string;
  client_id_env: string;
  scopes: string[];
  extra_params?: Record<string, string>;
}> = {
  youtube: {
    auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
    client_id_env: "GOOGLE_CLIENT_ID",
    scopes: ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/userinfo.profile"],
  },
  instagram: {
    auth_url: "https://www.instagram.com/oauth/authorize",
    client_id_env: "INSTAGRAM_CLIENT_ID",
    scopes: ["instagram_business_basic", "instagram_business_content_publish"],
  },
  facebook: {
    auth_url: "https://www.facebook.com/v19.0/dialog/oauth",
    client_id_env: "FACEBOOK_CLIENT_ID",
    scopes: ["public_profile", "pages_show_list", "pages_read_engagement", "pages_manage_posts"],
  },
  tiktok: {
    auth_url: "https://www.tiktok.com/v2/auth/authorize/",
    client_id_env: "TIKTOK_CLIENT_KEY",
    scopes: ["user.info.basic", "video.publish"],
    extra_params: { response_type: "code" },
  },
  pinterest: {
    auth_url: "https://pinterest.com/oauth/",
    client_id_env: "PINTEREST_CLIENT_ID",
    scopes: ["boards:read", "pins:read", "pins:write", "user_accounts:read"],
  },
  reddit: {
    auth_url: "https://www.reddit.com/api/v1/authorize",
    client_id_env: "REDDIT_CLIENT_ID",
    scopes: ["identity", "submit"],
    extra_params: { duration: "permanent", state: "equipe_ademilson" },
  },
};

function generateNonce(): string {
  return randomBytes(32).toString("hex");
}

function getOAuthUrl(platform: string, nonce: string): string | null {
  const config = OAUTH_CONFIGS[platform];
  if (!config) return null;

  const clientId = process.env[config.client_id_env];
  if (!clientId) return null;

  const redirectUri = `${BASE_URL}/api/social-accounts/callback`;
  console.log(`[OAUTH URL] platform=${platform} redirect_uri="${redirectUri}" base_url="${BASE_URL}"`);
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state: `${platform}:${nonce}`,
    ...(config.extra_params || {}),
  });

  // Google needs access_type=offline for refresh token
  if (platform === "youtube") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  return `${config.auth_url}?${params.toString()}`;
}

export async function GET(request: Request) {
  if (!checkAdminAuth(request as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);

  try {
    // Status de conexão de todas as plataformas
    if (url.searchParams.get("status") === "true") {
      const status = await getSocialConnectionStatus();
      return NextResponse.json({ platforms: status });
    }

    // Listar contas
    if (url.searchParams.get("accounts") === "true") {
      const platform = url.searchParams.get("platform") || undefined;
      const accounts = await getSocialAccounts(platform);
      // Nunca expor tokens na resposta
      const safe = accounts.map(({ access_token, refresh_token, ...rest }: any) => ({
        ...rest,
        has_token: !!access_token,
        has_refresh: !!refresh_token,
      }));
      return NextResponse.json({ accounts: safe });
    }

    // Gerar URL de OAuth
    if (url.searchParams.get("connect") === "true") {
      const platform = url.searchParams.get("platform");
      if (!platform || !OAUTH_CONFIGS[platform]) {
        return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
      }
      const clientId = process.env[OAUTH_CONFIGS[platform].client_id_env];
      if (!clientId) {
        return NextResponse.json({
          error: `Client ID não configurado para ${platform}`,
          setup_required: true,
          instructions: getSetupInstructions(platform),
        }, { status: 400 });
      }
      const nonce = generateNonce();
      const authUrl = getOAuthUrl(platform, nonce);
      
      // Armazenar nonce no banco (5 min de validade)
      await storeNonce(nonce, platform, 5 * 60 * 1000);
      
      const response = NextResponse.json({ auth_url: authUrl });
      // Cookie HttpOnly, SameSite=Lax, 5min expiry
      response.cookies.set("oauth_nonce", nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      return response;
    }

    // Instruções de setup manual
    if (url.searchParams.get("setup") === "true") {
      const platform = url.searchParams.get("platform") || "";
      return NextResponse.json({ instructions: getSetupInstructions(platform) });
    }

    return NextResponse.json({ error: "Parâmetro não especificado" }, { status: 400 });
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

    // Conectar manualmente (salvar credenciais sem OAuth)
    if (action === "connect_manual") {
      const { platform, account_name, api_key, api_secret, api_token } = body;
      if (!platform || !account_name) {
        return NextResponse.json({ error: "platform and account_name required" }, { status: 400 });
      }

      const accountId = `manual_${platform}_${Date.now()}`;
      const encToken = api_token ? encryptToken(api_token) : undefined;
      const encSecret = api_secret ? encryptToken(api_secret) : undefined;

      await createSocialAccount({
        platform,
        account_name,
        account_id: accountId,
        access_token: encToken,
        refresh_token: encSecret,
        status: "connected",
      });

      // Atualizar platform_config APENAS api_key (não duplicar token)
      await upsertPlatformConfig(platform, {
        api_configured: 1,
        api_key: api_key || undefined,
        enabled: 1,
      });

      await createAgentLog({
        agent_type: "social_accounts",
        action: "connect_manual",
        details: `Conta ${account_name} conectada manualmente na plataforma ${platform}`,
        status: "success",
      });

      return NextResponse.json({ ok: true, account_id: accountId });
    }

    // Conectar via token direto (sem OAuth)
    if (action === "connect_token") {
      const { platform, account_name, access_token, refresh_token, expires_in } = body;
      if (!platform || !account_name || !access_token) {
        return NextResponse.json({ error: "platform, account_name, and access_token required" }, { status: 400 });
      }

      // Tentar obter info da conta
      let accountId = `token_${platform}_${Date.now()}`;
      let avatarUrl = undefined;
      let resolvedName = account_name;

      try {
        const userInfo = await fetchAccountInfo(platform, access_token);
        if (userInfo) {
          accountId = userInfo.id || accountId;
          avatarUrl = userInfo.avatar;
          if (userInfo.name) resolvedName = userInfo.name;
        }
      } catch {
        // Continuar sem info
      }

      const expiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000).toISOString()
        : undefined;

      // Criptografar tokens antes de salvar
      const encAccessToken = encryptToken(access_token);
      const encRefreshToken = refresh_token ? encryptToken(refresh_token) : undefined;

      await createSocialAccount({
        platform,
        account_name: resolvedName,
        account_id: accountId,
        avatar_url: avatarUrl,
        access_token: encAccessToken,
        refresh_token: encRefreshToken,
        expires_at: expiresAt,
        status: "connected",
      });

      // Atualizar platform_config APENAS status (não duplicar token)
      await upsertPlatformConfig(platform, {
        api_configured: 1,
        enabled: 1,
      });

      await createAgentLog({
        agent_type: "social_accounts",
        action: "connect_token",
        details: `Conta ${account_name} conectada via token na plataforma ${platform}`,
        status: "success",
      });

      return NextResponse.json({ ok: true, account_id: accountId });
    }

    // Desconectar
    if (action === "disconnect") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const account = await getSocialAccount(id) as any;
      if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

      await updateSocialAccount(id, { status: "disconnected" });
      await createAgentLog({
        agent_type: "social_accounts",
        action: "disconnect",
        details: `Conta ${account.account_name} desconectada da plataforma ${account.platform}`,
        status: "success",
      });

      return NextResponse.json({ ok: true });
    }

    // Remover permanentemente
    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await deleteSocialAccount(id);
      return NextResponse.json({ ok: true });
    }

    // Testar conexão
    if (action === "test_connection") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const account = await getSocialAccount(id) as any;
      if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

      try {
        const decryptedToken = decryptToken(account.access_token);
        const testResult = await testPlatformConnection(account.platform, decryptedToken);
        return NextResponse.json({ ok: true, result: testResult });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
      }
    }

    // Testar post de teste
    if (action === "publish_test") {
      const { id, message } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const account = await getSocialAccount(id) as any;
      if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

      const decryptedToken = decryptToken(account.access_token);
      const testMsg = message || "Post de teste da Equipe Ademilson! 🚀";

      try {
        let result: any;
        if (account.platform === "facebook") {
          const pagesR = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?access_token=${decryptedToken}`
          );
          const pagesD = await pagesR.json();
          console.log(`[PUBLISH_TEST] Facebook pages response: ${JSON.stringify(pagesD)}`);
          if (!pagesR.ok || !pagesD.data?.length) {
            throw new Error(`Nenhuma pagina encontrada. Status: ${pagesR.status} Response: ${JSON.stringify(pagesD)}`);
          }
          const page = pagesD.data[0];
          const pageToken = page.access_token;

          const r = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}/feed?message=${encodeURIComponent(testMsg)}&access_token=${pageToken}`,
            { method: "POST" }
          );
          result = await r.json();
          if (!r.ok) throw new Error(result.error?.message || "Erro ao postar no Facebook");
          return NextResponse.json({ ok: true, post_id: result.id, platform: "facebook", page: page.name });
        }

        if (account.platform === "instagram") {
          const r1 = await fetch(
            `https://graph.facebook.com/v19.0/me/media?caption=${encodeURIComponent(testMsg)}&access_token=${decryptedToken}`,
            { method: "POST" }
          );
          const c1 = await r1.json();
          if (!r1.ok) throw new Error(c1.error?.message || "Erro ao criar container Instagram");

          const r2 = await fetch(
            `https://graph.facebook.com/v19.0/me/media_publish?creation_id=${c1.id}&access_token=${decryptedToken}`,
            { method: "POST" }
          );
          const c2 = await r2.json();
          if (!r2.ok) throw new Error(c2.error?.message || "Erro ao publicar Instagram");
          return NextResponse.json({ ok: true, post_id: c2.id, platform: "instagram" });
        }

        return NextResponse.json({ error: `Plataforma ${account.platform} não suporta post de teste` }, { status: 400 });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}

async function fetchAccountInfo(platform: string, token: string): Promise<{ id?: string; name?: string; avatar?: string } | null> {
  try {
    switch (platform) {
      case "youtube": {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return null;
        const d = await r.json();
        const ch = d.items?.[0];
        return { id: ch?.id, name: ch?.snippet?.title, avatar: ch?.snippet?.thumbnails?.default?.url };
      }
      case "instagram": {
        const r = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
        if (!r.ok) return null;
        const d = await r.json();
        return { id: d.id, name: d.username };
      }
      case "facebook": {
        const r = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${token}`);
        if (!r.ok) return null;
        const d = await r.json();
        return { id: d.id, name: d.name, avatar: d.picture?.data?.url };
      }
      case "tiktok": {
        const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return null;
        const d = await r.json();
        return { id: d.data?.user?.open_id, name: d.data?.user?.display_name, avatar: d.data?.user?.avatar_url };
      }
      case "pinterest": {
        const r = await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return null;
        const d = await r.json();
        return { id: d.id, name: d.username, avatar: d.profile_image };
      }
      case "reddit": {
        const r = await fetch("https://oauth.reddit.com/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return null;
        const d = await r.json();
        return { id: d.id, name: d.name, avatar: d.icon_img };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function testPlatformConnection(platform: string, token: string | null): Promise<{ connected: boolean; account?: string; error?: string }> {
  if (!token) return { connected: false, error: "Token não disponível" };

  try {
    const info = await fetchAccountInfo(platform, token);
    if (info?.name) {
      return { connected: true, account: info.name };
    }
    return { connected: false, error: "Não foi possível obter informações da conta" };
  } catch (e: any) {
    return { connected: false, error: e.message };
  }
}

function getSetupInstructions(platform: string): { title: string; steps: string[]; env_vars: string[]; notes: string[] } {
  const instructions: Record<string, { title: string; steps: string[]; env_vars: string[]; notes: string[] }> = {
    youtube: {
      title: "YouTube — Conta Oficial Equipe Ademilson",
      steps: [
        "1. Acesse console.cloud.google.com",
        "2. Crie um novo projeto: 'Equipe Ademilson'",
        "3. Ative a YouTube Data API v3",
        "4. Vá em 'Credenciais' → 'Criar credencial' → 'ID do cliente OAuth'",
        "5. Tipo de aplicativo: 'Aplicativo da Web'",
        "6. Adicione URI de redirecionamento: " + BASE_URL + "/api/social-accounts/callback",
        "7. Copie o Client ID e Client Secret",
        "8. Configure as Environment Variables no Vercel",
        "9. Volte ao painel e clique em 'Conectar YouTube'",
        "10. Autorize a aplicação no Google",
      ],
      env_vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      notes: [
        "Crie uma conta de serviço do YouTube para o projeto (não use conta pessoal)",
        "Para publicar vídeos, você precisa de uma conta verificada",
        "O OAuth retorna refresh_token para publicações automáticas",
      ],
    },
    instagram: {
      title: "Instagram — Conta Oficial Equipe Ademilson",
      steps: [
        "1. Crie uma página no Facebook para 'Equipe Ademilson'",
        "2. Acesse developers.facebook.com",
        "3. Crie um App → Tipo: 'Business'",
        "4. Adicione o produto 'Instagram Graph API'",
        "5. Configure OAuth: " + BASE_URL + "/api/social-accounts/callback",
        "6. Copie o App ID e App Secret",
        "7. Configure as Environment Variables no Vercel",
        "8. Vá em Instagram → Configurações → Autorizar aplicação",
        "9. Conecte a conta business do Instagram",
        "10. Volte ao painel e clique em 'Conectar Instagram'",
      ],
      env_vars: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
      notes: [
        "A conta do Instagram DEVE ser uma conta Business ou Creator",
        "Vincule a conta a uma Página do Facebook",
        "O Instagram Graph API permite publicar fotos e vídeos",
      ],
    },
    facebook: {
      title: "Facebook — Página Oficial Equipe Ademilson",
      steps: [
        "1. Acesse developers.facebook.com",
        "2. Use o mesmo App criado para o Instagram",
        "3. Adicione o produto 'Pages'",
        "4. Configure OAuth: " + BASE_URL + "/api/social-accounts/callback",
        "5. Copie o App ID e App Secret",
        "6. Configure as Environment Variables no Vercel",
        "7. Autorize a aplicação na página do Facebook",
        "8. Volte ao painel e clique em 'Conectar Facebook'",
      ],
      env_vars: ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"],
      notes: [
        "Pode usar o mesmo App do Instagram",
        "Precisa de permissão 'pages_manage_posts'",
        "Certifique-se de que a página está publicada",
      ],
    },
    tiktok: {
      title: "TikTok — Conta Oficial Equipe Ademilson",
      steps: [
        "1. Acesse developers.tiktok.com",
        "2. Crie uma conta de desenvolvedor",
        "3. Crie um novo App",
        "4. Adicione o produto 'Content Posting API'",
        "5. Configure Redirect URI: " + BASE_URL + "/api/social-accounts/callback",
        "6. Copie o Client Key e Client Secret",
        "7. Configure as Environment Variables no Vercel",
        "8. Aguarde aprovação do TikTok (pode levar dias)",
        "9. Após aprovação, volte ao painel e clique em 'Conectar TikTok'",
      ],
      env_vars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
      notes: [
        "A Content Posting API precisa de aprovação manual do TikTok",
        "Pode levar de 3 a 30 dias para ser aprovada",
        "Enquanto não aprovada, use a opção manual",
      ],
    },
    pinterest: {
      title: "Pinterest — Conta Oficial Equipe Ademilson",
      steps: [
        "1. Acesse developers.pinterest.com",
        "2. Crie uma conta de desenvolvedor",
        "3. Crie um App",
        "4. Configure Redirect URI: " + BASE_URL + "/api/social-accounts/callback",
        "5. Copie o App ID e App Secret",
        "6. Configure as Environment Variables no Vercel",
        "7. Volte ao painel e clique em 'Conectar Pinterest'",
        "8. Autorize a aplicação",
      ],
      env_vars: ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"],
      notes: [
        "O Pinterest API v5 permite criar pins e gerenciar boards",
        "Crie um board 'Equipe Ademilson' antes de publicar",
      ],
    },
    reddit: {
      title: "Reddit — Conta Oficial Equipe Ademilson",
      steps: [
        "1. Acesse reddit.com/prefs/apps",
        "2. Clique em 'create another app'",
        "3. Tipo: 'web app'",
        "4. Redirect URI: " + BASE_URL + "/api/social-accounts/callback",
        "5. Copie o Client ID e Client Secret",
        "6. Configure as Environment Variables no Vercel",
        "7. Volte ao painel e clique em 'Conectar Reddit'",
        "8. Autorize a aplicação",
      ],
      env_vars: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
      notes: [
        "Crie uma conta u/EquipeAdemilson no Reddit primeiro",
        "Respeite as regras de spam do Reddit (máx 1 post por 10 min)",
        "Participe de subreddits relevantes antes de postar",
      ],
    },
  };
  return instructions[platform] || { title: "Plataforma não encontrada", steps: [], env_vars: [], notes: [] };
}
