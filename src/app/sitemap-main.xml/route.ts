import { NextResponse } from "next/server";
import { fetchPublishedContent } from "@/lib/content/public-content";
import { buildMainSitemapXml, getSafeLastMod, resolveSitemapBaseUrl } from "@/lib/seo/sitemap-generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = await fetchPublishedContent();
  const baseUrl = resolveSitemapBaseUrl(request, config);
  const lastMod = getSafeLastMod(config);
  const xml = buildMainSitemapXml(baseUrl, config, lastMod);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
