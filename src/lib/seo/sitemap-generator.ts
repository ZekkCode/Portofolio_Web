import type { SiteConfig } from "@/lib/site-config";
import {
  getPublishedCertificates,
  getPublishedCvDocs,
  getPublishedCvSettings,
  getPublishedProfile,
  getPublishedProjects,
  getPublishedSeo,
} from "@/lib/content/selectors";
import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Menjamin URI pada <loc> dan <image:loc> valid menurut skema xsd:anyURI (tanpa spasi mentah)
  * tanpa melakukan double-encoding pada persen yang sudah valid.
   *
    * Catatan: jangan memakai decodeURI di sini, karena decodeURI membiarkan
     * urutan persen seperti %2F tetap ter-encode, lalu encodeURI mengubah
      * persennya menjadi %25 sehingga hasilnya %252F (double-encoding).
       */
export function encodeSafeSitemapUri(rawUrl: string): string {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) return "";
    try {
          return trimmed
            .split(/(%[0-9A-Fa-f]{2})/g)
            .map((part) => (/^%[0-9A-Fa-f]{2}$/.test(part) ? part : encodeURI(part)))
            .join("");
    } catch {
          return trimmed.replace(/ /g, "%20");
    }
}

/**
 * Menjamin nilai <lastmod> selalu sesuai standar W3C Datetime (YYYY-MM-DD atau ISO-8601 penuh).
 */
export function toValidW3cLastMod(rawDate: string | undefined, fallbackIso: string): string {
  const fallback =
    fallbackIso && !Number.isNaN(new Date(fallbackIso).getTime())
      ? new Date(fallbackIso).toISOString()
      : new Date().toISOString();

  if (!rawDate) return fallback;
  const trimmed = rawDate.trim();
  if (!trimmed) return fallback;

  if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(trimmed)) {
    const check = new Date(`${trimmed}T00:00:00.000Z`);
    if (!Number.isNaN(check.getTime())) return trimmed;
  }

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
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

function toAbsoluteAssetUrl(baseUrl: string, rawPath: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const trimmed = rawPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return encodeSafeSitemapUri(trimmed);
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return encodeSafeSitemapUri(`${cleanBase}${normalizedPath}`);
}

/**
 * 1. MASTER SITEMAP INDEX (sitemap.xml)
 * Merujuk ke sub-sitemap bersih tanpa duplikat hash maupun parameter fiktif.
 */
export function buildSitemapIndexXml(
  baseUrl: string,
  lastMod: string,
  config?: SiteConfig
): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const publishedProjects = config ? getPublishedProjects(config, { locale: "id" }) : [];

  const subSitemaps = [
    `${baseUrl}/sitemap-main.xml`,
    `${baseUrl}/sitemap-career.xml`,
    `${baseUrl}/sitemap-certificates.xml`,
    ...(publishedProjects.length > 0 ? [`${baseUrl}/sitemap-projects.xml`] : []),
    `${baseUrl}/sitemap-images.xml`,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${subSitemaps
  .map(
    (loc) => `  <sitemap>
    <loc>${xmlEscape(encodeSafeSitemapUri(loc))}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

/**
 * 2. SUB-SITEMAP MAIN (sitemap-main.xml)
 * Hanya berisi URL HTML kanonikal nyata (/, /?lang=id, /?lang=en) dengan hreflang timbal-balik bersih.
 */
export function buildMainSitemapXml(baseUrl: string, _config: SiteConfig, lastMod: string): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const rootUrl = encodeSafeSitemapUri(`${baseUrl}/`);
  const idUrl = encodeSafeSitemapUri(`${baseUrl}/?lang=id`);
  const enUrl = encodeSafeSitemapUri(`${baseUrl}/?lang=en`);

  const urls = [
    { loc: rootUrl, priority: "1.0", changefreq: "weekly" },
    { loc: idUrl, priority: "0.9", changefreq: "weekly" },
    { loc: enUrl, priority: "0.9", changefreq: "weekly" },
    { loc: encodeSafeSitemapUri(`${baseUrl}/certificates`), priority: "0.9", changefreq: "weekly" },
    { loc: encodeSafeSitemapUri(`${baseUrl}/projects`), priority: "0.9", changefreq: "weekly" },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <xhtml:link rel="alternate" hreflang="id-ID" href="${xmlEscape(idUrl)}"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${xmlEscape(enUrl)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(rootUrl)}"/>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 3. SUB-SITEMAP SERVICES (sitemap-services.xml)
 * Dipertahankan agar tidak 404 pada bookmark lama, tanpa parameter ?service= fiktif maupun #fragment.
 */
export function buildServicesSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  return buildMainSitemapXml(baseUrl, config, lastMod);
}

/**
 * 4. SUB-SITEMAP PROJECTS (sitemap-projects.xml)
 * Menampilkan studi kasus proyek terpublikasi beserta lampiran gambar tanpa duplikasi #proyek.
 */
export function buildProjectsSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const publishedProjects = getPublishedProjects(config, { locale: "id" });
  const rootUrl = encodeSafeSitemapUri(`${baseUrl}/`);

  const projectImages = publishedProjects
    .filter((p) => Boolean(p.image) && !p.image?.startsWith("data:"))
    .map((p) => ({
      loc: toAbsoluteAssetUrl(baseUrl, p.image!),
      title: p.title,
      caption: p.summary || p.desc || p.title,
    }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${xmlEscape(rootUrl)}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${
      projectImages.length > 0
        ? "\n" +
          projectImages
            .map(
              (img) => `    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>
      <image:title>${xmlEscape(img.title)}</image:title>
      <image:caption>${xmlEscape(img.caption)}</image:caption>
    </image:image>`
            )
            .join("\n")
        : ""
    }
  </url>
</urlset>`;
}

/**
 * 5. SUB-SITEMAP CERTIFICATES (sitemap-certificates.xml)
 * Berisi dokumen PDF bukti sertifikat publik dan indeks gambar sertifikat terverifikasi dengan tanggal W3C valid.
 */
export function buildCertificatesSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const certs = getPublishedCertificates(config, "all", "id");
  const rootUrl = encodeSafeSitemapUri(`${baseUrl}/`);

  const certImages = certs
    .filter((c) => Boolean(c.image) && !c.image?.startsWith("data:"))
    .map((c) => ({
      loc: toAbsoluteAssetUrl(baseUrl, c.image!),
      title: `${c.title} (${c.issuer}) [${c.id}]`,
      caption: `Sertifikat terverifikasi ${c.title} diterbitkan oleh ${c.issuer}`,
    }));

  const localPdfUrls = Array.from(
    new Set(
      certs
        .filter(
          (c) =>
            c.allowDownload !== false &&
            typeof c.credentialPdf === "string" &&
            c.credentialPdf.trim().startsWith("/") &&
            c.credentialPdf.trim().toLowerCase().endsWith(".pdf")
        )
        .map((c) => ({
          loc: toAbsoluteAssetUrl(baseUrl, c.credentialPdf!),
          lastmod: toValidW3cLastMod(c.date, cleanMod),
        }))
    )
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${xmlEscape(rootUrl)}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${
      certImages.length > 0
        ? "\n" +
          certImages
            .map(
              (img) => `    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>
      <image:title>${xmlEscape(img.title)}</image:title>
      <image:caption>${xmlEscape(img.caption)}</image:caption>
    </image:image>`
            )
            .join("\n")
        : ""
    }
  </url>${
    localPdfUrls.length > 0
      ? "\n" +
        localPdfUrls
          .map(
            (doc) => `  <url>
    <loc>${xmlEscape(doc.loc)}</loc>
    <lastmod>${xmlEscape(doc.lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`
          )
          .join("\n")
      : ""
  }
</urlset>`;
}

/**
 * 6. SUB-SITEMAP CAREER (sitemap-career.xml)
 * Hanya mendaftarkan dokumen PDF CV publik nyata tanpa endpoint JSON atau query di belakang hash.
 */
export function buildCareerSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const cvSettings = getPublishedCvSettings(config, "id");
  const cvDocs = getPublishedCvDocs(config, "id");

  const pdfLocs = new Set<string>();
  if (cvSettings.allowDownload !== false) {
    for (const doc of cvDocs) {
      if (
        doc.allowDownload !== false &&
        typeof doc.pdfUrl === "string" &&
        doc.pdfUrl.trim().toLowerCase().endsWith(".pdf") &&
        !doc.pdfUrl.trim().startsWith("data:")
      ) {
        pdfLocs.add(toAbsoluteAssetUrl(baseUrl, doc.pdfUrl));
      }
    }
    if (pdfLocs.size === 0) {
      pdfLocs.add(toAbsoluteAssetUrl(baseUrl, "/cv-ats-zakariamp-2025.pdf"));
    }
  }

  const urls =
    pdfLocs.size > 0
      ? Array.from(pdfLocs).map((loc) => ({ loc, priority: "0.9", changefreq: "monthly" }))
      : [{ loc: encodeSafeSitemapUri(`${baseUrl}/`), priority: "0.8", changefreq: "weekly" }];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * 7. SUB-SITEMAP IMAGES (sitemap-images.xml)
 * Google Image Sitemap bersih dengan URL ter-encode sesuai xsd:anyURI.
 */
export function buildImagesSitemapXml(baseUrl: string, config: SiteConfig, lastMod: string): string {
  const cleanMod = toValidW3cLastMod(lastMod, new Date().toISOString());
  const publishedProjects = getPublishedProjects(config, { locale: "id" });
  const publishedCerts = getPublishedCertificates(config, "all", "id");

  const rawImages = [
    {
      loc: toAbsoluteAssetUrl(baseUrl, "/images/zakaria-profile-og.png"),
      title: "Zakaria Mujur Prasetyo - UI/UX Designer & Frontend Developer",
      caption: "Portofolio visual dan identitas resmi Zakaria Mujur Prasetyo",
    },
    {
      loc: toAbsoluteAssetUrl(baseUrl, "/profile.webp"),
      title: "Foto Profil Zakaria Mujur Prasetyo",
      caption: "Potret resmi Zakaria Mujur Prasetyo (ZakariaMP)",
    },
    {
      loc: toAbsoluteAssetUrl(baseUrl, "/card-front-v2.webp"),
      title: "Kartu Identitas 3D Frontend Developer Zakaria Mujur Prasetyo",
      caption: "Kartu identitas interaktif UI/UX & Frontend Developer Zakaria Mujur Prasetyo",
    },
    {
      loc: toAbsoluteAssetUrl(baseUrl, "/card-back-v2.webp"),
      title: "Kartu Identitas 3D Graphic Designer Zakaria Mujur Prasetyo",
      caption: "Kartu identitas interaktif Graphic Designer Zakaria Mujur Prasetyo",
    },
    {
      loc: toAbsoluteAssetUrl(baseUrl, "/images/bg-portrait-reveal.webp"),
      title: "Potret Zakaria Mujur Prasetyo",
      caption: "Visual potret seksi Tentang Zakaria Mujur Prasetyo",
    },
    ...[1, 2, 3, 4].map((page) => ({
      loc: toAbsoluteAssetUrl(baseUrl, `/cv-page-${page}.png`),
      title: `Curriculum Vitae ATS Zakaria Mujur Prasetyo - Halaman ${page}`,
      caption: `Lembar ke-${page} berkas karier ATS Zakaria Mujur Prasetyo`,
    })),
    ...publishedProjects
      .filter((p) => Boolean(p.image) && !p.image?.startsWith("data:"))
      .map((p) => ({
        loc: toAbsoluteAssetUrl(baseUrl, p.image!),
        title: `${p.title} - Proyek Portofolio Zakaria Mujur Prasetyo`,
        caption: p.summary || p.desc || p.title,
      })),
    ...publishedCerts
      .filter((c) => Boolean(c.image) && !c.image?.startsWith("data:"))
      .map((c) => ({
        loc: toAbsoluteAssetUrl(baseUrl, c.image!),
        title: `Sertifikat ${c.title} - ${c.issuer}`,
        caption: `Bukti kredensial terverifikasi ${c.title} dari ${c.issuer}`,
      })),
  ];

  const seen = new Set<string>();
  const images = rawImages.filter((item) => {
    if (!item.loc || seen.has(item.loc)) return false;
    seen.add(item.loc);
    return true;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${xmlEscape(encodeSafeSitemapUri(`${baseUrl}/`))}</loc>
    <lastmod>${xmlEscape(cleanMod)}</lastmod>
    <changefreq>weekly</changefreq>
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
