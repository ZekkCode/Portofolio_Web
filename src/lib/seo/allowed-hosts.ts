import { resolveCanonicalSiteUrl } from "@/lib/profile";

/**
 * Daftar eksak host produksi yang diizinkan untuk indeksasi SEO fleksibel dua domain.
 * Mencegah Host Header Injection, Web Cache Poisoning, & kebocoran indeksasi *.vercel.app.
 */
const CANONICAL_HOST_ORIGIN_MAP: Record<string, string> = {
  "zakariamp.id": "https://www.zakariamp.id",
  "www.zakariamp.id": "https://www.zakariamp.id",
  "zakariamp.my.id": "https://www.zakariamp.my.id",
  "www.zakariamp.my.id": "https://www.zakariamp.my.id",
};

const LOCAL_DEV_HOSTS = new Set([
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
]);

export interface ResolvedHostContext {
  siteUrl: string;
  isIndexableHost: boolean;
}

export function resolveSafeHostContext(
  rawHostHeader: string | null | undefined,
  configuredCanonical?: string
): ResolvedHostContext {
  const fallbackRaw = resolveCanonicalSiteUrl(configuredCanonical).replace(/\/$/, "");
  let safeFallback = "https://www.zakariamp.id";
  try {
    const parsedFallback = new URL(fallbackRaw);
    const mappedFallback = CANONICAL_HOST_ORIGIN_MAP[parsedFallback.host.toLowerCase()];
    safeFallback = mappedFallback || `${parsedFallback.protocol}//${parsedFallback.host}`;
  } catch {
    safeFallback = "https://www.zakariamp.id";
  }

  const firstHost = (rawHostHeader || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (!firstHost) {
    return { siteUrl: safeFallback, isIndexableHost: true };
  }

  // 1. Cek domain produksi resmi (zakariamp.id & zakariamp.my.id) dengan port standar (tanpa port liar)
  const hasValidProdPort = !firstHost.includes(":") || /:(80|443)$/.test(firstHost);
  const hostWithoutPort = firstHost.split(":")[0];
  const mappedOrigin = hasValidProdPort
    ? CANONICAL_HOST_ORIGIN_MAP[firstHost] || CANONICAL_HOST_ORIGIN_MAP[hostWithoutPort]
    : undefined;
  if (mappedOrigin) {
    return { siteUrl: mappedOrigin, isIndexableHost: true };
  }

  // 2. Lingkungan lokal (non-Vercel)
  if (!process.env.VERCEL && (LOCAL_DEV_HOSTS.has(firstHost) || /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(firstHost))) {
    const candidate = `http://${firstHost}`;
    try {
      const u = new URL(candidate);
      return { siteUrl: `${u.protocol}//${u.host}`, isIndexableHost: true };
    } catch {
      return { siteUrl: "http://localhost:3000", isIndexableHost: true };
    }
  }

  // 3. Host preview / *.vercel.app / host asing: arahkan canonical ke fallback aman & matikan indeksasi
  return { siteUrl: safeFallback, isIndexableHost: false };
}
