import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Pixelify_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { AdaptivePerformanceProvider } from "@/lib/device-performance";
import { BuddyClient } from "@/components/buddy/buddy-client";
import { profile } from "@/lib/profile";
import { fetchPublishedContent } from "@/lib/content/public-content";
import {
  getPublishedFAQ,
  getPublishedProfile,
  getPublishedSeo,
} from "@/lib/content/selectors";
import "./globals.css";

export const dynamic = "force-dynamic";

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "700"],
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

const fontPixel = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
  weight: ["600", "700"],
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

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchPublishedContent();
  const pub = getPublishedProfile(config, "id");
  const seo = getPublishedSeo(config, "id");
  const name = pub.name;
  const brand = pub.brand;
  const siteUrl = seo.canonicalUrl || pub.site || profile.site;
  const metaTitle = seo.metaTitle || `${name} | ${pub.roles}`;
  const metaDesc = seo.metaDesc || pub.heroDesc;
  const ogImage = seo.ogImage || "/opengraph-image";
  const ogAlt = seo.ogImageAlt || `${name} - ${brand}`;
  const allowIndex = seo.robotsIndex !== false;

  return {
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
      languages: {
        "id-ID": "/",
        "en-US": "/",
        "x-default": "/",
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
      locale: "id_ID",
      alternateLocale: ["en_US"],
      url: siteUrl,
      siteName: brand,
      title: metaTitle,
      description: metaDesc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      creator: "@zekksparow",
      site: "@zekksparow",
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
    icons: {
      icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
      apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
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
  const config = await fetchPublishedContent();
  const pub = getPublishedProfile(config, "id");
  const seo = getPublishedSeo(config, "id");
  const pubFaq = getPublishedFAQ(config, "id");
  const name = pub.name;
  const brand = pub.brand;
  const siteUrl = seo.canonicalUrl || pub.site || profile.site;
  const email = pub.email;
  const phone = pub.phone;
  const bioIntro = pub.heroDesc;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: brand,
        description: seo.metaDesc || `Portfolio resmi ${name} (${brand})`,
        inLanguage: ["id-ID", "en-US"],
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
        image: seo.ogImage || `${siteUrl}/opengraph-image`,
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
        sameAs: pub.socials
          .filter((s) => s.href?.startsWith("http"))
          .map((s) => s.href),
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profilepage`,
        url: siteUrl,
        name: `${name} | Portfolio`,
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#person`,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
        primaryImageOfPage: seo.ogImage || `${siteUrl}/opengraph-image`,
      },
      ...(pubFaq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${siteUrl}/#faq`,
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
    <html lang="id" suppressHydrationWarning className={`${fontBody.variable} ${fontDisplay.variable} ${fontPixel.variable}`}>
      <body className="antialiased">
        <script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AdaptivePerformanceProvider>
            <SmoothScroll>
              {children}
              <BuddyClient />
            </SmoothScroll>
          </AdaptivePerformanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
