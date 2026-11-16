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
    requestedHost = (headerList.get("x-forwarded-host") || headerList.get("host") || "").toLowerCase();
  } catch {}

  let baseUrl = resolveCanonicalSiteUrl(seo.canonicalUrl || prof.site);
  if (requestedHost.includes("zakariamp.my.id")) {
    baseUrl = "https://www.zakariamp.my.id";
  } else if (requestedHost.includes("zakariamp.id")) {
    baseUrl = "https://www.zakariamp.id";
  }

  const allowRoot = seo.robotsIndex !== false;

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowRoot ? "/" : undefined,
        disallow: allowRoot ? ["/admin", "/admin/", "/api/", "/private/"] : ["/", "/admin", "/api/"],
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
        disallow: allowRoot ? ["/admin", "/admin/", "/api/", "/private/"] : ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
