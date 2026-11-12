import type { SiteConfig } from "@/lib/site-config";
import { extractR2Key } from "@/lib/r2";

export interface MediaCatalogItem {
  id: string;
  url: string;
  key?: string;
  type: "image" | "pdf" | "vector" | "other";
  category: "identity" | "projects" | "certificates" | "cv" | "appearance" | "stack";
  source: string;
  isReferenced: boolean;
  fileExt: string;
}

/**
 * Memindai seluruh berkas media yang sedang aktif ditautkan di dalam konfigurasi situs.
 */
export function scanReferencedMedia(config: Partial<SiteConfig>): MediaCatalogItem[] {
  const items: MediaCatalogItem[] = [];
  const seenUrls = new Set<string>();

  const add = (url: string | undefined, source: string, category: MediaCatalogItem["category"]) => {
    if (!url || typeof url !== "string" || !url.trim()) return;
    const cleanUrl = url.trim();
    if (seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);

    let type: MediaCatalogItem["type"] = "image";
    let fileExt = "webp";

    if (cleanUrl.toLowerCase().endsWith(".pdf")) {
      type = "pdf";
      fileExt = "pdf";
    } else if (cleanUrl.toLowerCase().endsWith(".svg")) {
      type = "vector";
      fileExt = "svg";
    } else if (cleanUrl.toLowerCase().endsWith(".png")) {
      fileExt = "png";
    } else if (cleanUrl.toLowerCase().endsWith(".jpg") || cleanUrl.toLowerCase().endsWith(".jpeg")) {
      fileExt = "jpg";
    }

    const key = extractR2Key(cleanUrl);

    items.push({
      id: `media-${items.length + 1}`,
      url: cleanUrl,
      key: key || undefined,
      type,
      category,
      source,
      isReferenced: true,
      fileExt,
    });
  };

  // 1. Profil & Identitas
  if (config.headerLogoUrl) add(config.headerLogoUrl, "Header Brand Logo", "identity");
  if (config.generalProfile?.avatarUrl) add(config.generalProfile.avatarUrl, "Foto Avatar Profil", "identity");

  // 2. Tampilan 3D & Hero
  if (config.lanyard?.frontImage) add(config.lanyard.frontImage, "Lanyard Depan", "appearance");
  if (config.lanyard?.backImage) add(config.lanyard.backImage, "Lanyard Belakang", "appearance");
  if (config.lanyard?.strapImage) add(config.lanyard.strapImage, "Lanyard Tali", "appearance");
  if (config.profileCard?.avatarUrl) add(config.profileCard.avatarUrl, "Profile Card Avatar", "appearance");
  if (config.profileCard?.iconUrl) add(config.profileCard.iconUrl, "Profile Card Icon", "appearance");
  if (config.profileCard?.miniAvatarUrl) add(config.profileCard.miniAvatarUrl, "Profile Card Mini Avatar", "appearance");

  // 3. Proyek
  (config.projects || []).forEach((p) => {
    if (p.image) add(p.image, `Cover: ${p.title}`, "projects");
    (p.galleryImages || []).forEach((g, i) => add(g, `Galeri #${i + 1}: ${p.title}`, "projects"));
  });

  // 4. Sertifikat & Prestasi
  (config.certificates || []).forEach((c) => {
    if (c.image) add(c.image, `Sertifikat: ${c.title}`, "certificates");
    if (c.credentialPdf) add(c.credentialPdf, `PDF Sertifikat: ${c.title}`, "certificates");
  });
  (config.achievements || []).forEach((a) => {
    if (a.image) add(a.image, `Prestasi: ${a.title}`, "certificates");
  });

  // 5. Dokumen CV ATS
  (config.cvDocs || []).forEach((doc) => {
    if (doc.pdfUrl) add(doc.pdfUrl, `PDF CV ATS (${doc.roleKey})`, "cv");
    (doc.pages || []).forEach((pg, i) => add(pg, `Halaman ${i + 1} CV (${doc.roleKey})`, "cv"));
  });

  // 6. Pengalaman & Tech Stack
  (config.experience || []).forEach((exp) => {
    if (exp.logo) add(exp.logo, `Logo Organisasi: ${exp.org}`, "identity");
  });
  (config.techStack || []).forEach((stk) => {
    if (stk.icon) add(stk.icon, `Ikon Stack: ${stk.name}`, "stack");
  });

  return items;
}

/**
 * Memeriksa apakah suatu berkas URL/Key masih digunakan di konfigurasi aktif.
 */
export function isMediaReferenced(urlOrKey: string, config: Partial<SiteConfig>): boolean {
  if (!urlOrKey) return false;
  const configStr = JSON.stringify(config);
  const key = extractR2Key(urlOrKey);
  return configStr.includes(urlOrKey) || (Boolean(key) && configStr.includes(key));
}
