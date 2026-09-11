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

const PLATFORMS = ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"];

export default function ContentEnginePage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [agentMode, setAgentMode] = useState<AgentMode | null>(null);
  const [learning, setLearning] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "learning" | "topics" | "drafts" | "schedule">("dashboard");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const [dashRes, topicsRes, draftsRes, modeRes, learnRes] = await Promise.all([
        fetch("/api/content-engine?dashboard=true", { headers }),
        fetch("/api/content-engine?topics=true", { headers }),
        fetch("/api/content-engine?drafts=true", { headers }),
        fetch("/api/content-engine?mode=true", { headers }),
        fetch("/api/content-engine?learning=true", { headers }),
      ]);
      if (dashRes.ok && topicsRes.ok && draftsRes.ok) {
        setDashboard(await dashRes.json());
        setTopics(await topicsRes.json());
        setDrafts(await draftsRes.json());
        if (modeRes.ok) setAgentMode(await modeRes.json());
        if (learnRes.ok) setLearning(await learnRes.json());
        setAuthed(true);
      } else { setError(true); }
    } catch { setError(true); }
    setLoading(false);
  }

  async function refresh() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const [dashRes, topicsRes, draftsRes, modeRes, learnRes] = await Promise.all([
      fetch("/api/content-engine?dashboard=true", { headers }),
      fetch("/api/content-engine?topics=true", { headers }),
      fetch("/api/content-engine?drafts=true", { headers }),
      fetch("/api/content-engine?mode=true", { headers }),
      fetch("/api/content-engine?learning=true", { headers }),
    ]);
    if (dashRes.ok) setDashboard(await dashRes.json());
    if (topicsRes.ok) setTopics(await topicsRes.json());
    if (draftsRes.ok) setDrafts(await draftsRes.json());
    if (modeRes.ok) setAgentMode(await modeRes.json());
    if (learnRes.ok) setLearning(await learnRes.json());
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
    </div>
  );
}
