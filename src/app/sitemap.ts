import type { MetadataRoute } from "next";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await fetchPublishedContent();
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");
  const baseUrl = (seo.canonicalUrl || prof.site || "https://zakariamp.vercel.app").replace(/\/$/, "");
  const lastModified = config.updatedAt ? new Date(config.updatedAt) : new Date();

  return [
    {
      url: baseUrl,
      lastModified: Number.isNaN(lastModified.getTime()) ? new Date() : lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
