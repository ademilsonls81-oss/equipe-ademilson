"use client";
import { useState, useEffect } from "react";
import styles from "./content-engine.module.css";

type Dashboard = {
  topicStats: { total: number; active: number; used: number };
  draftStats: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPlatform: { platform: string; count: number }[];
    totalSessions: number;
    totalRegistrations: number;
    totalWhatsapp: number;
    totalReferrals: number;
    winners: any[];
    losers: any[];
  };
  schedule: any[];
  platformLimits: Record<string, { allowed: boolean; current: number; limit: number }>;
  recentActivity: any[];
  topPerformers: any[];
};

type Topic = { topic_id: string; title: string; description: string; category: string; relevance: number; traffic_potential: number; conversion_potential: number; priority: number; status: string };
type Draft = { draft_id: string; topic_id: string; title: string; body: string; platform: string; content_type: string; cta: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string; status: string; sessions: number; registrations: number; whatsapp_clicks: number; referrals: number; score: number; created_at: string };
type AgentMode = { testMode: boolean; autonomousMode: boolean; paused: boolean; minDataThreshold: number };
type LearningInsights = { insights: any[]; score: any; hasEnoughData: boolean; minDataThreshold: number };
type AutomationStatus = {
  mode: string;
  test_mode: boolean;
  autonomous_mode: boolean;
  paused_mode: boolean;
  queue: {
    total: number;
    draft: number;
    approved: number;
    scheduled: number;
    publishing: number;
    published: number;
    failed: number;
    paused: number;
    publishedToday: number;
    scheduledUpcoming: number;
    retryPending: number;
    byPlatform: { platform: string; total: number; published: number; failed: number; scheduled: number }[];
  };
  platforms: {
    platform: string;
    api_configured: boolean;
    enabled: boolean;
    daily_limit: number;
    total_published: number;
    total_errors: number;
    last_publish: string | null;
    today_usage: number;
  }[];
  last_cron_run: string | null;
  next_cron_run: string | null;
};

type SocialPlatformStatus = {
  platform: string;
  connected: boolean;
  accounts: { id: number; account_name: string; status: string; connected_at: string; avatar_url: string | null }[];
  api_configured: boolean;
  daily_limit: number;
};

type SocialAccount = {
  id: number;
  platform: string;
  account_name: string;
  account_id: string;
  avatar_url: string | null;
  status: string;
  connected_at: string;
  has_token: boolean;
  has_refresh: boolean;
};

type SetupInstructions = {
  title: string;
  steps: string[];
  env_vars: string[];
  notes: string[];
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "📺",
  instagram: "📷",
  facebook: "📘",
  tiktok: "🎵",
  pinterest: "📌",
  reddit: "🤖",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  pinterest: "#BD081C",
  reddit: "#FF4500",
};

const PLATFORMS = ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"];

export default function ContentEnginePage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [agentMode, setAgentMode] = useState<AgentMode | null>(null);
  const [learning, setLearning] = useState<LearningInsights | null>(null);
  const [automation, setAutomation] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatformStatus[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "learning" | "topics" | "drafts" | "schedule" | "automation" | "networks">("dashboard");
  const [showSetup, setShowSetup] = useState<string | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<SetupInstructions | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [manualConnect, setManualConnect] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({ account_name: "", api_key: "", api_secret: "", api_token: "" });

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const [dashRes, topicsRes, draftsRes, modeRes, learnRes, autoRes] = await Promise.all([
        fetch("/api/content-engine?dashboard=true", { headers }),
        fetch("/api/content-engine?topics=true", { headers }),
        fetch("/api/content-engine?drafts=true", { headers }),
        fetch("/api/content-engine?mode=true", { headers }),
        fetch("/api/content-engine?learning=true", { headers }),
        fetch("/api/content-engine?automation=true", { headers }),
      ]);
      if (dashRes.ok && topicsRes.ok && draftsRes.ok) {
        setDashboard(await dashRes.json());
        setTopics(await topicsRes.json());
        setDrafts(await draftsRes.json());
        if (modeRes.ok) setAgentMode(await modeRes.json());
        if (learnRes.ok) setLearning(await learnRes.json());
        if (autoRes.ok) setAutomation(await autoRes.json());
        setAuthed(true);
        fetchSocialData();
      } else { setError(true); }
    } catch { setError(true); }
    setLoading(false);
  }

  async function refresh() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const [dashRes, topicsRes, draftsRes, modeRes, learnRes, autoRes] = await Promise.all([
      fetch("/api/content-engine?dashboard=true", { headers }),
      fetch("/api/content-engine?topics=true", { headers }),
      fetch("/api/content-engine?drafts=true", { headers }),
      fetch("/api/content-engine?mode=true", { headers }),
      fetch("/api/content-engine?learning=true", { headers }),
      fetch("/api/content-engine?automation=true", { headers }),
    ]);
    if (dashRes.ok) setDashboard(await dashRes.json());
    if (topicsRes.ok) setTopics(await topicsRes.json());
    if (draftsRes.ok) setDrafts(await draftsRes.json());
    if (modeRes.ok) setAgentMode(await modeRes.json());
    if (learnRes.ok) setLearning(await learnRes.json());
    if (autoRes.ok) setAutomation(await autoRes.json());
  }

  async function fetchSocialData() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const [statusRes, accountsRes] = await Promise.all([
      fetch("/api/social-accounts?status=true", { headers }),
      fetch("/api/social-accounts?accounts=true", { headers }),
    ]);
    if (statusRes.ok) {
      const data = await statusRes.json();
      setSocialPlatforms(data.platforms || []);
    }
    if (accountsRes.ok) {
      const data = await accountsRes.json();
      setSocialAccounts(data.accounts || []);
    }
  }

  async function connectPlatform(platform: string) {
    setConnectingPlatform(platform);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const res = await fetch(`/api/social-accounts?connect=true&platform=${platform}`, { headers });
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else if (data.setup_required) {
        setShowSetup(platform);
        setSetupInstructions(data.instructions);
      } else if (data.error) {
        alert(data.error);
        if (data.instructions) {
          setShowSetup(platform);
          setSetupInstructions(data.instructions);
        }
      }
    } catch {
      alert("Erro ao conectar. Tente novamente.");
    }
    setConnectingPlatform(null);
  }

  async function fetchSetupInstructions(platform: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const res = await fetch(`/api/social-accounts?setup=true&platform=${platform}`, { headers });
    const data = await res.json();
    setSetupInstructions(data.instructions);
    setShowSetup(platform);
  }

  async function connectManual(platform: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    const res = await fetch("/api/social-accounts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "connect_manual",
        platform,
        account_name: manualForm.account_name || `${platform}_oficial`,
        api_key: manualForm.api_key || undefined,
        api_secret: manualForm.api_secret || undefined,
        api_token: manualForm.api_token || undefined,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setManualConnect(null);
      setManualForm({ account_name: "", api_key: "", api_secret: "", api_token: "" });
      await fetchSocialData();
    } else {
      alert(data.error || "Erro ao conectar");
    }
  }

  async function disconnectAccount(id: number) {
    if (!confirm("Tem certeza que deseja desconectar esta conta?")) return;
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/social-accounts", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "disconnect", id }),
    });
    await fetchSocialData();
  }

  async function testConnection(id: number) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    const res = await fetch("/api/social-accounts", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "test_connection", id }),
    });
    const data = await res.json();
    if (data.ok) {
      alert(`✅ Conexão OK! Conta: ${data.result.account}`);
    } else {
      alert(`❌ Falha: ${data.error}`);
    }
  }

  async function setMode(mode: "test" | "autonomous" | "paused") {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    const res = await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "set_mode", mode }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Erro ao alterar modo"); return; }
    await refresh();
  }

  async function setMinData(threshold: number) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "set_min_data", threshold }) });
    await refresh();
  }

  async function seedTopics() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "seed_topics" }) });
    await refresh();
  }

  async function generateAllPlatforms(topicId: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    for (const platform of PLATFORMS) {
      await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "generate_content", topic_id: topicId, platform }) });
    }
    await refresh();
  }

  async function approveDraft(draftId: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "approve", draft_id: draftId }) });
    await refresh();
  }

  async function updateDraftStatus(draftId: string, status: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "update_draft", draft_id: draftId, status }) });
    await refresh();
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>⚙️</div>
          <h1>CONTENT ENGINE</h1>
          <p>MOTOR DE AQUISIÇÃO</p>
          <form onSubmit={login} className={styles.loginForm}>
            <input className={styles.input} type="password" placeholder="Senha" value={auth} onChange={(e) => setAuth(e.target.value)} required />
            {error && <div className={styles.err}>Senha incorreta.</div>}
            <button type="submit" className={styles.btn} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>⚙️ CONTENT ENGINE</h1>
        <div className={styles.headerActions}>
          <a href="/admin/acquisition/campaign" className={styles.link}>🚀 Primeira Campanha</a>
          <a href="/admin/acquisition" className={styles.link}>← Command Center</a>
        </div>
      </header>

      {/* CONTROLES DE MODO */}
      <div className={styles.modeControls}>
        <div className={styles.modeButtons}>
          <button className={`${styles.modeBtn} ${agentMode?.testMode && !agentMode?.paused ? styles.modeActive : ""}`} onClick={() => setMode("test")}>🧪 MODO TESTE</button>
          <button className={`${styles.modeBtn} ${agentMode?.autonomousMode ? styles.modeActive : ""} ${!learning?.hasEnoughData ? styles.modeDisabled : ""}`} onClick={() => setMode("autonomous")} disabled={!learning?.hasEnoughData}>🤖 MODO AUTÔNOMO</button>
          <button className={`${styles.modeBtn} ${agentMode?.paused ? styles.modePaused : ""}`} onClick={() => setMode("paused")}>⏸️ PAUSAR TUDO</button>
        </div>
        <div className={styles.modeInfo}>
          <span className={`${styles.modeBadge} ${agentMode?.paused ? styles.badgePaused : agentMode?.autonomousMode ? styles.badgeAutonomous : styles.badgeTest}`}>
            {agentMode?.paused ? "PAUSADO" : agentMode?.autonomousMode ? "AUTÔNOMO" : "TESTE"}
          </span>
          {!learning?.hasEnoughData && (
            <span className={styles.modeWarning}>⚠️ Dados insuficientes para modo autônomo</span>
          )}
        </div>
        <div className={styles.minDataControl}>
          <label>Dados mínimos:</label>
          <input type="number" min="1" max="100" value={agentMode?.minDataThreshold || 5} onChange={(e) => setMinData(parseInt(e.target.value) || 5)} className={styles.minDataInput} />
        </div>
      </div>

      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "dashboard" ? styles.tabActive : ""}`} onClick={() => setActiveTab("dashboard")}>📊 Dashboard</button>
        <button className={`${styles.tab} ${activeTab === "learning" ? styles.tabActive : ""}`} onClick={() => setActiveTab("learning")}>🧠 Aprendizado</button>
        <button className={`${styles.tab} ${activeTab === "topics" ? styles.tabActive : ""}`} onClick={() => setActiveTab("topics")}>💡 Temas</button>
        <button className={`${styles.tab} ${activeTab === "drafts" ? styles.tabActive : ""}`} onClick={() => setActiveTab("drafts")}>📝 Rascunhos</button>
        <button className={`${styles.tab} ${activeTab === "schedule" ? styles.tabActive : ""}`} onClick={() => setActiveTab("schedule")}>📅 Agenda</button>
        <button className={`${styles.tab} ${activeTab === "automation" ? styles.tabActive : ""}`} onClick={() => setActiveTab("automation")}>🤖 Automação</button>
        <button className={`${styles.tab} ${activeTab === "networks" ? styles.tabActive : ""}`} onClick={() => { setActiveTab("networks"); fetchSocialData(); }}>🔗 Conectar Redes</button>
      </nav>

      {activeTab === "dashboard" && dashboard && (
        <div className={styles.content}>
          <div className={styles.grid5}>
            <div className={styles.cardBig}><div className={styles.cardIcon}>💡</div><div className={styles.cardValue}>{dashboard.topicStats.total}</div><div className={styles.cardLabel}>Temas</div></div>
            <div className={`${styles.cardBig} ${styles.cardGreen}`}><div className={styles.cardIcon}>📝</div><div className={styles.cardValue}>{dashboard.draftStats.total}</div><div className={styles.cardLabel}>Rascunhos</div></div>
            <div className={`${styles.cardBig} ${styles.cardYellow}`}><div className={styles.cardIcon}>👁️</div><div className={styles.cardValue}>{dashboard.draftStats.totalSessions}</div><div className={styles.cardLabel}>Visitantes</div></div>
            <div className={`${styles.cardBig} ${styles.cardPurple}`}><div className={styles.cardIcon}>📋</div><div className={styles.cardValue}>{dashboard.draftStats.totalRegistrations}</div><div className={styles.cardLabel}>Cadastros</div></div>
            <div className={`${styles.cardBig} ${styles.cardGold}`}><div className={styles.cardIcon}>📱</div><div className={styles.cardValue}>{dashboard.draftStats.totalWhatsapp}</div><div className={styles.cardLabel}>WhatsApp</div></div>
          </div>
          <div className={styles.section}>
            <h2>📊 STATUS DOS CONTEÚDOS</h2>
            <div className={styles.statusGrid}>
              {dashboard.draftStats.byStatus.map(s => (<div key={s.status} className={styles.statusCard}><div className={styles.statusCount}>{s.count}</div><div className={styles.statusLabel}>{s.status}</div></div>))}
            </div>
          </div>
          <div className={styles.section}>
            <h2>📱 LIMITES POR PLATAFORMA</h2>
            <div className={styles.limitsGrid}>
              {Object.entries(dashboard.platformLimits).map(([platform, limit]) => (
                <div key={platform} className={`${styles.limitCard} ${limit.allowed ? styles.limitOk : styles.limitExceeded}`}>
                  <div className={styles.limitPlatform}>{platform}</div>
                  <div className={styles.limitCount}>{limit.current}/{limit.limit}</div>
                  <div className={styles.limitStatus}>{limit.allowed ? "OK" : "LIMITE"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "learning" && learning && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>🧠 INSIGHTS DO APRENDIZADO</h2>
            {!learning.hasEnoughData && <div className={styles.warningBox}>⚠️ Dados insuficientes para decisões automáticas. Publicize mais conteúdos.</div>}
            {learning.insights.map((insight: any, i: number) => (
              <div key={i} className={`${styles.insightCard} ${styles[`insight${insight.priority}`]}`}>
                <div className={styles.insightType}>{insight.type}</div>
                <div className={styles.insightText}>{insight.insight}</div>
              </div>
            ))}
          </div>
          <div className={styles.section}>
            <h2>📊 ACQUISITION SCORE (Ponderado)</h2>
            <p className={styles.sectionDesc}>{"Prioridade: MEMBROS (40%) > WHATSAPP (30%) > CADASTROS (20%) > VISITANTES (10%)"}</p>
            {learning.score.byTheme.length > 0 && (
              <div className={styles.subsection}>
                <h3>Por Tema</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Tema</th><th>Conteúdos</th><th>Visitantes</th><th>Cadastros</th><th>WhatsApp</th><th>Membros</th><th>Score</th></tr></thead>
                    <tbody>{learning.score.byTheme.map((t: any) => (<tr key={t.topic_id}><td style={{ fontWeight: 700 }}>{t.theme}</td><td>{t.content_count}</td><td>{t.total_sessions}</td><td>{t.total_registrations}</td><td>{t.total_whatsapp}</td><td style={{ color: "#4ade80", fontWeight: 700 }}>{t.total_referrals}</td><td style={{ color: "var(--gold)", fontWeight: 700 }}>{t.score}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {learning.score.byPlatform.length > 0 && (
              <div className={styles.subsection}>
                <h3>Por Plataforma</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Plataforma</th><th>Conteúdos</th><th>Visitantes</th><th>Cadastros</th><th>WhatsApp</th><th>Membros</th><th>Score</th></tr></thead>
                    <tbody>{learning.score.byPlatform.map((p: any) => (<tr key={p.platform}><td style={{ fontWeight: 700 }}>{p.platform}</td><td>{p.content_count}</td><td>{p.total_sessions}</td><td>{p.total_registrations}</td><td>{p.total_whatsapp}</td><td style={{ color: "#4ade80", fontWeight: 700 }}>{p.total_referrals}</td><td style={{ color: "var(--gold)", fontWeight: 700 }}>{p.score}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {learning.score.byCampaign.length > 0 && (
              <div className={styles.subsection}>
                <h3>Por Campanha</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Campanha</th><th>Conteúdos</th><th>Visitantes</th><th>Cadastros</th><th>WhatsApp</th><th>Membros</th><th>Score</th></tr></thead>
                    <tbody>{learning.score.byCampaign.map((c: any) => (<tr key={c.utm_campaign}><td style={{ fontWeight: 700 }}>{c.utm_campaign}</td><td>{c.content_count}</td><td>{c.total_sessions}</td><td>{c.total_registrations}</td><td>{c.total_whatsapp}</td><td style={{ color: "#4ade80", fontWeight: 700 }}>{c.total_referrals}</td><td style={{ color: "var(--gold)", fontWeight: 700 }}>{c.score}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {learning.score.byCTA && learning.score.byCTA.length > 0 && (
              <div className={styles.subsection}>
                <h3>Por CTA</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>CTA</th><th>Conteúdos</th><th>Visitantes</th><th>Cadastros</th><th>WhatsApp</th><th>Membros</th><th>Score</th></tr></thead>
                    <tbody>{learning.score.byCTA.map((c: any) => (<tr key={c.cta}><td style={{ fontWeight: 700 }}>{c.cta}</td><td>{c.content_count}</td><td>{c.total_sessions}</td><td>{c.total_registrations}</td><td>{c.total_whatsapp}</td><td style={{ color: "#4ade80", fontWeight: 700 }}>{c.total_referrals}</td><td style={{ color: "var(--gold)", fontWeight: 700 }}>{c.score}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {learning.score.byLandingPage && learning.score.byLandingPage.length > 0 && (
              <div className={styles.subsection}>
                <h3>Por Landing Page</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Landing Page</th><th>Conteúdos</th><th>Visitantes</th><th>Cadastros</th><th>WhatsApp</th><th>Membros</th><th>Score</th></tr></thead>
                    <tbody>{learning.score.byLandingPage.map((l: any) => (<tr key={l.landing_page}><td style={{ fontWeight: 700 }}>{l.landing_page}</td><td>{l.content_count}</td><td>{l.total_sessions}</td><td>{l.total_registrations}</td><td>{l.total_whatsapp}</td><td style={{ color: "#4ade80", fontWeight: 700 }}>{l.total_referrals}</td><td style={{ color: "var(--gold)", fontWeight: 700 }}>{l.score}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {learning.score.byTheme.length === 0 && learning.score.byPlatform.length === 0 && (
              <div className={styles.emptyState}><p>Nenhum dado de performance ainda.</p><p>Publique conteúdos e aguarde resultados reais.</p></div>
            )}
          </div>
        </div>
      )}

      {activeTab === "topics" && (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2>💡 OPORTUNIDADES / TEMAS</h2>
            <button className={styles.btnSmall} onClick={seedTopics}>🌱 Carregar Temas Iniciais</button>
          </div>
          {topics.length === 0 ? (<div className={styles.emptyState}><p>Nenhum tema cadastrado.</p></div>) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Tema</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>{topics.map(t => (<tr key={t.topic_id}><td style={{ fontWeight: 700 }}>{t.title}</td><td>{t.category}</td><td style={{ fontWeight: 700, color: "var(--gold)" }}>{t.priority}</td><td><span className={`${styles.badge} ${styles[`badge${t.status}`]}`}>{t.status}</span></td><td><button className={styles.btnTiny} onClick={() => generateAllPlatforms(t.topic_id)}>Gerar Todos</button></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "drafts" && (
        <div className={styles.content}>
          <h2>📝 RASCUNHOS</h2>
          {drafts.length === 0 ? (<div className={styles.emptyState}><p>Nenhum rascunho criado.</p></div>) : (
            <div className={styles.draftsList}>
              {drafts.map(d => (
                <div key={d.draft_id} className={styles.draftCard}>
                  <div className={styles.draftHeader}><span className={styles.draftPlatform}>{d.platform}</span><span className={`${styles.badge} ${styles[`badge${d.status}`]}`}>{d.status}</span></div>
                  <h3 className={styles.draftTitle}>{d.title}</h3>
                  <p className={styles.draftBody}>{d.body?.substring(0, 120)}...</p>
                  <div className={styles.draftMeta}><span>UTM: {d.utm_campaign}</span><span>Score: {d.score}</span></div>
                  <div className={styles.draftActions}>
                    {d.status === "gerado" && <button className={styles.btnTiny} onClick={() => approveDraft(d.draft_id)}>✅ Aprovar</button>}
                    {d.status === "aprovado" && <button className={styles.btnTiny} onClick={() => updateDraftStatus(d.draft_id, "publicado")}>🚀 Publicar</button>}
                    {d.status === "publicado" && <button className={styles.btnTiny} onClick={() => updateDraftStatus(d.draft_id, "medindo")}>📊 Medir</button>}
                    {d.status === "medindo" && (<><button className={styles.btnTinyGreen} onClick={() => updateDraftStatus(d.draft_id, "vencedor")}>🏆 Vencedor</button><button className={styles.btnTinyRed} onClick={() => updateDraftStatus(d.draft_id, "fraco")}>⚠️ Fraco</button></>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className={styles.content}>
          <h2>📅 AGENDA DE PUBLICAÇÕES</h2>
          {dashboard && dashboard.schedule.length === 0 ? (<div className={styles.emptyState}><p>Nenhuma publicação agendada.</p></div>) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Título</th><th>Plataforma</th><th>Agendado</th><th>Status</th></tr></thead>
                <tbody>{dashboard?.schedule.map((s: any) => (<tr key={s.schedule_id}><td style={{ fontWeight: 700 }}>{s.title}</td><td>{s.platform}</td><td>{new Date(s.scheduled_for).toLocaleString("pt-BR")}</td><td>{s.status}</td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "automation" && automation && (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>🤖 STATUS DA AUTOMAÇÃO</h2>
            <div className={styles.grid5}>
              <div className={`${styles.cardBig} ${automation.autonomous_mode ? styles.cardGreen : automation.paused_mode ? "" : ""}`}>
                <div className={styles.cardIcon}>{automation.autonomous_mode ? "🟢" : automation.paused_mode ? "🔴" : "🟡"}</div>
                <div className={styles.cardValue} style={{ color: automation.autonomous_mode ? "#4ade80" : automation.paused_mode ? "#ef4444" : "#60a5fa" }}>
                  {automation.mode.toUpperCase()}
                </div>
                <div className={styles.cardLabel}>Modo Atual</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>📋</div>
                <div className={styles.cardValue}>{automation.queue.total || 0}</div>
                <div className={styles.cardLabel}>Itens na Fila</div>
              </div>
              <div className={`${styles.cardBig} ${styles.cardGreen}`}>
                <div className={styles.cardIcon}>✅</div>
                <div className={styles.cardValue}>{automation.queue.published || 0}</div>
                <div className={styles.cardLabel}>Publicados</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>📅</div>
                <div className={styles.cardValue}>{automation.queue.scheduled || 0}</div>
                <div className={styles.cardLabel}>Agendados</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>⏳</div>
                <div className={styles.cardValue}>{automation.queue.draft || 0}</div>
                <div className={styles.cardLabel}>Rascunhos</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>📊 FILA POR STATUS</h2>
            <div className={styles.statusGrid}>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.draft || 0}</div><div className={styles.statusLabel}>Draft</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.approved || 0}</div><div className={styles.statusLabel}>Aprovado</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.scheduled || 0}</div><div className={styles.statusLabel}>Agendado</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.publishing || 0}</div><div className={styles.statusLabel}>Publicando</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.published || 0}</div><div className={styles.statusLabel}>Publicado</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.failed || 0}</div><div className={styles.statusLabel}>Falhou</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.paused || 0}</div><div className={styles.statusLabel}>Pausado</div></div>
              <div className={styles.statusCard}><div className={styles.statusCount}>{automation.queue.publishedToday || 0}</div><div className={styles.statusLabel}>Hoje</div></div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>📱 PLATAFORMAS</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Plataforma</th><th>API</th><th>Status</th><th>Limite/Dia</th><th>Usados Hoje</th><th>Total Pub.</th><th>Erros</th><th>Última Pub.</th></tr>
                </thead>
                <tbody>
                  {automation.platforms.map((p) => (
                    <tr key={p.platform}>
                      <td style={{ fontWeight: 700 }}>{p.platform}</td>
                      <td>{p.api_configured ? "✅ Configurada" : "❌ Não configurada"}</td>
                      <td>
                        <span className={`${styles.badge} ${p.enabled ? styles.badgeaprovado : styles.badgefraco}`}>
                          {p.enabled ? "ATIVADA" : "DESATIVADA"}
                        </span>
                      </td>
                      <td>{p.daily_limit}</td>
                      <td>{p.today_usage}/{p.daily_limit}</td>
                      <td>{p.total_published}</td>
                      <td style={{ color: p.total_errors > 0 ? "#ef4444" : undefined }}>{p.total_errors}</td>
                      <td>{p.last_publish ? new Date(p.last_publish).toLocaleString("pt-BR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <h2>⏰ CRON JOBS</h2>
            <div className={styles.grid5} style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>🔄</div>
                <div className={styles.cardValue} style={{ fontSize: "16px" }}>
                  {automation.last_cron_run ? new Date(automation.last_cron_run).toLocaleString("pt-BR") : "Nunca executado"}
                </div>
                <div className={styles.cardLabel}>Última Execução</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>⏭️</div>
                <div className={styles.cardValue} style={{ fontSize: "16px" }}>
                  {automation.next_cron_run ? new Date(automation.next_cron_run).toLocaleString("pt-BR") : "A cada 15 min"}
                </div>
                <div className={styles.cardLabel}>Próxima Execução</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>📊 FILA POR PLATAFORMA</h2>
            {automation.queue.byPlatform && automation.queue.byPlatform.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Plataforma</th><th>Total</th><th>Publicados</th><th>Falhou</th><th>Agendados</th></tr></thead>
                  <tbody>
                    {automation.queue.byPlatform.map((p) => (
                      <tr key={p.platform}>
                        <td style={{ fontWeight: 700 }}>{p.platform}</td>
                        <td>{p.total}</td>
                        <td style={{ color: "#4ade80" }}>{p.published}</td>
                        <td style={{ color: p.failed > 0 ? "#ef4444" : undefined }}>{p.failed}</td>
                        <td>{p.scheduled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}><p>Nenhum item na fila por plataforma.</p></div>
            )}
          </div>
        </div>
      )}

      {activeTab === "networks" && (
        <div className={styles.content}>
          {/* Status das Plataformas */}
          <div className={styles.section}>
            <h2>🔗 CONECTAR REDES SOCIAIS</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Conecte as contas oficiais da <strong>Equipe Ademilson</strong> para publicação automática de conteúdo.
            </p>

            <div className={styles.networkGrid}>
              {["youtube", "instagram", "facebook", "tiktok", "pinterest", "reddit"].map((platform) => {
                const status = socialPlatforms.find(p => p.platform === platform);
                const isConnected = status?.connected || false;
                const accounts = status?.accounts || [];
                const platformAccounts = socialAccounts.filter(a => a.platform === platform);

                return (
                  <div key={platform} className={`${styles.networkCard} ${isConnected ? styles.networkConnected : ""}`}>
                    <div className={styles.networkHeader}>
                      <span className={styles.networkIcon} style={{ color: PLATFORM_COLORS[platform] }}>
                        {PLATFORM_ICONS[platform]}
                      </span>
                      <span className={styles.networkName}>{platform.toUpperCase()}</span>
                      <span className={`${styles.networkBadge} ${isConnected ? styles.networkBadgeOk : styles.networkBadgeOff}`}>
                        {isConnected ? "🟢 Conectada" : "🔴 Não configurada"}
                      </span>
                    </div>

                    {isConnected && accounts.length > 0 && (
                      <div className={styles.networkAccount}>
                        <span>{accounts[0].account_name}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Conectada em {new Date(accounts[0].connected_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    <div className={styles.networkInfo}>
                      <div><strong>API:</strong> {status?.api_configured ? "✅ Configurada" : "❌ Não configurada"}</div>
                      <div><strong>Limite:</strong> {status?.daily_limit || 0}/dia</div>
                      <div><strong>Contas:</strong> {platformAccounts.length}</div>
                    </div>

                    <div className={styles.networkActions}>
                      {!isConnected ? (
                        <>
                          <button
                            className={styles.btnConnect}
                            onClick={() => connectPlatform(platform)}
                            disabled={connectingPlatform === platform}
                          >
                            {connectingPlatform === platform ? "Conectando..." : "🔗 CONECTAR"}
                          </button>
                          <button
                            className={styles.btnSetup}
                            onClick={() => fetchSetupInstructions(platform)}
                          >
                            📋 Instruções
                          </button>
                          <button
                            className={styles.btnManual}
                            onClick={() => setManualConnect(manualConnect === platform ? null : platform)}
                          >
                            ⚙️ Manual
                          </button>
                        </>
                      ) : (
                        <>
                          {platformAccounts.map((acc) => (
                            <div key={acc.id} className={styles.accountActions}>
                              <button className={styles.btnTest} onClick={() => testConnection(acc.id)}>
                                🔍 Testar
                              </button>
                              <button className={styles.btnDisconnect} onClick={() => disconnectAccount(acc.id)}>
                                ⏏️ Desconectar
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Formulário de conexão manual */}
                    {manualConnect === platform && (
                      <div className={styles.manualForm}>
                        <h4>⚙️ Conexão Manual</h4>
                        <input
                          className={styles.input}
                          placeholder="Nome da conta"
                          value={manualForm.account_name}
                          onChange={(e) => setManualForm({ ...manualForm, account_name: e.target.value })}
                        />
                        <input
                          className={styles.input}
                          placeholder="API Key (opcional)"
                          value={manualForm.api_key}
                          onChange={(e) => setManualForm({ ...manualForm, api_key: e.target.value })}
                        />
                        <input
                          className={styles.input}
                          placeholder="Access Token"
                          value={manualForm.api_token}
                          onChange={(e) => setManualForm({ ...manualForm, api_token: e.target.value })}
                        />
                        <input
                          className={styles.input}
                          placeholder="API Secret (opcional)"
                          value={manualForm.api_secret}
                          onChange={(e) => setManualForm({ ...manualForm, api_secret: e.target.value })}
                        />
                        <div className={styles.manualActions}>
                          <button className={styles.btnConnect} onClick={() => connectManual(platform)}>
                            💾 Salvar
                          </button>
                          <button className={styles.btnSetup} onClick={() => setManualConnect(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instruções de Setup */}
          {showSetup && setupInstructions && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>📋 {setupInstructions.title}</h2>
                <button className={styles.btnSmall} onClick={() => { setShowSetup(null); setSetupInstructions(null); }}>✕ Fechar</button>
              </div>

              <div className={styles.setupBox}>
                <h3>Passos:</h3>
                <ol className={styles.setupSteps}>
                  {setupInstructions.steps.map((step, i) => (
                    <li key={i}>{step.replace(/^\d+\.\s*/, "")}</li>
                  ))}
                </ol>

                {setupInstructions.env_vars.length > 0 && (
                  <div className={styles.setupEnvVars}>
                    <h4>Environment Variables necessárias:</h4>
                    <div className={styles.envVarList}>
                      {setupInstructions.env_vars.map((v) => (
                        <code key={v} className={styles.envVar}>{v}</code>
                      ))}
                    </div>
                  </div>
                )}

                {setupInstructions.notes.length > 0 && (
                  <div className={styles.setupNotes}>
                    <h4>⚠️ Notas importantes:</h4>
                    <ul>
                      {setupInstructions.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className={styles.section}>
            <h2>📊 RESUMO</h2>
            <div className={styles.grid5} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className={`${styles.cardBig} ${styles.cardGreen}`}>
                <div className={styles.cardIcon}>🔗</div>
                <div className={styles.cardValue}>{socialPlatforms.filter(p => p.connected).length}/6</div>
                <div className={styles.cardLabel}>Conectadas</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>🤖</div>
                <div className={styles.cardValue}>{socialPlatforms.filter(p => p.api_configured).length}/6</div>
                <div className={styles.cardLabel}>API Configurada</div>
              </div>
              <div className={styles.cardBig}>
                <div className={styles.cardIcon}>📝</div>
                <div className={styles.cardValue}>0</div>
                <div className={styles.cardLabel}>Publicações Automáticas</div>
              </div>
            </div>

            <div className={styles.warningBox}>
              ⚠️ <strong>Modo atual:</strong> Publicação automática <strong>NÃO ATIVADA</strong>.<br />
              Após conectar as contas, o sistema ficará pronto para publicar quando você ativar o modo autônomo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
