"use client";
import Link from "next/link";
import styles from "./vantagens.module.css";

const advantages = [
  {
    icon: "🆓",
    title: "100% Gratuito",
    description: "Não existe nenhuma taxa para participar. Você não paga nada para se cadastrar, receber projetos ou enviar vídeos. Cuidado com golpes que cobram taxas.",
  },
  {
    icon: "🏠",
    title: "Trabalhe de Casa",
    description: "Grave vídeos do seu dia a dia, no seu ritmo, sem precisar sair de casa. Tudo que você precisa é de um smartphone e um suporte para gravação.",
  },
  {
    icon: "⏰",
    title: "Horário Flexível",
    description: "Não existe horário fixo. Você grava quando quiser, como quiser. O importante é enviar vídeos de qualidade dentro dos prazos dos projetos.",
  },
  {
    icon: "📱",
    title: "Apenas um Celular",
    description: "Não precisa de equipamento caro. Um smartphone com câmera decente e um suporte de peito são suficientes para começar a gravar.",
  },
  {
    icon: "🤝",
    title: "Comunidade Ativa",
    description: "Faça parte de um grupo no WhatsApp com outras pessoas que também estão participando. Tire dúvidas, compartilhe experiências e aprenda junto.",
  },
  {
    icon: "📊",
    title: "Sistema de Indicação",
    description: "Indique amigos e acompanhe suas indicações. Compartilhe seu código e veja quantas pessoas você trouxe para a equipe.",
  },
  {
    icon: "🎓",
    title: "Sem Exigência de Experiência",
    description: "Não precisa ter experiência anterior. Os vídeos são gravados do seu ponto de vista, mostrando tarefas do dia a dia. Quanto mais natural, melhor.",
  },
  {
    icon: "🔒",
    title: "Dados Protegidos",
    description: "Seus dados pessoais são tratados com segurança e não são compartilhados com terceiros sem seu consentimento. Leia nossa Política de Privacidade.",
  },
  {
    icon: "🌐",
    title: "Projetos de Grandes Empresas",
    description: "Os vídeos ajudam a treinar IA de empresas globais. Você faz parte de um ecossistema que está moldando o futuro da tecnologia.",
  },
];

const testimonials = [
  {
    name: "Maria S.",
    city: "São Paulo, SP",
    text: "Comecei a gravar no meu tempo livre e foi uma experiência muito legal. O grupo do WhatsApp é muito acolhedor.",
  },
  {
    name: "João P.",
    city: "Belo Horizonte, MG",
    text: "Não precisei comprar nada além do suporte. Meu celular normal já serviu. O processo todo é bem simples.",
  },
  {
    name: "Ana L.",
    city: "Curitiba, PR",
    text: "Gostei da ideia de poder contribuir com algo que vai ajudar a tecnologia a evoluir. E o melhor: de graça!",
  },
];

export default function VantagensPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Vantagens</span>
          <h1 className="section-title">
            Por que participar da <span>Equipe Ademilson</span>?
          </h1>
          <p className="section-subtitle">
            Descubra os benefícios de fazer parte da nossa equipe de gravação de vídeos para Inteligência Artificial.
          </p>
        </div>
      </section>

      <section className={styles.advantagesSection}>
        <div className="container">
          <div className={styles.grid}>
            {advantages.map((adv, i) => (
              <div key={i} className={`${styles.card} fade-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                <span className={styles.icon}>{adv.icon}</span>
                <h3 className={styles.cardTitle}>{adv.title}</h3>
                <p className={styles.cardDesc}>{adv.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.compareSection}>
        <div className="container">
          <h2 className="section-title text-center">
            Comparativo com <span>outras plataformas</span>
          </h2>
          <div className={styles.compareGrid}>
            <div className={`${styles.compareCard} ${styles.our}`}>
              <div className={styles.compareHeader}>
                <span className={styles.compareIcon}>🎥</span>
                <h3>Equipe Ademilson</h3>
              </div>
              <ul className={styles.compareList}>
                <li className={styles.yes}>✓ Entrada 100% gratuita</li>
                <li className={styles.yes}>✓ Sem taxa de participação</li>
                <li className={styles.yes}>✓ Sem saque mínimo</li>
                <li className={styles.yes}>✓ Suporte via WhatsApp</li>
                <li className={styles.yes}>✓ Comunidade ativa</li>
                <li className={styles.yes}>✓ Sistema de indicação</li>
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.other}`}>
              <div className={styles.compareHeader}>
                <span className={styles.compareIcon}>⚠️</span>
                <h3>Outras Plataformas</h3>
              </div>
              <ul className={styles.compareList}>
                <li className={styles.no}>✗ Cobram taxa de cadastro</li>
                <li className={styles.no}>✗ Exigem investimento inicial</li>
                <li className={styles.no}>✗ Saque mínimo alto</li>
                <li className={styles.no}>✗ Suporte lento ou inexistente</li>
                <li className={styles.no}>✗ Comunidade fragmentada</li>
                <li className={styles.no}>✗ Sem sistema de indicação</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.testimonialsSection}>
        <div className="container">
          <h2 className="section-title text-center">
            O que dizem <span>quem já participa</span>
          </h2>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <p className={styles.testimonialText}>&quot;{t.text}&quot;</p>
                <div className={styles.testimonialAuthor}>
                  <span className={styles.testimonialName}>{t.name}</span>
                  <span className={styles.testimonialCity}>{t.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className="section-title">Convencido?</h2>
          <p className="section-subtitle" style={{ margin: "0 auto 24px" }}>
            Cadastre-se agora e comece a participar dos projetos de gravação de vídeo para IA.
          </p>
          <Link href="/#participar" className="btn btn-primary">
            Quero participar →
          </Link>
        </div>
      </section>
    </main>
  );
}
