# SEO & Search Engine Optimization Strategy — ZekkTech

Panduan teknis optimasi mesin pencari (Google Search Central, Bing Webmaster, Lighthouse SEO) dan audit performa visibilitas organik pada portfolio ZekkTech.

---

## 1. Arsitektur Teknis SEO (`Technical SEO`)

### A. Kontrol Crawling & Indexing
- **`robots.txt` ([`src/app/robots.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/robots.ts))**:
  - Mengizinkan bot mesin pencari utama (`Googlebot`, `Bingbot`, `DuckDuckBot`, `YandexBot`, `Applebot`).
  - Menutup akses crawling ke rute privat/backend:
    ```txt
    User-agent: *
    Allow: /
    Disallow: /admin
    Disallow: /admin/
    Disallow: /api/
    Disallow: /private/

    Sitemap: https://zekktech.biz.id/sitemap.xml
    ```
- **Kanonikalitas URL**:
  - Penegakan `canonical: "https://zekktech.biz.id"` mencegah isu *duplicate content*.
  - Sesuai standar Google Search Central, XML sitemap ([`src/app/sitemap.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/sitemap.ts)) hanya memuat URL kanonikal bersih (tanpa anchor `#hash`).

### B. Keamanan & HTTPS Trust Signals ([`next.config.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/next.config.ts))
Header keamanan HTTP yang terpasang otomatis:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS penuh)
- `X-Content-Type-Options: nosniff` (Perlindungan MIME sniffing)
- `X-Frame-Options: SAMEORIGIN` (Pencegahan clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 2. On-Page SEO & Metadata Semantik

### A. Title Tags & Meta Descriptions ([`src/app/layout.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/layout.tsx))
- **Title Tag**:
  - Format: `Zakaria Mujur Prasetyo | UI/UX Designer & Frontend Developer`
  - Panjang 50–60 karakter yang memprioritaskan kata kunci utama di depan dan merek di belakang.
- **Meta Description**:
  - Ringkas (150–160 karakter), unik, dan memuat ajakan aksi alami (CTA):
    `Portfolio resmi Zakaria Mujur Prasetyo (ZekkTech). UI/UX Designer, Frontend Developer, dan Graphic Designer asal Mojokerto, Jawa Timur. Eksplorasi berkas CV interaktif, proyek Next.js, dan desain antarmuka.`

### B. Hierarki Heading Semantik
- `<h1>`: Tepat 1 elemen per halaman utama di bagian Hero (`Zakaria Mujur Prasetyo`).
- `<h2>`: Judul seksi utama via [`SectionTitle`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/section-title.tsx) (*Tentang Saya*, *Berkas CV & Riwayat*, *Tech Stack*, *Proyek Terpilih*, *Mari Berkolaborasi*).
- `<h3>`: Judul proyek, kartu keahlian, dan subdivisi.
- `<h4>`: Metadata dokumen CV dan detail kartu.

### C. Optimasi Gambar & Media
- Menggunakan `next/image` dengan format modern otomatis: AVIF dan WebP.
- Atribut `alt` deskriptif pada seluruh elemen gambar untuk keterbacaan mesin pencari dan screen reader.
- Lazy-loading bawaan untuk elemen di luar viewport pertama.

---

## 3. Data Terstruktur Schema.org (JSON-LD)

Diinjeksikan di `<head>` root layout menggunakan format graf terpadu (`@graph`):

1. **`WebSite`**:
   - URL: `https://zekktech.biz.id`
   - InLanguage: `["id-ID", "en-US"]`
   - Publisher: Referensi ke entitas `Person`.

2. **`Person`**:
   - `name`: Zakaria Mujur Prasetyo
   - `alternateName`: Zekk, ZekkTech, zekksparow
   - `jobTitle`: UI/UX Designer, Frontend Developer, Graphic Designer, IT Support
   - `knowsLanguage`: `["id", "en"]`
   - `address`: Mojokerto, Jawa Timur, ID
   - `alumnusOf`: Universitas Trunojoyo Madura
   - `knowsAbout`: UI/UX Design, Frontend Development, Next.js, React, TypeScript, Tailwind CSS, Figma, WebGL, Graphic Design, SEO
   - `sameAs`: Tautan media sosial terverifikasi (GitHub, LinkedIn, Behance, Instagram, Trakteer)

3. **`ProfilePage`**:
   - Menghubungkan entitas `WebSite` dan `Person` untuk Google Knowledge Graph.
   - `primaryImageOfPage`: `https://zekktech.biz.id/opengraph-image`

---

## 4. Mobile SEO & Aksesibilitas (WCAG 2.2)

- **Responsive Viewport**:
  `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">`
- **Ukuran Tap Target**:
  Seluruh tombol interaktif, link navigasi, dan toggle tema memenuhi dimensi minimum 48px × 48px untuk kenyamanan sentuhan layar seluler.
- **Ukuran Font & Tipografi**:
  Base font 16px dengan line-height 1.5, bebas zooming layout shift (CLS = 0).

---

## 5. Alur Kerja Audit & Pemantauan (`CLI & MCP Tools`)

Repositori ini mengintegrasikan dua skill pendukung SEO:
1. **`web-quality-seo`** ([`.agents/skills/web-quality-seo/SKILL.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/.agents/skills/web-quality-seo/SKILL.md)):
   - Audit teknis berbasis Lighthouse SEO, Core Web Vitals, dan panduan Google Search Central.
2. **`seo`** ([`.agents/skills/seo/SKILL.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/.agents/skills/seo/SKILL.md)):
   - Integrasi CLI/MCP Search Console untuk memantau klik organik, status indeks Google, dan internal links:

### Perintah CLI untuk Audit Berkala:
```powershell
# 1. Crawl teknis halaman web lokal/produksi
npx -y seo crawl --url https://zekktech.biz.id

# 2. Periksa status URL spesifik di Search Console
npx -y seo page --url https://zekktech.biz.id

# 3. Laporan performa kueri dan impresi organik
npx -y seo report --site https://zekktech.biz.id

# 4. Evaluasi alasan status pengindeksan Google
npx -y seo index --site https://zekktech.biz.id
```

---

## 6. Daftar Periksa Audit SEO (`Checklist`)

- [x] HTTPS aktif dengan header HSTS 1 tahun (`Strict-Transport-Security`).
- [x] `robots.txt` mengizinkan bot umum dan memblokir rute `/admin` serta `/api`.
- [x] `sitemap.xml` hanya memuat URL kanonikal bersih (bebas hash `#fragment`).
- [x] Tag kanonikal dan alternatif bahasa (`hreflang: id-ID, en-US`) terkonfigurasi.
- [x] Tepat satu `<h1>` per halaman dengan hierarki heading `h2`-`h4` logis.
- [x] Meta description unik dan informatif (150–160 karakter).
- [x] Skema JSON-LD (`WebSite`, `Person`, `ProfilePage`) tervalidasi Schema.org.
- [x] Pratinjau media sosial dinamis `opengraph-image.png` (1200x630).
- [x] Tap target seluler mematuhi standar minimum 48px.
- [x] Core Web Vitals optimal (LCP, CLS, INP) via kompresi AVIF/WebP.
