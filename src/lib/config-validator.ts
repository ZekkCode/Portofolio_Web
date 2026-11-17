import type {
  SiteConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackCategoryConfig,
  TechStackItem,
  ServiceItemConfig,
  BlogConfig,
  GeneralProfileConfig,
  StatsConfig,
} from "@/lib/site-config";
import { isSafeCvAssetUrl } from "@/lib/content/cv-documents";
import { parseStructuredYearMonth } from "@/lib/content/experience-dates";
import { validatePublicFeedUrlSyntax } from "@/lib/content/blog-sync";
import type { ContentHealthIssue } from "@/lib/content/types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: SiteConfig;
}

export interface StructuredValidationResult {
  isValid: boolean;
  errors: string[];
  issues: ContentHealthIssue[];
}

const SAFE_RASTER_DATA_URI_REGEX =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i;

export function isSafeUrl(url?: string): boolean {
  if (!url) return true;
  const rawTrimmed = url.trim();
  if (!rawTrimmed || /[\u0000-\u001f\u007f]/.test(rawTrimmed)) {
    return false;
  }
  const trimmed = rawTrimmed.toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/") ||
    trimmed.startsWith("data:application/") ||
    trimmed.startsWith("data:image/svg") ||
    trimmed.startsWith("//")
  ) {
    return false;
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://localhost") ||
    trimmed.startsWith("http://127.0.0.1") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return true;
  }
  if (SAFE_RASTER_DATA_URI_REGEX.test(trimmed)) {
    return true;
  }
  return false;
}

export function validateSiteConfigStructured(raw: unknown): StructuredValidationResult {
  const errors: string[] = [];
  const issues: ContentHealthIssue[] = [];

  const pushIssue = (params: {
    id: string;
    dedupeKey?: string;
    section: string;
    field: string;
    message: string;
    itemId?: string;
    fieldKey?: string;
    suggestion?: string;
  }) => {
    errors.push(params.message);
    issues.push({
      id: params.id,
      dedupeKey: params.dedupeKey || params.id,
      section: params.section,
      field: params.field,
      severity: "error",
      message: params.message,
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.fieldKey ? { fieldKey: params.fieldKey } : {}),
      ...(params.suggestion ? { suggestion: params.suggestion } : {}),
    });
  };

  const checkSafeUrlField = (
    url: unknown,
    params: {
      id: string;
      dedupeKey?: string;
      section: string;
      field: string;
      message: string;
      itemId?: string;
      fieldKey?: string;
    }
  ) => {
    if (typeof url === "string" && url && !isSafeUrl(url)) {
      pushIssue(params);
    }
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    const msg = "Payload konfigurasi harus berupa objek JSON valid";
    pushIssue({
      id: "schema-root-invalid",
      dedupeKey: "schema:root-invalid",
      section: "Sistem",
      field: "root",
      message: msg,
    });
    return { isValid: false, errors, issues };
  }

  // Cek ukuran payload serialisasi (maks 2 MB)
  const jsonStr = JSON.stringify(raw);
  if (jsonStr.length > 2 * 1024 * 1024) {
    const msg = "Ukuran payload konfigurasi melebihi batas 2 MB";
    pushIssue({
      id: "schema-payload-too-large",
      dedupeKey: "schema:payload-too-large",
      section: "Sistem",
      field: "root",
      message: msg,
    });
    return { isValid: false, errors, issues };
  }

  const obj = raw as Record<string, unknown>;

  // 1. Validasi generalProfile
  if (obj.generalProfile !== undefined) {
    const prof = obj.generalProfile as Partial<GeneralProfileConfig>;
    if (!prof || typeof prof !== "object") {
      pushIssue({
        id: "schema-generalProfile-invalid",
        dedupeKey: "schema:generalProfile-invalid",
        section: "Profil",
        field: "generalProfile",
        message: "Field 'generalProfile' harus berupa objek valid",
      });
    } else {
      const profileLengthRules: Array<{
        value: unknown;
        max: number;
        field: string;
        message: string;
      }> = [
        { value: prof.name, max: 100, field: "generalProfile.name", message: "Nama tampilan terlalu panjang (maks 100 karakter)" },
        { value: prof.nickname, max: 50, field: "generalProfile.nickname", message: "Nama panggilan terlalu panjang (maks 50 karakter)" },
        { value: prof.brand, max: 50, field: "generalProfile.brand", message: "Nama brand terlalu panjang (maks 50 karakter)" },
        { value: prof.roles, max: 150, field: "generalProfile.roles", message: "Deskripsi peran terlalu panjang (maks 150 karakter)" },
        { value: prof.heroDesc, max: 500, field: "generalProfile.heroDesc", message: "Deskripsi hero terlalu panjang (maks 500 karakter)" },
      ];
      for (const rule of profileLengthRules) {
        if (typeof rule.value === "string" && rule.value.length > rule.max) {
          pushIssue({
            id: `schema-limit-${rule.field}`,
            dedupeKey: `limit:${rule.field}`,
            section: "Profil",
            field: rule.field,
            message: rule.message,
          });
        }
      }
      checkSafeUrlField(prof.avatarUrl, {
        id: "identity-unsafe-url-0",
        dedupeKey: "unsafe-url:generalProfile.avatarUrl",
        section: "Profil",
        field: "generalProfile.avatarUrl",
        message: "URL foto profil tidak valid atau menggunakan protokol tidak aman",
      });
      checkSafeUrlField(prof.ctaPrimaryHref, {
        id: "identity-unsafe-cta-primary",
        dedupeKey: "unsafe-url:generalProfile.ctaPrimaryHref",
        section: "Profil",
        field: "generalProfile.ctaPrimaryHref",
        message: "URL tombol utama Hero tidak aman",
      });
      checkSafeUrlField(prof.ctaSecondaryHref, {
        id: "identity-unsafe-cta-secondary",
        dedupeKey: "unsafe-url:generalProfile.ctaSecondaryHref",
        section: "Profil",
        field: "generalProfile.ctaSecondaryHref",
        message: "URL tombol sekunder Hero tidak aman",
      });
      if (prof.email && typeof prof.email === "string" && !prof.email.includes("@")) {
        pushIssue({
          id: "profile-email-invalid",
          dedupeKey: "invalid:generalProfile.email",
          section: "Profil",
          field: "generalProfile.email",
          message: "Format email profil tidak valid",
        });
      }
      if (Array.isArray(prof.socials)) {
        prof.socials.forEach((soc, idx) => {
          checkSafeUrlField(soc?.href, {
            id: `social-unsafe-url-${idx}`,
            dedupeKey: `unsafe-url:generalProfile.socials[${idx}].href`,
            section: "Profil",
            field: `generalProfile.socials[${idx}].href`,
            message: `URL media sosial '${soc?.label || ""}' tidak aman`,
          });
        });
      }
    }
  }

  // 2. Validasi stats
  if (obj.stats !== undefined) {
    const stats = obj.stats as Partial<StatsConfig>;
    if (!stats || typeof stats !== "object") {
      pushIssue({
        id: "schema-stats-invalid",
        dedupeKey: "schema:stats-invalid",
        section: "Profil",
        field: "stats",
        message: "Field 'stats' harus berupa objek valid",
      });
    } else {
      if (typeof stats.projectsCount === "number" && (stats.projectsCount < 0 || stats.projectsCount > 999)) {
        pushIssue({
          id: "schema-stats-projectsCount",
          dedupeKey: "bounds:stats.projectsCount",
          section: "Profil",
          field: "stats.projectsCount",
          message: "Angka proyek selesai harus antara 0 dan 999",
        });
      }
      if (typeof stats.certificatesCount === "number" && (stats.certificatesCount < 0 || stats.certificatesCount > 999)) {
        pushIssue({
          id: "schema-stats-certificatesCount",
          dedupeKey: "bounds:stats.certificatesCount",
          section: "Profil",
          field: "stats.certificatesCount",
          message: "Angka sertifikat harus antara 0 dan 999",
        });
      }
    }
  }

  // 3. Validasi projects
  if (obj.projects !== undefined) {
    if (!Array.isArray(obj.projects)) {
      pushIssue({
        id: "schema-projects-not-array",
        dedupeKey: "schema:projects-not-array",
        section: "Proyek",
        field: "projects",
        message: "Field 'projects' harus berupa array",
      });
    } else if (obj.projects.length > 50) {
      pushIssue({
        id: "schema-projects-max",
        dedupeKey: "limit:projects.length",
        section: "Proyek",
        field: "projects",
        message: "Jumlah proyek melebihi batas maksimal 50 item",
      });
    } else {
      for (let i = 0; i < obj.projects.length; i++) {
        const p = obj.projects[i] as Partial<Project>;
        if (!p || typeof p !== "object") {
          pushIssue({
            id: `schema-project-invalid-${i}`,
            dedupeKey: `schema:projects[${i}]`,
            section: "Proyek",
            field: `projects[${i}]`,
            message: `Proyek ke-${i + 1} tidak valid`,
          });
          continue;
        }
        const itemId = typeof p.id === "string" && p.id ? p.id : `projects-${i}`;
        if (typeof p.title === "string" && p.title.length > 120) {
          pushIssue({
            id: `schema-project-title-len-${i}`,
            dedupeKey: `limit:projects[${i}].title`,
            section: "Proyek",
            field: `projects[${i}].title`,
            itemId,
            fieldKey: "title",
            message: `Judul proyek '${p.title.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`,
          });
        }
        if (typeof p.desc === "string" && p.desc.length > 1500) {
          pushIssue({
            id: `schema-project-desc-len-${i}`,
            dedupeKey: `limit:projects[${i}].desc`,
            section: "Proyek",
            field: `projects[${i}].desc`,
            itemId,
            fieldKey: "desc",
            message: `Deskripsi proyek '${p.title || i}' terlalu panjang (maks 1500 karakter)`,
          });
        }
        checkSafeUrlField(p.previewUrl, {
          id: `schema-project-previewUrl-${i}`,
          dedupeKey: `unsafe-url:projects[${i}].previewUrl`,
          section: "Proyek",
          field: `projects[${i}].previewUrl`,
          itemId,
          fieldKey: "url",
          message: `URL pratinjau proyek '${p.title || i}' menggunakan protokol tidak aman`,
        });
        checkSafeUrlField(p.repo, {
          id: `schema-project-repo-${i}`,
          dedupeKey: `unsafe-url:projects[${i}].repo`,
          section: "Proyek",
          field: `projects[${i}].repo`,
          itemId,
          fieldKey: "url",
          message: `Tautan repository proyek '${p.title || i}' tidak valid`,
        });
        checkSafeUrlField(p.image, {
          id: `schema-project-image-${i}`,
          dedupeKey: `unsafe-url:projects[${i}].image`,
          section: "Proyek",
          field: `projects[${i}].image`,
          itemId,
          fieldKey: "image",
          message: `Gambar proyek '${p.title || i}' tidak valid`,
        });
        if (Array.isArray(p.galleryImages)) {
          for (const img of p.galleryImages) {
            if (img && !isSafeUrl(img)) {
              pushIssue({
                id: `schema-project-gallery-${i}`,
                dedupeKey: `unsafe-url:projects[${i}].galleryImages`,
                section: "Proyek",
                field: `projects[${i}].galleryImages`,
                itemId,
                fieldKey: "image",
                message: `Gambar galeri proyek '${p.title || i}' tidak valid`,
              });
              break;
            }
          }
        }
      }
    }
  }

  // 4. Validasi cvDocs
  if (obj.cvDocs !== undefined) {
    if (!Array.isArray(obj.cvDocs)) {
      pushIssue({
        id: "schema-cvDocs-not-array",
        dedupeKey: "schema:cvDocs-not-array",
        section: "CV",
        field: "cvDocs",
        message: "Field 'cvDocs' harus berupa array",
      });
    } else if (obj.cvDocs.length > 10) {
      pushIssue({
        id: "schema-cvDocs-max",
        dedupeKey: "limit:cvDocs.length",
        section: "CV",
        field: "cvDocs",
        message: "Jumlah dokumen CV melebihi batas maksimal 10 item",
      });
    } else {
      (obj.cvDocs as Partial<CvDocConfig>[]).forEach((d, idx) => {
        const itemId = (typeof d?.id === "string" && d.id) || (typeof d?.roleKey === "string" && d.roleKey) || `cv-${idx}`;
        if (d.pdfUrl && !isSafeCvAssetUrl(d.pdfUrl, { allowDataPdf: true })) {
          pushIssue({
            id: `cv-pdf-unsafe-${idx}`,
            dedupeKey: `unsafe-url:cvDocs[${idx}].pdfUrl`,
            section: "CV",
            field: `cvDocs[${idx}].pdfUrl`,
            itemId,
            message: "URL PDF dokumen CV tidak valid",
          });
        }
        if (d.thumbnailUrl && !isSafeCvAssetUrl(d.thumbnailUrl, { allowDataImage: true })) {
          pushIssue({
            id: `cv-thumb-unsafe-${idx}`,
            dedupeKey: `unsafe-url:cvDocs[${idx}].thumbnailUrl`,
            section: "CV",
            field: `cvDocs[${idx}].thumbnailUrl`,
            itemId,
            message: "URL thumbnail dokumen CV tidak valid",
          });
        }
        if (
          Array.isArray(d.pages) &&
          d.pages.some((pg) => typeof pg === "string" && pg.trim() && !isSafeCvAssetUrl(pg, { allowDataImage: true }))
        ) {
          pushIssue({
            id: `cv-page-unsafe-${idx}`,
            dedupeKey: `unsafe-url:cvDocs[${idx}].pages`,
            section: "CV",
            field: `cvDocs[${idx}].pages`,
            itemId,
            message: "URL halaman preview dokumen CV tidak valid",
          });
        }
      });
    }
  }

  // 5. Validasi education
  if (obj.education !== undefined) {
    if (!Array.isArray(obj.education)) {
      pushIssue({
        id: "schema-education-not-array",
        dedupeKey: "schema:education-not-array",
        section: "Pendidikan",
        field: "education",
        message: "Field 'education' harus berupa array",
      });
    } else if (obj.education.length > 20) {
      pushIssue({
        id: "schema-education-max",
        dedupeKey: "limit:education.length",
        section: "Pendidikan",
        field: "education",
        message: "Jumlah jejak akademik melebihi batas maksimal 20 item",
      });
    } else {
      for (let i = 0; i < obj.education.length; i++) {
        const edu = obj.education[i] as Partial<EducationItem>;
        if (!edu || typeof edu !== "object") {
          pushIssue({
            id: `schema-education-invalid-${i}`,
            dedupeKey: `schema:education[${i}]`,
            section: "Pendidikan",
            field: `education[${i}]`,
            message: `Jejak akademik ke-${i + 1} tidak valid`,
          });
          continue;
        }
        const itemId = typeof edu.id === "string" && edu.id ? edu.id : `education-${i}`;
        if (typeof edu.institution === "string" && edu.institution.length > 150) {
          pushIssue({
            id: `schema-edu-inst-len-${i}`,
            dedupeKey: `limit:education[${i}].institution`,
            section: "Pendidikan",
            field: `education[${i}].institution`,
            itemId,
            message: `Nama institusi '${edu.institution.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`,
          });
        }
        checkSafeUrlField(edu.logo, {
          id: `schema-edu-logo-${i}`,
          dedupeKey: `unsafe-url:education[${i}].logo`,
          section: "Pendidikan",
          field: `education[${i}].logo`,
          itemId,
          message: `URL logo institusi '${edu.institution || i}' tidak valid`,
        });
        checkSafeUrlField(edu.website, {
          id: `schema-edu-website-${i}`,
          dedupeKey: `unsafe-url:education[${i}].website`,
          section: "Pendidikan",
          field: `education[${i}].website`,
          itemId,
          message: `URL website institusi '${edu.institution || i}' tidak valid`,
        });
        if (Array.isArray(edu.projects)) {
          for (const proj of edu.projects) {
            if (proj && typeof proj === "object") {
              const rawRepo = typeof proj.repo === "string" ? proj.repo.trim() : "";
              const isGithubShorthand = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(rawRepo);
              if (rawRepo && !isGithubShorthand) {
                checkSafeUrlField(proj.repo, {
                  id: `schema-edu-proj-repo-${i}`,
                  dedupeKey: `unsafe-url:education[${i}].projects.repo:${proj.title || ""}`,
                  section: "Pendidikan",
                  field: `education[${i}].projects`,
                  itemId,
                  message: `Tautan repositori proyek akademik '${proj.title || ""}' tidak valid`,
                });
              }
              checkSafeUrlField(proj.url, {
                id: `schema-edu-proj-url-${i}`,
                dedupeKey: `unsafe-url:education[${i}].projects.url:${proj.title || ""}`,
                section: "Pendidikan",
                field: `education[${i}].projects`,
                itemId,
                message: `Tautan web proyek akademik '${proj.title || ""}' tidak valid`,
              });
            }
          }
        }
      }
    }
  }

  // 6. Validasi experience
  if (obj.experience !== undefined) {
    if (!Array.isArray(obj.experience)) {
      pushIssue({
        id: "schema-experience-not-array",
        dedupeKey: "schema:experience-not-array",
        section: "Karier",
        field: "experience",
        message: "Field 'experience' harus berupa array",
      });
    } else if (obj.experience.length > 30) {
      pushIssue({
        id: "schema-experience-max",
        dedupeKey: "limit:experience.length",
        section: "Karier",
        field: "experience",
        message: "Jumlah pengalaman melebihi batas maksimal 30 item",
      });
    } else {
      for (let i = 0; i < obj.experience.length; i++) {
        const exp = obj.experience[i] as Partial<ExperienceItem>;
        if (!exp || typeof exp !== "object") {
          pushIssue({
            id: `schema-experience-invalid-${i}`,
            dedupeKey: `schema:experience[${i}]`,
            section: "Karier",
            field: `experience[${i}]`,
            message: `Pengalaman ke-${i + 1} tidak valid`,
          });
          continue;
        }
        const itemId = typeof exp.id === "string" && exp.id ? exp.id : `experience-${i}`;
        if (typeof exp.role === "string" && exp.role.length > 120) {
          pushIssue({
            id: `schema-exp-role-len-${i}`,
            dedupeKey: `limit:experience[${i}].role`,
            section: "Karier",
            field: `experience[${i}].role`,
            itemId,
            message: `Peran '${exp.role.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`,
          });
        }
        if (typeof exp.org === "string" && exp.org.length > 120) {
          pushIssue({
            id: `schema-exp-org-len-${i}`,
            dedupeKey: `limit:experience[${i}].org`,
            section: "Karier",
            field: `experience[${i}].org`,
            itemId,
            message: `Organisasi '${exp.org.slice(0, 20)}...' terlalu panjang (maks 120 karakter)`,
          });
        }
        checkSafeUrlField(exp.logo, {
          id: `schema-exp-logo-${i}`,
          dedupeKey: `unsafe-url:experience[${i}].logo`,
          section: "Karier",
          field: `experience[${i}].logo`,
          itemId,
          message: `URL logo pengalaman '${exp.org || i}' tidak valid`,
        });
        checkSafeUrlField(exp.orgUrl, {
          id: `schema-exp-orgUrl-${i}`,
          dedupeKey: `unsafe-url:experience[${i}].orgUrl`,
          section: "Karier",
          field: `experience[${i}].orgUrl`,
          itemId,
          message: `URL organisasi pengalaman '${exp.org || i}' tidak valid`,
        });
        if (Array.isArray(exp.media)) {
          exp.media.forEach((m, mIdx) => {
            if (m && typeof m === "object") {
              checkSafeUrlField(m.url, {
                id: `schema-exp-media-${i}-${mIdx}`,
                dedupeKey: `unsafe-url:experience[${i}].media[${mIdx}].url`,
                section: "Karier",
                field: `experience[${i}].media[${mIdx}].url`,
                itemId,
                message: `URL media pengalaman '${exp.org || i}' tidak valid`,
              });
            }
          });
        }
        const startCheck = parseStructuredYearMonth(exp.startDate);
        if (startCheck.status === "invalid") {
          pushIssue({
            id: `schema-exp-startdate-${i}`,
            dedupeKey: `exp-date:${itemId}`,
            section: "Karier",
            field: `experience[${i}].startDate`,
            itemId,
            message: `Format startDate pengalaman '${exp.org || i}' tidak valid (${startCheck.reason})`,
          });
        }
        const endCheck = parseStructuredYearMonth(exp.endDate);
        if (endCheck.status === "invalid") {
          pushIssue({
            id: `schema-exp-enddate-${i}`,
            dedupeKey: `exp-date:${itemId}`,
            section: "Karier",
            field: `experience[${i}].endDate`,
            itemId,
            message: `Format endDate pengalaman '${exp.org || i}' tidak valid (${endCheck.reason})`,
          });
        }
        if (
          exp.published !== false &&
          exp.visible !== false &&
          !exp.current &&
          startCheck.status === "valid" &&
          endCheck.status === "valid" &&
          endCheck.monthIndex < startCheck.monthIndex
        ) {
          pushIssue({
            id: `schema-exp-reversed-${i}`,
            dedupeKey: `exp-date:${itemId}`,
            section: "Karier",
            field: `experience[${i}].endDate`,
            itemId,
            message: `Tanggal mulai pengalaman '${exp.org || i}' (${startCheck.ym}) lebih akhir dari tanggal selesai (${endCheck.ym})`,
          });
        }
      }
    }
  }

  // 7. Validasi achievements
  if (obj.achievements !== undefined) {
    if (!Array.isArray(obj.achievements)) {
      pushIssue({
        id: "schema-achievements-not-array",
        dedupeKey: "schema:achievements-not-array",
        section: "Prestasi",
        field: "achievements",
        message: "Field 'achievements' harus berupa array",
      });
    } else if (obj.achievements.length > 30) {
      pushIssue({
        id: "schema-achievements-max",
        dedupeKey: "limit:achievements.length",
        section: "Prestasi",
        field: "achievements",
        message: "Jumlah prestasi melebihi batas maksimal 30 item",
      });
    } else {
      for (let i = 0; i < obj.achievements.length; i++) {
        const ach = obj.achievements[i] as Partial<AchievementItem>;
        if (!ach || typeof ach !== "object") {
          pushIssue({
            id: `schema-achievement-invalid-${i}`,
            dedupeKey: `schema:achievements[${i}]`,
            section: "Prestasi",
            field: `achievements[${i}]`,
            message: `Prestasi ke-${i + 1} tidak valid`,
          });
          continue;
        }
        const itemId = typeof ach.id === "string" && ach.id ? ach.id : `achievement-${i}`;
        if (typeof ach.title === "string" && ach.title.length > 150) {
          pushIssue({
            id: `schema-ach-title-len-${i}`,
            dedupeKey: `limit:achievements[${i}].title`,
            section: "Prestasi",
            field: `achievements[${i}].title`,
            itemId,
            message: `Judul prestasi '${ach.title.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`,
          });
        }
        checkSafeUrlField(ach.evidenceUrl, {
          id: `schema-ach-evidenceUrl-${i}`,
          dedupeKey: `unsafe-url:achievements[${i}].evidenceUrl`,
          section: "Prestasi",
          field: `achievements[${i}].evidenceUrl`,
          itemId,
          message: `URL bukti prestasi '${ach.title || i}' tidak valid`,
        });
        checkSafeUrlField(ach.image, {
          id: `schema-ach-image-${i}`,
          dedupeKey: `unsafe-url:achievements[${i}].image`,
          section: "Prestasi",
          field: `achievements[${i}].image`,
          itemId,
          message: `Gambar prestasi '${ach.title || i}' tidak valid`,
        });
        checkSafeUrlField(ach.evidencePdf, {
          id: `schema-ach-evidencePdf-${i}`,
          dedupeKey: `unsafe-url:achievements[${i}].evidencePdf`,
          section: "Prestasi",
          field: `achievements[${i}].evidencePdf`,
          itemId,
          message: `URL PDF bukti prestasi '${ach.title || i}' tidak valid`,
        });
        checkSafeUrlField(ach.organizerLogo, {
          id: `schema-ach-organizerLogo-${i}`,
          dedupeKey: `unsafe-url:achievements[${i}].organizerLogo`,
          section: "Prestasi",
          field: `achievements[${i}].organizerLogo`,
          itemId,
          message: `URL logo penyelenggara prestasi '${ach.title || i}' tidak valid`,
        });
      }
    }
  }

  // 8. Validasi certificates
  if (obj.certificates !== undefined) {
    if (!Array.isArray(obj.certificates)) {
      pushIssue({
        id: "schema-certificates-not-array",
        dedupeKey: "schema:certificates-not-array",
        section: "Sertifikat",
        field: "certificates",
        message: "Field 'certificates' harus berupa array",
      });
    } else if (obj.certificates.length > 60) {
      pushIssue({
        id: "schema-certificates-max",
        dedupeKey: "limit:certificates.length",
        section: "Sertifikat",
        field: "certificates",
        message: "Jumlah sertifikat melebihi batas maksimal 60 item",
      });
    } else {
      for (let i = 0; i < obj.certificates.length; i++) {
        const cert = obj.certificates[i] as Partial<CertificateItem>;
        if (!cert || typeof cert !== "object") {
          pushIssue({
            id: `schema-cert-invalid-${i}`,
            dedupeKey: `schema:certificates[${i}]`,
            section: "Sertifikat",
            field: `certificates[${i}]`,
            message: `Sertifikat ke-${i + 1} tidak valid`,
          });
          continue;
        }
        const itemId = typeof cert.id === "string" && cert.id ? cert.id : `cert-${i}`;
        if (typeof cert.title === "string" && cert.title.length > 150) {
          pushIssue({
            id: `schema-cert-title-len-${i}`,
            dedupeKey: `limit:certificates[${i}].title`,
            section: "Sertifikat",
            field: `certificates[${i}].title`,
            itemId,
            message: `Judul sertifikat '${cert.title.slice(0, 20)}...' terlalu panjang (maks 150 karakter)`,
          });
        }
        checkSafeUrlField(cert.credentialUrl, {
          id: `cert-url-unsafe-${i}-credentialUrl`,
          dedupeKey: `unsafe-url:certificates[${i}].credentialUrl`,
          section: "Sertifikat",
          field: `certificates[${i}].credentialUrl`,
          itemId,
          message: `URL kredensial sertifikat '${cert.title || i}' tidak valid`,
        });
        checkSafeUrlField(cert.credentialPdf, {
          id: `cert-url-unsafe-${i}-credentialPdf`,
          dedupeKey: `unsafe-url:certificates[${i}].credentialPdf`,
          section: "Sertifikat",
          field: `certificates[${i}].credentialPdf`,
          itemId,
          message: `URL PDF sertifikat '${cert.title || i}' tidak valid`,
        });
        checkSafeUrlField(cert.issuerLogo, {
          id: `cert-url-unsafe-${i}-issuerLogo`,
          dedupeKey: `unsafe-url:certificates[${i}].issuerLogo`,
          section: "Sertifikat",
          field: `certificates[${i}].issuerLogo`,
          itemId,
          message: `URL logo penerbit sertifikat '${cert.title || i}' tidak valid`,
        });
        checkSafeUrlField(cert.image, {
          id: `cert-url-unsafe-${i}-image`,
          dedupeKey: `unsafe-url:certificates[${i}].image`,
          section: "Sertifikat",
          field: `certificates[${i}].image`,
          itemId,
          message: `Gambar sertifikat '${cert.title || i}' tidak valid`,
        });
        if (
          cert.verificationStatus !== undefined &&
          cert.verificationStatus !== "unverified" &&
          cert.verificationStatus !== "verified" &&
          cert.verificationStatus !== "needs_reverification"
        ) {
          pushIssue({
            id: `schema-cert-status-${i}`,
            dedupeKey: `schema:certificates[${i}].verificationStatus`,
            section: "Sertifikat",
            field: `certificates[${i}].verificationStatus`,
            itemId,
            message: `Status verifikasi sertifikat '${cert.title || i}' tidak valid`,
          });
        }
        if (cert.verifiedAt !== undefined && typeof cert.verifiedAt !== "string") {
          pushIssue({
            id: `schema-cert-verifiedAt-${i}`,
            dedupeKey: `schema:certificates[${i}].verifiedAt`,
            section: "Sertifikat",
            field: `certificates[${i}].verifiedAt`,
            itemId,
            message: `Format waktu verifikasi sertifikat '${cert.title || i}' tidak valid`,
          });
        }
        if (
          cert.verifiedEvidenceHash !== undefined &&
          (typeof cert.verifiedEvidenceHash !== "string" || cert.verifiedEvidenceHash.length > 128)
        ) {
          pushIssue({
            id: `schema-cert-hash-${i}`,
            dedupeKey: `schema:certificates[${i}].verifiedEvidenceHash`,
            section: "Sertifikat",
            field: `certificates[${i}].verifiedEvidenceHash`,
            itemId,
            message: `Sidik bukti sertifikat '${cert.title || i}' tidak valid`,
          });
        }
      }
    }
  }

  // 9. Validasi techStack & techStackCategories
  if (obj.techStackCategories !== undefined) {
    if (!Array.isArray(obj.techStackCategories)) {
      pushIssue({
        id: "schema-stack-cats-not-array",
        dedupeKey: "schema:techStackCategories-not-array",
        section: "Tech Stack",
        field: "techStackCategories",
        message: "Field 'techStackCategories' harus berupa array",
      });
    } else if (obj.techStackCategories.length > 20) {
      pushIssue({
        id: "schema-stack-cats-max",
        dedupeKey: "limit:techStackCategories.length",
        section: "Tech Stack",
        field: "techStackCategories",
        message: "Jumlah kategori tech stack melebihi batas maksimal 20 item",
      });
    } else {
      const seenKeys = new Set<string>();
      for (let i = 0; i < obj.techStackCategories.length; i++) {
        const cat = obj.techStackCategories[i] as Partial<TechStackCategoryConfig>;
        if (!cat || typeof cat !== "object") {
          pushIssue({
            id: `schema-stack-cat-invalid-${i}`,
            dedupeKey: `schema:techStackCategories[${i}]`,
            section: "Tech Stack",
            field: `techStackCategories[${i}]`,
            message: `Kategori tech stack #${i + 1} tidak valid`,
          });
          continue;
        }
        const key = typeof cat.key === "string" ? cat.key.trim() : "";
        if (!key) {
          pushIssue({
            id: `stack-cat-key-missing-${i}`,
            dedupeKey: `stack-cat-key-missing:${i}`,
            section: "Tech Stack",
            field: `techStackCategories[${i}].key`,
            message: `Kategori tech stack #${i + 1} wajib memiliki ID key yang tidak kosong`,
          });
        } else {
          if (key.length > 50) {
            pushIssue({
              id: `schema-stack-cat-key-len-${i}`,
              dedupeKey: `limit:techStackCategories[${i}].key`,
              section: "Tech Stack",
              field: `techStackCategories[${i}].key`,
              message: `ID kategori tech stack '${key}' terlalu panjang (maksimal 50 karakter)`,
            });
          }
          if (key.toLowerCase() === "other") {
            pushIssue({
              id: `stack-cat-key-reserved-${i}`,
              dedupeKey: `stack-cat-key-reserved:${i}`,
              section: "Tech Stack",
              field: `techStackCategories[${i}].key`,
              message: "ID kategori 'other' dicadangkan untuk kategori fallback sistem",
            });
          }
          const lower = key.toLowerCase();
          if (seenKeys.has(lower)) {
            pushIssue({
              id: `stack-cat-key-dup-${i}`,
              dedupeKey: `stack-cat-key-dup:${i}`,
              section: "Tech Stack",
              field: `techStackCategories[${i}].key`,
              message: `Duplikasi ID kategori tech stack '${key}' tidak diizinkan`,
            });
          }
          seenKeys.add(lower);
        }
        if (cat.labelId !== undefined && typeof cat.labelId !== "string") {
          pushIssue({
            id: `schema-stack-cat-labelId-${i}`,
            dedupeKey: `schema:techStackCategories[${i}].labelId`,
            section: "Tech Stack",
            field: `techStackCategories[${i}].labelId`,
            message: `Label ID kategori tech stack '${key || i + 1}' harus berupa string`,
          });
        }
        if (cat.labelEn !== undefined && typeof cat.labelEn !== "string") {
          pushIssue({
            id: `schema-stack-cat-labelEn-${i}`,
            dedupeKey: `schema:techStackCategories[${i}].labelEn`,
            section: "Tech Stack",
            field: `techStackCategories[${i}].labelEn`,
            message: `Label EN kategori tech stack '${key || i + 1}' harus berupa string`,
          });
        }
      }
    }
  }

  if (obj.techStack !== undefined) {
    if (!Array.isArray(obj.techStack)) {
      pushIssue({
        id: "schema-stack-not-array",
        dedupeKey: "schema:techStack-not-array",
        section: "Tech Stack",
        field: "techStack",
        message: "Field 'techStack' harus berupa array",
      });
    } else if (obj.techStack.length > 50) {
      pushIssue({
        id: "schema-stack-max",
        dedupeKey: "limit:techStack.length",
        section: "Tech Stack",
        field: "techStack",
        message: "Jumlah alat pada tech stack melebihi batas maksimal 50 item",
      });
    } else {
      for (let i = 0; i < obj.techStack.length; i++) {
        const item = obj.techStack[i] as Partial<TechStackItem>;
        const itemId = typeof item?.id === "string" && item.id ? item.id : `tech-${i}`;
        checkSafeUrlField(item?.icon, {
          id: `stack-icon-unsafe-${i}`,
          dedupeKey: `unsafe-url:techStack[${i}].icon`,
          section: "Tech Stack",
          field: `techStack[${i}].icon`,
          itemId,
          message: `Ikon teknologi '${item?.name || i}' tidak valid`,
        });
        checkSafeUrlField(item?.url, {
          id: `stack-url-unsafe-${i}`,
          dedupeKey: `unsafe-url:techStack[${i}].url`,
          section: "Tech Stack",
          field: `techStack[${i}].url`,
          itemId,
          message: `Tautan teknologi '${item?.name || i}' tidak valid`,
        });
        if (item?.category !== undefined && typeof item.category !== "string") {
          pushIssue({
            id: `schema-stack-cat-type-${i}`,
            dedupeKey: `schema:techStack[${i}].category`,
            section: "Tech Stack",
            field: `techStack[${i}].category`,
            itemId,
            message: `Kategori teknologi '${item?.name || i}' harus berupa string ID kategori`,
          });
        }
      }
    }
  }

  // 10. Validasi services
  if (obj.services !== undefined) {
    if (!Array.isArray(obj.services)) {
      pushIssue({
        id: "schema-services-not-array",
        dedupeKey: "schema:services-not-array",
        section: "Layanan",
        field: "services",
        message: "Field 'services' harus berupa array",
      });
    } else if (obj.services.length > 12) {
      pushIssue({
        id: "schema-services-max",
        dedupeKey: "limit:services.length",
        section: "Layanan",
        field: "services",
        message: "Jumlah layanan melebihi batas maksimal 12 item",
      });
    } else {
      for (let i = 0; i < obj.services.length; i++) {
        const s = obj.services[i] as Partial<ServiceItemConfig>;
        const itemId = typeof s?.id === "string" && s.id ? s.id : `service-${i}`;
        checkSafeUrlField(s?.ctaUrl, {
          id: `schema-srv-ctaUrl-${i}`,
          dedupeKey: `unsafe-url:services[${i}].ctaUrl`,
          section: "Layanan",
          field: `services[${i}].ctaUrl`,
          itemId,
          message: `URL CTA layanan '${s?.titleId || i}' tidak aman`,
        });
      }
    }
  }

  // 11. Validasi faq
  if (obj.faq !== undefined) {
    if (!Array.isArray(obj.faq)) {
      pushIssue({
        id: "schema-faq-not-array",
        dedupeKey: "schema:faq-not-array",
        section: "FAQ",
        field: "faq",
        message: "Field 'faq' harus berupa array",
      });
    } else if (obj.faq.length > 30) {
      pushIssue({
        id: "schema-faq-max",
        dedupeKey: "limit:faq.length",
        section: "FAQ",
        field: "faq",
        message: "Jumlah FAQ melebihi batas maksimal 30 item",
      });
    }
  }

  // 12. Validasi blog
  if (obj.blog !== undefined) {
    const blog = obj.blog as Partial<BlogConfig>;
    if (blog && typeof blog === "object") {
      if (blog.sourceMode === "manual") {
        checkSafeUrlField(blog.feedUrl, {
          id: "blog-feed-url-unsafe",
          dedupeKey: "unsafe-url:blog.feedUrl",
          section: "Blog",
          field: "blog.feedUrl",
          message: "URL feed blog menggunakan protokol tidak aman",
        });
      } else if (typeof blog.feedUrl === "string" && blog.feedUrl.trim()) {
        const feedSyntax = validatePublicFeedUrlSyntax(blog.feedUrl);
        if (!feedSyntax.ok) {
          pushIssue({
            id: "blog-feed-url-unsafe",
            dedupeKey: "unsafe-url:blog.feedUrl",
            section: "Blog",
            field: "blog.feedUrl",
            message: feedSyntax.errorMessage,
          });
        }
      }
      checkSafeUrlField(blog.portalUrl, {
        id: "blog-portal-url-unsafe",
        dedupeKey: "unsafe-url:blog.portalUrl",
        section: "Blog",
        field: "blog.portalUrl",
        message: "URL portal blog menggunakan protokol tidak aman",
      });
      if (Array.isArray(blog.manualPosts)) {
        blog.manualPosts.forEach((post, postIdx) => {
          const itemId = typeof post?.id === "string" && post.id ? post.id : `blog-${postIdx}`;
          checkSafeUrlField(post?.url, {
            id: `blog-post-url-unsafe-${postIdx}`,
            dedupeKey: `unsafe-url:blog.manualPosts[${postIdx}].url`,
            section: "Blog",
            field: `blog.manualPosts[${postIdx}]`,
            itemId,
            message: `URL artikel blog '${post?.title || ""}' tidak aman`,
          });
          checkSafeUrlField(post?.coverImage, {
            id: `blog-post-cover-unsafe-${postIdx}`,
            dedupeKey: `unsafe-url:blog.manualPosts[${postIdx}].coverImage`,
            section: "Blog",
            field: `blog.manualPosts[${postIdx}]`,
            itemId,
            message: `URL gambar cover blog '${post?.title || ""}' tidak aman`,
          });
        });
      }
    }
  }

  // 13. Validasi headerLogoUrl, navigation, contactSection & seo
  if (typeof obj.headerLogoUrl === "string") {
    checkSafeUrlField(obj.headerLogoUrl, {
      id: "nav-headerLogoUrl-unsafe",
      dedupeKey: "unsafe-url:headerLogoUrl",
      section: "Navigasi",
      field: "headerLogoUrl",
      message: "URL logo header menggunakan protokol tidak aman",
    });
  }
  if (Array.isArray(obj.navigation)) {
    (obj.navigation as Array<{ id?: string; labelId?: string; href?: string }>).forEach((nav, navIdx) => {
      checkSafeUrlField(nav?.href, {
        id: `nav-href-invalid-${navIdx}`,
        dedupeKey: `nav-href-invalid:${navIdx}`,
        section: "Navigasi",
        field: `navigation[${navIdx}].href`,
        ...(typeof nav?.id === "string" && nav.id ? { itemId: nav.id } : {}),
        message: `Target navigasi '${nav?.labelId || nav?.href || ""}' tidak aman`,
      });
    });
  }
  if (obj.seo && typeof obj.seo === "object") {
    const seo = obj.seo as {
      ogImage?: string;
      canonicalUrl?: string;
      googleVerification?: string;
      bingVerification?: string;
      yandexVerification?: string;
      indexNowKey?: string;
    };
    checkSafeUrlField(seo.ogImage, {
      id: "seo-og-image-unsafe",
      dedupeKey: "unsafe-url:seo.ogImage",
      section: "SEO",
      field: "seo.ogImage",
      message: "URL OG image SEO menggunakan protokol tidak aman",
    });
    checkSafeUrlField(seo.canonicalUrl, {
      id: "seo-canonical-unsafe",
      dedupeKey: "unsafe-url:seo.canonicalUrl",
      section: "SEO",
      field: "seo.canonicalUrl",
      message: "URL kanonikal SEO menggunakan protokol tidak aman",
    });

    const checkVerificationToken = (token: unknown, fieldName: string, label: string) => {
      if (token === undefined || token === null || token === "") return;
      if (typeof token !== "string") {
        pushIssue({
          id: `seo-${fieldName}-invalid`,
          dedupeKey: `seo-token-type:${fieldName}`,
          section: "SEO",
          field: `seo.${fieldName}`,
          message: `Token ${label} harus berupa teks`,
        });
        return;
      }
      if (token.length > 128) {
        pushIssue({
          id: `seo-${fieldName}-too-long`,
          dedupeKey: `seo-token-len:${fieldName}`,
          section: "SEO",
          field: `seo.${fieldName}`,
          message: `Token ${label} melebihi batas 128 karakter`,
        });
      }
      if (/<[^>]*>?/gm.test(token) || /["'<>]/.test(token)) {
        pushIssue({
          id: `seo-${fieldName}-malformed`,
          dedupeKey: `seo-token-format:${fieldName}`,
          section: "SEO",
          field: `seo.${fieldName}`,
          message: `Token ${label} mengandung karakter atau tag HTML yang tidak diizinkan`,
        });
      }
    };

    checkVerificationToken(seo.googleVerification, "googleVerification", "Google Search Console");
    checkVerificationToken(seo.bingVerification, "bingVerification", "Bing Webmaster");
    checkVerificationToken(seo.yandexVerification, "yandexVerification", "Yandex Webmaster");
    checkVerificationToken(seo.indexNowKey, "indexNowKey", "IndexNow API Key");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, issues };
  }

  return { isValid: true, errors: [], issues: [] };
}

export function validateSiteConfigPayload(raw: unknown): ValidationResult {
  const result = validateSiteConfigStructured(raw);
  if (!result.isValid) {
    return { isValid: false, errors: result.errors };
  }
  return { isValid: true, errors: [] };
}
