# ZekkTech CMS v3.5 — Security & Access Control Review

Laporan audit keamanan dan mitigasi kerentanan untuk sistem CMS Portofolio ZekkTech (`https://zakariamp.vercel.app/`).

---

## 1. Matriks Penilaian Keamanan (Security Posture)

| Area Keamanan | Mekanisme Pertahanan | Status Audit | Catatan Verifikasi |
| :--- | :--- | :---: | :--- |
| **Autentikasi Admin** | Signed Cookie HMAC-SHA256 & Supabase SSR Auth | **LULUS (PASS)** | Menggunakan `crypto.timingSafeEqual` untuk mencegah serangan timing. Kedaluwarsa otomatis dalam 8 jam. |
| **Proteksi CSRF** | Header Origin & Host Whitelist Verification | **LULUS (PASS)** | `verifyCsrfOrigin()` memeriksa semua mutasi POST/PUT/DELETE. Permintaan lintas domain ditolak (403). |
| **Pencegahan XSS / Injection** | URL Sanitizer (`isSafeUrl`) & Skema Schema Validation | **LULUS (PASS)** | Protokol berbahaya seperti `javascript:`, `vbscript:`, dan `data:text/html` diblokir pada URL proyek dan sertifikat. |
| **Rate Limiting** | In-Memory Sliding Window Rate Limiter | **LULUS (PASS)** | Membatasi percobaan brute force pada login, pengunggahan media, dan Miss Minute chat API (30 req/menit). |
| **Row Level Security (RLS)** | Kebijakan Akses PostgreSQL Supabase | **LULUS (PASS)** | Pengunjung anonim hanya dapat membaca `id = 'current'`. Draf dan revisi terlindungi. |
| **Keamanan Unggah Media** | Whitelist MIME-Type & UUID Key Generation | **LULUS (PASS)** | Berkas diunggah dengan ekstensi terverifikasi dan UUID unik di Cloudflare R2; mencegah directory traversal. |
| **Sanitisasi Ekspor Cadangan** | Ekspor Khusus Payload Konfigurasi Publik | **LULUS (PASS)** | Endpoint `/api/admin/backup` hanya mengekspor struktur `SiteConfig`, tanpa rahasia lingkungan (ENV/Keys). |

---

## 2. Rincian Implementasi Proteksi

### A. HMAC-SHA256 Signature Verification (`src/lib/auth-server.ts`)
```ts
const a = Buffer.from(signaturePart);
const b = Buffer.from(expectedSignature);
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
  return { valid: false };
}
```
Mencegah eksploitasi timing analysis dalam memvalidasi token sesi admin.

### B. Validasi Asal Permintaan CSRF
```ts
const allowedHosts = new Set([
  host,
  "zakariamp.vercel.app",
  "localhost:3000",
  "127.0.0.1:3000",
]);
return allowedHosts.has(originUrl.host);
```
Seluruh rute mutasi (`/api/config`, `/api/upload`, `/api/admin/revisions`, `/api/admin/backup`) mewajibkan pemeriksaan CSRF origin.

### C. Pembatasan Unggahan & Sanitasi URL
1. Berkas non-gambar dan berkas berukuran melebihi 10MB ditolak pada endpoint `/api/upload`.
2. Format WebP diproduksi otomatis di browser sebelum transfer untuk mereduksi beban penyimpanan dan mencegah eksekusi skrip payload embedded.
3. Fungsi `auditContentHealth` memvalidasi bahwa seluruh tautan ke repositori GitHub, demo, dan kredensial sertifikasi mematuhi protokol aman (`https://`).
