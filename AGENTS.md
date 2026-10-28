# Agent Guidelines — Porotofolio-Zekk

Petunjuk teknis dan aturan operasional untuk AI Coding Agent (Cline, Roo Code, Cursor, Copilot, dll.) saat memelihara repositori ini.

---

## 1. Lingkungan & Standar Kerja
- **OS**: Windows 11 / PowerShell (`powershell.exe`).
- **Node.js**: v22+.
- **Package Manager**: `npm`.
- **Gaya Komunikasi**: Terse, direct, to the point. Tanpa filler, hedging, atau basa-basi pembuka/penutup.
- **Prinsip Pengembangan**: Lazy Senior Developer (Lite) — kode paling bagus adalah kode yang tidak perlu ditulis. Manfaatkan fitur native platform dan dependensi yang sudah terpasang.

---

## 2. Perintah Wajib Verifikasi
Sebelum melakukan commit atau menyatakan tugas selesai:
1. **Type Check**:
   ```powershell
   ./node_modules/.bin/tsc --noEmit
   ```
2. **Headless Browser Test**:
   ```powershell
   node scripts/check.mjs
   ```
   *Catatan: Pastikan Chrome headless tidak terkunci di background (`Get-Process chrome`).*
3. **Build Produksi**:
   ```powershell
   npm run build
   ```

---

## 3. Alur Kerja Git & Sinkronisasi Vercel
Repositori ini terhubung dengan deployment otomatis Vercel yang memonitor commit remote.
- **Branch Produksi**: Repositori melacak `master` dan `main`.
- **Aturan Push**: Setiap kali melakukan push, wajib sinkronkan ke KEDUA branch untuk menjamin pemicu webhook Vercel selalu aktif:
  ```powershell
  git add -A
  git commit -m "tipe: pesan perubahan"
  git push origin master:master
  git push origin master:main
  ```

---

## 4. Konvensi Komponen React Bits
- Komponen dari React Bits (`folder.tsx`, `pill-nav.tsx`, `lanyard.tsx`, `shape-grid.tsx`, `profile-card.tsx`) merupakan komponen berbasis client (`'use client'`).
- Gunakan `useIsomorphicLayoutEffect` (fallback ke `useEffect` saat SSR) untuk mencegah peringatan hidrasi Next.js.
- Pastikan interaksi fisik spring/Euler selalu memiliki batas `clamp()` pada `dt`, kecepatan `v`, dan posisi `p` untuk mencegah overflow numerik di WebGL / Three.js.

---

## 5. Konvensi Variabel Lingkungan & Cloud
- Jangan pernah menuliskan *hardcoded secrets* atau men-commit berkas `.env.local`. Selalu gunakan template [`.env.example`](./.env.example).
- Setiap integrasi eksternal (Supabase, Cloudflare R2) wajib memiliki mekanisme *graceful fallback* ke mode lokal (`localStorage`, `.views.json`, atau Base64 Data URI) saat variabel lingkungan tidak tersedia.

---

## 6. Aturan Khusus & Anti-Halusinasi Proyek (Wajib Diikuti)
Semua instruksi berikut adalah ketetapan permanen dari pemilik proyek (user) dan dilarang keras diubah, dibalikkan, atau dihalusinasikan kembali di sesi manapun:
1. **CV Folder Interaktif (GSAP ScrollTrigger)**:
   - Status awal saat dimuat di atas: `isFolderOpen: false` (tertutup rapi).
   - Saat di-scroll ke bawah: Terbuka secara otomatis saat stage memasuki tengah viewport (`onEnter: open`).
   - Saat di-scroll melewati ke bawah (melewati seksi CV): Menutup kembali secara otomatis (`onLeave: close`).
   - Saat di-scroll balik ke atas: Terbuka kembali saat masuk ke tengah (`onEnterBack: open`).
   - Saat di-scroll terus ke atas menuju Hero/About: Menutup kembali (`onLeaveBack: close`).
   - Dilarang kembali ke `IntersectionObserver` satu arah yang hanya membuka tanpa menutup.
2. **Kondisi Data Proyek (Zero Slop / No Dummy Seed)**:
   - `defaultProjects` pada `src/lib/site-store.ts` wajib berupa array kosong `[]` jika belum diinput dari Supabase / panel admin.
   - Dilarang keras memunculkan proyek dummy/seed otomatis ke tampilan user tanpa instruksi eksplisit.
   - Jika belum ada data proyek di database, seksi proyek harus tetap menampilkan status "Belum Ada Proyek yang Ditampilkan" yang bersih dan elegan.
3. **Dilarang Menampilkan "Hero Repo / Featured Flagship"**:
   - Seksi proyek dilarang menampilkan kartu banner repo raksasa di atas grid. Semua proyek wajib tampil dalam grid kartu yang seragam dan bersih.
4. **Anti-Slop Copywriting & UI**:
   - Dilarang menambah micro-label bising, badge berlebihan, tag-cloud menumpuk, atau copy corporate AI slop.
   - Bahasa wajib otentik, ringkas, profesional, dan mencerminkan persona Zakaria Mujur P. (ZekkTech).
5. **Daftar Seksi Halaman Utama yang Terpasang**:
   - `#hero`: Kartu 3D Lanyard & Hologram Profile Card.
   - `#tentang`: Biografi, riwayat kerja/organisasi, dan statistik otentik.
   - `#cv`: Interactive 3D Folder (GSAP ScrollTrigger controlled).
   - `#services`: 4 Pilar Layanan (UI/UX, Frontend, Creative Media, IT Support).
   - `#workflow`: 4 Langkah Eksekusi Alur Kerja.
   - `#certificates`: Grid Kredensial & Sertifikasi Terverifikasi.
   - `#stack`: Kategori Alat, Bahasa, dan Platform.
   - `#proyek`: Grid Proyek Dinamis.
   - `#faq`: FAQ Accordion esensial.
   - `#kontak` & Footer: Form kontak langsung dan media sosial.
6. **Standar Ikon & Anti-Slop Panah**:
   - Dilarang keras memakai panah unicode buatan manual/AI-slop (seperti `→`, `↗`, `←`, `->`) langsung di dalam string atau markup teks.
   - Gunakan komponen ikon standar dari `lucide-react` (misal `<ArrowRight />`, `<ArrowUpRight />`, `<ChevronLeft />`, `<ChevronRight />`) dengan proporsi ukuran rapi (`size-3`, `size-3.5`).
7. **Pill Navbar Hiding Behavior**:
   - Navbar floating (`PortfolioPillNav`) wajib menghilang otomatis saat scroll mencapai bagian paling bawah halaman (area footer) agar tidak menutupi informasi hak cipta dan metadata.
8. **Tipografi Watermark Footer**:
   - Teks watermark "zakaria mp" di bagian footer wajib menggunakan font pixel (`Pixelify_Sans` / `--font-pixel`) dengan efek gradien vertikal memudar transparan ke bawah (`bg-clip-text text-transparent bg-gradient-to-b`).


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
