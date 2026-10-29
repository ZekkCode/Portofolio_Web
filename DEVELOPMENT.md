# Panduan Pengembangan & Operasional — ZekkTech Portfolio

Panduan penyiapan lingkungan lokal, variabel lingkungan, alur kerja pengujian, dan tata cara deployment repositori.

---

## 1. Persyaratan Lingkungan Pengembangan

- **Sistem Operasi**: Windows 11 / macOS / Linux.
- **Node.js**: `v22.10.0+` (Periksa via `node -v`).
- **Package Manager**: `npm` `v10.0.0+` (Periksa via `npm -v`).
- **Browser Pengujian**: Google Chrome / Microsoft Edge / Brave (dibutuhkan untuk script pengujian headless).

---

## 2. Penyiapan Variabel Lingkungan (`.env.local`)

Salin berkas template [`.env.example`](file:///e:/ProjectZekk/Porotofolio-Zekk/.env.example) menjadi `.env.local`:
```powershell
cp .env.example .env.local
```

### Variabel Utama & Fungsinya
| Nama Variabel | Wajib/Opsional | Deskripsi & Fungsi |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Wajib | URL kanonikal publik situs (misal `https://zekktech.biz.id`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Opsional | URL proyek Supabase Cloud (jika ingin sinkronisasi konfigurasi cloud). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opsional | Kunci publik/anon Supabase untuk otentikasi browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Rahasia Server | Kunci admin Supabase untuk operasi backend berhak istimewa. |
| `ADMIN_SESSION_SECRET` | Rahasia Server | Kunci HMAC minimal 32 karakter untuk menandatangani cookie admin. |
| `R2_ACCOUNT_ID` | Opsional | Account ID Cloudflare untuk integrasi R2 storage. |
| `R2_ACCESS_KEY_ID` | Opsional | Access Key ID untuk penyimpanan berkas S3 Cloudflare. |
| `R2_SECRET_ACCESS_KEY` | Rahasia Server | Secret Access Key untuk penyimpanan berkas S3 Cloudflare. |
| `R2_BUCKET_NAME` | Opsional | Nama bucket R2 (default: `zekk-portfolio`). |

> [!IMPORTANT]
> **Prinsip Graceful Fallback**: Jangan khawatir jika belum memiliki akun Supabase atau Cloudflare R2! Aplikasi ini tetap berjalan 100% normal secara lokal menggunakan data statis default dan penyimpanan browser `localStorage`.

---

## 3. Menjalankan Server Pengembangan

Pasang dependensi dan jalankan server pengembangan Next.js:
```powershell
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 4. Tiga Langkah Verifikasi Wajib Sebelum Commit

Sebelum melakukan commit atau menyatakan tugas selesai, **wajib** menjalankan tiga verifikasi berikut secara berurutan:

### 1. Pengecekan Tipe Data (Type Check)
```powershell
./node_modules/.bin/tsc --noEmit
```
*Hasil yang diharapkan: Selesai dengan kode 0 (tanpa pesan error).*

### 2. Pengujian Browser Headless (Integration Test)
```powershell
node scripts/check.mjs
```
*Script ini menjalankan Chrome headless untuk memverifikasi canvas WebGL Lanyard, seksi proyek, dan 24 kontrol panel admin.*

### 3. Build Produksi (Production Build)
```powershell
npm run build
```
*Memverifikasi optimasi kompilasi Next.js Turbopack, pembuatan halaman statis, dan struktur route handler.*

---

## 5. Alur Kerja Git & Sinkronisasi Vercel

Repositori ini terhubung dengan deployment otomatis Vercel yang memonitor commit remote:
- **Branch Produksi**: Repositori melacak `master` dan `main`.
- **Aturan Push**: Setiap kali melakukan push ke GitHub, wajib sinkronkan ke **kedua** branch agar pemicu webhook Vercel selalu aktif:
  ```powershell
  git add -A
  git commit -m "tipe: pesan deskriptif perubahan"
  git push origin master:master
  git push origin master:main
  ```

---

## 6. Aturan Khusus Komponen (React Bits & Three.js)

1. **Komponen Client**: Komponen yang mengimpor Three.js atau GSAP (`folder.tsx`, `lanyard.tsx`, `paper-crumple.tsx`) wajib menyertakan arahan `'use client'` di baris pertama.
2. **Pencegahan Overflow Numerik**: Interaksi fisik pegas/Euler wajib menyertakan pembatasan `clamp()` pada delta waktu `dt`, kecepatan `v`, dan posisi objek `p` guna mencegah angka `NaN` atau objek melayang keluar dari layar.
3. **Anti-Slop Copywriting & UI**: Dilarang menambahkan panah unicode manual (`→`, `↗`), badge dekoratif berlebihan, atau teks korporat dummy. Gunakan ikon standar dari `lucide-react` dengan proporsi yang rapi (`size-3.5` atau `size-4`).
