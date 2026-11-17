import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { queryBuddyKnowledge } from "@/lib/buddy/buddy-knowledge";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { checkRateLimit, extractTrustedClientIp, verifyCsrfOrigin } from "@/lib/auth-server";

const MAX_BUDDY_PAYLOAD_BYTES = 4096;

async function readBoundedText(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => {});
          return null;
        }
        output += decoder.decode(value, { stream: true });
      }
    }
    output += decoder.decode();
    return output;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Permintaan lintas domain tidak diizinkan." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    // 1. Batas ukuran body (mencakup Content-Length maupun Chunked Transfer-Encoding)
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BUDDY_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 2. IP Rate limiting dengan bounded Map & anti-spoofing IP
    const ip = extractTrustedClientIp(request);
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const rate = checkRateLimit(`buddy:${ipHash}`, { maxRequests: 30, windowMs: 60 * 1000 });

    if (!rate.allowed) {
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
    const rawText = await readBoundedText(request, MAX_BUDDY_PAYLOAD_BYTES);
    if (rawText === null) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413, headers: { "Cache-Control": "no-store" } }
      );
    }

    let body: { message?: unknown; lang?: unknown } | null = null;
    try {
      body = JSON.parse(rawText);
    } catch {
      body = null;
    }

    const message = body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak valid" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const sanitized = message.trim().slice(0, 300);
    const langHint = body?.lang === "en" ? "en" : "id";

    // 4. Query live published knowledge base (never leaks drafts)
    const activeConfig = await fetchPublishedContent();

    const result = queryBuddyKnowledge(sanitized, langHint, activeConfig);

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
