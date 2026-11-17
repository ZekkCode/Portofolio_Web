/**
 * Strict SVG sanitizer & validator to prevent stored XSS before uploading to R2 or storing references.
 * Defends against:
 * - <script>, <foreignObject>, <iframe>, <object>, <embed>, <applet>
 * - XML namespace prefix bypasses (<ns:script>, <ns:foreignObject>, custom xmlns:*)
 * - SMIL animation injection (<animate>, <set>, <animateMotion>, <animateTransform>, <discard>)
 * - HTML/XML decimal & hex character entity obfuscation (&#x6a;avascript:)
 * - Inline event handlers (on*=) and unsafe href / xlink:href targets
 */

export type SvgValidationResult =
  | { ok: true; sanitized: string }
  | { ok: false; error: string };

const MAX_SVG_BYTES = 512 * 1024; // 512 KB

function decodeXmlEntitiesForInspection(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    })
    .replace(/&#(\d+);?/g, (_m, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    })
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, " ")
    .replace(/&newline;/gi, " ")
    .replace(/[\u0000-\u0020]+/g, " ");
}

const FORBIDDEN_TAG_REGEX =
  /<\s*\/?\s*(?:[a-z0-9_-]+\s*:\s*)?(?:script|foreignObject|iframe|object|embed|applet|animate|animateMotion|animateTransform|set|discard|handler|listener|audio|video|canvas|portal|meta|link|base|form|input|button|textarea)\b/i;

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: FORBIDDEN_TAG_REGEX, reason: "Elemen aktif/eksekusi (script, foreignObject, SMIL animate/set, embed) tidak diizinkan pada SVG." },
  { pattern: /<\s*\/?\s*(?!svg\b|xlink\b)[a-z0-9_-]+\s*:\s*[a-z0-9_-]+/i, reason: "Elemen berprefiks XML namespace kustom tidak diizinkan pada SVG." },
  { pattern: /\bxmlns\s*:\s*(?!xlink\b)[a-z0-9_-]+\s*=/i, reason: "Deklarasi XML namespace kustom tidak diizinkan pada SVG." },
  { pattern: /<!\s*(?:ENTITY|ATTLIST|ELEMENT|NOTATION)\b/i, reason: "Deklarasi DTD/ENTITY tidak diizinkan pada SVG." },
  { pattern: /<\?\s*xml-stylesheet\b/i, reason: "Processing instruction xml-stylesheet tidak diizinkan." },
  { pattern: /(?:^|[\s"'/])(?:[a-z0-9_-]+\s*:\s*)?on[a-z]+\s*=/i, reason: "Event handler JavaScript inline (on*) tidak diizinkan pada SVG." },
  { pattern: /\bjavascript\s*:/i, reason: "Skema URL javascript: tidak diizinkan pada SVG." },
  { pattern: /\bvbscript\s*:/i, reason: "Skema URL vbscript: tidak diizinkan pada SVG." },
  { pattern: /data\s*:\s*(?:text\/html|image\/svg\+xml|application\/)/i, reason: "Skema data URI eksekusi tidak diizinkan pada SVG." },
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

  // Strip XML declaration, DOCTYPE declaration, and CDATA wrappers that could hide tags
  cleaned = cleaned
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .trim();

  if (/<!\[CDATA\[/i.test(cleaned)) {
    return { ok: false, error: "SVG ditolak: Blok CDATA tidak diizinkan pada SVG." };
  }

  if (!/^<svg[\s>]/i.test(cleaned) || !/<\/svg>\s*$/i.test(cleaned)) {
    return {
      ok: false,
      error: "File SVG tidak valid (harus memiliki elemen root <svg>...</svg>).",
    };
  }

  // Inspect both raw text and entity-decoded text so &#x6a;avascript: cannot bypass scheme checks
  const decodedForInspection = decodeXmlEntitiesForInspection(cleaned);

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(cleaned) || rule.pattern.test(decodedForInspection)) {
      return { ok: false, error: `SVG ditolak: ${rule.reason}` };
    }
  }

  // Reject unquoted href / xlink:href attributes completely
  if (/\s(?:href|xlink:href)\s*=\s*[^"'\s>]/i.test(cleaned)) {
    return { ok: false, error: "SVG ditolak: Atribut href wajib menggunakan tanda kutip standar." };
  }

  // Restrict href / xlink:href strictly to internal #fragment IDs or safe base64 raster data URIs
  cleaned = cleaned.replace(
    /\s(href|xlink:href)\s*=\s*(["'])([\s\S]*?)\2/gi,
    (_match, attr: string, quote: string, val: string) => {
      const trimmed = val.trim();
      if (/^#[a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return ` ${attr}=${quote}${trimmed}${quote}`;
      }
      if (/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
        return ` ${attr}=${quote}${trimmed}${quote}`;
      }
      return "";
    }
  );

  return { ok: true, sanitized: cleaned };
}
