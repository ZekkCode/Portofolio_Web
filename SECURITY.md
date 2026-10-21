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

## 3. Isolasi Panel Admin (`/admin`)

- Panel admin (`src/app/admin/page.tsx`) hanya berfungsi di sisi peramban pengguna dan tidak terkoneksi ke backend database terbuka.
- **Blokir Crawler Mesin Pencari**: Rute `/admin` diblokir secara eksplisit di `src/app/robots.ts` (`disallow: ["/admin"]`) dan tidak dicantumkan di `src/app/sitemap.ts`.
- **Sanitasi JSON**: Impor konfigurasi diverifikasi melalui fungsi `normalizeConfig()` di `src/lib/site-store.ts` untuk memastikan hanya field terdaftar yang dievaluasi.
