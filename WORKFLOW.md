# Development Workflow & CI/CD — Porotofolio-Zekk

Panduan alur kerja pengembangan, siklus pengujian, konvensi commit, dan otomatisasi deployment ke Vercel.

---

## 1. Alur Siklus Pengembangan Lokal

```
[Inisiasi .env.local] ──> [Edit Kode] ──> [Type Check: tsc] ──> [Test Browser: check.mjs] ──> [Build: next build] ──> [Dual Push: master & main]
```

### Langkah-langkah:
1. **Persiapan Lingkungan (Environment Setup)**:
   - Salin template variabel lingkungan:
     ```powershell
     Copy-Item .env.example .env.local
     ```
   - (Opsional jika menggunakan cloud) Isi kredensial Supabase dan Cloudflare R2 sesuai panduan [`DATABASE.md`](./DATABASE.md).
   - Eksekusi skema [`supabase/schema.sql`](./supabase/schema.sql) di SQL Editor Supabase untuk inisialisasi tabel `site_config` dan `page_views`.

2. **Jalankan Server Lokal**:
   ```powershell
   npm run dev
   # Mengakses http://localhost:3000 (portfolio) & http://localhost:3000/admin (panel kontrol)
   ```

3. **Validasi Tipe Data TypeScript**:
   ```powershell
   ./node_modules/.bin/tsc --noEmit
   ```

4. **Uji Otomatisasi Browser Headless (`scripts/check.mjs`)**:
   Menjalankan Chrome headless via Chrome DevTools Protocol (CDP) untuk memverifikasi 5 skenario penting:
   - Render canvas 3D lanyard hero.
   - Ketersediaan seluruh kartu proyek dan link GitHub.
   - Integritas 20+ kontrol form di panel `/admin`.
   - Reaktivitas penulisan state `localStorage` (`zekk:site:v1`).
   - Penambahan proyek baru secara reaktif di halaman utama.

5. **Kompilasi Build Produksi**:
   ```powershell
   npm run build
   ```

---

## 2. Standar Commit (Conventional Commits)

Format pesan commit terstruktur: `<tipe>(<lingkup>): <deskripsi singkat>`

| Tipe | Penggunaan | Contoh |
|---|---|---|
| `feat` | Fitur baru atau komponen baru | `feat(nav): integrate React Bits PillNav` |
| `fix` | Perbaikan bug atau penyesuaian logika | `fix(card): prevent spring physics overflow in Euler integration` |
| `style` | Perubahan tipografi, styling CSS, atau layout | `style: apply editorial typography and anti-slop rules` |
| `perf` | Optimasi aset, kompresi gambar, atau rendering | `perf: extract and convert icons to WebP` |
| `docs` | Pembaruan dokumentasi atau README | `docs: add comprehensive markdown suite` |
| `ci` | Konfigurasi Vercel, build script, atau tooling | `ci: configure vercel.json and optimize eslint` |

---

## 3. Otomatisasi Deployment Vercel

Repositori di-host di GitHub: `https://github.com/ZekkCode/Portofolio_Web.git`.
- **Target Branch**: Sinkronisasi ganda wajib ke `origin master` dan `origin main`.
- **Pemicu Otomatis**: Vercel GitHub App mendengarkan event push dan langsung menjalankan pipeline deployment zero-downtime.

```powershell
git add -A
git commit -m "tipe: deskripsi perubahan"
git push origin master:master
git push origin master:main
```
