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

const WEEKLY_THEMES = [
  {
    day: "Domingo",
    theme: "Motivação",
    platform: "facebook",
    title: "🔥 Comece a semana com renda extra!",
    content: `Você já pensou em ganhar dinheiro extra gravando vídeos com seu celular?\n\nA Equipe Ademilson oferece projetos para treinar IA — você grava situações do dia a dia e recebe em dólar.\n\n✅ 100% gratuito\n✅ Sem experiência\n✅ Flexível — faça no seu tempo\n\n👉 Entre no grupo: ${WA_GROUP}`,
  },
  {
    day: "Segunda",
    theme: "Tutorial",
    platform: "reddit",
    title: "[Tutorial] Como começar a gravar vídeos para IA do zero",
    content: `Galera, segue um passo a passo de como entrar nos projetos de gravação de vídeos para IA:\n\n1. Cadastre-se no site (gratuito)\n2. Entre no grupo do WhatsApp\n3. Receba as instruções dos projetos\n4. Grave com seu celular (sem equipamento especial)\n5. Envie e receba em dólar\n\nJá estou há meses participando. Dúvidas? Comenta aí!\n\nMais info: ${SITE_URL}?utm_source=reddit&utm_medium=social&utm_campaign=tutorial`,
  },
  {
    day: "Terça",
    theme: "Prova Social",
    platform: "facebook",
    title: "💰 Quanto dá para ganhar gravando vídeos para IA?",
    content: `Muita gente está duvidando, mas os resultados falam por si:\n\n📊 Nível V0 (iniciante): R$ 300–500/mês\n📊 Nível V3 (intermediário): R$ 800–1.200/mês\n📊 Nível V6 (avançado): R$ 2.000+/mês\n\nTudo isso gravando vídeos cotidianos com o celular para treinar IA. Sem custo, sem experiência necessária.\n\nAcesse: ${SITE_URL}/ganhos?utm_source=facebook&utm_medium=social&utm_campaign=prova-social`,
  },
  {
    day: "Quarta",
    theme: "Comparação",
    platform: "facebook",
    title: "📊 Por que gravar vídeos para IA é melhor que outros freelas?",
    content: `Comparando opções de renda extra:\n\n❌ Uber — precisa de carro e CNH\n❌ Delivery — precisa de moto e é corrido\n❌ Freelancer — precisa de habilidade técnica\n❌ Infoprodutos — precisa criar do zero\n\n✅ Vídeos para IA:\n• Só precisa de celular\n• Faça no seu tempo livre\n• Sem custo de entrada\n• Pagamento em dólar\n\n👉 Saiba mais: ${SITE_URL}?utm_source=facebook&utm_medium=social&utm_campaign=comparacao`,
  },
  {
    day: "Quinta",
    theme: "FAQ",
    platform: "reddit",
    title: "[FAQ] Perguntas frequentes sobre gravação de vídeos para IA — Equipe Ademilson",
    content: `Vi muita gente perguntando sobre projetos de vídeos para IA. Vou responder as principais:\n\n**Precisa de câmera profissional?** Não, o celular basta.\n\n**É pirâmide financeira?** Não, você recebe pelo trabalho de gravar.\n\n**Precisa aparecer no vídeo?** Nem sempre, depende do projeto.\n\n**Quando recebo?** Após validação do vídeo enviado.\n\n**É gratuito?** Sim, 100% gratuito para o gravador.\n\nMais detalhes: ${SITE_URL}/blog?utm_source=reddit&utm_medium=social&utm_campaign=faq`,
  },
  {
    day: "Sexta",
    theme: "Urgência",
    platform: "whatsapp",
    title: "🚨 Vagas limitadas na Equipe Ademilson!",
    content: `📢 Atenção!\n\nO grupo da Equipe Ademilson está crescendo rápido e pode atingir o limite do WhatsApp em breve.\n\nSe você quer participar dos projetos de gravação de vídeos para IA e ganhar em dólar, entre agora:\n\n👉 ${WA_GROUP}\n\nGratuito, sem taxas, sem experiência. Só precisa do celular! 📱`,
  },
  {
    day: "Sábado",
    theme: "Engajamento",
    platform: "facebook",
    title: "🎉 Fim de semana produtivo: gravar vídeos para IA!",
    content: `Enquanto muita gente passa o fim de semana sem fazer nada, membros da Equipe Ademilson estão gravando vídeos com o celular e gerando renda extra! 📱💰\n\nO melhor: você pode fazer isso em qualquer lugar — em casa, no parque, no shopping.\n\nNão precisa de agenda fixa, nem de equipamento especial.\n\n👉 Comece hoje: ${SITE_URL}?utm_source=facebook&utm_medium=social&utm_campaign=engajamento-fds`,
  },
];

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const today = new Date();
    await setAgentConfig("weekly_plan_last_run", today.toISOString());

    // Garantir que a campanha base existe
    await seedPrimeiraCampanha();

    const campaignId = "primeiro-100-membros";
    const addedItems: { day: string; theme: string; platform: string }[] = [];

    for (let i = 0; i < WEEKLY_THEMES.length; i++) {
      const item = WEEKLY_THEMES[i];
      const scheduledDay = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      scheduledDay.setHours(9, 0, 0, 0); // 09:00 de cada dia

      await addToPublicationQueue({
        campaign_id: campaignId,
        content_id: `weekly-${today.toISOString().split("T")[0]}-day${i}-${item.platform}`,
        platform: item.platform,
        title: item.title,
        content: item.content,
        destination_url: `${SITE_URL}?utm_source=${item.platform}&utm_medium=social&utm_campaign=weekly-${item.theme.toLowerCase()}`,
        utm_source: item.platform,
        utm_medium: "social",
        utm_campaign: `weekly-${item.theme.toLowerCase()}`,
        utm_content: item.day,
        scheduled_at: scheduledDay.toISOString(),
        status: "approved",
      });

      addedItems.push({ day: item.day, theme: item.theme, platform: item.platform });
    }

    await createAgentLog({
      agent_type: "cron",
      action: "weekly_plan",
      details: `Plano semanal gerado: ${addedItems.length} publicações agendadas para os próximos 7 dias`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      week_start: today.toISOString().split("T")[0],
      scheduled: addedItems,
      total: addedItems.length,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    await createAgentLog({
      agent_type: "cron",
      action: "weekly_plan",
      details: `Erro no plano semanal: ${error.message}`,
      status: "error",
      error_message: error.message,
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
