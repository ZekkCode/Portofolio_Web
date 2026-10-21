# Design Guidelines — Anti-Slop & Editorial Taste

Dokumen ini memuat standar desain, tipografi, palet warna, dan prinsip anti-slop yang diterapkan pada portfolio ZekkTech.

---

## 1. Tipografi Editorial

Mengganti font bawaan generik (`Inter` + `Archivo Black`) dengan pasangan tipografi editorial yang berkarakter:
- **Display Headings**: `Bricolage Grotesque` (Google Fonts, variable weight). Digunakan pada headline hero, nama, dan judul section utama dengan tracking ketat (`tracking-tight`) dan sentence-case.
- **Body & UI Text**: `Plus Jakarta Sans` (Google Fonts, variable weight). Digunakan untuk teks deskripsi, metadata, tombol, dan navigasi. Ukuran body copy dijaga antara 15px - 17px untuk kenyamanan baca maksimal.

### Anti-Slop Typography Rules:
- **Dilarang Kapital Paksa (`uppercase`)**: Judul tidak boleh di-uppercase paksa dengan `tracking-[0.2em]`. Gunakan kapitalisasi kalimat alami (sentence case).
- **Hapus Em-Dash (`—`)**: Menghilangkan seluruh karakter em-dash AI di running text dan metadata. Gunakan titik pemisah tengah (`·`) atau tanda kurung bila diperlukan.
- **Tanpa Eyebrow Kicker Generik**: Jangan menambahkan label kerdil bertuliskan huruf besar di atas setiap heading (mis. `// PORTFOLIO` atau `EXPLORE MY WORK`).

---

## 2. Palet Warna & Desain Token

Didefinisikan di `src/app/globals.css` menggunakan Tailwind CSS v4 `@theme`:

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `--color-ink` | `#0a0a14` | Teks judul utama, tombol kontras tinggi |
| `--color-body` | `#52526b` | Paragraf deskripsi, teks sekunder |
| `--color-line` | `#dcdce8` | Border pembatas halus, garis timeline |
| `--color-brand` | `#1b45c4` | Aksen warna identitas (Royal Cobalt Blue) |
| `--color-brand-light` | `#2f6fe0` | Hover state, aksen aktif |
| `--color-brand-ink` | `#123a9e` | Teks tombol aksen, state aktif |

---

## 3. Permukaan & Hirarki Visual (Surface Rules)
- **Glassmorphism Selektif**: Maksimal 1 sticky surface transparan di layar pada satu waktu. Navigasi pill dock (`<PillNav />`) dan header menggunakan `backdrop-blur-md` dengan latar belakang semi-transparan (`bg-white/85` atau `rgba(240, 240, 243, 0.8)`).
- **Bayangan Halus (Soft Shadows)**: Hindari drop-shadow hitam pekat berlapis-lapis. Gunakan batas tone step halus (`border border-line/70`) dan bayangan lembut (`shadow-xs` hingga `shadow-sm`).
- **Asset Berkinerja Tinggi (WebP First)**: Seluruh gambar raster dan icon tools dikonversi ke WebP untuk memastikan loading instan di jaringan seluler.
