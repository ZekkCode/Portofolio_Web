# ZekkTech CMS v3.5 — QA & End-to-End Test Report

Laporan pengujian kualitas menyeluruh (*Quality Assurance*) untuk sistem CMS Portofolio ZekkTech (`https://zakariamp.vercel.app/`).

---

## 1. Ringkasan Eksekusi Quality Gates

| Gerbang Kualitas (Quality Gate) | Perintah / Alat | Status | Hasil & Bukti |
| :--- | :--- | :---: | :--- |
| **Type Check** | `./node_modules/.bin/tsc --noEmit` | **PASS** | 0 error TypeScript di seluruh codebase. |
| **Headless E2E Browser Test** | `node scripts/check.mjs` | **PASS** | Lanyard 3D render, Proyek terhubung, 25 kontrol aktif, Simpan & persistensi localStorage, Tambah proyek, sinkronisasi home: *"Semua cek lulus."* |
| **Next.js Production Build** | `npm run build` | **PASS** | 19 rute terkompilasi sukses dengan Next.js 16.4.2 (Turbopack). |

---

## 2. Hasil Verifikasi 7 Skenario Pengujian Kritis (Phase 10)

### Skenario 1 — Proyek (Projects CRUD & Lifecycle)
- **Draf**: Draf proyek disimpan ke `site_config` (`id: 'draft'`) dan tidak muncul di `/`. Hanya dapat ditinjau via `/admin/preview`.
- **Publikasi**: Menekan tombol "Simpan" (Publikasikan) menyimpan ke `id: 'current'`, mencatat snapshot revisi, dan segera merender kartu proyek di grid `/`.
- **Kategori & Filter**: Filter IT vs Desain berfungsi dinamis.
- **Miss Minute**: Menjawab jumlah proyek terpublikasi dan menyebutkan nama proyek terbaru.
- **Unpublish**: Mengubah status proyek ke `published: false` menghapus proyek dari tampilan publik tanpa merusak riwayat database.
- **Hasil**: **PASS**

### Skenario 2 — Pendidikan (Academic Journey)
- **CRUD Institusi**: Tambah riwayat kuliah, ubah nama program, derajat (S.Kom), dan periode tahun.
- **Media Logo**: Logo perguruan tinggi tersimpan permanen di Cloudflare R2 (atau fallback Data URI) dan tampil pada simpul linimasa horizontal.
- **Navigasi Linimasa**: Slider horizontal tahun akademik bergeser mulus tanpa jank layout.
- **Hasil**: **PASS**

### Skenario 3 — Kontak & Tautan Sosial
- **Sinkronisasi Terpusat**: Mengubah email kontak atau tautan sosial di Tab General secara otomatis memperbarui tombol Hero, kartu Kontak, tautan Footer, dan respon Miss Minute.
- **Sanitasi Protokol**: Skema email tervalidasi regex dan tautan sosial non-HTTPS/tidak aman ditolak oleh health auditor.
- **Hasil**: **PASS**

### Skenario 4 — Koleksi Kosong (Empty State Resilience)
- **Zero Dummy Seed**: Ketika seluruh proyek atau sertifikat dihapus secara sengaja, antarmuka menampilkan pesan "Belum Ada Proyek yang Ditampilkan" yang rapi.
- **Anti-Resurrection**: Berkas `profile.ts` tidak membangkitkan proyek dummy secara sepihak.
- **Hasil**: **PASS**

### Skenario 5 — Perlindungan Data Hilang & Konkurensi
- **Beforeunload Warning**: Pengguna yang mencoba menutup atau memuat ulang tab saat memiliki draf belum tersimpan mendapatkan konfirmasi peringatan browser.
- **Sinkronisasi Tab**: `useSyncExternalStore` memancarkan perubahan ke seluruh komponen secara reaktif.
- **Hasil**: **PASS**

### Skenario 6 — Keamanan Akses (Access Control & CSRF)
- **Blokir Anonim**: Permintaan mutasi tanpa cookie sesi admin `zekk_admin_session` langsung ditolak dengan status HTTP 401.
- **CSRF Whitelist**: Header `origin` divalidasi ketat terhadap domain yang diizinkan.
- **Hasil**: **PASS**

### Skenario 7 — Kegagalan Jaringan & Cloud Fallback
- **Pemberitahuan Transparan**: Jika Supabase tidak dapat dijangkau, sistem memberikan feedback status jelas: *"Tersimpan sebagai draf lokal (Supabase belum terkonfigurasi)"*. Tidak ada klaim palsu bahwa data telah dipublikasikan ke cloud.
- **Cadangan JSON**: Admin dapat mengunduh berkas cadangan offline (`/api/admin/backup`) kapan pun diperlukan.
- **Hasil**: **PASS**
