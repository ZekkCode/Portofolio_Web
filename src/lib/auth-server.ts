import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const ADMIN_COOKIE_NAME = "zekk_admin_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 jam

function getSigningKey(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (secret && secret.length >= 16) {
    return secret;
  }

  // Fallback deterministik di host jika environment variable belum diset
  return crypto
    .createHash("sha256")
    .update("zekktech-admin-default-signing-key-salt")
    .digest("hex");
}

export function signSessionToken(payload: { email: string; role: "admin"; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSigningKey())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [dataPart, signaturePart] = token.split(".");
  if (!dataPart || !signaturePart) return { valid: false };

  const expectedSignature = crypto
    .createHmac("sha256", getSigningKey())
    .update(dataPart)
    .digest("base64url");

  // Constant-time comparison untuk mencegah timing attacks
  const a = Buffer.from(signaturePart);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }

  try {
    const json = JSON.parse(Buffer.from(dataPart, "base64url").toString("utf-8"));
    if (typeof json.exp !== "number" || Date.now() / 1000 > json.exp) {
      return { valid: false };
    }
    if (json.role !== "admin") {
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
 * Memeriksa:
 * 1. Supabase Auth via SSR cookie (memverifikasi token ke Supabase)
 * 2. Signed Admin Cookie (HMAC-SHA256)
 * 3. Bearer/Secret header (server-to-server)
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

        // Hanya izinkan jika email sesuai ADMIN_EMAIL atau memiliki app_metadata role admin
        if (email === adminEmail || role === "admin") {
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

  // 3. Periksa Authorization header jika ada request
  if (request) {
    const authHeader = request.headers.get("authorization");
    const secretHeader = request.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET;

    if (adminSecret && adminSecret.length >= 12) {
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : secretHeader?.trim();

      if (token && token.length === adminSecret.length) {
        const a = Buffer.from(token);
        const b = Buffer.from(adminSecret);
        if (crypto.timingSafeEqual(a, b)) {
          return {
            isAuthenticated: true,
            userEmail: adminEmail,
            authMethod: "secret_header",
          };
        }
      }
    }
  }

  return {
    isAuthenticated: false,
    error: "Akses ditolak: Sesi administrator tidak valid atau telah kedaluwarsa.",
  };
}

/**
 * Validasi CSRF / Origin untuk seluruh mutasi (POST, PUT, DELETE, PATCH).
 */
export function verifyCsrfOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    // Jika diakses via direct API tool tanpa browser Origin, periksa referer
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refUrl = new URL(referer);
        return refUrl.host === host;
      } catch {
        return false;
      }
    }
    // Jika tidak ada origin dan tidak ada referer, izinkan hanya jika bukan browser fetch
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") return false;
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const allowedHosts = new Set([
      host,
      "zakariamp.vercel.app",
      "localhost:3000",
      "127.0.0.1:3000",
    ]);

    return allowedHosts.has(originUrl.host);
  } catch {
    return false;
  }
}

/**
 * Rate Limiter sederhana untuk lingkungan Serverless.
 * Menggunakan Map dengan pembersihan otomatis dan IP sliding window.
 */
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  ip: string,
  options: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip) || {
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
    rateLimitMap.set(ip, bucket);

    // Garbage collection jika map terlalu besar
    if (rateLimitMap.size > 1000) {
      for (const [key, b] of rateLimitMap.entries()) {
        if (now - b.lastRefill > options.windowMs * 2) {
          rateLimitMap.delete(key);
        }
      }
    }

    return { allowed: true, remaining: bucket.tokens };
  }

  return { allowed: false, remaining: 0 };
}

