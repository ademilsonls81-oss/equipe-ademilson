import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://equipe-ademilson.vercel.app";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/ganhos`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/indicar`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/compartilhar`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/vantagens`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/kit-de-marca`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/assistente-configuracao`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const seoPages = [
    "renda-extra",
    "empregos",
    "oportunidades",
    "cursos-gratuitos",
    "trabalho-casa",
    "celular",
    "suzano",
    "sao-paulo",
    "emprego-remoto",
    "dinheiro-facil",
    "rio-de-janeiro",
    "belo-horizonte",
    "curitiba",
    "salvador",
    "brasilia",
    "fortaleza",
    "manaus",
    "recife",
    "porto-alegre",
    "video-ia",
    "ganhos",
    "campinas",
    "guarulhos",
    "sao-bernardo",
    "santo-andre",
    "osasco",
    "jaboticabal",
    "ribeirao-preto",
    "sao-jose-campos",
    "londrina",
    "maringa",
    "joinville",
    "florianopolis",
    "vitoria",
    "uberlandia",
    "contagem",
    "juiz-de-fora",
    "niteroi",
    "campos-dos-goytacazes",
    "bauru",
    "marilia",
    "presidente-prudente",
    "aracaju",
    "maceio",
    "joao-pessoa",
    "natal",
    "teresina",
    "campo-grande",
    "cuiaba",
    "goiania",
  ].map((slug) => ({
    url: `${baseUrl}/grupo-whatsapp/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...seoPages, ...blogPages];
}
