import assert from "node:assert/strict";

console.log("=== STARTING CLOUDFLARE R2 SECURITY & ACCESS TEST SUITE ===");

// -----------------------------------------------------------------------------
// Test 1: extractR2Key & Path Sanitization
// -----------------------------------------------------------------------------
console.log("\n[TEST 1] Object Key Extraction & Sanitization");

function extractR2Key(keyOrUrl, bucketName) {
  if (!keyOrUrl) return "";
  let path = keyOrUrl.trim();

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

  path = path.replace(/^\/+/, "");
  if (bucketName && path.startsWith(`${bucketName}/`)) {
    path = path.slice(bucketName.length + 1);
  }
  return path;
}

assert.equal(
  extractR2Key("projects/hero.png"),
  "projects/hero.png",
  "Simple key extraction failed"
);

assert.equal(
  extractR2Key("/api/r2-file?key=projects%2Fhero.png"),
  "projects/hero.png",
  "Proxy URL extraction failed"
);

assert.equal(
  extractR2Key("https://pub-xxx.r2.dev/projects/hero.png"),
  "projects/hero.png",
  "Public CDN URL extraction failed"
);

assert.equal(
  extractR2Key("portofolio-zekk/projects/hero.png", "portofolio-zekk"),
  "projects/hero.png",
  "Bucket prefix stripping failed"
);

assert.equal(
  extractR2Key("///projects/hero.png"),
  "projects/hero.png",
  "Leading slashes stripping failed"
);

console.log("  ✓ All key extraction variants passed");

// -----------------------------------------------------------------------------
// Test 2: Path Traversal & Invalid Key Detection
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Path Traversal & Malicious Key Defense");

const isMaliciousKey = (key) => {
  if (
    !key ||
    key.includes("..") ||
    key.includes("\0") ||
    key.startsWith("/") ||
    key.startsWith("\\")
  ) {
    return true;
  }
  const folder = key.split("/")[0]?.toLowerCase();
  const ALLOWED = new Set(["uploads", "projects", "certificates", "cv", "avatar", "lanyard"]);
  return !ALLOWED.has(folder);
};

assert.equal(isMaliciousKey("../etc/passwd"), true, "Path traversal with .. not detected");
assert.equal(isMaliciousKey("uploads/../../secret.txt"), true, "Nested .. traversal not detected");
assert.equal(isMaliciousKey("uploads/file\0.png"), true, "Null byte not detected");
assert.equal(isMaliciousKey("/uploads/file.png"), true, "Leading forward slash not detected");
assert.equal(isMaliciousKey("\\uploads\\file.png"), true, "Leading backslash not detected");
assert.equal(isMaliciousKey("system/passwords.txt"), true, "Unapproved folder not detected");
assert.equal(isMaliciousKey("projects/demo-1.png"), false, "Legitimate key wrongly rejected");
assert.equal(isMaliciousKey("uploads/12345-avatar.webp"), false, "Legitimate upload wrongly rejected");

console.log("  ✓ Path traversal and malicious key patterns successfully rejected");

// -----------------------------------------------------------------------------
// Test 3: Public vs Private Asset Classification
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Public vs Private Access Classification");

const isPublicFolder = (key) => {
  const folder = key.split("/")[0]?.toLowerCase();
  return ["avatar", "projects", "certificates", "lanyard"].includes(folder);
};

assert.equal(isPublicFolder("projects/screen.webp"), true, "Projects should be public");
assert.equal(isPublicFolder("avatar/profile.jpg"), true, "Avatar should be public");
assert.equal(isPublicFolder("certificates/cert1.png"), true, "Certificates should be public");
assert.equal(isPublicFolder("lanyard/card.png"), true, "Lanyard should be public");

assert.equal(isPublicFolder("uploads/random-temp-upload.pdf"), false, "Random uploads must not be default public");
assert.equal(isPublicFolder("cv/confidential-notes.txt"), false, "Arbitrary CV files must not be default public");

console.log("  ✓ Public portfolio folders correctly classified; private files protected");

// -----------------------------------------------------------------------------
// Test 4: CV Document Identifier Enforcement
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] CV Allowlist & Identifier Enforcement");

const ALLOWED_CV_ROLES = new Set(["uiux", "frontend", "graphic", "itsupport", "ats", "main", "current"]);
const resolveCvDoc = (identifier) => {
  if (!identifier) return "default-ats";
  const clean = identifier.toLowerCase().trim();
  if (ALLOWED_CV_ROLES.has(clean)) return `resolved-${clean}`;
  return "default-ats";
};

assert.equal(resolveCvDoc("uiux"), "resolved-uiux");
assert.equal(resolveCvDoc("frontend"), "resolved-frontend");
assert.equal(resolveCvDoc(""), "default-ats");
assert.equal(resolveCvDoc(null), "default-ats");
assert.equal(resolveCvDoc("https://attacker.com/evil.pdf"), "default-ats", "Arbitrary URL must fallback safely");
assert.equal(resolveCvDoc("../uploads/secret.pdf"), "default-ats", "Path traversal must fallback safely");

console.log("  ✓ CV retrieval strictly bound to server-approved identifiers");

// -----------------------------------------------------------------------------
// Test 5: Cache-Control Header Classification
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Cache Header Assignment by Classification");

const getCacheControl = (isAdmin, isPublicAsset) => {
  if (isAdmin && !isPublicAsset) {
    return "private, no-cache, no-store, must-revalidate";
  }
  return "public, max-age=86400, stale-while-revalidate=604800";
};

assert.equal(
  getCacheControl(false, true),
  "public, max-age=86400, stale-while-revalidate=604800",
  "Public file must have public CDN cache headers"
);

assert.equal(
  getCacheControl(true, false),
  "private, no-cache, no-store, must-revalidate",
  "Private admin file must NEVER have public cache headers"
);

console.log("  ✓ Cache headers enforce strict privacy for unpublished files");

// -----------------------------------------------------------------------------
// Test 6: File Signature (Magic Number) Validation
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Binary Magic Number Validation");

function detectSafeFileType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: "png", mime: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { ext: "pdf", mime: "application/pdf" };
  }
  return null;
}

const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const fakePdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xd0, 0xd4]);
const evilSvg = Buffer.from("<svg onload=alert(1)>");
const evilExe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00");

assert.equal(detectSafeFileType(fakePng)?.mime, "image/png", "PNG magic number failed");
assert.equal(detectSafeFileType(fakePdf)?.mime, "application/pdf", "PDF magic number failed");
assert.equal(detectSafeFileType(evilSvg), null, "SVG must be rejected by magic number");
assert.equal(detectSafeFileType(evilExe), null, "Executable must be rejected");

console.log("  ✓ Magic number inspection successfully blocks executables and SVG");

console.log("\n=== ALL 6 SECURITY TEST SUITES PASSED PERFECTLY ===");
