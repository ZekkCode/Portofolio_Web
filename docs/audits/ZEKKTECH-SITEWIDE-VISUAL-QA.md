# Laporan QA Visual, Responsif Lintas Viewport & Verifikasi Interaktif — ZekkTech Portfolio

Repositori: `ZekkCode/Portofolio_Web` (`e:\ProjectZekk\Porotofolio-Zekk`)  
Target Uji: Build produksi lokal (`npm run build` + `npx next start -p 3001`)  
Artefak Bukti Gambar: [`docs/audits/screenshots/before/`](screenshots/before/) dan [`docs/audits/screenshots/after/`](screenshots/after/)

---

## 1. Matriks Responsif 8 Viewport (`audit_runner.mjs --mode=after --label=after2`)

Seluruh 8 ukuran viewport diukur secara otomatis pada halaman utama `/` (`after2`) dan diperiksa secara visual melalui tangkapan layar penuh:

| Viewport | Kategori | `scrollWidth` / `innerWidth` | `overflowX` | `headerHeight` | `h1RightOverlapsMobileRail` | `lanyardHasCanvas` | `lanyardBox` (`w × h`) | `stickerSlotsCount` | `buddyVisible` | `buddyOverlapsH1` | Bukti Screenshot | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| **`1920×1080`** | Desktop Wide | `1910 / 1920` | `false` | `65 px` | `false` | `true` | `405 × 440` | `44` | `true` | `false` | [`viewport-1920x1080-hero.png`](screenshots/after/viewport-1920x1080-hero.png) | **PASS** |
| **`1440×900`** | Desktop Standard | `1430 / 1440` | `false` | `65 px` | `false` | `true` | `405 × 440` | `44` | `true` | `false` | [`viewport-1440x900-hero.png`](screenshots/after/viewport-1440x900-hero.png) | **PASS** |
| **`1366×768`** | Laptop 14" | `1356 / 1366` | `false` | `65 px` | `false` | `true` | `405 × 440` | `44` | `true` | `false` | [`viewport-1366x768-hero.png`](screenshots/after/viewport-1366x768-hero.png) | **PASS** |
| **`768×1024`** | Tablet Portrait | `758 / 768` | `false` | `65 px` | `false` | `true` | `400 × 400` | `44` | `true` | `false` | [`viewport-768x1024-hero.png`](screenshots/after/viewport-768x1024-hero.png) | **PASS** |
| **`430×932`** | Mobile Large | `430 / 430` | `false` | `65 px` | `false` | `true` | `330 × 320` | `18` | `true` | `false` | [`viewport-430x932-hero.png`](screenshots/after/viewport-430x932-hero.png) | **PASS** |
| **`390×844`** | Mobile Standard | `390 / 390` | `false` | `65 px` | `false` | `true` | `294 × 320` | `18` | `true` | `false` | [`viewport-390x844-hero.png`](screenshots/after/viewport-390x844-hero.png) | **PASS** |
| **`360×800`** | Mobile Compact | `360 / 360` | `false` | `65 px` | `false` | `true` | `264 × 268` | `18` | `true` | `false` | [`viewport-360x800-hero.png`](screenshots/after/viewport-360x800-hero.png) | **PASS** |
| **`320×568`** | Mobile Small (SE) | `320 / 320` | `false` | `65 px` | `false` | `true` | `224 × 268` | `18` | `true` | `false` | [`viewport-320x568-hero.png`](screenshots/after/viewport-320x568-hero.png) | **PASS** |

> [!TIP]
> **Perbaikan Clearance `320×568` (`src/app/page.tsx`):** Pada pemeriksaan awal `320×568`, ujung kanan `<h1>` (`Zakaria Mujur Prasetyo`) masih terlalu dekat dengan floating rail mobile kanan (`fixed right-2`). Pelebaran padding `<main>` ke `pe-14 min-[480px]:pe-11 md:pe-0` memberi jarak aman visual sekitar `~16px` tanpa mengorbankan ruang di desktop maupun tablet (`768px`).

---

## 2. Pengujian Fitur Interaktif, Tema, Bahasa & Aksesibilitas

| Kategori Uji | Kasus Uji | Hasil Terukur Terbaru | Bukti & Referensi | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Tema Light / Dark & Burst INP** | Klik tombol tema mouse cepat (`10×` & `30×`, 3 run Cold & Warm, Hero & Mid-Page `y=2200`) + keyboard (`Tab` + `Enter`/`Space`) + reload persistensi | P50 `64–96 ms`, Max `96–192 ms` (`transitionsStarted: 0–6`); `focusedToggle: true`, `kbTransitions: 10` (3/3); `darkPersisted: true` saat Cold/Warm reload. | `ZEKKTECH-P0-SCROLL-PERFORMANCE-TRACE.md` Bagian B; [`desktop-1440-dark-en-hero.png`](screenshots/after/desktop-1440-dark-en-hero.png) | **PASS** |
| **Bilingual `ID` / `EN`** | Switch toggle bahasa di header (`desktop-1440-dark-en-*` & viewport mobile) | Seluruh heading, subtitle, tombol (`Send Email`, `Career Files`, `View CV`, `Services & Focus`, `Contact Me`), serta deskripsi Career/Academic/Achievements/Services berganti penuh. | [`desktop-1440-dark-en-achievements.png`](screenshots/after/desktop-1440-dark-en-achievements.png), [`desktop-1440-dark-en-blog.png`](screenshots/after/desktop-1440-dark-en-blog.png) | **PASS** |
| **Lanyard 3D & WebGL Scoping** | Drag/release, immunitas `webglcontextlost` kanvas eksternal, `webglcontextlost` & `webglcontextrestored` nyata pada kanvas Lanyard, mode tanpa WebGL (`--disable-webgl`) | `lanyardHasCanvas: true`, `lanyardStillHasCanvas: true` pasca loss eksternal; overlay `StaticLanyardCard` + `.opacity-0` wrapper saat real loss -> pulih ke 3D saat restore; `--disable-webgl` langsung menampilkan `StaticLanyardCard` (`heroImgCount: 1`, `heroCanvasCount: 0`). | `ZEKKTECH-P0-SCROLL-PERFORMANCE-TRACE.md` Bagian C | **PASS** |
| **Miss Minute Touch & Keyboard** | Tap pada viewport touch (`390×844`, `hasTouch: true`, `maxTouchPoints: 5`) + tekan `Escape` | Tap tombol `Tanya Miss Minute (ZekkTech Companion)` membuka `[role="dialog"]` (`dialogOpened: true`), `buddyInputAutoFocused: false` (`activeElement` tetap `BUTTON`, tidak memaksa virtual keyboard), `Escape` menutup dialog (`dialogStillOpen: false`). | `verify_buddy_and_lanyard_details.mjs` (`task-20405`) | **PASS** |
| **CV 3D Folder & Modal PDF** | Scroll atas -> `#cv` -> footer -> atas + klik `"Lihat CV"` | Status `aria-expanded`: `false -> true -> false -> false`; klik tombol membuka dialog modal PDF 4 halaman + `<PaperCrumple />` (`cvDialogVisible: true`). | [`desktop-1440-light-cv.png`](screenshots/after/desktop-1440-light-cv.png), [`desktop-1440-light-cv-modal.png`](screenshots/after/desktop-1440-light-cv-modal.png) | **PASS** |
| **Sticker Peel Lazy Promotion** | Hover slot stiker terlihat di desktop | Jumlah `<canvas>` aktif meningkat `2 -> 3` setelah hover tanpa memicu churn saat scroll biasa. | `audit_runner.mjs` (`interactive.canvasAfterStickerHover: 3`) | **PASS** |
| **CMS Admin & LocalStorage Sync** | `node scripts/check.mjs` (`BASE_URL=http://localhost:3001`) + inspeksi `/admin` | Hero 3D & seksi proyek terhubung; `/admin` merender 25 kontrol lanyard + proyek, menyimpan `localStorage`, memverifikasi pembacaan config di `/`; pratinjau `/admin` rapi. | `task-20359` (`Semua cek lulus.`), [`desktop-1440-admin.png`](screenshots/after/desktop-1440-admin.png) | **PASS** |
| **Quality Gates Kode** | `tsc --noEmit`, `npm run lint`, `npm run build`, regex unicode arrows | Semua lulus dengan `0` error TypeScript, `0` ESLint warning/error, `19/19` build routes, `0` panah unicode di `src/**/*.ts(x)`. | Output terminal verifikasi final | **PASS** |

---

## 3. Catatan Temuan Teknis & Risiko Residual

1. **Software WebGL Compilation (`--enable-unsafe-swiftshader`)**: Pada pengujian Chromium tanpa akselerasi GPU hardware, kompilasi awal PMREM shader Three.js pada `lanyard.tsx` (`bootShaders`) memerlukan ~`2,18 dtk` satu kali di startup (`trace-after-after2-desktop-1x.json`), yang di-defer via `setTimeout` sesudah hidrasi dan tidak terulang selama scroll. Di perangkat keras GPU nyata, durasi ini jauh lebih singkat *(Belum Diukur pada hardware GPU fisik — **NOT TESTED** di perangkat mobile fisik langsung)*.
2. **Metrik Posisi Horizontal Card Academic Mobile (`acadCardClipCheck`)**: Pada `after2-mobile-1x`, nilai `firstCardLeft: -123` (`diff: -143`) tercatat karena skrip `audit_runner.mjs` melompat secara instan tepat ke tengah area scrub ScrollTrigger `#akademik` yang memang sedang menggeser track horizontal; sedangkan pada inspeksi visual langsung awal `#akademik` (`viewport-390x844-academic.png`, `viewport-320x568-academic.png`) dan `desktop-1440` (`diff: +4px`), kartu pertama tidak terpotong di kiri.
3. **`networkFailuresCount: 5` pada `audit_runner.mjs`**: Tercatat saat `audit_runner.mjs` menavigasi cepat lintas state dan `/admin` (redirect ke `/admin/login`), sementara sesi bersih `verify_buddy_and_lanyard_details.mjs` pada `/` Desktop & Mobile mencatat `networkFailures: []`, `consoleErrors: []`, dan `brokenImgCount: 0`.
4. **Berkas Audit Sebelumnya di `docs/audits/`**: Dokumen pendahulu [`ZEKKTECH-P0-SCROLL-HANG.md`](ZEKKTECH-P0-SCROLL-HANG.md), [`ZEKKTECH-SITEWIDE-ANTI-SLOP.md`](ZEKKTECH-SITEWIDE-ANTI-SLOP.md), dan [`ZEKKTECH-REGRESSION-CHECKLIST.md`](ZEKKTECH-REGRESSION-CHECKLIST.md) merangkum fase P0/P1 awal; ketiga dokumen utama sekarang (`ZEKKTECH-P0-SCROLL-PERFORMANCE-TRACE.md`, `ZEKKTECH-SITEWIDE-ANTI-SLOP-AUDIT.md`, dan `ZEKKTECH-SITEWIDE-VISUAL-QA.md`) menjadi acuan terlengkap dan terkini termasuk pemulihan P0 Theme-Toggle INP, P1 Lanyard WebGL scoping/fallback, Miss Minute touch/Escape UX, serta matriks lengkap 8 viewport.
