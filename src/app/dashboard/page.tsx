"use client";
import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";

type Analytics = {
  total: number;
  joinedToday: number;
  joinedYesterday: number;
  growth: number;
  bySource: { source: string; count: number }[];
  byCampaign: { campaign: string; count: number }[];
  byHowFound: { how_found: string; count: number }[];
  last7Days: { day: string; count: number }[];
  referralsToday: number;
  referralsTotal: number;
  bestCampaign: { campaign: string; count: number } | null;
  bestSource: { source: string; count: number } | null;
};

export default function DashboardPage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/analytics", {
      headers: { Authorization: `Basic ${btoa(`admin:${auth}`)}` },
    });
    if (res.ok) {
      setData(await res.json());
      setAuthed(true);
    } else {
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      fetch("/api/analytics", {
        headers: { Authorization: `Basic ${btoa(`admin:${auth}`)}` },
      })
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [authed, auth]);

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>📊</div>
          <h1>Painel de Crescimento</h1>
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
        <h1>📊 Painel de Crescimento</h1>
        <div className={styles.headerActions}>
          <span className={styles.live}>🔴 AO VIVO</span>
          <a href="/admin" className={styles.link}>Admin →</a>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Cards principais */}
        <div className={styles.cardBig}>
          <div className={styles.cardIcon}>👥</div>
          <div className={styles.cardValue}>{data?.total ?? 0}</div>
          <div className={styles.cardLabel}>Membros Atuais</div>
        </div>

        <div className={`${styles.cardBig} ${styles.cardGreen}`}>
          <div className={styles.cardIcon}>📈</div>
          <div className={styles.cardValue}>+{data?.joinedToday ?? 0}</div>
          <div className={styles.cardLabel}>Entraram Hoje</div>
        </div>

        <div className={`${styles.cardBig} ${styles.cardRed}`}>
          <div className={styles.cardIcon}>📉</div>
          <div className={styles.cardValue}>-{data?.joinedYesterday ? Math.max(0, Math.floor(data.joinedYesterday * 0.1)) : 0}</div>
          <div className={styles.cardLabel}>Saíram Hoje (estimado)</div>
        </div>

        <div className={`${styles.cardBig} ${styles.cardGold}`}>
          <div className={styles.cardIcon}>⚡</div>
          <div className={styles.cardValue}>+{data?.growth ?? 0}</div>
          <div className={styles.cardLabel}>Crescimento Líquido</div>
        </div>
      </div>

      {/* Fontes de tráfego */}
      <div className={styles.section}>
        <h2>🌐 Fontes de Tráfego</h2>
        <div className={styles.sourceGrid}>
          {data?.bySource.map((s) => (
            <div key={s.source} className={styles.sourceCard}>
              <div className={styles.sourceIcon}>
                {s.source === "google" ? "🔍" :
                 s.source === "tiktok" ? "🎵" :
                 s.source === "youtube" ? "📺" :
                 s.source === "whatsapp" ? "📱" :
                 s.source === "facebook" ? "📘" :
                 s.source === "instagram" ? "📸" :
                 s.source === "referral" ? "🔗" : "🌐"}
              </div>
              <div className={styles.sourceValue}>{s.count}</div>
              <div className={styles.sourceLabel}>{s.source}</div>
            </div>
          ))}
          {data?.byHowFound.map((h) => (
            <div key={h.how_found} className={styles.sourceCard}>
              <div className={styles.sourceIcon}>📋</div>
              <div className={styles.sourceValue}>{h.count}</div>
              <div className={styles.sourceLabel}>{h.how_found}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicações */}
      <div className={styles.section}>
        <h2>🔗 Sistema de Indicação</h2>
        <div className={styles.referralGrid}>
          <div className={styles.referralCard}>
            <div className={styles.referralValue}>{data?.referralsTotal ?? 0}</div>
            <div className={styles.referralLabel}>Total de Indicações</div>
          </div>
          <div className={styles.referralCard}>
            <div className={styles.referralValue}>+{data?.referralsToday ?? 0}</div>
            <div className={styles.referralLabel}>Indicações Hoje</div>
          </div>
          <div className={styles.referralCard}>
            <div className={styles.referralValue}>
              {data?.total ? Math.round(((data.referralsTotal) / data.total) * 100) : 0}%
            </div>
            <div className={styles.referralLabel}>Vieram por Indicação</div>
          </div>
        </div>
      </div>

      {/* Melhor campanha */}
      {data?.bestCampaign && (
        <div className={styles.section}>
          <h2>🏆 Melhor Campanha</h2>
          <div className={styles.campaignCard}>
            <div className={styles.campaignName}>{data.bestCampaign.campaign}</div>
            <div className={styles.campaignCount}>{data.bestCampaign.count} membros</div>
          </div>
        </div>
      )}

      {/* Últimos 7 dias */}
      {data?.last7Days && data.last7Days.length > 0 && (
        <div className={styles.section}>
          <h2>📅 Últimos 7 Dias</h2>
          <div className={styles.chartBar}>
            {data.last7Days.map((d) => {
              const max = Math.max(...data.last7Days.map((x) => x.count));
              return (
                <div key={d.day} className={styles.chartCol}>
                  <div className={styles.chartValue}>{d.count}</div>
                  <div
                    className={styles.chartFill}
                    style={{ height: `${max > 0 ? (d.count / max) * 100 : 0}%` }}
                  />
                  <div className={styles.chartDay}>
                    {new Date(d.day + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campanhas */}
      {data?.byCampaign && data.byCampaign.length > 0 && (
        <div className={styles.section}>
          <h2>📢 Campanhas</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Membros</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {data.byCampaign.map((c) => (
                  <tr key={c.campaign}>
                    <td>{c.campaign}</td>
                    <td><strong>{c.count}</strong></td>
                    <td>{data.total ? Math.round((c.count / data.total) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
