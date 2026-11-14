import crypto from "node:crypto";
import { getServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

export interface ContactSubmissionInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
  website?: string;
  startedAt?: number;
}

export interface SanitizedContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
  payloadHash: string;
}

export interface ContactRuntimeConfig {
  siteKey: string;
  secretKey: string;
  resendApiKey: string;
  brevoApiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  fromEmail: string;
  toEmail: string;
  isProductionDeploy: boolean;
}

export interface ContactRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  code?:
    | "RATE_LIMIT_BURST"
    | "RATE_LIMIT_COOLDOWN"
    | "RATE_LIMIT_IP_WINDOW"
    | "RATE_LIMIT_IP_HOURLY"
    | "RATE_LIMIT_EMAIL"
    | "DUPLICATE_MESSAGE";
  error?: string;
}

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes: string[];
}

export interface MailDeliveryResult {
  sent: boolean;
  notConfigured?: boolean;
  provider?: "resend" | "brevo" | "webhook";
  messageId?: string;
  error?: string;
}

// Batas anti-spam terkalibrasi agar pengunjung wajar tidak terganggu, sementara bot/spammer terblokir
const BURST_WINDOW_MS = 10 * 60 * 1000;
const BURST_MAX_REQUESTS = 10;

const COOLDOWN_MS = 45 * 1000;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_WINDOW_MAX = 3;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const IP_HOURLY_MAX = 5;
const EMAIL_HOURLY_MAX = 3;
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
const MIN_FORM_FILL_MS = 1500;
const MAX_LINKS_IN_MESSAGE = 4;

const EMAIL_REGEX =
  /^[^\s@<>()[\]\\,;:\"]+@[^\s@<>()[\]\\,;:\"]+\.[^\s@<>()[\]\\,;:\"]{2,}$/;

interface SubmissionStamp {
  ipHash: string;
  email: string;
  payloadHash: string;
  createdAt: number;
}

// Penyimpanan fallback di memori (aktif lokal & lapisan cepat sebelum query DB)
const burstHitsByIp = new Map<string, number[]>();
const recentSubmissions: SubmissionStamp[] = [];

export function getContactRuntimeConfig(): ContactRuntimeConfig {
  const siteKey = (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.TURNSTILE_SITE_KEY ||
    ""
  ).trim();
  const secretKey = (
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    ""
  ).trim();

  return {
    siteKey,
    secretKey,
    resendApiKey: (process.env.RESEND_API_KEY || "").trim(),
    brevoApiKey: (process.env.BREVO_API_KEY || "").trim(),
    webhookUrl: (process.env.CONTACT_WEBHOOK_URL || "").trim(),
    webhookSecret: (process.env.CONTACT_WEBHOOK_SECRET || "").trim(),
    fromEmail: (
      process.env.CONTACT_FROM_EMAIL || "Zakaria Portfolio <onboarding@resend.dev>"
    ).trim(),
    toEmail: (
      process.env.CONTACT_TO_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "zakariamujur6@gmail.com"
    ).trim(),
    isProductionDeploy: process.env.VERCEL_ENV === "production",
  };
}

export function extractClientIpInfo(request: Request): { ip: string; ipHash: string } {
  const cfIp = request.headers.get("cf-connecting-ip");
  const realIp = request.headers.get("x-real-ip");
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  const forwarded = request.headers.get("x-forwarded-for");

  const rawIp =
    cfIp ||
    realIp ||
    (vercelIp ? vercelIp.split(",")[0] : "") ||
    (forwarded ? forwarded.split(",")[0] : "") ||
    "127.0.0.1";

  const ip = rawIp.trim().slice(0, 64) || "127.0.0.1";
  const salt = process.env.ADMIN_SESSION_SECRET || "zekktech-contact-guard";
  const ipHash = crypto.createHash("sha256").update(`${ip}::${salt}`).digest("hex");

  return { ip, ipHash };
}

function hashPayload(email: string, message: string): string {
  const normalized = `${email.toLowerCase()}::${message.trim().replace(/\s+/g, " ").toLowerCase()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function hasCrlf(value: string): boolean {
  return /[\r\n]/.test(value);
}

export function validateContactPayload(
  raw: unknown
):
  | { ok: true; data: SanitizedContactPayload }
  | {
      ok: false;
      status: number;
      code: string;
      error: string;
      fieldErrors?: Record<string, string>;
    } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, status: 400, code: "INVALID_BODY", error: "Payload tidak valid." };
  }

  const body = raw as Record<string, unknown>;

  // 1. Honeypot: bot otomatis sering mengisi kolom tersembunyi `website` / `company`
  const honeypot =
    typeof body.website === "string"
      ? body.website.trim()
      : typeof body.company === "string"
        ? body.company.trim()
        : "";
  if (honeypot.length > 0) {
    return {
      ok: false,
      status: 400,
      code: "SPAM_DETECTED",
      error: "Permintaan ditolak oleh filter anti-spam.",
    };
  }

  // 2. Proteksi pengisian super-cepat (< 1.5 detik) khas skrip bot
  if (typeof body.startedAt === "number" && Number.isFinite(body.startedAt) && body.startedAt > 0) {
    const elapsed = Date.now() - body.startedAt;
    if (elapsed >= 0 && elapsed < MIN_FORM_FILL_MS) {
      return {
        ok: false,
        status: 400,
        code: "SUBMIT_TOO_FAST",
        error: "Pengiriman terlalu cepat. Mohon tinjau pesan Anda sebentar lalu kirim ulang.",
      };
    }
  }

  const rawName = typeof body.name === "string" ? body.name : "";
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const rawSubject = typeof body.subject === "string" ? body.subject : "";
  const rawMessage = typeof body.message === "string" ? body.message : "";
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken.trim() : "";

  if (hasCrlf(rawName) || hasCrlf(rawEmail) || hasCrlf(rawSubject)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_CHARACTERS",
      error: "Karakter tidak diizinkan pada kolom input.",
    };
  }

  const name = rawName.trim().replace(/\s+/g, " ");
  const email = rawEmail.trim().toLowerCase();
  const subject = rawSubject.trim().replace(/\s+/g, " ");
  const message = rawMessage.trim();

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2 || name.length > 100) {
    fieldErrors.name = "Nama harus terdiri dari 2 hingga 100 karakter.";
  }

  if (email.length < 5 || email.length > 160 || !EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Format alamat email tidak valid.";
  }

  if (subject.length > 150) {
    fieldErrors.subject = "Subjek maksimal 150 karakter.";
  }

  if (message.length < 10 || message.length > 3000) {
    fieldErrors.message = "Pesan harus terdiri dari 10 hingga 3000 karakter.";
  } else {
    const linkMatches = message.match(/https?:\/\//gi) || [];
    if (linkMatches.length > MAX_LINKS_IN_MESSAGE) {
      fieldErrors.message = "Terlalu banyak tautan URL dalam satu pesan (maksimal 4 tautan).";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    const firstError = Object.values(fieldErrors)[0];
    return {
      ok: false,
      status: 400,
      code: "VALIDATION_ERROR",
      error: firstError,
      fieldErrors,
    };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      subject: subject || `Pesan Baru dari ${name}`,
      message,
      turnstileToken,
      payloadHash: hashPayload(email, message),
    },
  };
}

function pruneMemoryStores(now: number) {
  for (const [key, stamps] of burstHitsByIp.entries()) {
    const active = stamps.filter((ts) => now - ts < BURST_WINDOW_MS);
    if (active.length === 0) {
      burstHitsByIp.delete(key);
    } else {
      burstHitsByIp.set(key, active);
    }
  }

  while (recentSubmissions.length > 0 && now - recentSubmissions[0].createdAt > HOURLY_WINDOW_MS) {
    recentSubmissions.shift();
  }
}

export function checkPreSubmitBurstLimit(ipHash: string): ContactRateLimitResult {
  const now = Date.now();
  pruneMemoryStores(now);

  const hits = burstHitsByIp.get(ipHash) || [];
  const activeHits = hits.filter((ts) => now - ts < BURST_WINDOW_MS);

  if (activeHits.length >= BURST_MAX_REQUESTS) {
    const oldest = activeHits[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + BURST_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      code: "RATE_LIMIT_BURST",
      error: `Terlalu banyak permintaan dari perangkat Anda. Coba lagi dalam ${retryAfterSeconds} detik.`,
    };
  }

  activeHits.push(now);
  burstHitsByIp.set(ipHash, activeHits);
  return { allowed: true, retryAfterSeconds: 0 };
}

function evaluateHistoryLimits(
  stamps: SubmissionStamp[],
  now: number,
  ipHash: string,
  email: string,
  payloadHash: string
): ContactRateLimitResult {
  const ipHits = stamps
    .filter((s) => s.ipHash === ipHash && now - s.createdAt < HOURLY_WINDOW_MS)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (ipHits.length > 0) {
    const latestIpElapsed = now - ipHits[0].createdAt;
    if (latestIpElapsed < COOLDOWN_MS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((COOLDOWN_MS - latestIpElapsed) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        code: "RATE_LIMIT_COOLDOWN",
        error: `Mohon tunggu ${retryAfterSeconds} detik sebelum mengirim pesan berikutnya.`,
      };
    }
  }

  const ip15m = ipHits.filter((s) => now - s.createdAt < IP_WINDOW_MS);
  if (ip15m.length >= IP_WINDOW_MAX) {
    const oldest = ip15m[ip15m.length - 1].createdAt;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + IP_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      code: "RATE_LIMIT_IP_WINDOW",
      error: `Batas pengiriman sementara tercapai (maksimal ${IP_WINDOW_MAX} pesan per 15 menit).`,
    };
  }

  if (ipHits.length >= IP_HOURLY_MAX) {
    const oldest = ipHits[ipHits.length - 1].createdAt;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + HOURLY_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      code: "RATE_LIMIT_IP_HOURLY",
      error: `Batas pengiriman per jam tercapai (maksimal ${IP_HOURLY_MAX} pesan/jam).`,
    };
  }

  const emailHits = stamps
    .filter((s) => s.email === email && now - s.createdAt < HOURLY_WINDOW_MS)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (emailHits.length >= EMAIL_HOURLY_MAX) {
    const oldest = emailHits[emailHits.length - 1].createdAt;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + HOURLY_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      code: "RATE_LIMIT_EMAIL",
      error: `Alamat email ini telah mencapai batas pengiriman per jam (${EMAIL_HOURLY_MAX} pesan/jam).`,
    };
  }

  const dup = stamps.find(
    (s) => s.payloadHash === payloadHash && now - s.createdAt < DUPLICATE_WINDOW_MS
  );
  if (dup) {
    const retryAfterSeconds = Math.max(1, Math.ceil((dup.createdAt + DUPLICATE_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      code: "DUPLICATE_MESSAGE",
      error: "Pesan yang sama persis baru saja dikirim. Silakan ubah isi pesan jika ingin menindaklanjuti.",
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function checkSubmissionAntiSpamLimits(params: {
  ipHash: string;
  email: string;
  payloadHash: string;
}): Promise<ContactRateLimitResult> {
  const now = Date.now();
  pruneMemoryStores(now);

  // 1. Cek cepat pada cache memori instance
  const memResult = evaluateHistoryLimits(
    recentSubmissions,
    now,
    params.ipHash,
    params.email,
    params.payloadHash
  );
  if (!memResult.allowed) {
    return memResult;
  }

  // 2. Cek persisten ke Supabase (lintas cold-start Serverless Vercel) bila tabel tersedia
  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient();
      if (supabase) {
        const sinceIso = new Date(now - HOURLY_WINDOW_MS).toISOString();
        const { data, error } = await supabase
          .from("contact_messages")
          .select("ip_hash, sender_email, payload_hash, created_at")
          .gte("created_at", sinceIso)
          .or(
            `ip_hash.eq.${params.ipHash},sender_email.eq.${params.email},payload_hash.eq.${params.payloadHash}`
          )
          .order("created_at", { ascending: false })
          .limit(30);

        if (!error && Array.isArray(data) && data.length > 0) {
          const dbStamps: SubmissionStamp[] = data.map((row) => ({
            ipHash: String(row.ip_hash || ""),
            email: String(row.sender_email || "").toLowerCase(),
            payloadHash: String(row.payload_hash || ""),
            createdAt: new Date(String(row.created_at)).getTime() || now,
          }));

          const dbResult = evaluateHistoryLimits(
            dbStamps,
            now,
            params.ipHash,
            params.email,
            params.payloadHash
          );
          if (!dbResult.allowed) {
            return dbResult;
          }
        }
      }
    } catch {
      // Graceful fallback ke pembatas memori jika koneksi DB atau tabel belum siap
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordContactSubmission(params: {
  ipHash: string;
  payload: SanitizedContactPayload;
  turnstileVerified: boolean;
  deliveryStatus: "sent" | "failed" | "unconfigured";
  deliveryProvider?: string;
  providerMessageId?: string;
}): Promise<void> {
  const now = Date.now();
  recentSubmissions.push({
    ipHash: params.ipHash,
    email: params.payload.email,
    payloadHash: params.payload.payloadHash,
    createdAt: now,
  });

  if (isSupabaseConfigured()) {
    try {
      const supabase = getServiceRoleClient();
      if (supabase) {
        await supabase.from("contact_messages").insert({
          ip_hash: params.ipHash,
          sender_name: params.payload.name,
          sender_email: params.payload.email,
          subject: params.payload.subject,
          message: params.payload.message,
          payload_hash: params.payload.payloadHash,
          turnstile_verified: params.turnstileVerified,
          delivery_status: params.deliveryStatus,
          delivery_provider: params.deliveryProvider || null,
          provider_message_id: params.providerMessageId || null,
        });
      }
    } catch {
      // Abaikan diam-diam agar error pencatatan opsional tidak menggagalkan respons sukses email
    }
  }
}

export async function verifyTurnstileToken(params: {
  token: string;
  ip: string;
  secretKey: string;
}): Promise<TurnstileVerifyResult> {
  const formData = new URLSearchParams();
  formData.set("secret", params.secretKey);
  formData.set("response", params.token);
  if (params.ip && params.ip !== "127.0.0.1" && params.ip !== "::1") {
    formData.set("remoteip", params.ip);
  }
  formData.set("idempotency_key", crypto.randomUUID());

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, errorCodes: [`http-${res.status}`] };
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    return {
      success: data.success === true,
      errorCodes: Array.isArray(data["error-codes"]) ? data["error-codes"] : [],
    };
  } catch {
    return { success: false, errorCodes: ["turnstile-unreachable"] };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseFromHeader(fromRaw: string): { name: string; email: string } {
  const match = fromRaw.match(/^(.+?)\s*<([^<>@\s]+@[^<>@\s]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim(),
    };
  }
  return {
    name: "Zakaria Portfolio",
    email: fromRaw.trim() || "onboarding@resend.dev",
  };
}

function buildEmailBodies(payload: SanitizedContactPayload, toEmail: string) {
  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);
  const safeMessageHtml = escapeHtml(payload.message).replace(/\n/g, "<br />");
  const subjectLine = `[Portofolio ZekkTech] ${payload.subject}`;
  const sentAtWib = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    <div style="padding:20px 24px;background:#1d4ed8;color:#ffffff;">
      <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Pesan Portofolio Baru</p>
      <h1 style="margin:6px 0 0;font-size:18px;line-height:1.35;">${safeSubject}</h1>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;width:96px;vertical-align:top;">Pengirim</td>
          <td style="padding:6px 0;font-weight:600;color:#0f172a;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;vertical-align:top;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#1d4ed8;text-decoration:none;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;vertical-align:top;">Waktu</td>
          <td style="padding:6px 0;color:#334155;">${escapeHtml(sentAtWib)} WIB</td>
        </tr>
      </table>
      <div style="padding:16px 18px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;line-height:1.65;color:#1e293b;">
        ${safeMessageHtml}
      </div>
      <p style="margin:18px 0 0;font-size:12px;color:#64748b;">
        Dikirim ke ${escapeHtml(toEmail)} melalui form kontak terverifikasi Turnstile. Balas email ini untuk langsung merespons ${safeName}.
      </p>
    </div>
  </div>
</body>
</html>`.trim();

  const text = [
    `Pesan Portofolio Baru`,
    `Subjek: ${payload.subject}`,
    `Pengirim: ${payload.name} <${payload.email}>`,
    `Waktu: ${sentAtWib} WIB`,
    ``,
    `--- Pesan ---`,
    payload.message,
  ].join("\n");

  return { subjectLine, html, text };
}

export async function dispatchContactEmail(
  payload: SanitizedContactPayload,
  config: ContactRuntimeConfig
): Promise<MailDeliveryResult> {
  const { subjectLine, html, text } = buildEmailBodies(payload, config.toEmail);

  // 1. Primary: Resend REST API
  if (config.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.fromEmail,
          to: [config.toEmail],
          reply_to: payload.email,
          subject: subjectLine,
          html,
          text,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };

      if (res.ok && body.id) {
        return { sent: true, provider: "resend", messageId: body.id };
      }

      return {
        sent: false,
        provider: "resend",
        error: body.message || `Resend mengembalikan status HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        sent: false,
        provider: "resend",
        error: err instanceof Error ? err.message : "Gagal menghubungi server email Resend.",
      };
    }
  }

  // 2. Fallback: Brevo Transactional Email API
  if (config.brevoApiKey) {
    try {
      const sender = parseFromHeader(config.fromEmail);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": config.brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: config.toEmail }],
          replyTo: { email: payload.email, name: payload.name },
          subject: subjectLine,
          htmlContent: html,
          textContent: text,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const body = (await res.json().catch(() => ({}))) as {
        messageId?: string;
        message?: string;
      };

      if (res.ok) {
        return { sent: true, provider: "brevo", messageId: body.messageId };
      }

      return {
        sent: false,
        provider: "brevo",
        error: body.message || `Brevo mengembalikan status HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        sent: false,
        provider: "brevo",
        error: err instanceof Error ? err.message : "Gagal menghubungi server email Brevo.",
      };
    }
  }

  // 3. Fallback: Custom Webhook (misal Google Apps Script mailer / n8n / relay pribadi)
  if (config.webhookUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.webhookSecret) {
        headers.Authorization = `Bearer ${config.webhookSecret}`;
      }

      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: config.toEmail,
          replyTo: payload.email,
          name: payload.name,
          email: payload.email,
          subject: subjectLine,
          message: payload.message,
          html,
          text,
          sentAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        return { sent: true, provider: "webhook", messageId: `webhook-${Date.now()}` };
      }

      return {
        sent: false,
        provider: "webhook",
        error: `Webhook email mengembalikan status HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        sent: false,
        provider: "webhook",
        error: err instanceof Error ? err.message : "Gagal menghubungi webhook email.",
      };
    }
  }

  return {
    sent: false,
    notConfigured: true,
    error: "Layanan pengirim email server (RESEND_API_KEY / BREVO_API_KEY) belum dikonfigurasi.",
  };
}
