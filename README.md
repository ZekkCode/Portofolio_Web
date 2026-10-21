# ZekkTech · Portfolio

Portfolio profesional interaktif untuk **Zakaria Mujur Prasetyo (ZekkTech)**.
Dibangun dengan Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4 + TypeScript.

- **Website Resmi**: [https://zekktech.biz.id](https://zekktech.biz.id)
- **Repositori GitHub**: [https://github.com/ZekkCode/Portofolio_Web.git](https://github.com/ZekkCode/Portofolio_Web.git)

---

## Indeks Dokumentasi Teknis

Untuk detail arsitektur, standar desain, dan pemeliharaan teknis, baca dokumen pendukung berikut:

- 📑 **[`CONTEXT.md`](./CONTEXT.md)**: Arsitektur proyek, peta komponen, dan alur state data.
- 🎨 **[`DESIGN.md`](./DESIGN.md)**: Standar desain editorial, pasangan font Bricolage & Plus Jakarta Sans, palet warna, dan aturan anti-slop.
- 🌊 **[`PARALLAX.md`](./PARALLAX.md)**: Konfigurasi Lenis Smooth Scroll, viewport culling, dan sistem GPU parallax.
- 🤖 **[`AGENTS.md`](./AGENTS.md)**: Panduan untuk AI coding agents, perintah validasi wajib, dan konvensi git.
- 🔒 **[`SECURITY.md`](./SECURITY.md)**: Kebijakan keamanan, konfigurasi HTTP security headers, dan isolasi rute admin.
- 🔍 **[`SEO.md`](./SEO.md)**: Strategi mesin pencari, dynamic OpenGraph image, sitemap.xml, robots.txt, dan JSON-LD schema.

---

## Menjalankan di Lokal

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
- **Aset Ultra-Ringan (WebP First)**: Seluruh gambar dan icon tools terkompresi WebP (~1 KB per icon) untuk loading instan.
- **Panel Admin Lokal (`/admin`)**: Kustomisasi visual lanyard, kartu profil, dan manajemen proyek yang tersimpan langsung di `localStorage` browser (`zekk:site:v1`).

