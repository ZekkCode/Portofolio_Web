import type { SiteConfig } from "@/lib/site-config";

const isPublicItem = <T extends { published?: boolean; visible?: boolean }>(item: T): boolean =>
  item.published !== false && item.visible !== false;

/**
 * Menyaring objek `SiteConfig` sebelum dikirim ke pengunjung publik yang tidak terautentikasi:
 * 1. Menghapus seluruh item yang berstatus draf (`published === false`) atau tersembunyi (`visible === false`).
 * 2. Menghapus rahasia internal seperti `seo.indexNowKey`.
 * 3. Menyamarkan `pdfUrl` langsung pada dokumen CV apabila izin unduh dinonaktifkan (`allowDownload === false`),
 *    sehingga pratinjau modal tetap terlayani aman via `/api/cv-pdf` tanpa membocorkan object key R2 mentah.
 */
export function toPublicSiteConfig(config: SiteConfig): SiteConfig {
  const globalCvDownloadAllowed = config.cvSettings?.allowDownload !== false;

  const publicCvDocs = (config.cvDocs || [])
    .filter(isPublicItem)
    .map((doc) => {
      const canDownload = globalCvDownloadAllowed && doc.allowDownload !== false;
      if (canDownload) return doc;
      return {
        ...doc,
        pdfUrl: doc.pdfUrl ? `/api/cv-pdf?role=${encodeURIComponent(doc.roleKey)}` : undefined,
      };
    });

  return {
    ...config,
    projects: (config.projects || []).filter(isPublicItem),
    certificates: (config.certificates || []).filter(isPublicItem),
    education: (config.education || []).filter(isPublicItem),
    experience: (config.experience || []).filter(isPublicItem),
    achievements: (config.achievements || []).filter(isPublicItem),
    services: (config.services || []).filter(isPublicItem),
    faq: (config.faq || []).filter(isPublicItem),
    techStack: (config.techStack || []).filter((item) => item.visible !== false),
    cvDocs: publicCvDocs,
    blog: config.blog
      ? {
          ...config.blog,
          manualPosts: (config.blog.manualPosts || []).filter(isPublicItem),
        }
      : config.blog,
    seo: config.seo
      ? {
          ...config.seo,
          indexNowKey: undefined,
        }
      : config.seo,
  };
}
