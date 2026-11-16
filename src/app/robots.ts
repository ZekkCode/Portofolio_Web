import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";
import { resolveCanonicalSiteUrl } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await fetchPublishedContent();
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");

  let requestedHost = "";
  try {
    const headerList = await headers();
    requestedHost = (headerList.get("x-forwarded-host") || headerList.get("host") || "").toLowerCase().trim();
  } catch {}

  let baseUrl = resolveCanonicalSiteUrl(seo.canonicalUrl || prof.site);
  if (requestedHost) {
    const cleanHost = requestedHost.split(":")[0];
    if (
      cleanHost.endsWith("zakariamp.my.id") ||
      cleanHost.endsWith("zakariamp.id") ||
      cleanHost.endsWith("vercel.app") ||
      cleanHost.includes("localhost")
    ) {
      baseUrl = `https://${requestedHost}`;
    }
  }

  const allowRoot = seo.robotsIndex !== false;

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowRoot ? "/" : undefined,
        disallow: allowRoot ? ["/admin", "/admin/", "/api/admin/", "/private/"] : ["/"],
      },
      {
        userAgent: [
          "Googlebot",
          "Googlebot-Image",
          "Bingbot",
          "Slurp",
          "DuckDuckBot",
          "Baiduspider",
          "YandexBot",
          "Applebot",
          "Bravebot",
        ],
        allow: allowRoot ? "/" : undefined,
        disallow: allowRoot ? ["/admin", "/admin/", "/api/admin/", "/private/"] : ["/"],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-main.xml`,
      `${baseUrl}/sitemap-services.xml`,
      `${baseUrl}/sitemap-projects.xml`,
      `${baseUrl}/sitemap-certificates.xml`,
      `${baseUrl}/sitemap-career.xml`,
      `${baseUrl}/sitemap-images.xml`,
      "https://www.zakariamp.id/sitemap.xml",
      "https://zakariamp.id/sitemap.xml",
      "https://www.zakariamp.my.id/sitemap.xml",
      "https://zakariamp.my.id/sitemap.xml",
    ],
    host: baseUrl,
  };
}
