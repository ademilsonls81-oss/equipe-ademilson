/**
 * Automação de Publicação nas Redes Sociais
 * 
 * Execute: node scripts/social-media-scheduler.js
 * 
 * Gera posts agendados para diferentes plataformas.
 * Pode ser integrado com APIs de automação como Buffer, Hootsuite, ou IFTTT.
 */

const SITE_URL = "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

const CONTENT_CALENDAR = [
  // SEGUNDA
  {
    day: "Segunda",
    blog: {
      title: "Como Ganhar Dinheiro Gravando Vídeos para IA",
      slug: "como-ganhar-dinheiro-gravando-videos-para-ia",
    },
    whatsapp: `🎬 Comece a semana com uma oportunidade!\n\nVocê sabia que pode ganhar dinheiro gravando vídeos com o celular?\n\n✅ Cadastro gratuito\n✅ Sem taxas\n✅ Trabalhe de casa\n✅ Pagamento em dólar\n\n👉 Entre no grupo: ${WA_GROUP}`,
    reddit: {
      subreddit: "r/rendaextra",
      title: "Renda extra gravando vídeos para IA - experiência real",
      text: "Comecei a gravar vídeos para treinamento de IA e já estou recebendo. É gratuito, sem taxas, e paga em dólar por hora aprovada. Alguém mais está fazendo?",
    },
    facebook: `🎬 Nova semana, nova oportunidade!\n\nGanhe dinheiro gravando vídeos com o celular. Cadastro gratuito, sem taxas.\n\n👉 Entre no grupo: ${WA_GROUP}`,
    twitter: `💰 Comece a semana ganhando dinheiro!\n\nGrave vídeos para IA com o celular. Gratuito e sem taxas.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Como Ganhar Dinheiro com o Celular",
      description: "Descubra como ganhar dinheiro gravando vídeos com o celular para treinamento de IA. Renda extra gratuita.",
    },
  },
  // TERÇA
  {
    day: "Terça",
    blog: {
      title: "10 Formas de Trabalhar Remoto pelo Celular",
      slug: "trabalho-remoto-celular-2026",
    },
    whatsapp: `📱 Trabalho remoto pelo celular!\n\n10 formas de ganhar dinheiro de casa, incluindo gravação de vídeos para IA.\n\n✅ Gratuito\n✅ Sem experiência\n✅ Flexível\n\n👉 ${WA_GROUP}`,
    reddit: {
      subreddit: "r/brdev",
      title: "Trabalho remoto pelo celular - dicas reais",
      text: "Para quem busca trabalho remoto, compilei formas de ganhar dinheiro pelo celular, incluindo projetos de gravação de vídeos para IA.",
    },
    facebook: `📱 Trabalho remoto disponível!\n\n10 formas de ganhar dinheiro pelo celular. Uma delas é gravação de vídeos para IA.\n\n👉 ${WA_GROUP}`,
    twitter: `📱 10 formas de trabalhar remoto pelo celular\n\nUma delas é gravação de vídeos para IA. Gratuito e sem taxas.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Trabalho Remoto pelo Celular 2026",
      description: "10 formas de trabalhar remoto usando apenas o celular. Oportunidades reais de ganho.",
    },
  },
  // QUARTA
  {
    day: "Quarta",
    blog: {
      title: "Quanto Ganha Gravando Vídeos para IA",
      slug: "quanto-ganha-gravando-videos-para-ia",
    },
    whatsapp: `💰 Quanto dá para ganhar?\n\nVeja os valores reais de gravação de vídeos para IA:\n\n💵 US$ 5 por hora aprovada\n📱 Só precisa de um celular\n🏠 Trabalhe de casa\n\n👉 Saiba mais: ${WA_GROUP}`,
    reddit: {
      subreddit: "r/investimentos",
      title: "Quanto ganha gravando vídeos para IA?",
      text: "Vi um projeto de gravação de vídeos para IA que paga em dólar. Alguém sabe quanto dá para ganhar por mês?",
    },
    facebook: `💰 Quanto dá para ganhar gravando vídeos?\n\nVeja os valores reais e como começar.\n\n✅ US$ 5 por hora aprovada\n✅ Gratuito\n\n👉 ${WA_GROUP}`,
    twitter: `💰 Quanto ganha gravando vídeos para IA?\n\nUS$ 5 por hora aprovada. Só precisa de um celular.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Quanto Ganha Gravando Vídeos para IA",
      description: "Valores reais de quanto é possível ganhar gravando vídeos para treinamento de IA.",
    },
  },
  // QUINTA
  {
    day: "Quinta",
    blog: {
      title: "Como Funcionam os Projetos de Gravação POV",
      slug: "como-funciona-projetos-gravacao-pov",
    },
    whatsapp: `🎯 Como funcionam os projetos POV?\n\nEntenda como gravar vídeos em primeira pessoa para treinar IA:\n\n1️⃣ Entre no grupo\n2️⃣ Escolha um projeto\n3️⃣ Grave com o celular\n4️⃣ Envie e receba\n\n👉 ${WA_GROUP}`,
    reddit: {
      subreddit: "r/rendaextra",
      title: "Como funcionam os projetos de gravação POV para IA",
      text: "Explicação completa de como funcionam os projetos de gravação em primeira pessoa para treinamento de IA.",
    },
    facebook: `🎯 Como funcionam os projetos POV?\n\nEntenda passo a passo como gravar vídeos para IA.\n\n👉 ${WA_GROUP}`,
    twitter: `🎯 Projetos de gravação POV para IA\n\nPasso a passo completo. Gratuito e sem taxas.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Como Funcionam os Projetos POV para IA",
      description: "Guia completo de como funcionam os projetos de gravação em primeira pessoa para treinamento de IA.",
    },
  },
  // SEXTA
  {
    day: "Sexta",
    blog: {
      title: "10 Dicas para Aprovar seus Vídeos",
      slug: "dicas-aprovar-videos-gravacao-ia",
    },
    whatsapp: `✅ 10 dicas para aprovar seus vídeos!\n\nAumente suas chances de aprovação nos projetos de IA:\n\n1️⃣ Boa iluminação\n2️⃣ Áudio claro\n3️⃣ Estabilidade\n4️⃣ E mais 7 dicas...\n\n👉 ${WA_GROUP}`,
    reddit: {
      subreddit: "r/brdev",
      title: "Dicas para aprovar vídeos de gravação para IA",
      text: "Compilei 10 dicas para quem quer ter seus vídeos aprovados nos projetos de treinamento de IA.",
    },
    facebook: `✅ 10 dicas para aprovar seus vídeos!\n\nAumente suas chances de aprovação.\n\n👉 ${WA_GROUP}`,
    twitter: `✅ 10 dicas para aprovar seus vídeos de IA\n\nAumente suas chances de aprovação.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Dicas para Aprovar Vídeos de Gravação para IA",
      description: "10 dicas essenciais para ter seus vídeos aprovados nos projetos de treinamento de IA.",
    },
  },
  // SÁBADO
  {
    day: "Sábado",
    blog: {
      title: "Oportunidades de Emprego Remoto em 2026",
      slug: "oportunidades-emprego-remoto-2026",
    },
    whatsapp: `🎯 Oportunidades de emprego remoto!\n\nVeja as melhores vagas disponíveis, incluindo gravação de vídeos para IA.\n\n✅ De casa\n✅ Pelo celular\n✅ Flexível\n\n👉 ${WA_GROUP}`,
    reddit: {
      subreddit: "r/rendaextra",
      title: "Melhores oportunidades remotas de 2026",
      text: "Compilei as melhores oportunidades de trabalho remoto de 2026, incluindo projetos de gravação de vídeos para IA.",
    },
    facebook: `🎯 Oportunidades de emprego remoto!\n\nVeja as melhores vagas disponíveis.\n\n👉 ${WA_GROUP}`,
    twitter: `🎯 Melhores oportunidades remotas de 2026\n\nGravação de vídeos para IA está entre elas.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Oportunidades de Emprego Remoto 2026",
      description: "As melhores oportunidades de trabalho remoto disponíveis em 2026.",
    },
  },
  // DOMINGO
  {
    day: "Domingo",
    blog: {
      title: "Como Começar a Gravar Vídeos com o Celular",
      slug: "como-comecar-gravar-videos-celular",
    },
    whatsapp: `📱 Comece a gravar vídeos com o celular!\n\nGuia completo para começar a ganhar dinheiro com gravação de vídeos para IA.\n\n✅ Gratuito\n✅ Passo a passo\n✅ Sem investimento\n\n👉 ${WA_GROUP}`,
    reddit: {
      subreddit: "r/investimentos",
      title: "Guia: como começar a gravar vídeos para IA",
      text: "Guia completo para quem quer começar a ganhar dinheiro gravando vídeos para treinamento de IA.",
    },
    facebook: `📱 Comece a gravar vídeos com o celular!\n\nGuia completo para iniciantes.\n\n👉 ${WA_GROUP}`,
    twitter: `📱 Guia completo: como começar a gravar vídeos para IA\n\nDo zero ao primeiro pagamento.\n\n👉 ${SITE_URL}`,
    pinterest: {
      title: "Como Começar a Gravar Vídeos para IA",
      description: "Guia completo para iniciantes: como começar a ganhar dinheiro gravando vídeos para IA.",
    },
  },
];

function generateSchedule() {
  console.log("📅 CALENDÁRIO DE PUBLICAÇÃO - 7 DIAS\n");
  
  CONTENT_CALENDAR.forEach((day) => {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📆 ${day.day.toUpperCase()}`);
    console.log(`${"=".repeat(50)}`);
    
    console.log(`\n📝 Blog: ${day.blog.title}`);
    console.log(`   URL: ${SITE_URL}/blog/${day.blog.slug}`);
    
    console.log(`\n💬 WhatsApp:`);
    console.log(`   ${day.whatsapp.substring(0, 80)}...`);
    
    console.log(`\n🔴 Reddit: [${day.reddit.subreddit}]`);
    console.log(`   ${day.reddit.title}`);
    
    console.log(`\n📘 Facebook:`);
    console.log(`   ${day.facebook.substring(0, 80)}...`);
    
    console.log(`\n🐦 Twitter:`);
    console.log(`   ${day.twitter.substring(0, 80)}...`);
    
    console.log(`\n📌 Pinterest: ${day.pinterest.title}`);
  });
}

function generateAPIFormat() {
  console.log("\n\n🔧 FORMATO PARA API DE AUTOMAÇÃO\n");
  console.log("Use este formato para integrar com APIs como Buffer, Hootsuite, ou IFTTT:\n");
  
  const apiData = CONTENT_CALENDAR.map((day) => ({
    day: day.day,
    posts: {
      whatsapp: day.whatsapp,
      reddit: day.reddit,
      facebook: day.facebook,
      twitter: day.twitter,
      pinterest: day.pinterest,
    },
  }));
  
  console.log(JSON.stringify(apiData, null, 2));
}

console.log("🚀 Agendador de Redes Sociais - Equipe Ademilson\n");
console.log(`Site: ${SITE_URL}`);
console.log(`Grupo WhatsApp: ${WA_GROUP}\n`);

generateSchedule();
generateAPIFormat();

console.log("\n✅ Calendário gerado com sucesso!");
console.log("\nPróximos passos:");
console.log("1. Use os posts acima para publicar manualmente");
console.log("2. Ou integre com uma API de automação");
console.log("3. Publique nos horários de maior engajamento");
console.log("4. Acompanhe as métricas em /admin");
