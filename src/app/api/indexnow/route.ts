import { NextResponse } from "next/server";
import { fetchPublishedContent } from "@/lib/content/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url);
  let requestedKey = searchParams.get("key")?.trim();

  // Fallback membaca key langsung dari pathname jika rewritten
  if (!requestedKey) {
    const match = pathname.match(/\/([a-zA-Z0-9_-]+)\.txt$/);
    if (match) requestedKey = match[1];
  }

  if (!requestedKey || requestedKey.length < 8 || requestedKey === "robots") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const config = await fetchPublishedContent();
  const configuredKey = config.seo?.indexNowKey?.trim();

  // Verifikasi apakah key yang diminta cocok persis dengan key terdaftar di CMS
  if (configuredKey && requestedKey === configuredKey) {
    return new NextResponse(configuredKey, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  }

  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
