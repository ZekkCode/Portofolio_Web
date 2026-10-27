# ZekkTech · Portfolio

Portfolio profesional interaktif untuk **Zakaria Mujur Prasetyo (ZekkTech)**.
Dibangun dengan Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + TypeScript.

- **Website Resmi**: [https://zekktech.biz.id](https://zekktech.biz.id)
- **Repositori GitHub**: [https://github.com/ZekkCode/Portofolio_Web.git](https://github.com/ZekkCode/Portofolio_Web.git)

---

## Indeks Dokumentasi Teknis

Untuk detail arsitektur, standar desain, dan pemeliharaan teknis, baca dokumen pendukung berikut:

- 📑 **[`CONTEXT.md`](./CONTEXT.md)**: Arsitektur proyek, peta komponen, dan alur state data.
- 🗄️ **[`DATABASE.md`](./DATABASE.md)**: Arsitektur cloud Supabase (PostgreSQL/RLS), Cloudflare R2 Object Storage, dan graceful fallback.
- 🎨 **[`DESIGN.md`](./DESIGN.md)**: Standar desain editorial, pasangan font Bricolage & Plus Jakarta Sans, palet warna, dark mode, dan aturan anti-slop.
- 🌊 **[`PARALLAX.md`](./PARALLAX.md)**: Konfigurasi Lenis Smooth Scroll, viewport culling, dan sistem GPU parallax.
- 🛠️ **[`SKILL.md`](./SKILL.md)**: Taksonomi kompetensi 4 role karier ZekkTech dan skill AI Agent terpasang.
- 🔄 **[`WORKFLOW.md`](./WORKFLOW.md)**: Alur kerja pengembangan, konfigurasi environment, siklus pengujian CDP, dan CI/CD Vercel.
- 🤖 **[`AGENTS.md`](./AGENTS.md)**: Panduan untuk AI coding agents, checklist validasi wajib, dan konvensi git.
- 🔒 **[`SECURITY.md`](./SECURITY.md)**: Kebijakan keamanan, konfigurasi HTTP security headers, sanitasi API, dan proteksi rute admin.
- 🔍 **[`SEO.md`](./SEO.md)**: Strategi mesin pencari, dynamic OpenGraph image, sitemap.xml, robots.txt, dan JSON-LD schema.
- 📜 **[`POLICY.md`](./POLICY.md)**: Kebijakan privasi cookie-less, tata kelola data klien, dan lisensi open source.
- 🤝 **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**: Panduan kontribusi, alur pull request, dan standar kode.
- 📝 **[`CHANGELOG.md`](./CHANGELOG.md)**: Riwayat pembaruan versi dan catatan rilis fitur.

---

## Menjalankan di Lokal

1. Salin konfigurasi environment:
```powershell
cp .env.example .env.local
```

2. Instal dependensi dan jalankan server pengembang:
```bash
npm install
npm run dev      # Buka di http://localhost:3000
npm run build    # Kompilasi build produksi Next.js
```

Menjalankan uji otomatisasi browser (Headless Chrome):
```bash
node scripts/check.mjs
```

---

## Fitur Unggulan

- **React Bits `<Folder />`**: Berkas CV interaktif dengan WebGL2 refraction, flap/book mode, dan modal pratinjau dokumen (Graphic Designer, UI/UX Designer, Frontend Developer, IT Support).
- **React Bits `<PillNav />`**: Floating pill dock navigation di desktop (bawah tengah) dan drawer responsif di mobile (kanan atas) dengan spring physics.
- **Simulasi 3D `<Lanyard />`**: Kartu ID menggantung dengan simulasi tali pegas fisik berbasis Three.js.
- **Hologram `<ProfileCard />`**: Kartu profil interaktif dengan efek tilt 3D dan pencahayaan dinamis di hero section.
- **Dark Mode & Light Mode**: Sistem tema mulus berbasis `next-themes` dengan preservasi preferensi sistem operasi.
- **Dukungan Dwibahasa (ID / EN)**: Alih bahasa dinamis berbasis `react-i18next` tanpa reload halaman.
- **Penyimpanan Cloud & Hybrid Fallback**: Panel admin (`/admin`) mendukung penyimpanan lokal (`localStorage`) dan sinkronisasi instan ke **Supabase Cloud Database** & **Cloudflare R2 Storage**.
- **Live Counter Kunjungan**: Penghitung impresi halaman persisten di Supabase dengan proteksi deduplikasi IP pengunjung.
- **Aset Ultra-Ringan (WebP First)**: Seluruh gambar dan icon tools terkompresi WebP (~1 KB per icon) untuk loading instan.

---

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](./LICENSE). Hak cipta konten portofolio milik Zakaria Mujur Prasetyo.
