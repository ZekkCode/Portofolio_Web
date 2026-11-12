# ZekkTech CMS v3.5 — Remaining Tasks & Production Roadmap

Dokumen evaluasi kesiapan produksi (*Production Readiness*), status migrasi, dan rekomendasi iterasi mendatang untuk Portofolio ZekkTech (`https://zakariamp.vercel.app/`).

---

## 1. Status Kesiapan Rilis Produksi (Production Readiness)

| Komponen | Status Kesiapan | Catatan |
| :--- | :---: | :--- |
| **CRUD Seluruh Modul (20 Modul)** | **SIAP (READY)** | Seluruh modul telah memiliki formulir editor, persistensi Supabase, pemisahan draf/terbit, dan sinkronisasi publik. |
| **Sistem Pencegahan Data Loss** | **SIAP (READY)** | `beforeunload` listener, isolasi draf, dan deteksi versi aktif. |
| **Pemulihan & Cadangan JSON** | **SIAP (READY)** | Ekspor cadangan offline JSON via `/api/admin/backup`, impor dengan validasi skema dan audit integritas data. |
| **Sistem Riwayat Revisi** | **SIAP (READY)** | Snapshot otomatis saat publikasi, dialog inspeksi riwayat dan pemulihan instan (Rollback). |
| **Miss Minute AI Knowledge** | **SIAP (READY)** | Menjawab pertanyaan pengunjung berdasarkan data kanonikal terpublikasi di Supabase. |
| **Kepatuhan Kinerja Otomatis** | **SIAP (READY)** | Mempertahankan arsitektur kinerja adaptif (Lite, Balanced, Full) tanpa tombol sakelar visual. |

---

## 2. Kebutuhan Migrasi & Lingkungan Produksi

1. **Skema Database Supabase**:
   - Tabel `public.site_config` telah memadai dan mendukung penyimpanan JSONB terindeks (`id` sebagai Primary Key).
   - Tidak diperlukan migrasi skema DDL berisiko tinggi (*zero schema breaking changes*).
2. **Variabel Lingkungan (Vercel)**:
   - `ADMIN_EMAIL`: `zakariamujur6@gmail.com`
   - `ADMIN_SECRET` / `ADMIN_SESSION_SECRET`: Kunci HMAC sesi admin.
   - `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Akses PostgreSQL Supabase.
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`: Penyimpanan media Cloudflare R2.

---

## 3. Rekomendasi Prioritas Pengembangan Selanjutnya (Post-Launch)

1. **Pemotong Gambar Interaktif (Image Cropper)**: Menambahkan utilitas pemotong rasio aspek (16:9 untuk cover proyek, 1:1 untuk avatar) langsung di sisi klien sebelum kompresi WebP.
2. **Notifikasi Webhook**: Mengintegrasikan bot Telegram atau webhook email ketika ada pengunjung baru yang mengirim pesan formulir kontak.
3. **Pengujian Visual Lanjutan**: Memperluas skrip pengujian Playwright lintas peramban (WebKit / Firefox) untuk menguji transisi multi-bahasa ID/EN pada perangkat mobile.
