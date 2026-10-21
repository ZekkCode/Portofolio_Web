# Policy & Governance — ZekkTech Portfolio

Dokumen ini mengatur kebijakan privasi, tata kelola data, lisensi kode sumber, dan standar integritas perangkat lunak.

---

## 1. Kebijakan Privasi (Privacy Policy)

Website portfolio `https://zekktech.biz.id` memprioritaskan privasi penuh pengunjung:
- **Tanpa Cookie Pelacak (Cookie-less)**: Situs ini tidak menanamkan cookie pelacak pihak ketiga, iklan, atau profil pengguna.
- **Penyimpanan Sisi Klien (Local-First)**: Pengaturan visual di panel admin (`/admin`) disimpan murni di `localStorage` peramban visitor (`zekk:site:v1`) dan tidak pernah dikirim ke server backend eksternal.
- **Tanpa Perekaman Data Pribadi**: Formulir kontak menghubungkan visitor langsung ke protokol native (`mailto:` dan `https://wa.me/`), sehingga tidak ada penyimpanan pesan perantara.

---

## 2. Kebijakan Kode Sumber & Hak Cipta

- **Hak Cipta Konten**: Konten teks, biografi, riwayat karya, dan identitas visual merupakan hak milik intelektual **Zakaria Mujur Prasetyo**.
- **Komponen Open Source**:
  - Komponen animasi diadaptasi dari **React Bits** (lisensi MIT).
  - Pustaka grafis 3D menggunakan **Three.js** (lisensi MIT).
  - Pustaka scrolling menggunakan **Studio Freight Lenis** (lisensi MIT).
- **Penggunaan Ulang Kode**: Kode arsitektur, konfigurasi Next.js, dan skrip pengujian terbuka untuk dipelajari dan dijadikan referensi non-komersial.

---

## 3. Kebijakan Kualitas & Aksesibilitas (Quality Policy)

- **Aksesibilitas Gerak (Reduced Motion)**: Seluruh efek parallax, Three.js physics, dan CSS animations menghormati preferensi pengguna `prefers-reduced-motion: reduce`.
- **Standar Validasi Ketat**: Tidak ada kode yang di-merge ke branch produksi tanpa lolos verifikasi TypeScript (`tsc --noEmit`) dan browser headless test (`scripts/check.mjs`).
- **Keamanan Default**: Seluruh aset gambar diverifikasi bebas dari script berbahaya dan dilindungi oleh HTTP Security Headers.
