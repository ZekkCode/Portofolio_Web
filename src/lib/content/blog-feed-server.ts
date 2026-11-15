import { lookup as dnsLookupDefault } from "node:dns/promises";
import { isIP } from "node:net";
import {
  parseExternalFeedPayload,
  sanitizeSyncErrorMessage,
  isPrivateOrReservedIp,
  validatePublicFeedUrlSyntax,
  type BlogFeedErrorCode,
  type BlogSyncResult,
} from "./blog-sync";

export const MAX_BLOG_FEED_BYTES = 1_500_000;
export const DEFAULT_BLOG_FEED_TIMEOUT_MS = 4500;
export const DEFAULT_BLOG_FEED_MAX_REDIRECTS = 3;
const SERVER_FEED_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  result: BlogSyncResult;
  expiresAt: number;
}

const serverFeedCache = new Map<string, CacheEntry>();

export class BlogFeedGuardError extends Error {
  readonly code: BlogFeedErrorCode;

  constructor(code: BlogFeedErrorCode, message: string) {
    super(message);
    this.name = "BlogFeedGuardError";
    this.code = code;
  }
}

export type DnsLookupFn = (
  hostname: string
) => Promise<Array<{ address: string; family: number }>>;

export interface FetchBlogFeedOptions {
  limit?: number;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  noCache?: boolean;
  nowIso?: () => string;
  dnsLookup?: DnsLookupFn;
  /**
   * Hanya untuk injeksi pengujian terkontrol agar guard default produksi tidak bisa dilewati
   * lewat environment variable.
   */
  destinationGuard?: (rawUrl: string) => Promise<URL>;
}

function safeSourceHost(rawUrl?: string): string {
  try {
    return rawUrl ? new URL(rawUrl).hostname.toLowerCase() : "";
  } catch {
    return "";
  }
}

function failureResult(params: {
  attemptAt: string;
  sourceUrl?: string;
  errorCode: BlogFeedErrorCode;
  errorMessage: string;
}): BlogSyncResult {
  return {
    ok: false,
    status: "error",
    attemptAt: params.attemptAt,
    syncedAt: null,
    sourceHost: safeSourceHost(params.sourceUrl),
    count: 0,
    posts: [],
    errorCode: params.errorCode,
    errorMessage: sanitizeSyncErrorMessage(params.errorMessage),
  };
}

/**
 * Memastikan URL target dan seluruh alamat DNS hasil resolusinya berada di jaringan publik,
 * menolak localhost, IP privat, link-local / cloud metadata, skema non-HTTP(S), port non-standar,
 * serta URL berkredensial.
 */
export async function assertSafePublicDestination(
  rawUrl: string,
  dnsLookup: DnsLookupFn = (hostname) => dnsLookupDefault(hostname, { all: true })
): Promise<URL> {
  const syntaxCheck = validatePublicFeedUrlSyntax(rawUrl);
  if (!syntaxCheck.ok) {
    throw new BlogFeedGuardError(syntaxCheck.errorCode, syntaxCheck.errorMessage);
  }

  const parsed = syntaxCheck.url;
  const hostNoBrackets = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (isIP(hostNoBrackets) !== 0) {
    if (isPrivateOrReservedIp(hostNoBrackets)) {
      throw new BlogFeedGuardError(
        "blocked_destination",
        "Alamat IP privat, loopback, atau metadata tidak diizinkan."
      );
    }
    return parsed;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await dnsLookup(hostNoBrackets);
  } catch {
    throw new BlogFeedGuardError(
      "blocked_destination",
      "Host sumber feed tidak dapat diresolusi melalui DNS."
    );
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new BlogFeedGuardError(
      "blocked_destination",
      "Host sumber feed tidak memiliki alamat IP publik yang valid."
    );
  }

  for (const record of records) {
    if (!record?.address || isPrivateOrReservedIp(record.address)) {
      throw new BlogFeedGuardError(
        "blocked_destination",
        "Resolusi DNS mengarah ke alamat IP privat atau internal yang diblokir."
      );
    }
  }

  return parsed;
}

async function readResponseWithSizeLimit(
  res: Response,
  maxBytes: number,
  controller: AbortController
): Promise<{ ok: true; text: string } | { ok: false; errorMessage: string }> {
  const contentLengthRaw = res.headers.get("content-length");
  if (contentLengthRaw && /^\d+$/.test(contentLengthRaw.trim())) {
    const declared = Number(contentLengthRaw.trim());
    if (declared > maxBytes) {
      try {
        await res.body?.cancel();
      } catch {
        // ignore cancel error
      }
      return {
        ok: false,
        errorMessage: `Ukuran respons feed melebihi batas maksimum ${Math.round(
          maxBytes / 1024
        )} KB.`,
      };
    }
  }

  if (!res.body) {
    const text = await res.text();
    const byteLength = Buffer.byteLength(text, "utf8");
    if (byteLength > maxBytes) {
      return {
        ok: false,
        errorMessage: `Ukuran respons feed melebihi batas maksimum ${Math.round(
          maxBytes / 1024
        )} KB.`,
      };
    }
    return { ok: true, text };
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancel error
      }
      controller.abort();
      return {
        ok: false,
        errorMessage: `Ukuran respons feed melebihi batas maksimum ${Math.round(
          maxBytes / 1024
        )} KB.`,
      };
    }
    chunks.push(value);
  }

  const merged = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return { ok: true, text: merged.toString("utf8") };
}

export function clearBlogFeedServerCache(): void {
  serverFeedCache.clear();
}

/**
 * Mengambil dan mem-parse feed blog eksternal dari sisi server dengan proteksi penuh:
 * validasi URL & DNS publik di setiap hop redirect, batas redirect, timeout ketat,
 * serta batas ukuran respons.
 */
export async function fetchBlogFeedSecurely(
  rawUrl: string | undefined,
  options: FetchBlogFeedOptions = {}
): Promise<BlogSyncResult> {
  const limit = Math.min(Math.max(Math.round(options.limit ?? 12), 1), 50);
  const timeoutMs = Math.max(options.timeoutMs ?? DEFAULT_BLOG_FEED_TIMEOUT_MS, 50);
  const maxBytes = Math.max(options.maxBytes ?? MAX_BLOG_FEED_BYTES, 1024);
  const maxRedirects = Math.max(options.maxRedirects ?? DEFAULT_BLOG_FEED_MAX_REDIRECTS, 0);
  const attemptAt = (options.nowIso ?? (() => new Date().toISOString()))();
  const guard =
    options.destinationGuard ??
    ((u: string) => assertSafePublicDestination(u, options.dnsLookup));

  const trimmedInput = (rawUrl || "").trim();
  if (!trimmedInput) {
    return failureResult({
      attemptAt,
      errorCode: "missing_feed_url",
      errorMessage: "URL sumber feed blog belum diisi.",
    });
  }

  let currentUrl: URL;
  try {
    currentUrl = await guard(trimmedInput);
  } catch (err) {
    if (err instanceof BlogFeedGuardError) {
      return failureResult({
        attemptAt,
        sourceUrl: trimmedInput,
        errorCode: err.code,
        errorMessage: err.message,
      });
    }
    return failureResult({
      attemptAt,
      sourceUrl: trimmedInput,
      errorCode: "blocked_destination",
      errorMessage: "Tujuan URL feed tidak memenuhi syarat keamanan.",
    });
  }

  const canUseDefaultGuardCache = !options.destinationGuard && !options.dnsLookup && !options.noCache;
  const cacheKey = `${currentUrl.toString()}::${limit}`;
  if (canUseDefaultGuardCache) {
    const cached = serverFeedCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response | null = null;

    for (let hop = 0; hop <= maxRedirects; hop++) {
      response = await fetch(currentUrl.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept:
            "application/feed+json, application/json, application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
          "User-Agent": "ZekkPortfolio-FeedSync/2.0 (+https://zakariamp.dev)",
        },
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        try {
          await response.body?.cancel();
        } catch {
          // ignore
        }

        const location = response.headers.get("location")?.trim();
        if (!location) {
          return failureResult({
            attemptAt,
            sourceUrl: currentUrl.toString(),
            errorCode: "http_error",
            errorMessage: `Server sumber mengembalikan redirect HTTP ${response.status} tanpa header Location.`,
          });
        }

        if (hop >= maxRedirects) {
          return failureResult({
            attemptAt,
            sourceUrl: currentUrl.toString(),
            errorCode: "too_many_redirects",
            errorMessage: `Pengalihan (redirect) melebihi batas maksimum ${maxRedirects} kali.`,
          });
        }

        let resolvedTarget: string;
        try {
          resolvedTarget = new URL(location, currentUrl).toString();
        } catch {
          return failureResult({
            attemptAt,
            sourceUrl: currentUrl.toString(),
            errorCode: "unsafe_url",
            errorMessage: "Header redirect mengarah ke URL yang tidak valid.",
          });
        }

        try {
          currentUrl = await guard(resolvedTarget);
        } catch (err) {
          if (err instanceof BlogFeedGuardError) {
            return failureResult({
              attemptAt,
              sourceUrl: resolvedTarget,
              errorCode: err.code,
              errorMessage: err.message,
            });
          }
          return failureResult({
            attemptAt,
            sourceUrl: resolvedTarget,
            errorCode: "blocked_destination",
            errorMessage: "Tujuan redirect diblokir demi keamanan.",
          });
        }

        continue;
      }

      break;
    }

    if (!response) {
      return failureResult({
        attemptAt,
        sourceUrl: currentUrl.toString(),
        errorCode: "http_error",
        errorMessage: "Tidak menerima respons HTTP dari sumber feed.",
      });
    }

    if (!response.ok) {
      try {
        await response.body?.cancel();
      } catch {
        // ignore
      }
      return failureResult({
        attemptAt,
        sourceUrl: currentUrl.toString(),
        errorCode: "http_error",
        errorMessage: `Sumber feed merespons dengan status HTTP ${response.status}.`,
      });
    }

    const bodyRead = await readResponseWithSizeLimit(response, maxBytes, controller);
    if (!bodyRead.ok) {
      return failureResult({
        attemptAt,
        sourceUrl: currentUrl.toString(),
        errorCode: "response_too_large",
        errorMessage: bodyRead.errorMessage,
      });
    }

    const parsedResult = parseExternalFeedPayload({
      rawText: bodyRead.text,
      contentType: response.headers.get("content-type") || "",
      limit,
      sourceUrl: currentUrl.toString(),
      attemptAt,
    });

    if (parsedResult.ok && canUseDefaultGuardCache) {
      if (serverFeedCache.size >= 20) {
        const oldestKey = serverFeedCache.keys().next().value;
        if (oldestKey) serverFeedCache.delete(oldestKey);
      }
      serverFeedCache.set(cacheKey, {
        result: parsedResult,
        expiresAt: Date.now() + SERVER_FEED_CACHE_TTL_MS,
      });
    }

    return parsedResult;
  } catch (err) {
    if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      return failureResult({
        attemptAt,
        sourceUrl: currentUrl.toString(),
        errorCode: "timeout",
        errorMessage: `Permintaan feed melebihi batas waktu ${timeoutMs} ms.`,
      });
    }

    const rawMsg = err instanceof Error ? err.message : "Gagal terhubung ke sumber feed.";
    return failureResult({
      attemptAt,
      sourceUrl: currentUrl.toString(),
      errorCode: "http_error",
      errorMessage: `Gagal mengambil feed: ${rawMsg}`,
    });
  } finally {
    clearTimeout(timer);
  }
}
