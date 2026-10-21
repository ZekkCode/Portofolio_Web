# SEO & Search Engine Optimization Strategy

Panduan optimasi mesin pencari (Google, Bing, Yandex, Applebot) dan arsitektur metadata di portfolio ZekkTech.

---

## 1. Metadata Dinamis (`src/app/layout.tsx`)

- **Domain Kanonikal**: `https://zekktech.biz.id`
- **MetadataBase**: `new URL("https://zekktech.biz.id")`
- **Multi-Bahasa**: Tag alternatif hreflang `id-ID` dan `en-US`.
- **Target Kata Kunci**:
  - Zakaria Mujur Prasetyo, ZekkTech, zekksparow
  - UI/UX Designer Indonesia, Frontend Developer Bangkalan Madura
  - Next.js Web Developer, React Developer, Tailwind CSS Portfolio

---

## 2. Dynamic Open Graph Image (`src/app/opengraph-image.tsx`)

Menghasilkan pratinjau sosial beresolusi 1200x630 pixel secara on-the-fly via Edge / Node.js runtime menggunakan `next/og`:
- Mengadopsi identitas visual kontras tinggi (`#0a0a14`) dengan radial gradient biru.
- Menyajikan headline nama, role spesialisasi, dan lokasi geografis.
- Otomatis dibaca oleh bot crawler WhatsApp, Twitter/X, Telegram, LinkedIn, Facebook, dan Discord.

---

## 3. Robots & Sitemap

- **`robots.txt` (`src/app/robots.ts`)**:
  - Mengizinkan bot publik (`Googlebot`, `Bingbot`, `Slurp`, `DuckDuckBot`, `YandexBot`, `Applebot`).
  - Menutup akses crawling ke path `/admin`.
  - Mengumumkan lokasi sitemap XML dan host utama.
- **`sitemap.xml` (`src/app/sitemap.ts`)**:
  - Meliputi URL root dengan `priority: 1.0` dan frekuensi `weekly`.
  - Meliputi deep-link section (`#proyek`: 0.95, `#cv`: 0.9, `#tentang`: 0.9, `#kontak`: 0.85).

---

## 4. Skema Terstruktur Schema.org (JSON-LD)

Diinjeksikan di `<head>` root layout menggunakan format graf terpadu (`@graph`):
1. **`WebSite`**: URL, nama brand, bahasa, referensi penerbit.
2. **`Person`**:
   - `name`: Zakaria Mujur Prasetyo
   - `alternateName`: Zekk, ZekkTech, zekksparow
   - `jobTitle`: UI/UX Designer, Frontend Developer, Graphic Designer, IT Support
   - `address`: Bangkalan, Jawa Timur, ID
   - `alumnusOf`: Universitas Trunojoyo Madura
   - `sameAs`: Tautan terverifikasi ke GitHub, LinkedIn, Behance, Instagram, Trakteer
   - `knowsAbout`: Next.js, React, TypeScript, Figma, WebGL, Tailwind CSS
3. **`ProfilePage`**: Menghubungkan entitas WebSite dan Person untuk Google Knowledge Graph.
