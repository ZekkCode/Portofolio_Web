import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { queryBuddyKnowledge } from "@/lib/buddy/buddy-knowledge";

// In-memory sliding rate limiter per IP hash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Content-Length check
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 4096) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. IP Rate limiting
    const forwarded = request.headers.get("x-forwarded-for") || "unknown";
    const ip = forwarded.split(",")[0].trim();
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    if (isRateLimited(ipHash)) {
      return NextResponse.json(
        {
          error: "Terlalu banyak pesan. Silakan tunggu sebentar.",
          reply: "Wah, pelan-pelan ya! Beri jeda sebentar sebelum bertanya lagi.",
          action: "waiting",
        },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "30" } }
      );
    }

    // 3. Body parsing & validation
    const body = await request.json().catch(() => null);
    const message = body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak valid" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const sanitized = message.trim().slice(0, 300);
    const langHint = body?.lang === "en" ? "en" : "id";

    // 4. Query knowledge base
    const result = queryBuddyKnowledge(sanitized, langHint);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Terjadi gangguan sistem",
        reply: "Maaf, sistemku sedang istirahat sejenak. Kamu bisa langsung scroll melihat portofolio Zekk ya!",
        action: "failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
