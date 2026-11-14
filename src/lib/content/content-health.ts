import type { SiteConfig, ContentHealthReport, ContentHealthIssue } from "./types";

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
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function auditContentHealth(config: Partial<SiteConfig>): ContentHealthReport {
  const issues: ContentHealthIssue[] = [];

  // ===================== 1. GENERAL PROFILE & CONTACT =====================
  const profile = config.generalProfile;
  if (!profile?.name || !profile.name.trim()) {
    issues.push({
      id: "profile-name-missing",
      field: "generalProfile.name",
      section: "Profil",
      severity: "error",
      message: "Nama lengkap pemilik portofolio wajib diisi.",
      suggestion: "Masukkan nama lengkap, misal 'Zakaria Mujur Prasetyo'.",
    });
  }

  if (profile?.email && !EMAIL_REGEX.test(profile.email.trim())) {
    issues.push({
      id: "profile-email-invalid",
      field: "generalProfile.email",
      section: "Kontak",
      severity: "error",
      message: `Format email '${profile.email}' tidak valid.`,
      suggestion: "Gunakan format alamat email standar (nama@domain.com).",
    });
  }

  if (!profile?.heroDescEn || !profile.heroDescEn.trim()) {
    issues.push({
      id: "profile-hero-desc-en-missing",
      field: "generalProfile.heroDescEn",
      section: "Profil",
      severity: "warning",
      message: "Deskripsi Hero versi Bahasa Inggris masih kosong.",
      suggestion: "Isi teks hero EN agar pengunjung internasional memahami latar belakang Anda.",
    });
  }

  (profile?.socials || []).forEach((social, idx) => {
    if (!isSafeUrl(social.href)) {
      issues.push({
        id: `social-unsafe-url-${idx}`,
        field: `generalProfile.socials[${idx}].href`,
        section: "Kontak",
        severity: "error",
        message: `Tautan sosial '${social.label}' mengandung protokol tidak aman.`,
      });
    }
  });

  // ===================== 2. PROJECTS COLLECTION =====================
  const projects = config.projects || [];
  projects.forEach((proj, idx) => {
    if (!proj.title || !proj.title.trim()) {
      issues.push({
        id: `project-title-missing-${idx}`,
        field: `projects[${idx}].title`,
        section: "Proyek",
        severity: "error",
        message: `Proyek #${idx + 1} tidak memiliki judul.`,
      });
    }

    if (!isSafeUrl(proj.repo) || !isSafeUrl(proj.previewUrl)) {
      issues.push({
        id: `project-url-unsafe-${idx}`,
        field: `projects[${idx}].url`,
        section: "Proyek",
        severity: "error",
        message: `Tautan repositori atau demo pada proyek '${proj.title}' mengandung skema tidak aman.`,
      });
    }

    if (!proj.image || !proj.image.trim()) {
      issues.push({
        id: `project-image-missing-${idx}`,
        field: `projects[${idx}].image`,
        section: "Proyek",
        severity: "warning",
        message: `Proyek '${proj.title}' belum memiliki gambar thumbnail cover.`,
        suggestion: "Unggah gambar cover WebP agar kartu proyek tampak menarik.",
      });
    }

    if (proj.image && !proj.image.endsWith(".webp") && !proj.image.startsWith("data:")) {
      issues.push({
        id: `project-image-not-webp-${idx}`,
        field: `projects[${idx}].image`,
        section: "Proyek",
        severity: "info",
        message: `Gambar proyek '${proj.title}' bukan format WebP.`,
        suggestion: "Format WebP menghemat bandwidth dan mempercepat loading kartu.",
      });
    }

    if (!proj.titleEn) {
      issues.push({
        id: `project-title-en-missing-${idx}`,
        field: `projects[${idx}].titleEn`,
        section: "Proyek",
        severity: "info",
        message: `Judul Bahasa Inggris untuk proyek '${proj.title}' belum diisi.`,
      });
    }
  });

  // ===================== 3. EDUCATION COLLECTION =====================
  const education = config.education || [];
  const currentYear = new Date().getFullYear();
  education.forEach((edu, idx) => {
    if (!edu.institution || !edu.institution.trim()) {
      issues.push({
        id: `edu-institution-missing-${idx}`,
        field: `education[${idx}].institution`,
        section: "Pendidikan",
        severity: "error",
        message: `Riwayat pendidikan #${idx + 1} tidak memiliki nama institusi.`,
      });
    }

    if (edu.startYear && edu.endYear && edu.startYear > edu.endYear) {
      issues.push({
        id: `edu-year-invalid-${idx}`,
        field: `education[${idx}].startYear`,
        section: "Pendidikan",
        severity: "error",
        message: `Tahun mulai (${edu.startYear}) lebih besar dari tahun lulus (${edu.endYear}) pada '${edu.institution}'.`,
      });
    }

    if (edu.startYear && edu.startYear > currentYear + 1) {
      issues.push({
        id: `edu-start-year-future-${idx}`,
        field: `education[${idx}].startYear`,
        section: "Pendidikan",
        severity: "warning",
        message: `Tahun mulai (${edu.startYear}) berada di masa depan yang tidak realistis.`,
      });
    }
  });

  // ===================== 4. CAREER & EXPERIENCE =====================
  const experience = config.experience || [];
  experience.forEach((exp, idx) => {
    if (!exp.role || !exp.role.trim()) {
      issues.push({
        id: `exp-role-missing-${idx}`,
        field: `experience[${idx}].role`,
        section: "Karier",
        severity: "error",
        message: `Pengalaman karier #${idx + 1} tidak memiliki jabatan/peran.`,
      });
    }
    if (!exp.org || !exp.org.trim()) {
      issues.push({
        id: `exp-org-missing-${idx}`,
        field: `experience[${idx}].org`,
        section: "Karier",
        severity: "error",
        message: `Pengalaman karier #${idx + 1} tidak memiliki nama instansi/organisasi.`,
      });
    }
  });

  // ===================== 5. ACHIEVEMENTS & CERTIFICATES =====================
  const certificates = config.certificates || [];
  certificates.forEach((cert, idx) => {
    if (!cert.title || !cert.title.trim()) {
      issues.push({
        id: `cert-title-missing-${idx}`,
        field: `certificates[${idx}].title`,
        section: "Sertifikat",
        severity: "error",
        message: `Sertifikat #${idx + 1} tidak memiliki nama sertifikat.`,
      });
    }

    if (!isSafeUrl(cert.credentialUrl) || !isSafeUrl(cert.credentialPdf)) {
      issues.push({
        id: `cert-url-unsafe-${idx}`,
        field: `certificates[${idx}].credentialUrl`,
        section: "Sertifikat",
        severity: "error",
        message: `Tautan kredensial pada sertifikat '${cert.title}' mengandung skema tidak aman.`,
      });
    }

    if (!cert.credentialUrl && !cert.credentialPdf) {
      issues.push({
        id: `cert-proof-missing-${idx}`,
        field: `certificates[${idx}].credentialUrl`,
        section: "Sertifikat",
        severity: "info",
        message: `Sertifikat '${cert.title}' belum memiliki bukti verifikasi (URL / PDF).`,
      });
    }
  });

  // ===================== 6. SERVICES =====================
  const services = config.services || [];
  services.forEach((srv, idx) => {
    if (!srv.titleId || !srv.titleId.trim()) {
      issues.push({
        id: `srv-title-missing-${idx}`,
        field: `services[${idx}].titleId`,
        section: "Layanan",
        severity: "warning",
        message: `Layanan #${idx + 1} tidak memiliki judul bahasa Indonesia.`,
      });
    }
    if (!srv.descId || !srv.descId.trim()) {
      issues.push({
        id: `srv-desc-missing-${idx}`,
        field: `services[${idx}].descId`,
        section: "Layanan",
        severity: "warning",
        message: `Deskripsi layanan '${srv.titleId || `#${idx + 1}`}' masih kosong.`,
      });
    }
  });

  // ===================== 7. TECH STACK =====================
  const techStack = config.techStack || [];
  techStack.forEach((tool, idx) => {
    if (!tool.name || !tool.name.trim()) {
      issues.push({
        id: `stack-tool-missing-${idx}`,
        field: `techStack[${idx}].name`,
        section: "Tech Stack",
        severity: "warning",
        message: `Alat/teknologi pada tech stack #${idx + 1} tidak memiliki nama.`,
      });
    }
  });

  // ===================== 8. CV DOCUMENTS =====================
  const cvDocs = config.cvDocs || [];
  cvDocs.forEach((doc, idx) => {
    if (!doc.pdfUrl || !doc.pdfUrl.trim()) {
      issues.push({
        id: `cv-pdf-missing-${idx}`,
        field: `cvDocs[${idx}].pdfUrl`,
        section: "CV",
        severity: "warning",
        message: `Berkas PDF CV untuk peran '${doc.title || doc.roleKey}' belum terpasang.`,
      });
    }
  });

  // ===================== 9. FAQ COLLECTION =====================
  const faq = config.faq || [];
  faq.forEach((item, idx) => {
    if (!item.questionId || !item.questionId.trim()) {
      issues.push({
        id: `faq-q-missing-${idx}`,
        field: `faq[${idx}].questionId`,
        section: "FAQ",
        severity: "error",
        message: `Pertanyaan FAQ #${idx + 1} kosong.`,
      });
    }
    if (!item.answerId || !item.answerId.trim()) {
      issues.push({
        id: `faq-a-missing-${idx}`,
        field: `faq[${idx}].answerId`,
        section: "FAQ",
        severity: "error",
        message: `Jawaban FAQ #${idx + 1} kosong.`,
      });
    }
  });

  // ===================== 10. BLOG, NAVIGASI & SEO =====================
  if (config.blog?.visible !== false) {
    if (config.blog?.sourceMode !== "manual" && config.blog?.feedUrl && !isSafeUrl(config.blog.feedUrl)) {
      issues.push({
        id: "blog-feed-url-unsafe",
        field: "blog.feedUrl",
        section: "Blog",
        severity: "error",
        message: "URL Feed Blog tidak menggunakan protokol aman.",
      });
    }
    (config.blog?.manualPosts || []).forEach((post, idx) => {
      if (!post.title?.trim() || !isSafeUrl(post.url)) {
        issues.push({
          id: `blog-post-invalid-${idx}`,
          field: `blog.manualPosts[${idx}]`,
          section: "Blog",
          severity: "error",
          message: `Artikel manual #${idx + 1} belum memiliki judul atau URL tidak valid.`,
        });
      }
    });
  }

  (config.navigation || []).forEach((nav, idx) => {
    if (!nav.href?.trim() || !isSafeUrl(nav.href)) {
      issues.push({
        id: `nav-href-invalid-${idx}`,
        field: `navigation[${idx}].href`,
        section: "Navigasi",
        severity: "error",
        message: `Target navigasi '${nav.labelId || idx + 1}' tidak valid.`,
      });
    }
  });

  if (config.seo) {
    if (!config.seo.metaTitle || !config.seo.metaTitle.trim()) {
      issues.push({
        id: "seo-title-missing",
        field: "seo.metaTitle",
        section: "SEO",
        severity: "warning",
        message: "Judul meta tag SEO halaman utama masih kosong.",
      });
    }
    if (!config.seo.metaDesc || !config.seo.metaDesc.trim()) {
      issues.push({
        id: "seo-desc-missing",
        field: "seo.metaDesc",
        section: "SEO",
        severity: "warning",
        message: "Deskripsi meta tag SEO masih kosong.",
      });
    }
  }

  // Score Calculation
  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infosCount = issues.filter((i) => i.severity === "info").length;

  let score = 100 - errorsCount * 25 - warningsCount * 5 - infosCount * 1;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    canPublish: errorsCount === 0,
    errorsCount,
    warningsCount,
    infosCount,
    issues,
    auditedAt: new Date().toISOString(),
  };
}
