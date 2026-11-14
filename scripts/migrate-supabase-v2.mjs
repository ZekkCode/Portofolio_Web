#!/usr/bin/env node
/**
 * Migration Helper: Supabase `site_config` -> Schema v2 (Non-Destructive)
 *
 * Penggunaan:
 *   node scripts/migrate-supabase-v2.mjs            (default: --dry-run)
 *   node scripts/migrate-supabase-v2.mjs --apply    (tulis pembaruan ke Supabase)
 *
 * Fitur keamanan:
 * - Memuat .env.local / .env otomatis tanpa menuliskan secret ke repo.
 * - Membaca baris 'current', 'main' (legacy), 'draft', dan 'revisions_index'.
 * - Menyimpan backup timestamped ke .local-cms-store/backup-supabase-*.json sebelum menulis.
 * - Non-destruktif: HANYA mengisi field v2 yang belum ada (undefined/null) dan mengupgrade
 *   path aset legacy (/card-front.svg, /card-front.webp, /card-back.webp, /profile.webp)
 *   bila nilainya persis path lama tersebut. Semua proyek/teks kustom pengguna dipertahankan.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const args = new Set(process.argv.slice(2));
const applyMode = args.has("--apply");

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
  console.error(
    "[migrate-v2] SUPABASE_URL / key tidak ditemukan di .env.local atau environment."
  );
  process.exit(1);
}

const canWrite = Boolean(serviceRoleKey);
if (applyMode && !canWrite) {
  console.error(
    "[migrate-v2] Mode --apply memerlukan SUPABASE_SERVICE_ROLE_KEY agar aman melewati RLS."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const V2_SECTIONS_DEFAULTS = {
  hero: { visible: true, sortOrder: 0 },
  about: {
    visible: true,
    sortOrder: 1,
    titleId: "Tentang Saya",
    titleEn: "About Me",
    descId: "Merancang antarmuka web modern dan identitas visual yang konsisten sejak 2020.",
    descEn: "Crafting modern web interfaces and consistent visual identities since 2020.",
  },
  journey: {
    visible: true,
    sortOrder: 2,
    titleId: "Jejak Akademik",
    titleEn: "Academic Journey",
    descId: "Fondasi pendidikan, fokus studi, dan proyek keilmuan.",
    descEn: "Educational foundations, core studies, and academic projects.",
  },
  achievements: {
    visible: true,
    sortOrder: 3,
    titleId: "Prestasi & Rekognisi",
    titleEn: "Achievements & Recognition",
    descId: "Rekam jejak program resmi terpilih, kepemimpinan organisasi, dan pencapaian terverifikasi.",
    descEn: "Verified program milestones, leadership recognition, and competition achievements.",
  },
  services: {
    visible: true,
    sortOrder: 4,
    titleId: "Layanan",
    titleEn: "Services",
    descId: "Ruang lingkup desain, frontend engineering, dan dukungan sistem.",
    descEn: "Scope across product design, frontend engineering, and technical systems.",
  },
  cv: {
    visible: true,
    sortOrder: 5,
    titleId: "Folder Berkas Karir",
    titleEn: "Career Resume Folder",
    descId: "Kumpulan CV ATS untuk empat jalur keahlian utama.",
    descEn: "ATS-tailored resumes across core engineering and design disciplines.",
  },
  stack: {
    visible: true,
    sortOrder: 6,
    titleId: "Tech Stack & Alat",
    titleEn: "Tech Stack & Tools",
    descId: "Alat desain, bahasa pemrograman, framework, dan utilitas produksi.",
    descEn: "Design tools, programming languages, frameworks, and production utilities.",
  },
  projects: {
    visible: true,
    sortOrder: 7,
    titleId: "Proyek Terpilih",
    titleEn: "Selected Projects",
    descId: "Eksplorasi produk web, antarmuka pengguna, dan rekayasa frontend.",
    descEn: "Web products, UI architecture, and frontend engineering explorations.",
  },
  blog: {
    visible: true,
    sortOrder: 8,
    titleId: "Latest from ZekkTech Blog",
    titleEn: "Latest from ZekkTech Blog",
    descId: "Catatan, pembahasan, dan artikel seputar teknologi serta dunia digital.",
    descEn: "Notes, thoughts, and technical articles on design and web engineering.",
    ctaLabelId: "Semua Artikel di Blog",
    ctaLabelEn: "All Articles on Blog",
  },
  certificates: {
    visible: true,
    sortOrder: 9,
    titleId: "Sertifikasi & Kredensial",
    titleEn: "Certifications & Credentials",
    descId: "Sertifikasi kompetensi profesional terverifikasi.",
    descEn: "Verified professional certifications and credentials.",
  },
  faq: {
    visible: true,
    sortOrder: 10,
    titleId: "Pertanyaan Umum",
    titleEn: "FAQ",
    descId: "Jawaban singkat mengenai alur kerja, waktu pengerjaan, dan kolaborasi.",
    descEn: "Quick answers regarding scope, timelines, and collaboration.",
  },
  contact: {
    visible: true,
    sortOrder: 11,
    titleId: "Mulai Diskusi",
    titleEn: "Start a Conversation",
    descId: "Terbuka untuk kolaborasi proyek desain produk dan web engineering.",
    descEn: "Open for product design and frontend engineering collaborations.",
  },
};

const V2_NAVIGATION_DEFAULT = [
  { id: "nav-about", labelId: "Tentang", labelEn: "About", href: "#tentang", sectionKey: "about", iconName: "user", visible: true, sortOrder: 1 },
  { id: "nav-cv", labelId: "CV ATS", labelEn: "Resume", href: "#cv", sectionKey: "cv", iconName: "file-text", visible: true, sortOrder: 2 },
  { id: "nav-stack", labelId: "Tech Stack", labelEn: "Tech Stack", href: "#stack", sectionKey: "stack", iconName: "layers", visible: true, sortOrder: 3 },
  { id: "nav-projects", labelId: "Proyek", labelEn: "Projects", href: "#proyek", sectionKey: "projects", iconName: "folder", visible: true, sortOrder: 4 },
  { id: "nav-contact", labelId: "Kontak", labelEn: "Contact", href: "#kontak", sectionKey: "contact", iconName: "mail", visible: true, sortOrder: 5 },
];

const V2_FOOTER_DEFAULT = {
  brandText: "ZekkTech",
  emailLabelId: "Email",
  emailLabelEn: "Email",
  locationText: "Mojokerto, Indonesia",
  copyrightName: "Zakaria Mujur Prasetyo",
  taglineId: "Antarmuka web & produk digital.",
  taglineEn: "Web interfaces & digital products.",
  watermarkText: "zakaria mp",
  showWatermark: true,
  showSocials: true,
  showEmail: true,
};

const V2_CONTACT_DEFAULT = {
  badgeId: "Kontak",
  badgeEn: "Contact",
  titleId: "Mulai Diskusi",
  titleEn: "Start a Conversation",
  descId: "Punya kebutuhan desain antarmuka, pengembangan web, atau kolaborasi teknis? Kirim pesan langsung melalui email.",
  descEn: "Need interface design, web engineering, or technical collaboration? Send a message directly via email.",
  emailCtaId: "Kirim Email",
  emailCtaEn: "Send Email",
  secondaryCtaId: "Folder Berkas Karir",
  secondaryCtaEn: "Career Files",
  secondaryHref: "#cv",
};

const V2_CV_SETTINGS_DEFAULT = {
  allowDownload: true,
  folderHintId: "Klik folder untuk melebarkan berkas",
  folderHintEn: "Click folder to spread files",
  previewCtaId: "Lihat CV Lengkap",
  previewCtaEn: "Preview Full CV",
  downloadLabelId: "Unduh PDF",
  downloadLabelEn: "Download PDF",
};

const V2_PROJECT_CATEGORIES_DEFAULT = [
  { id: "pcat-it", key: "it", labelId: "IT & Software", labelEn: "IT & Software", sortOrder: 1, visible: true },
  { id: "pcat-design", key: "design", labelId: "Desain & UI/UX", labelEn: "Design & UI/UX", sortOrder: 2, visible: true },
  { id: "pcat-both", key: "both", labelId: "IT & Desain", labelEn: "IT & Design", sortOrder: 3, visible: true },
];

const V2_STACK_CATEGORIES_DEFAULT = [
  { key: "design", labelId: "Desain", labelEn: "Design", sortOrder: 1, visible: true },
  { key: "frontend", labelId: "Frontend", labelEn: "Frontend", sortOrder: 2, visible: true },
  { key: "systems", labelId: "Sistem & Data", labelEn: "Systems & Data", sortOrder: 3, visible: true },
  { key: "visual", labelId: "Visual & Media", labelEn: "Visual & Media", sortOrder: 4, visible: true },
];

function upgradeNonDestructiveV2(rawConfig) {
  const cfg = structuredClone(rawConfig || {});
  const changes = [];

  if (!cfg.schemaVersion || Number(cfg.schemaVersion) < 2) {
    cfg.schemaVersion = 2;
    changes.push("schemaVersion -> 2");
  }

  // Upgrade legacy Lanyard assets only if using exact retired paths
  if (cfg.lanyard && typeof cfg.lanyard === "object") {
    if (
      !cfg.lanyard.frontImage ||
      cfg.lanyard.frontImage === "/card-front.svg" ||
      cfg.lanyard.frontImage === "/card-front.webp"
    ) {
      cfg.lanyard.frontImage = "/card-front-v2.webp";
      changes.push("lanyard.frontImage -> /card-front-v2.webp");
    }
    if (!cfg.lanyard.backImage || cfg.lanyard.backImage === "/card-back.webp") {
      cfg.lanyard.backImage = "/card-back-v2.webp";
      changes.push("lanyard.backImage -> /card-back-v2.webp");
    }
  }

  if (cfg.generalProfile && typeof cfg.generalProfile === "object") {
    if (!cfg.generalProfile.avatarUrl || cfg.generalProfile.avatarUrl === "/profile.webp") {
      cfg.generalProfile.avatarUrl = "/card-front-v2.webp";
      changes.push("generalProfile.avatarUrl -> /card-front-v2.webp");
    }
    if (!cfg.generalProfile.aboutPersona) {
      cfg.generalProfile.aboutPersona = {
        frontImage: "/card-front-v2.webp",
        backImage: "/card-back-v2.webp",
        frontLabelId: "Frontend Dev",
        frontLabelEn: "Frontend Dev",
        frontCaptionId: "Antarmuka web & rekayasa interaktif",
        frontCaptionEn: "Web interfaces & interactive engineering",
        backLabelId: "Graphic Designer",
        backLabelEn: "Graphic Designer",
        backCaptionId: "Identitas visual & sistem multimedia",
        backCaptionEn: "Visual identity & multimedia systems",
      };
      changes.push("generalProfile.aboutPersona -> backfilled");
    }
  }

  if (cfg.profileCard && typeof cfg.profileCard === "object") {
    if (!cfg.profileCard.avatarUrl || cfg.profileCard.avatarUrl === "/profile.webp") {
      cfg.profileCard.avatarUrl = "/card-front-v2.webp";
      changes.push("profileCard.avatarUrl -> /card-front-v2.webp");
    }
    if (cfg.profileCard.miniAvatarUrl === "/profile.webp") {
      cfg.profileCard.miniAvatarUrl = "";
      changes.push("profileCard.miniAvatarUrl -> cleared legacy /profile.webp");
    }
  }

  // Backfill v2 sections safely (never re-add deleted user arrays, only add missing objects)
  if (!cfg.sections || typeof cfg.sections !== "object") {
    cfg.sections = structuredClone(V2_SECTIONS_DEFAULTS);
    changes.push("sections -> backfilled");
  } else {
    for (const [key, defVal] of Object.entries(V2_SECTIONS_DEFAULTS)) {
      if (!cfg.sections[key]) {
        cfg.sections[key] = structuredClone(defVal);
        changes.push(`sections.${key} -> backfilled`);
      }
    }
    if ("workflow" in cfg.sections) {
      delete cfg.sections.workflow;
      changes.push("sections.workflow -> removed (forbidden by repo rules)");
    }
  }

  if (!Array.isArray(cfg.sectionOrder) || cfg.sectionOrder.length === 0) {
    cfg.sectionOrder = [
      "about",
      "journey",
      "achievements",
      "services",
      "cv",
      "stack",
      "projects",
      "blog",
      "certificates",
      "faq",
      "contact",
    ];
    changes.push("sectionOrder -> backfilled");
  } else if (cfg.sectionOrder.includes("workflow")) {
    cfg.sectionOrder = cfg.sectionOrder.filter((k) => k !== "workflow");
    changes.push("sectionOrder -> removed workflow");
  }

  if (!Array.isArray(cfg.navigation) || cfg.navigation.length === 0) {
    cfg.navigation = structuredClone(V2_NAVIGATION_DEFAULT);
    changes.push("navigation -> backfilled");
  }
  if (!cfg.footer || typeof cfg.footer !== "object") {
    cfg.footer = structuredClone(V2_FOOTER_DEFAULT);
    changes.push("footer -> backfilled");
  }
  if (!cfg.contactSection || typeof cfg.contactSection !== "object") {
    cfg.contactSection = structuredClone(V2_CONTACT_DEFAULT);
    changes.push("contactSection -> backfilled");
  }
  if (!cfg.cvSettings || typeof cfg.cvSettings !== "object") {
    cfg.cvSettings = structuredClone(V2_CV_SETTINGS_DEFAULT);
    changes.push("cvSettings -> backfilled");
  }
  if (!Array.isArray(cfg.projectCategories) || cfg.projectCategories.length === 0) {
    cfg.projectCategories = structuredClone(V2_PROJECT_CATEGORIES_DEFAULT);
    changes.push("projectCategories -> backfilled");
  }
  if (!Array.isArray(cfg.techStackCategories) || cfg.techStackCategories.length === 0) {
    cfg.techStackCategories = structuredClone(V2_STACK_CATEGORIES_DEFAULT);
    changes.push("techStackCategories -> backfilled");
  }
  if (!cfg.seo || typeof cfg.seo !== "object") {
    cfg.seo = {
      metaTitle: "Zakaria Mujur Prasetyo | UI/UX & Frontend Developer",
      metaTitleEn: "Zakaria Mujur Prasetyo | UI/UX & Frontend Developer",
      metaDesc:
        cfg.generalProfile?.heroDesc ||
        "Mahasiswa Teknik Informatika & pengembang frontend antarmuka web modern.",
      metaDescEn:
        cfg.generalProfile?.heroDescEn ||
        "Informatics Engineering student & modern frontend web developer.",
      keywords: [
        "Zakaria Mujur Prasetyo",
        "ZekkTech",
        "UI/UX Designer",
        "Frontend Developer",
      ],
      ogImage: "/opengraph-image",
      ogImageAlt: "Zakaria Mujur Prasetyo - ZekkTech Portfolio",
      canonicalUrl: cfg.generalProfile?.site || "https://zakariamp.vercel.app",
      robotsIndex: true,
      personJobTitle: cfg.generalProfile?.roles || "UI/UX & Frontend Developer",
    };
    changes.push("seo -> backfilled");
  }

  return { upgraded: cfg, changes };
}

async function run() {
  console.log(`[migrate-v2] Mode: ${applyMode ? "APPLY (LIVE WRITE)" : "DRY-RUN (READ-ONLY)"}`);
  console.log(`[migrate-v2] Target Supabase URL: ${supabaseUrl}`);
  console.log(`[migrate-v2] Service Role tersedia: ${canWrite ? "Ya" : "Tidak (read-only)"}`);

  const targetIds = ["current", "main", "draft", "revisions_index"];
  const { data: rows, error } = await supabase
    .from("site_config")
    .select("id, config, updated_at")
    .in("id", targetIds);

  if (error) {
    console.error("[migrate-v2] Gagal membaca tabel site_config:", error.message);
    process.exit(1);
  }

  const rowMap = new Map((rows || []).map((r) => [r.id, r]));
  console.log(
    `[migrate-v2] Baris ditemukan: ${rows && rows.length > 0 ? rows.map((r) => r.id).join(", ") : "(kosong)"}`
  );

  if (!rows || rows.length === 0) {
    console.log("[migrate-v2] Belum ada baris di Supabase site_config. Tidak ada migrasi yang perlu diterapkan.");
    return;
  }

  // Simpan backup lokal sebelum menyentuh data apa pun
  const backupDir = path.resolve(process.cwd(), ".local-cms-store");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `backup-supabase-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ backedUpAt: new Date().toISOString(), rows }, null, 2));
  console.log(`[migrate-v2] Backup disimpan: ${backupPath}`);

  const migrateIds = ["current", "draft"].filter((id) => rowMap.has(id));
  if (migrateIds.length === 0 && rowMap.has("main")) {
    console.log("[migrate-v2] Hanya ditemukan baris legacy 'main'. Akan disalin secara non-destruktif ke 'current' bila --apply dijalankan.");
  }

  const workQueue = [];
  for (const id of ["current", "draft"]) {
    const existing = rowMap.get(id) || (id === "current" ? rowMap.get("main") : null);
    if (!existing || !existing.config || typeof existing.config !== "object") continue;

    const { upgraded, changes } = upgradeNonDestructiveV2(existing.config);
    console.log(`\n--- Dokumen '${id}' (source='${existing.id}', updated_at=${existing.updated_at}) ---`);
    console.log(`  projects: ${Array.isArray(upgraded.projects) ? upgraded.projects.length : 0}`);
    console.log(`  education: ${Array.isArray(upgraded.education) ? upgraded.education.length : 0}`);
    console.log(`  experience: ${Array.isArray(upgraded.experience) ? upgraded.experience.length : 0}`);
    console.log(`  certificates: ${Array.isArray(upgraded.certificates) ? upgraded.certificates.length : 0}`);
    console.log(`  lanyard.frontImage: ${upgraded.lanyard?.frontImage || "(unset)"}`);
    console.log(`  lanyard.backImage: ${upgraded.lanyard?.backImage || "(unset)"}`);
    console.log(`  profileCard.avatarUrl: ${upgraded.profileCard?.avatarUrl || "(unset)"}`);
    if (changes.length === 0 && existing.id === id) {
      console.log("  Perubahan diperlukan: Tidak ada (sudah kompatibel v2).");
    } else {
      console.log("  Perubahan v2:");
      for (const ch of changes) console.log(`   - ${ch}`);
      workQueue.push({ id, config: upgraded, updated_at: new Date().toISOString() });
    }
  }

  if (workQueue.length === 0) {
    console.log("\n[migrate-v2] Semua dokumen sudah sinkron dengan skema v2.");
    return;
  }

  if (!applyMode) {
    console.log("\n[migrate-v2] Dry-run selesai. Jalankan dengan --apply (plus SUPABASE_SERVICE_ROLE_KEY) untuk menerapkan perubahan.");
    return;
  }

  for (const item of workQueue) {
    const { error: upsertErr } = await supabase
      .from("site_config")
      .upsert(item, { onConflict: "id" });
    if (upsertErr) {
      console.error(`[migrate-v2] Gagal upsert '${item.id}':`, upsertErr.message);
      process.exit(1);
    }
    console.log(`[migrate-v2] Sukses memperbarui '${item.id}' ke skema v2.`);
  }
}

run().catch((err) => {
  console.error("[migrate-v2] Error tidak terduga:", err);
  process.exit(1);
});
