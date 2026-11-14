# ZekkTech · Laporan browser QA dan performa

14 November 2026 WIB · [Produksi](https://zakariamp.vercel.app/)

## Ringkasan

**P0 investigasi performa: burst toggle tema memicu timeout pada jalur input Cloud Chrome.** Sepuluh klik dalam satu perintah selesai dalam 1.654 ms pada toggle dan 157 ms di area kontrol. Percobaan 30 klik pada toggle mengalami timeout pengiriman input setelah 3.180 ms. Area kontrol selesai dalam 211 ms untuk 30 klik. Halaman kembali dapat digulir hingga Stack tanpa reload. Sampel burst hanya satu per kombinasi target dan jumlah klik, dalam urutan berbeda. Area kontrol masih bisa memicu efek pointer atau grid, sehingga pembanding ini bersifat indikatif.

**Parallax dua arah bekerja pada bagian Tentang.** Pada scroll Y 0 → 299 → 0 px, translateY berubah −8,77 → +0,19 → −8,77 px. Lanyard tampil sebagai badge gambar di Cloud Chrome. Jalur fisika 3D belum teruji.

## Lingkungan dan bukti

- Cloud Chrome produksi, viewport DOM 1363 × 936 CSS px. Lebar isi dan dokumen sama-sama 1353 px. Versi Chrome, akselerasi GPU, dan status cache pada kunjungan awal tidak tersedia.
- Source GitHub diperiksa pada [master 61026002c6f944cfbfcce033be627c3fa262527c](https://github.com/ZekkCode/Portofolio_Web/tree/61026002c6f944cfbfcce033be627c3fa262527c). SHA deployment produksi belum dicocokkan.
- Input melalui klik koordinat, Tab, Enter, Space, wheel, Page Up/Down, drag koordinat, dan klik locator browser. Snapshot DOM dipakai untuk verifikasi hasil.
- Tangkapan layar: [Hero light sebelum tes](ZEKKTECH_BASELINE.jpg) dan [Hero dark setelah refresh](ZEKKTECH_DARK.jpg). Keduanya menampilkan badge gambar.

## Tema, baseline, dan pemulihan

| Skenario | Hasil |
| --- | --- |
| Kunjungan normal | Hero, header, grid, enam sticker Hero dan Miss Minute tampil. Dokumen tanpa horizontal overflow pada viewport ini. |
| 10 klik normal | 10/10 perubahan kelas light/dark teramati. Posisi Y tetap 0, lebar dokumen tetap 1353 px dan atribut ukuran canvas tetap sama pada sampel. |
| 30 klik berurutan | 30 panggilan kembali tanpa error, total 17.958 ms, sekitar 599 ms per panggilan rata-rata termasuk overhead. Kondisi akhir light. Sampel kelas hanya di akhir. |
| 20 input keyboard | Shift+Tab lalu Tab mengonfirmasi fokus di toggle. Enter dan Space berselang-seling. Sampel 1 dark, 2 light, 10 light, akhir light. Tidak ada timeout. |
| Burst 10 klik | 1.654 ms pada toggle, 157 ms pada kontrol di area Hero. Keduanya menyelesaikan perintah. |
| Burst 30 klik | Toggle: `Input.dispatchMouseEvent timed out` setelah 3.180 ms. Kelas berakhir dark dari light dan jumlah klik yang sampai tidak diketahui. Kontrol selesai 211 ms. |
| Pemulihan | Setelah burst, wheel mencapai Y ≈3930. Marquee bergerak dan Back to Top kembali ke Y 0. Perulangan input normal juga tetap berhasil. |
| Reload setelah dark | Dark bertahan. Komposisi sticker berubah pada slot yang sama, antara lain Canva → MySQL dan Figma → Jupyter Book. |

Semua angka perintah adalah wall-clock pengendali browser. Belum ada pengukuran input-to-paint, perbandingan latency mouse vs keyboard yang setara, atau bukti hang permanen. INP sekitar **1.944 ms** berasal dari rekaman pengguna sebelumnya. Screenshot memperlihatkan warna tema yang berbeda. Stabilitas visual per frame belum diukur.

## Scroll dan interaksi

| Komponen | Hasil |
| --- | --- |
| Wheel | Urutan posisi Y 0 → 934 → 4672 → 4082 → 7368 → 1 px dengan langkah pendek/panjang dan pergantian arah. Tinggi dokumen 8304 px pada sampel. |
| Page Down/Up | Dengan waktu settling terpisah, Y 0 → 749 → 1498 → 749 → 0 px. |
| GSAP Parallax | Tentang bergerak dan kembali pada rute yang diperiksa. Proyek, FAQ, dan footer mempunyai inline transform pada snapshot. Kurva frame, sinkronisasi per frame, jumlah refresh/ticker dan perilaku semua section perlu trace. |
| Lanyard | Strap dan badge gambar terlihat. Tiga percobaan drag pada Hero dan kunjungan kembali meninggalkan badge statis. Kontainer ID Card berisi img tanpa canvas. Fisika saat drag, release, settle, clipping 3D, context loss, dan touch belum bisa dinilai. |
| Sticker Peel | Drag pada area sticker memicu perubahan jumlah canvas DOM 2 → 3 → 2 pada sampel, dengan posisi/ukuran slot yang sama. Susunan slot pada snapshot sebelum/sesudah satu toggle sama. Profil konteks WebGL, peel hanya pada sudut, hover-only dan stabilitas renderer lintas tema belum terverifikasi. |
| ShapeGrid | Canvas beratribut 1353 × 936 dan sel highlight terlihat setelah interaksi pointer. Aktivitas idle dan identitas instance sepanjang burst belum diprofilkan. |
| CV | Anchor CV membawa halaman ke area section. Folder diklik dan tombol Lihat CV membuka dialog pada percobaan berikutnya. Halaman 1 → 2, tutup, lalu buka ulang berhasil. Kontrol PDF terlihat pada snapshot. Unduhan dan hasil klik Lihat CV pertama belum terverifikasi. |
| Tech Stack dan navigasi | Pada Y ≈3930, X kedua track berubah sekitar −51 dan +51 px antar-sampel. Tautan Stack terlihat dengan `aria-current=location`. Anchor CV, Back to Top dan perubahan ID → EN → ID bekerja. Penyelarasan active pill belum diukur. |
| Miss Minute | Dialog terbuka dan fokus desktop masuk ke input berlabel. Escape menutup dialog dan mengembalikan fokus ke tombol. Sprite berpindah posisi antar-capture. Tidak ada pesan chat yang dikirim. |
| Akademik dan karier | Akademik 2021 → 2024 → 2021 dan Karier KOALISI → HIMATIF mengubah status milestone aktif. Detail Akademik bisa dibuka. Gestur horizontal dan tampilan mobile belum terverifikasi. |

## Batas pengukuran

| Item | Status |
| --- | --- |
| DevTools / PerformanceObserver | F12 tidak menampilkan panel yang dapat digunakan melalui sesi Cloud. Evaluator read-only tidak menyediakan `performance`. Chromium terpisah dicoba, gagal start karena lingkungan menolak socket ProcessSingleton. |
| INP, Event Timing, LCP, CLS, rendering, LoAF, long tasks, FPS, CPU, GPU, memori, React Profiler | Tidak terukur. Tidak ada angka pengganti yang diperlakukan sebagai metrik browser. |
| Console | Tidak ada warn/error situs yang terlihat pada sampel log akhir. Error pengiriman metadata berasal dari ekstensi browser. Timeout tambahan berasal dari pengiriman input browser. |
| Cache | Kunjungan pertama dan reload pada tab yang sama dilakukan. Cold cache terkendali dan byte/asset cache browser tidak terverifikasi. Satu pemeriksaan HTTP HEAD terpisah mengembalikan HTTP 200 dan `x-vercel-cache: HIT` untuk HTML, yaitu cache CDN. |
| Responsive | Teruji 1363 × 936 saja. Target 1920 × 1080, 1440 × 900, 1366 × 768, 768 × 1024, 430 × 932, 390 × 844, 360 × 800, 320 × 568, mobile keyboard/touch, trackpad dan CPU throttle belum dijalankan. |

## Peringkat kandidat dan risiko

| Status | Kandidat | Bukti dan batas | Prioritas |
| --- | --- | --- | --- |
| CONFIRMED | Burst toggle memperlambat penyelesaian perintah pada sesi ini | Toggle 10 klik 1.654 ms vs kontrol 157 ms, 30 klik timeout sementara kontrol selesai. Durasi sampai paint dan fungsi penyebab belum diketahui. | P0, ulangi dengan trace |
| CONFIRMED | Lanyard statis pada Cloud Chrome | DOM badge berisi img dan tanpa canvas. Kondisi GPU mesin pengguna belum diketahui. | P1, verifikasi jalur WebGL |
| LIKELY | Propagasi tema ke homepage dan repaint | `src/app/page.tsx` / `Home` berlangganan `resolvedTheme` untuk palet grid. Ini dapat menjalankan ulang render parent dan sebagian subtree. `src/app/globals.css` transisi warna body dan `src/app/layout.tsx` mengizinkan transisi tema. Trace diperlukan untuk menentukan komponen yang commit dan biaya Style/Paint. | Kandidat P0 pertama. Risiko perubahan palet/transisi. |
| LIKELY | Redraw ShapeGrid setelah render | `src/components/shape-grid.tsx` menyimpan settings via ref, memulai mesin dalam effect mount `[]`, lalu menjadwalkan redraw setelah setiap render. Bukti kode mendukung redraw, tanpa bukti mesin dibuat ulang saat toggle. | Kandidat P0 kedua. Risiko grid tertinggal satu tema. |
| UNVERIFIED | Listener Lanyard menerima context loss luar | `src/components/lanyard-stage.tsx` menangkap `webglcontextlost` window tanpa memfilter target. `src/lib/device-performance.tsx` menyaring canvas sticker dan probe pada listener terpisah. Potensi false fallback pada event yang mencapai window. Penyebab badge statis sesi ini belum diketahui. | P1. Risiko fallback/restore pada kehilangan konteks asli. |
| UNVERIFIED | Sticker/WebGL, PillNav, ScrollTrigger refresh dan GPU sebagai penyebab tema | Source sticker menggunakan renderer berbagi dan promosi slot lewat interaksi. SmoothScroll menetapkan `autoRaf={false}`, satu adapter ticker dan refresh terkoalesensi. `portfolio-pill-nav.tsx` meneruskan palet tema ke PillNav. Belum ada trace remount, context churn, refresh berulang atau biaya GPU. | Jalankan counter di trace bila tetap lambat. |

## Reproduksi dan tindak lanjut

1. Buka produksi di Chrome desktop, tunggu halaman settle, catat viewport, GPU, kondisi cache, dan SHA deployment.
2. Rekam Performance sebelum input. Jalankan mouse normal, mouse burst dan keyboard burst dengan urutan tombol, interval serta posisi yang sama di setiap run. Gunakan kontrol koordinat kosong, lalu ulangi dari kondisi yang setara minimal tiga kali.
3. Cocokkan Event Timing per interactionId dengan Interactions, Main, Bottom-Up dan Frames. Laporkan input delay, processing dan presentation delay. Ambil trace pengguna lama jika ada untuk membandingkan kasus 1.944 ms.
4. Pada checkout terisolasi, uji palet halaman, redraw grid serta transisi CSS masing-masing sebagai perubahan tersendiri. Ulangi dengan Hero WebGL aktif dan fallback alami sebagai dua kondisi berbeda.
5. Terapkan perbaikan terkecil yang menghilangkan kerja terukur. Validasi parallax dua arah, lanyard, sticker, marquee, CV, navigasi dan Miss Minute pada viewport target serta perangkat sentuh.

Produksi, source remote, Supabase, dan R2 tidak diubah.
