import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { profile } from "@/lib/profile";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  alternates: { canonical: "/" },
  title: {
    default: "Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer",
    template: "%s | ZekkTech",
  },
  description:
    "Portfolio Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer & Frontend Developer asal Bangkalan, Madura. Mahasiswa Teknik Informatika, freelancer sejak 2020.",
  keywords: [
    "Zakaria Mujur Prasetyo",
    "ZekkTech",
    "Zekk",
    "UI/UX Designer",
    "Frontend Developer",
    "portfolio",
    "Bangkalan",
    "Madura",
  ],
  authors: [{ name: "Zakaria Mujur Prasetyo", url: profile.site }],
  creator: "Zakaria Mujur Prasetyo",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "ZekkTech",
    title: "Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer",
    description:
      "UI/UX Designer & Frontend Developer asal Bangkalan, Madura. Freelancer sejak 2020.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${archivo.variable}`}>
      <body className="antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
