# Project Context — ZekkTech Portfolio

## Ringkasan Proyek
Portfolio profesional interaktif untuk **Zakaria Mujur Prasetyo (ZekkTech)**, seorang UI/UX Designer, Frontend Developer, Graphic Designer, dan IT Support Specialist berbasis di Bangkalan, Madura, Indonesia.

- **Domain Utama**: `https://zekktech.biz.id`
- **Repositori**: `https://github.com/ZekkCode/Portofolio_Web.git`
- **Framework**: Next.js 16.4.2 (App Router, Turbopack)
- **Runtime & UI**: React 19.2.4, TypeScript 5, Tailwind CSS v4.3.3
- **3D & Animasi**: Three.js, React Bits (`<Folder />`, `<PillNav />`, `<ProfileCard />`, `<Lanyard />`, `<ShapeGrid />`), Lenis Smooth Scroll

---

## Arsitektur Aplikasi & Direktori

```
src/
├── app/
│   ├── layout.tsx            # Root layout, Google fonts, dynamic SEO metadata, JSON-LD schema, ThemeProvider
│   ├── page.tsx              # Halaman utama (Hero, About, CV Folder, Stack, Proyek, Kontak, Footer)
│   ├── admin/
│   │   ├── layout.tsx        # Layout noindex khusus panel kontrol admin
│   │   └── page.tsx          # Panel admin untuk Lanyard, Profile Card, Proyek, CV Docs, dan sinkronisasi Cloud
│   ├── api/
│   │   ├── config/route.ts   # Endpoint sinkronisasi konfigurasi Supabase (GET/POST)
│   │   ├── upload/route.ts   # Endpoint upload berkas & PDF ke Cloudflare R2 (GET/POST)
│   │   └── views/route.ts    # Endpoint counter kunjungan portofolio dengan rate limiting IP (GET/POST)
│   ├── opengraph-image.tsx   # Generator kartu OpenGraph dinamis 1200x630 via next/og
│   ├── robots.ts             # Dynamic robots.txt (allow public, disallow /admin)
│   ├── sitemap.ts            # Dynamic sitemap.xml dengan priority, changefreq & hreflang
│   └── globals.css           # Tailwind v4 theme tokens, dark mode variables & CSS grid drift
├── components/
│   ├── cv-folder-section.tsx # Integrasi folder interaktif dengan dokumen 4 role karier
│   ├── cv-preview-modal.tsx  # Modal detail dokumen CV multi-page + link download PDF
│   ├── folder.tsx            # Komponen Folder WebGL2 refraction (React Bits)
│   ├── grid-background.tsx   # Ambient background lighting & aesthetic grid
│   ├── lanyard.tsx           # Simulasi kartu 3D lanyard fisik dengan Three.js
│   ├── lanyard-stage.tsx     # Wrapper stage hero untuk kartu lanyard 3D
│   ├── parallax.tsx          # Wrapper parallax berbasis Lenis scroll + SmoothNavLink
│   ├── pill-nav.tsx          # Komponen navigasi pill React Bits (spring physics, glide, collapse)
│   ├── portfolio-pill-nav.tsx# Navigasi desktop (dock bawah tengah) & mobile (drawer kanan atas)
│   ├── profile-card.tsx      # Kartu profil hologram 3D tilt
│   ├── profile-card-stage.tsx# Stage interaktif untuk profile card hero
│   ├── projects-section.tsx  # Grid kartu proyek showcase dengan link GitHub
│   ├── section-title.tsx     # Komponen judul section editorial anti-slop
│   ├── shape-grid.tsx        # Background grid canvas interaktif dengan efek click riak gelombang
│   ├── smooth-scroll.tsx     # Provider Lenis smooth scroll global
│   ├── theme-language-toggle.tsx # Tombol toggle Dark/Light mode & switch bahasa ID/EN
│   └── theme-provider.tsx    # Provider NextThemes untuk tema gelap/terang
├── lib/
│   ├── i18n.ts               # Inisialisasi react-i18next klien & utilitas persistensi bahasa
│   ├── profile.ts            # Data master profil, biografi, riwayat organisasi, stack, proyek
│   ├── r2.ts                 # Klien Cloudflare R2 Object Storage berbasis AWS S3 SDK
│   ├── site-store.ts         # State management lokal & fungsi sinkronisasi cloud
│   ├── supabase.ts           # Klien Supabase Cloud Database & helper ketersediaan koneksi
│   ├── translations.ts       # Kamus terjemahan dwibahasa (ID & EN)
│   ├── use-mounted.ts        # Hook pencegah hidrasi SSR mismatch
│   └── use-page-views.ts     # Hook pelacak dan pengambil jumlah page views
├── supabase/
│   └── schema.sql            # Skema SQL tabel site_config & page_views beserta Row Level Security
└── public/
    ├── card.webp             # Gambar kartu terkompresi (66 KB)
    ├── lanyard.webp          # Tekstur kartu lanyard (18 KB)
    ├── card-front.svg        # Vektor kartu identitas bawaan
    └── icons/                # Koleksi icon WebP ringan (~1 KB) untuk tech stack
```

---

## State Management & Penyimpanan Data

Situs mengadopsi model **Hybrid Local-First with Cloud Persistence**:

1. **Sumber Data Bawaan (Default)**: [`src/lib/profile.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/profile.ts) menyediakan data fallback otentik (biografi, pengalaman kerja, proyek bawaan, tautan sosial).
2. **Penyimpanan Klien (Local-First)**: [`src/lib/site-store.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/site-store.ts) mengelola state reaktif di `localStorage` peramban dengan kunci `zekk:site:v1`.
3. **Penyimpanan Cloud (Supabase & Cloudflare R2)**:
   - Jika kredensial di [`.env.local`](file:///e:/ProjectZekk/Porotofolio-Zekk/.env.example) aktif, konfigurasi dapat disinkronkan ke tabel `site_config` di Supabase Cloud via tombol **Simpan ke Cloud** atau diambil via **Tarik dari Supabase**.
   - Berkas media kartu, avatar, logo, dan dokumen CV PDF diunggah langsung ke bucket Cloudflare R2.
4. **Panel Admin (`/admin`)**:
   - Tab **Lanyard**: Konfigurasi fisik 3D, tekstur depan/belakang, tali, warna, tegangan pegas, dan gravitasi.
   - Tab **Profile Card**: Konfigurasi kartu hologram 3D (tilt angle, radius, glare, status kerja, mini avatar, icon motif).
   - Tab **Proyek**: Manajemen portofolio dinamis (tambah, edit deskripsi/tag/repo, hapus proyek).
   - Tab **Berkas CV**: Kustomisasi judul, deskripsi peran, dan unggah berkas PDF untuk 4 role karier (Frontend, UI/UX, Graphic Design, IT Support).
   - Pengaturan **Logo Header**: Kustomisasi logo avatar pada bilah navigasi atas.
   - Fitur Aksi: **Simpan (Lokal & Cloud)**, **Tarik dari Supabase**, **Ekspor JSON**, **Impor JSON**, dan **Reset ke Default**.
