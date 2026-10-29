# Laporan Audit Keamanan Sistem — ZekkTech Portfolio

Dokumentasi audit keamanan independen, analisis kerentanan (*Vulnerability Assessment*), dan langkah-langkah mitigasi yang telah diterapkan pada repositori ini.

---

## 1. Matriks Kerentanan & Status Remediasi

| Kode Temuan | Tingkat Keparahan (*Severity*) | Komponen / Berkas | Jenis Kerentanan | Status Mitigasi |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | 🔴 **Tinggi (High)** | `src/app/api/cv-pdf/route.ts` | Path Traversal & Open Redirect | ✅ **Tuntas Diperbaiki** |
| **SEC-02** | 🟠 **Sedang (Medium)** | `supabase/schema.sql` (`project_views`) | Paparan Data Privasi Pengunjung (RLS) | ✅ **Tuntas Diperbaiki** |
| **SEC-03** | 🟠 **Sedang (Medium)** | `supabase/schema.sql` (`increment_page_view`) | Manipulasi Counter Publik (RPC Grant) | ✅ **Tuntas Diperbaiki** |
| **SEC-04** | 🟡 **Rendah (Low)** | `next.config.ts` | Ketiadaan Header Content-Security-Policy | ✅ **Tuntas Diperbaiki** |
| **SEC-05** | 🟡 **Rendah (Low)** | `src/app/api/views/route.ts` | Race Condition & Ketiadaan Rate Limiting | ✅ **Tuntas Diperbaiki** |
| **SEC-06** | 🟢 **Aman (Informational)**| `src/app/api/upload/route.ts` | Validasi Ekstensi, Ukuran & MIME Type | ✅ **Terverifikasi Aman** |

---

## 2. Rincian Teknis Temuan & Mitigasi

### Temuan SEC-01: Path Traversal & Open Redirect pada Endpoint CV PDF
- **Lokasi**: [`src/app/api/cv-pdf/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/cv-pdf/route.ts)
- **Akar Masalah**:
  1. Parameter `?url=https://evil.com` diterima tanpa verifikasi domain tujuan, lalu diteruskan via HTTP 302 Redirect (*Open Redirect*).
  2. Parameter file lokal digabungkan menggunakan `path.join(process.cwd(), "public", targetUrl)` tanpa memeriksa keberadaan pola traversal `../` (*Directory Traversal*).
- **Langkah Remediasi**:
  1. Menerapkan `resolveSafeLocalFile()` menggunakan `path.relative()` untuk memverifikasi bahwa berkas yang diminta secara fisik berada di dalam direktori `public/`.
  2. Menerapkan allowlist ekstensi ketat: hanya `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`.
  3. Menerapkan allowlist domain: pengalihan external hanya diizinkan ke endpoint Cloudflare R2 resmi (`*.r2.cloudflarestorage.com` atau domain kustom terkonfigurasi di env).
  4. Menambahkan header `X-Content-Type-Options: nosniff`.
- **Hasil Pengujian**:
  - `GET /api/cv-pdf?url=../../.env.local` ➔ Mengembalikan berkas default ATS CV yang aman (Zero Leakage).
  - `GET /api/cv-pdf?url=https://phishing.com` ➔ Mengembalikan status `400 Bad Request`.

---

### Temuan SEC-02: Paparan Data Pengunjung pada Kebijakan RLS `project_views`
- **Lokasi**: [`supabase/schema.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/schema.sql) & [`supabase/migrations/20261030_tighten_visitor_rls.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/migrations/20261030_tighten_visitor_rls.sql)
- **Akar Masalah**: Kebijakan sebelumnya mengizinkan role publik (`anon`) menjalankan operasi `SELECT` pada tabel `project_views`:
  ```sql
  -- Rentan: Siapapun pemegang anon key dapat membaca seluruh log visitor
  CREATE POLICY "Public read project_views" ON public.project_views FOR SELECT TO anon USING (true);
  ```
- **Langkah Remediasi**:
  1. Menghapus kebijakan publik `SELECT` pada `project_views`.
  2. Membatasi izin `SELECT` hanya untuk role `authenticated` (admin panel yang telah login).

---

### Temuan SEC-03: Eksekusi Publik Tanpa Batas pada RPC `increment_page_view`
- **Lokasi**: Skema fungsi Supabase PostgreSQL
- **Akar Masalah**: Fungsi PostgreSQL `increment_page_view` diberikan izin `GRANT EXECUTE ... TO anon, authenticated`. Pengunjung atau bot dapat memanggil fungsi RPC ini secara berulang tanpa melewati filter deduplikasi 24 jam di server Next.js.
- **Langkah Remediasi**:
  1. Mencabut hak akses `EXECUTE` dari role `anon`:
     ```sql
     REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM anon;
     GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role, authenticated;
     ```
  2. Pemanggilan counter sekarang hanya dapat dieksekusi secara sah melalui Route Handler server [`src/app/api/views/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/views/route.ts).

---

### Temuan SEC-04: Penerapan Content Security Policy (CSP)
- **Lokasi**: [`next.config.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/next.config.ts)
- **Akar Masalah**: Belum ada header `Content-Security-Policy`, meningkatkan risiko injeksi skrip pihak ketiga (XSS) jika terjadi eksploitasi dependensi.
- **Langkah Remediasi**:
  Menambahkan header CSP yang dirancang kompatibel dengan Next.js App Router, Three.js shader compilation, Supabase websocket, dan Cloudflare CDN:
  ```text
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.cloudflare.com https://*.r2.dev https://raw.githubusercontent.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://*.cloudflare.com https://*.r2.dev;
  frame-ancestors 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  ```

---

### Temuan SEC-05: Rate Limiting pada Endpoint Analitik Kunjungan
- **Lokasi**: [`src/app/api/views/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/views/route.ts)
- **Langkah Remediasi**:
  Mengintegrasikan algoritma token bucket dari [`src/lib/auth-server.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/auth-server.ts) dengan batas 20 permintaan per menit per alamat IP. Permintaan yang melampaui ambang batas secara otomatis menerima respons `429 Too Many Requests`.

---

## 3. Isolasi Rahasia Server (*Server Secrets Isolation*)

Semua kunci rahasia berikut dijamin tidak pernah di-commit atau diekspos ke klien (*client bundle*):
- `SUPABASE_SERVICE_ROLE_KEY` (hanya digunakan di Server Component & Route Handlers).
- `ADMIN_SESSION_SECRET` (kunci HMAC penandatangan cookie sesi).
- `R2_ACCESS_KEY_ID` & `R2_SECRET_ACCESS_KEY` (kredensial S3 Cloudflare R2).

Klien hanya memiliki akses ke variabel dengan awalan `NEXT_PUBLIC_` yang memang dirancang untuk konsumsi publik browser (`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
