"use client";
import { useState, useEffect } from "react";
import styles from "./acquisition.module.css";

type CommandCenterData = {
  today: { visitors: number; registrations: number; whatsappClicks: number; newMembers: number; newReferrals: number };
  total: { visitors: number; registrations: number; whatsappClicks: number; members: number; referrals: number };
  funnel: { visitors: number; registrations: number; whatsappClicks: number; members: number; referrals: number; registrationRate: number; whatsappRate: number; memberRate: number; referralRate: number };
  byOrigin: { origin: string; count: number; whatsapp_clicks: number }[];
  byCity: { city: string; state: string; count: number }[];
  champions: { bestContent: any; bestCampaign: any; bestPlatform: any; bestCity: any; bestCTA: any };
  agent: { generated: number; published: number; pending: number; errors: number; nextExecution: string };
  goal: { target: number; current: number; remaining: number; progress: number };
};

type Alert = { type: string; severity: string; message: string; timestamp: string; data?: any };
type Channels = Record<string, boolean>;

type Forecast = {
  target: number; current: number; remaining: number; progress: number;
  avgDaily30: number; avgDaily7: number; dailyGrowth: number;
  forecastDays30: number; forecastDays7: number;
  forecastDate30: string; forecastDate7: string;
  last7Days: { day: string; count: number }[];
  last30Days: { day: string; count: number }[];
};

type AutonomousStatus = {
  enabled: boolean; lastAnalysis: string; nextAnalysis: string;
  actionsExecuted: number; actionsPending: number; errors: number;
  lastExecution: string; executionCount: number;
};

type Recommendation = { type: string; priority: string; action: string; reason: string; data: any };

export default function AcquisitionPage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [channels, setChannels] = useState<Channels>({});
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [autonomous, setAutonomous] = useState<AutonomousStatus | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const [dataRes, alertsRes, channelsRes, forecastRes, autonomousRes, recsRes] = await Promise.all([
        fetch("/api/command-center", { headers }),
        fetch("/api/command-center?alerts=true", { headers }),
        fetch("/api/command-center?channels=true", { headers }),
        fetch("/api/command-center?forecast=true", { headers }),
        fetch("/api/command-center?autonomous=true", { headers }),
        fetch("/api/command-center?recommendations=true", { headers }),
      ]);
      if (dataRes.ok && alertsRes.ok && channelsRes.ok) {
        setData(await dataRes.json());
        setAlerts(await alertsRes.json());
        setChannels(await channelsRes.json());
        if (forecastRes.ok) setForecast(await forecastRes.json());
        if (autonomousRes.ok) setAutonomous(await autonomousRes.json());
        if (recsRes.ok) setRecommendations(await recsRes.json());
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
        const [dataRes, alertsRes, forecastRes] = await Promise.all([
          fetch("/api/command-center", { headers }),
          fetch("/api/command-center?alerts=true", { headers }),
          fetch("/api/command-center?forecast=true", { headers }),
        ]);
        if (dataRes.ok) setData(await dataRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (forecastRes.ok) setForecast(await forecastRes.json());
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [authed, auth]);

  async function toggleChannelHandler(channel: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    const newEnabled = !channels[channel];
    setChannels({ ...channels, [channel]: newEnabled });
    await fetch("/api/command-center", { method: "POST", headers, body: JSON.stringify({ action: "toggle_channel", channel, enabled: newEnabled }) });
  }

  async function toggleAutonomousHandler() {
    if (!autonomous) return;
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    const newEnabled = !autonomous.enabled;
    setAutonomous({ ...autonomous, enabled: newEnabled });
    await fetch("/api/command-center", { method: "POST", headers, body: JSON.stringify({ action: "toggle_autonomous", enabled: newEnabled }) });
  }

  async function runAnalysis() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/command-center", { method: "POST", headers, body: JSON.stringify({ action: "run_analysis" }) });
    alert("Análise executada!");
  }

  async function calculateScore() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/command-center", { method: "POST", headers, body: JSON.stringify({ action: "calculate_score" }) });
    alert("Score calculado!");
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>🎯</div>
          <h1>COMMAND CENTER</h1>
          <p>Central de Comando da Aquisição</p>
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
        <h1>🎯 COMMAND CENTER</h1>
        <div className={styles.headerActions}>
          <span className={styles.live}>🔴 AO VIVO</span>
          <a href="/admin" className={styles.link}>← Admin</a>
        </div>
      </header>

      {/* AQUISIÇÃO HOJE */}
      <div className={styles.section}>
        <h2>🚀 AQUISIÇÃO</h2>
        <div className={styles.grid5}>
          <div className={styles.cardBig}>
            <div className={styles.cardIcon}>👁️</div>
            <div className={styles.cardValue}>{data?.today.visitors ?? 0}</div>
            <div className={styles.cardLabel}>Visitantes Hoje</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardGreen}`}>
            <div className={styles.cardIcon}>📋</div>
            <div className={styles.cardValue}>{data?.today.registrations ?? 0}</div>
            <div className={styles.cardLabel}>Cadastros Hoje</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardYellow}`}>
            <div className={styles.cardIcon}>📱</div>
            <div className={styles.cardValue}>{data?.today.whatsappClicks ?? 0}</div>
            <div className={styles.cardLabel}>Cliques WhatsApp</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardPurple}`}>
            <div className={styles.cardIcon}>👥</div>
            <div className={styles.cardValue}>{data?.today.newMembers ?? 0}</div>
            <div className={styles.cardLabel}>Novos Membros</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardGold}`}>
            <div className={styles.cardIcon}>🔗</div>
            <div className={styles.cardValue}>{data?.today.newReferrals ?? 0}</div>
            <div className={styles.cardLabel}>Novas Indicações</div>
          </div>
        </div>
      </div>

      {/* FUNIL */}
      <div className={styles.section}>
        <h2>📈 FUNIL</h2>
        <div className={styles.funnelGrid}>
          <div className={styles.funnelItem}>
            <div className={styles.funnelBar} style={{ width: "100%" }}></div>
            <div className={styles.funnelLabel}>Visitantes</div>
            <div className={styles.funnelValue}>{data?.funnel.visitors ?? 0}</div>
          </div>
          <div className={styles.funnelArrow}>↓ {data?.funnel.registrationRate ?? 0}%</div>
          <div className={styles.funnelItem}>
            <div className={styles.funnelBar} style={{ width: `${data?.funnel.registrationRate ?? 0}%` }}></div>
            <div className={styles.funnelLabel}>Cadastros</div>
            <div className={styles.funnelValue}>{data?.funnel.registrations ?? 0}</div>
          </div>
          <div className={styles.funnelArrow}>↓ {data?.funnel.whatsappRate ?? 0}%</div>
          <div className={styles.funnelItem}>
            <div className={styles.funnelBar} style={{ width: `${data?.funnel.whatsappRate ?? 0}%` }}></div>
            <div className={styles.funnelLabel}>Cliques WhatsApp</div>
            <div className={styles.funnelValue}>{data?.funnel.whatsappClicks ?? 0}</div>
          </div>
          <div className={styles.funnelArrow}>↓ {data?.funnel.memberRate ?? 0}%</div>
          <div className={styles.funnelItem}>
            <div className={styles.funnelBar} style={{ width: `${data?.funnel.memberRate ?? 0}%` }}></div>
            <div className={styles.funnelLabel}>Membros</div>
            <div className={styles.funnelValue}>{data?.funnel.members ?? 0}</div>
          </div>
          <div className={styles.funnelArrow}>↓ {data?.funnel.referralRate ?? 0}%</div>
          <div className={styles.funnelItem}>
            <div className={styles.funnelBar} style={{ width: `${data?.funnel.referralRate ?? 0}%` }}></div>
            <div className={styles.funnelLabel}>Indicações</div>
            <div className={styles.funnelValue}>{data?.funnel.referrals ?? 0}</div>
          </div>
        </div>
      </div>

      {/* ORIGEM */}
      <div className={styles.section}>
        <h2>🌎 ORIGEM</h2>
        <div className={styles.originGrid}>
          {data?.byOrigin.map(o => {
            const icons: Record<string, string> = { google: "🔍", youtube: "📺", tiktok: "🎵", facebook: "📘", instagram: "📷", pinterest: "📌", reddit: "🤖", indicacao: "🔗", direct: "🔗", outros: "📡" };
            const names: Record<string, string> = { google: "Google", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram", pinterest: "Pinterest", reddit: "Reddit", indicacao: "Indicação", direct: "Direto", outros: "Outros" };
            const total = data?.total.visitors ?? 1;
            const pct = Math.round((o.count / total) * 100);
            return (
              <div key={o.origin} className={styles.originCard}>
                <div className={styles.originIcon}>{icons[o.origin] || "📡"}</div>
                <div className={styles.originName}>{names[o.origin] || o.origin}</div>
                <div className={styles.originCount}>{o.count}</div>
                <div className={styles.originBar}>
                  <div className={styles.originBarFill} style={{ width: `${pct}%` }}></div>
                </div>
                <div className={styles.originPct}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CAMPEÕES */}
      <div className={styles.section}>
        <h2>🏆 CAMPEÕES</h2>
        <div className={styles.championsGrid}>
          <div className={styles.championCard}>
            <div className={styles.championIcon}>📝</div>
            <div className={styles.championLabel}>Melhor Conteúdo</div>
            <div className={styles.championValue}>{data?.champions.bestContent?.title || "N/A"}</div>
            <div className={styles.championScore}>{data?.champions.bestContent?.registrations || 0} cadastros</div>
          </div>
          <div className={styles.championCard}>
            <div className={styles.championIcon}>📢</div>
            <div className={styles.championLabel}>Melhor Campanha</div>
            <div className={styles.championValue}>{data?.champions.bestCampaign?.campaign || "N/A"}</div>
            <div className={styles.championScore}>{data?.champions.bestCampaign?.count || 0} membros</div>
          </div>
          <div className={styles.championCard}>
            <div className={styles.championIcon}>🌐</div>
            <div className={styles.championLabel}>Melhor Plataforma</div>
            <div className={styles.championValue}>{data?.champions.bestPlatform?.platform || "N/A"}</div>
            <div className={styles.championScore}>{data?.champions.bestPlatform?.count || 0} conteúdos</div>
          </div>
          <div className={styles.championCard}>
            <div className={styles.championIcon}>📍</div>
            <div className={styles.championLabel}>Melhor Cidade</div>
            <div className={styles.championValue}>{data?.champions.bestCity ? `${data.champions.bestCity.city}/${data.champions.bestCity.state}` : "N/A"}</div>
            <div className={styles.championScore}>{data?.champions.bestCity?.count || 0} membros</div>
          </div>
          <div className={styles.championCard}>
            <div className={styles.championIcon}>🎯</div>
            <div className={styles.championLabel}>Melhor CTA</div>
            <div className={styles.championValue}>{data?.champions.bestCTA?.cta ? `"${data.champions.bestCTA.cta.substring(0, 40)}..."` : "N/A"}</div>
            <div className={styles.championScore}>{data?.champions.bestCTA?.count || 0} cliques</div>
          </div>
        </div>
      </div>

      {/* 🤖 AGENTE */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>🤖 AGENTE</h2>
          <div className={styles.agentControls}>
            <span className={`${styles.autonomousBadge} ${autonomous?.enabled ? styles.autonomousOn : styles.autonomousOff}`}>
              {autonomous?.enabled ? "AUTÔNOMO: ON" : "AUTÔNOMO: OFF"}
            </span>
            <button className={styles.btnSmall} onClick={toggleAutonomousHandler}>
              {autonomous?.enabled ? "Desativar" : "Ativar"}
            </button>
            <button className={styles.btnSmall} onClick={runAnalysis}>Analisar</button>
            <button className={styles.btnSmall} onClick={calculateScore}>Calcular Score</button>
          </div>
        </div>
        <div className={styles.grid5}>
          <div className={styles.cardBig}>
            <div className={styles.cardIcon}>📄</div>
            <div className={styles.cardValue}>{data?.agent.generated ?? 0}</div>
            <div className={styles.cardLabel}>Gerados</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardGreen}`}>
            <div className={styles.cardIcon}>✅</div>
            <div className={styles.cardValue}>{data?.agent.published ?? 0}</div>
            <div className={styles.cardLabel}>Publicados</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardYellow}`}>
            <div className={styles.cardIcon}>⏳</div>
            <div className={styles.cardValue}>{autonomous?.actionsPending ?? data?.agent.pending ?? 0}</div>
            <div className={styles.cardLabel}>Pendentes</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardRed}`}>
            <div className={styles.cardIcon}>❌</div>
            <div className={styles.cardValue}>{autonomous?.errors ?? data?.agent.errors ?? 0}</div>
            <div className={styles.cardLabel}>Erros</div>
          </div>
          <div className={`${styles.cardBig} ${styles.cardPurple}`}>
            <div className={styles.cardIcon}>⚡</div>
            <div className={styles.cardValue}>{autonomous?.actionsExecuted ?? 0}</div>
            <div className={styles.cardLabel}>Executadas</div>
          </div>
        </div>
      </div>

      {/* 🎯 META 1.000 */}
      <div className={styles.section}>
        <h2>🎯 META 1.000</h2>
        <div className={styles.goalSection}>
          <div className={styles.goalInfo}>
            <div className={styles.goalText}>
              <span>Membros atuais: <strong>{forecast?.current ?? data?.goal.current ?? 0}</strong></span>
              <span>Membros hoje: <strong>{data?.today.newMembers ?? 0}</strong></span>
              <span>Média diária (7d): <strong>{forecast?.avgDaily7 ?? 0}</strong></span>
              <span>Faltam: <strong>{forecast?.remaining ?? data?.goal.remaining ?? 0}</strong></span>
            </div>
            <div className={styles.goalPct}>{forecast?.progress ?? data?.goal.progress ?? 0}%</div>
          </div>
          <div className={styles.goalBar}>
            <div className={styles.goalBarFill} style={{ width: `${Math.min(forecast?.progress ?? data?.goal.progress ?? 0, 100)}%` }}></div>
          </div>
          <div className={styles.forecastGrid}>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Previsão (média 7d)</div>
              <div className={styles.forecastValue}>{forecast?.forecastDays7 ?? "N/A"} dias</div>
              <div className={styles.forecastDate}>{forecast?.forecastDate7 ?? "N/A"}</div>
            </div>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Previsão (média 30d)</div>
              <div className={styles.forecastValue}>{forecast?.forecastDays30 ?? "N/A"} dias</div>
              <div className={styles.forecastDate}>{forecast?.forecastDate30 ?? "N/A"}</div>
            </div>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Crescimento diário</div>
              <div className={styles.forecastValue}>{forecast?.dailyGrowth ?? 0}%</div>
              <div className={styles.forecastDate}>vs ontem</div>
            </div>
            <div className={styles.forecastCard}>
              <div className={styles.forecastLabel}>Média 30 dias</div>
              <div className={styles.forecastValue}>{forecast?.avgDaily30 ?? 0}/dia</div>
              <div className={styles.forecastDate}>membros</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📡 CANAIS */}
      <div className={styles.section}>
        <h2>📡 CANAIS</h2>
        <p className={styles.sectionDesc}>Ative/desative canais de aquisição individualmente</p>
        <div className={styles.channelsGrid}>
          {Object.entries(channels).map(([ch, enabled]) => {
            const names: Record<string, string> = { google: "Google", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram", pinterest: "Pinterest", reddit: "Reddit", whatsapp: "WhatsApp", indicacao: "Indicação", direto: "Direto", outros: "Outros" };
            const icons: Record<string, string> = { google: "🔍", youtube: "📺", tiktok: "🎵", facebook: "📘", instagram: "📷", pinterest: "📌", reddit: "🤖", whatsapp: "💬", indicacao: "🔗", direto: "🔗", outros: "📡" };
            return (
              <button key={ch} className={`${styles.channelBtn} ${enabled ? styles.channelEnabled : styles.channelDisabled}`} onClick={() => toggleChannelHandler(ch)}>
                <span>{icons[ch] || "📡"}</span>
                <span>{names[ch] || ch}</span>
                <span className={styles.channelStatus}>{enabled ? "ATIVO" : "INATIVO"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🧠 RECOMENDAÇÕES */}
      {recommendations.length > 0 && (
        <div className={styles.section}>
          <h2>🧠 RECOMENDAÇÕES DO AGENTE</h2>
          <div className={styles.recsList}>
            {recommendations.map((r, i) => (
              <div key={i} className={`${styles.recCard} ${styles[`rec${r.priority}`]}`}>
                <div className={styles.recPriority}>{r.priority === "high" ? "!" : r.priority === "medium" ? "•" : "~"}</div>
                <div className={styles.recContent}>
                  <div className={styles.recAction}>{r.action}</div>
                  <div className={styles.recReason}>{r.reason}</div>
                </div>
                <div className={styles.recType}>{r.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔔 ALERTAS */}
      <div className={styles.section}>
        <h2>🔔 ALERTAS</h2>
        {alerts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>Nenhum alerta no momento</p>
        ) : (
          <div className={styles.alertsList}>
            {alerts.map((alert, i) => (
              <div key={i} className={`${styles.alertCard} ${styles[`alert${alert.severity}`]}`}>
                <div className={styles.alertIcon}>
                  {alert.severity === "success" ? "✅" : alert.severity === "warning" ? "⚠️" : alert.severity === "error" ? "❌" : "ℹ️"}
                </div>
                <div className={styles.alertContent}>
                  <div className={styles.alertMessage}>{alert.message}</div>
                  <div className={styles.alertTime}>{new Date(alert.timestamp).toLocaleTimeString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📍 TOP CIDADES */}
      <div className={styles.section}>
        <h2>📍 TOP CIDADES</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Cidade</th><th>Estado</th><th>Membros</th></tr>
            </thead>
            <tbody>
              {(data?.byCity || []).map((c, i) => (
                <tr key={`${c.city}-${c.state}`}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{c.city}</td>
                  <td>{c.state}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
