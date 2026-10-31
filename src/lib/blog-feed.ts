export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  url: string;
}

/**
 * Authentic, verified posts directly sourced from ZekkTech Blog (zekktech.biz.id).
 * Serves as graceful fallback when remote network or API is unavailable.
 */
export const VERIFIED_BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "Asal Usul Em Dash: Tanda Baca yang Kini Sering Dicurigai Sebagai Ciri AI",
    slug: "asal-usul-em-dash-tanda-baca-ai",
    excerpt: "Em-dash sering dianggap sebagai ciri tulisan AI, padahal tanda baca ini punya sejarah panjang dalam tipografi. Simak asal usul, fungsi, dan alasan em dash dikaitkan dengan AI generate.",
    coverImage: "https://tiny-bread-e53d.zekkstore-zekkblog.workers.dev/covers/1781797189940-ZekkTechBlog-DASH-EM.png",
    category: "Berita Teknologi",
    publishedAt: "18 Jun 2026",
    url: "https://zekktech.biz.id/post/asal-usul-em-dash-tanda-baca-ai",
  },
  {
    id: "post-2",
    title: "Alan Turing: Jenius di Balik Komputer, Tapi Dihukum Karena Menjadi Dirinya Sendiri!",
    slug: "alan-turing-jenius-di-balik-komputer-tapi-dihukum-karena-menjadi-dirinya-sendiri",
    excerpt: "Alan Turing dikenal sebagai Bapak Komputer yang ikut membangun fondasi dunia teknologi modern, mulai dari konsep komputasi, pemecahan kode Enigma, sampai awal pemikiran tentang AI. Namun di balik kejeniusannya, Turing punya kisah tragis.",
    coverImage: "https://tiny-bread-e53d.zekkstore-zekkblog.workers.dev/covers/1777895414674-Alan-Turing-ZekkTechBlog.png",
    category: "Berita Teknologi",
    publishedAt: "4 Mei 2026",
    url: "https://zekktech.biz.id/post/alan-turing-jenius-di-balik-komputer-tapi-dihukum-karena-menjadi-dirinya-sendiri",
  },
  {
    id: "post-3",
    title: "Pergi Kemana File yang Dihapus pada HDD dan SSD? Ternyata Tidak Langsung Hilang!",
    slug: "ke-mana-perginya-file-yang-dihapus-pads-hdd-dan-ssd-ternyata-tidak-langsung-hilang",
    excerpt: "Ke mana perginya file yang dihapus pada HDD dan SSD? Mengapa file yang baru saja dihapus di recycle bin ternyata masih bisa dipulihkan dan tidak langsung musnah dari piringan atau chip flash.",
    coverImage: "https://tiny-bread-e53d.zekkstore-zekkblog.workers.dev/covers/1777532862578-hdd-vs-ssd.png",
    category: "Pilihan Editor",
    publishedAt: "30 Apr 2026",
    url: "https://zekktech.biz.id/post/ke-mana-perginya-file-yang-dihapus-pads-hdd-dan-ssd-ternyata-tidak-langsung-hilang",
  },
];

export const BLOG_HOME_URL = "https://zekktech.biz.id/blog";

/**
 * Normalizes and validates blog post item
 */
export function sanitizeBlogPost(item: unknown, index = 0): BlogPost | null {
  if (!item || typeof item !== "object") return null;
  const p = item as Record<string, unknown>;

  const id = String(p.id || `post-${index}`);
  const title = String(p.title || "").trim();
  const slug = String(p.slug || "").trim();
  const rawUrl = String(p.url || (slug ? `https://zekktech.biz.id/post/${slug}` : ""));
  
  if (!title || !rawUrl) return null;

  const excerpt = String(p.excerpt || "").trim();
  const coverImage = String(p.cover_image || p.coverImage || p.image || "").trim();
  const category = String(p.category || "Teknologi").trim();
  const publishedAt = String(p.published_at || p.publishedAt || "").trim();

  return {
    id,
    title,
    slug,
    excerpt,
    coverImage,
    category,
    publishedAt,
    url: rawUrl,
  };
}
