import type {
  SiteConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
  ServiceItemConfig,
  BlogConfig,
  GeneralProfileConfig,
  StatsConfig,
} from "@/lib/site-config";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: SiteConfig;
}

function isSafeUrl(url?: string): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html") ||
    trimmed.startsWith("data:application/")
  ) {
    return false;
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://localhost") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
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

  // Cek ukuran payload serialisasi (maks 1 MB)
  const jsonStr = JSON.stringify(raw);
  if (jsonStr.length > 1024 * 1024) {
    return { isValid: false, errors: ["Ukuran payload konfigurasi melebihi batas 1 MB"] };
  }

  const obj = raw as Record<string, unknown>;

  // 1. Validasi generalProfile
  if (obj.generalProfile !== undefined) {
    const prof = obj.generalProfile as Partial<GeneralProfileConfig>;
    if (!prof || typeof prof !== "object") {
      errors.push("Field 'generalProfile' harus berupa objek valid");
    } else {
      if (typeof prof.name === "string" && prof.name.length > 100) {
        errors.push("Nama tampilan terlalu panjang (maks 100 karakter)");
      }
      if (typeof prof.nickname === "string" && prof.nickname.length > 50) {
        errors.push("Nama panggilan terlalu panjang (maks 50 karakter)");
      }
      if (typeof prof.brand === "string" && prof.brand.length > 50) {
        errors.push("Nama brand terlalu panjang (maks 50 karakter)");
      }
      if (typeof prof.roles === "string" && prof.roles.length > 150) {
        errors.push("Deskripsi peran terlalu panjang (maks 150 karakter)");
      }
      if (typeof prof.heroDesc === "string" && prof.heroDesc.length > 500) {
        errors.push("Deskripsi hero terlalu panjang (maks 500 karakter)");
      }
      if (prof.avatarUrl && !isSafeUrl(prof.avatarUrl)) {
        errors.push("URL foto profil tidak valid atau menggunakan protokol tidak aman");
      }
      if (prof.email && typeof prof.email === "string" && !prof.email.includes("@")) {
        errors.push("Format email profil tidak valid");
      }
      if (Array.isArray(prof.socials)) {
        for (const soc of prof.socials) {
          if (soc?.href && !isSafeUrl(soc.href)) {
            errors.push(`URL media sosial '${soc.label || ""}' tidak aman`);
          }
        }
      }
    }
  }

  // 2. Validasi stats
  if (obj.stats !== undefined) {
    const stats = obj.stats as Partial<StatsConfig>;
    if (!stats || typeof stats !== "object") {
      errors.push("Field 'stats' harus berupa objek valid");
    } else {
      if (typeof stats.projectsCount === "number" && (stats.projectsCount < 0 || stats.projectsCount > 999)) {
        errors.push("Angka proyek selesai harus antara 0 dan 999");
      }
      if (typeof stats.certificatesCount === "number" && (stats.certificatesCount < 0 || stats.certificatesCount > 999)) {
        errors.push("Angka sertifikat harus antara 0 dan 999");
      }
    }
  }

  // 3. Validasi projects
  if (obj.projects !== undefined) {
    if (!Array.isArray(obj.projects)) {
      errors.push("Field 'projects' harus berupa array");
    } else if (obj.projects.length > 50) {
      errors.push("Jumlah proyek melebihi batas maksimal 50 item");
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
        if (typeof p.desc === "string" && p.desc.length > 1500) {
          errors.push(`Deskripsi proyek '${p.title || i}' terlalu panjang (maks 1500 karakter)`);
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
        if (Array.isArray(p.galleryImages)) {
          for (const img of p.galleryImages) {
            if (img && !isSafeUrl(img)) {
              errors.push(`Gambar galeri proyek '${p.title || i}' tidak valid`);
            }
          }
        }
      }
    }
  }

  // 4. Validasi cvDocs
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

  // 5. Validasi education
  if (obj.education !== undefined) {
    if (!Array.isArray(obj.education)) {
      errors.push("Field 'education' harus berupa array");
    } else if (obj.education.length > 20) {
      errors.push("Jumlah jejak akademik melebihi batas maksimal 20 item");
    } else {
      for (let i = 0; i < obj.education.length; i++) {
        const edu = obj.education[i] as Partial<EducationItem>;
        if (!edu || typeof edu !== "object") {
          errors.push(`Jejak akademik ke-${i + 1} tidak valid`);
          continue;
        }
        if (typeof edu.institution === "string" && edu.institution.length > 150) {
          errors.push(`Nama institusi '${edu.institution.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`);
        }
        if (edu.logo && !isSafeUrl(edu.logo)) {
          errors.push(`URL logo institusi '${edu.institution || i}' tidak valid`);
        }
        if (edu.website && !isSafeUrl(edu.website)) {
          errors.push(`URL website institusi '${edu.institution || i}' tidak valid`);
        }
        if (Array.isArray(edu.projects)) {
          for (const proj of edu.projects) {
            if (proj && typeof proj === "object") {
              if (proj.repo && !isSafeUrl(proj.repo)) {
                errors.push(`Tautan repositori proyek akademik '${proj.title || ""}' tidak valid`);
              }
              if (proj.url && !isSafeUrl(proj.url)) {
                errors.push(`Tautan web proyek akademik '${proj.title || ""}' tidak valid`);
              }
            }
          }
        }
      }
    }
  }

  // 6. Validasi experience
  if (obj.experience !== undefined) {
    if (!Array.isArray(obj.experience)) {
      errors.push("Field 'experience' harus berupa array");
    } else if (obj.experience.length > 30) {
      errors.push("Jumlah pengalaman melebihi batas maksimal 30 item");
    } else {
      for (let i = 0; i < obj.experience.length; i++) {
        const exp = obj.experience[i] as Partial<ExperienceItem>;
        if (!exp || typeof exp !== "object") {
          errors.push(`Pengalaman ke-${i + 1} tidak valid`);
          continue;
        }
        if (typeof exp.role === "string" && exp.role.length > 120) {
          errors.push(`Peran '${exp.role.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`);
        }
        if (typeof exp.org === "string" && exp.org.length > 120) {
          errors.push(`Organisasi '${exp.org.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`);
        }
        if (exp.logo && !isSafeUrl(exp.logo)) {
          errors.push(`URL logo pengalaman '${exp.org || i}' tidak valid`);
        }
      }
    }
  }

  // 7. Validasi achievements
  if (obj.achievements !== undefined) {
    if (!Array.isArray(obj.achievements)) {
      errors.push("Field 'achievements' harus berupa array");
    } else if (obj.achievements.length > 30) {
      errors.push("Jumlah prestasi melebihi batas maksimal 30 item");
    } else {
      for (let i = 0; i < obj.achievements.length; i++) {
        const ach = obj.achievements[i] as Partial<AchievementItem>;
        if (!ach || typeof ach !== "object") {
          errors.push(`Prestasi ke-${i + 1} tidak valid`);
          continue;
        }
        if (typeof ach.title === "string" && ach.title.length > 150) {
          errors.push(`Judul prestasi '${ach.title.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`);
        }
        if (ach.evidenceUrl && !isSafeUrl(ach.evidenceUrl)) {
          errors.push(`URL bukti prestasi '${ach.title || i}' tidak valid`);
        }
        if (ach.image && !isSafeUrl(ach.image)) {
          errors.push(`Gambar prestasi '${ach.title || i}' tidak valid`);
        }
      }
    }
  }

  // 8. Validasi certificates
  if (obj.certificates !== undefined) {
    if (!Array.isArray(obj.certificates)) {
      errors.push("Field 'certificates' harus berupa array");
    } else if (obj.certificates.length > 60) {
      errors.push("Jumlah sertifikat melebihi batas maksimal 60 item");
    } else {
      for (let i = 0; i < obj.certificates.length; i++) {
        const cert = obj.certificates[i] as Partial<CertificateItem>;
        if (!cert || typeof cert !== "object") {
          errors.push(`Sertifikat ke-${i + 1} tidak valid`);
          continue;
        }
        if (typeof cert.title === "string" && cert.title.length > 150) {
          errors.push(`Judul sertifikat '${cert.title.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`);
        }
        if (cert.credentialUrl && !isSafeUrl(cert.credentialUrl)) {
          errors.push(`URL kredensial sertifikat '${cert.title || i}' tidak valid`);
        }
        if (cert.credentialPdf && !isSafeUrl(cert.credentialPdf)) {
          errors.push(`URL PDF sertifikat '${cert.title || i}' tidak valid`);
        }
        if (cert.image && !isSafeUrl(cert.image)) {
          errors.push(`Gambar sertifikat '${cert.title || i}' tidak valid`);
        }
      }
    }
  }

  // 9. Validasi techStack
  if (obj.techStack !== undefined) {
    if (!Array.isArray(obj.techStack)) {
      errors.push("Field 'techStack' harus berupa array");
    } else if (obj.techStack.length > 50) {
      errors.push("Jumlah alat pada tech stack melebihi batas maksimal 50 item");
    } else {
      for (let i = 0; i < obj.techStack.length; i++) {
        const item = obj.techStack[i] as Partial<TechStackItem>;
        if (item?.icon && !isSafeUrl(item.icon)) {
          errors.push(`Ikon teknologi '${item.name || i}' tidak valid`);
        }
      }
    }
  }

  // 10. Validasi services
  if (obj.services !== undefined) {
    if (!Array.isArray(obj.services)) {
      errors.push("Field 'services' harus berupa array");
    } else if (obj.services.length > 12) {
      errors.push("Jumlah layanan melebihi batas maksimal 12 item");
    } else {
      for (let i = 0; i < obj.services.length; i++) {
        const s = obj.services[i] as Partial<ServiceItemConfig>;
        if (s?.ctaUrl && !isSafeUrl(s.ctaUrl)) {
          errors.push(`URL CTA layanan '${s.titleId || i}' tidak aman`);
        }
      }
    }
  }

  // 11. Validasi faq
  if (obj.faq !== undefined) {
    if (!Array.isArray(obj.faq)) {
      errors.push("Field 'faq' harus berupa array");
    } else if (obj.faq.length > 30) {
      errors.push("Jumlah FAQ melebihi batas maksimal 30 item");
    }
  }

  // 12. Validasi blog
  if (obj.blog !== undefined) {
    const blog = obj.blog as Partial<BlogConfig>;
    if (blog && typeof blog === "object") {
      if (blog.feedUrl && !isSafeUrl(blog.feedUrl)) {
        errors.push("URL feed blog menggunakan protokol tidak aman");
      }
    }
  }

  // 13. Validasi headerLogoUrl
  if (obj.headerLogoUrl && typeof obj.headerLogoUrl === "string" && !isSafeUrl(obj.headerLogoUrl)) {
    errors.push("URL logo header menggunakan protokol tidak aman");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}
