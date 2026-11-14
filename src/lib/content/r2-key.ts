/**
 * Helper URL/Key Cloudflare R2 yang aman digunakan di lingkungan browser maupun server
 * tanpa ketergantungan pada AWS SDK atau modul Node.js.
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
