import { NextRequest, NextResponse } from "next/server";
import { extractR2Key, getR2Config, getR2Object, isR2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = new Set([
  "uploads",
  "projects",
  "certificates",
  "cv",
  "avatar",
  "lanyard",
]);

/**
 * Route Handler Terotorisasi untuk menyajikan objek privat Cloudflare R2
 * Digunakan ketika bucket R2 belum mengaktifkan Public Access / Custom Domain.
 */
export async function GET(request: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Storage Cloudflare R2 belum dikonfigurasi di server." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return NextResponse.json(
      { error: "Parameter 'key' wajib disertakan." },
      { status: 400 }
    );
  }

  const config = getR2Config();
  const key = extractR2Key(rawKey, config?.bucketName);

  // Mencegah Path Traversal dan karakter berbahaya
  if (
    !key ||
    key.includes("..") ||
    key.includes("\0") ||
    key.startsWith("/") ||
    key.startsWith("\\")
  ) {
    return NextResponse.json(
      { error: "Format object key tidak valid." },
      { status: 400 }
    );
  }

  // Verifikasi prefix folder dalam daftar allowlist
  const folder = key.split("/")[0]?.toLowerCase();
  if (!folder || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: "Akses folder objek ditolak." },
      { status: 403 }
    );
  }

  try {
    const object = await getR2Object(key);
    if (!object) {
      return NextResponse.json(
        { error: "Berkas tidak ditemukan di Cloudflare R2." },
        { status: 404 }
      );
    }

    const filename = key.split("/").pop() || "download";
    const wantsDownload = searchParams.get("download") === "1";

    const headers: Record<string, string> = {
      "Content-Type": object.contentType,
      "Content-Length": String(object.body.length),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    };

    if (wantsDownload) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(Buffer.from(object.body), {
      status: 200,
      headers,
    });
  } catch (err) {
    // Log error secara aman tanpa membocorkan credentials atau stack trace internal
    console.error("[api/r2-file] Gagal mengambil objek R2:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengambil berkas dari storage." },
      { status: 500 }
    );
  }
}
