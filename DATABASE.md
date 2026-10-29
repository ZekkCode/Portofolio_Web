# Cloud Database & Storage Architecture — ZekkTech Portfolio

Dokumen ini memuat panduan arsitektur backend, skema database Supabase, konfigurasi Cloudflare R2 Object Storage, variabel lingkungan, serta mekanisme *graceful fallback* di portfolio ZekkTech.

---

## 1. Arsitektur Hybrid Cloud & Local-First

Situs mengadopsi arsitektur *Local-First with Cloud Synchronization*:
- **Mode Offline/Lokal**: Jika variabel lingkungan cloud belum diisi, seluruh pengaturan panel admin tersimpan di `localStorage` peramban (`zekk:site:v1`), gambar disimpan sementara sebagai Base64 Data URI, dan counter kunjungan disimpan di berkas lokal [`.views.json`](file:///e:/ProjectZekk/Porotofolio-Zekk/.views.json).
- **Mode Cloud Aktif**: Saat kredensial Supabase dan Cloudflare R2 dikonfigurasi, sistem otomatis beralih menjadi full-cloud persistence dengan performa global edge.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Panel Admin (/admin)                          │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Unggah Berkas                   │ Simpan Konfigurasi
                   ▼                                 ▼
         ┌───────────────────┐             ┌───────────────────┐
         │  POST /api/upload │             │  POST /api/config │
         └─────────┬─────────┘             └─────────┬─────────┘
                   │                                 │
     ┌─────────────┴─────────────┐         ┌─────────┴─────────┐
     ▼                           ▼         ▼                   ▼
Cloudflare R2            Fallback Data URI Supabase Cloud    localStorage
(S3 SDK via r2.ts)       (Base64 lokal)    (site_config)     (zekk:site:v1)
```

---

## 2. Supabase Cloud Database

Integrasi berada di [`src/lib/supabase.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/supabase.ts) menggunakan pustaka `@supabase/supabase-js`.

### Skema Tabel SQL ([`supabase/schema.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/schema.sql))

#### A. Tabel `site_config` (Konfigurasi Portofolio)
Menyimpan pengaturan visual 3D Lanyard, Hologram Profile Card, koleksi Proyek showcase, berkas CV kustom, dan URL logo header.

```sql
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_config"
  ON public.site_config FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin write site_config"
  ON public.site_config FOR ALL TO authenticated
  USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com')
  WITH CHECK (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com');
```

#### B. Tabel `page_views` (Penghitung Kunjungan Persisten)
Mencatat jumlah impresi pengunjung portofolio dengan nilai awal *seed* 1.420+.

```sql
CREATE TABLE IF NOT EXISTS public.page_views (
  id TEXT PRIMARY KEY DEFAULT 'portfolio',
  count BIGINT NOT NULL DEFAULT 1420,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_views"
  ON public.page_views FOR SELECT TO anon, authenticated USING (true);

-- Pembaruan hanya dilakukan lewat RPC increment_page_view() atau service_role server-side
```

#### C. Tabel `project_views` (Engaged Valid Views & Deduplikasi 24 Jam)
Menyimpan riwayat kunjungan berkualitas (*Engaged View* 15–30 detik) dengan hash anonim privasi tinggi (`visitor_hash` = SHA256(IP + UserAgent)):

```sql
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL DEFAULT 'portfolio',
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_views_dedup
  ON public.project_views (project_id, visitor_hash, created_at DESC);

ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read project_views"
  ON public.project_views FOR SELECT USING (true);

CREATE POLICY "Allow insert project_views"
  ON public.project_views FOR INSERT WITH CHECK (true);
```

### Endpoint API Terkait:
- `GET /api/config`: Mengambil konfigurasi aktif dari tabel `site_config` atau fallback status lokal.
- `POST /api/config`: Memvalidasi payload via `normalizeConfig()` dan melakukan `upsert` ke record `id = 'current'`.
- `GET /api/views`: Mengambil jumlah total tampilan portofolio terkini untuk render instan.
- `POST /api/views`: Menerima sinyal *Engaged View* (setelah tab aktif 20 detik), memverifikasi hash SHA256 pengunjung, melakukan pengecekan jeda 24 jam di `project_views`, dan menginkremen `page_views` bila valid.


---

## 3. Cloudflare R2 Object Storage

Integrasi berada di [`src/lib/r2.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/r2.ts) menggunakan `@aws-sdk/client-s3`.

### Spesifikasi:
- **Tujuan**: Penyimpanan gambar tekstur Lanyard 3D, avatar Profile Card, thumbnail proyek, dan dokumen PDF berkas CV.
- **Protokol**: S3 API Compatible (`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`).
- **Penamaan Objek**: `<folder>/<timestamp>-<sanitized-filename>.<ext>` untuk mencegah tabrakan nama berkas.
- **Penyajian CDN Publik**: URL dihasilkan langsung mengarah ke `R2_PUBLIC_DOMAIN` (mis. domain kustom atau `pub-xxxx.r2.dev`).
- **Endpoint**:
  - `GET /api/upload`: Mengembalikan status kesiapan koneksi R2 dan Supabase.
  - `POST /api/upload`: Menerima multipart/form-data dan mengunggah langsung ke bucket R2 (atau fallback Data URI).

---

## 4. Konfigurasi Variabel Lingkungan ([`.env.example`](file:///e:/ProjectZekk/Porotofolio-Zekk/.env.example))

Salin berkas template ke lingkungan lokal:
```powershell
Copy-Item .env.example .env.local
```

### Variabel yang Dibutuhkan:

| Variabel | Deskripsi | Sumber Kredensial |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Account ID | Cloudflare Dashboard > Overview |
| `R2_ACCESS_KEY_ID` | S3 Access Key ID untuk R2 | Cloudflare Dashboard > R2 > Manage R2 API Tokens |
| `R2_SECRET_ACCESS_KEY` | S3 Secret Access Key untuk R2 | Cloudflare Dashboard > R2 > Manage R2 API Tokens |
| `R2_BUCKET_NAME` | Nama bucket target (mis. `zekk-portfolio`) | Cloudflare Dashboard > R2 > Buckets |
| `R2_PUBLIC_DOMAIN` | Domain publik bucket R2 | Bucket Settings > Public Access > R2.dev / Custom Domain |
| `NEXT_PUBLIC_SUPABASE_URL` | URL endpoint REST Supabase | Supabase Dashboard > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim publik Supabase | Supabase Dashboard > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci service role backend Supabase | Supabase Dashboard > Project Settings > API |

---

## 5. Prosedur Deployment & Inisialisasi

1. **Inisialisasi Database**:
   - Buat proyek baru di [Supabase](https://app.supabase.com).
   - Buka menu **SQL Editor**, salin seluruh isi [`supabase/schema.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/schema.sql), lalu klik **Run**.
2. **Inisialisasi Bucket R2**:
   - Buat bucket di Cloudflare R2 dengan nama yang sama dengan `R2_BUCKET_NAME`.
   - Buka **Settings** bucket > aktifkan **Public access** (via R2.dev domain atau hubungkan ke custom domain).
   - Konfigurasikan CORS jika diperlukan untuk akses langsung file dari domain utama `https://zekktech.biz.id`.
3. **Injeksi ke Vercel**:
   - Buka dashboard proyek di Vercel > **Settings** > **Environment Variables**.
   - Tambahkan seluruh pasangan key-value di atas untuk target environment `Production` dan `Preview`.
