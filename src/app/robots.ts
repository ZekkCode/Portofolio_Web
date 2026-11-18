import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { fetchPublishedContentFast } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";
import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await fetchPublishedContentFast(220);
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");

  let requestedHost = "";
  try {
    const headerList = await headers();
    requestedHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  } catch {}

  const hostCtx = resolveSafeHostContext(requestedHost, seo.canonicalUrl || prof.site);
  const baseUrl = hostCtx.siteUrl;
  const allowRoot = seo.robotsIndex !== false && hostCtx.isIndexableHost;

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
    sitemap: allowRoot ? [`${baseUrl}/sitemap.xml`] : [],
    ...(allowRoot ? { host: baseUrl } : {}),
  };
}
