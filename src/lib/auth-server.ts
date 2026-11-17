import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE_NAME = "zekk_admin_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 jam

const SESSION_KEY_CONTEXT = "zekk:admin-session-signing:v1";
const MAX_RATE_LIMIT_ENTRIES = 5000;

/**
 * Perbandingan string waktu-konstan tanpa membocorkan panjang rahasia (zero length side-channel).
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  const hashesEqual = crypto.timingSafeEqual(hashA, hashB);
  return hashesEqual && a.length === b.length;
}

function deriveSigningSubkey(masterSecret: string): string {
  return crypto
    .createHmac("sha256", masterSecret)
    .update(SESSION_KEY_CONTEXT)
    .digest("hex");
}

function getSigningKey(): string | null {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (secret && secret.length >= 16) {
    return deriveSigningSubkey(secret);
  }

  // Di seluruh deployment cloud Vercel (preview maupun production), tolak kunci fallback lokal
  if (Boolean(process.env.VERCEL) || process.env.VERCEL_ENV === "production") {
    return null;
  }

  // Fallback deterministik khusus loopback lokal (untuk pengujian lokal & scripts/check.mjs)
  const devSeed = crypto
    .createHash("sha256")
    .update("zekktech-admin-default-signing-key-salt")
    .digest("hex");
  return deriveSigningSubkey(devSeed);
}

export function signSessionToken(payload: { email: string; role: "admin"; exp: number }): string {
  const key = getSigningKey();
  if (!key) {
    throw new Error("Konfigurasi signing key auth server belum disetel");
  }
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [dataPart, signaturePart] = parts;
  if (!dataPart || !signaturePart) return { valid: false };

  const key = getSigningKey();
  if (!key) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac("sha256", key)
    .update(dataPart)
    .digest("base64url");

  if (!timingSafeEqualStrings(signaturePart, expectedSignature)) {
    return { valid: false };
  }

  try {
    const json = JSON.parse(Buffer.from(dataPart, "base64url").toString("utf-8"));
    if (typeof json.exp !== "number" || Date.now() / 1000 > json.exp) {
      return { valid: false };
    }
    if (json.role !== "admin" || typeof json.email !== "string" || !json.email) {
      return { valid: false };
    }
    return { valid: true, email: json.email };
  } catch {
    return { valid: false };
  }
}

export interface AdminAuthResult {
  isAuthenticated: boolean;
  userEmail?: string;
  authMethod?: "supabase" | "session_cookie" | "secret_header";
  error?: string;
}

/**
 * Validasi otentikasi administrator secara server-side.
 */
export async function verifyAdminRequest(request?: Request): Promise<AdminAuthResult> {
  const adminEmail = (process.env.ADMIN_EMAIL || "zakariamujur6@gmail.com").toLowerCase().trim();

  // 1. Periksa Signed Session Cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const verified = verifySessionToken(sessionCookie);
      if (verified.valid) {
        return {
          isAuthenticated: true,
          userEmail: verified.email,
          authMethod: "session_cookie",
        };
      }
    }
  } catch {
    // Dipanggil dari konteks tanpa headers cookies
  }

  // 2. Periksa Supabase Auth SSR jika dikonfigurasi
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY
  );

  if (hasSupabaseUrl && hasSupabaseKey) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user && user.email) {
        const email = user.email.toLowerCase().trim();
        const role = user.app_metadata?.role;
        const isEmailConfirmed = Boolean(user.email_confirmed_at);

        // Hanya izinkan jika memiliki app_metadata role 'admin' ATAU email admin yang sudah terverifikasi
        if (role === "admin" || (email === adminEmail && isEmailConfirmed)) {
          return {
            isAuthenticated: true,
            userEmail: email,
            authMethod: "supabase",
          };
        }
      }
    } catch {
      // Supabase tidak dapat dijangkau
    }
  }

  // 3. Periksa Authorization header jika ada request (server-to-server)
  if (request) {
    const authHeader = request.headers.get("authorization");
    const secretHeader = request.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET;

    if (adminSecret && adminSecret.length >= 12) {
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : secretHeader?.trim();

      if (token && timingSafeEqualStrings(token, adminSecret)) {
        return {
          isAuthenticated: true,
          userEmail: adminEmail,
          authMethod: "secret_header",
        };
      }
    }
  }

  return {
    isAuthenticated: false,
    error: "Akses ditolak: Sesi administrator tidak valid atau telah kedaluwarsa.",
  };
}

/**
 * Validasi CSRF / Origin ketat (fail-closed) untuk seluruh mutasi (POST, PUT, DELETE, PATCH).
 */
export function verifyCsrfOrigin(request: Request): boolean {
  const isCloudDeploy = Boolean(process.env.VERCEL) || process.env.VERCEL_ENV === "production";
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(",")[0].trim().toLowerCase();

  const allowedHosts = new Set<string>([
    "zakariamp.id",
    "www.zakariamp.id",
    "zakariamp.my.id",
    "www.zakariamp.my.id",
    "zakariamp.vercel.app",
  ]);

  if (host) {
    allowedHosts.add(host);
  }

  if (!isCloudDeploy) {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("127.0.0.1:3000");
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowedHosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
    } catch {}
  }

  const isAllowedUrl = (candidate: string): boolean => {
    try {
      const parsed = new URL(candidate);
      if (isCloudDeploy && parsed.protocol !== "https:") {
        return false;
      }
      if (!isCloudDeploy && parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return false;
      }
      return allowedHosts.has(parsed.host.toLowerCase());
    } catch {
      return false;
    }
  };

  const origin = request.headers.get("origin");
  if (origin) {
    return isAllowedUrl(origin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return isAllowedUrl(referer);
  }

  // Tanpa Origin maupun Referer: hanya izinkan panggilan server-to-server yang membawa header rahasia eksplisit
  const hasExplicitApiSecret = Boolean(
    request.headers.get("authorization")?.startsWith("Bearer ") ||
      request.headers.get("x-admin-secret")
  );
  if (hasExplicitApiSecret && request.headers.get("sec-fetch-site") !== "cross-site") {
    return true;
  }

  return false;
}

/**
 * Ekstraksi IP klien tepercaya yang kebal terhadap spoofing header CF-Connecting-IP / XFF di Vercel.
 */
export function extractTrustedClientIp(request: Request): string {
  const trustCloudflare = process.env.TRUST_CLOUDFLARE_PROXY === "1";

  if (trustCloudflare) {
    const cfIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cfIp) return cfIp.slice(0, 64);
  }

  if (Boolean(process.env.VERCEL)) {
    const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
    if (vercelForwarded) {
      const first = vercelForwarded.split(",")[0]?.trim();
      if (first) return first.slice(0, 64);
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp.slice(0, 64);
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }

  return "127.0.0.1";
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

function pruneRateLimitMap(now: number, windowMs: number) {
  if (rateLimitMap.size <= 1000) return;

  for (const [key, b] of rateLimitMap.entries()) {
    if (now - b.lastRefill > windowMs * 2) {
      rateLimitMap.delete(key);
    }
  }

  // Hard cap FIFO eviction untuk mencegah unbounded memory growth DoS
  while (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitMap.delete(oldestKey);
  }
}

export function checkRateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  const bucket: RateLimitBucket = existing || {
    tokens: options.maxRequests,
    lastRefill: now,
  };

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= options.windowMs) {
    bucket.tokens = options.maxRequests;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    // Refresh insertion order for active key
    rateLimitMap.delete(key);
    rateLimitMap.set(key, bucket);
    pruneRateLimitMap(now, options.windowMs);
    return { allowed: true, remaining: bucket.tokens };
  }

  pruneRateLimitMap(now, options.windowMs);
  return { allowed: false, remaining: 0 };
}
