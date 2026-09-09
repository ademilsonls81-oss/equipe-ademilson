"use client";

import { useState } from "react";
import styles from "./assistente.module.css";

type Platform = "email" | "instagram" | "facebook" | "tiktok" | "youtube";

interface Step {
  title: string;
  description: string;
  tip?: string;
}

const STEPS: Record<Platform, { name: string; icon: string; steps: Step[]; bio: string }> = {
  email: {
    name: "E-mail Oficial",
    icon: "📧",
    steps: [
      {
        title: "1. Escolha um provedor",
        description: "Recomendamos Google Workspace (profissional) ou Gmail (gratuito). Outras opções: Outlook, Zoho Mail.",
        tip: "Google Workspace custa ~R$24/mês mas dá e-mail @equipadedemilson.com.br"
      },
      {
        title: "2. Crie a conta",
        description: "Acesse workspace.google.com (ou gmail.com) e crie a conta com o nome: equipe.ademilson",
        tip: "Use um nome fácil de lembrar: equipe.ademilson@gmail.com ou equipe@equipadedemilson.com.br"
      },
      {
        title: "3. Ative verificação em 2 etapas",
        description: "Nas configurações de segurança, ative a verificação por SMS ou app autenticador.",
        tip: "Isso protege a conta contra invasões"
      },
      {
        title: "4. Salve as credenciais",
        description: "Anote e-mail e senha em local seguro (gerenciador de senhas).",
        tip: "NUNCA salve no celular ou em papel solto"
      }
    ],
    bio: ""
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    steps: [
      {
        title: "1. Baixe o Instagram",
        description: "Instale o app na App Store (iOS) ou Google Play (Android).",
        tip: ""
      },
      {
        title: "2. Crie uma nova conta",
        description: "Use o e-mail oficial que você criou (NUNCA use e-mail pessoal).",
        tip: "Escolha o username @equipeademilson ou variante disponível"
      },
      {
        title: "3. Configure como Conta Profissional",
        description: "Configurações → Conta → Mudar para conta profissional → Criador de conteúdo ou Negócio.",
        tip: "Conta profissional dá acesso a insights e botão de contato"
      },
      {
        title: "4. Adicione a bio",
        description: "Copie a bio do Kit de Marca e cole no perfil.",
        tip: "Bio: 🎥 Equipe Ademilson — Vídeos IA"
      },
      {
        title: "5. Adicione foto de perfil",
        description: "Use o logo oficial do Kit de Marca (400x400px).",
        tip: "O logo deve ser nítido e legível mesmo pequeno"
      },
      {
        title: "6. Adicione link na bio",
        description: "Adicione o link do grupo WhatsApp: chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2",
        tip: "Use um encurtador como linktree se quiser vários links"
      },
      {
        title: "7. Conecte ao sistema",
        description: "Após criar, volte ao sistema e clique em 'Conectar Instagram'.",
        tip: "Isso permite publicação automática"
      }
    ],
    bio: "🎥 Equipe Ademilson — Vídeos IA\n📱 Grave vídeos do dia a dia e participe de projetos de IA\n✅ Entrada gratuita — sem taxas\n🔗 Grupo oficial 👇"
  },
  facebook: {
    name: "Facebook",
    icon: "👥",
    steps: [
      {
        title: "1. Acesse o Facebook",
        description: "Acesse facebook.com ou abra o app.",
        tip: ""
      },
      {
        title: "2. Crie uma Página (não perfil pessoal)",
        description: "Menu → Páginas → Criar nova página → Nome: Equipe Ademilson",
        tip: "Página é diferente de perfil! Página é para marcas/negócios"
      },
      {
        title: "3. Configure a categoría",
        description: "Selecione: 'Serviço de mídia/sociais' ou 'Organização sem fins lucrativos'",
        tip: ""
      },
      {
        title: "4. Adicione informações",
        description: "Bio, descrição, link do site e grupo WhatsApp.",
        tip: "Use as bios do Kit de Marca"
      },
      {
        title: "5. Adicione foto de perfil e capa",
        description: "Foto: logo (400x400). Capa: banner oficial (820x312).",
        tip: "Ambas estão no Kit de Marca"
      },
      {
        title: "6. Conecte ao sistema",
        description: "Após criar, volte ao sistema e clique em 'Conectar Facebook'.",
        tip: "Isso permite publicação automática"
      }
    ],
    bio: "Equipe Ademilson — Divulgação de projetos de gravação de vídeos POV para treinamento de IA.\n\n✅ Participação gratuita\n📱 Modelos aceitos: iPhone, Pixel e Samsung Galaxy S\n🔗 Grupo no WhatsApp"
  },
  tiktok: {
    name: "TikTok",
    icon: "🎵",
    steps: [
      {
        title: "1. Baixe o TikTok",
        description: "Instale o app na App Store (iOS) ou Google Play (Android).",
        tip: ""
      },
      {
        title: "2. Crie uma conta",
        description: "Use o e-mail oficial (NUNCA use e-mail pessoal).",
        tip: "Escolha o username @equipeademilson ou variante"
      },
      {
        title: "3. Mude para Conta Business",
        description: "Configurações → Conta → Mudar para Conta Business → Meios de comunicação/Artista.",
        tip: "Conta Business dá acesso a analytics e links"
      },
      {
        title: "4. Configure o perfil",
        description: "Adicione bio, foto de perfil e link do WhatsApp.",
        tip: "Use as bios do Kit de Marca"
      },
      {
        title: "5. Adicione foto de perfil",
        description: "Use o logo oficial do Kit de Marca.",
        tip: ""
      },
      {
        title: "6. Conecte ao sistema",
        description: "Após criar, volte ao sistema e clique em 'Conectar TikTok'.",
        tip: "Isso permite publicação automática"
      }
    ],
    bio: "🎥 Gravando vídeos para treinamento de IA\n💰 Renda com vídeo — Cadastro gratuito\n📱 Modelos aceitos: iPhone 12-17, Pixel 6-9, Galaxy S21-S25\n👇 Entre no grupo oficial"
  },
  youtube: {
    name: "YouTube",
    icon: "▶️",
    steps: [
      {
        title: "1. Acesse o YouTube",
        description: "Acesse youtube.com ou abra o app.",
        tip: ""
      },
      {
        title: "2. Crie um canal",
        description: "Clique no ícone de perfil → Criar canal → Nome: Equipe Ademilson",
        tip: "Use a conta Google do e-mail oficial"
      },
      {
        title: "3. Configure o canal",
        description: "Personalizar → Adicionar descrição, foto de perfil e banner.",
        tip: "Use as configs do Kit de Marca"
      },
      {
        title: "4. Adicione foto de perfil",
        description: "Use o logo oficial (800x800px mínimo).",
        tip: ""
      },
      {
        title: "5. Adicione banner",
        description: "Use o banner oficial do Kit de Marca (2560x1440px).",
        tip: "A área visível é 1546x423px no desktop"
      },
      {
        title: "6. Adicione links",
        description: "Adicione links para site, Instagram, TikTok e grupo WhatsApp.",
        tip: "Personalizar → Links"
      },
      {
        title: "7. Conecte ao sistema",
        description: "Após criar, volte ao sistema e clique em 'Conectar YouTube'.",
        tip: "Isso permite publicação automática"
      }
    ],
    bio: "A Equipe Ademilson divulga projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de Inteligência Artificial.\n\n📱 Modelos compatíveis: iPhone 12-17, Google Pixel 6-9, Samsung Galaxy S21-S25\n✅ Entrada gratuita — sem taxas\n🔗 Links nas redes sociais"
  },
};

export default function AssistenteConfig() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("email");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const platform = STEPS[selectedPlatform];

  function toggleStep(stepIndex: number) {
    const key = `${selectedPlatform}-${stepIndex}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function getProgress() {
    const total = platform.steps.length;
    const completed = platform.steps.filter((_, i) => completedSteps[`${selectedPlatform}-${i}`]).length;
    return Math.round((completed / total) * 100);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.tag}>🚀 Assistente</span>
        <h1 className={styles.title}>Configuração das Contas Oficiais</h1>
        <p className={styles.subtitle}>
          Siga o passo a passo para criar e configurar cada plataforma
        </p>
      </div>

      <div className={styles.platformSelector}>
        {(Object.keys(STEPS) as Platform[]).map((key) => (
          <button
            key={key}
            className={`${styles.platformBtn} ${selectedPlatform === key ? styles.activePlatform : ""}`}
            onClick={() => setSelectedPlatform(key)}
          >
            <span className={styles.platformIcon}>{STEPS[key].icon}</span>
            <span className={styles.platformName}>{STEPS[key].name}</span>
          </button>
        ))}
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${getProgress()}%` }} />
        <span className={styles.progressText}>{getProgress()}% concluído</span>
      </div>

      <div className={styles.stepsList}>
        {platform.steps.map((step, i) => {
          const isCompleted = completedSteps[`${selectedPlatform}-${i}`];
          return (
            <div
              key={i}
              className={`${styles.stepCard} ${isCompleted ? styles.completed : ""}`}
              onClick={() => toggleStep(i)}
            >
              <div className={styles.stepCheck}>
                {isCompleted ? "✅" : "⬜"}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
                {step.tip && (
                  <div className={styles.stepTip}>
                    💡 {step.tip}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {platform.bio && (
        <div className={styles.bioSection}>
          <h2 className={styles.bioTitle}>📝 Bio para copiar</h2>
          <pre className={styles.bioText}>{platform.bio}</pre>
          <button
            className={styles.copyBtn}
            onClick={() => navigator.clipboard.writeText(platform.bio)}
          >
            📋 Copiar Bio
          </button>
        </div>
      )}
    </div>
  );
}
