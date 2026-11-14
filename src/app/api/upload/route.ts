import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { isR2Configured, uploadFileToR2, deleteR2Object, listR2Objects } from "@/lib/r2";
import { isSupabaseConfigured, getServiceRoleClient, getSupabaseClient } from "@/lib/supabase";
import { verifyAdminRequest, verifyCsrfOrigin } from "@/lib/auth-server";
import { getMediaUsageSources, isMediaReferenced } from "@/lib/content/media-catalog";
import { fetchDraftOrPublishedContent, fetchPublishedContent } from "@/lib/content/public-content";
import { sanitizeSvgContent } from "@/lib/svg-sanitizer";
import { normalizeConfig, type SiteConfig } from "@/lib/site-config";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FOLDERS = new Set([
  "uploads",
  "projects",
  "certificates",
  "cv",
  "avatar",
  "profile",
  "lanyard",
  "education",
  "logos",
  "experience",
  "achievements",
  "blog",
  "seo",
  "services",
  "misc",
]);

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "list") {
    const auth = await verifyAdminRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Akses ditolak: Daftar objek storage hanya untuk admin terotentikasi." },
        { status: 401 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json({
        configured: false,
        items: [],
      });
    }

    const prefix = searchParams.get("prefix") || undefined;
    const objects = await listR2Objects(prefix);
    const published = await fetchPublishedContent();
    const draftState = await fetchDraftOrPublishedContent();

    const items = objects.map((obj) => {
      const pubSources = getMediaUsageSources(obj.url, published);
      const draftSources = draftState.isDraft
        ? getMediaUsageSources(obj.url, draftState.config)
        : [];
      const usedIn = Array.from(new Set([...pubSources, ...draftSources]));
      return {
        ...obj,
        isReferenced: usedIn.length > 0,
        usedIn,
      };
    });

    return NextResponse.json({
      configured: true,
      items,
    });
  }

  return NextResponse.json({
    r2: isR2Configured(),
    supabase: isSupabaseConfigured(),
    maxSizeMb: 10,
    allowedTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
    ],
    svgSupported: true,
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
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer<ArrayBufferLike> = Buffer.from(arrayBuffer);
    let verifiedType: { ext: string; mime: string } | null = null;

    const looksLikeSvg =
      declaredType === "image/svg+xml" ||
      file.name.toLowerCase().endsWith(".svg") ||
      buffer.subarray(0, 256).toString("utf8").trimStart().toLowerCase().startsWith("<svg") ||
      buffer.subarray(0, 256).toString("utf8").toLowerCase().includes("<svg");

    if (looksLikeSvg && !detectSafeFileType(buffer)) {
      const svgResult = sanitizeSvgContent(buffer.toString("utf8"));
      if (!svgResult.ok) {
        return NextResponse.json(
          { error: svgResult.error },
          { status: 400 }
        );
      }
      buffer = Buffer.from(svgResult.sanitized, "utf8");
      verifiedType = { ext: "svg", mime: "image/svg+xml" };
    } else {
      verifiedType = detectSafeFileType(buffer);
    }

    if (!verifiedType) {
      return NextResponse.json(
        {
          error:
            "Format berkas tidak valid atau tidak diizinkan. Sistem hanya menerima berkas PNG, JPEG, WebP, GIF, SVG aman, dan PDF terverifikasi.",
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
          contentType: verifiedType.mime,
        });
      } catch (err) {
        console.error(
          "[api/upload] Gagal menyimpan berkas ke Cloudflare R2:",
          err instanceof Error ? err.message : "Unknown error"
        );
        return NextResponse.json(
          { error: "Gagal menyimpan berkas ke Cloudflare R2. Periksa konfigurasi storage server." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Storage Cloudflare R2 belum dikonfigurasi di server environment. Unggah berkas ditolak.",
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses unggah berkas" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Permintaan lintas domain ditolak" }, { status: 403 });
  }

  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Akses ditolak: Operasi hapus hanya untuk admin." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const keyOrUrl = body?.key || body?.url;

    if (!keyOrUrl || typeof keyOrUrl !== "string") {
      return NextResponse.json({ error: "Parameter key atau url diperlukan" }, { status: 400 });
    }

    // Periksa keterikatan di published content maupun draft content
    const publishedConfig = await fetchPublishedContent();
    const draftState = await fetchDraftOrPublishedContent();

    const pubSources = getMediaUsageSources(keyOrUrl, publishedConfig);
    const draftSources = draftState.isDraft
      ? getMediaUsageSources(keyOrUrl, draftState.config)
      : [];
    const usedIn = Array.from(new Set([...pubSources, ...draftSources]));

    if (
      usedIn.length > 0 ||
      isMediaReferenced(keyOrUrl, publishedConfig) ||
      (draftState.isDraft && isMediaReferenced(keyOrUrl, draftState.config))
    ) {
      return NextResponse.json(
        {
          error:
            usedIn.length > 0
              ? `Berkas tidak dapat dihapus karena masih digunakan di: ${usedIn.join(", ")}.`
              : "Berkas tidak dapat dihapus karena masih digunakan di dalam portofolio aktif.",
          usedIn,
        },
        { status: 400 }
      );
    }

    // Fallback additional raw check against Supabase current row directly if configured
    const supabase = getServiceRoleClient() || getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_config")
        .select("config")
        .eq("id", "current")
        .maybeSingle();

      if (data?.config) {
        const activeConfig = normalizeConfig(data.config as Partial<SiteConfig>);
        if (isMediaReferenced(keyOrUrl, activeConfig)) {
          return NextResponse.json(
            { error: "Berkas tidak dapat dihapus karena masih digunakan di konfigurasi cloud aktif." },
            { status: 400 }
          );
        }
      }
    }

    const deleted = await deleteR2Object(keyOrUrl);
    if (!deleted) {
      return NextResponse.json({ error: "Gagal menghapus berkas dari Cloudflare R2." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Berkas berhasil dihapus dari Cloudflare R2." });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses penghapusan berkas" }, { status: 500 });
  }
}
