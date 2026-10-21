# Smooth Scroll & Parallax Architecture

Dokumen ini menjelaskan implementasi Lenis Smooth Scroll dan sistem Parallax berbasis GPU di portfolio ZekkTech.

---

## 1. Integrasi Lenis Smooth Scroll

Implementasi berada di `src/components/smooth-scroll.tsx`:
- Menggunakan paket `@studio-freight/lenis` / `lenis/react`.
- **Global CSS**: Diimpor langsung di `src/app/globals.css` via `@import "lenis/dist/lenis.css";`.
- **Aksesibilitas Reduced Motion**: Saat preferensi sistem pengguna mendeteksi `prefers-reduced-motion: reduce`, durasi scroll dinonaktifkan (`duration: 0`) dan perilaku fallback instan diaktifkan.

```tsx
<ReactLenis
  root
  options={{
    lerp: 0.085,
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  }}
>
  {children}
</ReactLenis>
```

---

## 2. Scroll Padding & Offset Jangkar

- `html { scroll-padding-top: 5.5rem; }` dikonfigurasikan di layer base CSS untuk mencegah konten tertutup header sticky setinggi 64px (4rem).
- Fungsi navigasi kustom `useSmoothScrollTo(target, offset = -88)` mengkalkulasi posisi absolut elemen terhadap viewport secara mulus:
  ```ts
  lenis.scrollTo(target, {
    offset: -88,
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  });
  ```

---

## 3. Komponen `<Parallax />` (`src/components/parallax.tsx`)

Komponen wrapper berbasis event loop Lenis untuk memberikan kedalaman visual bertingkat:
- **Viewport Culling**: Menghitung bounding box dan membatalkan perhitungan jika elemen berada di luar viewport (`rect.bottom < -150 || rect.top > windowHeight + 150`), mencegah layout thrashing.
- **GPU Acceleration**: Nilai translate diinjeksikan langsung ke `element.style.transform = translate3d(0, ${offset}px, 0)` menggunakan class `will-change-transform`.
- **Kecepatan Fleksibel**:
  - `speed = 0.03` untuk tech stack pills (gerak lambat).
  - `speed = 0.08` untuk kartu proyek pilihan.
  - `speed = 0.15` untuk floating badges.

---

## 4. Komponen `<SmoothNavLink />`

Pengganti anchor link `<a>` standar yang otomatis mencegat event default browser (`e.preventDefault()`) jika `href` diawali tanda pagar `#`, lalu mengarahkan scroll ke target menggunakan instance Lenis.
