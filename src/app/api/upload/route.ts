import { NextResponse } from "next/server";
import { isR2Configured, uploadFileToR2 } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);
const ALLOWED_FOLDERS = new Set(["uploads", "projects", "certificates", "cv", "avatar", "lanyard"]);

export async function GET() {
  return NextResponse.json({
    r2: isR2Configured(),
    supabase: isSupabaseConfigured(),
    maxSizeMb: 10,
    allowedTypes: Array.from(ALLOWED_MIME_TYPES),
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "uploads";
    const folder = ALLOWED_FOLDERS.has(rawFolder.toLowerCase().trim())
      ? rawFolder.toLowerCase().trim()
      : "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan dalam permintaan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas melebihi batas maksimum 10 MB" },
        { status: 413 }
      );
    }

    const contentType = (file.type || "application/octet-stream").toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          error: `Format berkas tidak diizinkan (${contentType}). Format yang didukung: PNG, JPEG, WebP, GIF, SVG, PDF`,
        },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawFilename = file.name || "upload";
    const sanitizedFilename = rawFilename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".");

    if (isR2Configured()) {
      const result = await uploadFileToR2({
        buffer,
        filename: sanitizedFilename,
        contentType,
        folder,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
        provider: "r2",
      });
    }

    // Fallback jika Cloudflare R2 belum diset di .env.local
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      provider: "fallback-data-uri",
      warning:
        "Cloudflare R2 belum aktif. Berkas disimpan sementara sebagai data URI. Isi .env.local untuk menyimpan ke Cloudflare R2.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat unggah";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
