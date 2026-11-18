import type { Metadata } from "next";
import { CertificatesClient } from "./certificates-client";

export const metadata: Metadata = {
  title: "Kredensial & Sertifikasi Terverifikasi | Zakaria Mujur Prasetyo",
  description:
    "Direktori lengkap 47 sertifikasi profesional dan kredensial teknis terverifikasi Zakaria Mujur Prasetyo di bidang IT Support, Rekayasa Frontend, UI/UX, dan Jaringan Komputer.",
  alternates: {
    canonical: "/certificates",
  },
  openGraph: {
    title: "Kredensial & Sertifikasi Terverifikasi | Zakaria Mujur Prasetyo",
    description:
      "Direktori lengkap 47 sertifikasi profesional dan kredensial teknis terverifikasi Zakaria Mujur Prasetyo di bidang IT Support, Rekayasa Frontend, UI/UX, dan Jaringan Komputer.",
    url: "/certificates",
    type: "website",
    siteName: "Zakaria Mujur Prasetyo Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kredensial & Sertifikasi Terverifikasi | Zakaria Mujur Prasetyo",
    description:
      "Direktori lengkap 47 sertifikasi profesional dan kredensial teknis terverifikasi Zakaria Mujur Prasetyo.",
  },
};

export default function CertificatesPage() {
  return <CertificatesClient />;
}
