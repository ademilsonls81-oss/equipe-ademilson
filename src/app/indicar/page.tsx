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

export default function IndicarPage() {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [top, setTop] = useState<TopReferrer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function copyLink() {
    if (!stats) return;
    const url = `${window.location.origin}/?ref=${stats.my_referral_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    if (!stats) return;
    const url = `${window.location.origin}/?ref=${stats.my_referral_code}`;
    const msg = `Estou na Equipe Ademilson e quero te convidar! Cadastre-se aqui: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function shareTwitter() {
    if (!stats) return;
    const url = `${window.location.origin}/?ref=${stats.my_referral_code}`;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Estou na Equipe Ademilson! Cadastre-se para gravar vídeos para IA.")}`,
      "_blank"
    );
  }

  function shareFacebook() {
    if (!stats) return;
    const url = `${window.location.origin}/?ref=${stats.my_referral_code}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Indicação</span>
          <h1 className="section-title">
            Indique e <span>acompanhe</span>
          </h1>
          <p className="section-subtitle">
            Compartilhe seu código com amigos e acompanhe quantas pessoas você trouxe para a equipe.
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
                  <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={shareWhatsApp}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <button className={`${styles.shareBtn} ${styles.twitter}`} onClick={shareTwitter}>
                    X / Twitter
                  </button>
                  <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={shareFacebook}>
                    Facebook
                  </button>
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
