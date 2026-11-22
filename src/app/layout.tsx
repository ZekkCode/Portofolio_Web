import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Space_Grotesk, Pixelify_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { AdaptivePerformanceProvider } from "@/lib/device-performance";
import { BuddyClient } from "@/components/buddy/buddy-client";
import { GlobalClickSound } from "@/components/global-click-sound";
import { profile } from "@/lib/profile";
import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";
import { fetchPublishedContent, fetchPublishedContentWithMeta } from "@/lib/content/public-content";
import { toPublicSiteConfig } from "@/lib/content/public-config-sanitizer";
import { SiteStoreBootstrapProvider } from "@/lib/site-store";
import { I18nLocaleProvider } from "@/components/i18n-locale-provider";
import {
  getPublishedCertificates,
  getPublishedEducation,
  getPublishedFAQ,
  getPublishedProfile,
  getPublishedSeo,
  getPublishedServices,
  getPublishedTechStack,
  isSectionVisible,
} from "@/lib/content/selectors";
import "./globals.css";

export const dynamic = "force-dynamic";

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fontPixel = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b45c4" },
    { media: "(prefers-color-scheme: dark)", color: "#08090e" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

function resolveAbsoluteUrl(rawUrl: string | undefined, baseUrl: string, fallbackPath: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const candidate = (rawUrl || "").trim() || fallbackPath;
  try {
    return new URL(candidate, `${cleanBase}/`).toString();
  } catch {
    return `${cleanBase}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`;
  }
}

function resolveGoogleVerificationTokens(configured?: string): string[] | string | undefined {
  const envTokens = [
    process.env.GOOGLE_SITE_VERIFICATION,
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  ]
    .filter(Boolean)
    .flatMap((s) => (s ? s.split(/[\s,]+/) : []));

  const all = Array.from(
    new Set([
      "HotKWrpmgwE_rH-fDU1SdAtEAmRRdRcRX4jXCG84K9Q", // zakariamp.id
      "zJPFsbAW4iSJjucKreBPM52cIAApE4NbeoIYI9OTSZ0", // zakariamp.my.id
      ...(configured ? configured.split(/[\s,]+/) : []),
      ...envTokens,
    ])
  )
    .map((t) => t.trim().replace(/^google-site-verification=/i, ""))
    .filter((t) => t.length > 0 && /^[a-zA-Z0-9_-]+$/.test(t));

  if (all.length === 0) return undefined;
  if (all.length === 1) return all[0];
  return all;
}

function resolveYandexVerificationToken(configured?: string): string | undefined {
  const envToken =
    process.env.YANDEX_SITE_VERIFICATION ||
    process.env.YANDEX_VERIFICATION ||
    process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;
  const token = (configured || envToken || "046d77b02ac682b5")
    .trim()
    .replace(/^yandex-verification=/i, "");
  return token || undefined;
}

function inferImageMimeType(url: string): string {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchPublishedContent();
  let rawHost = "";
  let reqLocale: "id" | "en" = "id";
  let explicitLang = "";
  let pathname = "/";
  try {
    const headerList = await headers();
    rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
    const hdrLang = headerList.get("x-zekk-lang")?.trim().toLowerCase();
    if (hdrLang === "en") reqLocale = "en";
    explicitLang = headerList.get("x-zekk-explicit-lang")?.trim().toLowerCase() || "";
    pathname = headerList.get("x-zekk-pathname") || "/";
  } catch {}

  const pub = getPublishedProfile(config, reqLocale);
  const seo = getPublishedSeo(config, reqLocale);
  const name = pub.name;
  const brand = pub.brand;
  const hostCtx = resolveSafeHostContext(rawHost, seo.canonicalUrl || pub.site);
  const siteUrl = hostCtx.siteUrl;
  const metaTitle = seo.metaTitle || `${name} | ${pub.roles}`;
  const metaDesc = seo.metaDesc || pub.heroDesc;
  const ogImage = seo.ogImage || "/opengraph-image";
  const ogAlt = seo.ogImageAlt || `${name} - ${brand}`;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const allowIndex = seo.robotsIndex !== false && hostCtx.isIndexableHost && !isAdminRoute;
  const canonicalPath =
    explicitLang === "en" ? "/?lang=en" : explicitLang === "id" ? "/?lang=id" : "/";
  const ogUrl = canonicalPath === "/" ? siteUrl : `${siteUrl}${canonicalPath}`;

  return {
    metadataBase: new URL(siteUrl),
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icons/site-icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [
        { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      ],
      shortcut: ["/favicon.ico"],
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        "id-ID": "/?lang=id",
        "en-US": "/?lang=en",
        "x-default": "/",
      },
    },
    verification: {
      google: resolveGoogleVerificationTokens(seo.googleVerification),
      yandex: resolveYandexVerificationToken(seo.yandexVerification),
      other: {
        ...(seo.bingVerification?.trim() ? { "msvalidate.01": seo.bingVerification.trim() } : {}),
      },
    },
    title: {
      default: metaTitle,
      template: `%s | ${brand}`,
    },
    description: metaDesc,
    applicationName: `${brand} Portfolio`,
    authors: [{ name, url: siteUrl }],
    generator: "Next.js",
    keywords:
      config.seo?.keywords && config.seo.keywords.length > 0
        ? config.seo.keywords
        : [
            name,
            brand,
            "Zekk",
            "zekksparow",
            "UI/UX Designer Indonesia",
            "Frontend Developer Indonesia",
            "Web Developer Mojokerto",
            "Web Developer Jawa Timur",
            "Desainer UI/UX Mojokerto",
            "Next.js Developer Indonesia",
            "React Developer",
            "TypeScript Developer",
            "Tailwind CSS",
            "Portfolio Web Developer",
            "Graphic Designer Freelance",
            "Jasa Pembuatan Website",
            "IT Support Specialist",
            "HIMATIF UTM",
          ],
    referrer: "origin-when-cross-origin",
    creator: name,
    publisher: brand,
    category: "technology",
    classification: "Portfolio & Professional Profile",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "profile",
      firstName: name.split(" ")[0] || "Zakaria",
      lastName: name.split(" ").slice(1).join(" ") || "Mujur Prasetyo",
      username: "zekksparow",
      gender: "male",
      locale: reqLocale === "en" ? "en_US" : "id_ID",
      alternateLocale: reqLocale === "en" ? ["id_ID"] : ["en_US"],
      url: ogUrl,
      siteName: brand,
      title: metaTitle,
      description: metaDesc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
          type: inferImageMimeType(ogImage),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: [ogImage],
    },
    robots: {
      index: allowIndex,
      follow: allowIndex,
      nocache: !allowIndex,
      googleBot: {
        index: allowIndex,
        follow: allowIndex,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.region": "ID-JI",
      "geo.placename": "Mojokerto",
      "geo.position": "-7.4726;112.4385",
      ICBM: "-7.4726, 112.4385",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishedMeta = await fetchPublishedContentWithMeta();
  const config = publishedMeta.config;
  const publicBootstrapConfig = toPublicSiteConfig(config);

  let rawLayoutHost = "";
  let locale: "id" | "en" = "id";
  let explicitLang = "";
  let pathname = "/";
  try {
    const headerList = await headers();
    rawLayoutHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
    const hdrLang = headerList.get("x-zekk-lang")?.trim().toLowerCase();
    if (hdrLang === "en") locale = "en";
    explicitLang = headerList.get("x-zekk-explicit-lang")?.trim().toLowerCase() || "";
    pathname = headerList.get("x-zekk-pathname") || "/";
  } catch {}

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const inLanguageTag = locale === "en" ? "en-US" : "id-ID";

  const pub = getPublishedProfile(config, locale);
  const seo = getPublishedSeo(config, locale);
  const pubFaq = isSectionVisible(config, "faq") ? getPublishedFAQ(config, locale) : [];
  const pubEducation = getPublishedEducation(config, locale);
  const pubCertificates = getPublishedCertificates(config, undefined, locale);
  const pubServices = getPublishedServices(config, locale);
  const pubStack = getPublishedTechStack(config, undefined, { locale });

  const name = pub.name;
  const brand = pub.brand;
  const siteUrl = resolveSafeHostContext(rawLayoutHost, seo.canonicalUrl || pub.site).siteUrl;
  const email = pub.email;
  const phone = pub.phone;
  const bioIntro = pub.heroDesc;
  const absoluteOgImage = resolveAbsoluteUrl(seo.ogImage, siteUrl, "/opengraph-image");
    const absolutePortraitUrl = `${siteUrl}/images/zakaria-profile-og.png`;
  const isHomePage = pathname === "/";
  const profilePageUrl = isHomePage
    ? locale === "en"
      ? `${siteUrl}/?lang=en`
      : siteUrl
    : `${siteUrl}${pathname}${explicitLang ? `?lang=${explicitLang}` : ""}`;

  const sameAsUrls = Array.from(
    new Set([
      ...pub.socials.filter((s) => s.href?.startsWith("http")).map((s) => s.href),
      "https://github.com/ZekkCode",
      "https://www.linkedin.com/in/zakariamp",
      "https://www.behance.net/zakariamp",
      "https://www.instagram.com/zekksparow",
      "https://www.tiktok.com/@zekksparow",
      "https://trakteer.id/zakariamp",
      "https://dev.to/zakariamp",
      "https://hashnode.com/@zakariamp",
      "https://medium.com/@zakariamp",
      "https://scholar.google.com/citations?user=nhYCbGEAAAAJ",
      "https://orcid.org/0009-0007-9676-4994",
      "https://www.researchgate.net/profile/Zakaria-Prasetyo",
      "https://trunojoyoac.academia.edu/ZakariaPrasetyo",
      "https://www.kaggle.com/zakariamujurprasetyo",
      "https://www.pinterest.com/zakariamp/",
      "https://dribbble.com/zakariamp",
      "https://codepen.io/zakariamp",
      "https://gitlab.com/zakariamp",
      "https://stackoverflow.com/users/33332144/zakariamp",
      "https://www.producthunt.com/@zakariamp",
      "https://peerlist.io/zakariamp",
      "https://daily.dev/zakariamp",
      "https://replit.com/@zakariamp",
      "https://www.deviantart.com/zakariamp",
      "https://www.semanticscholar.org/author/Zakaria-Mujur-Prasetyo/2487045050",
      "https://www.credly.com/users/zakaria-mujur-prasetyo.50693b80",
      "https://www.dicoding.com/users/zakariamp/academies",
      "https://www.skills.google/public_profiles/b30b5f7d-2984-4088-bdc3-b52e637021f7",
      "https://www.artstation.com/zakariamp",
      "https://www.awwwards.com/zakariamp/",
      "https://huggingface.co/zakariamp",
      ...(config.blog?.portalUrl?.startsWith("http") ? [config.blog.portalUrl] : []),
    ])
  );

  const knowsAbout = Array.from(
    new Set([
      ...pubServices.map((s) => s.title).filter(Boolean),
      ...pubStack.map((t) => t.name).filter(Boolean),
    ])
  ).slice(0, 16);

  const alumniOf = pubEducation
    .filter((edu) => edu.institution)
    .map((edu) => ({
      "@type": "EducationalOrganization",
      name: edu.institution,
    }));

  const credentials = pubCertificates
    .slice(0, 12)
    .filter((cert) => cert.title)
    .map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      name: cert.title,
      credentialCategory: cert.category || "Certificate",
      recognizedBy: {
        "@type": "Organization",
        name: cert.issuer,
      },
      ...(cert.credentialUrl?.startsWith("http") ? { url: cert.credentialUrl } : {}),
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: brand,
        description:
          seo.metaDesc ||
          (locale === "en" ? `Official portfolio of ${name} (${brand})` : `Portfolio resmi ${name} (${brand})`),
        inLanguage: inLanguageTag,
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name,
        alternateName: [pub.nickname, brand, config.profileCard?.handle || "zekksparow"],
        url: siteUrl,
        image: [absolutePortraitUrl, absoluteOgImage],
        jobTitle: seo.personJobTitle || pub.roles,
        description: bioIntro,
        gender: "Male",
        email,
        telephone: phone,
        knowsLanguage: ["id", "en"],
        address: {
          "@type": "PostalAddress",
          addressLocality: pub.location,
          addressCountry: "ID",
        },
        ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
        ...(alumniOf.length > 0 ? { alumniOf } : {}),
        ...(credentials.length > 0 ? { hasCredential: credentials } : {}),
        sameAs: sameAsUrls,
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profilepage`,
        url: profilePageUrl,
        name: `${name} | Portfolio`,
        inLanguage: inLanguageTag,
        ...(config.updatedAt ? { dateModified: config.updatedAt } : {}),
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#person`,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
        primaryImageOfPage: absoluteOgImage,
      },
      ...(isHomePage && pubFaq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${siteUrl}/#faq`,
              inLanguage: inLanguageTag,
              mainEntity: pubFaq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning className={`${fontBody.variable} ${fontDisplay.variable} ${fontPixel.variable}`}>
      <body className="antialiased">
        {!isAdminRoute && (
          <script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
          />
        )}
        <SiteStoreBootstrapProvider initialConfig={publicBootstrapConfig} updatedAt={publishedMeta.updatedAt}>
          <I18nLocaleProvider initialLocale={locale}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AdaptivePerformanceProvider>
                <SmoothScroll>
                  <GlobalClickSound />
                  {children}
                  <BuddyClient />
                </SmoothScroll>
              </AdaptivePerformanceProvider>
            </ThemeProvider>
          </I18nLocaleProvider>
        </SiteStoreBootstrapProvider>
      </body>
    </html>
  );
}
