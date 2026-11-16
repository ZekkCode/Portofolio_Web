import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { getPublishedProfile, getPublishedSeo } from "@/lib/content/selectors";
import { resolveCanonicalSiteUrl } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await fetchPublishedContent();
  const seo = getPublishedSeo(config, "id");
  const prof = getPublishedProfile(config, "id");

  let requestedHost = "";
  try {
    const headerList = await headers();
    requestedHost = (headerList.get("x-forwarded-host") || headerList.get("host") || "").toLowerCase();
  } catch {
    // fallback jika headers tidak tersedia saat build statis
  }

  // Tentukan baseUrl secara dinamis dan host-aware agar Googlebot tidak mengalami cross-domain sitemap error
  let baseUrl = resolveCanonicalSiteUrl(seo.canonicalUrl || prof.site);
  if (requestedHost.includes("zakariamp.my.id")) {
    baseUrl = "https://www.zakariamp.my.id";
  } else if (requestedHost.includes("zakariamp.id")) {
    baseUrl = "https://www.zakariamp.id";
  }

  // Timestamp selalu segar agar Googlebot mengenali pembaruan halaman
  const now = new Date();
  const parsedDate = config.updatedAt ? new Date(config.updatedAt) : null;
  const safeLastMod = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : now;

  const ogImageUrl = seo.ogImage?.startsWith("http")
    ? seo.ogImage
    : `${baseUrl}${seo.ogImage?.startsWith("/") ? seo.ogImage : "/opengraph-image"}`;

  return [
    {
      url: baseUrl,
      lastModified: safeLastMod,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: {
        languages: {
          id: baseUrl,
          en: baseUrl,
          "x-default": baseUrl,
        },
      },
      images: [
        ogImageUrl,
        `${baseUrl}/images/zakaria-profile-og.png`,
        `${baseUrl}/Profil-Zakaria Mujur Prasetyo.png`,
        `${baseUrl}/images/bg-portrait-reveal.webp`,
        `${baseUrl}/card-front-v2.webp`,
      ],
    },
  ];
}
