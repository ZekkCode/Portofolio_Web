# Audit & Pemulihan P0 — Scroll Hang, Kontensi RAF & Stabilitas WebGL

Repositori: `ZekkCode/Portofolio_Web` (`e:\ProjectZekk\Porotofolio-Zekk`)  
Lingkungan Verifikasi: Next.js `16.4.2` production build (`next start -p 3001`), Chromium headless (`--enable-unsafe-swiftshader`), cold & warm cache, Desktop (`1440×900`) & Mobile (`390×844`).

---

## 1. Masalah yang Diperbaiki & Perubahan Arsitektur

1. **Sticker Peel WebGL Churn (`src/components/background-stickers.tsx`, `src/components/sticker-peel.tsx`)**
   - Sebelumnya: `useInView` memicu mount/unmount kanvas `<StickerPeel>` berulang kali sepanjang scroll.
   - Perbaikan: `StickerSlotItem` hanya menampilkan preview ringan secara default dan mempromosikan `<StickerPeel>` WebGL secara *lazy* saat pengguna berinteraksi (hover/touch), menjaga jumlah kanvas startup tetap rendah dan menghindari kompilasi shader serta `getImageData` mendadak di tengah scroll.
   - Di mobile (`390px`), `generateActiveStickers` dan loop render mengecualikan area Hero atas (`s.mobileSafe && s.topPercent >= 11`) dan menata slot bawah di tepi luar (`left: "-20px"` / `right: "-16px"`, `opacity: 0.55`).

2. **Konflik Transisi CSS vs RAF Loop (`src/components/buddy/buddy.css`, `src/hooks/use-buddy-roaming.ts`)**
   - Dihapus `transition: transform` pada `.buddy-root` yang sebelumnya bertabrakan dengan pembaruan `translate3d` setiap frame dari `requestAnimationFrame`.

3. **Kontensi Scroll & Kliping Timeline (`src/components/academic-journey-section.tsx`, `src/components/experience-timeline.tsx`)**
   - Dihapus `opacity` dari CSS `transition` pada kartu yang dikendalikan langsung oleh GSAP `ScrollTrigger` scrub, serta pembersihan `will-change-transform` statis berlebihan.
   - Di `experience-timeline.tsx`, `ScrollTrigger` menggunakan pengukuran `ResizeObserver(container)` (`updateBounds`) terpisah dari `onUpdate`, dengan `manualOverrideUntilRef` untuk mencegah scroll vertikal GSAP menimpa swipe horizontal/keyboard pengguna.
   - Diperbaiki offset awal kartu (`x: (i) => i * 22` dengan `start: "top 68%"`, `end: "bottom 20%"`) agar kartu pertama (`HIMATIF`) tidak terpotong di tepi kiri viewport container `overflow-x-auto`.

4. **Bidirectional Parallax (`src/components/parallax.tsx`, `src/app/page.tsx`)**
   - Dipastikan `Parallax` scrub berjalan dua arah (scroll turun & scroll naik), termasuk `align="bottom"` untuk watermark `<footer>`.

---

## 2. Bukti Trace Produksi (`http://localhost:3001`, `--enable-unsafe-swiftshader`)

Hasil pengukuran akhir pasca seluruh edit P0 dan P1:

### Ringkasan Kesehatan Global
- Console errors: `0`
- Uncaught exceptions: `0`
- Network failures (`status >= 400`): `0`
- Console warnings: `1`
- WebGL context loss (`lostCanvases`): `0` (Desktop & Mobile)

### Desktop (`1440×900` — `trace-final-prod-desktop.json`, `399,737` events)
| Metrik | Hasil Terukur |
| :--- | :--- |
| Cold Startup DOMContentLoaded | `230 ms` (`first-paint: 384 ms`, `FCP: 1128 ms`) |
| Warm Navigation DOMContentLoaded / Load | `136 ms` / `137 ms` |
| Resources / Transfer | `47` / `1047 KB` |
| Active `<canvas>` (Startup -> End) | `2` -> `4` (`lostCanvases: 0`) |
| JS Heap (Startup -> End) | `16.2 MB` -> `19.6 MB` |
| Frame Pacing (`3,746` samples, 3x full trip) | `avgFrameMs: 4.65 ms`, `p95FrameMs: 17.7 ms`, `framesOver33ms: 40` (`1.07%`) |
| React Commits / DOM Mutations saat Scroll | `95` commits / `9,026` mutations |
| Main-thread RunTasks > 50 ms | `12` (`max: 216.95 ms`; 5 di antaranya `GPUTask` SwiftShader `115.9–188.2 ms` + probe CDP `EvaluateScript` `216.9 ms`) |
| Breakdown Kategori Trace | `layout: 179.2 ms`, `recalcStyle: 1859.5 ms`, `paint: 1373.5 ms`, `evalScript: 276.8 ms`, `gc: 34.9 ms` |

### Mobile (`390×844` — `trace-final-prod-mobile.json`, `537,025` events)
| Metrik | Hasil Terukur |
| :--- | :--- |
| Cold Startup DOMContentLoaded / Load | `174 ms` / `176 ms` (`first-paint: 180 ms`, `FCP: 180 ms`) |
| Warm Navigation DOMContentLoaded / Load | `100 ms` / `101 ms` |
| Active `<canvas>` (Startup -> End) | `3` -> `3` (`lostCanvases: 0`) |
| JS Heap (Startup -> End) | `27.6 MB` -> `22.9 MB` |
| Frame Pacing (`4,615` samples, 3x full trip) | `avgFrameMs: 4.91 ms`, `p95FrameMs: 17.7 ms`, `framesOver33ms: 12` (`0.26%`) |
| React Commits / DOM Mutations saat Scroll | `89` commits / `8,040` mutations |
| Main-thread RunTasks > 50 ms | `3` (`99.67 ms` & `88.58 ms` `GPUTask` SwiftShader, `97.37 ms` probe CDP `EvaluateScript`) |
| Breakdown Kategori Trace | `layout: 44.9 ms`, `recalcStyle: 1683.7 ms`, `paint: 872.2 ms`, `evalScript: 173.8 ms`, `gc: 36.3 ms` |

---

## 3. Verifikasi Interaksi Scroll & Efek Signature

- **Parallax Dua Arah**:
  - Desktop (`deltaY` antara posisi atas vs bawah): `#tentang` (`speed: 0.06`, `+25.8px`), `#proyek` (`speed: 0.055`, `+29.7px`), `#faq` (`speed: 0.07`, `+37.8px`), `<footer>` (`speed: -0.06`, `-32.4px`).
  - Mobile (`deltaY`): `#tentang` (`+15.6px`), `#proyek` (`+15.6px`), `#faq` (`+18.2px`), `<footer>` (`-15.6px`).
- **CV 3D Folder 4-State Lifecycle**:
  - Atas awal: `aria-expanded="false"` -> Masuk tengah `#cv`: `"true"` -> Lewat bawah ke footer: `"false"` -> Kembali ke `#cv`: `"true"` -> Kembali ke Hero: `"false"`.
  - Klik tombol `"Lihat CV"`: membuka dialog modal `<CvPreviewModal>` (`[role="dialog"]` terbuka dalam `400 ms` pada uji klik langsung desktop dan `modalOpen: true` pada mobile).
- **Lazy Sticker Peel Activation**: Desktop `stickerHover` meningkat `0 -> 1` kanvas interaktif saat hover di slot terlihat.
- **Dev Server Check**: `npx next dev -p 3002` mengembalikan HTTP `200`.
