import type { Metadata } from "next";
import { CertificatesClient } from "./certificates-client";

export const metadata: Metadata = {
  title: "Sertifikasi & Kredensial | Zakaria Mujur Prasetyo",
  description:
    "Direktori 53 sertifikasi profesional dan kredensial teknis Zakaria Mujur Prasetyo di bidang IT Support, Frontend, UI/UX, dan Jaringan Komputer.",
  alternates: {
    canonical: "/certificates",
    languages: {
      "id-ID": "/certificates?lang=id",
      "en-US": "/certificates?lang=en",
      "x-default": "/certificates",
    },
  },
  openGraph: {
    title: "Sertifikasi & Kredensial | Zakaria Mujur Prasetyo",
    description:
      "Direktori 53 sertifikasi profesional dan kredensial teknis Zakaria Mujur Prasetyo di bidang IT Support, Frontend, UI/UX, dan Jaringan Komputer.",
    url: "/certificates",
    type: "website",
    siteName: "Zakaria Mujur Prasetyo Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sertifikasi & Kredensial | Zakaria Mujur Prasetyo",
    description:
      "Direktori 53 sertifikasi profesional dan kredensial teknis Zakaria Mujur Prasetyo di bidang IT Support, Frontend, UI/UX, dan Jaringan Komputer.",
  },
};

export default function CertificatesPage() {
  return <CertificatesClient />;
}
