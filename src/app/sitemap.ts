import type { MetadataRoute } from "next";
import { profile } from "@/lib/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: profile.site,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          id: `${profile.site}/`,
          en: `${profile.site}/`,
        },
      },
    },
    {
      url: `${profile.site}/#tentang`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${profile.site}/#cv`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${profile.site}/#stack`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${profile.site}/#proyek`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${profile.site}/#kontak`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];
}
