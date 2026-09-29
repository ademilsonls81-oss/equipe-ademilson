import { ImageResponse } from "next/og";

/**
 * Gera a imagem (PNG 1080x1080) usada nas publicações automáticas do Instagram.
 * A Graph API do Instagram exige uma imagem raster (JPEG/PNG) publicamente
 * acessível — SVG não é aceito. Uso:
 *   GET /social-image?title=...&text=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Oportunidade de renda extra com IA").slice(0, 90);
  const text = (searchParams.get("text") || "").slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              background: "#ffd166",
              color: "#10202c",
              padding: "12px 28px",
              borderRadius: 999,
            }}
          >
            Equipe Ademilson
          </div>
          <div style={{ fontSize: 34, opacity: 0.85 }}>🎥 com o celular</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          {text ? (
            <div style={{ fontSize: 40, opacity: 0.9, lineHeight: 1.3 }}>{text}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, opacity: 0.9 }}>
          <div>✅ Cadastro gratuito</div>
          <div>💰 Pagamento em dólar</div>
          <div>📱 Só celular</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
