/**
 * Cron Job para Geração Automática de Conteúdo
 * 
 * Execute: node scripts/daily-content.js
 * 
 * Gera conteúdo diário para o blog e redes sociais.
 * Pode ser configurado para rodar automaticamente via cron.
 */

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

const DAILY_THEMES = [
  {
    theme: "Motivação",
    whatsapp: `🔥 Motivação do dia!\n\nCada vídeo que você grava é uma oportunidade de ganhar mais. Não pare!\n\n✅ Gratuito\n✅ Sem taxas\n✅ Pagamento em dólar\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Como se Motivar para Ganhar Dinheiro com Vídeos",
      slug: "como-se-motivar-ganhar-dinheiro-videos",
    },
  },
  {
    theme: "Dica Técnica",
    whatsapp: `📱 Dica técnica: Use boa iluminação!\n\nVídeos com boa iluminação são mais aprovados. Use luz natural sempre que possível.\n\n👉 Mais dicas: ${WA_GROUP}`,
    blog: {
      title: "Dicas de Iluminação para Gravar Vídeos com o Celular",
      slug: "dicas-iluminacao-gravar-videos-celular",
    },
  },
  {
    theme: "Sucesso",
    whatsapp: `🎉 História de sucesso!\n\nUm membro do grupo já faturou mais de R$ 1.000 gravando vídeos para IA. Você pode ser o próximo!\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Histórias de Sucesso: Quanto Ganham os Gravadores de Vídeos para IA",
      slug: "historias-sucesso-gravadores-videos-ia",
    },
  },
  {
    theme: "Novidade",
    whatsapp: `🆕 Novidade!\n\nNovos projetos de gravação de vídeos disponíveis. Entre no grupo para ficar por dentro.\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Novos Projetos de Gravação de Vídeos para IA em 2026",
      slug: "novos-projetos-gravacao-videos-ia-2026",
    },
  },
  {
    theme: "Pergunta",
    whatsapp: `❓ Você sabia?\n\nA maioria das pessoas não sabe que dá para ganhar dinheiro gravando vídeos com o celular. Compartilhe com um amigo!\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Perguntas Frequentes sobre Gravação de Vídeos para IA",
      slug: "perguntas-frequentes-gravacao-videos-ia",
    },
  },
  {
    theme: "Comparação",
    whatsapp: `📊 Comparação:\n\n❌ Uber: precisa de carro\n❌ Freelancer: precisa de habilidade\n✅ Vídeos para IA: só precisa de celular\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Por que Gravar Vídeos para IA é Melhor que Outros Trabalhos Remotos",
      slug: "por-que-gravar-videos-ia-melhor",
    },
  },
  {
    theme: "Estatística",
    whatsapp: `📈 Estatística:\n\n80% dos que tentam gravar vídeos para IA são aprovados no primeiro projeto. É mais fácil do que parece!\n\n👉 ${WA_GROUP}`,
    blog: {
      title: "Estatísticas de Aprovação em Projetos de Vídeos para IA",
      slug: "estatisticas-aprovacao-projetos-videos-ia",
    },
  },
];

function generateDailyContent() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const themeIndex = dayOfWeek % DAILY_THEMES.length;
  const theme = DAILY_THEMES[themeIndex];

  console.log(`📅 CONTEÚDO DIÁRIO - ${today.toLocaleDateString("pt-BR")}`);
  console.log(`📝 Tema: ${theme.theme}\n`);

  console.log("📱 WhatsApp:");
  console.log(theme.whatsapp);
  console.log("\n📝 Blog:");
  console.log(`   Título: ${theme.blog.title}`);
  console.log(`   Slug: ${theme.blog.slug}`);

  return theme;
}

function saveDailyContent(theme) {
  const today = new Date().toISOString().split("T")[0];
  const filename = path.join(__dirname, `../data/daily-content-${today}.json`);

  const data = {
    date: today,
    theme: theme.theme,
    whatsapp: theme.whatsapp,
    blog: theme.blog,
    urls: {
      site: SITE_URL,
      whatsapp_group: WA_GROUP,
    },
  };

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`\n✅ Conteúdo salvo em: ${filename}`);
}

function generateWeeklyPlan() {
  console.log("\n\n📅 PLANO SEMANAL DE CONTEÚDO\n");

  DAILY_THEMES.forEach((theme, i) => {
    const day = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][i];
    console.log(`${day}: ${theme.theme}`);
    console.log(`  Blog: ${theme.blog.title}`);
    console.log(`  WhatsApp: ${theme.whatsapp.substring(0, 60)}...`);
    console.log("");
  });
}

console.log("🚀 Gerador de Conteúdo Diário - Equipe Ademilson\n");

const dailyTheme = generateDailyContent();
saveDailyContent(dailyTheme);
generateWeeklyPlan();

console.log("\n✅ Processo concluído!");
console.log("\nPara rodar automaticamente, configure um cron job:");
console.log("0 8 * * * node scripts/daily-content.js");
