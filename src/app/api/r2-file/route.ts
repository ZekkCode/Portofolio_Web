import { NextRequest, NextResponse } from "next/server";
import {
  extractR2Key,
  getR2Config,
  getR2ObjectStream,
  isAssetPubliclyPublished,
  isR2Configured,
} from "@/lib/r2";
import { verifyAdminRequest } from "@/lib/auth-server";

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
 * Route Handler Terotorisasi untuk menyajikan objek Cloudflare R2
 * 
 * Kebijakan Keamanan & Akses:
 * 1. Validasi Object Key: Memblokir path traversal (..), null bytes, dan karakter berbahaya.
 * 2. Klasifikasi Akses Publik vs Privat:
 *    - Publik: Berkas portofolio di folder terbuka ('projects', 'certificates', 'avatar', 'lanyard'),
 *      dokumen CV sah yang terdaftar di konfigurasi, dan berkas 'uploads' yang dipublikasikan di site_config.
 *    - Privat: Berkas di 'uploads' yang belum dipublikasikan atau berkas internal lain hanya boleh diakses
 *      oleh administrator terotentikasi.
 * 3. Streaming Biner & HTTP Range: Mendukung streaming Web standard tanpa buffering memori penuh, serta
 *    parsial response HTTP 206 untuk kenyamanan dokumen PDF besar.
 * 4. Header Caching: Berkas publik dicache secara efisien, sedangkan berkas privat menggunakan no-store.
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

  // 1. Mencegah Path Traversal dan karakter berbahaya
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

  // 2. Verifikasi prefix folder dalam daftar allowlist
  const folder = key.split("/")[0]?.toLowerCase();
  if (!folder || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: "Akses folder objek ditolak." },
      { status: 403 }
    );
  }

  // 3. Penegakan Otorisasi & Klasifikasi Akses (Public vs Private)
  const auth = await verifyAdminRequest(request);
  const isAdmin = auth.isAuthenticated;
  let isPublicAsset = false;

  if (!isAdmin) {
    isPublicAsset = await isAssetPubliclyPublished(key);

    if (!isPublicAsset) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak: Berkas ini bersifat privat atau belum dipublikasikan.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const rangeHeader = request.headers.get("range") || undefined;
    const object = await getR2ObjectStream(key, { range: rangeHeader });

    if (!object) {
      return NextResponse.json(
        { error: "Berkas tidak ditemukan di Cloudflare R2." },
        { status: 404 }
      );
    }

    // 4. Dukungan conditional GET (HTTP 304 Not Modified)
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && object.eTag && ifNoneMatch === object.eTag) {
      return new NextResponse(null, { status: 304 });
    }

    const filename = key.split("/").pop() || "download";
    const wantsDownload = searchParams.get("download") === "1";

    // 5. Konfigurasi Caching sesuai klasifikasi hak akses
    const cacheControl = isAdmin && !isPublicAsset
      ? "private, no-cache, no-store, must-revalidate"
      : "public, max-age=86400, stale-while-revalidate=604800";

    const headers: Record<string, string> = {
      "Content-Type": object.contentType,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };

    if (object.contentLength !== undefined) {
      headers["Content-Length"] = String(object.contentLength);
    }

    if (object.contentRange) {
      headers["Content-Range"] = object.contentRange;
    }

    if (object.eTag) {
      headers["ETag"] = object.eTag;
    }

    if (wantsDownload) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    }

    return new NextResponse(object.stream, {
      status: object.status,
      headers,
    });
  } catch (err) {
    console.error(
      "[api/r2-file] Gagal mengambil objek R2:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengambil berkas dari storage." },
      { status: 500 }
    );
  }
}
