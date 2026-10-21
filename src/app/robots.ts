import type { MetadataRoute } from "next";
import { profile } from "@/lib/profile";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider", "YandexBot", "Applebot"],
        allow: "/",
        disallow: ["/admin"],
      },
    ],
    sitemap: `${profile.site}/sitemap.xml`,
    host: profile.site,
  };
}
