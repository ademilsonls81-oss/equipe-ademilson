"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./ganhos.module.css";

const RANKING_DATA = [
  { rank: "V0", rate: "US$ 0.50", direct: "0", hours: "0", qualified: "Não exigido" },
  { rank: "V1", rate: "US$ 0.75", direct: "10", hours: "2.000", qualified: "Não exigido" },
  { rank: "V2", rate: "US$ 1.00", direct: "20", hours: "5.000", qualified: "3 V1+" },
  { rank: "V3", rate: "US$ 1.25", direct: "30", hours: "10.000", qualified: "3 V2+" },
  { rank: "V4", rate: "US$ 1.50", direct: "40", hours: "20.000", qualified: "3 V3+" },
  { rank: "V5", rate: "US$ 1.75", direct: "50", hours: "35.000", qualified: "3 V4+" },
  { rank: "V6", rate: "US$ 2.00", direct: "60", hours: "55.000", qualified: "3 V5+" },
];

export default function GanhosPage() {
  const [hoursPerDay, setHoursPerDay] = useState(3);

  const perDay = hoursPerDay * 5;
  const perWeek = perDay * 7;
  const perMonth = perDay * 30;

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Ganhos</span>
          <h1 className={styles.sectionTitle}>
            Como <span>ganhar dinheiro</span> com a Equipe Ademilson
          </h1>
          <p className={styles.sectionSubtitle}>
            Dois caminhos para gerar renda: ganhos individuais gravando vídeos e ganhos de rede indicando pessoas. Você pode escolher um ou combinar os dois.
          </p>
        </div>
      </section>

      {/* AVISO PLATAFORMA PARCEIRA */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.platformNotice}>
            <div className={styles.platformNoticeIcon}>📌</div>
            <div className={styles.platformNoticeContent}>
              <h3>Os ganhos vêm da plataforma parceira <strong>MIMIX</strong></h3>
              <p>
                A Equipe Ademilson é responsável pela divulgação e captação de participantes. Os valores, regras de pagamento e funcionamento detalhado dos ganhos são definidos pela plataforma parceira <strong>MIMIX</strong>.
              </p>
              <p>
                <strong>Todas as informações sobre pagamentos, prazos e condições serão explicadas detalhadamente no grupo do WhatsApp</strong> para quem entrar na equipe. Lá você tira todas as suas dúvidas diretamente com quem já está participando.
              </p>
              <a href="https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ marginTop: 12 }}>
                Entrar no grupo do WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* GANHOS INDIVIDUAIS */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>01</span>
            <div>
              <h2 className={styles.sectionTitle}>Ganhos individuais: só as suas horas</h2>
              <p className={styles.sectionDesc}>Para quem quer apenas gravar e receber, sem indicar ninguém.</p>
            </div>
          </div>

          <div className={styles.highlight}>
            <span className={styles.highlightValue}>US$ 5</span>
            <span className={styles.highlightLabel}>por hora de vídeo gravada e APROVADA</span>
          </div>

          <div className={styles.contentBlock}>
            <p>Você não precisa indicar nenhuma pessoa, não precisa montar equipe e não precisa atingir nenhuma meta para receber por essa hora.</p>
            <p>Os segundos aprovados são acumulados. Cada bloco completo de <strong>3.600 segundos</strong> aprovados gera uma hora comissionável de <strong>US$ 5</strong>. Se você gravou 40 minutos hoje e 20 minutos amanhã, isso soma uma hora paga.</p>
            <p>Suas horas pessoais são sempre suas: elas geram o pagamento individual de US$ 5/hora independentemente do seu ranking. O ranking V0 a V6 só influencia os ganhos de REDE, explicados na próxima seção.</p>
          </div>

          <div className={styles.howItWorks}>
            <h3>É assim que você ganha gravando tarefas em casa sem indicar ninguém:</h3>
            <p>Escolhe uma tarefa doméstica comum, grava mostrando as mãos e envia. Cozinhar, lavar louça, dobrar roupas, organizar armários e arrumar a casa são exatamente os vídeos que empresas de robótica humanoide mais procuram — e cada hora aprovada dessas tarefas é paga em dólar.</p>
          </div>

          <div className={styles.example}>
            <p>Para quem busca renda extra pelo celular ou trabalhar em casa pelo celular sem horário fixo, esse é o modelo mais direto:</p>
            <div className={styles.exampleGrid}>
              <div className={styles.exampleItem}>
                <span className={styles.exampleHours}>1h/dia</span>
                <span className={styles.exampleValue}>~US$ 150/mês</span>
              </div>
              <div className={styles.exampleItem}>
                <span className={styles.exampleHours}>3h/dia</span>
                <span className={styles.exampleValue}>~US$ 450/mês</span>
              </div>
            </div>
            <p className={styles.exampleNote}>Apenas com ganhos individuais.</p>
          </div>

          {/* SIMULADOR */}
          <div className={styles.simulator}>
            <h3>Simule seus ganhos individuais</h3>
            <div className={styles.simulatorControl}>
              <label htmlFor="hours-slider">Horas gravadas por dia:</label>
              <div className={styles.sliderRow}>
                <input
                  id="hours-slider"
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{hoursPerDay}h</span>
              </div>
            </div>
            <div className={styles.simulatorResults}>
              <div className={styles.simItem}>
                <span className={styles.simLabel}>Por dia</span>
                <span className={styles.simValue}>US$ {perDay}</span>
              </div>
              <div className={styles.simItem}>
                <span className={styles.simLabel}>Por semana</span>
                <span className={styles.simValue}>US$ {perWeek}</span>
              </div>
              <div className={styles.simItem}>
                <span className={styles.simLabel}>Estimativa mensal</span>
                <span className={styles.simValue}>US$ {perMonth}</span>
              </div>
            </div>
            <p className={styles.simNote}>Estimativa baseada em gravações aprovadas todos os dias do mês. Os valores reais dependem do tempo efetivamente aprovado.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* GANHOS DE REDE */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionNumber}>02</span>
            <div>
              <h2 className={styles.sectionTitle}>Ganhos de rede: a escala V0 → V6</h2>
              <p className={styles.sectionDesc}>Para quem quer indicar pessoas e ganhar em profundidade. Esta seção é totalmente independente da anterior.</p>
            </div>
          </div>

          <div className={styles.contentBlock}>
            <p>Além dos US$ 5 por hora pessoal, a MIMIX paga um bônus de rede sobre cada hora aprovada gravada pela sua equipe, em <strong>profundidade infinita</strong>. Quanto maior o seu ranking, maior a taxa que você recebe por hora de equipe.</p>
            <p>Ao se cadastrar, todos começam no ranking <strong>V0</strong>, que já paga US$ 0,50 por hora de equipe. Conforme você acumula indicados diretos válidos, horas de equipe e pessoas qualificadas na sua rede, você sobe de ranking e sua taxa por hora de equipe aumenta até <strong>US$ 2,00 no V6</strong>.</p>
            <p>É por isso que a MIMIX é diferente das outras plataformas: você não é remunerado apenas pelo seu tempo, mas também pela estrutura de captura que você ajudou a construir.</p>
          </div>

          <div className={styles.contentBlock}>
            <p>Se o seu objetivo é uma renda extra em casa que cresce mesmo nos dias em que você não grava, a rede é o caminho: cada pessoa que você ensina a ganhar gravando vídeos em casa continua produzindo horas aprovadas, e cada uma dessas horas gera bônus para você em profundidade.</p>
          </div>

          {/* TABELA */}
          <h3 className={styles.tableTitle}>Tabela oficial de graduações</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Taxa / hora de equipe</th>
                  <th>Diretos válidos</th>
                  <th>Horas de equipe</th>
                  <th>Pessoas qualificadas</th>
                </tr>
              </thead>
              <tbody>
                {RANKING_DATA.map((row) => (
                  <tr key={row.rank}>
                    <td className={styles.rankCell}>{row.rank}</td>
                    <td className={styles.rateCell}>{row.rate}</td>
                    <td>{row.direct}</td>
                    <td>{row.hours}</td>
                    <td>{row.qualified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.tableNote}>A taxa mostrada é o valor pago a você por cada hora aprovada gravada pela sua equipe, em qualquer profundidade.</p>

          {/* REGRAS */}
          <div className={styles.rules}>
            <h3>Regras do plano</h3>
            <ul className={styles.rulesList}>
              <li>Horas pessoais nunca contam para qualificação de ranking nem para este bônus de rede.</li>
              <li>Um direto se torna válido após completar uma hora integral aprovada e nunca perde essa condição.</li>
              <li>As horas de equipe incluem todos os descendentes para sempre, inclusive a produção abaixo de uma linha cortada.</li>
              <li>Os requisitos contam pessoas no ranking indicado ou superior, em qualquer profundidade, inclusive na mesma linha.</li>
              <li>Os segundos aprovados são acumulados; cada bloco completo de 3.600 segundos gera uma hora comissionável.</li>
              <li>Um ranking recém-conquistado vale apenas para as próximas horas completas e nunca é perdido.</li>
              <li>Seu ranking acompanha você em todos os projetos; as taxas vêm do projeto que originou a gravação aprovada.</li>
            </ul>
          </div>

          {/* EXEMPLO PRÁTICO */}
          <div className={styles.practicalExample}>
            <h3>Exemplo prático</h3>
            <p>Você está no ranking <strong>V2</strong> (US$ 1,00 por hora de equipe) e sua rede — somando todos os níveis de profundidade — gravou <strong>800 horas aprovadas</strong> no mês.</p>
            <div className={styles.mathBlock}>
              <div className={styles.mathItem}>
                <span className={styles.mathLabel}>Bônus de rede:</span>
                <span className={styles.mathValue}>US$ 800</span>
              </div>
              <div className={styles.mathItem}>
                <span className={styles.mathLabel}>Ganho individual (40h):</span>
                <span className={styles.mathValue}>US$ 200</span>
              </div>
              <div className={`${styles.mathItem} ${styles.mathTotal}`}>
                <span className={styles.mathLabel}>Total:</span>
                <span className={styles.mathValue}>US$ 1.000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className="section-title">Pronto para começar?</h2>
          <p className={styles.sectionSubtitle} style={{ margin: "0 auto 24px" }}>
            Cadastre-se agora e comece a ganhar com gravação de vídeos para IA.
          </p>
          <Link href="/#participar" className="btn btn-primary">
            Quero participar →
          </Link>
        </div>
      </section>
    </main>
  );
}
