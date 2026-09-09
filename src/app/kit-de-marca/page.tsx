"use client";

import { useState } from "react";
import styles from "./kit.module.css";

const BRAND_COLORS = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  secondary: "#f59e0b",
  secondaryLight: "#fbbf24",
  dark: "#0f172a",
  light: "#f8fafc",
  accent: "#10b981",
};

const BIOS = {
  instagram: `🎥 Equipe Ademilson — Vídeos IA
📱 Grave vídeos do dia a dia e participe de projetos de IA
✅ Entrada gratuita — sem taxas
🔗 Grupo oficial 👇`,
  tiktok: `🎥 Gravando vídeos para treinamento de IA
💰 Renda com vídeo — Cadastro gratuito
📱 Modelos aceitos: iPhone 12-17, Pixel 6-9, Galaxy S21-S25
👇 Entre no grupo oficial`,
  youtube: `A Equipe Ademilson divulga projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de Inteligência Artificial.

📱 Modelos compatíveis: iPhone 12-17, Google Pixel 6-9, Samsung Galaxy S21-S25
✅ Entrada gratuita — sem taxas
🔗 Links nas redes sociais`,
  facebook: `Equipe Ademilson — Divulgação de projetos de gravação de vídeos POV para treinamento de IA.

✅ Participação gratuita
📱 Modelos aceitos: iPhone, Pixel e Samsung Galaxy S
🔗 Grupo no WhatsApp`,
};

const USERNAMES = [
  "@equipeademilson",
  "@equipeademilsonia",
  "@equipeademilson.oficial",
  "@equipeademilsonbr",
  "@equipeademilsonbrasil",
];

const POST_TEMPLATES = [
  {
    title: "Apresentação",
    caption: `🎬 Conheça a Equipe Ademilson!

Estamos recrutando pessoas para gravar vídeos do dia a dia e ajudar no treinamento de Inteligência Artificial.

📱 Modelos aceitos: iPhone 12-17, Pixel 6-9, Galaxy S21-S25
✅ 100% gratuito — sem taxas
🇧🇷 Todo o Brasil

Link na bio 👆`,
    hashtags: "#EquipeAdemilson #VideosIA #RendaComVideo #InteligenciaArtificial #POV",
  },
  {
    title: "Modelos de Celular",
    caption: `📱 Seu celular é compatível?

✅ iPhone 12, 13, 14, 15, 16, 17
✅ Google Pixel 6, 7, 8, 9
✅ Samsung Galaxy S21, S22, S23, S24, S25

Se sim, você pode participar dos nossos projetos!
Cadastre-se gratuitamente 🔗`,
    hashtags: "#CelularCompativel #iPhone #Pixel #Galaxy #VideosIA",
  },
  {
    title: "Como Funciona",
    caption: `📋 Como funciona a Equipe Ademilson?

1️⃣ Cadastre-se gratuitamente
2️⃣ Receba as tarefas de gravação
3️⃣ Grave vídeos em primeira pessoa (POV)
4️⃣ Envie e aguarde aprovação
5️⃣ Receba orientações sobre pagamento

Simples, transparente e sem taxas ✅`,
    hashtags: "#ComoFunciona #GravarVideos #POV #RendaExtra #IA",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy} className={styles.copyBtn}>
      {copied ? "✅ Copiado!" : "📋 Copiar"}
    </button>
  );
}

export default function KitMarca() {
  const [activeTab, setActiveTab] = useState<"bio" | "templates" | "cores" | "usernames">("bio");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.tag}>🎨 Identidade Visual</span>
        <h1 className={styles.title}>Kit de Marca</h1>
        <p className={styles.subtitle}>
          Tudo que você precisa para configurar as contas oficiais da Equipe Ademilson
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "bio" ? styles.active : ""}`}
          onClick={() => setActiveTab("bio")}
        >
          📝 Bios
        </button>
        <button
          className={`${styles.tab} ${activeTab === "templates" ? styles.active : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          📱 Templates
        </button>
        <button
          className={`${styles.tab} ${activeTab === "cores" ? styles.active : ""}`}
          onClick={() => setActiveTab("cores")}
        >
          🎨 Cores
        </button>
        <button
          className={`${styles.tab} ${activeTab === "usernames" ? styles.active : ""}`}
          onClick={() => setActiveTab("usernames")}
        >
          👤 Usernames
        </button>
      </div>

      {activeTab === "bio" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Bios Prontas para Copiar</h2>
          <p className={styles.sectionDesc}>Copie e cole diretamente na bio de cada plataforma</p>

          {Object.entries(BIOS).map(([platform, bio]) => (
            <div key={platform} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {platform === "instagram" && "📸 Instagram"}
                  {platform === "tiktok" && "🎵 TikTok"}
                  {platform === "youtube" && "▶️ YouTube"}
                  {platform === "facebook" && "👥 Facebook"}
                </h3>
                <CopyButton text={bio} />
              </div>
              <pre className={styles.bioText}>{bio}</pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === "templates" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Templates de Posts</h2>
          <p className={styles.sectionDesc}>Modelos de legendas para suas publicações</p>

          {POST_TEMPLATES.map((template, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>📝 {template.title}</h3>
                <CopyButton text={`${template.caption}\n\n${template.hashtags}`} />
              </div>
              <pre className={styles.bioText}>{template.caption}</pre>
              <div className={styles.hashtags}>{template.hashtags}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "cores" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Paleta de Cores</h2>
          <p className={styles.sectionDesc}>Cores oficiais da marca — use sempre que possível</p>

          <div className={styles.colorGrid}>
            {Object.entries(BRAND_COLORS).map(([name, color]) => (
              <div key={name} className={styles.colorCard}>
                <div className={styles.colorSwatch} style={{ backgroundColor: color }} />
                <div className={styles.colorInfo}>
                  <span className={styles.colorName}>{name}</span>
                  <code className={styles.colorCode}>{color}</code>
                  <CopyButton text={color} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ marginTop: 24 }}>
            <h3 className={styles.cardTitle}>Guia de Uso</h3>
            <ul className={styles.guideList}>
              <li><strong>Azul (#1e40af):</strong> Fundo principal, títulos, botões</li>
              <li><strong>Dourado (#f59e0b):</strong> Destaques, ícones, CTAs importantes</li>
              <li><strong>Azul claro (#3b82f6):</strong> Links, hover states</li>
              <li><strong>Verde (#10b981):</strong> Status positivos, badges de sucesso</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "usernames" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Usernames Sugeridos</h2>
          <p className={styles.sectionDesc}>Verifique a disponibilidade e escolha o melhor</p>

          <div className={styles.usernameList}>
            {USERNAMES.map((username, i) => (
              <div key={i} className={styles.usernameCard}>
                <span className={styles.usernameText}>{username}</span>
                <div className={styles.usernameActions}>
                  <a
                    href={`https://www.instagram.com/${username.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.checkLink}
                  >
                    📸 Verificar Instagram
                  </a>
                  <a
                    href={`https://www.tiktok.com/${username.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.checkLink}
                  >
                    🎵 Verificar TikTok
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ marginTop: 24, background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }}>
            <h3 className={styles.cardTitle}>⚠️ Dica Importante</h3>
            <p className={styles.cardDesc}>
              Tente manter o <strong>mesmo username</strong> em todas as plataformas para facilitar o reconhecimento da marca.
              Comece verificando no Instagram — geralmente é o mais difícil de conseguir o nome desejado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
