# Fundamental Arsitektur & Rekayasa Perangkat Lunak — ZekkTech Portfolio

Panduan pembelajaran dan penjelasan konsep teknis mendalam untuk pemilik proyek dan pengembang yang memelihara repositori ini.

---

## 1. Server Components vs Client Components

### Konsep & Definisi
- **Server Components (RSC)**: Komponen React yang dieksekusi **hanya di server**. Outputnya berupa HTML dan format representasi virtual DOM (RSC payload) yang dikirim ke browser tanpa mengikutsertakan kode JavaScript komponen tersebut ke dalam bundle klien.
- **Client Components (`'use client'`)**: Komponen yang dieksekusi di server (saat render awal) **dan dihidrasi di browser**. Komponen ini memiliki akses ke Browser API (`window`, `document`, WebGL, event listener, `useEffect`, dan `useState`).

### Peran dalam Proyek Ini
- **Server**: [`src/app/layout.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/layout.tsx), [`src/app/not-found.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/not-found.tsx), dan seluruh API Route Handlers. Teks judul `<h1>`, deskripsi profil, font, dan tag JSON-LD dirender di server agar langsung terbaca bot Google/Bing tanpa menunggu eksekusi JS.
- **Client**: [`src/components/lanyard.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/lanyard.tsx) (Three.js WebGL canvas), [`src/components/folder.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/folder.tsx) (GSAP ScrollTrigger), dan [`src/components/portfolio-pill-nav.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/portfolio-pill-nav.tsx) (pemantauan posisi scroll jendela).

### Risiko Jika Salah Diterapkan
- Menaruh `'use client'` di akar aplikasi tanpa kebutuhan menyebabkan seluruh bundle pustaka besar (Three.js, GSAP) diunduh di awal, memperlambat Largest Contentful Paint (LCP) dan First Input Delay / INP.
- Menjalankan fungsi yang membutuhkan DOM (`window.addEventListener`) di Server Component menyebabkan crash kompilasi (*server rendering error*).

---

## 2. Autentikasi vs Otorisasi

### Konsep & Definisi
- **Authentication (Autentikasi / *Siapa Anda?*)**: Proses membuktikan identitas pengguna (misalnya: memverifikasi bahwa pengakses adalah pemilik email `zakariamujur6@gmail.com` melalui password atau token).
- **Authorization (Otorisasi / *Apa yang Boleh Anda Lakukan?*)**: Proses memeriksa apakah pengguna yang sudah terotentikasi memiliki hak akses atau izin untuk melakukan operasi tertentu (misalnya: hanya role `admin` yang boleh mengubah tabel `site_config` atau mengunggah berkas ke R2).

### Implementasi pada Proyek Ini
File [`src/lib/auth-server.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/lib/auth-server.ts) menjalankan kedua fungsi:
```ts
// Autentikasi: Memverifikasi validitas tanda tangan kriptografis token sesi
const verified = verifySessionToken(sessionCookie);

// Otorisasi: Memastikan email pemegang token sesuai dengan daftar admin sah
const isAuthorized = verified.email === process.env.ADMIN_EMAIL;
```

### Risiko Jika Salah Diterapkan
Hanya menyembunyikan tombol UI admin di sisi klien tanpa memvalidasi otorisasi di route server ([`src/app/api/config/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/config/route.ts)) membuka celah di mana siapa saja dapat mengirim `curl -X POST` untuk mengubah konten situs tanpa izin.

---

## 3. Signed Session Cookie vs Stateless JWT

### Konsep & Definisi
- **Signed Session Cookie**: Data sesi disimpan di dalam cookie klien tetapi dilengkapi **tanda tangan digital (HMAC-SHA256)** menggunakan kunci rahasia server (*server secret*). Klien tidak dapat mengubah isi payload (misal mengubah role dari `visitor` menjadi `admin`) karena signature akan menjadi tidak valid.
- **Stateless Bearer JWT**: Token yang dikirim via header `Authorization: Bearer <token>`.

### Keunggulan dalam Proyek Ini
- Menggunakan cookie signed `zekk_admin_session` dengan flag:
  - `HttpOnly`: Mencegah JavaScript berbahaya (skrip XSS) membaca token.
  - `SameSite=Lax`: Mencegah token dikirim secara otomatis pada serangan CSRF lintas domain.
  - `Secure`: Memastikan cookie hanya ditransmisikan melalui protokol terenkripsi HTTPS.

---

## 4. Path Traversal & Mitigasinya

### Konsep & Definisi
- **Path Traversal (Direktori Traversal)**: Kerentanan di mana input pengguna yang tidak disaring (seperti `../../.env.local`) digunakan untuk membangun path filesystem lokal, memungkinkan penyerang membaca file sensitif server di luar direktori yang diizinkan.

### Implementasi Aman pada [`src/app/api/cv-pdf/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/cv-pdf/route.ts)
```ts
function resolveSafeLocalFile(requestedFile: string) {
  const publicDir = path.resolve(process.cwd(), "public");
  // 1. Ekstrak hanya nama berkas murni (hilangkan awalan ../ atau separator folder)
  const baseName = path.basename(requestedFile);
  // 2. Gabungkan secara aman dengan direktori public
  const resolved = path.resolve(publicDir, baseName);
  // 3. Validasi batasan direktori menggunakan path.relative
  const relative = path.relative(publicDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null; // Percobaan traversal digagalkan
  }
  // 4. Validasi allowlist ekstensi berkas
  const ext = path.extname(baseName).toLowerCase();
  if (![".pdf", ".png", ".jpg", ".webp"].includes(ext)) {
    return null; // Ekstensi tidak sah
  }
  return { fullPath: resolved, filename: baseName, ext };
}
```

---

## 5. Operasi Atomik Database vs *Race Condition*

### Konsep & Definisi
- **Race Condition**: Kondisi di mana beberapa permintaan yang berjalan bersamaan saling menimpa data satu sama lain karena membaca data lama sebelum operasi tulis selesai.
- **Atomic Operation**: Operasi yang diselesaikan sebagai satu kesatuan utuh di level mesin database (Postgres) tanpa bisa disela oleh transaksi lain.

### Masalah Counter Lama vs Solusi RPC Supabase
- *Metode Lama yang Rentan*:
  Request 1 membaca `count = 100`. Bersamaan dengan itu, Request 2 membaca `count = 100`. Keduanya menulis `101`. Hasilnya 1 pengunjung hilang.
- *Solusi Atomik di [`supabase/schema.sql`](file:///e:/ProjectZekk/Porotofolio-Zekk/supabase/schema.sql)*:
  ```sql
  CREATE OR REPLACE FUNCTION public.increment_page_view(page_id text, default_seed bigint DEFAULT 1420)
  RETURNS bigint
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    INSERT INTO public.page_views (id, count, updated_at)
    VALUES (page_id, default_seed + 1, NOW())
    ON CONFLICT (id) DO UPDATE
      SET count = public.page_views.count + 1,
          updated_at = NOW();
    RETURN new_count;
  END;
  $$;
  ```
  PostgreSQL mengunci baris (*row-level lock*) selama eksekusi fungsi, menjamin angka counter selalu presisi 100% meskipun menerima ribuan permintaan serentak.

---

## 6. Sinkronisasi Lenis Scroll & GSAP ScrollTrigger

### Konsep & Definisi
- **Lenis**: Pustaka *smooth scrolling* yang menginterpolasi posisi scroll window menggunakan fungsi matematika *lerp* (Linear Interpolation).
- **GSAP ScrollTrigger**: Engine animasi yang mendasarkan posisi animasi pada posisi scroll absolut dokumen.

### Kunci Sinkronisasi Dua Arah
Pada [`src/components/smooth-scroll.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/smooth-scroll.tsx), Lenis dan GSAP wajib dihubungkan melalui event update:
```ts
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
```
Dengan konfigurasi ini, ketika pengguna men-scroll ke atas maupun ke bawah, timeline animasi 3D Folder berkas CV membuka dan menutup dengan presisi tanpa desinkronisasi posisi visual (*lag jitter*).
