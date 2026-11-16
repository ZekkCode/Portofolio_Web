import type { BlogPost } from "@/lib/blog-feed";
import type { BlogConfig, BlogSyncStatus } from "@/lib/site-config";

export type BlogFeedErrorCode =
  | "missing_feed_url"
  | "unsafe_url"
  | "blocked_destination"
  | "too_many_redirects"
  | "timeout"
  | "http_error"
  | "response_too_large"
  | "html_not_feed"
  | "invalid_feed_format";

export interface BlogSyncResult {
  ok: boolean;
  status: Exclude<BlogSyncStatus, "never" | "syncing">;
  attemptAt: string;
  syncedAt: string | null;
  sourceHost: string;
  count: number;
  posts: BlogPost[];
  errorCode?: BlogFeedErrorCode;
  errorMessage?: string;
}

export interface ResolvedBlogSyncMeta {
  status: BlogSyncStatus;
  sourceMode: "hybrid" | "manual" | "sync";
  feedUrl: string;
  portalUrl: string;
  attemptAt?: string;
  syncedAt?: string;
  syncedCount: number;
  manualCount: number;
  errorMessage?: string;
  hasLastValidCache: boolean;
}

const TRACKING_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
]);

/**
 * Menghapus info kredensial, token query, maupun alamat IP internal dari pesan error sebelum
 * disimpan ke konfigurasi atau ditampilkan di UI.
 */
export function sanitizeSyncErrorMessage(raw: string): string {
  return String(raw || "")
    .replace(/https?:\/\/[^@\s]+@/gi, "https://[redacted]@")
    .replace(/([?&](?:token|key|secret|apikey|auth|password|sig)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function parseIpv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    num = (num << 8) | n;
  }
  return num >>> 0;
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const n = parseIpv4ToInt(ip);
  if (n === null) return false;
  const b0 = (n >>> 24) & 0xff;
  const b1 = (n >>> 16) & 0xff;
  if (b0 === 0) return true; // 0.0.0.0/8 ("This" network)
  if (b0 === 10) return true; // 10.0.0.0/8 RFC1918
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true; // 100.64.0.0/10 CGNAT
  if (b0 === 127) return true; // 127.0.0.0/8 loopback
  if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12 RFC1918
  if (b0 === 192 && b1 === 0 && ((n >>> 8) & 0xff) === 0) return true; // 192.0.0.0/24
  if (b0 === 192 && b1 === 0 && ((n >>> 8) & 0xff) === 2) return true; // 192.0.2.0/24 TEST-NET-1
  if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16 RFC1918
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true; // 198.18.0.0/15 benchmarking
  if (b0 === 198 && b1 === 51 && ((n >>> 8) & 0xff) === 100) return true; // TEST-NET-2
  if (b0 === 203 && b1 === 0 && ((n >>> 8) & 0xff) === 113) return true; // TEST-NET-3
  if (b0 >= 224) return true; // multicast & reserved (224.0.0.0 - 255.255.255.255)
  return false;
}

export function isPrivateOrReservedIp(rawIp: string): boolean {
  const cleaned = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!cleaned) return true;

  if (parseIpv4ToInt(cleaned) !== null) {
    return isPrivateOrReservedIpv4(cleaned);
  }

  // IPv6 checks
  if (cleaned === "::" || cleaned === "::1") return true;

  // IPv4-mapped IPv6 in dotted form ::ffff:127.0.0.1 or hex form ::ffff:7f00:1
  const v4MappedDotted = cleaned.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4MappedDotted) {
    return isPrivateOrReservedIpv4(v4MappedDotted[1]);
  }
  const v4MappedHex = cleaned.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (v4MappedHex) {
    const hi = parseInt(v4MappedHex[1], 16);
    const lo = parseInt(v4MappedHex[2], 16);
    const dotted = `${(hi >>> 8) & 0xff}.${hi & 0xff}.${(lo >>> 8) & 0xff}.${lo & 0xff}`;
    return isPrivateOrReservedIpv4(dotted);
  }

  // IPv6 ULA fc00::/7 (fc.. or fd..), link-local fe80::/10 (fe8..feb), multicast ff00::/8
  if (/^f[cd][0-9a-f]{2}:/.test(cleaned)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(cleaned)) return true;
  if (/^ff[0-9a-f]{2}:/.test(cleaned)) return true;
  if (/^64:ff9b::/.test(cleaned)) {
    // RFC 6052 Well-Known Prefix 64:ff9b::/96: periksa apakah IPv4 yang tertanam adalah privat
    const suffix = cleaned.replace(/^64:ff9b::/i, "");
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(suffix)) {
      return isPrivateOrReservedIpv4(suffix);
    }
    const hexParts = suffix.split(":");
    if (hexParts.length === 2) {
      const p1 = parseInt(hexParts[0], 16);
      const p2 = parseInt(hexParts[1], 16);
      if (!Number.isNaN(p1) && !Number.isNaN(p2)) {
        const dotted = `${(p1 >>> 8) & 0xff}.${p1 & 0xff}.${(p2 >>> 8) & 0xff}.${p2 & 0xff}`;
        return isPrivateOrReservedIpv4(dotted);
      }
    }
    return false;
  }

  return false;
}

export function isBlockedInternalHostname(rawHostname: string): boolean {
  const host = rawHostname.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localdomain") ||
    host.endsWith(".arpa")
  ) {
    return true;
  }
  if (isPrivateOrReservedIp(host)) {
    return true;
  }
  // Single-label internal hostnames (e.g. "redis", "postgres", "metadata") lack a public TLD
  if (!host.includes(".") && !host.includes(":")) {
    return true;
  }
  return false;
}

export function validatePublicFeedUrlSyntax(rawUrl?: string):
  | { ok: true; url: URL }
  | { ok: false; errorCode: "missing_feed_url" | "unsafe_url" | "blocked_destination"; errorMessage: string } {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    return {
      ok: false,
      errorCode: "missing_feed_url",
      errorMessage: "URL sumber feed blog belum diisi.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      errorCode: "unsafe_url",
      errorMessage: "Format URL sumber feed tidak valid.",
    };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      ok: false,
      errorCode: "unsafe_url",
      errorMessage: "Hanya URL berprotokol HTTP/HTTPS publik yang diizinkan untuk sinkronisasi feed.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      errorCode: "unsafe_url",
      errorMessage: "URL feed tidak boleh menyertakan kredensial user/password.",
    };
  }

  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return {
      ok: false,
      errorCode: "blocked_destination",
      errorMessage: "Port non-standar tidak diizinkan untuk pengambilan feed eksternal.",
    };
  }

  if (isBlockedInternalHostname(parsed.hostname)) {
    return {
      ok: false,
      errorCode: "blocked_destination",
      errorMessage: "Tujuan URL internal atau jaringan privat tidak diizinkan.",
    };
  }

  return { ok: true, url: parsed };
}

export function decodeHtmlEntities(input: string): string {
  return String(input || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTagsAndNormalize(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSafeHttpOrRelativeUrl(rawUrl?: string): boolean {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolveSafeArticleUrl(rawUrl: string | undefined, baseUrl: string): string | null {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return null;
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

export function resolveSafeOptionalImageUrl(rawUrl: unknown, baseUrl: string): string {
  if (typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return "";
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol === "https:" || resolved.protocol === "http:") {
      return resolved.toString();
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Mengkanonisasi URL artikel (lowercase host, hapus hash & tracking params, rapikan trailing slash)
 * agar deteksi duplikasi stabil di berbagai format URL.
 */
export function canonicalizeBlogUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const pathOnly = trimmed.split("#")[0].split("?")[0].replace(/\/+$/, "");
    return pathOnly.toLowerCase() || "/";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    parsed.hash = "";
    const entries = Array.from(parsed.searchParams.entries())
      .filter(([k]) => !TRACKING_QUERY_PARAMS.has(k.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
    parsed.search = "";
    for (const [k, v] of entries) {
      parsed.searchParams.append(k, v);
    }
    const normPath =
      parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, "") : parsed.pathname;
    const host = parsed.hostname.toLowerCase();
    const port =
      (parsed.protocol === "https:" && parsed.port === "443") ||
      (parsed.protocol === "http:" && parsed.port === "80") ||
      !parsed.port
        ? ""
        : `:${parsed.port}`;
    return `${parsed.protocol}//${host}${port}${normPath}${parsed.search}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

export function getCandidateCanonicalKeys(
  post: { id?: string; url?: string; slug?: string },
  portalUrl?: string
): string[] {
  const keys: string[] = [];
  const canonPortal = canonicalizeBlogUrl(portalUrl);
  const canonUrl = canonicalizeBlogUrl(post.url);
  if (canonUrl && canonUrl !== canonPortal && canonUrl !== "/") {
    keys.push(`url:${canonUrl}`);
  }
  const slug = (post.slug || "").trim().toLowerCase();
  if (slug) {
    keys.push(`slug:${slug}`);
  }
  const id = (post.id || "").trim().toLowerCase();
  if (id) {
    keys.push(`id:${id}`);
  }
  return keys;
}

export function getPrimaryStableBlogKey(
  post: { id?: string; url?: string; slug?: string },
  portalUrl?: string
): string {
  const candidates = getCandidateCanonicalKeys(post, portalUrl);
  return candidates[0] || `raw:${String(post.url || post.slug || post.id || "").toLowerCase()}`;
}

export function deduplicateBlogPosts<T extends { id?: string; url?: string; slug?: string }>(
  items: T[],
  portalUrl?: string
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const keys = getCandidateCanonicalKeys(item, portalUrl);
    if (keys.some((k) => seen.has(k))) {
      continue;
    }
    for (const k of keys) {
      seen.add(k);
    }
    result.push(item);
  }

  return result;
}

function slugFromUrlOrTitle(url: string, title: string, fallbackIndex: number): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return last.toLowerCase().replace(/[^a-z0-9-_]/gi, "-");
  } catch {}
  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return fromTitle || `post-${fallbackIndex + 1}`;
}

export function sanitizeFeedPostItem(
  item: unknown,
  index: number,
  sourceUrl: string
): BlogPost | null {
  if (!item || typeof item !== "object") return null;
  const p = item as Record<string, unknown>;

  const title = stripTagsAndNormalize(String(p.title || ""));
  const rawUrl = String(p.url || p.link || "").trim();
  const resolvedUrl = resolveSafeArticleUrl(rawUrl, sourceUrl);
  if (!title || !resolvedUrl) return null;

  const slug =
    String(p.slug || "").trim() || slugFromUrlOrTitle(resolvedUrl, title, index);
  const canonicalUrl = canonicalizeBlogUrl(resolvedUrl) || resolvedUrl;
  const rawId = String(p.id || p.guid || "").trim();
  const id = rawId || slug || canonicalUrl;
  const excerpt = stripTagsAndNormalize(
    String(p.excerpt || p.summary || p.content_text || p.description || "")
  ).slice(0, 400);
  const coverImage = resolveSafeOptionalImageUrl(
    p.cover_image || p.coverImage || p.image || p.thumbnail,
    sourceUrl
  );
  const category =
    stripTagsAndNormalize(
      String(
        p.category ||
          (Array.isArray(p.tags) && typeof p.tags[0] === "string" ? p.tags[0] : "") ||
          "Blog"
      )
    ) || "Blog";
  const publishedAt = String(
    p.published_at || p.publishedAt || p.date_published || p.date || p.pubDate || ""
  ).trim();

  return {
    id,
    title,
    slug,
    excerpt,
    coverImage,
    category,
    publishedAt,
    url: resolvedUrl,
  };
}

function extractXmlTag(block: string, tagNames: string[]): string {
  for (const tag of tagNames) {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function extractAtomLink(block: string): string {
  const linkTags = [...block.matchAll(/<link\b([^>]*?)(?:\/>|>([\s\S]*?)<\/link>)/gi)];
  let fallbackHref = "";
  for (const m of linkTags) {
    const attrs = m[1] || "";
    const body = (m[2] || "").trim();
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch && body) {
      return body;
    }
    if (hrefMatch) {
      const relMatch = attrs.match(/\brel=["']([^"']+)["']/i);
      const rel = (relMatch?.[1] || "alternate").toLowerCase();
      if (rel === "alternate") return hrefMatch[1];
      if (!fallbackHref) fallbackHref = hrefMatch[1];
    }
  }
  return fallbackHref;
}

function extractXmlCover(block: string): string {
  const mediaMatch = block.match(
    /<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["'][^>]*>/i
  );
  if (mediaMatch) return mediaMatch[1];
  return "";
}

function extractXmlCategory(block: string): string {
  const termMatch = block.match(/<category\b[^>]*\bterm=["']([^"']+)["'][^>]*>/i);
  if (termMatch) return stripTagsAndNormalize(termMatch[1]);
  const textCat = extractXmlTag(block, ["category"]);
  return stripTagsAndNormalize(textCat);
}

function parseXmlFeedItems(
  xmlText: string,
  limit: number,
  sourceUrl: string,
  attemptAt: string
): BlogSyncResult {
  const hasFeedRoot = /<(?:rss|feed|rdf:RDF)\b/i.test(xmlText);
  if (!hasFeedRoot) {
    return {
      ok: false,
      status: "error",
      attemptAt,
      syncedAt: null,
      sourceHost: safeHostLabel(sourceUrl),
      count: 0,
      posts: [],
      errorCode: "invalid_feed_format",
      errorMessage: "Dokumen XML bukan struktur RSS atau Atom feed yang valid.",
    };
  }

  const isAtom = /<feed\b/i.test(xmlText) && !/<rss\b/i.test(xmlText);
  const itemPattern = isAtom
    ? /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi
    : /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  const maxScan = Math.max(limit * 4, 48);
  while ((match = itemPattern.exec(xmlText)) !== null && blocks.length < maxScan) {
    blocks.push(match[1]);
  }

  if (blocks.length === 0) {
    return {
      ok: true,
      status: "success_empty",
      attemptAt,
      syncedAt: attemptAt,
      sourceHost: safeHostLabel(sourceUrl),
      count: 0,
      posts: [],
    };
  }

  const sanitized: BlogPost[] = [];
  blocks.forEach((block, idx) => {
    const title = extractXmlTag(block, ["title"]);
    const link = isAtom
      ? extractAtomLink(block) || extractXmlTag(block, ["id"])
      : extractXmlTag(block, ["link", "guid"]);
    const guid = extractXmlTag(block, ["guid", "id"]);
    const excerpt = extractXmlTag(block, ["summary", "description", "content:encoded", "content"]);
    const publishedAt = extractXmlTag(block, ["pubDate", "published", "updated", "dc:date"]);
    const category = extractXmlCategory(block) || "Blog";
    const coverImage = extractXmlCover(block);

    const parsed = sanitizeFeedPostItem(
      {
        id: guid || undefined,
        title,
        url: link,
        excerpt,
        coverImage,
        category,
        publishedAt,
      },
      idx,
      sourceUrl
    );
    if (parsed) sanitized.push(parsed);
  });

  const deduped = deduplicateBlogPosts(sanitized).slice(0, limit);
  if (deduped.length === 0) {
    return {
      ok: false,
      status: "error",
      attemptAt,
      syncedAt: null,
      sourceHost: safeHostLabel(sourceUrl),
      count: 0,
      posts: [],
      errorCode: "invalid_feed_format",
      errorMessage: "Entri feed XML ditemukan, tetapi tidak memiliki judul dan tautan artikel yang valid.",
    };
  }

  return {
    ok: true,
    status: "success_posts",
    attemptAt,
    syncedAt: attemptAt,
    sourceHost: safeHostLabel(sourceUrl),
    count: deduped.length,
    posts: deduped,
  };
}

function safeHostLabel(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isHtmlFeedResponse(rawText: string, contentType: string): boolean {
  const ct = (contentType || "").toLowerCase();
  const trimmed = (rawText || "").trim();
  return (
    ct.includes("text/html") ||
    ct.includes("application/xhtml+xml") ||
    /^<!doctype\s+html/i.test(trimmed) ||
    /^<html[\s>]/i.test(trimmed) ||
    /^<(?:head|body)[\s>]/i.test(trimmed)
  );
}

/**
 * Menemukan link feed RSS/Atom/JSON resmi yang dideklarasikan eksplisit oleh halaman HTML
 * melalui tag <link rel="alternate" type="..."> tanpa menebak endpoint.
 */
export function extractAlternateFeedUrl(htmlText: string, baseUrl: string): string | null {
  if (!htmlText) return null;
  const linkTags = htmlText.matchAll(/<link\b([^>]+)>/gi);
  for (const m of linkTags) {
    const attrs = m[1] || "";
    if (!/\brel=["'][^"']*\balternate\b[^"']*["']/i.test(attrs)) continue;
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const mime = (typeMatch?.[1] || "").toLowerCase().split(";")[0].trim();
    if (
      mime !== "application/rss+xml" &&
      mime !== "application/atom+xml" &&
      mime !== "application/feed+json" &&
      mime !== "application/json"
    ) {
      continue;
    }
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch?.[1]) continue;
    const resolved = resolveSafeArticleUrl(decodeHtmlEntities(hrefMatch[1]), baseUrl);
    if (resolved) return resolved;
  }
  return null;
}

function unwrapNextImageProxyUrl(rawSrc: string, baseUrl: string): string {
  const decoded = decodeHtmlEntities(rawSrc || "").trim();
  if (!decoded) return "";
  try {
    const parsed = new URL(decoded, baseUrl);
    if (parsed.pathname === "/_next/image" && parsed.searchParams.has("url")) {
      const inner = parsed.searchParams.get("url") || "";
      return resolveSafeOptionalImageUrl(inner, baseUrl);
    }
    return resolveSafeOptionalImageUrl(parsed.toString(), baseUrl);
  } catch {
    return resolveSafeOptionalImageUrl(decoded, baseUrl);
  }
}

function isLikelyArticleHref(resolvedUrl: string, sourceUrl: string): boolean {
  if (canonicalizeBlogUrl(resolvedUrl) === canonicalizeBlogUrl(sourceUrl)) return false;
  try {
    const parsed = new URL(resolvedUrl);
    const segs = parsed.pathname.split("/").filter(Boolean);
    if (segs.length === 0) return false;
    // Hindari link halaman nav portal seperti /blog, /about, /contact, /sertifikat
    if (segs.length === 1 && ["blog", "about", "contact", "portofolio", "sertifikat"].includes(segs[0].toLowerCase())) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function extractArticleFieldsFromCardHtml(
  cardHtml: string,
  href: string,
  idx: number,
  sourceUrl: string
): BlogPost | null {
  const resolvedUrl = resolveSafeArticleUrl(decodeHtmlEntities(href), sourceUrl);
  if (!resolvedUrl || !isLikelyArticleHref(resolvedUrl, sourceUrl)) return null;

  const headingMatch = cardHtml.match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i);
  const imgAltMatch = cardHtml.match(/<img\b[^>]*\balt=(["'])([\s\S]*?)\1/i);
  const title = stripTagsAndNormalize(headingMatch?.[1] || imgAltMatch?.[2] || "");
  if (!title) return null;

  const excerptMatch =
    cardHtml.match(
      /<p\b[^>]*class=(["'])[^"']*\b(?:card-excerpt|excerpt|summary|desc)\b[^"']*\1[^>]*>([\s\S]*?)<\/p>/i
    ) || cardHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const excerpt = stripTagsAndNormalize(excerptMatch?.[2] ?? excerptMatch?.[1] ?? "");

  const categoryMatch = cardHtml.match(
    /<(?:span|div)\b[^>]*class=(["'])[^"']*\b(?:category-pill|category|badge|tag)\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:span|div)>/i
  );
  const category = stripTagsAndNormalize(categoryMatch?.[2] || "") || "Blog";

  const timeDatetimeMatch = cardHtml.match(/<time\b[^>]*\bdatetime=(["'])([^"']+)\1/i);
  const dateBlockMatch =
    cardHtml.match(
      /<(?:span|div|time)\b[^>]*class=(["'])[^"']*\b(?:card-date|date|published)\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:span|div|time)>/i
    ) || cardHtml.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i);
  const publishedAt = stripTagsAndNormalize(
    dateBlockMatch?.[2] ?? dateBlockMatch?.[1] ?? timeDatetimeMatch?.[2] ?? ""
  );

  const imgSrcMatch = cardHtml.match(/<img\b[^>]*\b(?:src|data-src)=(["'])([^"']+)\1/i);
  const coverImage = imgSrcMatch?.[2]
    ? unwrapNextImageProxyUrl(imgSrcMatch[2], sourceUrl)
    : "";

  return sanitizeFeedPostItem(
    {
      title,
      url: resolvedUrl,
      excerpt,
      coverImage,
      category,
      publishedAt,
    },
    idx,
    sourceUrl
  );
}

/**
 * Mengekstrak daftar artikel asli dari markup HTML terstruktur portal blog (misalnya kartu <article>
 * atau tautan /post/ pada zekktech.biz.id/blog) tanpa mengembalikan data contoh fiktif.
 */
export function parseHtmlPortalArticleCards(
  htmlText: string,
  limit: number,
  sourceUrl: string,
  attemptAt: string
): BlogSyncResult | null {
  const sourceHost = safeHostLabel(sourceUrl);
  const maxScan = Math.max(limit * 4, 48);
  const collected: BlogPost[] = [];

  // Pola 1: <a href="/post/...">...<article>...</article>...</a> (struktur Next.js portal blog)
  const wrappedAnchorRegex = /<a\b[^>]*\bhref=(["'])([^"'#][^"']*)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = wrappedAnchorRegex.exec(htmlText)) !== null && collected.length < maxScan) {
    const href = m[2];
    const inner = m[3];
    const hasStructuredCard =
      /<article\b/i.test(inner) ||
      (/\/(?:post|posts|article|articles|artikel)\//i.test(href) && /<h[1-4]\b/i.test(inner));
    if (!hasStructuredCard) continue;

    const item = extractArticleFieldsFromCardHtml(inner, href, collected.length, sourceUrl);
    if (item) collected.push(item);
  }

  // Pola 2: <article>...<a href="..."><h3>Title</h3></a>...</article>
  if (collected.length === 0) {
    const articleBlockRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
    while ((m = articleBlockRegex.exec(htmlText)) !== null && collected.length < maxScan) {
      const inner = m[1];
      if (!/<h[1-4]\b/i.test(inner)) continue;
      const anchorMatch = inner.match(/<a\b[^>]*\bhref=(["'])([^"'#][^"']*)\1/i);
      if (!anchorMatch?.[2]) continue;

      const item = extractArticleFieldsFromCardHtml(
        inner,
        anchorMatch[2],
        collected.length,
        sourceUrl
      );
      if (item) collected.push(item);
    }
  }

  const deduped = deduplicateBlogPosts(collected, sourceUrl).slice(0, limit);
  if (deduped.length === 0) {
    return null;
  }

  return {
    ok: true,
    status: "success_posts",
    attemptAt,
    syncedAt: attemptAt,
    sourceHost,
    count: deduped.length,
    posts: deduped,
  };
}

/**
 * Mem-parse respons feed eksternal (JSON / RSS / Atom) secara ketat,
 * serta mendukung kartu artikel HTML terstruktur pada portal blog resmi.
 * Menolak halaman HTML non-artikel dan tidak pernah mengisi fallback dummy.
 */
export function parseExternalFeedPayload(params: {
  rawText: string;
  contentType: string;
  limit: number;
  sourceUrl: string;
  attemptAt: string;
}): BlogSyncResult {
  const { rawText, contentType, limit, sourceUrl, attemptAt } = params;
  const ct = (contentType || "").toLowerCase();
  const trimmed = (rawText || "").trim();
  const sourceHost = safeHostLabel(sourceUrl);

  // Halaman HTML: ekstrak hanya jika memuat kartu artikel terstruktur; HTML lain tetap ditolak
  if (isHtmlFeedResponse(trimmed, ct)) {
    const htmlCardsResult = parseHtmlPortalArticleCards(trimmed, limit, sourceUrl, attemptAt);
    if (htmlCardsResult) {
      return htmlCardsResult;
    }

    return {
      ok: false,
      status: "error",
      attemptAt,
      syncedAt: null,
      sourceHost,
      count: 0,
      posts: [],
      errorCode: "html_not_feed",
      errorMessage:
        "URL sumber mengembalikan halaman HTML tanpa feed JSON/RSS/Atom maupun kartu artikel terstruktur. Periksa konfigurasi URL.",
    };
  }

  // XML / RSS / Atom feed
  if (
    ct.includes("xml") ||
    ct.includes("rss") ||
    ct.includes("atom") ||
    /^<\?xml\b/i.test(trimmed) ||
    /^<(?:rss|feed|rdf:RDF)\b/i.test(trimmed)
  ) {
    return parseXmlFeedItems(trimmed, limit, sourceUrl, attemptAt);
  }

  // JSON / JSON Feed
  if (
    ct.includes("json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return {
        ok: false,
        status: "error",
        attemptAt,
        syncedAt: null,
        sourceHost,
        count: 0,
        posts: [],
        errorCode: "invalid_feed_format",
        errorMessage: "Respons berformat JSON rusak atau tidak dapat diparse.",
      };
    }

    const obj =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    const rawList = Array.isArray(parsed)
      ? parsed
      : obj && Array.isArray(obj.posts)
      ? obj.posts
      : obj && Array.isArray(obj.items)
      ? obj.items
      : obj && Array.isArray(obj.data)
      ? obj.data
      : null;

    if (!rawList) {
      return {
        ok: false,
        status: "error",
        attemptAt,
        syncedAt: null,
        sourceHost,
        count: 0,
        posts: [],
        errorCode: "invalid_feed_format",
        errorMessage: "Payload JSON tidak memiliki daftar artikel (array, posts, items, atau data).",
      };
    }

    if (rawList.length === 0) {
      return {
        ok: true,
        status: "success_empty",
        attemptAt,
        syncedAt: attemptAt,
        sourceHost,
        count: 0,
        posts: [],
      };
    }

    const validPosts = rawList
      .map((item, idx) => sanitizeFeedPostItem(item, idx, sourceUrl))
      .filter((p): p is BlogPost => p !== null);

    const deduped = deduplicateBlogPosts(validPosts).slice(0, limit);
    if (deduped.length === 0) {
      return {
        ok: false,
        status: "error",
        attemptAt,
        syncedAt: null,
        sourceHost,
        count: 0,
        posts: [],
        errorCode: "invalid_feed_format",
        errorMessage: "Item JSON feed ditemukan, tetapi tidak ada artikel valid yang memiliki judul dan tautan aman.",
      };
    }

    return {
      ok: true,
      status: "success_posts",
      attemptAt,
      syncedAt: attemptAt,
      sourceHost,
      count: deduped.length,
      posts: deduped,
    };
  }

  return {
    ok: false,
    status: "error",
    attemptAt,
    syncedAt: null,
    sourceHost,
    count: 0,
    posts: [],
    errorCode: "invalid_feed_format",
    errorMessage: "Format respons sumber bukan JSON, RSS, atau Atom feed yang didukung.",
  };
}

/**
 * Menyelesaikan status sinkronisasi blog efektif untuk tampilan Admin & diagnostik.
 */
export function resolveBlogSyncMeta(blog?: Partial<BlogConfig>): ResolvedBlogSyncMeta {
  const modeRaw = (blog?.sourceMode as string | undefined) || "hybrid";
  const sourceMode: "hybrid" | "manual" | "sync" =
    modeRaw === "manual" ? "manual" : modeRaw === "sync" || modeRaw === "synced" ? "sync" : "hybrid";
  const syncedPosts = Array.isArray(blog?.syncedPosts) ? blog.syncedPosts : [];
  const manualPosts = Array.isArray(blog?.manualPosts) ? blog.manualPosts : [];

  let status: BlogSyncStatus = blog?.syncStatus || "never";
  if (!blog?.syncStatus) {
    if (blog?.lastSyncError) status = "error";
    else if (blog?.lastSyncedAt) status = syncedPosts.length > 0 ? "success_posts" : "success_empty";
    else if (syncedPosts.length > 0) status = "success_posts";
    else status = "never";
  }

  return {
    status,
    sourceMode,
    feedUrl: (blog?.feedUrl || "").trim(),
    portalUrl: (blog?.portalUrl || blog?.feedUrl || "").trim(),
    attemptAt: blog?.lastSyncAttemptAt || blog?.lastSyncedAt,
    syncedAt: blog?.lastSyncedAt,
    syncedCount: blog?.lastSyncCount ?? syncedPosts.length,
    manualCount: manualPosts.filter((p) => p.published !== false && p.visible !== false).length,
    errorMessage: blog?.lastSyncError ? sanitizeSyncErrorMessage(blog.lastSyncError) : undefined,
    hasLastValidCache: syncedPosts.length > 0,
  };
}
