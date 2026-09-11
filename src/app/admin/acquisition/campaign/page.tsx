"use client";
import { useState, useCallback } from "react";
import styles from "./campaign.module.css";

type CampaignContent = {
  id: number;
  campaign_id: string;
  content_index: number;
  platform: string;
  title: string;
  body: string;
  cta: string;
  url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  status: string;
  sessions: number;
  registrations: number;
  whatsapp_clicks: number;
  referrals: number;
  score: number;
  published_at: string | null;
};

type CampaignStats = {
  campaign_id: string;
  totalContents: number;
  published: number;
  ready: number;
  measuring: number;
  totalSessions: number;
  totalRegistrations: number;
  totalWhatsapp: number;
  totalReferrals: number;
  conversionRate: number;
  whatsappRate: number;
  memberRate: number;
  byPlatform: { platform: string; count: number; sessions: number; registrations: number; whatsapp_clicks: number; referrals: number; published: number }[];
  byContent: { content_index: number; title: string; sessions: number; registrations: number; whatsapp_clicks: number; referrals: number; platforms: number }[];
  bestContent: any;
  bestPlatform: any;
  bestCTA: any;
  bestLandingPage: any;
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "📺", tiktok: "🎵", instagram: "📷",
  facebook: "📘", pinterest: "📌", reddit: "🤖",
};

const PLATFORM_NAMES: Record<string, string> = {
  youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram",
  facebook: "Facebook", pinterest: "Pinterest", reddit: "Reddit",
};

const CONTENT_THEMES = [
  "O que são os vídeos para treinamento de IA",
  "Como funciona a participação no projeto",
  "Quem pode participar",
  "Quanto uma pessoa pode ganhar (estimativas)",
  "Como entrar e começar",
];

const PLATFORMS = ["youtube", "tiktok", "instagram", "facebook", "pinterest", "reddit"];

export default function CampaignPage() {
  const [auth, setAuth] = useState("");
  const [authed, setAuthed] = useState(false);
  const [contents, setContents] = useState<CampaignContent[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedContent, setExpandedContent] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    try {
      const res = await fetch("/api/content-engine?campaign=true&campaign_id=primeiro-100-membros", { headers });
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);
        setStats(data.stats || null);
        setAuthed(true);
      } else { setError(true); }
    } catch { setError(true); }
    setLoading(false);
  }

  async function refresh() {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}` };
    const res = await fetch("/api/content-engine?campaign=true&campaign_id=primeiro-100-membros", { headers });
    if (res.ok) { const data = await res.json(); setContents(data.contents || []); setStats(data.stats || null); }
  }

  async function markPublished(contentIndex: number, platform: string) {
    const headers = { Authorization: `Basic ${btoa(`admin:${auth}`)}`, "Content-Type": "application/json" };
    await fetch("/api/content-engine", {
      method: "POST", headers,
      body: JSON.stringify({ action: "update_campaign_content", campaign_id: "primeiro-100-membros", content_index: contentIndex, platform, status: "publicado", published_at: new Date().toISOString() }),
    });
    await refresh();
  }

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  function buildFullContent(item: CampaignContent): string {
    const utm = `utm_source=${item.utm_source}&utm_medium=${item.utm_medium}&utm_campaign=${item.utm_campaign}&utm_content=${item.utm_content}`;
    return `TÍTULO:\n${item.title}\n\nTEXTO:\n${item.body}\n\nCTA:\n${item.cta}\n\nURL:\n${item.url}\n\nUTM:\n${utm}`;
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>🚀</div>
          <h1>PRIMEIRA CAMPANHA</h1>
          <p>primeiro-100-membros</p>
          <form onSubmit={login} className={styles.loginForm}>
            <input className={styles.input} type="password" placeholder="Senha" value={auth} onChange={(e) => setAuth(e.target.value)} required />
            {error && <div className={styles.err}>Senha incorreta.</div>}
            <button type="submit" className={styles.btn} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  const publishedByPlatform: Record<string, number> = {};
  const totalByPlatform: Record<string, number> = {};
  for (const c of contents) {
    totalByPlatform[c.platform] = (totalByPlatform[c.platform] || 0) + 1;
    if (c.status === "publicado") publishedByPlatform[c.platform] = (publishedByPlatform[c.platform] || 0) + 1;
  }

  const groupedByContent = contents.reduce((acc, c) => {
    if (!acc[c.content_index]) acc[c.content_index] = [];
    acc[c.content_index].push(c);
    return acc;
  }, {} as Record<number, CampaignContent[]>);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>🚀 PRIMEIRA CAMPANHA</h1>
        <div className={styles.headerActions}>
          <span className={styles.badge}>primeiro-100-membros</span>
          <button className={styles.btnRefresh} onClick={refresh}>🔄 Atualizar</button>
          <a href="/admin/acquisition/content-engine" className={styles.link}>← Content Engine</a>
        </div>
      </header>

      {contents.length === 0 ? (
        <div className={styles.section}>
          <div className={styles.emptyState}>
            <p>Nenhum conteúdo gerado ainda.</p>
          </div>
        </div>
      ) : (
        <>
          {/* CHECKLIST DE PUBLICAÇÃO */}
          <div className={styles.section}>
            <h2>✅ CHECKLIST DE PUBLICAÇÃO</h2>
            <p className={styles.sectionDesc}>Marque cada conteúdo como publicado depois de postar manualmente</p>
            <div className={styles.checklistGrid}>
              {PLATFORMS.map(p => {
                const pub = publishedByPlatform[p] || 0;
                const tot = totalByPlatform[p] || 0;
                const done = pub === tot && tot > 0;
                return (
                  <div key={p} className={`${styles.checklistCard} ${done ? styles.checklistDone : ""}`}>
                    <div className={styles.checklistIcon}>{PLATFORM_ICONS[p]}</div>
                    <div className={styles.checklistPlatform}>{PLATFORM_NAMES[p]}</div>
                    <div className={styles.checklistCount}>{pub}/{tot}</div>
                    <div className={styles.checklistBar}>
                      <div className={styles.checklistBarFill} style={{ width: tot > 0 ? `${(pub / tot) * 100}%` : "0%" }}></div>
                    </div>
                    <div className={styles.checklistStatus}>{done ? "✅ COMPLETO" : "📝 PENDENTE"}</div>
                  </div>
                );
              })}
            </div>
            <div className={styles.totalChecklist}>
              <span>TOTAL:</span>
              <span className={styles.totalCount}>{contents.filter(c => c.status === "publicado").length}/{contents.length}</span>
            </div>
          </div>

          {/* MÉTRICAS GERAIS */}
          <div className={styles.section}>
            <h2>📊 MÉTRICAS DA CAMPANHA</h2>
            <div className={styles.grid5}>
              <div className={styles.cardBig}><div className={styles.cardIcon}>📄</div><div className={styles.cardValue}>{stats?.totalContents || 0}</div><div className={styles.cardLabel}>Conteúdos</div></div>
              <div className={`${styles.cardBig} ${styles.cardGreen}`}><div className={styles.cardIcon}>✅</div><div className={styles.cardValue}>{stats?.published || 0}</div><div className={styles.cardLabel}>Publicados</div></div>
              <div className={`${styles.cardBig} ${styles.cardYellow}`}><div className={styles.cardIcon}>👁️</div><div className={styles.cardValue}>{stats?.totalSessions || 0}</div><div className={styles.cardLabel}>Visitantes</div></div>
              <div className={`${styles.cardBig} ${styles.cardPurple}`}><div className={styles.cardIcon}>📋</div><div className={styles.cardValue}>{stats?.totalRegistrations || 0}</div><div className={styles.cardLabel}>Cadastros</div></div>
              <div className={`${styles.cardBig} ${styles.cardGold}`}><div className={styles.cardIcon}>📱</div><div className={styles.cardValue}>{stats?.totalWhatsapp || 0}</div><div className={styles.cardLabel}>WhatsApp</div></div>
            </div>
            <div className={styles.grid5}>
              <div className={`${styles.cardBig} ${styles.cardGreen}`}><div className={styles.cardIcon}>👥</div><div className={styles.cardValue}>{stats?.totalReferrals || 0}</div><div className={styles.cardLabel}>Membros</div></div>
              <div className={styles.cardBig}><div className={styles.cardIcon}>📊</div><div className={styles.cardValue}>{stats?.conversionRate || 0}%</div><div className={styles.cardLabel}>Conversão</div></div>
              <div className={styles.cardBig}><div className={styles.cardIcon}>📱</div><div className={styles.cardValue}>{stats?.whatsappRate || 0}%</div><div className={styles.cardLabel}>Taxa WhatsApp</div></div>
              <div className={styles.cardBig}><div className={styles.cardIcon}>🎯</div><div className={styles.cardValue}>{stats?.memberRate || 0}%</div><div className={styles.cardLabel}>Taxa Membro</div></div>
              <div className={styles.cardBig}><div className={styles.cardIcon}>📝</div><div className={styles.cardValue}>{stats?.ready || 0}</div><div className={styles.cardLabel}>Prontos</div></div>
            </div>
          </div>

          {/* RANKING */}
          <div className={styles.section}>
            <h2>🏆 RANKING</h2>
            <div className={styles.grid4}>
              <div className={styles.rankCard}>
                <div className={styles.rankIcon}>📝</div>
                <div className={styles.rankLabel}>Melhor Conteúdo</div>
                <div className={styles.rankValue}>{stats?.bestContent?.title ? `#${stats.bestContent.content_index}` : "N/A"}</div>
                <div className={styles.rankDetail}>{stats?.bestContent?.title || "Aguardando dados"}</div>
                <div className={styles.rankScore}>{stats?.bestContent?.referrals || 0} membros</div>
              </div>
              <div className={styles.rankCard}>
                <div className={styles.rankIcon}>🌐</div>
                <div className={styles.rankLabel}>Melhor Plataforma</div>
                <div className={styles.rankValue}>{stats?.bestPlatform?.platform || "N/A"}</div>
                <div className={styles.rankDetail}>{stats?.bestPlatform ? `${stats.bestPlatform.published} publicados` : "Aguardando dados"}</div>
                <div className={styles.rankScore}>{stats?.bestPlatform?.referrals || 0} membros</div>
              </div>
              <div className={styles.rankCard}>
                <div className={styles.rankIcon}>🎯</div>
                <div className={styles.rankLabel}>Melhor CTA</div>
                <div className={styles.rankValue}>{stats?.bestCTA?.cta ? `"${stats.bestCTA.cta.substring(0, 30)}..."` : "N/A"}</div>
                <div className={styles.rankDetail}>{stats?.bestCTA?.cta || "Aguardando dados"}</div>
                <div className={styles.rankScore}>{stats?.bestCTA?.referrals || 0} membros</div>
              </div>
              <div className={styles.rankCard}>
                <div className={styles.rankIcon}>🌐</div>
                <div className={styles.rankLabel}>Melhor Landing Page</div>
                <div className={styles.rankValue}>{stats?.bestLandingPage?.landing_page ? stats.bestLandingPage.landing_page.substring(0, 30) + "..." : "N/A"}</div>
                <div className={styles.rankDetail}>{stats?.bestLandingPage?.landing_page || "Aguardando dados"}</div>
                <div className={styles.rankScore}>{stats?.bestLandingPage?.referrals || 0} membros</div>
              </div>
            </div>
          </div>

          {/* CONTEÚDOS PARA PUBLICAÇÃO */}
          <div className={styles.section}>
            <h2>📋 CONTEÚDOS PARA PUBLICAÇÃO</h2>
            <p className={styles.sectionDesc}>Copie o conteúdo e a URL, publique manualmente, depois marque como publicado</p>
            {Object.entries(groupedByContent).map(([idx, items]) => (
              <div key={idx} className={styles.contentGroup}>
                <div className={styles.contentGroupHeader} onClick={() => setExpandedContent(expandedContent === parseInt(idx) ? null : parseInt(idx))}>
                  <span className={styles.contentNumber}>#{idx}</span>
                  <span className={styles.contentTitle}>{CONTENT_THEMES[parseInt(idx) - 1] || items[0]?.title}</span>
                  <span className={styles.contentPublished}>{items.filter(i => i.status === "publicado").length}/{items.length} publicados</span>
                  <span className={styles.expandIcon}>{expandedContent === parseInt(idx) ? "▼" : "▶"}</span>
                </div>
                {expandedContent === parseInt(idx) && (
                  <div className={styles.contentDetails}>
                    {items.map(item => {
                      const fullContent = buildFullContent(item);
                      const utm = `utm_source=${item.utm_source}&utm_medium=${item.utm_medium}&utm_campaign=${item.utm_campaign}&utm_content=${item.utm_content}`;
                      const isPublished = item.status === "publicado";
                      return (
                        <div key={item.id} className={`${styles.contentCard} ${isPublished ? styles.contentCardPublished : ""}`}>
                          <div className={styles.contentCardHeader}>
                            <span className={styles.platformIcon}>{PLATFORM_ICONS[item.platform] || "📡"}</span>
                            <span className={styles.platformName}>{PLATFORM_NAMES[item.platform] || item.platform}</span>
                            <span className={`${styles.statusBadge} ${isPublished ? styles.badgePublicado : styles.badgePronto}`}>
                              {isPublished ? "✅ PUBLICADO" : "📝 NÃO PUBLICADO"}
                            </span>
                            {item.published_at && (
                              <span className={styles.publishDate}>📅 {new Date(item.published_at).toLocaleString("pt-BR")}</span>
                            )}
                          </div>

                          <div className={styles.contentField}>
                            <span className={styles.fieldLabel}>TÍTULO:</span>
                            <div className={styles.fieldValue}>{item.title}</div>
                          </div>

                          <div className={styles.contentField}>
                            <span className={styles.fieldLabel}>TEXTO/ROTEIRO:</span>
                            <div className={styles.fieldValue}>{item.body}</div>
                          </div>

                          <div className={styles.contentField}>
                            <span className={styles.fieldLabel}>CTA:</span>
                            <div className={styles.fieldValue}>{item.cta}</div>
                          </div>

                          <div className={styles.contentField}>
                            <span className={styles.fieldLabel}>URL DE DESTINO:</span>
                            <div className={styles.fieldUrl}>{item.url}</div>
                          </div>

                          <div className={styles.contentField}>
                            <span className={styles.fieldLabel}>UTM COMPLETA:</span>
                            <div className={styles.fieldUtm}>{utm}</div>
                          </div>

                          <div className={styles.contentActions}>
                            <button
                              className={`${styles.btnCopy} ${copiedId === `content-${item.id}` ? styles.btnCopied : ""}`}
                              onClick={() => copyToClipboard(fullContent, `content-${item.id}`)}
                            >
                              {copiedId === `content-${item.id}` ? "✅ COPIADO" : "📋 COPIAR CONTEÚDO"}
                            </button>
                            <button
                              className={`${styles.btnCopy} ${copiedId === `url-${item.id}` ? styles.btnCopied : ""}`}
                              onClick={() => copyToClipboard(item.url, `url-${item.id}`)}
                            >
                              {copiedId === `url-${item.id}` ? "✅ COPIADO" : "🔗 COPIAR URL"}
                            </button>
                            {!isPublished && (
                              <button className={styles.btnPublish} onClick={() => markPublished(item.content_index, item.platform)}>
                                ✅ MARCAR COMO PUBLICADO
                              </button>
                            )}
                          </div>

                          <div className={styles.contentMetrics}>
                            <span>👁️ {item.sessions} visitantes</span>
                            <span>📋 {item.registrations} cadastros</span>
                            <span>📱 {item.whatsapp_clicks} cliques WA</span>
                            <span>👥 {item.referrals} membros</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
