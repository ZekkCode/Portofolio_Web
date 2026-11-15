import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zakaria Mujur Prasetyo — ZekkTech Portfolio",
    short_name: "ZekkTech",
    description:
      "Portofolio resmi Zakaria Mujur Prasetyo (ZekkTech), UI/UX Designer & Frontend Developer asal Mojokerto.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1b45c4",
    lang: "id",
    icons: [
      {
        src: "/icons/site-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/site-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
