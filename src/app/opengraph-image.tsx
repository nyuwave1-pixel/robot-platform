import { ImageResponse } from "next/og";

// 소셜 공유(카카오톡·페이스북·트위터 등)용 OG 이미지 자동 생성.
// 한글 폰트 임베드 없이도 깨지지 않도록 라틴 문자 위주로 구성.
export const runtime = "nodejs";
export const alt = "Robot Platform — the world's robots in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0B0F19 0%, #0f1a2e 55%, #0B0F19 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg,#3B82F6,#22D3EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            🤖
          </div>
          <div style={{ fontSize: "30px", color: "#7DD3FC", letterSpacing: "2px" }}>
            AIROBOTPHYSICAL.COM
          </div>
        </div>

        <div
          style={{
            fontSize: "88px",
            fontWeight: 800,
            lineHeight: 1.05,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Robot Platform</span>
          <span
            style={{
              background: "linear-gradient(90deg,#60A5FA,#22D3EE)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            The world's robots, in one place.
          </span>
        </div>

        <div style={{ marginTop: "40px", fontSize: "34px", color: "#94A3B8" }}>
          48 robots · specs &amp; trust scores · community forum &amp; marketplace
        </div>

        <div
          style={{
            marginTop: "48px",
            display: "flex",
            gap: "14px",
          }}
        >
          {["Humanoid", "Industrial", "Medical", "Drone", "Quadruped"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: "24px",
                padding: "10px 22px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(125,211,252,0.3)",
                color: "#CBD5E1",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
