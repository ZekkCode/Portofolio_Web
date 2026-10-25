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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
