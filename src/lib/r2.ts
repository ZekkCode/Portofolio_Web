import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
export function extractR2Key(keyOrUrl: string, bucketName?: string): string {
  if (!keyOrUrl) return "";
  let path = keyOrUrl.trim();

  // 1. Cek format URL proxy lokal
  if (path.startsWith("/api/r2-file")) {
    try {
      const u = new URL(path, "http://localhost");
      if (u.searchParams.has("key")) {
        return u.searchParams.get("key") || "";
      }
    } catch {
      // fallback
    }
  }

  // 2. Cek format absolute HTTP(S) URL
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      if (u.pathname === "/api/r2-file" && u.searchParams.has("key")) {
        return u.searchParams.get("key") || "";
      }
      path = u.pathname;
    } catch {
      // fallback
    }
  }

  // 3. Bersihkan leading slash dan bucket name
  path = path.replace(/^\/+/, "");
  if (bucketName && path.startsWith(`${bucketName}/`)) {
    path = path.slice(bucketName.length + 1);
  }
  return path;
}

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

  return getSignedUrl(client, command, { expiresIn: options?.expiresIn ?? 3600 });
}

/**
 * Presigned URL khusus dokumen CV PDF (kompatibilitas mundur).
 */
export async function createPresignedCvUrl(
  keyOrUrl: string,
  filename = "CV-ATS-ZakariaMP-2025.pdf",
  expiresIn = 3600
): Promise<string | null> {
  return createPresignedUrl(keyOrUrl, {
    expiresIn,
    contentType: "application/pdf",
    downloadFilename: filename,
  });
}

/**
 * Mengambil objek langsung dari R2 via S3 API untuk streaming melalui backend.
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
}

/**
 * Menyimpan berkas biner ke Cloudflare R2 dengan object key unik.
 * Jika R2_PUBLIC_DOMAIN disetel, mengembalikan direct CDN URL.
 * Jika Public Access dinonaktifkan (default), mengembalikan rute proxy terotorisasi (/api/r2-file?key=...).
 * Menolak membuat URL publik palsu ke endpoint API S3 privat.
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

  // Jika domain publik R2 terkonfigurasi (Public Access / Custom Domain aktif), gunakan direct URL.
  // Jika Public Access masih Disabled, gunakan rute backend terotorisasi (/api/r2-file?key=...).
  // Dilarang keras membuat URL palsu ke *.r2.cloudflarestorage.com.
  const url = config.publicDomain
    ? `${config.publicDomain}/${uniqueKey}`
    : `/api/r2-file?key=${encodeURIComponent(uniqueKey)}`;

  return { url, key: uniqueKey };
}
