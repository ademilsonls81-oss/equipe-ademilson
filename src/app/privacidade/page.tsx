import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Política de Privacidade | Equipe Ademilson",
  description: "Saiba como a Equipe Ademilson coleta, usa e protege seus dados pessoais.",
  robots: { index: true, follow: true },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://equipadedemilson.com.br";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={`container ${styles.content}`}>
          <span className="section-tag">Transparência</span>
          <h1 className="section-title">Política de Privacidade</h1>
          <p className={styles.updated}>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

          <section className={styles.sectionBlock}>
            <h2>1. Quem somos</h2>
            <p>A <strong>Equipe Ademilson — Renda com Vídeo IA</strong> é uma equipe de divulgação de projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de Inteligência Artificial. Atuamos como canal de informação e cadastro, não como empregador ou plataforma de pagamento.</p>
          </section>

          <section className={styles.sectionBlock}>
            <h2>2. Quais dados coletamos</h2>
            <p>Ao preencher nosso formulário de cadastro, coletamos:</p>
            <ul>
              <li>Nome completo</li>
              <li>Número de WhatsApp</li>
              <li>Cidade e Estado</li>
              <li>Faixa etária</li>
              <li>Se possui smartphone e suporte para gravação</li>
              <li>Como conheceu a equipe</li>
              <li>Código de indicação utilizado (se houver)</li>
              <li>Dados técnicos: endereço IP, origem UTM (fonte, mídia, campanha)</li>
            </ul>
          </section>

          <section className={styles.sectionBlock}>
            <h2>3. Para que usamos seus dados</h2>
            <ul>
              <li>Entrar em contato para orientar sobre projetos disponíveis</li>
              <li>Organizar a lista de participantes interessados</li>
              <li>Analisar a origem dos cadastros para melhorar a divulgação</li>
              <li>Rastrear indicações entre participantes</li>
            </ul>
          </section>

          <section className={styles.sectionBlock}>
            <h2>4. Base legal (LGPD)</h2>
            <p>O tratamento dos seus dados é realizado com base no seu <strong>consentimento expresso</strong>, fornecido ao marcar o campo de confirmação no formulário de cadastro (Lei 13.709/2018 — LGPD, art. 7º, inciso I).</p>
          </section>

          <section className={styles.sectionBlock}>
            <h2>5. Compartilhamento de dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Os dados poderão ser compartilhados apenas:</p>
            <ul>
              <li>Com as plataformas parceiras cujos projetos você optar por participar, mediante seu consentimento adicional informado no momento oportuno</li>
              <li>Quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section className={styles.sectionBlock}>
            <h2>6. Segurança</h2>
            <p>Seus dados são armazenados em banco de dados local com acesso restrito. Adotamos medidas técnicas para proteger as informações contra acesso não autorizado. Não armazenamos senhas de plataformas externas.</p>
          </section>

          <section className={styles.sectionBlock}>
            <h2>7. Seus direitos</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul>
              <li>Confirmar a existência do tratamento dos seus dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar seu consentimento a qualquer momento</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato pelo WhatsApp da equipe.</p>
          </section>

          <section className={styles.sectionBlock}>
            <h2>8. Cookies e Analytics</h2>
            <p>Este site pode usar ferramentas de análise (Google Analytics, Meta Pixel) para entender como os visitantes interagem com a página. Essas ferramentas coletam dados de forma agregada e anonimizada, conforme as políticas de privacidade de cada plataforma.</p>
          </section>

          <section className={styles.sectionBlock}>
            <h2>9. Contato</h2>
            <p>Para dúvidas sobre esta política ou para exercer seus direitos, envie uma mensagem pelo WhatsApp indicado neste site ou acesse: <a href={SITE} style={{color:"var(--gold)"}}>{SITE}</a></p>
          </section>

          <div className={styles.back}>
            <a href="/" className="btn btn-outline">← Voltar para a página inicial</a>
          </div>
        </div>
      </div>
    </>
  );
}
