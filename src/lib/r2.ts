import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { defaultCvDocs } from "@/lib/site-config";
import { extractR2Key } from "@/lib/content/r2-key";

export { extractR2Key };

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = (process.env.R2_BUCKET_NAME || "portofolio-zekk").trim();
  let publicDomain = (process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_URL || "")
    .trim()
    .replace(/\/$/, "");

  if (publicDomain && !/^https?:\/\//i.test(publicDomain)) {
    publicDomain = `https://${publicDomain}`;
  }

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain,
  };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const config = getR2Config();
  if (!config) {
    throw new Error(
      "Cloudflare R2 belum dikonfigurasi. Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_BUCKET_NAME terisi di server environment."
    );
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * Ekstraksi object key R2 dari berbagai format URL atau path:
 * 1. Key mentah: "projects/123-image.webp"
 * 2. URL proxy backend: "/api/r2-file?key=projects%2F123-image.webp"
 * 3. URL domain publik: "https://pub-xxx.r2.dev/projects/123-image.webp"
 */
/**
 * Menghasilkan Presigned URL S3 untuk akses aman ke objek privat R2.
 */
export async function createPresignedUrl(
  keyOrUrl: string,
  options?: {
    expiresIn?: number;
    contentType?: string;
    downloadFilename?: string;
  }
): Promise<string | null> {
  const config = getR2Config();
  if (!config) return null;

  const key = extractR2Key(keyOrUrl, config.bucketName);
  if (!key) return null;

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
    ...(options?.downloadFilename
      ? { ResponseContentDisposition: `inline; filename="${options.downloadFilename}"` }
      : {}),
  });

  return getSignedUrl(client, command, { expiresIn: options?.expiresIn ?? 900 });
}

/**
 * Presigned URL khusus dokumen CV PDF (kedaluwarsa singkat: 15 menit).
 */
export async function createPresignedCvUrl(
  keyOrUrl: string,
  filename = "CV-ATS-ZakariaMP-2025.pdf",
  expiresIn = 900 // 15 menit
): Promise<string | null> {
  return createPresignedUrl(keyOrUrl, {
    expiresIn,
    contentType: "application/pdf",
    downloadFilename: filename,
  });
}

export interface R2ObjectStreamResult {
  stream: ReadableStream;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  eTag?: string;
  lastModified?: Date;
  status: number;
}

/**
 * Mengambil objek dari R2 secara efisien menggunakan Web ReadableStream.
 * Mendukung HTTP Range requests (RFC 7233) untuk streaming dokumen PDF besar tanpa buffering ke memori.
 */
export async function getR2ObjectStream(
  keyOrUrl: string,
  options?: {
    range?: string;
  }
): Promise<R2ObjectStreamResult | null> {
  const config = getR2Config();
  if (!config) return null;

  const key = extractR2Key(keyOrUrl, config.bucketName);
  if (!key) return null;

  const client = getR2Client();
  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ...(options?.range ? { Range: options.range } : {}),
      })
    );

    if (!res.Body) return null;

    // transformToWebStream() menghasilkan Web standard ReadableStream native
    const stream = res.Body.transformToWebStream();

    return {
      stream,
      contentType: res.ContentType || "application/octet-stream",
      contentLength: res.ContentLength,
      contentRange: res.ContentRange,
      eTag: res.ETag,
      lastModified: res.LastModified,
      status: res.$metadata.httpStatusCode || (options?.range ? 206 : 200),
    };
  } catch (err: unknown) {
    const s3Err = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (s3Err.name === "NoSuchKey" || s3Err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Mengambil seluruh byte objek (kompatibilitas mundur & utilitas pengujian).
 */
export async function getR2Object(keyOrUrl: string): Promise<{
  body: Uint8Array;
  contentType: string;
} | null> {
  const config = getR2Config();
  if (!config) return null;

  const key = extractR2Key(keyOrUrl, config.bucketName);
  if (!key) return null;

  const client = getR2Client();
  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );

    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return {
      body: bytes,
      contentType: res.ContentType || "application/octet-stream",
    };
  } catch (err: unknown) {
    const s3Err = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (s3Err.name === "NoSuchKey" || s3Err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Menentukan apakah suatu R2 key diizinkan diakses secara publik:
 * Hanya objek yang direferensikan oleh konfigurasi terpublikasi (`current`)
 * atau allowlist dokumen CV aktif. Draf yang belum dipublikasikan ditolak (`false`).
 */
export async function isAssetPubliclyPublished(key: string): Promise<boolean> {
  if (!key || typeof key !== "string") return false;

  const parts = key.split("/");
  const folder = parts[0]?.toLowerCase();
  if (!folder) return false;

  try {
    const publishedConfig = await fetchPublishedContent();
    const configJson = JSON.stringify(publishedConfig);
    if (configJson.includes(key) || configJson.includes(encodeURIComponent(key))) {
      return true;
    }
  } catch {
    // Fallback check below
  }

  if (folder === "cv") {
    const filename = parts.slice(1).join("/").toLowerCase();
    if (
      filename.includes("cv-ats") ||
      filename.includes("cv-uiux") ||
      filename.includes("cv-frontend") ||
      filename.includes("cv-graphic") ||
      filename.includes("cv-itsupport") ||
      filename.includes("zakariamp") ||
      defaultCvDocs.some((d) => d.pdfUrl?.toLowerCase().includes(filename))
    ) {
      return true;
    }
  }

  return false;
}

export interface R2StoredObjectInfo {
  key: string;
  url: string;
  folder: string;
  size: number;
  lastModified?: string;
}

/**
 * Mencantumkan daftar objek yang tersimpan di bucket Cloudflare R2 (khusus admin terotentikasi).
 */
export async function listR2Objects(
  prefix?: string,
  maxKeys = 250
): Promise<R2StoredObjectInfo[]> {
  const config = getR2Config();
  if (!config) return [];

  const client = getR2Client();
  try {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix || undefined,
        MaxKeys: maxKeys,
      })
    );

    const contents = response.Contents || [];
    return contents
      .filter((item): item is typeof item & { Key: string } => Boolean(item.Key))
      .map((item) => {
        const key = item.Key;
        const folder = key.split("/")[0] || "misc";
        const url = config.publicDomain
          ? `${config.publicDomain}/${key}`
          : `/api/r2-file?key=${encodeURIComponent(key)}`;
        return {
          key,
          url,
          folder,
          size: item.Size ?? 0,
          lastModified: item.LastModified?.toISOString(),
        };
      })
      .sort((a, b) =>
        (b.lastModified || "").localeCompare(a.lastModified || "")
      );
  } catch {
    return [];
  }
}

/**
 * Menyimpan berkas biner ke Cloudflare R2 dengan object key unik.
 */
export async function uploadFileToR2({
  buffer,
  filename,
  contentType,
  folder = "uploads",
}: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<{ url: string; key: string }> {
  const config = getR2Config();
  if (!config) {
    throw new Error("Cloudflare R2 credentials tidak lengkap");
  }

  const client = getR2Client();
  const sanitizedFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
  const uniqueKey = `${folder}/${Date.now()}-${sanitizedFilename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: uniqueKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = config.publicDomain
    ? `${config.publicDomain}/${uniqueKey}`
    : `/api/r2-file?key=${encodeURIComponent(uniqueKey)}`;

  return { url, key: uniqueKey };
}

/**
 * Menghapus berkas dari Cloudflare R2 secara aman.
 */
export async function deleteR2Object(keyOrUrl: string): Promise<boolean> {
  const config = getR2Config();
  if (!config) return false;

  const key = extractR2Key(keyOrUrl, config.bucketName);
  if (!key) return false;

  const client = getR2Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export interface R2DiagnosticResult {
  ok: boolean;
  configured: boolean;
  status:
    | "connected"
    | "missing_credentials"
    | "permission_error"
    | "bucket_not_found"
    | "network_error";
  bucket: string;
  publicDomainConfigured: boolean;
  mode: "custom_domain" | "private_proxy";
  latencyMs?: number;
  missingVariables?: string[];
  message: string;
  checkedAt: string;
}

/**
 * Menjalankan uji diagnostik non-destruktif terhadap Cloudflare R2.
 * Memeriksa kelengkapan konfigurasi dan konektivitas bucket menggunakan HeadBucketCommand.
 * Tidak membocorkan secrets atau menampilkan daftar objek secara publik.
 */
export async function runR2Diagnostics(): Promise<R2DiagnosticResult> {
  const missing: string[] = [];
  if (!process.env.R2_ACCOUNT_ID?.trim()) missing.push("R2_ACCOUNT_ID");
  if (!process.env.R2_ACCESS_KEY_ID?.trim()) missing.push("R2_ACCESS_KEY_ID");
  if (!process.env.R2_SECRET_ACCESS_KEY?.trim()) missing.push("R2_SECRET_ACCESS_KEY");
  if (!process.env.R2_BUCKET_NAME?.trim()) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    return {
      ok: false,
      configured: false,
      status: "missing_credentials",
      bucket: process.env.R2_BUCKET_NAME?.trim() || "portofolio-zekk",
      publicDomainConfigured: Boolean(process.env.R2_PUBLIC_DOMAIN?.trim()),
      mode: process.env.R2_PUBLIC_DOMAIN?.trim() ? "custom_domain" : "private_proxy",
      missingVariables: missing,
      message: `Environment variables Cloudflare R2 belum lengkap: ${missing.join(", ")}`,
      checkedAt: new Date().toISOString(),
    };
  }

  const config = getR2Config();
  if (!config) {
    return {
      ok: false,
      configured: false,
      status: "missing_credentials",
      bucket: "portofolio-zekk",
      publicDomainConfigured: false,
      mode: "private_proxy",
      message: "Konfigurasi R2 tidak dapat dibaca dari server environment",
      checkedAt: new Date().toISOString(),
    };
  }

  const startTime = Date.now();
  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    const latencyMs = Date.now() - startTime;

    return {
      ok: true,
      configured: true,
      status: "connected",
      bucket: config.bucketName,
      publicDomainConfigured: Boolean(config.publicDomain),
      mode: config.publicDomain ? "custom_domain" : "private_proxy",
      latencyMs,
      message: `Terhubung sukses ke bucket '${config.bucketName}' (${latencyMs}ms)`,
      checkedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorObj = err as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
      message?: string;
    };
    const statusCode = errorObj.$metadata?.httpStatusCode;

    let status: R2DiagnosticResult["status"] = "network_error";
    let message = "Gagal terhubung ke endpoint Cloudflare R2";

    if (
      statusCode === 403 ||
      errorObj.name === "AccessDenied" ||
      errorObj.name === "SignatureDoesNotMatch"
    ) {
      status = "permission_error";
      message =
        "Koneksi ditolak: Kredensial S3 tidak memiliki izin (AccessDenied/SignatureMismatch)";
    } else if (
      statusCode === 404 ||
      errorObj.name === "NotFound" ||
      errorObj.name === "NoSuchBucket"
    ) {
      status = "bucket_not_found";
      message = `Bucket '${config.bucketName}' tidak ditemukan di akun Cloudflare`;
    }

    return {
      ok: false,
      configured: true,
      status,
      bucket: config.bucketName,
      publicDomainConfigured: Boolean(config.publicDomain),
      mode: config.publicDomain ? "custom_domain" : "private_proxy",
      latencyMs,
      message,
      checkedAt: new Date().toISOString(),
    };
  }
}
