import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { verifyAdminRequest } from "@/lib/auth-server";
import {
  DEFAULT_COMBINED_CV_PDF_URL,
  isDefaultCombinedCvPdfUrl,
  isSafeCvAssetUrl,
  resolveCvDocumentInfo,
  sanitizeCvDownloadFilename,
} from "@/lib/content/cv-documents";
import {
  fetchDraftOrPublishedContent,
  fetchPublishedContent,
} from "@/lib/content/public-content";
import {
  createPresignedUrl,
  extractR2Key,
  getR2Config,
  getR2ObjectStream,
  isR2Configured,
  r2ObjectExists,
} from "@/lib/r2";
import {
  defaultCvDocs,
  type CvDocConfig,
  type CvSettingsConfig,
} from "@/lib/site-config";

export const dynamic = "force-dynamic";

// Allowlist berkas CV bawaan yang ada di /public
const ALLOWED_LOCAL_FILES = new Set([
  "cv-ats-zakariamp-2025.pdf",
  "cv-page-1.png",
  "cv-page-2.png",
  "cv-page-3.png",
  "cv-page-4.png",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

const NO_STORE_CACHE = "private, no-store, max-age=0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range, Authorization",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Disposition",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": NO_STORE_CACHE,
};

function normalizeRelativePublicPath(inputPath: string): string {
  const clean = inputPath.split("?")[0].split("#")[0].replace(/\0/g, "").trim();
  return clean.replace(/^([a-zA-Z]:)?[/\\]+/, "").replace(/\\/g, "/");
}

/**
 * Validasi path filesystem lokal secara ketat:
 * 1. Mencegah Path Traversal (../, absolute paths, null bytes)
 * 2. Memastikan berkas hanya berada di dalam folder public/
 * 3. Mengizinkan berkas bawaan allowlist ATAU path PDF lokal yang memang terdaftar pada CV terpublikasi
 */
async function resolveSafeLocalFile(
  inputPath: string,
  allowedConfiguredPaths: Set<string>
): Promise<{
  fullPath: string;
  ext: string;
  filename: string;
  relativeUrlPath: string;
} | null> {
  if (!inputPath || typeof inputPath !== "string") return null;

  const clean = inputPath.split("?")[0].split("#")[0].replace(/\0/g, "").trim();
  if (!clean || clean.startsWith("//")) return null;

  const normalized = path.normalize(clean).replace(/^([a-zA-Z]:)?[/\\]+/, "");
  if (!normalized || normalized.startsWith("..")) return null;

  const publicDir = path.resolve(process.cwd(), "public");
  const fullPath = path.resolve(publicDir, normalized);

  const rel = path.relative(publicDir, fullPath);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }

  const filename = path.basename(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const relPosix = rel.replace(/\\/g, "/");

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return null;
  }

  const isStaticAllowed = ALLOWED_LOCAL_FILES.has(filename.toLowerCase());
  const isConfigAllowed =
    ext === ".pdf" && allowedConfiguredPaths.has(relPosix.toLowerCase());

  if (!isStaticAllowed && !isConfigAllowed) {
    return null;
  }

  try {
    const s = await stat(fullPath);
    if (s.isFile()) {
      return {
        fullPath,
        ext,
        filename,
        relativeUrlPath: relPosix,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Validasi URL Cloudflare R2 yang terdaftar di konfigurasi.
 */
function isAllowedR2Url(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  if (
    url.startsWith("cv/") ||
    url.startsWith("/api/r2-file") ||
    url.startsWith("r2://")
  ) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

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

async function getStoredCvState(
  identifier: string | null,
  includeDrafts: boolean
): Promise<{
  doc: CvDocConfig;
  pool: CvDocConfig[];
  cvSettings?: CvSettingsConfig;
} | null> {
  const config = includeDrafts
    ? (await fetchDraftOrPublishedContent()).config
    : await fetchPublishedContent();

  const sourceDocs = Array.isArray(config.cvDocs) ? config.cvDocs : defaultCvDocs;
  const pool = includeDrafts
    ? sourceDocs
    : sourceDocs.filter((d) => d.published !== false && d.visible !== false);

  if (pool.length === 0) {
    return null;
  }

  const cleanId = identifier ? identifier.toLowerCase().trim() : "";
  if (cleanId && cleanId !== "all" && cleanId !== "combined") {
    const match = pool.find(
      (d) =>
        d.roleKey.toLowerCase() === cleanId || d.id.toLowerCase() === cleanId
    );
    if (!match) {
      return null;
    }
    return { doc: match, pool, cvSettings: config.cvSettings };
  }

  const primary =
    pool.find((d) => Boolean(typeof d.pdfUrl === "string" && d.pdfUrl.trim())) ||
    pool[0];

  return { doc: primary, pool, cvSettings: config.cvSettings };
}

function decodeBase64Pdf(dataUri: string): Buffer | null {
  const commaIdx = dataUri.indexOf(",");
  if (commaIdx < 0) return null;
  const base64Part = dataUri.slice(commaIdx + 1).trim();
  if (!base64Part) return null;
  try {
    const buf = Buffer.from(base64Part, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function HEAD(request: NextRequest) {
  const getRes = await GET(request);
  try {
    await getRes.body?.cancel();
  } catch {
    // Abaikan kegagalan membatalkan stream respons HEAD
  }
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier =
    searchParams.get("role") || searchParams.get("docId") || searchParams.get("id");
  const wantsDownload = searchParams.get("download") === "1";
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    searchParams.get("format") === "json";

  let includeDrafts = false;
  if (searchParams.get("includeDrafts") === "1") {
    const auth = await verifyAdminRequest(request);
    includeDrafts = auth.isAuthenticated;
  }

  const stored = await getStoredCvState(identifier, includeDrafts);
  if (!stored) {
    return NextResponse.json(
      { error: "Dokumen CV untuk peran yang diminta tidak ditemukan atau belum dipublikasikan." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const { doc, pool, cvSettings } = stored;

  // Tegakkan izin unduh global maupun per dokumen
  const permissionAllowed =
    includeDrafts ||
    (cvSettings?.allowDownload !== false && doc?.allowDownload !== false);
  if (wantsDownload && !permissionAllowed) {
    return NextResponse.json(
      { error: "Unduhan dokumen CV saat ini dinonaktifkan oleh administrator." },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  const resolved = resolveCvDocumentInfo(doc, pool, cvSettings);
  if (!resolved.hasPdf) {
    return NextResponse.json(
      { error: "Berkas PDF CV untuk peran ini belum tersedia." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const targetPdf = resolved.pdfUrl;
  const safeFilename = sanitizeCvDownloadFilename(resolved.downloadFilename);
  const disposition = wantsDownload ? "attachment" : "inline";

  // 1. Data URI PDF base64 (mis. unggahan fallback lokal tanpa R2)
  if (targetPdf.toLowerCase().startsWith("data:application/pdf")) {
    const pdfBuffer = decodeBase64Pdf(targetPdf);
    if (!pdfBuffer) {
      return NextResponse.json(
        { error: "Berkas PDF CV tidak valid atau rusak." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (wantsJson) {
      return NextResponse.json(
        {
          url: `/api/cv-pdf?role=${encodeURIComponent(doc.roleKey)}${
            wantsDownload ? "&download=1" : ""
          }`,
          filename: safeFilename,
        },
        { headers: CORS_HEADERS }
      );
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Content-Security-Policy":
          "default-src 'none'; object-src 'self'; frame-ancestors 'self'",
      },
    });
  }

  // 2. Dokumen pada Cloudflare R2
  if (isAllowedR2Url(targetPdf) && isR2Configured()) {
    try {
      const r2Config = getR2Config();
      const key = extractR2Key(targetPdf, r2Config?.bucketName);

      if (!key) {
        return NextResponse.json(
          { error: "Referensi berkas PDF di penyimpanan R2 tidak valid." },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const exists = await r2ObjectExists(key);
      if (!exists) {
        return NextResponse.json(
          { error: "Berkas PDF CV tidak ditemukan di penyimpanan R2." },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      if (wantsJson) {
        const signedUrl = await createPresignedUrl(key, {
          expiresIn: 900,
          contentType: "application/pdf",
          downloadFilename: safeFilename,
          disposition,
        });
        if (signedUrl) {
          return NextResponse.json(
            { url: signedUrl, filename: safeFilename },
            { headers: CORS_HEADERS }
          );
        }
      }

      const rangeHeader = request.headers.get("range") || undefined;
      const object = await getR2ObjectStream(key, { range: rangeHeader });
      if (!object) {
        return NextResponse.json(
          { error: "Berkas PDF CV tidak ditemukan di penyimpanan R2." },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const streamHeaders: Record<string, string> = {
        ...CORS_HEADERS,
        "Content-Type": object.contentType || "application/pdf",
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "Accept-Ranges": "bytes",
        "Content-Security-Policy":
          "default-src 'none'; object-src 'self'; frame-ancestors 'self'",
      };
      if (object.contentLength !== undefined) {
        streamHeaders["Content-Length"] = String(object.contentLength);
      }
      if (object.contentRange) {
        streamHeaders["Content-Range"] = object.contentRange;
      }
      if (object.eTag) {
        streamHeaders["ETag"] = object.eTag;
      }

      return new NextResponse(object.stream, {
        status: object.status,
        headers: streamHeaders,
      });
    } catch (err) {
      console.error("[api/cv-pdf] Gagal mengambil berkas dari R2:", err);
      return NextResponse.json(
        { error: "Gagal mengakses berkas PDF CV dari penyimpanan." },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  // 3. Rute proxy R2 ketika R2 tidak terkonfigurasi -> jujur kembalikan 404
  if (targetPdf.startsWith("/api/r2-file") || targetPdf.startsWith("r2://") || targetPdf.startsWith("cv/")) {
    return NextResponse.json(
      { error: "Berkas PDF CV berada di R2, tetapi penyimpanan objek belum aktif." },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // 4. Berkas lokal di bawah public/
  const isLocalCandidate =
    targetPdf.startsWith("/") || isDefaultCombinedCvPdfUrl(targetPdf);
  if (isLocalCandidate) {
    const allowedConfiguredPaths = new Set<string>([
      normalizeRelativePublicPath(targetPdf).toLowerCase(),
    ]);
    const safeFile = await resolveSafeLocalFile(targetPdf, allowedConfiguredPaths);

    if (!safeFile) {
      return NextResponse.json(
        { error: "Berkas PDF CV yang dirujuk tidak ditemukan di server." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    try {
      const fileBuffer = await readFile(/*turbopackIgnore: true*/ safeFile.fullPath);
      const contentType =
        safeFile.ext === ".pdf"
          ? "application/pdf"
          : `image/${safeFile.ext.replace(".", "")}`;

      if (wantsJson) {
        return NextResponse.json(
          { url: `/${safeFile.relativeUrlPath}`, filename: safeFilename },
          { headers: CORS_HEADERS }
        );
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": contentType,
          "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
          "Content-Length": String(fileBuffer.length),
          "Content-Security-Policy":
            "default-src 'none'; object-src 'self'; frame-ancestors 'self'",
        },
      });
    } catch (err) {
      console.error("[api/cv-pdf] Gagal membaca berkas lokal:", err);
      return NextResponse.json(
        { error: "Berkas PDF CV tidak dapat dibaca." },
        { status: 404, headers: CORS_HEADERS }
      );
    }
  }

  // 5. URL eksternal aman (https:// / http://)
  if (isSafeCvAssetUrl(targetPdf, { allowDataPdf: false })) {
    if (wantsJson) {
      return NextResponse.json(
        { url: targetPdf, filename: safeFilename },
        { headers: CORS_HEADERS }
      );
    }
    return NextResponse.redirect(targetPdf, 302);
  }

  return NextResponse.json(
    { error: "Berkas PDF CV tidak valid atau tidak tersedia." },
    { status: 404, headers: CORS_HEADERS }
  );
}

export { DEFAULT_COMBINED_CV_PDF_URL };
