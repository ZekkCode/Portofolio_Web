# Dokumentasi Teknis — ZekkTech Blue Miss Minute Companion

Implementasi maskot interaktif berbasis piksel (inspired by Agent Pet & Hatchery Miss Minute) dengan tema ZekkTech Royal Blue untuk portofolio resmi Zakaria Mujur Prasetyo.

---

## 1. Arsitektur Komponen & Struktur File

Fitur ini dirancang modular, lightweight, client-only, dan terisolasi dari proses server-side rendering (SSR) utama:

```
src/
├── components/
│   └── buddy/
│       ├── buddy-client.tsx      # Lifecycle orchestrator, dock button, API global window
│       ├── buddy-sprite.tsx      # Atlas sprite renderer (8x9 Codex grid, pixelated styling)
│       ├── buddy-chat.tsx        # Contextual chat bubble, keyboard navigation, suggestion chips
│       └── buddy.css             # Scoped CSS (pixelated rendering, reduced-motion overrides)
├── hooks/
│   └── use-buddy-roaming.ts      # RAF state machine (IDLE, WALK, TURN, GREETING, COLLISION)
├── lib/
│   └── buddy/
│       ├── buddy-config.ts       # Dimensi, interval, kecepatan 28 px/s, boundary margin
│       ├── buddy-knowledge.ts    # Basis pengetahuan otentik ZekkTech (ID & EN)
│       └── buddy-types.ts        # TypeScript contracts & AgentPetAPI interface
└── app/
    └── api/
        └── buddy/
            └── chat/
                └── route.ts      # Endpoint chat server-side (rate limited, sanitized, no-store)

public/
└── pets/
    ├── miss-minute-blue.webp     # Spritesheet hasil re-color palet ZekkTech Blue (750 KB)
    └── miss-minute-original.webp # Fallback spritesheet original Hatchery (2.2 MB)
```

---

## 2. Aset & Lisensi (Attribution & Licensing)

1. **Aset Sumber**:
   - Provider: Hatchery Catalog (`hatcheryProvider.fetchPets()`).
   - Catalog ID: `miss-minute`.
   - Sumber CDN: Firebase Storage Hatchery Codex.
   - Format Spritesheet: WebP Lossless (VP8L), resolusi $1536 \times 1872$ px ($8 \text{ kolom} \times 9 \text{ baris}$, $192 \times 208$ px per frame).
2. **Transformasi Palet ZekkTech Blue**:
   - Dilakukan pemetaan warna matematis berbasis ruang warna **HSL (Hue, Saturation, Lightness)**:
     - Target Hue: $218^\circ$ (ZekkTech Royal Blue).
     - Primary: `#1B45C4` (badan jam, sepatu).
     - Secondary / Midtone: `#60A5FA`.
     - Highlight: `#BFDBFE`.
     - Dark Outline: `#172554` (garis tepi navy pekat).
     - Putih / Netral: Wajah jam, sarung tangan, gigi, dan mata tetap dipertahankan putih bersih ($S < 0.20, L > 0.70$).
     - Alpha Channel ($A < 8$): Tetap transparan sempurna ($A = 0$).
   - Menghasilkan file teroptimasi `public/pets/miss-minute-blue.webp` dengan reduksi ukuran dari 2.2 MB menjadi 750 KB tanpa merusak alignment frame atlas 8×9.
3. **Atribusi Karakter**:
   - Terinspirasi dari karakter Miss Minute (Loki / Marvel universe) yang dibuat ulang dalam gaya kartun cat air oleh komunitas Codex/Hatchery untuk penggunaan non-komersial edukatif dan portofolio personal.

---

## 3. Sistem Roaming & Penghindaran Tabrakan (Collision Avoidance)

1. **State Machine Gerakan**:
   - `idle`: Berhenti sejenak memainkan animasi idle (Row 0, 6 fps) selama 3.5 – 7 detik acak.
   - `walking-left`: Berjalan ke arah kiri menggunakan frame lari kiri (Row 2, 8 fps) dengan kecepatan konstan 28 px/detik.
   - `walking-right`: Berjalan ke arah kanan menggunakan frame lari kanan (Row 1, 8 fps).
   - `turn`: Otomatis berbalik arah saat mendekati batas layar (`minX: 16px` atau `maxX`).
   - `greeting`: Melambaikan tangan (Row 3, 6 fps) saat disapa atau di-klik.
   - `thinking`: Animasi berpikir (Row 8, 6 fps) saat pesan sedang diproses API.
   - `success`: Animasi lompat gembira (Row 4, 7 fps) setelah memberikan jawaban.
   - `waiting`: Berjaga-jaga (Row 6, 6 fps) saat cursor mouse hover di atas karakter.
2. **Penghindaran Tabrakan Elemen Bawah**:
   - Tombol *Scroll to Top* berada di posisi `bottom-6 right-6`. Roaming kanan dibatasi dengan margin `rightAvoidMargin: 84px` sehingga maskot tidak akan menabrak atau menutupi tombol tersebut.
   - Navigasi pill navbar tengah (`z-50`) berada di atas maskot (`z-40`). Maskot tidak menghalangi interaksi klik navbar atau footer karena kontainer utamanya berstatus `pointer-events-none`, dan hanya karakter/bubble yang berstatus `pointer-events-auto`.
3. **Kinerja & Efisiensi Hardware**:
   - Loop fisika menggunakan `requestAnimationFrame` dengan penghitungan `delta-time`.
   - Posisi `translate3d(x, 0, 0)` diinjeksikan langsung ke DOM node melalui `domRef.current.style.transform`, **menghindari re-render komponen React pada setiap frame 60fps**.
   - Berhenti otomatis saat tab browser tidak aktif (`document.hidden`).
   - Menghormati preferensi aksesibilitas `prefers-reduced-motion: reduce`.

---

## 4. Antarmuka Chat & Pengetahuan Otentik

1. **Desain Bubble Chat**:
   - Lebar kompak 280–320 px dengan sudut membulat `rounded-2xl` serasi dengan UI ZekkTech.
   - Mendukung Dark Mode (`dark:bg-[#111422]`) dan Light Mode (`bg-white`).
   - Aksesibilitas keyboard penuh: `Enter` untuk mengirim pesan, `Escape` untuk menutup dialog.
   - Tombol Minimize (`-`) untuk memindahkan maskot ke dock pojok kiri bawah dengan status persisten di `localStorage`.
2. **Kemampuan Tanya-Jawab (`/api/buddy/chat`)**:
   - Siapa Zakaria Mujur Prasetyo (ZekkTech).
   - Detail proyek unggulan (SIGAP-Pangan, Mesin Pencari TP/TF-IDF, ZEDD).
   - Tech stack & alat (Next.js, React, TypeScript, Tailwind, Figma, Three.js).
   - Akses CV ATS 2025 dan simulasi 3D PaperCrumple.
   - Sertifikasi kredensial terverifikasi (Binar, Dicoding, BNSP).
   - Informasi kontak langsung email `zakariamujur6@gmail.com`.
   - Mendukung input Bahasa Indonesia dan Bahasa Inggris secara otomatis.
3. **Keamanan Endpoint**:
   - Pembatasan ukuran request: Maksimum 4 KB (`Content-Length`).
   - Pembatasan panjang string pesan: Maksimum 300 karakter.
   - Rate limiting per IP hash: Maksimum 30 request/menit.
   - Respon tanpa penyimpanan cache (`Cache-Control: no-store`).

---

## 5. Kompatibilitas Agent Pet API

Komponen mengekspos objek global `window.ZekkBuddy` dan `window.AgentPet` untuk kompatibilitas penuh dengan ekosistem Agent Pet:
- `setState(state: BuddyState): void`
- `play(action: BuddyState, opts?: { durationMs?: number }): void`
- `say(text: string, opts?: { ttl?: number }): void`
- `hide(): void`
- `show(): void`
- `toggle(): void`
- `hidden: boolean`
- `state: BuddyState`

---

## 6. Hasil Verifikasi & Testing

1. **TypeScript Type Check**:
   ```powershell
   ./node_modules/.bin/tsc --noEmit
   # Exit code: 0 (Bersih tanpa error)
   ```
2. **Headless Browser Test**:
   ```powershell
   node scripts/check.mjs
   # Semua cek lulus (hero 3D, admin panel, dynamic storage).
   ```
3. **End-to-End Test (`scripts/test-buddy-e2e.mjs`)**:
   - `Buddy sprite check`: `found: true`, `hasGlobalAPI: true`.
   - `Chat dialog check`: `chatOpen: true`.
   - `Chat reply result`: Sukses merespon kueri proyek dengan format otentik.
   - Mode responsif mobile (viewport 390px): Berhasil diskalakan menjadi 44×48 px dengan bubble ramah sentuhan.
4. **Build Produksi**:
   ```powershell
   npm run build
   # Compiled successfully, semua static route prerendered, dynamic API route terdaftar.
   ```
