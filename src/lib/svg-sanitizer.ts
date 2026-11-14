/**
 * Strict SVG sanitizer & validator to prevent stored XSS before uploading to R2 or storing inline/URL references.
 */

export type SvgValidationResult =
  | { ok: true; sanitized: string }
  | { ok: false; error: string };

const MAX_SVG_BYTES = 512 * 1024; // 512 KB

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /<\s*script\b/i, reason: "Tag <script> tidak diizinkan pada SVG." },
  { pattern: /<\s*foreignObject\b/i, reason: "Tag <foreignObject> tidak diizinkan pada SVG." },
  { pattern: /<\s*iframe\b/i, reason: "Tag <iframe> tidak diizinkan pada SVG." },
  { pattern: /<\s*object\b/i, reason: "Tag <object> tidak diizinkan pada SVG." },
  { pattern: /<\s*embed\b/i, reason: "Tag <embed> tidak diizinkan pada SVG." },
  { pattern: /<\s*applet\b/i, reason: "Tag <applet> tidak diizinkan pada SVG." },
  { pattern: /<!\s*ENTITY\b/i, reason: "Deklarasi ENTITY tidak diizinkan pada SVG." },
  { pattern: /<\?\s*xml-stylesheet\b/i, reason: "Processing instruction xml-stylesheet tidak diizinkan." },
  { pattern: /\bon[a-z]+\s*=/i, reason: "Event handler JavaScript inline (on*) tidak diizinkan pada SVG." },
  { pattern: /\bjavascript\s*:/i, reason: "Skema URL javascript: tidak diizinkan pada SVG." },
  { pattern: /\bvbscript\s*:/i, reason: "Skema URL vbscript: tidak diizinkan pada SVG." },
  { pattern: /data\s*:\s*text\/html/i, reason: "Skema data:text/html tidak diizinkan pada SVG." },
  { pattern: /@import\b/i, reason: "Aturan CSS @import tidak diizinkan pada SVG." },
  { pattern: /expression\s*\(/i, reason: "CSS expression() tidak diizinkan pada SVG." },
];

export function sanitizeSvgContent(rawInput: string): SvgValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { ok: false, error: "Konten SVG kosong." };
  }

  const byteLength = Buffer.byteLength(rawInput, "utf8");
  if (byteLength > MAX_SVG_BYTES) {
    return { ok: false, error: "Ukuran file SVG melebihi batas maksimum 512 KB." };
  }

  // Strip BOM and normalize whitespace at edges
  let cleaned = rawInput.replace(/^\uFEFF/, "").trim();

  // Strip XML declaration and DOCTYPE declaration to avoid XXE / parser ambiguity
  cleaned = cleaned
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .trim();

  if (!/^<svg[\s>]/i.test(cleaned) || !/<\/svg>\s*$/i.test(cleaned)) {
    return {
      ok: false,
      error: "File SVG tidak valid (harus memiliki elemen root <svg>...</svg>).",
    };
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(cleaned)) {
      return { ok: false, error: `SVG ditolak: ${rule.reason}` };
    }
  }

  // Strip external <image> / <use> hrefs pointing to remote http(s) scripts or untrusted URLs inside SVG if unsafe
  // Allow fragment references (#id) and benign attributes. Also neutralize xlink:href / href with non-fragment values
  cleaned = cleaned.replace(
    /\s(href|xlink:href)\s*=\s*(["'])\s*(?!#)([\s\S]*?)\2/gi,
    (_match, attr: string, quote: string, val: string) => {
      const trimmed = val.trim().toLowerCase();
      if (trimmed.startsWith("data:image/png") || trimmed.startsWith("data:image/jpeg") || trimmed.startsWith("data:image/webp")) {
        return ` ${attr}=${quote}${val.trim()}${quote}`;
      }
      return "";
    }
  );

  return { ok: true, sanitized: cleaned };
}
