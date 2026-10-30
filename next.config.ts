import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  // In production, 'unsafe-eval' is eliminated. Only allowed in dev for Turbopack/Webpack HMR.
  // Over-permissive script domains (*.supabase.co, *.cloudflare.com) are removed; scripts are strictly 'self'.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  // Self-hosted fonts via next/font/google; removed external fonts.googleapis.com.
  "style-src 'self' 'unsafe-inline'",
  // Fonts are bundled locally into /_next/static/media/ ('self') and data:
  "font-src 'self' data:",
  // Allowed image sources: local, data URI, blob (Three.js/PDF), Supabase storage, Cloudflare R2, GitHub
  "img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.cloudflare.com https://*.r2.dev https://raw.githubusercontent.com https://avatars.githubusercontent.com",
  // Allowed API & WebSocket connections: Supabase REST/Realtime, Cloudflare R2, Vercel Insights
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://*.cloudflare.com https://*.r2.dev https://vitals.vercel-insights.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Content-Type", value: "text/plain" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Content-Type", value: "application/xml" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
