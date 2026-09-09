"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./admin.module.css";

type Reg = {
  id: number; name: string; whatsapp: string; city: string; state: string;
  age_range: string; has_smartphone: string; has_support: string;
  how_found: string; referral_code: string | null; my_referral_code: string | null;
  referrals_count: number; utm_source: string | null; created_at: string;
};
type Stats = { total: number; by_state: any[]; by_how_found: any[]; recent_week: number };

export default function AdminPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState(false);
  const [data, setData] = useState<{ registrations: Reg[]; stats: Stats } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const getAuth = () => "Basic " + btoa(`admin:${pass}`);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthErr(false);
    const res = await fetch(`/api/admin?page=${page}`, { headers: { Authorization: getAuth() } });
    if (res.ok) {
      const json = await res.json();
      setData(json); setAuthed(true);
    } else {
      setAuthErr(true);
    }
    setLoading(false);
  }

  const fetchData = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    const res = await fetch(`/api/admin?page=${page}`, { headers: { Authorization: getAuth() } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [authed, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function exportCsv() {
    const a = document.createElement("a");
    a.href = "/api/export";
    const auth = getAuth();
    fetch("/api/export", { headers: { Authorization: auth } })
      .then(r => r.blob())
      .then(blob => {
        a.href = URL.createObjectURL(blob);
        a.download = `cadastros-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
      });
  }

  const filtered = data?.registrations.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase()) ||
    r.whatsapp.includes(search)
  ) || [];

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>🎥 Equipe <strong>Ademilson</strong></div>
          <h1>Painel Administrativo</h1>
          <form onSubmit={login} className={styles.loginForm}>
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <input className="form-input" type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="admin" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {authErr && <div className={styles.err}>Senha incorreta.</div>}
            <button type="submit" className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className={styles.hint}>Configure a senha em <code>.env.local → ADMIN_PASSWORD</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.admin}>
      <header className={styles.header}>
        <div className={styles.headerLogo}>🎥 Equipe Ademilson — Admin</div>
        <div className={styles.headerActions}>
          <button onClick={exportCsv} className="btn btn-outline" style={{fontSize:"14px",padding:"8px 16px"}}>⬇ Exportar CSV</button>
          <button onClick={() => { setAuthed(false); setData(null); }} className={styles.logout}>Sair</button>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{data?.stats.total ?? 0}</div>
            <div className={styles.statLabel}>Total de cadastros</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{data?.stats.recent_week ?? 0}</div>
            <div className={styles.statLabel}>Últimos 7 dias</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{data?.stats.by_state.length ?? 0}</div>
            <div className={styles.statLabel}>Estados representados</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statNum} ${styles.statGold}`}>
              {data?.registrations.reduce((acc, r) => acc + r.referrals_count, 0) ?? 0}
            </div>
            <div className={styles.statLabel}>Total de indicações</div>
          </div>
        </div>

        {/* Mini charts */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Por Estado (top 8)</h3>
            {data?.stats.by_state.slice(0,8).map((s: any) => (
              <div key={s.state} className={styles.bar}>
                <span className={styles.barLabel}>{s.state}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{width:`${Math.round((s.count / (data.stats.total||1))*100)}%`}} />
                </div>
                <span className={styles.barCount}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className={styles.chartCard}>
            <h3>Como conheceu</h3>
            {data?.stats.by_how_found.map((h: any) => (
              <div key={h.how_found} className={styles.bar}>
                <span className={styles.barLabel} style={{fontSize:"11px"}}>{h.how_found}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{width:`${Math.round((h.count / (data.stats.total||1))*100)}%`,background:"linear-gradient(90deg,#25d366,#128c7e)"}} />
                </div>
                <span className={styles.barCount}>{h.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Cadastros ({data?.stats.total})</h3>
            <input className={`form-input ${styles.search}`} type="text" placeholder="Buscar por nome, cidade, WA..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th><th>Nome</th><th>WhatsApp</th><th>Cidade</th><th>Estado</th>
                  <th>Faixa</th><th>Smartphone</th><th>Suporte</th><th>Origem</th>
                  <th>Veio de</th><th>Meu código</th><th>Indicou</th><th>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>
                      <a href={`https://wa.me/55${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.waLink}>
                        {r.whatsapp}
                      </a>
                    </td>
                    <td>{r.city}</td>
                    <td>{r.state}</td>
                    <td>{r.age_range}</td>
                    <td>{r.has_smartphone}</td>
                    <td>{r.has_support}</td>
                    <td>{r.how_found}</td>
                    <td>{r.referral_code || "—"}</td>
                    <td><code>{r.my_referral_code || "—"}</code></td>
                    <td className={r.referrals_count > 0 ? styles.positiveCount : ""}>{r.referrals_count}</td>
                    <td>{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={13} className={styles.empty}>Nenhum cadastro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button className="btn btn-outline" style={{padding:"8px 16px",fontSize:"13px"}} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Anterior</button>
            <span>Página {page}</span>
            <button className="btn btn-outline" style={{padding:"8px 16px",fontSize:"13px"}} onClick={() => setPage(p => p+1)} disabled={(data?.registrations.length || 0) < 50}>Próxima →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
