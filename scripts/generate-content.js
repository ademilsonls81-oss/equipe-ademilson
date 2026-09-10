/**
 * Script de geração de conteúdo para Equipe Ademilson
 * 
 * Execute: node scripts/generate-content.js
 * 
 * Gera templates de posts para blog, redes sociais e conteúdo SEO.
 * Pode ser executado manualmente ou integrado a um cron job.
 */

const SITE_URL = "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

const BLOG_POSTS = [
  {
    slug: "como-ganhar-dinheiro-gravando-videos-para-ia",
    title: "Como Ganhar Dinheiro Gravando Vídeos para IA em 2026",
    description: "Descubra como ganhar dinheiro gravando vídeos simples com o celular para treinamento de Inteligência Artificial.",
    keywords: ["ganhar dinheiro com videos", "videos para ia", "renda extra celular", "trabalhar gravando videos"],
  },
  {
    slug: "trabalho-remoto-celular-2026",
    title: "10 Formas de Trabalhar Remoto pelo Celular em 2026",
    description: "Conheça oportunidades reais de trabalho remoto usando apenas o celular, incluindo gravação de vídeos para IA.",
    keywords: ["trabalho remoto celular", "trabalhar de casa", "renda extra remoto", "emprego celular"],
  },
  {
    slug: "quanto-ganha-gravando-videos-para-ia",
    title: "Quanto Ganha Gravando Vídeos para IA? Valores Reais",
    description: "Veja quanto é possível ganhar gravando vídeos para treinamento de IA e como maximizar seus rendimentos.",
    keywords: ["quanto ganha videos ia", "ganho gravando videos", "pagamento videos ia", "renda videos inteligencia artificial"],
  },
  {
    slug: "como-funciona-projetos-gravacao-pov",
    title: "Como Funcionam os Projetos de Gravação POV para IA",
    description: "Entenda como funcionam os projetos de gravação em primeira pessoa para treinamento de modelos de IA.",
    keywords: ["projetos pov", "gravacao em primeira pessoa", "videos pov ia", "como gravar videos ia"],
  },
  {
    slug: "dicas-aprovar-videos-gravacao-ia",
    title: "10 Dicas para Aprovar seus Vídeos de Gravação para IA",
    description: "Aprenda as melhores dicas para gravar vídeos de qualidade e ser aprovado nos projetos de treinamento de IA.",
    keywords: ["dicas gravar videos", "aprovacao videos ia", "qualidade video ia", "como gravar bem"],
  },
  {
    slug: "oportunidades-emprego-remoto-2026",
    title: "Oportunidades de Emprego Remoto em 2026",
    description: "Conheça as melhores oportunidades de emprego remoto disponíveis em 2026, incluindo projetos de IA.",
    keywords: ["emprego remoto 2026", "vagas remotas", "trabalho remoto oportunidades", "emprego de casa"],
  },
  {
    slug: "como-comecar-gravar-videos-celular",
    title: "Como Começar a Gravar Vídeos com o Celular para Ganhar Dinheiro",
    description: "Guia completo para começar a gravar vídeos com o celular e ganhar dinheiro com projetos de IA.",
    keywords: ["gravar videos celular", "como gravar videos", "videos com celular", "celular para ganhar dinheiro"],
  },
  {
    slug: "beneficios-gravacao-videos-ia",
    title: "7 Benefícios de Trabalhar com Gravação de Vídeos para IA",
    description: "Descubra os benefícios de trabalhar com gravação de vídeos para treinamento de Inteligência Artificial.",
    keywords: ["beneficios videos ia", "vantagens gravacao ia", "trabalhar com ia", "videos inteligencia artificial"],
  },
];

const SOCIAL_POSTS = {
  whatsapp: [
    `🎬 Você sabia que pode ganhar dinheiro gravando vídeos com o celular?\n\n✅ Cadastro gratuito\n✅ Sem taxas\n✅ Trabalhe de casa\n✅ Pagamento em dólar\n\n👉 Entre no grupo: ${WA_GROUP}`,
    `💰 Renda extra garantida!\n\nGrave vídeos do dia a dia e ganhe em dólar. Sem experiência necessária.\n\n👉 Entre agora: ${WA_GROUP}`,
    `📱 Trabalhe de casa pelo celular\n\nOportunidade real de ganho com gravação de vídeos para IA.\n\n✅ Gratuito\n✅ Sem investimento\n\n👉 Link: ${WA_GROUP}`,
    `🔥 Nova oportunidade!\n\nGrupo nacional de gravação de vídeos para IA. Entre grátis e comece a ganhar.\n\n👉 ${WA_GROUP}`,
    `🎯 Quer ganhar dinheiro extra?\n\nGrave vídeos simples com o celular e receba em dólar.\n\n✅ 100% gratuito\n✅ Sem taxas\n\n👉 Entre: ${WA_GROUP}`,
  ],
  reddit: [
    {
      subreddit: "r/rendaextra",
      title: "Renda extra gravando vídeos para IA - funciona mesmo?",
      text: "Galera, encontrei um projeto de gravação de vídeos para treinamento de IA. É gratuito, sem taxas, e paga em dólar por hora aprovada. Alguém já experimentou? O grupo está no WhatsApp.",
    },
    {
      subreddit: "r/brdev",
      title: "Oportunidade remota: gravar vídeos para IA",
      text: "Para quem busca trabalho remoto, existe um projeto de gravação de vídeos para treinamento de modelos de IA. Não precisa de experiência, só um celular. Alguém tem informações sobre?",
    },
    {
      subreddit: "r/investimentos",
      title: "Alternativa renda passiva: vídeos para IA",
      text: "Vi um projeto onde você grava vídeos do dia a dia para treinar IA e recebe em dólar. É diferente de investimentos tradicionais, mas pode ser uma renda extra interessante.",
    },
  ],
  facebook: [
    `🎬 Ganhe dinheiro gravando vídeos com o celular!\n\n✅ Cadastro gratuito\n✅ Sem taxas\n✅ Trabalhe de casa\n✅ Pagamento em dólar\n\nEntre no grupo nacional: ${WA_GROUP}`,
    `💰 Renda extra com gravação de vídeos para IA\n\nNão precisa de experiência. Só um celular e vontade.\n\n👉 Entre grátis: ${WA_GROUP}`,
    `📱 Trabalho remoto pelo celular\n\nOportunidade real de ganho com projetos de IA.\n\n✅ Gratuito\n✅ Sem investimento\n\nLink: ${WA_GROUP}`,
  ],
  twitter: [
    `🎬 Ganhe dinheiro gravando vídeos para IA!\n\n✅ Gratuito\n✅ Sem taxas\n✅ Trabalhe de casa\n✅ Pagamento em dólar\n\n👉 ${SITE_URL}`,
    `📱 Renda extra pelo celular\n\nGrave vídeos do dia a dia e receba em dólar.\n\n✅ Sem experiência\n✅ Flexível\n\n👉 ${SITE_URL}`,
    `💰 Trabalho remoto disponível\n\nProjetos de gravação de vídeos para IA.\n\n✅ Gratuito\n✅ Paga em dólar\n\n👉 ${SITE_URL}`,
  ],
  pinterest: [
    {
      title: "Como Ganhar Dinheiro com o Celular em 2026",
      description: "Descubra como ganhar dinheiro gravando vídeos com o celular para treinamento de IA. Renda extra gratuita e flexível.",
      board: "Renda Extra",
    },
    {
      title: "Trabalho Remoto pelo Celular",
      description: "Oportunidades de trabalho remoto usando apenas o celular. Gravação de vídeos para IA com pagamento em dólar.",
      board: "Trabalho Remoto",
    },
    {
      title: "Dicas para Ganhar Dinheiro Online",
      description: "Métodos reais para ganhar dinheiro online, incluindo gravação de vídeos para treinamento de IA.",
      board: "Dinheiro Online",
    },
  ],
};

function generateBlogIndex() {
  console.log("=== POSTS DO BLOG ===\n");
  BLOG_POSTS.forEach((post, i) => {
    console.log(`${i + 1}. ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Keywords: ${post.keywords.join(", ")}`);
    console.log("");
  });
}

function generateSocialIndex() {
  console.log("\n=== POSTS PARA REDES SOCIAIS ===\n");
  
  console.log("--- WhatsApp ---");
  SOCIAL_POSTS.whatsapp.forEach((post, i) => {
    console.log(`${i + 1}. ${post.substring(0, 60)}...`);
  });
  
  console.log("\n--- Reddit ---");
  SOCIAL_POSTS.reddit.forEach((post, i) => {
    console.log(`${i + 1}. [${post.subreddit}] ${post.title}`);
  });
  
  console.log("\n--- Facebook ---");
  SOCIAL_POSTS.facebook.forEach((post, i) => {
    console.log(`${i + 1}. ${post.substring(0, 60)}...`);
  });
  
  console.log("\n--- Twitter ---");
  SOCIAL_POSTS.twitter.forEach((post, i) => {
    console.log(`${i + 1}. ${post.substring(0, 60)}...`);
  });
  
  console.log("\n--- Pinterest ---");
  SOCIAL_POSTS.pinterest.forEach((post, i) => {
    console.log(`${i + 1}. ${post.title} (${post.board})`);
  });
}

function generateContentCalendar() {
  console.log("\n=== CALENDÁRIO DE CONTEÚDO (7 dias) ===\n");
  
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const platforms = ["Blog", "WhatsApp", "Reddit", "Facebook", "Twitter", "Pinterest"];
  
  days.forEach((day, i) => {
    console.log(`${day}:`);
    console.log(`  - Blog: ${BLOG_POSTS[i]?.title || "Artigo sobre gravação de vídeos"}`);
    console.log(`  - WhatsApp: ${SOCIAL_POSTS.whatsapp[i]?.substring(0, 50)}...`);
    console.log(`  - Reddit: ${SOCIAL_POSTS.reddit[i % SOCIAL_POSTS.reddit.length]?.title}`);
    console.log(`  - Facebook: Post ${i + 1}`);
    console.log(`  - Twitter: ${SOCIAL_POSTS.twitter[i % SOCIAL_POSTS.twitter.length]?.substring(0, 50)}...`);
    console.log(`  - Pinterest: ${SOCIAL_POSTS.pinterest[i % SOCIAL_POSTS.pinterest.length]?.title}`);
    console.log("");
  });
}

console.log("🚀 Gerador de Conteúdo - Equipe Ademilson\n");
console.log(`Site: ${SITE_URL}`);
console.log(`Grupo WhatsApp: ${WA_GROUP}\n`);

generateBlogIndex();
generateSocialIndex();
generateContentCalendar();

console.log("\n✅ Conteúdo gerado com sucesso!");
console.log("\nPróximos passos:");
console.log("1. Use os títulos acima para criar os posts reais");
console.log("2. Publique nos horários de maior engajamento");
console.log("3. Acompanhe as métricas em /admin");
