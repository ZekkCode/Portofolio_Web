import type { Metadata } from "next";
import { ProjectsClient } from "./projects-client";

export const metadata: Metadata = {
  title: "Proyek & Portofolio | Zakaria Mujur Prasetyo",
  description:
    "Katalog portofolio proyek perangkat lunak, antarmuka web modern, dan sistem rekayasa interaktif Zakaria Mujur Prasetyo.",
  alternates: {
    canonical: "/projects",
    languages: {
      "id-ID": "/projects?lang=id",
      "en-US": "/projects?lang=en",
      "x-default": "/projects",
    },
  },
  openGraph: {
    title: "Proyek & Portofolio | Zakaria Mujur Prasetyo",
    description:
      "Katalog portofolio proyek perangkat lunak, antarmuka web modern, dan sistem rekayasa interaktif Zakaria Mujur Prasetyo.",
    url: "/projects",
    type: "website",
    siteName: "Zakaria Mujur Prasetyo Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proyek & Portofolio | Zakaria Mujur Prasetyo",
    description:
      "Katalog portofolio proyek perangkat lunak, antarmuka web modern, dan sistem rekayasa interaktif Zakaria Mujur Prasetyo.",
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
