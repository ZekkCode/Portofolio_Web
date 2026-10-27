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
          "id-ID": `${profile.site}/`,
          "en-US": `${profile.site}/`,
        },
      },
    },
  ];
}
