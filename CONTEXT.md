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
│   ├── layout.tsx            # Root layout, Google fonts, dynamic SEO metadata, JSON-LD schema
│   ├── page.tsx              # Halaman utama (Hero, About, CV Folder, Stack, Proyek, Kontak, Footer)
│   ├── admin/page.tsx        # Panel admin noindex untuk kustomisasi Lanyard, Profile Card & Proyek
│   ├── opengraph-image.tsx   # Generator kartu OpenGraph dinamis 1200x630 via next/og
│   ├── robots.ts             # Dynamic robots.txt (allow public, disallow /admin)
│   ├── sitemap.ts            # Dynamic sitemap.xml dengan priority, changefreq & hreflang
│   └── globals.css           # Tailwind v4 theme tokens & CSS grid drift
├── components/
│   ├── cv-folder-section.tsx # Integrasi folder interaktif dengan dokumen 4 role karier
│   ├── cv-preview-modal.tsx  # Modal detail dokumen CV + link download eksternal
│   ├── folder.tsx            # Komponen Folder WebGL2 refraction (React Bits)
│   ├── lanyard.tsx           # Simulasi kartu 3D lanyard fisik dengan Three.js
│   ├── lanyard-stage.tsx     # Wrapper stage hero untuk kartu lanyard 3D
│   ├── parallax.tsx          # Wrapper parallax berbasis Lenis scroll + SmoothNavLink
│   ├── pill-nav.tsx          # Komponen navigasi pill React Bits (spring physics, glide, collapse)
│   ├── portfolio-pill-nav.tsx# Navigasi desktop (dock bawah tengah) & mobile (drawer kanan atas)
│   ├── profile-card.tsx      # Kartu profil hologram 3D tilt
│   ├── profile-card-stage.tsx# Stage interaktif untuk profile card hero
│   ├── projects-section.tsx  # Grid kartu proyek showcase dengan link GitHub
│   ├── section-title.tsx     # Komponen judul section editorial anti-slop
│   ├── shape-grid.tsx        # Background grid canvas interaktif
│   └── smooth-scroll.tsx     # Provider Lenis smooth scroll global
├── lib/
│   ├── profile.ts            # Data master profil, biografi, riwayat organisasi, stack, proyek
│   └── site-store.ts         # State management lokal (localStorage `zekk:site:v1`)
└── public/
    ├── card.webp             # Gambar kartu terkompresi (66 KB)
    ├── lanyard.webp          # Tekstur kartu lanyard (18 KB)
    ├── card-front.svg        # Vektor kartu identitas bawaan
    └── icons/                # Koleksi icon WebP ringan (~1 KB) untuk tech stack
```

---

## State Management & Penyimpanan Data
1. **Sumber Data Bawaan**: `src/lib/profile.ts` menyimpan identitas otentik, pengalaman kerja, portofolio proyek, dan tautan sosial.
2. **Penyimpanan Klien**: `src/lib/site-store.ts` menyediakan penyimpanan reaktif `localStorage` dengan kunci `zekk:site:v1`.
3. **Panel Admin (`/admin`)**:
   - Tab **Lanyard**: Pengaturan visual 3D (gambar depan/belakang, tali, warna, redaman fisika, gravitasi).
   - Tab **Profile Card**: Konfigurasi kartu hologram (tilt angle, radius, glare, status online).
   - Tab **Proyek**: Tambah, edit, dan hapus portofolio proyek.
   - Tombol **Simpan**, **Ekspor JSON**, dan **Reset ke Default**.
