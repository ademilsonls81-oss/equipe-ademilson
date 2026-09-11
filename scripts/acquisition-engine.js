/**
 * ACQUISITION ENGINE - Cron Job de Automação
 * 
 * Execute: node scripts/acquisition-engine.js
 * 
 * Sistema completo de geração de conteúdo para aquisição de tráfego.
 * Gera conteúdo para todas as plataformas com UTMs rastreadas.
 */

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

const PLATFORMS = {
  google: { name: "Google/SEO", icon: "🔍", format: "blog_post" },
  youtube: { name: "YouTube", icon: "📺", format: "video_script" },
  tiktok: { name: "TikTok", icon: "🎵", format: "short_video" },
  instagram: { name: "Instagram", icon: "📸", format: "reel_stories" },
  facebook: { name: "Facebook", icon: "📘", format: "post" },
  pinterest: { name: "Pinterest", icon: "📌", format: "pin" },
  reddit: { name: "Reddit", icon: "🔴", format: "post" },
  whatsapp: { name: "WhatsApp", icon: "📱", format: "message" },
};

const CONTENT_THEMES = [
  {
    theme: "Oportunidade",
    keywords: ["renda extra", "oportunidade", "ganhar dinheiro", "trabalho remoto"],
    angle: "Apresentar como uma nova oportunidade de ganho",
    platforms: ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit", "whatsapp"],
  },
  {
    theme: "Tutorial",
    keywords: ["como fazer", "passo a passo", "tutorial", "aprender"],
    angle: "Ensinar como começar do zero",
    platforms: ["google", "youtube", "tiktok", "instagram"],
  },
  {
    theme: "Prova Social",
    keywords: ["depoimento", "experiência", "resultado", "história real"],
    angle: "Mostrar resultados de quem já participa",
    platforms: ["youtube", "instagram", "facebook", "reddit", "whatsapp"],
  },
  {
    theme: "Comparação",
    keywords: ["melhor que", "diferente de", "vantagem", "por que"],
    angle: "Comparar com outros trabalhos tradicionais",
    platforms: ["google", "youtube", "tiktok", "facebook", "reddit"],
  },
  {
    theme: "Urgência",
    keywords: ["agora", "última chance", "limitado", "não perca"],
    angle: "Criar senso de urgência ético",
    platforms: ["whatsapp", "facebook", "instagram"],
  },
  {
    theme: "Educativo",
    keywords: ["entenda", "saiba mais", "como funciona", "explicação"],
    angle: "Explicar como funciona o projeto de IA",
    platforms: ["google", "youtube", "pinterest"],
  },
  {
    theme: "Dica Rápida",
    keywords: ["dica", "dica rápida", "macete", "truque"],
    angle: "Dar uma dica prática e rápida",
    platforms: ["tiktok", "instagram", "youtube"],
  },
];

function generateUTM(platform, theme, campaign) {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: campaign || theme.toLowerCase().replace(/\s+/g, "-"),
  });
  return params.toString();
}

function generateContent(platform, theme) {
  const utm = generateUTM(platform, theme.theme, "acquisition");
  const url = `${SITE_URL}?${utm}`;
  const waUrl = `${WA_GROUP}?utm_source=${platform}&utm_medium=social&utm_campaign=${theme.theme.toLowerCase().replace(/\s+/g, "-")}`;

  const templates = {
    google: {
      title: `${theme.angle} — Grupo WhatsApp de Gravação de Vídeos para IA`,
      description: `Descubra como ${theme.angle.toLowerCase()} com gravação de vídeos para IA. Grupo WhatsApp gratuito.`,
      cta: `Entre no grupo: ${url}`,
    },
    youtube: {
      title: `${theme.angle} | Gravação de Vídeos para IA`,
      description: `Neste vídeo, explico ${theme.angle.toLowerCase()} com gravação de vídeos para treinamento de IA.`,
      cta: `Link na descrição: ${url}`,
      hashtags: ["#rendaextra", "#ia", "#videos", "#trabalhoremoto", "#dinheiro"],
    },
    tiktok: {
      title: `${theme.angle} em 60 segundos`,
      description: `Video curto mostrando ${theme.angle.toLowerCase()}`,
      cta: `Link na bio: ${url}`,
      hashtags: ["#rendaextra", "#ia", "#videos", "#trabalhoremoto", "#viral"],
    },
    instagram: {
      title: `${theme.angle} | Carousel ou Reel`,
      description: `Post educativo sobre ${theme.angle.toLowerCase()}`,
      cta: `Link na bio: ${url}`,
      hashtags: ["#rendaextra", "#ia", "#videos", "#trabalhoremoto", "#oportunidade"],
    },
    facebook: {
      title: `${theme.angle}`,
      description: `Você sabia que é possível ${theme.angle.toLowerCase()}? Grave vídeos do dia a dia para treinar IA e ganhe em dólar.`,
      cta: `Entre no grupo: ${waUrl}`,
    },
    pinterest: {
      title: `${theme.angle} — Gravação de Vídeos para IA`,
      description: `Descubra como ${theme.angle.toLowerCase()} com gravação de vídeos para IA. Guia completo.`,
      cta: `Saiba mais: ${url}`,
    },
    reddit: {
      title: `[Discussão] ${theme.angle} — Experiência com gravação de vídeos para IA`,
      description: `Alguém mais está participando de projetos de gravação de vídeos para IA? Quero compartilhar minha experiência.`,
      cta: `Mais info: ${url}`,
      subreddit: "r/rendaextra",
    },
    whatsapp: {
      title: `Mensagem para compartilhar`,
      description: `🎬 ${theme.angle}!\n\nGrave vídeos do dia a dia e ganhe em dólar. Cadastro gratuito.\n\n👉 ${waUrl}`,
      cta: `Compartilhar`,
    },
  };

  return {
    platform,
    platformName: PLATFORMS[platform].name,
    ...templates[platform],
    url,
    waUrl,
    utm,
  };
}

function scoreContent(content, theme) {
  let score = 0;
  
  // Potencial de busca (Google = mais pontos)
  if (content.platform === "google") score += 30;
  if (content.platform === "youtube") score += 25;
  if (content.platform === "pinterest") score += 20;
  
  // Potencial de compartilhamento
  if (content.platform === "whatsapp") score += 25;
  if (content.platform === "facebook") score += 20;
  if (content.platform === "tiktok") score += 20;
  if (content.platform === "instagram") score += 15;
  
  // Relevância para o projeto
  if (theme.keywords.some(k => content.title?.toLowerCase().includes(k))) score += 15;
  
  // Intenção de entrada no grupo
  if (content.cta?.includes("grupo") || content.cta?.includes("wa.me")) score += 10;
  
  // Dificuldade de produção (menos difícil = mais pontos)
  if (content.platform === "whatsapp") score += 10;
  if (content.platform === "facebook") score += 8;
  if (content.platform === "instagram") score += 5;
  
  return Math.min(100, score);
}

function generateDailyPlan() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const themeIndex = dayOfYear % CONTENT_THEMES.length;
  const theme = CONTENT_THEMES[themeIndex];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 ACQUISITION ENGINE — ${today.toLocaleDateString("pt-BR")}`);
  console.log(`📝 Tema do dia: ${theme.theme}`);
  console.log(`🎯 Ângulo: ${theme.angle}`);
  console.log(`${"=".repeat(60)}\n`);

  const contents = [];

  for (const platform of theme.platforms) {
    const content = generateContent(platform, theme);
    const score = scoreContent(content, theme);
    contents.push({ ...content, score, theme: theme.theme });
  }

  // Ordenar por pontuação
  contents.sort((a, b) => b.score - a.score);

  console.log("📊 CONTEÚDO GERADO (ordenado por potencial):\n");
  
  for (const [i, content] of contents.entries()) {
    console.log(`${i + 1}. ${content.platformName} (${content.score} pontos)`);
    console.log(`   Título: ${content.title}`);
    console.log(`   CTA: ${content.cta}`);
    if (content.hashtags) {
      console.log(`   Hashtags: ${content.hashtags.join(" ")}`);
    }
    console.log(`   URL: ${content.url}`);
    console.log("");
  }

  // Salvar conteúdo
  const data = {
    date: today.toISOString().split("T")[0],
    theme: theme.theme,
    angle: theme.angle,
    contents,
  };

  const outputDir = path.join(__dirname, "../data");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const filename = path.join(outputDir, `acquisition-${data.date}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`\n✅ Conteúdo salvo em: ${filename}`);

  return contents;
}

function generateWeeklyPlan() {
  console.log("\n\n📅 PLANO SEMANAL DE AQUISIÇÃO:\n");
  
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  
  for (let i = 0; i < 7; i++) {
    const themeIndex = i % CONTENT_THEMES.length;
    const theme = CONTENT_THEMES[themeIndex];
    console.log(`${days[i]}: ${theme.theme} — ${theme.angle}`);
  }
}

function printInstructions() {
  console.log("\n\n📋 INSTRUÇÕES DE USO:\n");
  console.log("1. Execute: node scripts/acquisition-engine.js");
  console.log("2. O conteúdo gerado está em /data/acquisition-YYYY-MM-DD.json");
  console.log("3. Use os títulos e CTAs para publicar nas plataformas");
  console.log("4. Use as UTMs para rastrear a origem dos cadastros");
  console.log("5. Acompanhe as métricas no dashboard: /dashboard");
  console.log("\n⚠️  REGRAS:");
  console.log("- Nunca publique spam");
  console.log("- Nunca envie mensagens privadas em massa");
  console.log("- Nunca adicione pessoas ao WhatsApp sem consentimento");
  console.log("- Use apenas APIs oficiais ou métodos permitidos");
  console.log("- Respeite as regras de cada plataforma");
}

// Executar
generateDailyPlan();
generateWeeklyPlan();
printInstructions();
