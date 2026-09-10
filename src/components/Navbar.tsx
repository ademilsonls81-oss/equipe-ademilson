"use client";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#o-que-voce-precisa", label: "Requisitos" },
    { href: "/ganhos", label: "Ganhos" },
    { href: "/blog", label: "Blog" },
    { href: "/compartilhar", label: "Divulgar" },
    { href: "#participar", label: "Participar" },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.inner}`}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoIcon}>🎥</span>
          <span>
            Equipe <strong>Ademilson</strong>
          </span>
        </a>
        <ul className={`${styles.links} ${menuOpen ? styles.open : ""}`}>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setMenuOpen(false)} className={styles.link}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#participar"
              className={`btn btn-primary ${styles.ctaBtn}`}
              onClick={() => setMenuOpen(false)}
            >
              Quero participar
            </a>
          </li>
        </ul>
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={menuOpen ? styles.bar1open : styles.bar1} />
          <span className={menuOpen ? styles.bar2open : styles.bar2} />
          <span className={menuOpen ? styles.bar3open : styles.bar3} />
        </button>
      </div>
    </nav>
  );
}
