import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucketName = (process.env.R2_BUCKET_NAME || "portofolio-zekk").trim();
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").trim();

console.log("=== CLOUDFLARE R2 DIAGNOSTIC CHECK ===");
console.log(`Bucket Name:      ${bucketName}`);
console.log(`Public Domain:    ${publicDomain || "(None - Using Authorized Backend Proxy)"}`);
console.log(`Storage Mode:     ${publicDomain ? "Direct CDN URL" : "Private Proxy Mode (/api/r2-file)"}`);

const missing = [];
if (!accountId) missing.push("R2_ACCOUNT_ID");
if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
if (!bucketName) missing.push("R2_BUCKET_NAME");

if (missing.length > 0) {
  console.error(`\n[FAIL] Missing Environment Variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Configuration:    [PASS] All 4 required credentials present");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const start = Date.now();
try {
  await client.send(new HeadBucketCommand({ Bucket: bucketName }));
  const duration = Date.now() - start;
  console.log(`Connection Test:  [PASS] HeadBucket succeeded (${duration}ms)`);
  console.log("Bucket Exists:    [PASS] Confirmed");
  console.log("Credentials Valid:[PASS] S3 Auth succeeded");
  console.log("\n=== ALL R2 DIAGNOSTIC CHECKS PASSED ===");
} catch (err) {
  const duration = Date.now() - start;
  console.error(`Connection Test:  [FAIL] Failed after ${duration}ms`);
  const status = err?.$metadata?.httpStatusCode;
  if (status === 403 || err.name === "AccessDenied" || err.name === "SignatureDoesNotMatch") {
    console.error("Diagnosis:        [FAIL] Invalid S3 credentials or missing HeadBucket permission");
  } else if (status === 404 || err.name === "NotFound" || err.name === "NoSuchBucket") {
    console.error(`Diagnosis:        [FAIL] Bucket '${bucketName}' does not exist in account`);
  } else {
    console.error(`Diagnosis:        [FAIL] Network or endpoint error: ${err.message}`);
  }
  process.exit(1);
}
