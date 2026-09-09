"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import RegisterForm from "@/components/RegisterForm";
import FAQ from "@/components/FAQ";
import styles from "./page.module.css";

const APPROVED_PHONES = {
  ios: [
    "iPhone 12 / 12 Mini / 12 Pro / 12 Pro Max",
    "iPhone 13 / 13 Mini / 13 Pro / 13 Pro Max",
    "iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max",
    "iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max",
    "iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max",
    "iPhone 17 / 17 Plus / 17 Pro / 17 Pro Max",
  ],
  pixel: [
    "Pixel 6 / 6 Pro / 6a",
    "Pixel 7 / 7 Pro / 7a",
    "Pixel 8 / 8 Pro / 8a",
    "Pixel 9 / 9 Pro / 9 Pro XL / 9 Pro Fold",
    "Pixel Fold",
  ],
  samsung: [
    "Galaxy S21 / S21+ / S21 Ultra",
    "Galaxy S22 / S22+ / S22 Ultra",
    "Galaxy S23 / S23+ / S23 Ultra",
    "Galaxy S24 / S24+ / S24 Ultra",
    "Galaxy S25 / S25+ / S25 Ultra",
  ],
};

function HomeContent() {
  const params = useSearchParams();
  const ref = params.get("ref") || undefined;
  const [activeTab, setActiveTab] = useState<"ios" | "pixel" | "samsung">("ios");

  return (
    <>
      {/* ===== HERO ===== */}
      <section className={styles.hero} id="inicio">
        <div className={styles.heroBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.grid} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={`${styles.heroText} fade-up`}>
            <span className="section-tag">🇧🇷 Divulgação Nacional</span>
            <h1 className={styles.heroTitle}>
              Grave vídeos do dia a dia e participe de{" "}
              <span className="gradient-text">projetos de treinamento de IA</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Conheça a <strong>Equipe Ademilson</strong> e aprenda como participar de projetos de gravação em
              primeira pessoa (POV), seguindo os requisitos de cada plataforma.
            </p>
            <div className={`${styles.heroBadge} fade-up delay-1`}>
              <span className="badge-free">✅ Entrada gratuita — sem taxa para participar</span>
            </div>
            <div className={`${styles.heroBtns} fade-up delay-2`}>
              <a
                href="#participar"
                className="btn btn-primary"
                onClick={() => typeof window !== "undefined" && (window as any).gtag?.("event", "click_participar")}
              >
                🎯 Quero participar
              </a>
              <a
                href="#como-funciona"
                className="btn btn-outline"
                onClick={() => typeof window !== "undefined" && (window as any).gtag?.("event", "click_como_funciona")}
              >
                Como funciona
              </a>
            </div>
          </div>
          <div className={`${styles.heroVisual} fade-up delay-3`}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneMock}>
                <div className={styles.phoneScreen}>
                  <div className={styles.povOverlay}>
                    <span className={styles.povBadge}>● POV</span>
                    <div className={styles.povTask}>Lavando louça…</div>
                    <div className={styles.povProgress}>
                      <div className={styles.povBar} />
                    </div>
                    <div className={styles.povStatus}>📡 Enviando para IA</div>
                  </div>
                </div>
              </div>
              <div className={styles.floatCard1}>
                <span>🤖</span>
                <span>IA em treinamento</span>
              </div>
              <div className={styles.floatCard2}>
                <span>📹</span>
                <span>Vídeo aprovado!</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.scrollHint}>
          <span>↓</span>
        </div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="section" id="como-funciona">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 56 }}>
            <span className="section-tag">Passo a passo</span>
            <h2 className="section-title">Como <span>funciona</span></h2>
            <p className="section-subtitle">
              Simples, transparente e direto ao ponto. Sem pegadinhas.
            </p>
          </div>
          <div className={styles.steps}>
            {[
              { n: "1", icon: "🔍", title: "Conheça o projeto", desc: "Acesse as informações sobre o projeto disponível e entenda o que é esperado antes de começar." },
              { n: "2", icon: "📋", title: "Aprenda os requisitos", desc: "Cada projeto tem critérios específicos: tipo de tarefa, formato do vídeo, iluminação e duração. Siga exatamente o que for pedido." },
              { n: "3", icon: "🎥", title: "Grave as tarefas", desc: "Utilize seu smartphone com suporte POV para gravar as tarefas solicitadas no ambiente adequado." },
              { n: "4", icon: "📤", title: "Envie e aguarde", desc: "Envie os vídeos pela plataforma. O pagamento, quando previsto, depende do material aprovado — não da quantidade enviada." },
            ].map((step) => (
              <div key={step.n} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.n}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className={styles.infoBox}>
            <span>ℹ️</span>
            <p>
              O pagamento, quando previsto pelo projeto, depende exclusivamente do material <strong>aprovado</strong> pela plataforma — não da quantidade enviada. A Equipe Ademilson não garante aprovação nem renda mínima.
            </p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== MODELOS DE CELULARES APROVADOS ===== */}
      <section className="section" id="modelos-aprovados">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
              ⚡ Dispositivos Homologados
            </span>
            <h2 className="section-title">Modelos de Celulares <span style={{ color: "#4ade80" }}>Aprovados</span></h2>
            <p className="section-subtitle">
              Para garantir a qualidade exigida nos treinamentos de Inteligência Artificial, confira a lista oficial dos aparelhos compatíveis com o aplicativo:
            </p>
          </div>

          <div className={styles.phoneListContainer}>
            <div className={styles.phoneTabs}>
              <button
                className={`${styles.phoneTabBtn} ${activeTab === "ios" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("ios")}
              >
                <span>🍎</span> Apple iOS
              </button>
              <button
                className={`${styles.phoneTabBtn} ${activeTab === "pixel" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("pixel")}
              >
                <span>📱</span> Google Pixel
              </button>
              <button
                className={`${styles.phoneTabBtn} ${activeTab === "samsung" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("samsung")}
              >
                <span>Galaxy</span> Samsung S
              </button>
            </div>

            <div className={styles.phoneTabContent}>
              {activeTab === "ios" && (
                <div className={styles.phoneGroup}>
                  <h3 className={styles.phoneGroupTitle}><span>📱</span> Linha iPhone (iOS)</h3>
                  <ul className={styles.phoneGridList}>
                    {APPROVED_PHONES.ios.map((model) => (
                      <li key={model} className={styles.phoneItem}>
                        <span className={styles.phoneCheck}>✓</span> {model}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "pixel" && (
                <div className={styles.phoneGroup}>
                  <h3 className={styles.phoneGroupTitle}><span>🤖</span> Android — Google Pixel</h3>
                  <ul className={styles.phoneGridList}>
                    {APPROVED_PHONES.pixel.map((model) => (
                      <li key={model} className={styles.phoneItem}>
                        <span className={styles.phoneCheck}>✓</span> {model}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "samsung" && (
                <div className={styles.phoneGroup}>
                  <h3 className={styles.phoneGroupTitle}><span>⭐</span> Android — Samsung Galaxy S</h3>
                  <ul className={styles.phoneGridList}>
                    {APPROVED_PHONES.samsung.map((model) => (
                      <li key={model} className={styles.phoneItem}>
                        <span className={styles.phoneCheck}>✓</span> {model}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.approvedBanner}>
              <div className={styles.approvedNotice}>
                <span>💡</span>
                <p>
                  <strong>Atenção:</strong> O aplicativo exige câmeras com estabilização e sensores de alta precisão presentes nos modelos listados acima (iPhones 12 ao 17, Google Pixel 6 ao 9/Fold, e Samsung Galaxy S21 ao S25).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== QUE TIPO DE VÍDEO ===== */}
      <section className="section" id="tipo-video">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Exemplos de tarefas</span>
            <h2 className="section-title">Que tipo de <span>vídeo</span>?</h2>
            <p className="section-subtitle">
              Os projetos geralmente envolvem tarefas simples do cotidiano, gravadas em primeira pessoa (POV). Confira alguns exemplos:
            </p>
          </div>
          <div className={styles.tasksGrid}>
            {[
              { icon: "🍽️", label: "Lavar louça" },
              { icon: "👕", label: "Dobrar roupas" },
              { icon: "📦", label: "Organizar objetos" },
              { icon: "🧹", label: "Limpar ambientes" },
              { icon: "🛒", label: "Organizar itens" },
              { icon: "🥗", label: "Preparar alimentos" },
              { icon: "📚", label: "Organizar estantes" },
              { icon: "🪴", label: "Cuidar de plantas" },
            ].map((t) => (
              <div key={t.label} className={styles.taskCard}>
                <span className={styles.taskIcon}>{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.infoBox} style={{ marginTop: 32 }}>
            <span>📌</span>
            <p>As tarefas específicas são definidas por cada projeto. A lista acima é apenas ilustrativa. Siga sempre as instruções exatas fornecidas.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== O QUE VOCÊ PRECISA ===== */}
      <section className="section" id="o-que-voce-precisa">
        <div className="container">
          <div className={styles.requiresWrap}>
            <div>
              <span className="section-tag">Requisitos</span>
              <h2 className="section-title">O que você <span>precisa</span>?</h2>
              <p className="section-subtitle">
                Requisitos gerais para participar. Os critérios exatos podem variar conforme o projeto.
              </p>
              <ul className={styles.checkList}>
                {[
                  ["✓", "Smartphone compatível homologado (iOS, Pixel ou Galaxy S)"],
                  ["✓", "Suporte adequado para gravação em primeira pessoa (POV)"],
                  ["✓", "Ambiente apropriado e com boa iluminação"],
                  ["✓", "Seguir exatamente as instruções de cada projeto"],
                  ["✓", "Conexão à internet para envio dos arquivos"],
                  ["✓", "Atenção aos critérios de qualidade exigidos"],
                  ["⚠", "Equipamentos aceitos dependem do aplicativo e da plataforma parceira"],
                ].map(([icon, text]) => (
                  <li key={text} className={icon === "⚠" ? styles.checkWarn : styles.checkOk}>
                    <span className={styles.checkIcon}>{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.requiresCard}>
              <h3>📱 Seu modelo está na lista?</h3>
              <p>Se você tem um dos iPhones (12 ao 17), Google Pixel (6 ao 9) ou Samsung Galaxy (S21 ao S25) e suporte POV, dê o primeiro passo.</p>
              <a href="#participar" className="btn btn-primary" style={{ marginTop: 8 }}>Quero me cadastrar</a>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== É GRATUITO ===== */}
      <section className={`section ${styles.freeSection}`} id="gratuito">
        <div className="container">
          <div className="text-center">
            <span className="section-tag">Transparência total</span>
            <h2 className="section-title" style={{ fontSize: "clamp(32px,6vw,52px)" }}>
              Você <span>NÃO</span> precisa<br />pagar para entrar.
            </h2>
            <div className={styles.freeGrid}>
              {[
                { icon: "🚫", label: "Taxa de cadastro" },
                { icon: "🚫", label: "Taxa de participação" },
                { icon: "🚫", label: "Taxa de saque" },
                { icon: "🚫", label: "Taxa de mudança de nível" },
              ].map((item) => (
                <div key={item.label} className={styles.freeCard}>
                  <span>{item.icon}</span>
                  <span>Sem {item.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.freeDisclaimer}>
              <p>
                A Equipe Ademilson <strong>não garante aprovação de vídeos nem renda mínima</strong>. O pagamento, quando existir, depende exclusivamente dos critérios e disponibilidade de cada projeto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== FAQ ===== */}
      <FAQ />

      <div className="divider" />

      {/* ===== FORMULÁRIO ===== */}
      <section className={`section ${styles.formSection}`} id="participar">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-tag">Cadastro gratuito</span>
            <h2 className="section-title">Quero <span>participar</span></h2>
            <p className="section-subtitle">
              Preencha seus dados e nossa equipe entrará em contato com as orientações para participação.
            </p>
            {ref && (
              <div className={styles.refNotice}>
                🎯 Você foi indicado por um membro da equipe! Código: <strong>{ref}</strong>
              </div>
            )}
          </div>
          <div className={styles.formWrap}>
            <RegisterForm refCode={ref} />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== WHATSAPP CTA ===== */}
      <section className={`section ${styles.waCta}`}>
        <div className="container text-center">
          <h2 className="section-title">Prefere falar <span>diretamente</span>?</h2>
          <p className="section-subtitle" style={{ margin: "16px auto 32px" }}>
            Entre em contato pelo WhatsApp para tirar dúvidas antes de se cadastrar.
          </p>
          <WhatsAppButton label="Entrar na Equipe pelo WhatsApp" eventLabel="footer_cta" />
          <p className={styles.waHint}>Horário de atendimento pode variar. Não garantimos resposta imediata.</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div>
              <div className={styles.footerLogo}>🎥 Equipe <strong>Ademilson</strong></div>
              <p>Renda com Vídeo IA — Divulgação Nacional</p>
            </div>
            <div className={styles.footerLinks}>
              <a href="#como-funciona">Como funciona</a>
              <a href="#modelos-aprovados">Aparelhos Aceitos</a>
              <a href="#gratuito">Transparência</a>
              <a href="#faq">FAQ</a>
              <a href="#participar">Participar</a>
              <a href="/privacidade">Privacidade</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} Equipe Ademilson. Todos os direitos reservados.</p>
            <p>
              Esta página tem caráter informativo. Não representa oferta formal de emprego. Os valores e regras dependem dos projetos vigentes.
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999"}`} target="_blank" rel="noopener noreferrer" className={styles.waFloat} aria-label="WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div />}>
        <HomeContent />
      </Suspense>
    </>
  );
}
