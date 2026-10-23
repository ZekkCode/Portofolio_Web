import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { profile } from "@/lib/profile";
import "./globals.css";

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["700", "800"],
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#1b45c4",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/",
      "en-US": "/",
    },
  },
  title: {
    default: "Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer",
    template: "%s | ZekkTech",
  },
  description:
    "Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer, Frontend Developer, dan Graphic Designer asal Mojokerto, Jawa Timur. Eksplorasi berkas CV interaktif, proyek Next.js, dan desain antarmuka.",
  applicationName: "ZekkTech Portfolio",
  authors: [{ name: profile.name, url: profile.site }],
  generator: "Next.js",
  keywords: [
    "Zakaria Mujur Prasetyo",
    "ZekkTech",
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
  creator: profile.name,
  publisher: profile.brand,
  category: "technology",
  classification: "Portfolio & Professional Profile",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "profile",
    firstName: "Zakaria",
    lastName: "Mujur Prasetyo",
    username: "zekksparow",
    gender: "male",
    locale: "id_ID",
    alternateLocale: ["en_US"],
    url: profile.site,
    siteName: profile.brand,
    title: "Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer",
    description:
      "Portfolio Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer & Frontend Developer asal Mojokerto, Jawa Timur. Eksplorasi berkas CV interaktif dan proyek digital.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${profile.name} - ${profile.brand}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer",
    description:
      "Portfolio Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer & Frontend Developer asal Mojokerto, Jawa Timur.",
    creator: "@zekksparow",
    site: "@zekksparow",
    images: ["/opengraph-image"],
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
    icon: [
      { url: "/card-front.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/card-front.svg" },
    ],
  },
  other: {
    "geo.region": "ID-JI",
    "geo.placename": "Mojokerto",
    "geo.position": "-7.4726;112.4385",
    ICBM: "-7.4726, 112.4385",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${profile.site}/#website`,
      url: profile.site,
      name: profile.brand,
      description: "Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech)",
      inLanguage: "id-ID",
      publisher: {
        "@id": `${profile.site}/#person`,
      },
    },
    {
      "@type": "Person",
      "@id": `${profile.site}/#person`,
      name: profile.name,
      alternateName: [profile.nickname, profile.brand, "zekksparow"],
      url: profile.site,
      image: `${profile.site}/card.webp`,
      jobTitle: [
        "UI/UX Designer",
        "Frontend Developer",
        "Graphic Designer",
        "IT Support",
      ],
      description: profile.bio[0],
      gender: "Male",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mojokerto",
        addressRegion: "Jawa Timur",
        addressCountry: "ID",
      },
      alumnusOf: {
        "@type": "CollegeOrUniversity",
        name: "Universitas Trunojoyo Madura",
      },
      knowsAbout: [
        "UI/UX Design",
        "Frontend Development",
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Figma",
        "WebGL",
        "Graphic Design",
      ],
      sameAs: profile.contact.socials.map((s) => s.href),
    },
    {
      "@type": "ProfilePage",
      "@id": `${profile.site}/#profilepage`,
      url: profile.site,
      name: `${profile.name} - ${profile.roles}`,
      isPartOf: {
        "@id": `${profile.site}/#website`,
      },
      about: {
        "@id": `${profile.site}/#person`,
      },
      mainEntity: {
        "@id": `${profile.site}/#person`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${fontBody.variable} ${fontDisplay.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}


