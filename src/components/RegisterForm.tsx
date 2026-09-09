"use client";
import { useState, useEffect } from "react";
import styles from "./RegisterForm.module.css";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const AGE_RANGES = ["18-24 anos","25-34 anos","35-44 anos","45-54 anos","55-64 anos","65+ anos"];
const HOW_FOUND = ["Indicação de amigo/familiar","Grupo de WhatsApp","Instagram","Facebook","TikTok","YouTube","Pesquisa no Google","Outro"];

type FormData = {
  name: string; whatsapp: string; city: string; state: string;
  age_range: string; has_smartphone: string; has_support: string;
  how_found: string; consented: boolean;
};

type Status = "idle" | "loading" | "success" | "error";

export default function RegisterForm({ refCode }: { refCode?: string }) {
  const [form, setForm] = useState<FormData>({
    name:"", whatsapp:"", city:"", state:"", age_range:"",
    has_smartphone:"", has_support:"", how_found:"", consented: false
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [myCode, setMyCode] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag)
      (window as any).gtag("event", "form_start");
  }, []);

  function set(key: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setTouched(t => ({ ...t, [key]: true }));
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g,"").slice(0,11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  function validate(): string | null {
    if (!form.name.trim() || form.name.trim().length < 3) return "Nome completo obrigatório (mínimo 3 letras).";
    if (form.whatsapp.replace(/\D/g,"").length < 10) return "WhatsApp inválido. Inclua DDD.";
    if (!form.city.trim()) return "Cidade obrigatória.";
    if (!form.state) return "Selecione seu estado.";
    if (!form.age_range) return "Selecione sua faixa etária.";
    if (!form.has_smartphone) return "Informe se possui smartphone.";
    if (!form.has_support) return "Informe se possui suporte para gravação.";
    if (!form.how_found) return "Como conheceu a equipe?";
    if (!form.consented) return "Você precisa ler e aceitar os termos.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStatus("error"); return; }
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ref: refCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar.");
      setMyCode(data.referral_code || "");
      setStatus("success");
      if (typeof window !== "undefined" && (window as any).gtag)
        (window as any).gtag("event", "form_submit", { event_label: "register_success" });
      if (typeof window !== "undefined" && (window as any).fbq)
        (window as any).fbq("track", "Lead");
    } catch (e: any) {
      setErrorMsg(e.message || "Erro ao enviar. Tente novamente.");
      setStatus("error");
    }
  }

  const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";
  const WA_MSG = encodeURIComponent(`Olá! Me cadastrei na Equipe Ademilson. Meu nome é ${form.name}.${myCode ? ` Meu código de indicação é: ${myCode}` : ''}`);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${WA_MSG}`;

  if (status === "success") {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✅</div>
        <h3>Cadastro realizado!</h3>
        <p>Obrigado, <strong>{form.name.split(" ")[0]}</strong>! Clique abaixo para entrar no grupo e receber as instruções.</p>
        {myCode && (
          <div className={styles.refBox}>
            <p>Seu código de indicação:</p>
            <strong className={styles.refCode}>{myCode}</strong>
            <p>Compartilhe com amigos usando o link:</p>
            <code className={styles.refLink}>{typeof window !== "undefined" ? window.location.origin : ""}/entrar?ref={myCode}</code>
          </div>
        )}
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{marginTop:"24px",display:"inline-flex",gap:"8px"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Entrar na Equipe pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid2}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">Nome completo *</label>
          <input id="reg-name" className={`form-input${touched.name && !form.name.trim() ? " error" : ""}`} type="text" placeholder="Seu nome completo" value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-whatsapp">WhatsApp (com DDD) *</label>
          <input id="reg-whatsapp" className={`form-input${touched.whatsapp && form.whatsapp.replace(/\D/g,"").length < 10 ? " error" : ""}`} type="tel" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => set("whatsapp", formatPhone(e.target.value))} required />
        </div>
      </div>
      <div className={styles.grid2}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-city">Cidade *</label>
          <input id="reg-city" className="form-input" type="text" placeholder="Sua cidade" value={form.city} onChange={e => set("city", e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-state">Estado *</label>
          <select id="reg-state" className={`form-select${touched.state && !form.state ? " error" : ""}`} value={form.state} onChange={e => set("state", e.target.value)} required>
            <option value="">Selecione</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.grid2}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-age">Faixa etária *</label>
          <select id="reg-age" className="form-select" value={form.age_range} onChange={e => set("age_range", e.target.value)} required>
            <option value="">Selecione</option>
            {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-found">Como conheceu a equipe? *</label>
          <select id="reg-found" className="form-select" value={form.how_found} onChange={e => set("how_found", e.target.value)} required>
            <option value="">Selecione</option>
            {HOW_FOUND.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.grid2}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-phone">Possui smartphone? *</label>
          <select id="reg-phone" className="form-select" value={form.has_smartphone} onChange={e => set("has_smartphone", e.target.value)} required>
            <option value="">Selecione</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-support">Possui suporte para gravação POV? *</label>
          <select id="reg-support" className="form-select" value={form.has_support} onChange={e => set("has_support", e.target.value)} required>
            <option value="">Selecione</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
            <option value="Pretendo adquirir">Pretendo adquirir</option>
          </select>
        </div>
      </div>
      <label className="checkbox-label">
        <input type="checkbox" checked={form.consented} onChange={e => set("consented", e.target.checked)} required />
        <span>
          Li as informações e entendi que a participação <strong>não garante renda ou aprovação de vídeos</strong>. Os valores e regras dependem de cada projeto. A Equipe Ademilson não cobra taxas. Concordo com a{" "}
          <a href="/privacidade" target="_blank" style={{color:"var(--gold)"}}>Política de Privacidade</a>.
        </span>
      </label>
      {(status === "error" && errorMsg) && (
        <div className={styles.alert}>{errorMsg}</div>
      )}
      <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={status === "loading"}>
        {status === "loading" ? "Enviando..." : "Quero participar →"}
      </button>
      <p className={styles.hint}>🔒 Seus dados não serão compartilhados com terceiros sem seu consentimento.</p>
    </form>
  );
}
