import type { SiteConfig } from "@/lib/site-config";
import { extractR2Key } from "./r2-key";

export interface MediaCatalogItem {
  id: string;
  url: string;
  key?: string;
  type: "image" | "pdf" | "vector" | "other";
  category:
    | "identity"
    | "projects"
    | "certificates"
    | "cv"
    | "appearance"
    | "stack"
    | "education"
    | "experience"
    | "achievements"
    | "services"
    | "blog"
    | "seo";
  source: string;
  sources: string[];
  isReferenced: boolean;
  fileExt: string;
}

function inferMediaType(cleanUrl: string): { type: MediaCatalogItem["type"]; fileExt: string } {
  const lower = cleanUrl.split("?")[0].toLowerCase();
  if (lower.endsWith(".pdf") || cleanUrl.startsWith("data:application/pdf")) {
    return { type: "pdf", fileExt: "pdf" };
  }
  if (lower.endsWith(".svg") || cleanUrl.startsWith("data:image/svg")) {
    return { type: "vector", fileExt: "svg" };
  }
  if (lower.endsWith(".png") || cleanUrl.startsWith("data:image/png")) {
    return { type: "image", fileExt: "png" };
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || cleanUrl.startsWith("data:image/jpeg")) {
    return { type: "image", fileExt: "jpg" };
  }
  if (lower.endsWith(".webp") || cleanUrl.startsWith("data:image/webp")) {
    return { type: "image", fileExt: "webp" };
  }
  return { type: "other", fileExt: "bin" };
}

/**
 * Memindai seluruh berkas media yang sedang aktif ditautkan di dalam konfigurasi situs.
 */
export function scanReferencedMedia(config: Partial<SiteConfig>): MediaCatalogItem[] {
  const byUrl = new Map<string, MediaCatalogItem>();

  const add = (
    url: string | undefined,
    source: string,
    category: MediaCatalogItem["category"]
  ) => {
    if (!url || typeof url !== "string" || !url.trim()) return;
    const cleanUrl = url.trim();
    const existing = byUrl.get(cleanUrl);
    if (existing) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
        existing.source = existing.sources.join(" • ");
      }
      return;
    }

    const { type, fileExt } = inferMediaType(cleanUrl);
    const key = extractR2Key(cleanUrl);

    byUrl.set(cleanUrl, {
      id: `media-${byUrl.size + 1}`,
      url: cleanUrl,
      key: key || undefined,
      type,
      category,
      source,
      sources: [source],
      isReferenced: true,
      fileExt,
    });
  };

  // 1. Profil, Identitas & Hero
  if (config.headerLogoUrl) add(config.headerLogoUrl, "Header Brand Logo", "identity");
  if (config.generalProfile?.avatarUrl) add(config.generalProfile.avatarUrl, "Foto Avatar Profil", "identity");
  if (config.generalProfile?.aboutPersona?.frontImage) {
    add(config.generalProfile.aboutPersona.frontImage, "About Persona Card (Depan)", "identity");
  }
  if (config.generalProfile?.aboutPersona?.backImage) {
    add(config.generalProfile.aboutPersona.backImage, "About Persona Card (Belakang)", "identity");
  }
  (config.generalProfile?.socials || []).forEach((soc) => {
    if (soc.iconUrl) add(soc.iconUrl, `Ikon Sosial: ${soc.label}`, "identity");
  });

  // 2. Tampilan 3D & ProfileCard
  if (config.lanyard?.frontImage) add(config.lanyard.frontImage, "Lanyard Depan", "appearance");
  if (config.lanyard?.backImage) add(config.lanyard.backImage, "Lanyard Belakang", "appearance");
  if (config.lanyard?.strapImage) add(config.lanyard.strapImage, "Lanyard Tali", "appearance");
  if (config.profileCard?.avatarUrl) add(config.profileCard.avatarUrl, "Profile Card Avatar", "appearance");
  if (config.profileCard?.iconUrl) add(config.profileCard.iconUrl, "Profile Card Icon", "appearance");
  if (config.profileCard?.miniAvatarUrl) add(config.profileCard.miniAvatarUrl, "Profile Card Mini Avatar", "appearance");

  // 3. Proyek
  (config.projects || []).forEach((p) => {
    if (p.image) add(p.image, `Cover Proyek: ${p.title}`, "projects");
    if (p.logo) add(p.logo, `Logo Proyek: ${p.title}`, "projects");
    (p.galleryImages || []).forEach((g, i) => add(g, `Galeri #${i + 1}: ${p.title}`, "projects"));
  });

  // 4. Pendidikan & Pengalaman
  (config.education || []).forEach((edu) => {
    if (edu.logo) add(edu.logo, `Logo Sekolah/Kampus: ${edu.institution}`, "education");
  });
  (config.experience || []).forEach((exp) => {
    if (exp.logo) add(exp.logo, `Logo Organisasi/Kerja: ${exp.org}`, "experience");
    (exp.media || []).forEach((m, idx) => {
      if (m.url) add(m.url, `Media Karier #${idx + 1}: ${exp.org}`, "experience");
    });
  });

  // 5. Sertifikat & Prestasi
  (config.certificates || []).forEach((c) => {
    if (c.image) add(c.image, `Gambar Sertifikat: ${c.title}`, "certificates");
    if (c.issuerLogo) add(c.issuerLogo, `Logo Penerbit Sertifikat: ${c.issuer}`, "certificates");
    if (c.credentialPdf) add(c.credentialPdf, `PDF Sertifikat: ${c.title}`, "certificates");
  });
  (config.achievements || []).forEach((a) => {
    if (a.image) add(a.image, `Gambar Prestasi: ${a.title}`, "achievements");
    if (a.organizerLogo) add(a.organizerLogo, `Logo Penyelenggara Prestasi: ${a.organizer}`, "achievements");
    if (a.evidencePdf) add(a.evidencePdf, `PDF Bukti Prestasi: ${a.title}`, "achievements");
  });

  // 6. Dokumen CV ATS
  (config.cvDocs || []).forEach((doc) => {
    if (doc.pdfUrl) add(doc.pdfUrl, `PDF CV (${doc.roleKey})`, "cv");
    if (doc.thumbnailUrl) add(doc.thumbnailUrl, `Thumbnail CV (${doc.roleKey})`, "cv");
    (doc.pages || []).forEach((pg, i) => add(pg, `Halaman ${i + 1} CV (${doc.roleKey})`, "cv"));
  });

  // 7. Tech Stack & Services
  (config.techStack || []).forEach((stk) => {
    if (stk.icon) add(stk.icon, `Ikon Stack: ${stk.name}`, "stack");
  });
  (config.services || []).forEach((srv) => {
    if (srv.iconUrl) add(srv.iconUrl, `Ikon Layanan: ${srv.titleId}`, "services");
  });

  // 8. Blog & SEO
  (config.blog?.manualPosts || []).forEach((post) => {
    if (post.coverImage) add(post.coverImage, `Cover Blog Manual: ${post.title}`, "blog");
  });
  Object.entries(config.blog?.syncedOverrides || {}).forEach(([id, ov]) => {
    if (ov.coverImage) add(ov.coverImage, `Cover Blog Override (${id})`, "blog");
  });
  if (config.seo?.ogImage) {
    add(config.seo.ogImage, "OpenGraph / Social Share Image", "seo");
  }

  return Array.from(byUrl.values());
}

/**
 * Mengembalikan daftar lokasi penggunaan suatu URL atau R2 key dalam konfigurasi.
 */
export function getMediaUsageSources(
  urlOrKey: string,
  config: Partial<SiteConfig>
): string[] {
  if (!urlOrKey) return [];
  const cleanTarget = urlOrKey.trim();
  const targetKey = extractR2Key(cleanTarget) || cleanTarget;
  const catalog = scanReferencedMedia(config);
  const sources: string[] = [];

  for (const item of catalog) {
    if (
      item.url === cleanTarget ||
      item.key === targetKey ||
      item.url.includes(targetKey)
    ) {
      sources.push(...item.sources);
    }
  }
  return Array.from(new Set(sources));
}

/**
 * Memeriksa apakah suatu berkas URL/Key masih digunakan di konfigurasi aktif.
 */
export function isMediaReferenced(urlOrKey: string, config: Partial<SiteConfig>): boolean {
  if (!urlOrKey) return false;
  if (getMediaUsageSources(urlOrKey, config).length > 0) return true;
  const key = extractR2Key(urlOrKey);
  const configStr = JSON.stringify(config);
  return configStr.includes(urlOrKey) || (Boolean(key) && configStr.includes(key));
}
