export interface StickerItem {
  id: string;
  name: string;
  src: string;
  category: "design" | "frontend" | "media" | "backend" | "tooling";
}

/**
 * Manifest of available technology logo stickers.
 * Uses high-resolution die-cut vinyl sticker assets (pure WebP with transparent boundaries and crisp white die-cut contour).
 */
export const STICKER_LOGOS: StickerItem[] = [
  { id: "figma", name: "Figma", src: "/icons/figma.webp", category: "design" },
  { id: "react", name: "React", src: "/icons/react.webp", category: "frontend" },
  { id: "tailwind", name: "Tailwind CSS", src: "/icons/tailwind.webp", category: "frontend" },
  { id: "nextjs", name: "Next.js", src: "/icons/nextjs.webp", category: "frontend" },
  { id: "photoshop", name: "Photoshop", src: "/icons/photoshop.webp", category: "design" },
  { id: "illustrator", name: "Illustrator", src: "/icons/illustrator.webp", category: "design" },
  { id: "coreldraw", name: "CorelDRAW", src: "/icons/coreldraw-design.webp", category: "design" },
  { id: "canva", name: "Canva", src: "/icons/canva.webp", category: "design" },
  { id: "capcut", name: "CapCut", src: "/icons/capcut.webp", category: "media" },
  { id: "filmora", name: "Filmora", src: "/icons/filmora.webp", category: "media" },
  { id: "python", name: "Python", src: "/icons/python.webp", category: "backend" },
  { id: "laravel", name: "Laravel", src: "/icons/laravel.webp", category: "backend" },
  { id: "vue", name: "Vue.js", src: "/icons/vue.webp", category: "frontend" },
  { id: "postgre", name: "PostgreSQL", src: "/icons/postgre.webp", category: "backend" },
  { id: "mysql", name: "MySQL", src: "/icons/mysql.webp", category: "backend" },
  { id: "github", name: "GitHub", src: "/icons/github.webp", category: "tooling" },
  { id: "jira", name: "Jira", src: "/icons/jira.webp", category: "tooling" },
  { id: "knime", name: "KNIME", src: "/icons/knime.webp", category: "tooling" },
  { id: "orange", name: "Orange Data Mining", src: "/icons/orange-data-mining.webp", category: "tooling" },
  { id: "bootstrap", name: "Bootstrap", src: "/icons/bootstrap.webp", category: "frontend" },
  { id: "bootstrap-studio", name: "Bootstrap Studio", src: "/icons/bootstrap-studio.webp", category: "frontend" },
  { id: "flutter", name: "Flutter", src: "/icons/flutter.webp", category: "frontend" },
  { id: "jupyterbook", name: "Jupyter Book", src: "/icons/jupyterbook.webp", category: "tooling" },
  { id: "adobexd", name: "Adobe XD", src: "/icons/adobexd.webp", category: "design" },
  { id: "typescript", name: "TypeScript", src: "/icons/typescript.webp", category: "frontend" },
];
