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

const PLATFORMS = ["google", "youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"];
const STATUSES = ["ideia", "gerado", "revisao", "aprovado", "agendado", "publicado", "medindo", "vencedor", "fraco"];
const CATEGORIES = ["ia", "trabalho", "renda", "oportunidade", "conteudo"];

export default function ContentEnginePage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "topics" | "drafts" | "schedule">("dashboard");

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const [dashRes, topicsRes, draftsRes] = await Promise.all([
        fetch("/api/content-engine?dashboard=true", { headers }),
        fetch("/api/content-engine?topics=true", { headers }),
        fetch("/api/content-engine?drafts=true", { headers }),
      ]);
      if (dashRes.ok && topicsRes.ok && draftsRes.ok) {
        setDashboard(await dashRes.json());
        setTopics(await topicsRes.json());
        setDrafts(await draftsRes.json());
        setAuthed(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  async function refresh() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const [dashRes, topicsRes, draftsRes] = await Promise.all([
      fetch("/api/content-engine?dashboard=true", { headers }),
      fetch("/api/content-engine?topics=true", { headers }),
      fetch("/api/content-engine?drafts=true", { headers }),
    ]);
    if (dashRes.ok) setDashboard(await dashRes.json());
    if (topicsRes.ok) setTopics(await topicsRes.json());
    if (draftsRes.ok) setDrafts(await draftsRes.json());
  }

  async function seedTopics() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "seed_topics" }) });
    await refresh();
  }

  async function generateContent(topicId: string, platform: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "generate_content", topic_id: topicId, platform }) });
    await refresh();
  }

  async function generateAllPlatforms(topicId: string) {
    for (const platform of PLATFORMS) {
      await generateContent(topicId, platform);
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

  async function togglePause() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", { method: "POST", headers, body: JSON.stringify({ action: "toggle_pause" }) });
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

  const paused = dashboard && getAgentConfig("acquisition_paused") === "true";

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>⚙️ CONTENT ENGINE</h1>
        <div className={styles.headerActions}>
          <button className={`${styles.btnPause} ${paused ? styles.paused : ""}`} onClick={togglePause}>
            {paused ? "▶️ RETOMAR" : "⏸️ PAUSAR"}
          </button>
          <a href="/admin/acquisition" className={styles.link}>← Command Center</a>
        </div>
      </header>

      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "dashboard" ? styles.tabActive : ""}`} onClick={() => setActiveTab("dashboard")}>📊 Dashboard</button>
        <button className={`${styles.tab} ${activeTab === "topics" ? styles.tabActive : ""}`} onClick={() => setActiveTab("topics")}>💡 Temas</button>
        <button className={`${styles.tab} ${activeTab === "drafts" ? styles.tabActive : ""}`} onClick={() => setActiveTab("drafts")}>📝 Rascunhos</button>
        <button className={`${styles.tab} ${activeTab === "schedule" ? styles.tabActive : ""}`} onClick={() => setActiveTab("schedule")}>📅 Agenda</button>
      </nav>

      {activeTab === "dashboard" && dashboard && (
        <div className={styles.content}>
          <div className={styles.grid5}>
            <div className={styles.cardBig}>
              <div className={styles.cardIcon}>💡</div>
              <div className={styles.cardValue}>{dashboard.topicStats.total}</div>
              <div className={styles.cardLabel}>Temas</div>
            </div>
            <div className={`${styles.cardBig} ${styles.cardGreen}`}>
              <div className={styles.cardIcon}>📝</div>
              <div className={styles.cardValue}>{dashboard.draftStats.total}</div>
              <div className={styles.cardLabel}>Rascunhos</div>
            </div>
            <div className={`${styles.cardBig} ${styles.cardYellow}`}>
              <div className={styles.cardIcon}>👁️</div>
              <div className={styles.cardValue}>{dashboard.draftStats.totalSessions}</div>
              <div className={styles.cardLabel}>Visitantes</div>
            </div>
            <div className={`${styles.cardBig} ${styles.cardPurple}`}>
              <div className={styles.cardIcon}>📋</div>
              <div className={styles.cardValue}>{dashboard.draftStats.totalRegistrations}</div>
              <div className={styles.cardLabel}>Cadastros</div>
            </div>
            <div className={`${styles.cardBig} ${styles.cardGold}`}>
              <div className={styles.cardIcon}>📱</div>
              <div className={styles.cardValue}>{dashboard.draftStats.totalWhatsapp}</div>
              <div className={styles.cardLabel}>WhatsApp</div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>📊 STATUS DOS CONTEÚDOS</h2>
            <div className={styles.statusGrid}>
              {dashboard.draftStats.byStatus.map(s => (
                <div key={s.status} className={styles.statusCard}>
                  <div className={styles.statusCount}>{s.count}</div>
                  <div className={styles.statusLabel}>{s.status}</div>
                </div>
              ))}
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

          {dashboard.draftStats.winners.length > 0 && (
            <div className={styles.section}>
              <h2>🏆 CAMPEÕES</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Título</th><th>Plataforma</th><th>Visitantes</th><th>Cadastros</th><th>Score</th></tr></thead>
                  <tbody>
                    {dashboard.draftStats.winners.map((w: any) => (
                      <tr key={w.draft_id}><td style={{ fontWeight: 700 }}>{w.title}</td><td>{w.platform}</td><td>{w.sessions}</td><td>{w.registrations}</td><td>{w.score}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dashboard.draftStats.losers.length > 0 && (
            <div className={styles.section}>
              <h2>⚠️ BAIXA PERFORMANCE</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Título</th><th>Plataforma</th><th>Visitantes</th><th>Cadastros</th><th>Score</th></tr></thead>
                  <tbody>
                    {dashboard.draftStats.losers.map((l: any) => (
                      <tr key={l.draft_id}><td>{l.title}</td><td>{l.platform}</td><td>{l.sessions}</td><td>{l.registrations}</td><td>{l.score}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "topics" && (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2>💡 OPORTUNIDADES / TEMAS</h2>
            <button className={styles.btnSmall} onClick={seedTopics}>🌱 Carregar Temas Iniciais</button>
          </div>
          {topics.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum tema cadastrado.</p>
              <p>Clique em "Carregar Temas Iniciais" para começar.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Tema</th><th>Categoria</th><th>Relevância</th><th>Tráfego</th><th>Conversão</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {topics.map(t => (
                    <tr key={t.topic_id}>
                      <td style={{ fontWeight: 700 }}>{t.title}</td>
                      <td>{t.category}</td>
                      <td>{t.relevance}</td>
                      <td>{t.traffic_potential}</td>
                      <td>{t.conversion_potential}</td>
                      <td style={{ fontWeight: 700, color: "var(--gold)" }}>{t.priority}</td>
                      <td><span className={`${styles.badge} ${styles[`badge${t.status}`]}`}>{t.status}</span></td>
                      <td>
                        <button className={styles.btnTiny} onClick={() => generateAllPlatforms(t.topic_id)}>Gerar Todos</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "drafts" && (
        <div className={styles.content}>
          <h2>📝 RASCUNHOS</h2>
          {drafts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum rascunho criado.</p>
              <p>Gere conteúdos a partir dos temas.</p>
            </div>
          ) : (
            <div className={styles.draftsList}>
              {drafts.map(d => (
                <div key={d.draft_id} className={styles.draftCard}>
                  <div className={styles.draftHeader}>
                    <span className={styles.draftPlatform}>{d.platform}</span>
                    <span className={`${styles.badge} ${styles[`badge${d.status}`]}`}>{d.status}</span>
                  </div>
                  <h3 className={styles.draftTitle}>{d.title}</h3>
                  <p className={styles.draftBody}>{d.body?.substring(0, 150)}...</p>
                  <div className={styles.draftMeta}>
                    <span>UTM: {d.utm_campaign}</span>
                    <span>Score: {d.score}</span>
                  </div>
                  <div className={styles.draftActions}>
                    {d.status === "gerado" && <button className={styles.btnTiny} onClick={() => approveDraft(d.draft_id)}>✅ Aprovar</button>}
                    {d.status === "aprovado" && <button className={styles.btnTiny} onClick={() => updateDraftStatus(d.draft_id, "publicado")}>🚀 Publicar</button>}
                    {d.status === "publicado" && <button className={styles.btnTiny} onClick={() => updateDraftStatus(d.draft_id, "medindo")}>📊 Medir</button>}
                    {d.status === "medindo" && <>
                      <button className={styles.btnTinyGreen} onClick={() => updateDraftStatus(d.draft_id, "vencedor")}>🏆 Vencedor</button>
                      <button className={styles.btnTinyRed} onClick={() => updateDraftStatus(d.draft_id, "fraco")}>⚠️ Fraco</button>
                    </>}
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
          {dashboard && dashboard.schedule.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma publicação agendada.</p>
              <p>Aprove rascunhos e agende publicações.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Título</th><th>Plataforma</th><th>Agendado</th><th>Status</th></tr></thead>
                <tbody>
                  {dashboard?.schedule.map((s: any) => (
                    <tr key={s.schedule_id}>
                      <td style={{ fontWeight: 700 }}>{s.title}</td>
                      <td>{s.platform}</td>
                      <td>{new Date(s.scheduled_for).toLocaleString("pt-BR")}</td>
                      <td>{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getAgentConfig(key: string): string {
  return ""; // placeholder - actual config comes from API
}
