"use client";
import { useState } from "react";
import styles from "./compartilhar.module.css";

const SITE_URL = "https://equipe-ademilson.vercel.app";

const REDDIT_POSTS = [
  {
    subreddit: "r/rendaextra",
    title: "Ganho US$ 5 por hora gravando vídeos do dia a dia para IA (trabalho remoto)",
    text: `Galera, queria compartilhar uma oportunidade que estou aproveitando. Existe uma demanda enorme de empresas de IA que precisam de vídeos gravados por pessoas reais para treinar robôs e sistemas autônomos.

O modelo é simples:
- Você grava vídeos em primeira pessoa fazendo tarefas domésticas (cozinhar, limpar, dobrar roupas)
- Envia pela plataforma
- Recebe US$ 5 por hora de vídeo aprovado

Não precisa de experiência, não precisa pagar nada, só um celular com boa câmera e um suporte de peito.

Estou na Equipe Ademilson (${SITE_URL}) que é uma equipe de divulgação. O cadastro é gratuito e pelo grupo do WhatsApp você recebe todas as orientações.

Se alguém tiver dúvidas, posso ajudar.`,
  },
  {
    subreddit: "r/trabalho",
    title: "Alguém já trabalhou gravando vídeos para treinamento de IA?",
    text: `Pessoal, comecei recentemente a gravar vídeos em primeira pessoa para projetos de IA. A ideia é gravar tarefas do dia a dia (cozinhar, limpar, organizar) e enviar para empresas que usam isso para treinar robôs.

Encontrei a Equipe Ademilson (${SITE_URL}) que divulga esses projetos. O pagamento é por hora aprovada.

Alguém mais está nessa? Queria trocar experiência sobre qualidade de vídeo, dicas de gravação, etc.`,
  },
  {
    subreddit: "r/foradecasa",
    title: "Trabalho remoto pagando em dólar: gravando vídeos para IA",
    text: `Para quem está buscando oportunidades remotas, existe uma área que está crescendo muito: gravar vídeos para treinamento de Inteligência Artificial.

Empresas precisam de vídeos reais de pessoas fazendo tarefas cotidianas para treinar seus sistemas. O pagamento é em dólar.

Funciona assim:
1. Você grava com o celular em primeira pessoa
2. Tarefas são simples: cozinhar, lavar louça, organizar
3. Recebe por hora aprovada

Estou na Equipe Ademilson (${SITE_URL}). Cadastro gratuito, sem taxas.`,
  },
  {
    subreddit: "r/investimentos",
    title: "Renda extra em dólar: como estou ganhando com gravação de vídeos para IA",
    text: `Galera, queria compartilhar uma renda extra que descobri recentemente. Não é investimento, é trabalho mesmo, mas paga em dólar e dá para fazer de casa.

A demanda por vídeos de pessoas reais para treinar IA está explodindo. Empresas de robótica e carros autônomos precisam desses dados.

O modelo:
- Grava vídeos em primeira pessoa (tarefas domésticas)
- Recebe US$ 5 por hora aprovada
- Sem precisar indicar ninguém

Estou na Equipe Ademilson (${SITE_URL}). Cadastro gratuito.

Não é esquema pirâmide, é trabalho mesmo. Só que pouca gente sabe que essa oportunidade existe.`,
  },
  {
    subreddit: "r/homeoffice",
    title: "Trabalho home office pelo celular: gravando vídeos para IA",
    text: `Pessoal, trabalho home office há anos e recentemente descobri uma nova oportunidade: gravar vídeos para treinamento de IA.

A empresa precisa de vídeos reais de pessoas fazendo tarefas do dia a dia. Você grava com o celular, em primeira pessoa, e recebe por hora aprovada.

Vantagens:
- Trabalha de casa
- Horário flexível
- Só precisa do celular
- Pagamento em dólar

Estou na Equipe Ademilson (${SITE_URL}). Cadastro gratuito.

Se alguém quiser saber mais, é só perguntar.`,
  },
];

const FACEBOOK_POSTS = [
  {
    group: "Grupos de Renda Extra",
    text: `💡 Nova oportunidade de renda extra que pouca gente conhece

Pessoal, queria compartilhar algo que estou fazendo e que está dando resultado: gravar vídeos do dia a dia para treinamento de Inteligência Artificial.

Como funciona:
✅ Você grava vídeos em primeira pessoa fazendo tarefas domésticas
✅ Cozinhar, limpar, dobrar roupas, organizar
✅ Recebe US$ 5 por hora de vídeo aprovado
✅ Trabalha de casa, no seu horário

O que você precisa:
📱 Celular com câmera (iPhone 12+, Pixel 6+, Samsung S21+)
📎 Suporte de peito (custa R$ 30-80)
🌐 Internet para enviar

Não precisa:
❌ Pagar para entrar
❌ Ter experiência
❌ Indicar pessoas

Estou na Equipe Ademilson. Cadastro gratuito: ${SITE_URL}

Se tiverem dúvidas, podem perguntar aqui! 😊`,
  },
  {
    group: "Grupos de Trabalho Remoto",
    text: `🏠 Vaga remota: gravar vídeos pelo celular

Galera, tem uma oportunidade que pouca gente conhece. Empresas de IA precisam de vídeos gravados por pessoas reais para treinar robôs e sistemas autônomos.

O que você faz:
- Grava vídeos em primeira pessoa
- Tarefas simples: cozinhar, limpar, organizar
- Envia pela plataforma
- Recebe por hora aprovada

Pagamento: US$ 5/hora aprovada

Requisitos:
- Celular com câmera
- Suporte de peito
- Internet

Cadastre-se gratuitamente: ${SITE_URL}

Não é furada, é trabalho real. Só que pouca gente sabe que essa área existe.`,
  },
];

const WHATSAPP_MESSAGES = [
  {
    label: "Mensagem para grupos",
    text: `Pessoal, queria dividir uma oportunidade que encontrei. Tem uma equipe chamada Equipe Ademilson que divulga projetos de gravação de vídeos para Inteligência Artificial.

A ideia é gravar vídeos do dia a dia em primeira pessoa (cozinhar, limpar, organizar) e enviar para empresas que usam isso para treinar robôs.

O pagamento é por hora aprovada. Cadastro gratuito, sem taxas.

Se alguém quiser saber mais: ${SITE_URL}`,
  },
  {
    label: "Mensagem para privado",
    text: `Oi! Tudo bem? Vi que você se interessa por renda extra. Queria te mostrar uma oportunidade que encontrei: gravar vídeos do dia a dia para treinamento de IA.

É simples: você grava com o celular fazendo tarefas domésticas e recebe por hora aprovada. Cadastro gratuito.

Site: ${SITE_URL}

Se tiver dúvida, é só perguntar! 😊`,
  },
];

const TWITTER_THREAD = [
  "Estou ganhando dinheiro gravando vídeos do dia a dia para IA 🎥\n\nO modelo:\n→ Grava em primeira pessoa\n→ Tarefas simples (cozinhar, limpar)\n→ Recebe US$ 5/hora aprovada\n→ Trabalha de casa\n\nPouca gente sabe que essa oportunidade existe 🧵",
  "O que você precisa:\n✅ Celular com câmera\n✅ Suporte de peito (R$ 30-80)\n✅ Internet\n\nNão precisa:\n❌ Pagar para entrar\n❌ Ter experiência\n❌ Indicar pessoas",
  "Empresas de IA precisam de vídeos reais para treinar robôs, carros autônomos e assistentes virtuais.\n\nQuanto mais real, melhor. Por isso pagam bem por vídeos de pessoas comuns.",
  `Estou na Equipe Ademilson:\n🔗 ${SITE_URL}\n\nCadastro gratuito. Se tiver dúvida, pergunta aqui! 👇`,
];

export default function CompartilharPage() {
  const [copiedIdx, setCopiedIdx] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"reddit" | "facebook" | "whatsapp" | "twitter">("reddit");

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(id);
      setTimeout(() => setCopiedIdx(""), 2000);
    });
  }

  function openReddit(post: typeof REDDIT_POSTS[0]) {
    const fullText = post.text + "\n\n" + SITE_URL;
    const redditUrl = `https://www.reddit.com/${post.subreddit.replace("r/", "")}/submit?title=${encodeURIComponent(post.title)}&selftext=${encodeURIComponent(fullText)}`;
    window.open(redditUrl, "_blank");
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Compartilhar</span>
          <h1 className="section-title">
            Divulgue a <span>Equipe Ademilson</span>
          </h1>
          <p className={styles.sectionSubtitle}>
            Textos prontos para copiar e colar. Escolha a plataforma, copie o texto e publique. Leva menos de 1 minuto!
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === "reddit" ? styles.tabActive : ""}`} onClick={() => setActiveTab("reddit")}>
              🟠 Reddit
            </button>
            <button className={`${styles.tab} ${activeTab === "facebook" ? styles.tabActive : ""}`} onClick={() => setActiveTab("facebook")}>
              📘 Facebook
            </button>
            <button className={`${styles.tab} ${activeTab === "whatsapp" ? styles.tabActive : ""}`} onClick={() => setActiveTab("whatsapp")}>
              📱 WhatsApp
            </button>
            <button className={`${styles.tab} ${activeTab === "twitter" ? styles.tabActive : ""}`} onClick={() => setActiveTab("twitter")}>
              🐦 Twitter/X
            </button>
          </div>

          {activeTab === "reddit" && (
            <div className={styles.postsList}>
              <h2>Posts para Reddit</h2>
              <p className={styles.hint}>Clique em &quot;Abrir Reddit&quot; — o Reddit abre com título e texto já preenchidos. Basta revisar e publicar!</p>
              {REDDIT_POSTS.map((post, i) => (
                <div key={i} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <span className={styles.subreddit}>{post.subreddit}</span>
                    <span className={styles.postTitle}>{post.title}</span>
                  </div>
                  <div className={styles.postActions}>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(post.text + "\n\n" + SITE_URL, `reddit-${i}`)}>
                      {copiedIdx === `reddit-${i}` ? "✓ Copiado!" : "Copiar texto"}
                    </button>
                    <button className="btn btn-primary" onClick={() => openReddit(post)}>
                      Abrir Reddit com post preenchido →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "facebook" && (
            <div className={styles.postsList}>
              <h2>Posts para Facebook</h2>
              <p className={styles.hint}>Copie o texto, abra o Facebook e cole no grupo desejado.</p>
              {FACEBOOK_POSTS.map((post, i) => (
                <div key={i} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <span className={styles.group}>{post.group}</span>
                  </div>
                  <pre className={styles.postText}>{post.text}</pre>
                  <div className={styles.postActions}>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(post.text, `fb-${i}`)}>
                      {copiedIdx === `fb-${i}` ? "✓ Copiado!" : "Copiar texto"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "whatsapp" && (
            <div className={styles.postsList}>
              <h2>Mensagens para WhatsApp</h2>
              <p className={styles.hint}>Copie a mensagem e envie nos grupos ou no privado.</p>
              {WHATSAPP_MESSAGES.map((msg, i) => (
                <div key={i} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <span className={styles.group}>{msg.label}</span>
                  </div>
                  <pre className={styles.postText}>{msg.text}</pre>
                  <div className={styles.postActions}>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(msg.text, `wa-${i}`)}>
                      {copiedIdx === `wa-${i}` ? "✓ Copiado!" : "Copiar mensagem"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "twitter" && (
            <div className={styles.postsList}>
              <h2>Thread para Twitter/X</h2>
              <p className={styles.hint}>Copie cada tweet separadamente e publique como thread.</p>
              {TWITTER_THREAD.map((tweet, i) => (
                <div key={i} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <span className={styles.tweetNum}>Tweet {i + 1}/{TWITTER_THREAD.length}</span>
                  </div>
                  <pre className={styles.postText}>{tweet}</pre>
                  <div className={styles.postActions}>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(tweet, `tw-${i}`)}>
                      {copiedIdx === `tw-${i}` ? "✓ Copiado!" : "Copiar tweet"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.linksSection}>
            <h2>Links para compartilhar</h2>
            <div className={styles.linksGrid}>
              <div className={styles.linkItem}>
                <span>🏠 Site principal</span>
                <code>{SITE_URL}</code>
                <button className={styles.copyBtn} onClick={() => copyToClipboard(SITE_URL, "link-site")}>
                  {copiedIdx === "link-site" ? "✓" : "Copiar"}
                </button>
              </div>
              <div className={styles.linkItem}>
                <span>📝 Blog</span>
                <code>{SITE_URL}/blog</code>
                <button className={styles.copyBtn} onClick={() => copyToClipboard(`${SITE_URL}/blog`, "link-blog")}>
                  {copiedIdx === "link-blog" ? "✓" : "Copiar"}
                </button>
              </div>
              <div className={styles.linkItem}>
                <span>💰 Ganhos</span>
                <code>{SITE_URL}/ganhos</code>
                <button className={styles.copyBtn} onClick={() => copyToClipboard(`${SITE_URL}/ganhos`, "link-ganhos")}>
                  {copiedIdx === "link-ganhos" ? "✓" : "Copiar"}
                </button>
              </div>
              <div className={styles.linkItem}>
                <span>📋 Indicar</span>
                <code>{SITE_URL}/indicar</code>
                <button className={styles.copyBtn} onClick={() => copyToClipboard(`${SITE_URL}/indicar`, "link-indicar")}>
                  {copiedIdx === "link-indicar" ? "✓" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
