import { Metadata } from "next";
import Link from "next/link";
import styles from "./slug.module.css";

const WA_GROUP = "https://chat.whatsapp.com/BT0oMJt9R5GLxjGpQu8qZ2";

const PAGES: Record<string, { title: string; description: string; h1: string; benefits: string[] }> = {
  "renda-extra": {
    title: "Grupo WhatsApp de Renda Extra | Entre Grátis",
    description: "Entre no grupo WhatsApp de renda extra e aprenda a ganhar dinheiro gravando vídeos para IA. Cadastro gratuito, sem taxas.",
    h1: "Grupo WhatsApp de Renda Extra",
    benefits: [
      "Oportunidades de ganho com gravação de vídeos",
      "Informações sobre pagamentos em dólar",
      "Dicas para gravar e aprovar seus vídeos",
      "Comunidade ativa e apoio mútuo",
    ],
  },
  "empregos": {
    title: "Grupo WhatsApp de Empregos | Vagas Remotas",
    description: "Encontre vagas de trabalho remoto no grupo WhatsApp. Oportunidades de gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Empregos",
    benefits: [
      "Vagas de trabalho remoto atualizadas",
      "Oportunidades de ganho com celular",
      "Sem necessidade de experiência",
      "Flexibilidade de horário",
    ],
  },
  "oportunidades": {
    title: "Grupo WhatsApp de Oportunidades | Entre Grátis",
    description: "Receba oportunidades reais de ganho pelo celular. Grupo WhatsApp gratuito com dicas e projetos de gravação de vídeos.",
    h1: "Grupo WhatsApp de Oportunidades",
    benefits: [
      "Oportunidades verificadas e confiáveis",
      "Projetos de gravação de vídeos para IA",
      "Sem taxa de participação",
      "Pagamento em dólar",
    ],
  },
  "cursos-gratuitos": {
    title: "Grupo WhatsApp de Cursos Gratuitos | Aprenda Grátis",
    description: "Aprenda a ganhar dinheiro com vídeos gratuitamente. Grupo WhatsApp com dicas, tutoriais e orientações.",
    h1: "Grupo WhatsApp de Cursos Gratuitos",
    benefits: [
      "Aprenda a gravar vídeos para IA",
      "Dicas de qualidade e edição",
      "Orientações de cada projeto",
      "Tudo gratuito, sem taxas",
    ],
  },
  "trabalho-casa": {
    title: "Grupo WhatsApp Trabalho em Casa | Remoto",
    description: "Trabalhe de casa pelo celular. Grupo WhatsApp com oportunidades de gravação de vídeos para treinamento de IA.",
    h1: "Grupo WhatsApp de Trabalho em Casa",
    benefits: [
      "Trabalhe de casa, no seu horário",
      "Só precisa de um celular",
      "Sem experiência necessária",
      "Pagamento por hora aprovada",
    ],
  },
  "celular": {
    title: "Ganhe Dinheiro com o Celular | Grupo WhatsApp",
    description: "Aprenda a ganhar dinheiro usando apenas o celular. Grupo WhatsApp com projetos de gravação de vídeos para IA.",
    h1: "Ganhe Dinheiro com o Celular",
    benefits: [
      "Use o celular que já tem",
      "Grave vídeos do dia a dia",
      "Receba em dólar por hora aprovada",
      "Sem investimento inicial",
    ],
  },
  "suzano": {
    title: "Grupo WhatsApp Suzano | Oportunidades Locais",
    description: "Grupo WhatsApp em Suzano com oportunidades de trabalho remoto e ganho com gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Suzano",
    benefits: [
      "Oportunidades para moradores de Suzano",
      "Trabalho remoto pelo celular",
      "Comunidade local ativa",
      "Sem precisar sair de casa",
    ],
  },
  "sao-paulo": {
    title: "Grupo WhatsApp São Paulo | Vagas e Oportunidades",
    description: "Grupo WhatsApp em São Paulo com oportunidades de renda extra e trabalho remoto. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de São Paulo",
    benefits: [
      "Oportunidades para paulistanos",
      "Renda extra com o celular",
      "Projetos de gravação de vídeos",
      "Sem taxa de participação",
    ],
  },
  "emprego-remoto": {
    title: "Emprego Remoto | Grupo WhatsApp",
    description: "Encontre emprego remoto pelo celular. Grupo WhatsApp com vagas de gravação de vídeos para treinamento de IA.",
    h1: "Emprego Remoto pelo Celular",
    benefits: [
      "Trabalhe de qualquer lugar",
      "Horário flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "dinheiro-facil": {
    title: "Dinheiro Fácil pelo Celular | Grupo WhatsApp",
    description: "Ganhe dinheiro fácil pelo celular. Grupo WhatsApp com dicas reais de renda extra com gravação de vídeos.",
    h1: "Dinheiro Fácil pelo Celular",
    benefits: [
      "Método simples e comprovado",
      "Só precisa de um celular",
      "Sem investimento",
      "Pagamento rápido",
    ],
  },
  "rio-de-janeiro": {
    title: "Grupo WhatsApp Rio de Janeiro | Renda Extra",
    description: "Grupo WhatsApp no Rio de Janeiro com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp do Rio de Janeiro",
    benefits: [
      "Oportunidades para cariocas",
      "Trabalho remoto pelo celular",
      "Renda extra sem sair de casa",
      "Comunidade ativa no RJ",
    ],
  },
  "belo-horizonte": {
    title: "Grupo WhatsApp Belo Horizonte | Vagas",
    description: "Grupo WhatsApp em Belo Horizonte com vagas de trabalho remoto e renda extra com gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Belo Horizonte",
    benefits: [
      "Oportunidades para mineiros",
      "Renda extra com o celular",
      "Projetos de gravação de vídeos",
      "Sem taxa de participação",
    ],
  },
  "curitiba": {
    title: "Grupo WhatsApp Curitiba | Oportunidades",
    description: "Grupo WhatsApp em Curitiba com oportunidades de ganho pelo celular. Gravação de vídeos para treinamento de IA.",
    h1: "Grupo WhatsApp de Curitiba",
    benefits: [
      "Oportunidades para paranaenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "salvador": {
    title: "Grupo WhatsApp Salvador | Renda Extra",
    description: "Grupo WhatsApp em Salvador com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Salvador",
    benefits: [
      "Oportunidades para baianos",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Salvador",
    ],
  },
  "brasilia": {
    title: "Grupo WhatsApp Brasília | Vagas Remotas",
    description: "Grupo WhatsApp em Brasília com vagas de trabalho remoto. Oportunidades de gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Brasília",
    benefits: [
      "Oportunidades para candangos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "fortaleza": {
    title: "Grupo WhatsApp Fortaleza | Renda Extra",
    description: "Grupo WhatsApp em Fortaleza com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Fortaleza",
    benefits: [
      "Oportunidades para cearenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Fortaleza",
    ],
  },
  "manaus": {
    title: "Grupo WhatsApp Manaus | Oportunidades",
    description: "Grupo WhatsApp em Manaus com oportunidades de ganho pelo celular. Gravação de vídeos para treinamento de IA.",
    h1: "Grupo WhatsApp de Manaus",
    benefits: [
      "Oportunidades para amazonenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "recife": {
    title: "Grupo WhatsApp Recife | Renda Extra",
    description: "Grupo WhatsApp em Recife com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Recife",
    benefits: [
      "Oportunidades para pernambucanos",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Recife",
    ],
  },
  "porto-alegre": {
    title: "Grupo WhatsApp Porto Alegre | Vagas",
    description: "Grupo WhatsApp em Porto Alegre com vagas de trabalho remoto. Oportunidades de gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Porto Alegre",
    benefits: [
      "Oportunidades para gaúchos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "video-ia": {
    title: "Grupo WhatsApp Gravação de Vídeos para IA",
    description: "Entre no grupo de gravação de vídeos para treinamento de Inteligência Artificial. Cadastro gratuito, pagamento em dólar.",
    h1: "Grupo de Gravação de Vídeos para IA",
    benefits: [
      "Grave vídeos do dia a dia",
      "Receba em dólar por hora aprovada",
      "Sem experiência necessária",
      "Trabalhe de casa com o celular",
    ],
  },
  "ganhos": {
    title: "Como Ganhar Dinheiro com Vídeos | Grupo WhatsApp",
    description: "Aprenda como ganhar dinheiro gravando vídeos para IA. Grupo WhatsApp com dicas e orientações gratuitas.",
    h1: "Como Ganhar Dinheiro com Vídeos para IA",
    benefits: [
      "Método comprovado e gratuito",
      "Pagamento em dólar por hora",
      "Sem investimento inicial",
      "Trabalhe de qualquer lugar",
    ],
  },
  "campinas": {
    title: "Grupo WhatsApp Campinas | Oportunidades",
    description: "Grupo WhatsApp em Campinas com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Campinas",
    benefits: [
      "Oportunidades para campineiros",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Campinas",
    ],
  },
  "guarulhos": {
    title: "Grupo WhatsApp Guarulhos | Vagas",
    description: "Grupo WhatsApp em Guarulhos com vagas de trabalho remoto. Oportunidades de gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Guarulhos",
    benefits: [
      "Oportunidades para guarulhenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "sao-bernardo": {
    title: "Grupo WhatsApp São Bernardo do Campo | Renda Extra",
    description: "Grupo WhatsApp em São Bernardo do Campo com oportunidades de renda extra. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de São Bernardo do Campo",
    benefits: [
      "Oportunidades para sãocarlenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em SBC",
    ],
  },
  "santo-andre": {
    title: "Grupo WhatsApp Santo André | Oportunidades",
    description: "Grupo WhatsApp em Santo André com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Santo André",
    benefits: [
      "Oportunidades para santandrienses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "osasco": {
    title: "Grupo WhatsApp Osasco | Renda Extra",
    description: "Grupo WhatsApp em Osasco com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Osasco",
    benefits: [
      "Oportunidades para osasquenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Osasco",
    ],
  },
  "jaboticabal": {
    title: "Grupo WhatsApp Jaboticabal | Oportunidades",
    description: "Grupo WhatsApp em Jaboticabal com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Jaboticabal",
    benefits: [
      "Oportunidades para jaboticabalenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "ribeirao-preto": {
    title: "Grupo WhatsApp Ribeirão Preto | Renda Extra",
    description: "Grupo WhatsApp em Ribeirão Preto com oportunidades de renda extra. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Ribeirão Preto",
    benefits: [
      "Oportunidades para ribeirão-pretenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Ribeirão Preto",
    ],
  },
  "sao-jose-campos": {
    title: "Grupo WhatsApp São José dos Campos | Vagas",
    description: "Grupo WhatsApp em São José dos Campos com vagas de trabalho remoto. Oportunidades de gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de São José dos Campos",
    benefits: [
      "Oportunidades para jocenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "londrina": {
    title: "Grupo WhatsApp Londrina | Renda Extra",
    description: "Grupo WhatsApp em Londrina com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Londrina",
    benefits: [
      "Oportunidades para londrinenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Londrina",
    ],
  },
  "maringa": {
    title: "Grupo WhatsApp Maringá | Oportunidades",
    description: "Grupo WhatsApp em Maringá com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Maringá",
    benefits: [
      "Oportunidades para maringaenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "joinville": {
    title: "Grupo WhatsApp Joinville | Renda Extra",
    description: "Grupo WhatsApp em Joinville com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Joinville",
    benefits: [
      "Oportunidades para joinvillenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Joinville",
    ],
  },
  "florianopolis": {
    title: "Grupo WhatsApp Florianópolis | Vagas",
    description: "Grupo WhatsApp em Florianópolis com vagas de trabalho remoto. Oportunidades de gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Florianópolis",
    benefits: [
      "Oportunidades para florianopolitanos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "vitoria": {
    title: "Grupo WhatsApp Vitória | Renda Extra",
    description: "Grupo WhatsApp em Vitória com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Vitória",
    benefits: [
      "Oportunidades para vitorienses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Vitória",
    ],
  },
  "uberlandia": {
    title: "Grupo WhatsApp Uberlândia | Oportunidades",
    description: "Grupo WhatsApp em Uberlândia com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Uberlândia",
    benefits: [
      "Oportunidades para uberlandenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "contagem": {
    title: "Grupo WhatsApp Contagem | Renda Extra",
    description: "Grupo WhatsApp em Contagem com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Contagem",
    benefits: [
      "Oportunidades para contagenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Contagem",
    ],
  },
  "juiz-de-fora": {
    title: "Grupo WhatsApp Juiz de Fora | Oportunidades",
    description: "Grupo WhatsApp em Juiz de Fora com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Juiz de Fora",
    benefits: [
      "Oportunidades para juiz-foranos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "niteroi": {
    title: "Grupo WhatsApp Niterói | Renda Extra",
    description: "Grupo WhatsApp em Niterói com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Niterói",
    benefits: [
      "Oportunidades para niteroienses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Niterói",
    ],
  },
  "campos-dos-goytacazes": {
    title: "Grupo WhatsApp Campos dos Goytacazes | Oportunidades",
    description: "Grupo WhatsApp em Campos dos Goytacazes com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Campos dos Goytacazes",
    benefits: [
      "Oportunidades para camposanos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "bauru": {
    title: "Grupo WhatsApp Bauru | Renda Extra",
    description: "Grupo WhatsApp em Bauru com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Bauru",
    benefits: [
      "Oportunidades para bauruenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Bauru",
    ],
  },
  "marilia": {
    title: "Grupo WhatsApp Marília | Oportunidades",
    description: "Grupo WhatsApp em Marília com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Marília",
    benefits: [
      "Oportunidades para marilienses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "presidente-prudente": {
    title: "Grupo WhatsApp Presidente Prudente | Renda Extra",
    description: "Grupo WhatsApp em Presidente Prudente com oportunidades de renda extra. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Presidente Prudente",
    benefits: [
      "Oportunidades para prudentinos",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Presidente Prudente",
    ],
  },
  "aracaju": {
    title: "Grupo WhatsApp Aracaju | Oportunidades",
    description: "Grupo WhatsApp em Aracaju com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Aracaju",
    benefits: [
      "Oportunidades para aracajuenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "maceio": {
    title: "Grupo WhatsApp Maceió | Renda Extra",
    description: "Grupo WhatsApp em Maceió com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Maceió",
    benefits: [
      "Oportunidades para maceioenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Maceió",
    ],
  },
  "joao-pessoa": {
    title: "Grupo WhatsApp João Pessoa | Oportunidades",
    description: "Grupo WhatsApp em João Pessoa com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de João Pessoa",
    benefits: [
      "Oportunidades para pessoenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "natal": {
    title: "Grupo WhatsApp Natal | Renda Extra",
    description: "Grupo WhatsApp em Natal com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Natal",
    benefits: [
      "Oportunidades para natalenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Natal",
    ],
  },
  "teresina": {
    title: "Grupo WhatsApp Teresina | Oportunidades",
    description: "Grupo WhatsApp em Teresina com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Teresina",
    benefits: [
      "Oportunidades para teresinenses",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "campo-grande": {
    title: "Grupo WhatsApp Campo Grande | Renda Extra",
    description: "Grupo WhatsApp em Campo Grande com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Campo Grande",
    benefits: [
      "Oportunidades para campograndenses",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Campo Grande",
    ],
  },
  "cuiaba": {
    title: "Grupo WhatsApp Cuiabá | Oportunidades",
    description: "Grupo WhatsApp em Cuiabá com oportunidades de ganho pelo celular. Gravação de vídeos para IA.",
    h1: "Grupo WhatsApp de Cuiabá",
    benefits: [
      "Oportunidades para cuiabanos",
      "Trabalho remoto e flexível",
      "Pagamento em dólar",
      "Sem experiência necessária",
    ],
  },
  "goiania": {
    title: "Grupo WhatsApp Goiânia | Renda Extra",
    description: "Grupo WhatsApp em Goiânia com oportunidades de renda extra. Gravação de vídeos para IA com pagamento em dólar.",
    h1: "Grupo WhatsApp de Goiânia",
    benefits: [
      "Oportunidades para goianos",
      "Trabalho remoto pelo celular",
      "Renda extra sem investimento",
      "Comunidade ativa em Goiânia",
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `${baseUrl}/grupo-whatsapp/${slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
    },
  };
}

export default async function GrupoWhatsAppPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];

  if (!page) {
    return (
      <main className={styles.page}>
        <div className={`container ${styles.content}`}>
          <h1 className={styles.title}>Página não encontrada</h1>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Como entrar no grupo WhatsApp?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Clique no botão acima para entrar gratuitamente no grupo. Você será redirecionado para o WhatsApp e poderá participar imediatamente.",
                },
              },
              {
                "@type": "Question",
                name: "É gratuito participar?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Sim, 100% gratuito. Não há taxas de participação ou cadastro.",
                },
              },
              {
                "@type": "Question",
                name: "Precisa de experiência?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Não. Qualquer pessoa pode participar. Basta ter um smartphone com câmera.",
                },
              },
            ],
          }),
        }}
      />

      <div className={`container ${styles.content}`}>
        <span className="section-tag">Grupo WhatsApp</span>

        <h1 className={`${styles.title} fade-up`}>
          {page.h1}
        </h1>

        <p className={`${styles.subtitle} fade-up delay-1`}>
          Entre gratuitamente no grupo e comece a ganhar dinheiro gravando vídeos para IA.
        </p>

        <div className={`${styles.benefits} fade-up delay-2`}>
          {page.benefits.map((b, i) => (
            <div key={i} className={styles.benefitItem}>
              <span>✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.ctaBox} fade-up delay-3`}>
          <a href={WA_GROUP} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ width: "100%", justifyContent: "center", fontSize: "18px", padding: "18px 32px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ENTRAR NO GRUPO DO WHATSAPP
          </a>
          <p className={styles.ctaHint}>✅ 100% Gratuito — Sem taxas</p>
        </div>

        <div className={`${styles.faq} fade-up delay-4`}>
          <h2>Perguntas Frequentes</h2>
          <div className={styles.faqItem}>
            <h3>Como entrar no grupo WhatsApp?</h3>
            <p>Clique no botão acima para entrar gratuitamente no grupo. Você será redirecionado para o WhatsApp e poderá participar imediatamente.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>É gratuito participar?</h3>
            <p>Sim, 100% gratuito. Não há taxas de participação ou cadastro.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Precisa de experiência?</h3>
            <p>Não. Qualquer pessoa pode participar. Basta ter um smartphone com câmera.</p>
          </div>
        </div>

        <div className={`${styles.extraLinks} fade-up delay-4`}>
          <Link href="/ganhos">💰 Ver como ganhar</Link>
          <Link href="/indicar">🔗 Sistema de indicação</Link>
          <Link href="/blog">📝 Artigos sobre o projeto</Link>
        </div>
      </div>
    </main>
  );
}
