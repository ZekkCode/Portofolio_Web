import { NextResponse } from "next/server";
import { verifyCsrfOrigin } from "@/lib/auth-server";
import {
  checkPreSubmitBurstLimit,
  checkSubmissionAntiSpamLimits,
  dispatchContactEmail,
  extractClientIpInfo,
  getContactRuntimeConfig,
  recordContactSubmission,
  validateContactPayload,
  verifyTurnstileToken,
} from "@/lib/contact-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = getContactRuntimeConfig();
  const hasMailProvider = Boolean(cfg.resendApiKey || cfg.brevoApiKey || cfg.webhookUrl);
  const hasTurnstileSecret = Boolean(cfg.secretKey);
  const turnstileEnabled = Boolean(cfg.siteKey && hasTurnstileSecret);

  return NextResponse.json(
    {
      turnstileEnabled,
      siteKey: cfg.siteKey || "",
      emailConfigured: hasMailProvider,
      turnstileSecretConfigured: hasTurnstileSecret,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      {
        ok: false,
        code: "CSRF_REJECTED",
        error: "Permintaan lintas domain tidak diizinkan.",
      },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { ip, ipHash } = extractClientIpInfo(request);

  // 1. Burst rate limiter sebelum parsing/verifikasi berat
  const burstCheck = checkPreSubmitBurstLimit(ipHash);
  if (!burstCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: burstCheck.code,
        error: burstCheck.error,
        retryAfterSeconds: burstCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(burstCheck.retryAfterSeconds),
        },
      }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_JSON", error: "Format JSON tidak valid." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 2. Validasi schema, honeypot, timing check, sanitasi header & URL spam guard
  const validation = validateContactPayload(rawBody);
  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: validation.code,
        error: validation.error,
        fieldErrors: validation.fieldErrors,
      },
      { status: validation.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const payload = validation.data;
  const cfg = getContactRuntimeConfig();

  // 3. Verifikasi Cloudflare Turnstile
  if (cfg.secretKey) {
    if (!payload.turnstileToken) {
      return NextResponse.json(
        {
          ok: false,
          code: "TURNSTILE_REQUIRED",
          error: "Mohon selesaikan verifikasi keamanan Turnstile terlebih dahulu.",
        },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const turnstile = await verifyTurnstileToken({
      token: payload.turnstileToken,
      ip,
      secretKey: cfg.secretKey,
    });

    if (!turnstile.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "TURNSTILE_FAILED",
          error: "Verifikasi Turnstile gagal atau kedaluwarsa. Silakan ulangi verifikasi.",
          errorCodes: turnstile.errorCodes,
        },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }
  } else if (cfg.isProductionDeploy) {
    // Fail-closed di deployment produksi Vercel jika TURNSTILE_SECRET_KEY belum dipasang
    return NextResponse.json(
      {
        ok: false,
        code: "TURNSTILE_NOT_CONFIGURED",
        error: "Verifikasi keamanan Turnstile server belum dikonfigurasi.",
        fallbackEmail: cfg.toEmail,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 4. Batas anti-spam multi-window (cooldown 45s, 3/15m IP, 5/jam IP, 3/jam email, duplikat 30m)
  const spamCheck = await checkSubmissionAntiSpamLimits({
    ipHash,
    email: payload.email,
    payloadHash: payload.payloadHash,
  });

  if (!spamCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: spamCheck.code,
        error: spamCheck.error,
        retryAfterSeconds: spamCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(spamCheck.retryAfterSeconds),
        },
      }
    );
  }

  // 5. Pengiriman email notifikasi ke pemilik
  const delivery = await dispatchContactEmail(payload, cfg);

  await recordContactSubmission({
    ipHash,
    payload,
    turnstileVerified: Boolean(cfg.secretKey),
    deliveryStatus: delivery.sent ? "sent" : delivery.notConfigured ? "unconfigured" : "failed",
    deliveryProvider: delivery.provider,
    providerMessageId: delivery.messageId,
  });

  if (!delivery.sent) {
    return NextResponse.json(
      {
        ok: false,
        code: delivery.notConfigured ? "EMAIL_NOT_CONFIGURED" : "EMAIL_DELIVERY_FAILED",
        error:
          delivery.error ||
          "Pesan gagal dikirim melalui layanan email saat ini. Silakan coba beberapa saat lagi.",
        fallbackEmail: cfg.toEmail,
      },
      { status: delivery.notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Pesan Anda telah terkirim! Terima kasih telah menghubungi.",
      provider: delivery.provider,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
