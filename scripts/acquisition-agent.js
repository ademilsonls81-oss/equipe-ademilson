/**
 * ACQUISITION AGENT - Gerente de Aquisição Digital
 * 
 * Execute: node scripts/acquisition-agent.js [action]
 * 
 * Actions:
 *   analyze    - Analisar resultados e gerar recomendações
 *   generate   - Gerar calendário e conteúdos
 *   report     - Gerar relatório de performance
 *   reset      - Resetar configurações do agente
 */

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://equipe-ademilson.vercel.app";
const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";
const DATA_DIR = path.join(__dirname, "../data");
const LOGS_DIR = path.join(DATA_DIR, "logs");

// Garantir diretórios
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// ==================== UTILS ====================

function log(action, details, status = "success") {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    status,
  };
  const logFile = path.join(LOGS_DIR, `agent-${new Date().toISOString().split("T")[0]}.json`);
  let logs = [];
  if (fs.existsSync(logFile)) {
    try { logs = JSON.parse(fs.readFileSync(logFile, "utf8")); } catch {}
  }
  logs.push(entry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  console.log(`[${status.toUpperCase()}] ${action}: ${details}`);
  return entry;
}

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  try { return JSON.parse(fs.readFileSync(filepath, "utf8")); } catch { return null; }
}

function saveJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function getConfig() {
  return loadJSON("agent-config.json") || {
    enabled: true,
    lastAnalysis: null,
    lastGeneration: null,
    maxContentPerDay: 10,
    minScoreToKeep: 30,
    platforms: ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit", "whatsapp"],
  };
}

function saveConfig(config) {
  saveJSON("agent-config.json", config);
}

// ==================== ANÁLISE ====================

function analyzePerformance() {
  console.log("\n📊 ANÁLISE DE PERFORMANCE\n");
  
  const performance = loadJSON("content-performance.json") || [];
  const sessions = loadJSON("sessions.json") || [];
  const registrations = loadJSON("registrations.json") || [];
  
  // Análise por plataforma
  const byPlatform = {};
  for (const p of performance) {
    if (!byPlatform[p.platform]) {
      byPlatform[p.platform] = { count: 0, sessions: 0, registrations: 0, clicks: 0, joins: 0, avgScore: 0 };
    }
    byPlatform[p.platform].count++;
    byPlatform[p.platform].sessions += p.sessions || 0;
    byPlatform[p.platform].registrations += p.registrations || 0;
    byPlatform[p.platform].clicks += p.whatsapp_clicks || 0;
    byPlatform[p.platform].joins += p.whatsapp_joins || 0;
    byPlatform[p.platform].avgScore += p.score || 0;
  }
  
  for (const p in byPlatform) {
    byPlatform[p].avgScore = Math.round(byPlatform[p].avgScore / byPlatform[p].count);
  }
  
  // Análise por tema
  const byTheme = {};
  for (const p of performance) {
    if (!p.theme) continue;
    if (!byTheme[p.theme]) {
      byTheme[p.theme] = { count: 0, sessions: 0, registrations: 0, avgScore: 0 };
    }
    byTheme[p.theme].count++;
    byTheme[p.theme].sessions += p.sessions || 0;
    byTheme[p.theme].registrations += p.registrations || 0;
    byTheme[p.theme].avgScore += p.score || 0;
  }
  
  for (const t in byTheme) {
    byTheme[t].avgScore = Math.round(byTheme[t].avgScore / byTheme[t].count);
  }
  
  // Melhores e piores
  const sorted = [...performance].sort((a, b) => (b.score || 0) - (a.score || 0));
  const best = sorted[0] || null;
  const worst = sorted[sorted.length - 1] || null;
  
  // Melhor plataforma
  const bestPlatform = Object.entries(byPlatform).sort((a, b) => b[1].avgScore - a[1].avgScore)[0];
  const worstPlatform = Object.entries(byPlatform).sort((a, b) => a[1].avgScore - b[1].avgScore)[0];
  
  // Melhor tema
  const bestTheme = Object.entries(byTheme).sort((a, b) => b[1].avgScore - a[1].avgScore)[0];
  
  const analysis = {
    timestamp: new Date().toISOString(),
    totalContent: performance.length,
    byPlatform,
    byTheme,
    bestContent: best,
    worstContent: worst,
    bestPlatform: bestPlatform ? { name: bestPlatform[0], ...bestPlatform[1] } : null,
    worstPlatform: worstPlatform ? { name: worstPlatform[0], ...worstPlatform[1] } : null,
    bestTheme: bestTheme ? { name: bestTheme[0], ...bestTheme[1] } : null,
    recommendations: generateRecommendations(byPlatform, byTheme, best, worst),
  };
  
  saveJSON("analysis.json", analysis);
  log("analyze", `Análise completa: ${performance.length} conteúdos analisados`);
  
  return analysis;
}

function generateRecommendations(byPlatform, byTheme, best, worst) {
  const recommendations = [];
  
  // 1. Conteúdos para aumentar
  const topPlatforms = Object.entries(byPlatform)
    .sort((a, b) => b[1].avgScore - a[1].avgScore)
    .slice(0, 3);
  
  for (const [platform, data] of topPlatforms) {
    if (data.avgScore > 50) {
      recommendations.push({
        type: "increase",
        priority: "high",
        action: `Aumentar produção de conteúdos em ${platform}`,
        reason: `Plataforma com score médio de ${data.avgScore} pontos`,
        platform,
      });
    }
  }
  
  // 2. Conteúdos para reduzir
  const bottomPlatforms = Object.entries(byPlatform)
    .sort((a, b) => a[1].avgScore - b[1].avgScore)
    .slice(0, 2);
  
  for (const [platform, data] of bottomPlatforms) {
    if (data.avgScore < 30 && data.count > 3) {
      recommendations.push({
        type: "reduce",
        priority: "medium",
        action: `Reduzir conteúdos em ${platform}`,
        reason: `Plataforma com score médio de ${data.avgScore} pontos (${data.count} conteúdos)`,
        platform,
      });
    }
  }
  
  // 3. Melhores temas para expandir
  const topThemes = Object.entries(byTheme)
    .sort((a, b) => b[1].avgScore - a[1].avgScore)
    .slice(0, 2);
  
  for (const [theme, data] of topThemes) {
    if (data.avgScore > 40) {
      recommendations.push({
        type: "expand",
        priority: "high",
        action: `Expandir conteúdo sobre "${theme}"`,
        reason: `Tema com score médio de ${data.avgScore} pontos`,
        theme,
      });
    }
  }
  
  // 4. Testar novo CTA
  recommendations.push({
    type: "test",
    priority: "medium",
    action: "Testar novo CTA: 'Garanta sua vaga agora'",
    reason: "CTAs com urgência tendem a ter maior taxa de conversão",
  });
  
  // 5. Criar mais landing pages
  recommendations.push({
    type: "create",
    priority: "high",
    action: "Criar 5 novas landing pages para cidades com mais de 100k habitantes",
    reason: "Landing pages locais convertem melhor que páginas genéricas",
  });
  
  return recommendations;
}

// ==================== GERAÇÃO DE CONTEÚDO ====================

function generateContentCalendar() {
  console.log("\n📅 GERAÇÃO DE CALENDÁRIO\n");
  
  const config = getConfig();
  const analysis = loadJSON("analysis.json") || analyzePerformance();
  
  const themes = [
    { name: "Oportunidade", angle: "Apresentar nova oportunidade de ganho" },
    { name: "Tutorial", angle: "Ensinar como começar do zero" },
    { name: "Prova Social", angle: "Mostrar resultados reais" },
    { name: "Comparação", angle: "Comparar com outros trabalhos" },
    { name: "Urgência", angle: "Criar senso de urgência ético" },
    { name: "Educativo", angle: "Explicar como funciona" },
    { name: "Dica Rápida", angle: "Dar dica prática e rápida" },
  ];
  
  const platforms = analysis.bestPlatform 
    ? [analysis.bestPlatform.name, ...config.platforms.filter(p => p !== analysis.bestPlatform.name)]
    : config.platforms;
  
  const calendar = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const theme = themes[i % themes.length];
    const dayContent = [];
    
    for (const platform of platforms.slice(0, 5)) {
      const utm = `utm_source=${platform}&utm_medium=social&utm_campaign=${theme.name.toLowerCase().replace(/\s+/g, "-")}`;
      const content = {
        id: `content-${date.toISOString().split("T")[0]}-${platform}-${i}`,
        date: date.toISOString().split("T")[0],
        platform,
        theme: theme.name,
        angle: theme.angle,
        title: generateTitle(theme, platform),
        description: generateDescription(theme, platform),
        cta: generateCTA(theme, platform),
        hashtags: generateHashtags(theme, platform),
        url: `${SITE_URL}?${utm}`,
        waUrl: `${WA_GROUP}?${utm}`,
        status: "pending",
      };
      dayContent.push(content);
    }
    
    calendar.push({
      date: date.toISOString().split("T")[0],
      theme: theme.name,
      contents: dayContent,
    });
  }
  
  saveJSON("content-calendar.json", calendar);
  log("generate", `Calendário gerado: ${calendar.length} dias, ${calendar.reduce((acc, d) => acc + d.contents.length, 0)} conteúdos`);
  
  return calendar;
}

function generateTitle(theme, platform) {
  const titles = {
    "Oportunidade": {
      google: "Nova Oportunidade de Renda Extra com Gravação de Vídeos para IA",
      youtube: "Descobri uma Nova Forma de Ganhar Dinheiro com o Celular",
      tiktok: "Renda Extra que Ninguém Sabe (ainda)",
      instagram: "💰 Nova Oportunidade de Ganho",
      facebook: "Você Sabia que Pode Ganhar Dinheiro com o Celular?",
      pinterest: "Oportunidade de Renda Extra 2026",
      reddit: "Alguém mais está ganhando dinheiro com gravação de vídeos para IA?",
      whatsapp: "Oportunidade Exclusiva",
    },
    "Tutorial": {
      google: "Como Começar a Ganhar Dinheiro com Gravação de Vídeos para IA",
      youtube: "Tutorial Completo: Como Ganhar Dinheiro com Vídeos para IA",
      tiktok: "Passo a Passo para Ganhar Dinheiro com o Celular",
      instagram: "📸 Tutorial: Como Começar Agora",
      facebook: "Aprenda a Ganhar Dinheiro com o Celular em 5 Passos",
      pinterest: "Guia Completo: Renda com Vídeos para IA",
      reddit: "Guia: Como começar a gravar vídeos para IA",
      whatsapp: "Tutorial Rápido",
    },
    "Prova Social": {
      google: "Depoimentos: Quanto Ganham os Gravadores de Vídeos para IA",
      youtube: "História Real: Como Comecei a Ganhar Dinheiro com Vídeos",
      tiktok: "Meu Primeiro Mês Ganhando Dinheiro com IA",
      instagram: "📊 Resultados Reais",
      facebook: "Veja os Resultados de Quem Já Participa",
      pinterest: "Depoimentos de Sucesso",
      reddit: "Compartilhando minha experiência com gravação de vídeos para IA",
      whatsapp: "Resultados Reais",
    },
    "Comparação": {
      google: "Por que Gravar Vídeos para IA é Melhor que Uber e iFood",
      youtube: "Comparei 5 Trabalhos Remotos: Qual o Melhor?",
      tiktok: "Uber vs Vídeos IA: Qual ganha mais?",
      instagram: "⚖️ Comparação Justa",
      facebook: "Tradicional vs Digital: Qual Escolher?",
      pinterest: "Comparação de Trabalhos Remotos",
      reddit: "Comparação: gravação de vídeos para IA vs outros trabalhos remotos",
      whatsapp: "Comparação Importante",
    },
    "Urgência": {
      google: "Últimas Vagas: Grupo WhatsApp de Gravação de Vídeos",
      youtube: "Não Perca: Oportunidade Limitada de Ganhar com IA",
      tiktok: "⚡ Vagas Acabando!",
      instagram: "🚨 Última Chance",
      facebook: "Vagas Limitadas - Garanta a Sua",
      pinterest: "Oportunidade Limitada",
      reddit: "Vagas limitadas para projeto de gravação de vídeos",
      whatsapp: "⚡ Vagas Limitadas",
    },
    "Educativo": {
      google: "Como Funciona a Gravação de Vídeos para Treinamento de IA",
      youtube: "Explicando como a IA Usa Nossos Vídeos",
      tiktok: "A IA Precisa dos Seus Vídeos",
      instagram: "🤖 Entenda a IA",
      facebook: "Você Entende como a IA Aprende?",
      pinterest: "Guia Educativo: IA e Vídeos",
      reddit: "Explicação: como a IA usa vídeos para aprender",
      whatsapp: "Saiba Mais",
    },
    "Dica Rápida": {
      google: "5 Dicas para Aprovar seus Vídeos de Gravação para IA",
      youtube: "Dica Rápida: Iluminação Perfeita para Vídeos",
      tiktok: "Dica que Ninguém Te Contou",
      instagram: "💡 Dica do Dia",
      facebook: "Dica Rápida para Ganhar Mais",
      pinterest: "Dicas de Gravação",
      reddit: "Dica rápida: como melhorar a qualidade dos seus vídeos para IA",
      whatsapp: "💡 Dica Rápida",
    },
  };
  
  return titles[theme.name]?.[platform] || `${theme.angle} - Gravação de Vídeos para IA`;
}

function generateDescription(theme, platform) {
  return `Conteúdo sobre ${theme.name.toLowerCase()} para o projeto de gravação de vídeos para IA. ${theme.angle}.`;
}

function generateCTA(theme, platform) {
  const ctas = {
    whatsapp: "Entre no grupo agora",
    google: "Saiba mais em nosso site",
    youtube: "Link na descrição",
    tiktok: "Link na bio",
    instagram: "Link na bio",
    facebook: "Clique no link para saber mais",
    pinterest: "Saiba mais no site",
    reddit: "Mais informações no link",
  };
  return ctas[platform] || "Saiba mais";
}

function generateHashtags(theme, platform) {
  const base = ["#rendaextra", "#ia", "#videos", "#trabalhoremoto"];
  const themeHashtags = {
    "Oportunidade": ["#oportunidade", "#dinheiro"],
    "Tutorial": ["#tutorial", "#comofer"],
    "Prova Social": ["#resultados", "#depoimento"],
    "Comparação": ["#comparação", "#melhor"],
    "Urgência": ["#urgente", "#agora"],
    "Educativo": ["#educacao", "#aprenda"],
    "Dica Rápida": ["#dica", "#dicas"],
  };
  return [...base, ...(themeHashtags[theme.name] || [])].slice(0, 5);
}

// ==================== RELATÓRIO ====================

function generateReport() {
  console.log("\n📊 RELATÓRIO DE PERFORMANCE\n");
  
  const analysis = loadJSON("analysis.json") || analyzePerformance();
  const calendar = loadJSON("content-calendar.json") || [];
  const config = getConfig();
  
  const report = {
    timestamp: new Date().toISOString(),
    period: {
      start: calendar[0]?.date || "N/A",
      end: calendar[calendar.length - 1]?.date || "N/A",
    },
    summary: {
      totalContent: analysis.totalContent,
      bestPlatform: analysis.bestPlatform?.name || "N/A",
      bestTheme: analysis.bestTheme?.name || "N/A",
      avgScore: analysis.bestPlatform?.avgScore || 0,
    },
    platforms: analysis.byPlatform,
    themes: analysis.byTheme,
    recommendations: analysis.recommendations,
    nextActions: generateNextActions(analysis),
  };
  
  saveJSON("report.json", report);
  log("report", "Relatório gerado com sucesso");
  
  return report;
}

function generateNextActions(analysis) {
  const actions = [];
  
  // Baseado na análise
  if (analysis.bestPlatform) {
    actions.push({
      priority: 1,
      action: `Criar 5 conteúdos sobre ${analysis.bestTheme?.name || "oportunidade"} para ${analysis.bestPlatform.name}`,
      reason: `Melhor plataforma: ${analysis.bestPlatform.name} (score: ${analysis.bestPlatform.avgScore})`,
    });
  }
  
  if (analysis.worstPlatform && analysis.worstPlatform.avgScore < 20) {
    actions.push({
      priority: 2,
      action: `Revisar estratégia para ${analysis.worstPlatform.name}`,
      reason: `Plataforma com baixo desempenho (score: ${analysis.worstPlatform.avgScore})`,
    });
  }
  
  actions.push({
    priority: 3,
    action: "Reforçar landing pages com mais de 1000 visitantes",
    reason: "Aumentar conversão nas páginas já existentes",
  });
  
  actions.push({
    priority: 4,
    action: "Testar novo CTA: 'Garanta sua vaga agora'",
    reason: "CTAs com urgência tendem a converter mais",
  });
  
  actions.push({
    priority: 5,
    action: "Reduzir conteúdos com score abaixo de 30",
    reason: "Focar recursos nos formatos vencedores",
  });
  
  return actions;
}

// ==================== MAIN ====================

const action = process.argv[2] || "analyze";

console.log("🤖 ACQUISITION AGENT\n");
console.log(`Ação: ${action}`);
console.log(`Data: ${new Date().toLocaleDateString("pt-BR")}`);
console.log(`Hora: ${new Date().toLocaleTimeString("pt-BR")}\n`);

const config = getConfig();

if (!config.enabled) {
  console.log("⚠️  Agente desativado. Execute 'node scripts/acquisition-agent.js reset' para reativar.");
  process.exit(0);
}

try {
  switch (action) {
    case "analyze":
      const analysis = analyzePerformance();
      console.log("\n📋 RECOMENDAÇÕES:");
      analysis.recommendations.forEach((r, i) => {
        console.log(`  ${i + 1}. [${r.priority.toUpperCase()}] ${r.action}`);
        console.log(`     Motivo: ${r.reason}`);
      });
      break;
      
    case "generate":
      const calendar = generateContentCalendar();
      console.log("\n📅 CALENDÁRIO GERADO:");
      calendar.forEach(day => {
        console.log(`  ${day.date} (${day.theme}): ${day.contents.length} conteúdos`);
      });
      break;
      
    case "report":
      const report = generateReport();
      console.log("\n📊 RESUMO:");
      console.log(`  Período: ${report.period.start} a ${report.period.end}`);
      console.log(`  Total de conteúdos: ${report.summary.totalContent}`);
      console.log(`  Melhor plataforma: ${report.summary.bestPlatform}`);
      console.log(`  Melhor tema: ${report.summary.bestTheme}`);
      console.log("\n🎯 PRÓXIMAS AÇÕES:");
      report.nextActions.forEach(a => {
        console.log(`  ${a.priority}. ${a.action}`);
      });
      break;
      
    case "reset":
      config.enabled = true;
      config.lastAnalysis = null;
      config.lastGeneration = null;
      saveConfig(config);
      log("reset", "Configurações resetadas");
      console.log("✅ Agente reativado e configurações resetadas.");
      break;
      
    default:
      console.log("Ação desconhecida. Use: analyze, generate, report, reset");
  }
} catch (e) {
  log("error", e.message, "error");
  console.error("❌ Erro:", e.message);
}
