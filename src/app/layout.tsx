import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://equipadedemilson.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Equipe Ademilson — Renda com Vídeo IA | Grave vídeos para Inteligência Artificial",
  description:
    "Participe de projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de IA. Entrada gratuita. Sem taxa de participação ou saque. Conheça a Equipe Ademilson.",
  keywords: [
    "renda com vídeos IA",
    "trabalhar com vídeos para inteligência artificial",
    "gravar vídeos para IA",
    "projetos de vídeo IA",
    "trabalho com inteligência artificial",
    "gravação de vídeos POV",
    "oportunidades de vídeos para IA",
    "Equipe Ademilson",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Equipe Ademilson — Renda com Vídeo IA",
    description:
      "Grave vídeos do dia a dia e participe de projetos de treinamento de IA. Entrada gratuita. Conheça como funciona.",
    siteName: "Equipe Ademilson",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Equipe Ademilson — Renda com Vídeo IA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Equipe Ademilson — Renda com Vídeo IA",
    description: "Grave vídeos do dia a dia e participe de projetos de treinamento de IA. Entrada gratuita.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager */}
        {gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        {/* Google Analytics */}
        {gaId && (
          <>
            <script async src={`https://www.googletagservices.com/tag/js/gpt.js`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
        {/* Meta Pixel */}
        {pixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
            }}
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Equipe Ademilson",
              url: SITE_URL,
              description:
                "Equipe de divulgação de projetos de gravação de vídeos em primeira pessoa (POV) para treinamento de Inteligência Artificial.",
              sameAs: [],
            }),
          }}
        />
      </head>
      <body>
        {/* GTM noscript */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
