import type { MetadataRoute } from "next";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";
import { resolveCanonicalSiteUrl } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await fetchPublishedContent();
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");
  const baseUrl = resolveCanonicalSiteUrl(seo.canonicalUrl || prof.site);
  const fallbackDate = new Date("2025-01-01T00:00:00.000Z");
  const parsedDate = config.updatedAt ? new Date(config.updatedAt) : null;
  const safeLastMod = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : fallbackDate;
  const ogImageUrl = seo.ogImage?.startsWith("http")
    ? seo.ogImage
    : `${baseUrl}${seo.ogImage?.startsWith("/") ? seo.ogImage : "/opengraph-image"}`;

  return [
    {
      url: baseUrl,
      lastModified: safeLastMod,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [ogImageUrl, `${baseUrl}/images/zakaria-profile-og.png`],
    },
  ];
}
