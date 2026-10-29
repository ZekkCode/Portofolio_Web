# Rekayasa Kinerja & Animasi — ZekkTech Portfolio

Dokumentasi optimasi performa rendering, efisiensi bundle JavaScript, integrasi WebGL Three.js, dan pemenuhan metrik Core Web Vitals.

---

## 1. Optimasi Tiga Pilar Core Web Vitals

### 1.1. Largest Contentful Paint (LCP)
- **Target Standar**: $\le 2.5\text{ detik}$.
- **Strategi Optimasi yang Diterapkan**:
  1. **Tipografi Judul Hero Semantik**: Menggantikan canvas `<TechText>` yang membutuhkan inisialisasi JS dengan elemen `<h1>` native 2 baris murni. Elemen LCP langsung dirender sejak byte HTML pertama diterima dari server tanpa jeda eksekusi JavaScript.
  2. **Font Subsetting & Zero Layout Shift**: Font Google (`Space_Grotesk`, `Plus_Jakarta_Sans`, `Pixelify_Sans`) di-subset untuk karakter `latin` dengan parameter `display: swap` via `next/font/google`. Font di-*self-host* otomatis oleh Next.js untuk mengeliminasi koneksi DNS pihak ketiga yang lambat.
  3. **Format Aset Modern**: Menetapkan prioritas format gambar `image/avif` dan `image/webp` pada [`next.config.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/next.config.ts) guna memangkas ukuran transfer aset visual hingga 60–80%.

### 1.2. Interaction to Next Paint (INP)
- **Target Standar**: $\le 200\text{ ms}$.
- **Strategi Optimasi yang Diterapkan**:
  1. **Pemisahan Loop Animasi WebGL**: Kanvas Three.js menggunakan `requestAnimationFrame` kondisional dengan mekanisme tidur (*calm state*). Jika objek kartu atau lembaran CV tidak bergerak atau berada di luar viewport, loop rendering berhenti otomatis untuk menghemat siklus CPU/GPU utama.
  2. **Passive Event Listeners**: Semua listener touch scrolling dan wheel scroll dikonfigurasikan dengan opsi `{ passive: true }` agar thread UI browser tidak pernah terblokir (*jank-free scrolling*).

### 1.3. Cumulative Layout Shift (CLS)
- **Target Standar**: $\le 0.1$.
- **Strategi Optimasi yang Diterapkan**:
  1. Semua stage pembungkus WebGL ([`LanyardStage`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/lanyard-stage.tsx), [`Folder`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/folder.tsx)) memiliki rasio aspek dan tinggi minimum yang terdefinisi dengan jelas (`h-[480px] sm:h-[540px] lg:h-[600px]`), mencegah lonjakan posisi konten (*content popping*) saat kanvas selesai dimuat.

---

## 2. Rekayasa WebGL Three.js & Manajemen Memori

### 2.1. Pencegahan Kebocoran Memori (*Memory Leak Mitigation*)
Komponen 3D ([`src/components/lanyard.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/lanyard.tsx) dan [`src/components/paper-crumple.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/paper-crumple.tsx)) mengimplementasikan siklus pembersihan menyeluruh pada saat *unmount*:
```ts
return () => {
  cancelAnimationFrame(frameId);
  renderer.dispose();
  renderer.forceContextLoss();
  geometry.dispose();
  material.dispose();
  texture.dispose();
  if (renderer.domElement && container.contains(renderer.domElement)) {
    container.removeChild(renderer.domElement);
  }
};
```

### 2.2. Optimasi Frustum & Kamera
- **Lanyard 3D**: `viewHeight` dihitung secara dinamis ($\ge 7.2$) dengan *headroom* vertikal yang lapang ($0.75 \times \text{cardDiag} + 0.85$), memastikan kartu yang berputar bebas tidak pernah terpotong oleh bidang clipping atas kamera (*near/top frustum plane*).
- **PaperCrumple**: Batas seret divalidasi terhadap *bounding box* aktual geometri, menjamin lembaran CV tetap berada di dalam viewport kamera dengan jarak aman 56 px dari batas bawah layar.

---

## 3. Integrasi Lenis Smooth Scroll & GSAP ScrollTrigger

Pada [`src/components/smooth-scroll.tsx`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/smooth-scroll.tsx):
- Lenis mengontrol posisi scroll dokumen dengan fungsi interpolasi halus.
- Posisi Lenis langsung disinkronkan ke GSAP ticker:
  ```ts
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
- **Aksesibilitas Reduced Motion**: Jika pengguna mengaktifkan preferensi *prefers-reduced-motion* pada sistem operasinya, efek perataan Lenis dinonaktifkan secara otomatis dan browser kembali ke scroll instan standar.

---

## 4. Hasil Audit & Pengujian Aktual

| Kategori Pengujian | Alat Pengujian | Kondisi Uji | Hasil Verifikasi |
| :--- | :--- | :--- | :--- |
| **Pengecekan Tipe Data** | `tsc --noEmit` | Seluruh codebase TypeScript | ✅ **0 Error (Lulus Sempurna)** |
| **Integrasi Browser Headless** | `node scripts/check.mjs` | Headless Chrome (1280x900) | ✅ **Semua 24 Kontrol Lulus** |
| **Build Produksi Turbopack** | `npm run build` | Next.js 16.4.2 Static Generation | ✅ **Sukses (0 Warning, 0 Error)** |
| **Visual Clipping Canvas** | DevTools Protocol Screenshot | Viewport 1440px & 390px | ✅ **Lanyard & Kertas Utuh 100%** |
