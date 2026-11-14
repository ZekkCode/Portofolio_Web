# Audit & Pemulihan P0 — Scroll Hang, Performa Toggle Tema (INP), & WebGL Lanyard Scoping

Repositori: `ZekkCode/Portofolio_Web` (`e:\ProjectZekk\Porotofolio-Zekk`)  
Build Produksi Teruji: Next.js `16.4.2` (`npm run build` + `npx next start -p 3001`)  
Lingkungan Uji: Windows 11, Brave/Chromium Headless CDP (`157.0.8103.79`), `--enable-unsafe-swiftshader` (untuk skenario WebGL aktif) dan tanpa SwiftShader (`--disable-webgl --disable-webgl2 --disable-3d-apis --disable-gpu` untuk uji fallback non-WebGL), CPU `1x` & `4x` throttling, Desktop (`1440×900`, `1366×768`) & Mobile Touch (`390×844`).

---

## Ringkasan Eksekutif & Status P0

| Domain Uji | Kondisi Sebelum Perbaikan | Hasil Akhir Setelah Perbaikan | Status |
| :--- | :--- | :--- | :--- |
| **Scroll Berkelanjutan, Reverse & Parallax (`1440×900`, `390×844`)** | Scroll & parallax berpotensi bersaing dengan transition opacity / WebGL sticker mount churn; kartu timeline `HIMATIF` terpotong di kiri. | `avgFrameMs: 5.04 ms` (Desktop `1x`), `3.72 ms` (Mobile `1x`), `p95FrameMs: 16.7 ms` pada keduanya; parallax dua arah aktif (`#tentang`, `#proyek`, `#faq`, `footer`); CV 3D folder 4-status akurat. | **PASS** |
| **P0 Theme-Toggle Burst Lag / INP (Cold & Warm Cache)** | `1,742` transisi CSS simultan per klik (`52,260–52,267` per 30 klik) karena selector `*` / `.dark *`, `body` transition, & full-page `Home()` re-render; `UpdateLayoutTree` hingga `12,620 ms`; `durationMaxMs: 1,496 ms` (`presentationDelayMax: 1,401 ms`). | `0–6` transisi CSS; `durationP50Ms: 64–96 ms`, `durationMaxMs: 96–192 ms` lintas Desktop Cold/Warm, Hero, Mid-Page Floating PillNav, & Keyboard (`Tab`/`Enter`/`Space`); `darkPersisted: true` saat reload. | **PASS** |
| **P1 Hero 3D Lanyard WebGL Scoping & Fallback** | Listener global `window` menangkap `webglcontextlost` dari kanvas eksternal; `'WebGL2RenderingContext' in window === true` meski WebGL diblokir browser membuat `THREE.WebGLRenderer` gagal diam-diam tanpa fallback (`heroImgCount: 0`). | Listener ter-scope ke `[data-lanyard-canvas]`; kanvas asing tidak mematikan Lanyard; `webglcontextlost` nyata menampilkan overlay `StaticLanyardCard` (`opacity-0` pada wrapper 3D) dan pulih penuh saat `webglcontextrestored`; flag `--disable-webgl` langsung menampilkan `StaticLanyardCard`. | **PASS** |

---

## Bagian A — Pemulihan Scroll Hang, WebGL Sticker Churn, & Sinkronisasi GSAP/Lenis

### 1. Diagnosis Kode & Root Cause Scroll
Berdasarkan pemeriksaan komponen lokal dan profiling Chromium Trace (`audit_runner.mjs`):
1. **Sticker Peel WebGL Churn (`src/components/background-stickers.tsx`, `src/components/sticker-peel.tsx`)**: `StickerSlotItem` kini merender preview gambar statis ringan secara default dan mempromosikan `<StickerPeel>` interaktif hanya saat pengguna berinteraksi (hover/touch), menghindari kompilasi shader WebGL2 dan `getImageData` mendadak di tengah scroll (`canvasCount: 1–2` stabil selama scroll -> `3` setelah hover eksplisit). Di mobile (`390px`), Hero atas disterilkan dari stiker (`mobileSafe && topPercent >= 11`).
2. **Konflik Transisi CSS vs RAF Loop (`src/components/buddy/buddy.css`, `src/hooks/use-buddy-roaming.ts`)**: Dihapus `transition: transform` pada `.buddy-root` agar tidak bertabrakan dengan pembaruan posisi `translate3d` berbasis `requestAnimationFrame`.
3. **Timeline Scrubbing & Kliping Horizontal (`src/components/academic-journey-section.tsx`, `src/components/experience-timeline.tsx`)**: `opacity` dikeluarkan dari CSS `transition` pada kartu yang dikendalikan `ScrollTrigger`; `experience-timeline.tsx` memisahkan `ResizeObserver` (`updateBounds`) dari `onUpdate` dan menambah `scroll-px-2` + offset awal `x: (i) => i * 22` (`start: "top 68%"`, `end: "bottom 20%"`). Pada desktop `after2-desktop-1x` dan `after2-desktop-4x`, `acadCardClipCheck` mencatat `containerLeft: 223`, `firstCardLeft: 227` (`diff: +4px` — kartu pertama tidak terpotong di tepi kiri).
4. **Satu Pengemudi RAF Lenis + GSAP (`src/components/smooth-scroll.tsx`)**: Trace biner mengonfirmasi hanya 1 ticker GSAP aktif tanpa duplikasi loop RAF Lenis independen.

### 2. Data Trace Scroll Produksi Terbaru (`audit_runner.mjs --mode=after --label=after2`, `:3001`)

| Skenario Trace | `rafCalls` | `avgFrameMs` | `p95FrameMs` | `maxFrameMs` | `longTasksOver50Count` | `maxMainThreadTaskMs` | `layoutMs` | `recalcStyleMs` | `paintMs` | `evalScriptMs` | `lostWebGL` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`after2-desktop-1x`** (`1440×900`, CPU `1x`) | `3,326` | `5.04 ms` | `16.7 ms` | `2,212.4 ms` | `32` | `2,184.27 ms` | `66.1 ms` | `1,205.6 ms` | `1,446.9 ms` | `142.4 ms` | `0` |
| **`after2-desktop-4x`** (`1440×900`, CPU `4x`) | `1,687` | `11.44 ms` | `66.6 ms` | `183.0 ms` | `159` | `117.57 ms` | `52.3 ms` | `2,402.3 ms` | `3,141.4 ms` | `241.7 ms` | `0` |
| **`after2-mobile-1x`** (`390×844`, CPU `1x`) | `5,001` | `3.72 ms` | `16.7 ms` | `66.6 ms` | `2` | `68.23 ms` | `36.8 ms` | `1,275.4 ms` | `994.8 ms` | `47.0 ms` | `0` |

> [!NOTE]
> **Atribusi Teknis `2,184.27 ms` (`after2-desktop-1x`) & Aktivitas RAF Saat Idle:**
> - Pemeriksaan langsung terhadap file trace `trace-after-after2-desktop-1x.json` dan chunk `.next/static/chunks/29jjgje4o10xl.js:102:14575` (`functionName: "tu"`) membuktikan tugas `2,184.04 ms` (`TimerFire`) merupakan inisialisasi awal Three.js PMREM environment cube shader (`bootShaders` yang memang di-defer via `setTimeout`) berjalan paralel dengan kompilasi worker ANGLE SwiftShader (`ANGLEPlatformImpl_postWorkerTask`: `1,873.18 ms`, `1,615.22 ms`) akibat rendering software `--enable-unsafe-swiftshader` (bukan freeze/hang saat scroll).
> - Pengukuran 1 detik saat Hero idle (`verify_buddy_and_lanyard_details.mjs`, 8,5 detik pasca load) mencatat `244` total panggilan `requestAnimationFrame` dari 4 sumber fungsional yang diharapkan: `lanyard.tsx` (`60` — menjaga efek angin halus `breeze`), `use-buddy-roaming.ts` (`60` — sprite berjalan Miss Minute), `shape-grid.tsx` (`60` — gerak diagonal grid latar belakang), dan GSAP ticker (`60` + `4` observer).

### 3. Matriks Uji Scroll & Efek Signature

| Kasus Uji | Hasil Terukur (`after2`) | Status |
| :--- | :--- | :---: |
| Scroll down-up penuh tanpa hang (`Desktop 1x`, `Desktop 4x`, `Mobile 1x`) | Mencapai footer & kembali ke `scrollY <= 8` di semua skenario (`consoleErrors: []`, `exceptions: []`) | **PASS** |
| CV 3D Folder 4-status GSAP ScrollTrigger (`aria-expanded`) | Awal/Atas: `"false"` -> Masuk `#cv`: `"true"` -> Lewat bawah: `"false"` -> Kembali ke Hero: `"false"` (di `1x`, `4x`, & `mobile`) | **PASS** |
| Floating `PortfolioPillNav` & Rail Mobile sembunyi di Footer | `pillHiddenAtBottom: true`, `railHiddenAtBottom: true` (di semua 3 run) | **PASS** |
| Klik `"Lihat CV"` membuka modal dokumen + PaperCrumple | `cvDialogVisible: true` | **PASS** |
| Hover `StickerPeel` lazy WebGL promotion | `canvasAfterStickerHover: 3` (naik dari baseline 2 kanvas Hero+Grid) | **PASS** |
| `bodyResizeObservers` count | `2` (`smooth-scroll.tsx` + `portfolio-pill-nav.tsx`), stabil tanpa loop berlebih | **PASS** |
| `overflowX` lintas Desktop & Mobile | `false` di semua ukuran (`brokenImgCount: 0`) | **PASS** |

---

## Bagian B — P0 Theme-Toggle Burst Lag & INP Regression (`profile_theme_and_lanyard.mjs`)

### 1. Akar Masalah yang Terbukti di Trace & DOM (`--mode=before`)
Laporan QA sebelumnya mencatat lag parah saat tombol tema diklik cepat berturut-turut (INP `1,944 ms` pada sesi pengguna / `1,654 ms` hingga timeout `3,180 ms` pada uji Cloud Chrome). Profiling lokal Chromium (`theme-lanyard-before.json`) mereproduksi akar masalah berikut:

1. **Badai Transisi CSS & Invalidasi Universal Selector `.dark *` (`src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`)**:
   - Aturan universal `* { scrollbar-color: ... }` dan `.dark * { scrollbar-color: ... }` memaksa browser mengkalkulasi ulang style dan animasi di **seluruh ~1.740+ node DOM dan SVG** setiap kali kelas `.dark` berubah.
   - Dikombinasikan dengan `body { transition: background-color 0.25s ease, color 0.25s ease; }`, `<ThemeProvider>` tanpa `disableTransitionOnChange`, serta overlay grid full-viewport dengan `transition-colors duration-300`, **setiap klik toggle tema memicu `1,742` CSS transition paralel** (`17,426` transisi untuk 10 klik cepat; `52,260–52,267` untuk 30 klik cepat).
2. **Re-render Seluruh Halaman di `Home()` & Redraw `ShapeGrid` Sinkron (`src/app/page.tsx`, `src/components/shape-grid.tsx`, `src/components/portfolio-pill-nav.tsx`, `src/components/cv-folder-section.tsx`)**:
   - `Home()` memanggil `useTheme()`, sehingga setiap perubahan tema me-render ulang seluruh tree 19 seksi beserta komponen besar (`31–32` React commits, `FunctionCall` hingga `3,897 ms`).
   - `ShapeGrid` memanggil `engineRef.current.redraw` & `relayout` secara sinkron di dalam `useEffect` (`canvas2dClearRects: 78` pada burst 30 klik).

### 2. Perbaikan yang Diterapkan

| Berkas | Perubahan Teknis | Tujuan |
| :--- | :--- | :--- |
| `src/app/globals.css` | Menghapus `transition: background-color 0.25s ease, color 0.25s ease;` pada `body`; mengganti `*` / `.dark *` dengan target spesifik `html, .overflow-x-auto, .overflow-y-auto, .overflow-auto` (+ `html.dark ...`). | Mengeliminasi badai `1,742` CSS transitions & invalidasi style seluruh subtree DOM. |
| `src/app/layout.tsx` | Menambahkan prop `disableTransitionOnChange` pada `<ThemeProvider>`. | Mencegah CSS transitions berjalan serentak saat toggling `.dark`. |
| `src/app/page.tsx` | Mengekstrak komponen kecil `<BackgroundGrid />` yang memegang `useTheme()`; menghapus `useTheme()` dari `Home()` dan menghapus `transition-colors duration-300` pada overlay grid full-viewport. | Mengisolasi update tema hanya ke grid latar tanpa me-re-render seluruh halaman. |
| `src/components/shape-grid.tsx` | Meng-coalesce pemanggilan `engineRef.current.redraw` & `relayout` melalui `requestAnimationFrame` tunggal (`redrawRaf`) lengkap dengan `cancelAnimationFrame` saat cleanup. | Mencegah redraw Canvas 2D sinkron beruntun dalam burst klik. |
| `src/components/portfolio-pill-nav.tsx` | Mengekstrak `<ThemedPillNav />` dengan `useTheme()` + `useMounted()` agar state scroll & rail mobile di `PortfolioPillNav` tidak ikut me-render ulang saat tema berganti. | Menjaga klik tombol tema di floating PillNav mid-page tetap ringan. |
| `src/components/cv-folder-section.tsx` | Mengekstrak `<ThemedFolder />` dengan `useTheme()` + `useMounted()` agar seksi `CvFolderSection` tidak ikut re-render saat tema berganti. | Mencegah re-evaluasi JSX folder saat toggle tema. |

### 3. Bukti Perbandingan BEFORE vs AFTER (`theme-lanyard-before.json` vs `theme-lanyard-after.json`)

Seluruh pengujian dijalankan pada Chromium headless produksi (`http://localhost:3001`), masing-masing skenario burst diulang **3 run berurutan** pada Cold Cache dan Warm Cache:

| Skenario Uji | Metrik | BEFORE | AFTER | Selisih / Peningkatan |
| :--- | :--- | :---: | :---: | :---: |
| **Cold Hero: Normal 10 Klik** | `durationP50Ms` / `MaxMs` | `448 ms` / `624 ms` | `80 ms` / `152 ms` | `-82.1%` P50, `-75.6%` Max |
| | `commandElapsedMs` | `7,156.8 ms` | `4,131.8 ms` | `-42.3%` |
| **Cold Hero: Burst 10 Klik (3 Runs)** | `commandElapsedMs` | `[3,708.0, 3,095.7, 3,715.6] ms` | `[979.6, 771.9, 823.6] ms` | `-75%` rata-rata waktu selesai |
| | `transitionsStarted` | `17,420–17,426` | `0` | `-100%` badai transisi |
| | `UpdateLayoutTree` / `FunctionCall` / `EventDispatch` | `1,196.71` / `644.89` / `1,658.05 ms` | `797.13` / `129.27` / `28.3 ms` | `EventDispatch -98.3%`, `FunctionCall -80%` |
| | `durationP50Ms` / `MaxMs` | `[416, 352, 408]` / `[560, 544, 608] ms` | `[88, 80, 80]` / `[192, 96, 96] ms` | `-79%` P50 |
| **Cold Hero: Burst 30 Klik (3 Runs)** | `commandElapsedMs` | `[17,072.9, 8,773.3, 9,554.0] ms` | `[2,504.3, 2,430.7, 2,718.4] ms` | `-85.3%` pada Run 1 |
| | `transitionsStarted` | `52,260–52,267` | `0–6` | `-99.99%` |
| | `UpdateLayoutTree` / `FunctionCall` / `EventDispatch` | `5,449.18` / `3,406.76` / `6,607.12 ms` | `1,542.96` / `216.73` / `104.8 ms` | `FunctionCall -93.6%`, `EventDispatch -98.4%` |
| | `longTasksCount` / `maxMs` | `63` (max `766.66 ms`) | `7–10` (max `82 ms`) | `-89.3%` durasi task terlama |
| | `durationP50Ms` / `MaxMs` | `[536, 336, 344]` / `[1,496, 520, 552] ms` | `[80, 72, 72]` / `[104, 120, 112] ms` | `-92.5%` max INP terukur (`1,496 -> 120 ms`) |
| **Warm Hero: Burst 10 Klik (3 Runs)** | `commandElapsedMs` | `[3,993.9, 3,153.7, 3,802.6] ms` | `[703.3, 804.8, 750.7] ms` | `-79.4%` rata-rata |
| | `UpdateLayoutTree` / `maxTaskMs` | `2,384.66 ms` / `613.11 ms` | `414.62 ms` / `61.47 ms` | `-82.6%` layout tree, `-90%` max task |
| | `durationP50Ms` / `MaxMs` | — | `80 ms` / `[104, 104, 96] ms` | Stabil jauh di bawah ambang `200 ms` INP Google |
| **Warm Hero: Burst 30 Klik (3 Runs)** | `commandElapsedMs` | `[11,803.1, 12,716.9, 12,612.2] ms` | `[2,597.3, 2,773.0, 2,786.0] ms` | `-78%` |
| | `UpdateLayoutTree` / `FunctionCall` / `maxTaskMs` | `8,161.53` / `1,142.25` / `1,013.38 ms` | `1,579.62` / `272.09` / `67.97 ms` | `-80.6%` layout, `-93.3%` max task |
| | `durationP50Ms` / `MaxMs` | — | `[80, 80, 80]` / `[128, 128, 112] ms` | Konsisten `< 130 ms` bahkan pada 30 klik ekstrem |
| **Mid-Page Floating PillNav (`y=2200`, Burst 30)** | Cold `commandElapsedMs` / `UpdateLayoutTree` / `maxTask` | `20,417 ms` / `12,620.4 ms` / `2,689.35 ms` (`36` LT) | `2,353 ms` / `1,335.19 ms` / `59.28 ms` (`6` LT) | `-88.5%` wall time, `-97.8%` max task |
| | Warm `commandElapsedMs` / `UpdateLayoutTree` / `maxTask` | `17,111.6 ms` / `11,793.99 ms` / `1,443.91 ms` (`30` LT) | `2,249.7 ms` / `1,095.94 ms` / `58.28 ms` (`1` LT) | `-86.9%` wall time, `durationP50: 96 ms / Max: 112 ms` |
| **Keyboard (`Tab` + `Enter`/`Space`, 10×, 3 Runs)** | `focusedToggle` / `kbTransitions` / `duration` | — | `true` (3/3) / `10` (3/3) / P50 `[72, 72, 64] ms`, Max `[96, 144, 96] ms`, `maxTaskMs: 64.71 ms` | **PASS** |
| **Reload Persistence (`html.dark`)** | Cold & Warm reload pasca toggle dark | — | `darkPersisted: true` di Cold maupun Warm | **PASS** |

---

## Bagian C — P1 Hero 3D Lanyard WebGL Scoping, Recovery & No-WebGL Fallback

### 1. Akar Masalah yang Terbukti di Kode & Browser (`--mode=before`)
1. **Unscoped `webglcontextlost` Global**: `src/components/lanyard-stage.tsx` dan `src/lib/device-performance.tsx` memasang listener `window.addEventListener("webglcontextlost", ..., true)`. Saat `<canvas>` eksternal mana pun pada halaman melempar `webglcontextlost`, state Lanyard Hero ikut berubah dan men-destroy kanvas 3D (`lanyardStillHasCanvas: true -> false`).
2. **False-Positive WebGL Probe saat WebGL Diblokir**: Ketika Chromium dijalankan tanpa dukungan WebGL (`--disable-webgl --disable-webgl2 --disable-3d-apis --disable-gpu` tanpa SwiftShader), simbol `'WebGL2RenderingContext' in window` tetap `true`, sehingga probe lama lolos tetapi `new THREE.WebGLRenderer(...)` melempar exception yang ditelan `catch { return undefined; }` -> Hero berakhir kosong tanpa canvas maupun gambar fallback (`heroImgCount: 0, heroCanvasCount: 0`).

### 2. Arsitektur Solusi (`device-performance.tsx`, `lanyard.tsx`, `lanyard-stage.tsx`)
- **`src/lib/device-performance.tsx`**: Probe WebGL2/WebGL kini menciptakan `<canvas data-transient-gl="true">` offscreen `1×1` yang di-cache tingkat modul dan segera melepas konteks (`WEBGL_lose_context`); listener `onContextLost` hanya memproses target ber-atribut `data-lanyard-canvas` dan menurunkan tier ke `"lite"` tanpa memutus `hasWebGL` agar pemulihan `webglcontextrestored` tetap berjalan.
- **`src/components/lanyard.tsx`**: Menambahkan prop `onInitFailed`, `onContextLost`, `onContextRestored` via `callbacksRef`; menandai kanvas Three.js dengan `data-lanyard-canvas="true"`; memanggil `onInitFailed` bila konstruktor `THREE.WebGLRenderer` gagal; menjaga loop `render`/`tick`/`start`/`bootShaders` dengan flag `contextLostFlag`; serta mendaftarkan/membersihkan `webglcontextlost` dan `webglcontextrestored` langsung pada elemen `canvas`.
- **`src/components/lanyard-stage.tsx`**: Menghapus listener `window`; menampilkan `<StaticLanyardCard />` ber-atribut `data-static-lanyard="true"` penuh bila WebGL tidak tersedia atau `initFailed`, serta menumpuk `<StaticLanyardCard />` di `z-10` sambil menyembunyikan wrapper kanvas dengan `.opacity-0` saat `contextLost` agar `webglcontextrestored` tetap mampu memulihkan 3D tanpa unmount paksa.

### 3. Verifikasi Terukur Skenario Lanyard WebGL (`profile_theme_and_lanyard.mjs` + `verify_buddy_and_lanyard_details.mjs`)

| Skenario Uji | Bukti Observasi | Status |
| :--- | :--- | :---: |
| **Normal WebGL (`--enable-unsafe-swiftshader`) + External Canvas Loss** | `lanyardHasCanvas: true`, `hasLanyardAttr: true`; setelah `<canvas>` dummy eksternal men-dispatch `webglcontextlost`: `lanyardStillHasCanvas: true`, `falseFallbackStaticImg: false`. | **PASS** |
| **Real Lanyard `webglcontextlost` & `webglcontextrestored`** | Saat `webglcontextlost` pada `#atas canvas`: `hasCanvasStillInDom: true`, `wrapperOpacityZero: true`, `staticImgPresent: true`. Saat `webglcontextrestored`: `wrapperOpacityZero: false`, `staticImgPresent: false`. | **PASS** |
| **True No-WebGL (`--disable-webgl --disable-webgl2 --disable-3d-apis --disable-gpu`)** | `hasWebGL2SymbolInWindow: true`, `testContextSuccess: false`, `lanyardHasCanvas: false`, `staticImgPresent: true`, `heroImgCount: 1`, `heroCanvasCount: 0`. | **PASS** |
| **3D Drag / Release / Mobile Touch Scroll** | Pada drag & touch mobile `390×844`: `lanyardHasCanvasMobile: true`, `lanyardAfterScrollBack: true`, `consoleErrors: []`, `exceptions: []`. | **PASS** |
