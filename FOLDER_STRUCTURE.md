# Struktur Folder & Tanggung Jawab Modul — ZekkTech Portfolio

Dokumentasi ini menetapkan panduan organisasi berkas, prinsip arsitektur modular (*Separation of Concerns*), dan peta struktur repositori.

---

## 1. Prinsip Desain Arsitektur Folder

1. **Separation of Concerns (SoC)**:
   Memisahkan antara logika antarmuka (*Presentation*), logika bisnis (*Domain/Business Logic*), akses jaringan/database (*Data Access Layer*), dan konfigurasi server.
2. **Single Responsibility Principle (SRP)**:
   Satu berkas hanya bertanggung jawab atas satu fungsi atau domain data yang spesifik.
3. **High Cohesion & Low Coupling**:
   Modul yang saling terkait diletakkan berdekatan, sementara ketergantungan antar-modul diminimalkan melalui antarmuka (*contract/types*) yang jelas.
4. **KISS & YAGNI (Anti-Overengineering)**:
   Tidak membuat lapisan abstraksi yang tidak diperlukan atau direktori kosong tanpa isi.

---

## 2. Struktur Repositori Aktual (*Current Tree*)

```text
Porotofolio-Zekk/
├── .agents/                    # Konfigurasi skill dan aturan AI Agent lokal
├── .github/workflows/          # CI/CD pipeline GitHub Actions
├── public/                     # Aset publik statis (gambar, favicon, dokumen ATS CV)
│   ├── cv-ats-zakariamp-2025.pdf
│   ├── cv-page-1.png ... cv-page-4.png
│   ├── card-front.svg, profile.webp
│   └── icons/
├── scripts/                    # Script otomatisasi pengujian, verifikasi, dan audit
│   ├── check.mjs               # Verifikasi integrasi browser headless
│   ├── inspect-suite.mjs       # Analisis kualitas UI & responsivitas
│   ├── test-cv-interaction.mjs # Verifikasi interaksi modal CV & PaperCrumple
│   └── capture-verification-screenshots.mjs
├── src/
│   ├── app/                    # Next.js App Router (Halaman & Endpoint API)
│   │   ├── admin/              # Panel admin & halaman login
│   │   │   ├── login/page.tsx
│   │   │   ├── admin-client.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/                # Serverless Route Handlers
│   │   │   ├── auth/           # Login, logout, dan status admin (/me)
│   │   │   ├── config/         # CRUD konfigurasi situs
│   │   │   ├── cv-pdf/         # Resolusi dan pengiriman dokumen CV aman
│   │   │   ├── upload/         # Validasi dan pengunggahan berkas ke R2
│   │   │   └── views/          # Counter kunjungan atomik & deduplikasi
│   │   ├── error.tsx           # Boundary penanganan error tak terduga
│   │   ├── globals.css         # Variabel Tailwind CSS v4 & token desain
│   │   ├── layout.tsx          # Root Layout, Metadata SEO, Font, JSON-LD
│   │   ├── loading.tsx         # Fallback skeleton saat halaman memuat
│   │   ├── not-found.tsx       # Tampilan halaman 404 ramah pengguna
│   │   ├── opengraph-image.tsx # Generator dinamis gambar Open Graph
│   │   ├── page.tsx            # Halaman utama portofolio
│   │   ├── robots.ts           # Konfigurasi perayapan bot mesin pencari
│   │   └── sitemap.ts          # Indeks peta situs XML dinamis
│   ├── components/             # Komponen antarmuka pengguna (UI & 3D WebGL)
│   │   ├── lanyard.tsx         # Simulasi fisika 3D kartu lanyard (Three.js)
│   │   ├── lanyard-stage.tsx   # Pembungkus stage hero lanyard
│   │   ├── folder.tsx          # Interactive 3D CV Folder (GSAP ScrollTrigger)
│   │   ├── paper-crumple.tsx   # Simulasi peremasan kertas Three.js
│   │   ├── cv-folder-section.tsx # Integrasi seksi berkas karier
│   │   ├── cv-preview-modal.tsx  # Pratinjau berkas ATS CV modal & portal
│   │   ├── portfolio-pill-nav.tsx# Floating Pill Nav dengan ikon Lucide
│   │   ├── pill-nav.tsx        # Primitif Pill Navigation dari React Bits
│   │   ├── tech-text.tsx       # Komponen wordmark kanvas interaktif
│   │   ├── projects-section.tsx# Grid proyek dinamis
│   │   ├── certificates-section.tsx # Grid sertifikasi terverifikasi
│   │   ├── services-section.tsx# 4 pilar layanan
│   │   ├── experience-timeline.tsx # Riwayat kerja & kepengurusan
│   │   ├── faq-section.tsx     # FAQ Accordion
│   │   ├── shape-grid.tsx      # Kanvas latar belakang interaktif
│   │   ├── smooth-scroll.tsx   # Integrasi Lenis smooth scrolling
│   │   ├── parallax.tsx        # Utilitas ScrollReveal & Parallax
│   │   ├── scroll-to-top.tsx   # Pintasan melayang kembali ke atas
│   │   ├── theme-language-toggle.tsx # Tombol ganti bahasa & dark mode
│   │   ├── theme-provider.tsx  # Wrapper next-themes
│   │   └── section-title.tsx   # Header seragam antar seksi
│   └── lib/                    # Utilitas, konfigurasi, dan store
│       ├── auth-server.ts      # HMAC signer, session verifier, rate-limiter
│       ├── config-validator.ts # Skema validasi payload konfigurasi
│       ├── i18n.ts             # Inisialisasi react-i18next
│       ├── profile.ts          # Profil otentik, bio, kontak Zakaria Mujur P.
│       ├── r2.ts               # SDK Client Cloudflare R2 S3
│       ├── site-config.ts      # Default config & normalizer data
│       ├── site-store.ts       # Store reaktif Zustand / localStorage
│       ├── supabase.ts         # Supabase client singleton & SSR helpers
│       ├── translations.ts     # Kamus teks bahasa Indonesia & Inggris
│       ├── use-mounted.ts      # Hook pendeteksi hidrasi sisi klien
│       └── use-page-views.ts   # Hook analitik kunjungan halaman
└── supabase/                   # Konfigurasi Supabase lokal & migrasi SQL
    ├── migrations/             # Berkas migrasi database versioned
    └── schema.sql              # Blueprint skema database lengkap & RLS
```

---

## 3. Tanggung Jawab Direktori Utama

### `src/app`
- **Fungsi**: Router resmi Next.js App Router yang memetakan URL ke halaman dan API route.
- **Isi yang benar**: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `route.ts`.
- **Yang tidak boleh ada**: Logika manipulasi Three.js mentah, helper autentikasi kompleks, atau query database langsung (wajib didelegasikan ke `src/lib`).

### `src/app/api`
- **Fungsi**: Endpoint backend serverless untuk operasi aman yang membutuhkan rahasia server atau hak istimewa (*service role*).
- **Isi yang benar**: Route Handlers (`route.ts`) untuk validasi upload, pembaruan konfigurasi, dan proxy berkas aman.
- **Yang tidak boleh ada**: Komponen UI React, file CSS, atau logika render HTML klien.

### `src/components`
- **Fungsi**: Komponen UI modular, elemen presentasi, dan kanvas WebGL interaktif.
- **Isi yang benar**: Komponen React murni, file styling khusus komponen (seperti `PaperCrumple.css`).
- **Yang tidak boleh ada**: Kunci rahasia server (`process.env.ADMIN_SESSION_SECRET`), akses langsung ke database tanpa API/Store.

### `src/lib`
- **Fungsi**: Lapisan logika bersama (*Shared Business Logic*), klien database, helper kriptografi, dan definisi tipe data.
- **Isi yang benar**: Inisialisasi Supabase/R2, verifikator token, kamus terjemahan, utilitas format tanggal/teks.
- **Yang tidak boleh ada**: Elemen JSX visual atau tag HTML langsung.

### `public`
- **Fungsi**: Berkas statis yang disajikan langsung oleh web server ke browser tanpa proses kompilasi.
- **Isi yang benar**: Berkas PDF asli, favicon, ikon SVG, tekstur gambar kartu 3D.
- **Yang tidak boleh ada**: Dokumen rahasia, source code, berkas `.env`.

### `scripts`
- **Fungsi**: Perangkat bantu otomatisasi pengujian, quality gate, audit Lighthouse/Chrome DevTools, dan migrasi lokal.
- **Isi yang benar**: File script Node.js (`.mjs`) yang dijalankan via terminal atau CI.

---

## 4. Evaluasi Struktur Ideal Masa Depan (*Proposed Evolution*)

Jika repositori berkembang menjadi platform portofolio multi-proyek atau agensi, pemisahan folder berikut disarankan:

```text
src/
├── app/                  # Routing murni (Next.js App Router)
├── components/
│   ├── ui/               # Primitif UI atomik (Button, Modal, Input, Badge)
│   ├── sections/         # Komponen blok seksi halaman utama (Hero, About, CV, Services)
│   ├── 3d/               # Kanvas WebGL khusus Three.js (Lanyard, PaperCrumple, Folder)
│   └── navigation/       # PillNav, Header, ScrollToTop
├── lib/
│   ├── auth/             # Modul otentikasi & session guard
│   ├── storage/          # Modul Cloudflare R2 & upload handler
│   ├── database/         # Supabase client & query abstraction
│   └── validation/       # Zod / custom runtime schema validator
└── types/                # Definisi TypeScript bersama (.d.ts)
```

> [!NOTE]
> **Keputusan Arsitektur Saat Ini**: Struktur saat ini sengaja dipertahankan datar (*flat cohesion*) untuk mencegah *import path churn* dan menjaga kesederhanaan *bundle resolution* pada Next.js 16. Pemisahan di atas dapat diadopsi bertahap ketika variasi halaman publik bertambah.
