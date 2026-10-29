import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { isR2Configured, uploadFileToR2 } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FOLDERS = new Set(["uploads", "projects", "certificates", "cv", "avatar", "lanyard"]);

/**
 * Validasi Magic Number / File Signature biner.
 * Jangan pernah percaya file.type atau ekstensi semata.
 */
function detectSafeFileType(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }

  // WebP: 52 49 46 46 (RIFF) .... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { ext: "gif", mime: "image/gif" };
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { ext: "pdf", mime: "application/pdf" };
  }

  return null;
}

export async function GET() {
  return NextResponse.json({
    r2: isR2Configured(),
    supabase: isSupabaseConfigured(),
    maxSizeMb: 10,
    allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
    svgSupported: false, // SVG ditolak demi mencegah serangan script XSS tersimpan
  });
}

export async function POST(request: Request) {
  // 1. Validasi CSRF / Origin
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Permintaan lintas domain (Cross-Origin) ditolak" },
      { status: 403 }
    );
  }

  // 2. Wajib Autentikasi Admin SEBELUM memproses atau membaca body besar
  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { error: "Akses ditolak: Operasi unggah hanya diizinkan untuk administrator terotentikasi." },
      { status: 401 }
    );
  }

  // 3. Batasi ukuran permintaan berdasarkan header awal sebelum parsing penuh
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Ukuran permintaan melebihi batas maksimum 10 MB" },
      { status: 413 }
    );
  }

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

    const declaredType = (file.type || "").toLowerCase().trim();
    if (declaredType === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      return NextResponse.json(
        {
          error:
            "Format SVG ditolak demi pencegahan keamanan XSS. Harap gunakan format gambar raster (WebP, PNG, JPEG) atau dokumen PDF.",
        },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Verifikasi signature berkas (Magic Number) nyata
    const verifiedType = detectSafeFileType(buffer);
    if (!verifiedType) {
      return NextResponse.json(
        {
          error:
            "Format berkas tidak valid atau tidak diizinkan. Sistem hanya menerima berkas asli PNG, JPEG, WebP, GIF, dan PDF terverifikasi.",
        },
        { status: 415 }
      );
    }

    // 5. Nama objek acak kriptografis (Random UUID) dan pembatasan folder
    const uniqueId = crypto.randomUUID();

    if (isR2Configured()) {
      try {
        const result = await uploadFileToR2({
          buffer,
          filename: `${uniqueId}.${verifiedType.ext}`,
          contentType: verifiedType.mime,
          folder,
        });

        return NextResponse.json({
          success: true,
          url: result.url,
          key: result.key,
          provider: "r2",
        });
      } catch {
        // Jangan pernah menampilkan internal error stack trace atau AWS detail ke client
        return NextResponse.json(
          { error: "Gagal menyimpan berkas ke Cloudflare R2. Periksa konfigurasi storage server." },
          { status: 500 }
        );
      }
    }

    // Fallback mode jika R2 belum dikonfigurasi di server
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${verifiedType.mime};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      provider: "fallback-data-uri",
      warning: "Storage cloud belum dikonfigurasi. Berkas disimpan sementara sebagai data URI.",
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses unggah berkas" },
      { status: 500 }
    );
  }
}
