"use client";
import { useState } from "react";
import Link from "next/link";
import { blogPosts } from "@/lib/blog";
import styles from "./blog.module.css";

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));

  const filtered = selectedTag
    ? blogPosts.filter((p) => p.tags.includes(selectedTag))
    : blogPosts;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-tag">Blog</span>
          <h1 className="section-title">
            Artigos sobre <span>Gravação de Vídeo IA</span>
          </h1>
          <p className="section-subtitle">
            Aprenda tudo sobre gravação de vídeos para treinamento de Inteligência Artificial, dicas práticas e novidades do mercado.
          </p>
        </div>
      </section>

      <section className={styles.tagsSection}>
        <div className="container">
          <div className={styles.tags}>
            <button
              className={`${styles.tag} ${!selectedTag ? styles.tagActive : ""}`}
              onClick={() => setSelectedTag(null)}
            >
              Todos
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`${styles.tag} ${selectedTag === tag ? styles.tagActive : ""}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className="container">
          <div className={styles.posts}>
            {filtered.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
                <div className={styles.cardContent}>
                  <div className={styles.cardMeta}>
                    <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
                    <span>·</span>
                    <span>{post.readingTime} de leitura</span>
                  </div>
                  <h2 className={styles.cardTitle}>{post.title}</h2>
                  <p className={styles.cardExcerpt}>{post.excerpt}</p>
                  <div className={styles.cardTags}>
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.cardTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className={styles.cardLink}>
                    Ler artigo →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className="section-title">Pronto para começar?</h2>
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
