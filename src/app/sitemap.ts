import type { MetadataRoute } from "next";
import { profile } from "@/lib/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  // Tanggal pembaruan rilis portofolio aktual
  const lastModified = new Date("2026-10-29T00:00:00.000Z");

  return [
    {
      url: profile.site,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
