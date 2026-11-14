# Prompt Antigravity · ZekkTech performance fix

Kerjakan pada checkout terisolasi repositori ZekkCode/Portofolio_Web. Referensi QA produksi https://zakariamp.vercel.app/ dan source master `61026002c6f944cfbfcce033be627c3fa262527c`. Cocokkan SHA deployment dengan checkout sebelum menghubungkan perubahan source ke gejala produksi. Jalankan build produksi lokal.

## P0 · Profilkan burst toggle tema, lalu perbaiki jalur yang terbukti mahal

Cloud Chrome menyelesaikan 10 klik burst di toggle dalam 1.654 ms waktu perintah, dibanding 157 ms untuk kontrol area Hero. Burst 30 klik di toggle timeout dalam 3.180 ms, kontrol selesai 211 ms. Halaman bisa scroll sesudahnya. Pengguna sebelumnya melihat INP sekitar 1.944 ms pada input keyboard. QA Cloud belum mengukur INP atau mengonfirmasi root cause.

1. **Repro.** Tunggu idle di Hero. Jalankan 10 klik normal, 30 klik pointer dengan interval rapat yang dilaporkan, 20 Enter/Space setelah fokus toggle via Tab. Sertakan burst di koordinat kosong. Ulang minimal 3 run per kondisi dan pastikan input menghasilkan perubahan tema yang diharapkan. Uji sekali lagi dari tengah halaman dengan navbar mengambang aktif.
2. **Ambil bukti.** Simpan Chrome Performance trace dan Event Timing per interactionId dari input tepercaya. Laporkan p50 dan maksimum sample, input delay, processing, presentation delay, long tasks/LoAF, serta hotspot Bottom-Up dan Frames. Bila memungkinkan, tambahkan counter lokal untuk render/commit, redraw, mount/unmount, renderer init/dispose dan ScrollTrigger.refresh. Bandingkan cold cache dan warm cache dari build serta mesin yang sama.
3. **Isolasi kandidat secara terpisah.** Jika commit homepage dominan, periksa `Home` di `src/app/page.tsx`, `ThemeToggle` di `src/components/theme-language-toggle.tsx`, dan palet `PortfolioPillNav` di `src/components/portfolio-pill-nav.tsx`. Dekatkan subscription `resolvedTheme` ke bagian yang membutuhkan palet, atau gunakan token CSS untuk bagian statis. Uji visual palet light/dark dan mode system, fokus keyboard, serta state accordion dan milestone.
4. Jika redraw dominan, periksa `ShapeGrid` di `src/components/shape-grid.tsx`. Mount engine sekali, tandai perubahan settings yang relevan, dan gabungkan invalidasi sampai frame berikutnya selama hasil akhir tema tetap akurat. Verifikasi redraw untuk tema, resize, pointer, dan click cascade serta settle saat idle. Jika trace justru menunjukkan Style/Paint dominan, isolasi transisi pada `src/app/globals.css` dan konfigurasi ThemeProvider di `src/app/layout.tsx` pada checkout lokal, lalu ubah properti atau layer yang terbukti mahal dengan tampilan dipertahankan.
5. Jika trace mengatribusikan biaya pada video/visual lain, ikuti stack trace. Untuk scroll, periksa `ScrollTriggerBridge` dan `SmoothScroll` di `src/components/smooth-scroll.tsx`, lalu `Parallax` di `src/components/parallax.tsx`. QA mengonfirmasi Tentang bergerak dua arah. Sebelum mengubah sinkronisasi, verifikasi frekuensi refresh dan jumlah callback ticker. Pastikan keyboard, anchor, back/forward, milestone horizontal, dan reduced-motion tetap berfungsi.

## P1 · Verifikasi mengapa Hero masuk ke Lanyard statis

Di Cloud Chrome pada viewport 1363 × 936, kontainer ID Card menampilkan gambar dan tidak mempunyai canvas. Tiga drag Hero dilakukan pada badge statis. Ulangi di Chrome desktop dengan WebGL berakselerasi yang berfungsi. Bedakan hasil probe dari renderer init, loading dan context loss.

- Periksa `LanyardStage` dan `StaticLanyardCard` dalam `src/components/lanyard-stage.tsx`, `probeWebGLSupport` dan listener provider dalam `src/lib/device-performance.tsx`, serta pembuatan renderer/scene pada `src/components/lanyard.tsx`.
- Catat target dan ordinal event context loss sejak load sampai interaksi sticker, lalu jalankan skenario WebGL tersedia, tidak tersedia, dan kehilangan konteks Lanyard asli di lingkungan lokal. Listener stage saat ini bersifat global dan dapat menerima event di luar stage yang mencapai window. Jika false fallback terkonfirmasi, batasi scope ke canvas Lanyard atau kontrak lifecycle renderer. Validasi context loss asli masih menampilkan fallback dan pemulihan mengikuti kontrak yang dipilih.
- Pada jalur 3D, uji drag, release, strap tetap terhubung, settle tanpa RAF yang terus aktif, scroll bolak-balik, serta touch. Pastikan interaksi/konteks sticker tidak mematikan 3D Lanyard.

## Hasil yang harus dikembalikan

- Trace sebelum/sesudah pada skenario yang sama, penyebab berdasarkan trace, perubahan terkecil, dan risiko regresi.
- Bukti native mouse serta Tab/Enter/Space, preferensi tema bertahan setelah reload, input Buddy tidak otomatis fokus pada touch/mobile, dan overlay dapat ditutup.
- Cek 1920 × 1080, 1440 × 900, 1366 × 768, 768 × 1024, 430 × 932, 390 × 844, 360 × 800, dan 320 × 568. Laporkan hasil per viewport untuk overflow, keterbacaan dan posisi Lanyard, nav, sticker dan Buddy. Label simulasi CPU/mobile sesuai lingkungannya.
- Pertahankan Lanyard 3D, ShapeGrid, Sticker Peel, Lenis/parallax, marquee dan interaksi utama. Semua optimasi transparan untuk pengguna. Jaga perubahan lokal, tanpa deployment, PR, push atau perubahan data Supabase/R2. Bila data trace belum membuktikan kandidat mana pun, kembalikan trace dan temuan terukur sebelum mengubah arsitektur.
