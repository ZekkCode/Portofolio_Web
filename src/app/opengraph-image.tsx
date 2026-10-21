import { ImageResponse } from "next/og";
import { profile } from "@/lib/profile";

export const runtime = "nodejs";
export const alt = `${profile.name} - ${profile.brand} Portfolio`;
export const size = {
  width: 1200,
  height: 630,
};
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0a0a14",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1b45c4 0%, transparent 45%), radial-gradient(circle at 85% 75%, #0b2a8a 0%, transparent 50%)",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "9999px",
              backgroundColor: "#2f6fe0",
            }}
          />
          <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {profile.brand}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {profile.name}
          </h1>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 600,
              color: "#94a3b8",
              margin: 0,
            }}
          >
            {profile.roles} • {profile.location}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "28px",
            fontSize: "22px",
            color: "#cbd5e1",
          }}
        >
          <span>{profile.site.replace("https://", "")}</span>
          <span>Freelance sejak {profile.since}</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
