import { NextRequest, NextResponse } from "next/server";
import {
  createAgentLog,
  setAgentConfig,
  addToPublicationQueue,
  seedPrimeiraCampanha,
} from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") === CRON_SECRET) return true;
  return false;
}

const CONTENT_THEMES = [
  {
    theme: "Oportunidade",
    angle: "Apresentar como uma nova oportunidade de ganho",
    platforms: ["facebook", "reddit", "whatsapp"],
  },
  {
    theme: "Tutorial",
    angle: "Ensinar como começar do zero",
    platforms: ["reddit", "facebook"],
  },
  {
    theme: "Prova Social",
    angle: "Mostrar resultados de quem já participa",
    platforms: ["facebook", "whatsapp"],
  },
  {
    theme: "Comparação",
    angle: "Comparar com outros trabalhos tradicionais",
    platforms: ["reddit", "facebook"],
  },
  {
    theme: "Urgência",
    angle: "Criar senso de urgência ético",
    platforms: ["whatsapp", "facebook"],
  },
  {
    theme: "Educativo",
    angle: "Explicar como funciona o projeto de IA",
    platforms: ["reddit"],
  },
  {
    theme: "Dica Rápida",
    angle: "Dar uma dica prática e rápida",
    platforms: ["facebook", "whatsapp"],
  },
];

function generateUTM(platform: string, theme: string): string {
  return `utm_source=${platform}&utm_medium=social&utm_campaign=${theme.toLowerCase().replace(/\s+/g, "-")}`;
}

function generateContent(platform: string, theme: typeof CONTENT_THEMES[0]) {
  const utm = generateUTM(platform, theme.theme);
  const url = `${SITE_URL}?${utm}`;
  const waUrl = `${WA_GROUP}`;

  const templates: Record<string, { title: string; content: string; destination_url: string }> = {
    facebook: {
      title: `${theme.angle} | Equipe Ademilson`,
      content: `Você sabia que é possível ${theme.angle.toLowerCase()}?\n\nGrave vídeos do dia a dia com seu celular para treinar Inteligência Artificial e ganhe em dólar — sem taxa, 100% gratuito.\n\n✅ Sem experiência necessária\n✅ Use apenas o celular\n✅ Pagamento garantido\n\n👉 Entre no grupo agora: ${waUrl}`,
      destination_url: url,
    },
    reddit: {
      title: `[Discussão] ${theme.angle} — experiência com gravação de vídeos para IA`,
      content: `Pessoal, alguém mais está participando de projetos de gravação de vídeos para treinar IA? Quero compartilhar minha experiência.\n\nJá faz alguns meses que gravo vídeos cotidianos com o celular e recebo em dólar. Não precisa de equipamento especial, só o celular mesmo.\n\nO projeto é da Equipe Ademilson, 100% gratuito e sem anuidade. Se interessar, mais info aqui: ${url}`,
      destination_url: url,
    },
    whatsapp: {
      title: `Compartilhar no WhatsApp`,
      content: `🎬 ${theme.angle}!\n\nGrave vídeos do dia a dia com seu celular e ganhe em dólar treinando IA. Cadastro gratuito!\n\n✅ Sem taxa\n✅ Sem experiência\n✅ Só precisa de celular\n\n👉 ${waUrl}`,
      destination_url: waUrl,
    },
  };

  return templates[platform] || templates["facebook"];
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const themeIndex = dayOfYear % CONTENT_THEMES.length;
    const theme = CONTENT_THEMES[themeIndex];

    await setAgentConfig("daily_content_last_run", today.toISOString());
    await setAgentConfig(
      "daily_content_next_run",
      new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
    );

    // Garantir que a campanha base existe
    await seedPrimeiraCampanha();

    const campaignId = "primeiro-100-membros";
    const addedItems: string[] = [];

    for (const platform of theme.platforms) {
      const content = generateContent(platform, theme);
      const scheduledAt = new Date(today.getTime() + 30 * 60 * 1000).toISOString(); // +30min

      await addToPublicationQueue({
        campaign_id: campaignId,
        content_id: `daily-${today.toISOString().split("T")[0]}-${platform}-${theme.theme}`,
        platform,
        title: content.title,
        content: content.content,
        destination_url: content.destination_url,
        utm_source: platform,
        utm_medium: "social",
        utm_campaign: `daily-${today.toISOString().split("T")[0]}`,
        utm_content: theme.theme,
        scheduled_at: scheduledAt,
        status: "approved", // auto-aprovado para publicação autônoma
      });

      addedItems.push(platform);
    }

    await createAgentLog({
      agent_type: "cron",
      action: "daily_content",
      details: `Conteúdo diário gerado: tema "${theme.theme}" para ${addedItems.join(", ")}. ${addedItems.length} itens na fila.`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      date: today.toISOString().split("T")[0],
      theme: theme.theme,
      angle: theme.angle,
      platforms: addedItems,
      queued: addedItems.length,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    await createAgentLog({
      agent_type: "cron",
      action: "daily_content",
      details: `Erro na geração de conteúdo diário: ${error.message}`,
      status: "error",
      error_message: error.message,
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
