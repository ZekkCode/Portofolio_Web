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
│   ├── certificates-section.tsx # Grid kredensial & sertifikasi terverifikasi
│   ├── cv-folder-section.tsx # Integrasi folder interaktif 4 role karier dikontrol GSAP ScrollTrigger
│   ├── cv-preview-modal.tsx  # Modal detail dokumen CV multi-page + link download PDF
│   ├── faq-section.tsx       # FAQ Accordion esensial alur kerja & teknologi
│   ├── folder.tsx            # Komponen Folder WebGL2 refraction (React Bits)
│   ├── grid-background.tsx   # Ambient background lighting & aesthetic grid
│   ├── lanyard.tsx           # Simulasi kartu 3D lanyard fisik dengan Three.js
│   ├── lanyard-stage.tsx     # Wrapper stage hero untuk kartu lanyard 3D
│   ├── parallax.tsx          # Wrapper parallax berbasis Lenis scroll + SmoothNavLink
│   ├── pill-nav.tsx          # Komponen navigasi pill React Bits (spring physics, glide, collapse)
│   ├── portfolio-pill-nav.tsx# Navigasi desktop (dock bawah tengah) & mobile (drawer kanan atas)
│   ├── profile-card.tsx      # Kartu profil hologram 3D tilt
│   ├── profile-card-stage.tsx# Stage interaktif untuk profile card hero
│   ├── projects-section.tsx  # Grid kartu proyek showcase seragam tanpa hero banner
│   ├── scroll-to-top.tsx     # Tombol pintasan melayang scroll kembali ke atas
│   ├── section-title.tsx     # Komponen judul section editorial anti-slop
│   ├── services-section.tsx  # 4 pilar penawaran layanan & kapabilitas teknis
│   ├── shape-grid.tsx        # Background grid canvas interaktif dengan efek click riak gelombang
│   ├── smooth-scroll.tsx     # Provider Lenis smooth scroll global + ScrollTrigger bridge
│   ├── theme-language-toggle.tsx # Tombol toggle Dark/Light mode & switch bahasa ID/EN
│   ├── theme-provider.tsx    # Provider NextThemes untuk tema gelap/terang
│   └── workflow-section.tsx  # 4 langkah alur eksekusi kerja terstruktur
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

---

## Ketetapan Desain & Aturan Anti-Halusinasi

1. **CV Folder Interaktif**:
   - Terintegrasi dengan GSAP `ScrollTrigger`.
   - Di posisi paling atas halaman (Hero): folder tertutup (`isFolderOpen: false`).
   - Saat di-scroll turun menuju tengah layar: folder terbuka otomatis (`onEnter: open`).
   - Saat di-scroll melewati ke bawah (melewati seksi CV): folder tertutup kembali (`onLeave: close`).
   - Saat di-scroll balik naik ke tengah: folder terbuka kembali (`onEnterBack: open`).
   - Saat di-scroll balik ke atas melewati seksi: folder menutup kembali (`onLeaveBack: close`).
2. **Kondisi Data Proyek**:
   - `defaultProjects: []` di `site-store.ts`. Tidak boleh ada mock/dummy/seed otomatis yang dipaksakan jika database kosong.
   - Tidak ada banner hero repo besar di seksi proyek; proyek ditampilkan dalam format grid kartu seragam yang bersih.
3. **Anti-Slop Copy & Layout**:
   - Pertahankan estetika human-crafted, minim noise micro-label, tanpa AI filler copy.
   - Semua verifikasi wajib dijalankan sebelum menyatakan selesai (`tsc`, `check.mjs`, `build`).
4. **Standar Ikon**:
   - Dilarang menyisipkan panah mentah di teks (`→`, `↗`, `->`).
   - Seluruh indikator navigasi dan link eksternal menggunakan SVG icon resmi dari `lucide-react` (`ArrowRight`, `ArrowUpRight`, `ChevronLeft`, `ChevronRight`).
5. **Navbar Bottom Auto-Hide & Watermark Footer**:
   - `PortfolioPillNav` secara otomatis menghilang saat scroll mencapai area footer bawah.
   - Footer menampilkan typographic signature "zakaria mp" menggunakan font pixel (`Pixelify_Sans`) dengan gradien memudar transparan ke bawah.
6. **Navigasi Anchor Hash & Pintasan Scroll to Top**:
   - Setiap seksi memiliki anchor independen (`#about`, `#proyek`, `#faq`, `#services`, `#workflow`, `#certificates`, dll.).
   - Komponen `ScrollToTop` floating di sudut kanan bawah terhubung ke smooth scroll Lenis.
