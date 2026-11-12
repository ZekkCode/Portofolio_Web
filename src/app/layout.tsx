import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Pixelify_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { AdaptivePerformanceProvider } from "@/lib/device-performance";
import { BuddyClient } from "@/components/buddy/buddy-client";
import { profile } from "@/lib/profile";
import { translations } from "@/lib/translations";
import { fetchPublishedContent } from "@/lib/content/public-content";
import "./globals.css";

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
  const name = config.generalProfile?.name || profile.name;
  const brand = config.generalProfile?.brand || profile.brand;
  const roles = config.generalProfile?.roles || "UI/UX Designer & Frontend Developer";
  const siteUrl = config.generalProfile?.site || profile.site;
  const metaTitle = config.seo?.metaTitle || `${name} | ${roles}`;
  const metaDesc =
    config.seo?.metaDesc ||
    config.generalProfile?.heroDesc ||
    "Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer, Frontend Developer, dan Graphic Designer asal Mojokerto, Jawa Timur. Eksplorasi berkas CV interaktif, proyek Next.js, dan desain antarmuka.";
  const ogImage = config.seo?.ogImage || "/opengraph-image";

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
          alt: `${name} - ${brand}`,
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
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
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
  const name = config.generalProfile?.name || profile.name;
  const brand = config.generalProfile?.brand || profile.brand;
  const siteUrl = config.generalProfile?.site || profile.site;
  const email = config.generalProfile?.email || profile.contact.email;
  const phone = config.generalProfile?.phone || profile.contact.phone;
  const bioIntro = config.generalProfile?.heroDesc || profile.bio[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: brand,
        description: `Portfolio resmi ${name} (${brand})`,
        inLanguage: ["id-ID", "en-US"],
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name,
        alternateName: [profile.nickname, brand, "zekksparow"],
        url: siteUrl,
        image: `${siteUrl}/opengraph-image`,
        jobTitle: [
          "UI/UX Designer",
          "Frontend Developer",
          "Graphic Designer",
          "IT Support",
        ],
        description: bioIntro,
        gender: "Male",
        email,
        telephone: phone,
        knowsLanguage: ["id", "en"],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Mojokerto",
          addressRegion: "Jawa Timur",
          addressCountry: "ID",
        },
        sameAs: (config.generalProfile?.socials || [])
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
        primaryImageOfPage: `${siteUrl}/opengraph-image`,
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity:
          config.faq && config.faq.length > 0
            ? config.faq.map((item) => ({
                "@type": "Question",
                name: item.questionId,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answerId,
                },
              }))
            : ([1, 2, 3, 4, 5] as const).map((i) => ({
                "@type": "Question",
                name: translations.id.faq[`q${i}`],
                acceptedAnswer: {
                  "@type": "Answer",
                  text: translations.id.faq[`a${i}`],
                },
              })),
      },
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
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
