# Policy & Governance — ZekkTech Portfolio

Dokumen ini mengatur kebijakan privasi, tata kelola data, lisensi kode sumber, dan standar integritas perangkat lunak.

---

## 1. Kebijakan Privasi (Privacy Policy)

Website portfolio `https://zekktech.biz.id` memprioritaskan privasi penuh pengunjung:
- **Tanpa Cookie Pelacak (Cookie-less)**: Situs ini tidak menggunakan cookie pelacak komersial, periklanan, atau profil pihak ketiga.
- **Penyimpanan Preferensi Lokal (Local-First)**: Preferensi tema (`next-themes`), pilihan bahasa (`i18next`), dan pengaturan panel admin disimpan di `localStorage` peramban visitor (`zekk:site:v1`) dan tidak dibagikan ke entitas lain.
- **Analitik Kunjungan Minimal (Privacy-Friendly Telemetry)**: Penghitung impresi halaman ([`src/app/api/views/route.ts`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/api/views/route.ts)) hanya menggunakan alamat IP secara sementara di memori server untuk mencegah spam/refresh berulang (jendela 15 menit). Alamat IP **tidak pernah disimpan secara permanen** di database dan dihapus otomatis dari memori.
- **Penyimpanan Cloud Terkontrol**: Konfigurasi portofolio di Supabase Cloud dan aset media di Cloudflare R2 hanya dimutasi oleh pengelola situs, tanpa mengumpulkan data pengguna atau pelacak aktivitas.
- **Tanpa Perekaman Data Pribadi**: Formulir kontak menghubungkan visitor langsung ke protokol native (`mailto:` dan `https://wa.me/`), sehingga tidak ada data pesan yang disimpan pada server perantara.

---

## 2. Kebijakan Kode Sumber & Hak Cipta

- **Hak Cipta Konten & Media**: Seluruh teks biografi, narasi studi kasus, riwayat karya, dan identitas visual merupakan hak milik intelektual **Zakaria Mujur Prasetyo**.
- **Lisensi Kode Sumber**: Kode arsitektur aplikasi, komponen kustom, dan skrip otomatisasi dirilis di bawah lisensi terbuka [MIT License](./LICENSE).
- **Atribusi Komponen Open Source**:
  - Komponen animasi diadaptasi dari **React Bits** (lisensi MIT).
  - Pustaka grafis 3D menggunakan **Three.js** (lisensi MIT).
  - Pustaka scrolling menggunakan **Studio Freight Lenis** (lisensi MIT).
  - Pustaka tema dan terjemahan menggunakan **next-themes** dan **i18next** (lisensi MIT).

---

## 3. Kebijakan Kualitas & Aksesibilitas (Quality Policy)

- **Aksesibilitas Gerak (Reduced Motion)**: Seluruh efek parallax, Three.js physics, dan CSS animations menghormati preferensi pengguna `prefers-reduced-motion: reduce`.
- **Standar Validasi Ketat**: Tidak ada kode yang di-merge ke branch produksi tanpa lolos verifikasi TypeScript (`tsc --noEmit`) dan browser headless test (`scripts/check.mjs`).
- **Keamanan Default**: Seluruh aset gambar diverifikasi bebas dari script berbahaya dan dilindungi oleh HTTP Security Headers.
