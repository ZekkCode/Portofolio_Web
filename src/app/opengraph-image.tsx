import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile } from "@/lib/content/selectors";
import { resolveCanonicalSiteUrl } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "Zakaria Mujur Prasetyo - ZekkTech Portfolio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

let cachedPortraitDataUri: string | null | undefined;
function getPortraitDataUri(): string | null {
  if (cachedPortraitDataUri !== undefined) return cachedPortraitDataUri;
  try {
    const portraitPath = path.join(process.cwd(), "public/images/zakaria-profile-og.png");
    if (!existsSync(portraitPath)) {
      cachedPortraitDataUri = null;
      return null;
    }
    const base64 = readFileSync(portraitPath).toString("base64");
    cachedPortraitDataUri = `data:image/png;base64,${base64}`;
    return cachedPortraitDataUri;
  } catch {
    cachedPortraitDataUri = null;
    return null;
  }
}

export default async function Image() {
  const config = await fetchPublishedContent();
  const pub = getPublishedProfile(config, "id");
  const canonical = resolveCanonicalSiteUrl(pub.site);
  const siteHost = canonical.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const rawAccent = (config.lanyard?.cardColor || "").trim();
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(rawAccent) ? rawAccent : "#1b45c4";
  const portraitSrc = getPortraitDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
          backgroundColor: "#0a0a14",
          backgroundImage: `radial-gradient(circle at 20% 20%, ${accent} 0%, transparent 45%), radial-gradient(circle at 85% 75%, #0b2a8a 0%, transparent 52%)`,
          padding: "56px 64px",
          color: "#ffffff",
          fontFamily: "sans-serif",
          gap: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "9999px",
                backgroundColor: "#3b82f6",
              }}
            />
            <span style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", color: "#e2e8f0" }}>
              {pub.brand}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <h1
              style={{
                fontSize: "58px",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                margin: 0,
                color: "#ffffff",
              }}
            >
              {pub.name}
            </h1>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 600,
                lineHeight: 1.35,
                color: "#94a3b8",
                margin: 0,
              }}
            >
              {pub.roles} • {pub.location}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.16)",
              paddingTop: "24px",
              fontSize: "21px",
              color: "#cbd5e1",
            }}
          >
            <span>{siteHost}</span>
            <span>Aktif sejak {pub.since}</span>
          </div>
        </div>

        {portraitSrc && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              width: "380px",
              height: "100%",
              borderRadius: "28px",
              border: "2px solid rgba(96, 165, 250, 0.45)",
              backgroundImage: "linear-gradient(180deg, #f4f7ff 0%, #dbe6ff 60%, #bfdbfe 100%)",
              overflow: "hidden",
              paddingTop: "16px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitSrc}
              alt={pub.name}
              width={400}
              height={446}
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}
