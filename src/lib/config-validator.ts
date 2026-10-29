import type { SiteConfig, Project, CvDocConfig } from "@/lib/site-config";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: SiteConfig;
}

function isSafeUrl(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("vbscript:") || trimmed.startsWith("data:text/html")) {
    return false;
  }
  if (trimmed.startsWith("/") || trimmed.startsWith("https://") || trimmed.startsWith("http://localhost")) {
    return true;
  }
  if (trimmed.startsWith("data:image/")) {
    return true;
  }
  return false;
}

export function validateSiteConfigPayload(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { isValid: false, errors: ["Payload konfigurasi harus berupa objek JSON valid"] };
  }

  // Cek ukuran payload serialisasi
  const jsonStr = JSON.stringify(raw);
  if (jsonStr.length > 500 * 1024) {
    return { isValid: false, errors: ["Ukuran payload konfigurasi melebihi batas 500 KB"] };
  }

  const obj = raw as Record<string, unknown>;

  // Validasi projects
  if (obj.projects !== undefined) {
    if (!Array.isArray(obj.projects)) {
      errors.push("Field 'projects' harus berupa array");
    } else if (obj.projects.length > 30) {
      errors.push("Jumlah proyek melebihi batas maksimal 30 item");
    } else {
      for (let i = 0; i < obj.projects.length; i++) {
        const p = obj.projects[i] as Partial<Project>;
        if (!p || typeof p !== "object") {
          errors.push(`Proyek ke-${i + 1} tidak valid`);
          continue;
        }
        if (typeof p.title === "string" && p.title.length > 120) {
          errors.push(`Judul proyek '${p.title.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`);
        }
        if (typeof p.desc === "string" && p.desc.length > 800) {
          errors.push(`Deskripsi proyek '${p.title || i}' terlalu panjang (maks 800 karakter)`);
        }
        if (p.previewUrl && !isSafeUrl(p.previewUrl)) {
          errors.push(`URL pratinjau proyek '${p.title || i}' menggunakan protokol tidak aman`);
        }
        if (p.repo && !isSafeUrl(p.repo)) {
          errors.push(`Tautan repository proyek '${p.title || i}' tidak valid`);
        }
        if (p.image && !isSafeUrl(p.image)) {
          errors.push(`Gambar proyek '${p.title || i}' tidak valid`);
        }
      }
    }
  }

  // Validasi cvDocs
  if (obj.cvDocs !== undefined) {
    if (!Array.isArray(obj.cvDocs)) {
      errors.push("Field 'cvDocs' harus berupa array");
    } else if (obj.cvDocs.length > 10) {
      errors.push("Jumlah dokumen CV melebihi batas maksimal 10 item");
    } else {
      for (const d of obj.cvDocs as Partial<CvDocConfig>[]) {
        if (d.pdfUrl && !isSafeUrl(d.pdfUrl)) {
          errors.push(`URL PDF dokumen CV tidak valid`);
        }
      }
    }
  }

  // Validasi headerLogoUrl
  if (obj.headerLogoUrl && typeof obj.headerLogoUrl === "string" && !isSafeUrl(obj.headerLogoUrl)) {
    errors.push("URL logo header menggunakan protokol tidak aman");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}
