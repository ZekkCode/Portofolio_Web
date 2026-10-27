import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_URL || "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain: publicDomain.replace(/\/$/, ""),
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
      "Cloudflare R2 belum dikonfigurasi. Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_BUCKET_NAME terisi di file .env.local"
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

  const publicBase = config.publicDomain
    ? config.publicDomain
    : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com`;

  const url = `${publicBase}/${uniqueKey}`;
  return { url, key: uniqueKey };
}
