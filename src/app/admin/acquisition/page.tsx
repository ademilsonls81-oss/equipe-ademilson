"use client";
import { useState, useEffect } from "react";
import styles from "./acquisition.module.css";

type ContentStats = {
  total: number;
  active: number;
  totalSessions: number;
  totalRegistrations: number;
  totalWhatsappClicks: number;
  totalWhatsappJoins: number;
  conversionRate: number;
  whatsappRate: number;
  byPlatform: { platform: string; count: number; sessions: number; registrations: number; whatsapp_clicks: number; whatsapp_joins: number; avg_score: number }[];
  byTheme: { theme: string; count: number; sessions: number; registrations: number; avg_score: number }[];
  bestContent: any;
  worstContent: any;
};

type FunnelStats = {
  totalSessions: number;
  sessionsToday: number;
  registered: number;
  registeredToday: number;
  clickedWhatsApp: number;
  joinedWhatsApp: number;
  conversionRate: number;
  whatsappRate: number;
  bySource: { source: string; sessions: number; registrations: number }[];
  byLandingPage: { landing_page: string; sessions: number; registrations: number }[];
};

type GrowthMetrics = {
  totalMembers: number;
  membersToday: number;
  membersYesterday: number;
  referralMembers: number;
  directMembers: number;
  growthRate: number;
  viralCoefficient: number;
  last7Days: { day: string; count: number }[];
  last30Days: { day: string; count: number }[];
};

type ReferralStats = {
  totalReferrals: number;
  convertedReferrals: number;
  referralsToday: number;
  convertedToday: number;
  conversionRate: number;
  growthCoefficient: number;
  byPlatform: { platform: string; total: number; converted: number }[];
  bySource: { source: string; total: number; converted: number }[];
  topReferrers: { referrer_uid: string; name: string; city: string; state: string; total_referrals: number; conversions: number }[];
  byDay: { day: string; total: number; converted: number }[];
};

type AgentLog = {
  id: number;
  agent_type: string;
  action: string;
  details: string;
  status: string;
  created_at: string;
};

type Recommendation = {
  type: string;
  priority: string;
  action: string;
  reason: string;
  platform?: string;
  theme?: string;
};

export default function AcquisitionPage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(true);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    
    try {
      const [contentRes, funnelRes, growthRes, referralRes, logsRes] = await Promise.all([
        fetch("/api/content?stats=true", { headers }),
        fetch("/api/funnel", { headers }),
        fetch("/api/growth", { headers }),
        fetch("/api/referral-tracking", { headers }),
        fetch("/api/agent/logs", { headers }),
      ]);
      
      if (contentRes.ok && funnelRes.ok) {
        setContentStats(await contentRes.json());
        setFunnelStats(await funnelRes.json());
        if (growthRes.ok) setGrowthMetrics(await growthRes.json());
        if (referralRes.ok) setReferralStats(await referralRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
        setAuthed(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(async () => {
      const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
      try {
        const [contentRes, funnelRes, growthRes, referralRes] = await Promise.all([
          fetch("/api/content?stats=true", { headers }),
          fetch("/api/funnel", { headers }),
          fetch("/api/growth", { headers }),
          fetch("/api/referral-tracking", { headers }),
        ]);
        if (contentRes.ok) setContentStats(await contentRes.json());
        if (funnelRes.ok) setFunnelStats(await funnelRes.json());
        if (growthRes.ok) setGrowthMetrics(await growthRes.json());
        if (referralRes.ok) setReferralStats(await referralRes.json());
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [authed, auth]);

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>🤖</div>
          <h1>ACQUISITION AGENT</h1>
          <p>Gerente de Aquisição Digital</p>
          <form onSubmit={login} className={styles.loginForm}>
            <input
              className={styles.input}
              type="password"
              placeholder="Senha"
              value={auth}
              onChange={(e) => setAuth(e.target.value)}
              required
            />
            {error && <div className={styles.err}>Senha incorreta.</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>🤖 ACQUISITION AGENT</h1>
        <div className={styles.headerActions}>
          <span className={styles.live}>🔴 AO VIVO</span>
          <a href="/admin" className={styles.link}>← Admin</a>
          <a href="/dashboard" className={styles.link}>Dashboard →</a>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className={styles.grid}>
        <div className={styles.cardBig}>
          <div className={styles.cardIcon}>👁️</div>
          <div className={styles.cardValue}>{funnelStats?.totalSessions ?? 0}</div>
          <div className={styles.cardLabel}>Visitantes</div>
        </div>
        <div className={`${styles.cardBig} ${styles.cardGreen}`}>
          <div className={styles.cardIcon}>📋</div>
          <div className={styles.cardValue}>{funnelStats?.registered ?? 0}</div>
          <div className={styles.cardLabel}>Cadastros</div>
        </div>
        <div className={`${styles.cardBig} ${styles.cardYellow}`}>
          <div className={styles.cardIcon}>📱</div>
          <div className={styles.cardValue}>{funnelStats?.clickedWhatsApp ?? 0}</div>
          <div className={styles.cardLabel}>Cliques WhatsApp</div>
        </div>
        <div className={`${styles.cardBig} ${styles.cardPurple}`}>
          <div className={styles.cardIcon}>✅</div>
          <div className={styles.cardValue}>{funnelStats?.joinedWhatsApp ?? 0}</div>
          <div className={styles.cardLabel}>Entradas WhatsApp</div>
        </div>
        <div className={`${styles.cardBig} ${styles.cardGold}`}>
          <div className={styles.cardIcon}>🔗</div>
          <div className={styles.cardValue}>{funnelStats?.registered ? Math.round((funnelStats.clickedWhatsApp / funnelStats.registered) * 100) : 0}%</div>
          <div className={styles.cardLabel}>Taxa de Conversão</div>
        </div>
      </div>

      {/* Métricas de Crescimento Viral */}
      {growthMetrics && (
        <div className={styles.grid}>
          <div className={`${styles.cardBig} ${styles.cardGreen}`}>
            <div className={styles.cardIcon}>👥</div>
            <div className={styles.cardValue}>{growthMetrics.totalMembers}</div>
            <div className={styles.cardLabel}>Total Membros</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardGold}`}>
            <div className={styles.cardIcon}>📈</div>
            <div className={styles.cardValue}>{growthMetrics.viralCoefficient}</div>
            <div className={styles.cardLabel}>Coeficiente Viral</div>
          </div>
          <div className={styles.cardBig}>
            <div className={styles.cardIcon}>🔗</div>
            <div className={styles.cardValue}>{referralStats?.totalReferrals ?? 0}</div>
            <div className={styles.cardLabel}>Indicações Totais</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardPurple}`}>
            <div className={styles.cardIcon}>✅</div>
            <div className={styles.cardValue}>{referralStats?.convertedReferrals ?? 0}</div>
            <div className={styles.cardLabel}>Indicações Convertidas</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardYellow}`}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardValue}>{referralStats?.conversionRate ?? 0}%</div>
            <div className={styles.cardLabel}>Taxa Conversão Indicação</div>
          </div>
        </div>
      )}

      {/* Top Indicadores */}
      {referralStats && referralStats.topReferrers.length > 0 && (
        <div className={styles.section}>
          <h2>🏆 Top Indicadores</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Cidade</th>
                  <th>Indicações</th>
                  <th>Conversões</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                {referralStats.topReferrers.map((r, i) => (
                  <tr key={r.referrer_uid}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td>{r.city}, {r.state}</td>
                    <td>{r.total_referrals}</td>
                    <td>{r.conversions}</td>
                    <td>{r.total_referrals > 0 ? Math.round((r.conversions / r.total_referrals) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Indicações por Plataforma */}
      {referralStats && referralStats.byPlatform.length > 0 && (
        <div className={styles.section}>
          <h2>📱 Indicações por Plataforma</h2>
          <div className={styles.sourceGrid}>
            {referralStats.byPlatform.map(p => (
              <div key={p.platform} className={styles.sourceCard}>
                <div className={styles.sourceValue}>{p.total}</div>
                <div className={styles.sourceLabel}>{p.platform}</div>
                <div className={styles.sourceConversions}>{p.converted} conversões</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crescimento por Dia */}
      {growthMetrics && growthMetrics.last7Days.length > 0 && (
        <div className={styles.section}>
          <h2>📈 Crescimento (Últimos 7 Dias)</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Novos Membros</th>
                  <th>Indicações</th>
                  <th>Convertidos</th>
                </tr>
              </thead>
              <tbody>
                {growthMetrics.last7Days.map(day => {
                  const refDay = referralStats?.byDay.find(r => r.day === day.day);
                  return (
                    <tr key={day.day}>
                      <td>{new Date(day.day).toLocaleDateString("pt-BR")}</td>
                      <td style={{ fontWeight: 700, color: "#4ade80" }}>{day.count}</td>
                      <td>{refDay?.total ?? 0}</td>
                      <td>{refDay?.converted ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Melhores Colocados */}
      <div className={styles.section}>
        <h2>🏆 Melhores Colocados</h2>
        <div className={styles.winnersGrid}>
          <div className={styles.winnerCard}>
            <div className={styles.winnerIcon}>📝</div>
            <div className={styles.winnerLabel}>Melhor Conteúdo</div>
            <div className={styles.winnerValue}>{contentStats?.bestContent?.title || "N/A"}</div>
            <div className={styles.winnerScore}>Score: {contentStats?.bestContent?.score || 0}</div>
          </div>
          <div className={styles.winnerCard}>
            <div className={styles.winnerIcon}>🌐</div>
            <div className={styles.winnerLabel}>Melhor Plataforma</div>
            <div className={styles.winnerValue}>{contentStats?.byPlatform?.[0]?.platform || "N/A"}</div>
            <div className={styles.winnerScore}>Score: {contentStats?.byPlatform?.[0]?.avg_score || 0}</div>
          </div>
          <div className={styles.winnerCard}>
            <div className={styles.winnerIcon}>🎯</div>
            <div className={styles.winnerLabel}>Melhor Tema</div>
            <div className={styles.winnerValue}>{contentStats?.byTheme?.[0]?.theme || "N/A"}</div>
            <div className={styles.winnerScore}>Score: {contentStats?.byTheme?.[0]?.avg_score || 0}</div>
          </div>
          <div className={styles.winnerCard}>
            <div className={styles.winnerIcon}>📢</div>
            <div className={styles.winnerLabel}>Melhor Campanha</div>
            <div className={styles.winnerValue}>{funnelStats?.bySource?.[0]?.source || "N/A"}</div>
            <div className={styles.winnerScore}>Sessões: {funnelStats?.bySource?.[0]?.sessions || 0}</div>
          </div>
        </div>
      </div>

      {/* Performance por Plataforma */}
      <div className={styles.section}>
        <h2>📊 Performance por Plataforma</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plataforma</th>
                <th>Conteúdos</th>
                <th>Visitantes</th>
                <th>Cadastros</th>
                <th>WhatsApp</th>
                <th>Entradas</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {contentStats?.byPlatform?.map((p) => (
                <tr key={p.platform}>
                  <td><strong>{p.platform}</strong></td>
                  <td>{p.count}</td>
                  <td>{p.sessions}</td>
                  <td>{p.registrations}</td>
                  <td>{p.whatsapp_clicks}</td>
                  <td>{p.whatsapp_joins}</td>
                  <td>
                    <span className={`${styles.scoreBadge} ${p.avg_score > 50 ? styles.scoreGood : p.avg_score > 30 ? styles.scoreMedium : styles.scoreBad}`}>
                      {p.avg_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance por Tema */}
      <div className={styles.section}>
        <h2>🎯 Performance por Tema</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tema</th>
                <th>Conteúdos</th>
                <th>Visitantes</th>
                <th>Cadastros</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {contentStats?.byTheme?.map((t) => (
                <tr key={t.theme}>
                  <td><strong>{t.theme}</strong></td>
                  <td>{t.count}</td>
                  <td>{t.sessions}</td>
                  <td>{t.registrations}</td>
                  <td>
                    <span className={`${styles.scoreBadge} ${t.avg_score > 50 ? styles.scoreGood : t.avg_score > 30 ? styles.scoreMedium : styles.scoreBad}`}>
                      {t.avg_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRÓXIMAS AÇÕES RECOMENDADAS */}
      <div className={styles.section}>
        <h2>🎯 PRÓXIMAS AÇÕES RECOMENDADAS</h2>
        <div className={styles.recommendationsGrid}>
          <div className={styles.recCard}>
            <div className={styles.recPriority}>1</div>
            <div className={styles.recContent}>
              <div className={styles.recAction}>Criar 5 conteúdos sobre {contentStats?.byTheme?.[0]?.theme || "oportunidade"} para {contentStats?.byPlatform?.[0]?.platform || "google"}</div>
              <div className={styles.recReason}>Melhor plataforma e tema identificados pela análise</div>
            </div>
          </div>
          <div className={styles.recCard}>
            <div className={styles.recPriority}>2</div>
            <div className={styles.recContent}>
              <div className={styles.recAction}>Reforçar as landing pages com mais tráfego</div>
              <div className={styles.recReason}>Aumentar conversão nas páginas já existentes</div>
            </div>
          </div>
          <div className={styles.recCard}>
            <div className={styles.recPriority}>3</div>
            <div className={styles.recContent}>
              <div className={styles.recAction}>Publicar mais vídeos curtos no TikTok e Instagram</div>
              <div className={styles.recReason}>Formato com maior engajamento no público-alvo</div>
            </div>
          </div>
          <div className={styles.recCard}>
            <div className={styles.recPriority}>4</div>
            <div className={styles.recContent}>
              <div className={styles.recAction}>Testar novo CTA: &quot;Garanta sua vaga agora&quot;</div>
              <div className={styles.recReason}>CTAs com urgência tendem a ter maior taxa de conversão</div>
            </div>
          </div>
          <div className={styles.recCard}>
            <div className={styles.recPriority}>5</div>
            <div className={styles.recContent}>
              <div className={styles.recAction}>Reduzir conteúdos com score abaixo de 30</div>
              <div className={styles.recReason}>Focar recursos nos formatos vencedores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs do Agente */}
      <div className={styles.section}>
        <h2>📋 Logs do Agente</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Detalhes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 10).map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleDateString("pt-BR")}</td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.details}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${log.status === "success" ? styles.statusSuccess : styles.statusError}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fontes de Tráfego */}
      <div className={styles.section}>
        <h2>🌐 Fontes de Tráfego</h2>
        <div className={styles.sourceGrid}>
          {funnelStats?.bySource?.map((s) => (
            <div key={s.source} className={styles.sourceCard}>
              <div className={styles.sourceValue}>{s.sessions}</div>
              <div className={styles.sourceLabel}>{s.source}</div>
              <div className={styles.sourceConversions}>{s.registrations} cadastros</div>
            </div>
          ))}
        </div>
      </div>

      {/* Landing Pages */}
      <div className={styles.section}>
        <h2>📄 Melhores Landing Pages</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Página</th>
                <th>Visitantes</th>
                <th>Cadastros</th>
                <th>Taxa</th>
              </tr>
            </thead>
            <tbody>
              {funnelStats?.byLandingPage?.map((p) => (
                <tr key={p.landing_page}>
                  <td><strong>{p.landing_page}</strong></td>
                  <td>{p.sessions}</td>
                  <td>{p.registrations}</td>
                  <td>{p.sessions > 0 ? Math.round((p.registrations / p.sessions) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
