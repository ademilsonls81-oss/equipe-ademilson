"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./indicar.module.css";

type ReferralStats = {
  name: string;
  city: string;
  state: string;
  my_referral_code: string;
  referrals_count: number;
};

type TopReferrer = {
  code: string;
  name: string;
  city: string;
  state: string;
  referrals_count: number;
};

type ShareVariant = {
  id: string;
  text: string;
  cta: string;
};

const SHARE_VARIANTS: ShareVariant[] = [
  { id: "default", text: "Estou na Equipe Ademilson e quero te convidar! Cadastre-se aqui:", cta: "Quero Participar" },
  { id: "money", text: "Estou ganhando dinheiro gravando vídeos para IA! Quer saber como? Cadastre-se:", cta: "Quero Saber Mais" },
  { id: "easy", text: "Trabalho simples: gravar vídeos pelo celular. Quer participar? Cadastre-se:", cta: "Participar Agora" },
  { id: "urgent", text: "Vagas limitadas para gravar vídeos para IA! Cadastre-se rápido:", cta: "Garantir Minha Vaga" },
];

const SOCIAL_PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "#25D366" },
  { id: "telegram", name: "Telegram", icon: "✈️", color: "#0088cc" },
  { id: "twitter", name: "X / Twitter", icon: "🐦", color: "#1DA1F2" },
  { id: "facebook", name: "Facebook", icon: "📘", color: "#1877F2" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { id: "instagram", name: "Instagram", icon: "📷", color: "#E4405F" },
];

export default function IndicarPage() {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [top, setTop] = useState<TopReferrer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [trackShare, setTrackShare] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => setTop(data.top || []))
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setStats(null);
    try {
      const res = await fetch(`/api/referral?code=${encodeURIComponent(code.trim())}`);
      if (!res.ok) throw new Error("Código não encontrado.");
      const data = await res.json();
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }

  function getShareUrl(platform: string) {
    if (!stats) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const referralUrl = `${baseUrl}/?ref=${stats.my_referral_code}&utm_source=${platform}&utm_medium=referral&utm_campaign=viral_share`;
    return referralUrl;
  }

  function getShareText() {
    const variant = SHARE_VARIANTS[selectedVariant];
    return variant.text;
  }

  async function trackShareAction(platform: string) {
    if (!stats || !trackShare) return;
    try {
      const sessionId = localStorage.getItem("session_id") || "";
      await fetch("/api/referral-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "track",
          referrer_uid: stats.my_referral_code,
          referral_code: stats.my_referral_code,
          link_used: getShareUrl(platform),
          utm_source: platform,
          utm_medium: "referral",
          utm_campaign: "viral_share",
          platform,
          share_text: getShareText(),
          visitor_session_id: sessionId,
        }),
      });
    } catch {}
  }

  function copyLink() {
    if (!stats) return;
    const url = getShareUrl("clipboard");
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      trackShareAction("clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    if (!stats) return;
    const url = getShareUrl("whatsapp");
    const msg = `${getShareText()} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    trackShareAction("whatsapp");
  }

  function shareTelegram() {
    if (!stats) return;
    const url = getShareUrl("telegram");
    const msg = `${getShareText()} ${url}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`, "_blank");
    trackShareAction("telegram");
  }

  function shareTwitter() {
    if (!stats) return;
    const url = getShareUrl("twitter");
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(getShareText())}`,
      "_blank"
    );
    trackShareAction("twitter");
  }

  function shareFacebook() {
    if (!stats) return;
    const url = getShareUrl("facebook");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    trackShareAction("facebook");
  }

  function shareLinkedIn() {
    if (!stats) return;
    const url = getShareUrl("linkedin");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
    trackShareAction("linkedin");
  }

  function shareInstagram() {
    if (!stats) return;
    const url = getShareUrl("instagram");
    navigator.clipboard.writeText(`${getShareText()} ${url}`);
    trackShareAction("instagram");
    alert("Link copiado! Cole no seu story ou bio do Instagram.");
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Motor de Crescimento Viral</span>
          <h1 className="section-title">
            Indique e <span>multiplique</span>
          </h1>
          <p className="section-subtitle">
            Compartilhe seu link e acompanhe quantas pessoas você trouxe para a equipe.
          </p>
        </div>
      </section>

      <section className={styles.searchSection}>
        <div className="container">
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Digite seu código de indicação (ex: ADE472)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </section>

      {stats && (
        <section className={styles.statsSection}>
          <div className="container">
            <div className={styles.statsCard}>
              <div className={styles.statsHeader}>
                <h2>Olá, {stats.name.split(" ")[0]}!</h2>
                <p>Veja suas estatísticas de indicação</p>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.referrals_count}</span>
                  <span className={styles.statLabel}>Indicações</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statCode}>{stats.my_referral_code}</span>
                  <span className={styles.statLabel}>Seu código</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.city}/{stats.state}</span>
                  <span className={styles.statLabel}>Localização</span>
                </div>
              </div>

              <div className={styles.shareSection}>
                <h3>Escolha a mensagem para compartilhar</h3>
                <div className={styles.variantSelector}>
                  {SHARE_VARIANTS.map((variant, index) => (
                    <button
                      key={variant.id}
                      className={`${styles.variantBtn} ${selectedVariant === index ? styles.variantActive : ""}`}
                      onClick={() => setSelectedVariant(index)}
                      type="button"
                    >
                      {variant.cta}
                    </button>
                  ))}
                </div>

                <div className={styles.messagePreview}>
                  <p className={styles.messageText}>
                    {getShareText()}
                  </p>
                  <p className={styles.messageUrl}>
                    {siteUrl}/?ref={stats.my_referral_code}
                  </p>
                </div>

                <h3>Compartilhe seu link</h3>
                <div className={styles.linkBox}>
                  <code className={styles.linkCode}>
                    {siteUrl}/?ref={stats.my_referral_code}
                  </code>
                  <button className={styles.copyBtn} onClick={copyLink}>
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>

                <div className={styles.shareButtons}>
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const handleClick = () => {
                      switch (platform.id) {
                        case "whatsapp": shareWhatsApp(); break;
                        case "telegram": shareTelegram(); break;
                        case "twitter": shareTwitter(); break;
                        case "facebook": shareFacebook(); break;
                        case "linkedin": shareLinkedIn(); break;
                        case "instagram": shareInstagram(); break;
                      }
                    };
                    return (
                      <button
                        key={platform.id}
                        className={styles.shareBtn}
                        style={{ background: platform.color }}
                        onClick={handleClick}
                        type="button"
                      >
                        <span>{platform.icon}</span> {platform.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section className={styles.rankingSection}>
          <div className="container">
            <h2 className="section-title text-center">
              Ranking de <span>Indicadores</span>
            </h2>
            <p className="section-subtitle text-center" style={{ margin: "0 auto 40px" }}>
              Veja quem está trazendo mais pessoas para a equipe.
            </p>

            <div className={styles.rankingList}>
              {top.map((t, i) => (
                <div key={t.code} className={styles.rankingItem}>
                  <span className={`${styles.rank} ${i < 3 ? styles[`rank${i + 1}` as keyof typeof styles] : ""}`}>
                    {i + 1}º
                  </span>
                  <div className={styles.rankingInfo}>
                    <span className={styles.rankingName}>{t.name}</span>
                    <span className={styles.rankingLocation}>{t.city}/{t.state}</span>
                  </div>
                  <span className={styles.rankingCount}>{t.referrals_count} indicações</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className="section-title">Ainda não tem um código?</h2>
          <p className="section-subtitle" style={{ margin: "0 auto 24px" }}>
            Cadastre-se agora e receba seu código de indicação para compartilhar com amigos.
          </p>
          <Link href="/#participar" className="btn btn-primary">
            Quero participar →
          </Link>
        </div>
      </section>
    </main>
  );
}
