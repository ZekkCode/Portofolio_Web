import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createServerClient } from "@supabase/ssr";
import { defaultCvDocs, normalizeConfig, type CvDocConfig } from "@/lib/site-config";
import { createPresignedUrl, isR2Configured, getR2Config, extractR2Key } from "@/lib/r2";

export const dynamic = "force-dynamic";

// Allowlist nama berkas PDF/aset CV lokal yang sah
const ALLOWED_LOCAL_FILES = new Set([
  "cv-ats-zakariamp-2025.pdf",
  "cv-page-1.png",
  "cv-page-2.png",
  "cv-page-3.png",
  "cv-page-4.png",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range, Authorization",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Disposition",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Validasi path filesystem lokal secara ketat:
 * 1. Mencegah Path Traversal (../, absolute paths, null bytes)
 * 2. Memastikan berkas hanya berada di dalam folder public/
 * 3. Memeriksa ekstensi dan nama berkas dalam allowlist
 */
async function resolveSafeLocalFile(inputPath: string): Promise<{ fullPath: string; ext: string; filename: string } | null> {
  if (!inputPath || typeof inputPath !== "string") return null;

  // Hapus query params atau hash jika ada
  const clean = inputPath.split("?")[0].split("#")[0].replace(/\0/g, "").trim();
  const normalized = path.normalize(clean).replace(/^([a-zA-Z]:)?[/\\]+/, "");

  const publicDir = path.resolve(process.cwd(), "public");
  const fullPath = path.resolve(publicDir, normalized);

  // Verifikasi path relatif tidak melompat keluar dari publicDir
  const rel = path.relative(publicDir, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }

  const filename = path.basename(fullPath);
  const ext = path.extname(fullPath).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return null;
  }

  // Jika nama berkas ada di allowlist langsung diizinkan
  if (ALLOWED_LOCAL_FILES.has(filename.toLowerCase())) {
    try {
      const s = await stat(fullPath);
      if (s.isFile()) return { fullPath, ext, filename };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validasi URL Cloudflare R2 yang terdaftar di konfigurasi.
 */
function isAllowedR2Url(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Path internal R2 key atau rute proxy backend
  if (url.startsWith("cv/") || url.startsWith("/api/r2-file")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    // Izinkan custom public domain R2 yang terkonfigurasi di env
    const r2Cfg = getR2Config();
    if (r2Cfg?.publicDomain) {
      const allowedHost = new URL(r2Cfg.publicDomain).hostname.toLowerCase();
      if (parsed.hostname.toLowerCase() === allowedHost) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Membaca konfigurasi cvDocs dari Supabase atau fallback lokal.
 * Standarisasi: Query ID "current" terlebih dahulu, lalu fallback ke "main".
 */
async function getStoredCvDoc(identifier?: string | null): Promise<CvDocConfig> {
  let cvDocs: CvDocConfig[] = defaultCvDocs;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      });

      // 1. Coba baca ID "current"
      let { data } = await supabase
        .from("site_config")
        .select("config")
        .eq("id", "current")
        .maybeSingle();

      // 2. Fallback baca ID "main" jika "current" belum ada
      if (!data?.config) {
        const { data: mainData } = await supabase
          .from("site_config")
          .select("config")
          .eq("id", "main")
          .maybeSingle();
        data = mainData;
      }

      if (data?.config) {
        const normalized = normalizeConfig(data.config);
        if (normalized.cvDocs && normalized.cvDocs.length > 0) {
          cvDocs = normalized.cvDocs;
        }
      }
    } catch {
      // Fallback ke defaultCvDocs jika Supabase offline/belum diset
    }
  }

  if (identifier) {
    const cleanId = identifier.toLowerCase().trim();
    const match = cvDocs.find((d) => d.roleKey === cleanId || d.id === cleanId);
    if (match) return match;
  }

  return cvDocs[0];
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function HEAD(request: NextRequest) {
  const getRes = await GET(request);
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

/**
 * Endpoint Terverifikasi Pengambilan CV
 * 
 * Keamanan Ketat:
 * 1. Tidak menerima parameter 'url' sembarang dari user untuk mencegah Open Redirect / Arbitrary Presigning.
 * 2. Hanya menerima identifier dokumen terverifikasi ('role' atau 'docId') yang dipetakan oleh server.
 * 3. Presigned URL menggunakan kedaluwarsa singkat (900 detik / 15 menit).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Hanya baca identifier terotorisasi ('role' atau 'docId' / 'id')
  const identifier = searchParams.get("role") || searchParams.get("docId") || searchParams.get("id");
  const wantsDownload = searchParams.get("download") === "1";
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    searchParams.get("format") === "json";

  // Resolusi dokumen hanya melalui konfigurasi server terpercaya
  const doc = await getStoredCvDoc(identifier);
  const targetPdf = (doc?.pdfUrl || "/cv-ats-zakariamp-2025.pdf").trim();
  const safeFilename = doc?.title
    ? `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
    : "CV-ATS-ZakariaMP-2025.pdf";

  // 1. Jika dokumen berada di Cloudflare R2
  if (isAllowedR2Url(targetPdf) && isR2Configured()) {
    try {
      const config = getR2Config();
      const key = extractR2Key(targetPdf, config?.bucketName);

      // Buat presigned URL dengan kedaluwarsa singkat (15 menit)
      const signedUrl = await createPresignedUrl(key, {
        expiresIn: 900,
        contentType: "application/pdf",
        downloadFilename: wantsDownload ? safeFilename : undefined,
      });

      if (signedUrl) {
        if (wantsJson) {
          return NextResponse.json(
            { url: signedUrl, filename: safeFilename },
            { headers: CORS_HEADERS }
          );
        }
        return NextResponse.redirect(signedUrl, 302);
      }
    } catch (err) {
      console.error("[api/cv-pdf] Gagal membuat presigned R2 URL:", err);
    }
  }

  // 2. Jika dokumen adalah rute proxy backend internal
  if (targetPdf.startsWith("/api/r2-file")) {
    const proxyUrl = wantsDownload ? `${targetPdf}&download=1` : targetPdf;
    if (wantsJson) {
      return NextResponse.json(
        { url: proxyUrl, filename: safeFilename },
        { headers: CORS_HEADERS }
      );
    }
    return NextResponse.redirect(new URL(proxyUrl, request.url).toString(), 302);
  }

  // 3. Fallback menyajikan berkas PDF lokal yang divalidasi secara aman
  const safeFile = await resolveSafeLocalFile(targetPdf);
  if (!safeFile) {
    // Fallback darurat ke berkas default ATS jika targetPdf tidak lolos
    const defaultFile = await resolveSafeLocalFile("cv-ats-zakariamp-2025.pdf");
    if (!defaultFile) {
      return NextResponse.json(
        { error: "Berkas PDF CV tidak ditemukan." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    try {
      const fileBuffer = await readFile(/*turbopackIgnore: true*/ defaultFile.fullPath);
      if (wantsJson) {
        return NextResponse.json(
          { url: "/cv-ats-zakariamp-2025.pdf", filename: "CV-ATS-ZakariaMP-2025.pdf" },
          { headers: CORS_HEADERS }
        );
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/pdf",
          "Content-Disposition": wantsDownload
            ? 'attachment; filename="CV-ATS-ZakariaMP-2025.pdf"'
            : 'inline; filename="CV-ATS-ZakariaMP-2025.pdf"',
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Gagal membaca berkas CV." },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  try {
    const fileBuffer = await readFile(/*turbopackIgnore: true*/ safeFile.fullPath);
    const contentType = safeFile.ext === ".pdf" ? "application/pdf" : `image/${safeFile.ext.replace(".", "")}`;

    if (wantsJson) {
      return NextResponse.json(
        { url: `/${safeFile.filename}`, filename: safeFile.filename },
        { headers: CORS_HEADERS }
      );
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Content-Disposition": wantsDownload
          ? `attachment; filename="${safeFile.filename}"`
          : `inline; filename="${safeFile.filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[api/cv-pdf] Gagal membaca berkas lokal:", err);
    return NextResponse.json(
      { error: "Berkas PDF CV tidak ditemukan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }
}
