import type { MetadataRoute } from "next";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await fetchPublishedContent();
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");
  const baseUrl = (seo.canonicalUrl || prof.site || "https://zakariamp.vercel.app").replace(/\/$/, "");

  const allowRoot = seo.robotsIndex !== false;

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowRoot ? "/" : undefined,
        disallow: allowRoot ? ["/admin", "/admin/", "/api/", "/private/"] : ["/", "/admin", "/api/"],
      },
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot", "Applebot"],
        allow: allowRoot ? "/" : undefined,
        disallow: allowRoot ? ["/admin", "/admin/", "/api/", "/private/"] : ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
