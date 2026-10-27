# Security Policy — ZekkTech Portfolio

Dokumen ini memuat kebijakan keamanan, konfigurasi header HTTP pertahanan mendalam, dan penanganan isolasi rute.

---

## 1. Kebijakan Pelaporan Kerentanan
Jika Anda menemukan celah keamanan atau kerentanan potensial di repositori ini, harap hubungi pengembang secara privat melalui:
- **Email**: `zakariamujur6@gmail.com`
- **WhatsApp**: `+62 881-0817-72005`

Mohon untuk tidak membuka issue publik sebelum perbaikan dirilis.

---

## 2. Header Keamanan HTTP (`next.config.ts`)

Aplikasi ini menyajikan header HTTP modern untuk seluruh rute (`/:path*`):

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];
```

### Manfaat Proteksi:
- **`X-Content-Type-Options: nosniff`**: Mencegah browser melakukan MIME-sniffing terhadap respon eksternal.
- **`X-Frame-Options: SAMEORIGIN`**: Mencegah serangan clickjacking dengan melarang embedding dalam iframe pihak ketiga.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Menjaga kerahasiaan path URL saat visitor menavigasi ke domain eksternal.
- **`Permissions-Policy`**: Membatasi akses peramban ke mikrofon, kamera, dan geolokasi karena situs ini beroperasi sebagai web showcase statis.

---

## 3. Isolasi Panel Admin & Keamanan API Server

### A. Isolasi Rute `/admin`
- **Blokir Crawler Mesin Pencari**: Rute `/admin` diblokir secara eksplisit di [`src/app/robots.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/robots.ts) (`disallow: ["/admin"]`) dan dikecualikan dari [`src/app/sitemap.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/sitemap.ts). Layout admin menginjeksi metadata `robots: { index: false, follow: false }`.
- **Sanitasi Data Masukan**: Semua payload konfigurasi yang masuk diverifikasi melalui skema `normalizeConfig()` di [`src/lib/site-store.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/site-store.ts) guna mencegah manipulasi struktur JSON tak terdaftar (*prototype pollution* / script injection).

### B. Keamanan Endpoint Server API (`/api/*`)
1. **Endpoint Konfigurasi (`/api/config`)**:
   - Menghubungkan aplikasi ke Supabase Cloud via server-side execution. Kredensial sensitif seperti `SUPABASE_SERVICE_ROLE_KEY` hanya dieksekusi di lingkungan server Next.js dan tidak pernah dibocorkan ke bundle JavaScript klien.
2. **Endpoint Unggah Berkas (`/api/upload`)**:
   - Memvalidasi keberadaan berkas multipart, MIME-type, dan mengubah nama berkas secara aman menggunakan timestamp acak untuk mencegah penimpaan file sistem (*path traversal*).
   - Akses key Cloudflare R2 (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) diisolasi murni di server backend.
3. **Endpoint Pelacak Impresi (`/api/views`)**:
   - **Rate Limiting & Deduplikasi**: Hanya memperbolehkan 1 hitung kunjungan per alamat IP per 15 menit menggunakan pemetaan waktu in-memory.
   - **Pembersihan Memori Otomatis (Garbage Collection)**: Cache memori IP secara berkala dipangkas jika ukurannya melebihi 1.000 entri dan usia rekaman melampaui 1 jam untuk mencegah serangan kehabisan memori (*denial of service via memory exhaustion*).

---

## 4. Keamanan Database Cloud (Supabase Row Level Security)
- Seluruh tabel database (`site_config` dan `page_views`) menerapkan **Row Level Security (RLS)** bawaan PostgreSQL.
- Kebijakan baca dibuka untuk publik (`SELECT USING (true)`), sedangkan operasi mutasi data dibatasi dan divalidasi melalui aturan skema [`supabase/schema.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/schema.sql).
- File rahasia `.env.local` masuk dalam aturan [`.gitignore`](file:///e:/ProjectZekk/Porotofolio-Zekk/.gitignore) dan tidak pernah di-commit ke repositori Git.
