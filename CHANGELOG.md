# Changelog

Semua perubahan penting pada proyek portofolio ZekkTech didokumentasikan di berkas ini. Format mengadopsi prinsip [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] - 2026-10-27

### Ditambahkan
- Integrasi Cloud Database **Supabase** via [`@supabase/supabase-js`](file:///e:/ProjectZekk/Porotofolio-Zekk/package.json#L17) untuk penyimpanan `site_config` dan live counter `page_views`.
- Integrasi Cloud Object Storage **Cloudflare R2** via [`@aws-sdk/client-s3`](file:///e:/ProjectZekk/Porotofolio-Zekk/package.json#L16) untuk penyimpanan aset visual dan berkas PDF CV.
- Endpoint API server Next.js:
  - [`src/app/api/config/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/config/route.ts): Sinkronisasi konfigurasi Supabase (GET/POST).
  - [`src/app/api/upload/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/upload/route.ts): Unggah berkas ke Cloudflare R2 dengan fallback Data URI.
  - [`src/app/api/views/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/views/route.ts): Pelacakan jumlah kunjungan dengan deduplikasi IP per 15 menit.
- Fitur **Dark Mode** & **Light Mode** menggunakan [`next-themes`](file:///e:/ProjectZekk/Porotofolio-Zekk/package.json#L23) dan [`ThemeToggle`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/theme-language-toggle.tsx#L7).
- Fitur **Dukungan Dwibahasa (ID / EN)** menggunakan [`i18next`](file:///e:/ProjectZekk/Porotofolio-Zekk/package.json#L20) dan [`LanguageToggle`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/theme-language-toggle.tsx#L69).
- Tab **Berkas CV** kustom dan pengaturan **Logo Header** di panel admin [`src/app/admin/page.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/admin/page.tsx).
- Berkas panduan arsitektur cloud [`DATABASE.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/DATABASE.md) dan lisensi open-source [`LICENSE`](file:///e:/ProjectZekk/Porotofolio-Zekk/LICENSE).

### Diubah
- Migrasi panel admin dari murni local-only menjadi arsitektur *Local-First with Cloud Sync* (Supabase + Cloudflare R2).
- Pembaruan dokumen teknis [`CONTEXT.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/CONTEXT.md), [`SECURITY.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/SECURITY.md), [`POLICY.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/POLICY.md), [`DESIGN.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/DESIGN.md), [`WORKFLOW.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/WORKFLOW.md), dan [`README.md`](file:///e:/ProjectZekk/Porotofolio-Zekk/README.md).

---

## [0.3.0] - 2026-10-25

### Ditambahkan
- Desain tipografi editorial *anti-slop* menggunakan **Bricolage Grotesque** (display headings) dan **Plus Jakarta Sans** (body & UI).
- Integrasi animasi smooth scrolling **Studio Freight Lenis** dan event loop parallax GPU dua arah di [`src/components/parallax.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/parallax.tsx).
- Komponen latar canvas [`src/components/shape-grid.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/shape-grid.tsx) dengan efek klik riak gelombang (*clickCascade*).
- Modal pratinjau PDF CV multi-halaman beranimasi di [`src/components/cv-preview-modal.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/cv-preview-modal.tsx).

---

## [0.2.0] - 2026-10-23

### Ditambahkan
- Komponen interaktif React Bits:
  - Berkas CV interaktif WebGL2 refraction ([`Folder`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/folder.tsx)).
  - Floating pill dock navigation & mobile drawer ([`PillNav`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/pill-nav.tsx)).
  - Kartu identitas 3D fisik dengan tali pegas Three.js ([`Lanyard`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/lanyard.tsx)).
  - Kartu hologram interaktif dengan efek tilt 3D ([`ProfileCard`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/profile-card.tsx)).
- Panel kontrol konfigurasi lokal di `/admin` dengan state management [`src/lib/site-store.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/site-store.ts).

---

## [0.1.0] - 2026-10-20

### Ditambahkan
- Inisialisasi proyek Next.js 16 App Router dengan React 19, TypeScript 5, dan Tailwind CSS v4.
- Skrip validasi browser otomatis Headless Chrome DevTools Protocol di [`scripts/check.mjs`](file:///e:/ProjectZekk/Porotofolio-Zekk/scripts/check.mjs).
