# Smooth Scroll & Parallax Architecture

Dokumen ini menjelaskan implementasi Lenis Smooth Scroll dan sistem Parallax berbasis GPU dua arah (bidirectional) di portfolio ZekkTech.

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

Komponen wrapper berbasis event loop Lenis untuk memberikan kedalaman visual bertingkat dua arah (baik saat scroll ke bawah maupun saat scroll ke atas):

### A. Dua Mode Penyelarasan (`align`)
1. **`align="top"` (Khusus Hero & Bagian Atas Halaman)**:
   - Menjamin pada `scrollY = 0`, nilai offset translasi bernilai tepat `0px` sehingga layout tidak terpotong saat halaman pertama dibuka.
   - Saat pengguna scroll ke bawah, elemen bergerak dinamis sesuai `speed`.
   - Saat pengguna scroll kembali **ke atas**, elemen meluncur kembali secara presisi ke posisi istirahat (`0px`).
2. **`align="center"` (Untuk Section Konten Tengah & Bawah)**:
   - Dihitung dari titik tengah elemen terhadap pusat viewport (`viewportCenter`).
   - Menggunakan kalkulasi `naturalTop = rect.top - currentOffset` untuk mencegah feedback loop dan akumulasi drift saat scroll berulang.

### B. Viewport Culling & GPU Acceleration
- Membatalkan kalkulasi saat elemen berada jauh di luar batas viewport (`rect.bottom < -150 || rect.top > windowHeight + 150`).
- Transformasi menggunakan `translate3d(0, ${offset}px, 0)` dengan class `will-change-transform`.

### C. Sebaran Parallax Proyek
- **Hero (`#atas`)**:
  - Headline nama: `speed={-0.04}` (naik lebih cepat saat scroll).
  - Deskripsi & tombol aksi: `speed={0.03}` (bergerak lebih lambat, efek multi-plane).
  - Floating badges: `Available for Work` (`speed={0.14}`) & `Next.js & WebGL` (`speed={-0.12}`).
  - Kartu profil 3D: `speed={-0.07}`.
- **Tentang (`#tentang`)**: Bio teks (`speed={-0.02}`) berlawanan dengan kartu metrik statistik (`speed={0.03}`) dan timeline (`speed={0.05}`).
- **CV Folder (`#cv`)**: Wadah 3D folder interaktif (`speed={-0.03}`).
- **Peralatan Harian (`#stack`)**: Daftar badges icon WebP (`speed={0.03}`).
- **Proyek Pilihan (`#proyek`)**: Grid kartu showcase proyek (`speed={0.04}`).
- **Kontak (`#kontak`)**: Kotak lanyard (`speed={-0.03}`) bergerak berlawanan dengan kotak formulir kontak (`speed={0.04}`).

---

## 4. Komponen `<SmoothNavLink />`

Pengganti anchor link `<a>` standar yang otomatis mencegat event default browser (`e.preventDefault()`) jika `href` diawali tanda pagar `#`, lalu mengarahkan scroll ke target menggunakan instance Lenis.

