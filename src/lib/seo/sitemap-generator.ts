import type { SiteConfig } from "@/lib/site-config";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";
import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function resolveSitemapBaseUrl(request: Request, config: SiteConfig): string {
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");
  const hostHeader =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  return resolveSafeHostContext(hostHeader, seo.canonicalUrl || prof.site).siteUrl;
}

export function getSafeLastMod(config: SiteConfig): string {
  const parsedDate = config.updatedAt ? new Date(config.updatedAt) : null;
  const safeDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();
  return safeDate.toISOString();
}

/**
 * 1. MASTER SITEMAP INDEX (sitemap.xml)
 * Bercabang ke 6 sub-sitemap spesifik: main, services, projects, certificates, career, images
 */
export function buildSitemapIndexXml(baseUrl: string, lastMod: string): string {
  const subSitemaps = [
    `${baseUrl}/sitemap-main.xml`,
    `${baseUrl}/sitemap-services.xml`,
    `${baseUrl}/sitemap-projects.xml`,
    `${baseUrl}/sitemap-certificates.xml`,
    `${baseUrl}/sitemap-career.xml`,
    `${baseUrl}/sitemap-images.xml`,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${subSitemaps
  .map(
    (loc) => `  <sitemap>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

/**
 * 2. SUB-SITEMAP MAIN (sitemap-main.xml)
 * Halaman utama dengan alternate hreflang ID, EN, dan x-default
 */
export function buildMainSitemapXml(baseUrl: string, _config: SiteConfig, lastMod: string): string {
  const urls = [
    {
      loc: `${baseUrl}/`,
      priority: "1.0",
      changefreq: "daily",
      idUrl: `${baseUrl}/?lang=id`,
      enUrl: `${baseUrl}/?lang=en`,
      defaultUrl: `${baseUrl}/`,
    },
    {
      loc: `${baseUrl}/?lang=id`,
      priority: "0.9",
      changefreq: "daily",
      idUrl: `${baseUrl}/?lang=id`,
      enUrl: `${baseUrl}/?lang=en`,
      defaultUrl: `${baseUrl}/`,
    },
    {
      loc: `${baseUrl}/?lang=en`,
      priority: "0.9",
      changefreq: "daily",
      idUrl: `${baseUrl}/?lang=id`,
      enUrl: `${baseUrl}/?lang=en`,
      defaultUrl: `${baseUrl}/`,
    },
    {
      loc: `${baseUrl}/opengraph-image`,
      priority: "0.7",
      changefreq: "weekly",
    },
    {
      loc: `${baseUrl}/manifest.webmanifest`,
      priority: "0.5",
      changefreq: "monthly",
    },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${
      u.idUrl
        ? `
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(u.idUrl)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(u.enUrl!)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(u.defaultUrl!)}"/>`
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 3. SUB-SITEMAP SERVICES (sitemap-services.xml)
 * 4 pilar layanan utama dengan parameter bahasa dan hash target
 */
export function buildServicesSitemapXml(baseUrl: string, _config: SiteConfig, lastMod: string): string {
  const servicePillars = [
    { key: "ui-ux", titleId: "Desain UI/UX & Prototipe Interaktif", titleEn: "UI/UX Design & Interactive Prototyping" },
    { key: "frontend", titleId: "Frontend Engineering & Next.js", titleEn: "Frontend Engineering & Next.js" },
    { key: "creative-media", titleId: "Media Kreatif & Desain Grafis", titleEn: "Creative Media & Graphic Design" },
    { key: "it-support", titleId: "IT Support & Pemeliharaan Sistem", titleEn: "IT Support & Systems Maintenance" },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${xmlEscape(`${baseUrl}/#services`)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?lang=id#services`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?lang=en#services`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/#services`)}"/>
  </url>
${servicePillars
  .map(
    (p) => `  <url>
    <loc>${xmlEscape(`${baseUrl}/?service=${p.key}#services`)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?service=${p.key}&amp;lang=id#services`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?service=${p.key}&amp;lang=en#services`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/?service=${p.key}#services`)}"/>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 4. SUB-SITEMAP PROJECTS (sitemap-projects.xml)
 * Daftar karya & proyek portofolio
 */
export function buildProjectsSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const publishedProjects = (config.projects || []).filter((p) => p.published !== false);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${xmlEscape(`${baseUrl}/#proyek`)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?lang=id#proyek`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?lang=en#proyek`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/#proyek`)}"/>
  </url>
${publishedProjects
  .map(
    (p) => `  <url>
    <loc>${xmlEscape(`${baseUrl}/?project=${encodeURIComponent(p.id || p.title)}#proyek`)}</loc>
    <lastmod>${xmlEscape((p as unknown as { updatedAt?: string }).updatedAt || lastMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.featured ? "0.85" : "0.75"}</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?project=${encodeURIComponent(p.id || p.title)}&amp;lang=id#proyek`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?project=${encodeURIComponent(p.id || p.title)}&amp;lang=en#proyek`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/?project=${encodeURIComponent(p.id || p.title)}#proyek`)}"/>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 5. SUB-SITEMAP CERTIFICATES (sitemap-certificates.xml)
 * Kredensial sertifikasi profesional terverifikasi
 */
export function buildCertificatesSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const certs = config.certificates || [];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${xmlEscape(`${baseUrl}/#certificates`)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?lang=id#certificates`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?lang=en#certificates`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/#certificates`)}"/>
  </url>
${certs
  .map(
    (c) => `  <url>
    <loc>${xmlEscape(`${baseUrl}/?cert=${encodeURIComponent(c.id || c.title)}#certificates`)}</loc>
    <lastmod>${xmlEscape(c.date || lastMod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${c.featured ? "0.8" : "0.7"}</priority>
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${baseUrl}/?cert=${encodeURIComponent(c.id || c.title)}&amp;lang=id#certificates`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${baseUrl}/?cert=${encodeURIComponent(c.id || c.title)}&amp;lang=en#certificates`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${baseUrl}/?cert=${encodeURIComponent(c.id || c.title)}#certificates`)}"/>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 6. SUB-SITEMAP CAREER (sitemap-career.xml)
 * Berkas karier ATS, PDF CV, dan RSS feed artikel
 */
export function buildCareerSitemapXml(baseUrl: string, _config: SiteConfig, lastMod: string): string {
  const careerFiles = [
    { loc: `${baseUrl}/cv-ats-zakariamp-2025.pdf`, priority: "0.95", changefreq: "weekly" },
    { loc: `${baseUrl}/api/cv-pdf`, priority: "0.85", changefreq: "weekly" },
    { loc: `${baseUrl}/api/blog-feed`, priority: "0.85", changefreq: "daily" },
    { loc: `${baseUrl}/#cv`, priority: "0.9", changefreq: "weekly", bilingual: true },
    { loc: `${baseUrl}/#kontak`, priority: "0.85", changefreq: "monthly", bilingual: true },
    { loc: `${baseUrl}/cv-page-1.png`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/cv-page-2.png`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/cv-page-3.png`, priority: "0.7", changefreq: "monthly" },
    { loc: `${baseUrl}/cv-page-4.png`, priority: "0.7", changefreq: "monthly" },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${careerFiles
  .map(
    (f) => `  <url>
    <loc>${xmlEscape(f.loc)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>${f.changefreq}</changefreq>
    <priority>${f.priority}</priority>${
      f.bilingual
        ? `
    <xhtml:link rel="alternate" hreflang="id" href="${xmlEscape(`${f.loc}?lang=id`)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(`${f.loc}?lang=en`)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(f.loc)}"/>`
        : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 7. SUB-SITEMAP IMAGES (sitemap-images.xml)
 * Google Image Sitemap untuk memicu pengindeksan gambar di Google Lens & Google Image Search
 */
export function buildImagesSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const images = [
    {
      loc: `${baseUrl}/images/zakaria-profile-og.png`,
      title: "Zakaria Mujur Prasetyo - UI/UX Designer & Frontend Developer",
      caption: "Portofolio visual dan identitas resmi Zakaria Mujur Prasetyo",
    },
    {
      loc: `${baseUrl}/Profil-Zakaria Mujur Prasetyo.png`,
      title: "Foto Resmi Zakaria Mujur Prasetyo",
      caption: "Foto profil profesional Zakaria Mujur Prasetyo",
    },
    {
      loc: `${baseUrl}/card-front-v2.webp`,
      title: "Holographic 3D ID Card Frontend Developer",
      caption: "Kartu identitas interaktif UI/UX & Frontend Developer Zakaria Mujur Prasetyo",
    },
    {
      loc: `${baseUrl}/card-back-v2.webp`,
      title: "Holographic 3D ID Card Graphic Designer",
      caption: "Kartu identitas interaktif Graphic Designer Zakaria Mujur Prasetyo",
    },
    {
      loc: `${baseUrl}/images/bg-portrait-reveal.webp`,
      title: "Potret Zakaria Mujur Prasetyo Portrait Reveal",
      caption: "Visual potret seksi Tentang Zakaria Mujur Prasetyo",
    },
    ...(config.certificates || [])
      .filter((c) => Boolean(c.image))
      .map((c) => ({
        loc: c.image?.startsWith("http") ? c.image : `${baseUrl}${c.image?.startsWith("/") ? c.image : `/${c.image}`}`,
        title: `Sertifikat ${c.title} - ${c.issuer}`,
        caption: `Bukti kredensial terverifikasi ${c.title} dari ${c.issuer}`,
      })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${xmlEscape(`${baseUrl}/`)}</loc>
    <lastmod>${xmlEscape(lastMod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${images
  .map(
    (img) => `    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>
      <image:title>${xmlEscape(img.title)}</image:title>
      <image:caption>${xmlEscape(img.caption)}</image:caption>
    </image:image>`
  )
  .join("\n")}
  </url>
</urlset>`;
}
