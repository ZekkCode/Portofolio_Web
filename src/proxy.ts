import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const rawLang = searchParams.get("lang")?.trim().toLowerCase();
  const explicitLang = rawLang === "en" || rawLang === "id" ? rawLang : "";

  const cookieLang = request.cookies.get("zekk_lang")?.value?.trim().toLowerCase();
  const resolvedLocale: "id" | "en" =
    explicitLang === "en"
      ? "en"
      : explicitLang === "id"
        ? "id"
        : cookieLang === "en"
          ? "en"
          : "id";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-zekk-lang", resolvedLocale);
  requestHeaders.set("x-zekk-explicit-lang", explicitLang);
  requestHeaders.set("x-zekk-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const rawHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0];

  const isPreviewHost = rawHost.endsWith(".vercel.app");
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isPreviewHost || isAdminPath) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (explicitLang === "en" || explicitLang === "id") {
    response.cookies.set("zekk_lang", explicitLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|sitemap.*\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|pdf|mp3|wav|ogg|txt|woff|woff2)$).*)",
  ],
};
