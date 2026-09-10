import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import styles from "./slug.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Equipe Ademilson`,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://equipadedemilson.com.br"}/blog/${post.slug}`,
    },
  };
}

function renderMarkdown(content: string) {
  const lines = content.trim().split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { html.push("</ul>"); inList = false; }
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 class="${styles.h2}">${trimmed.slice(3)}</h2>`);
    } else if (trimmed.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 class="${styles.h3}">${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) { html.push(`<ul class="${styles.list}">`); inList = true; }
      const item = trimmed.slice(2)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
      html.push(`<li>${item}</li>`);
    } else if (/^\d+\./.test(trimmed)) {
      if (inList) { html.push("</ul>"); inList = false; }
      const item = trimmed.replace(/^\d+\.\s*/, "")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
      html.push(`<p class="${styles.listItem}">${item}</p>`);
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      const p = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="${styles.link}">$1</a>');
      html.push(`<p class="${styles.p}">${p}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://equipadedemilson.com.br";

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <div className="container">
          <Link href="/blog" className={styles.backLink}>← Voltar ao blog</Link>

          <header className={styles.header}>
            <div className={styles.meta}>
              <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>·</span>
              <span>{post.readingTime} de leitura</span>
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <div className={styles.tags}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </header>

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          <footer className={styles.footer}>
            <div className={styles.shareButtons}>
              <span className={styles.shareLabel}>Compartilhar:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + siteUrl + "/blog/" + post.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.whatsapp}`}
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(siteUrl + "/blog/" + post.slug)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.twitter}`}
              >
                X / Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl + "/blog/" + post.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.shareBtn} ${styles.facebook}`}
              >
                Facebook
              </a>
            </div>

            <div className={styles.ctaBox}>
              <h3>Gostou do artigo?</h3>
              <p>Cadastre-se e comece a participar dos projetos de gravação de vídeo para IA.</p>
              <Link href="/#participar" className="btn btn-primary">Quero participar →</Link>
            </div>
          </footer>
        </div>
      </article>
    </main>
  );
}
