import { ImageResponse } from "next/og";

// Edge, not Node — see the note in app/icon.tsx.
export const runtime = "edge";
export const alt =
  "Worapat Settapak — UX/UI Designer & Digital Artist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#080808",
          backgroundImage:
            "radial-gradient(120% 80% at 50% 0%, rgba(16,185,129,0.45) 0%, rgba(6,182,212,0.18) 35%, transparent 70%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 18,
            textTransform: "uppercase",
            letterSpacing: "0.35em",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              background: "linear-gradient(135deg,#10b981,#06b6d4)",
            }}
          />
          Portfolio · 2026
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Designing
          </div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg,#6ee7b7,#06b6d4)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            experiences.
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 880,
              lineHeight: 1.3,
            }}
          >
            Worapat Settapak — UX/UI Designer &amp; Digital Artist crafting
            interfaces people love.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
          }}
        >
          <span>worapat · settapak</span>
          <span>Bangkok · Thailand</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
