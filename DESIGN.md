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

## 2. Palet Warna & Desain Token (Light & Dark Theme)

Didefinisikan di [`src/app/globals.css`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/app/globals.css) menggunakan Tailwind CSS v4 `@theme` dan custom variant `@custom-variant dark`:

| Token | Mode Terang (Light) | Mode Gelap (Dark) | Penggunaan |
|---|---|---|---|
| `--color-ink` | `#0a0a14` | `#f8fafc` | Teks judul utama, tombol kontras tinggi |
| `--color-body` | `#4b5263` | `#94a3b8` | Paragraf deskripsi, teks sekunder |
| `--color-muted` | `#64748b` | `#64748b` | Label metadata, tanggal, nomor urut |
| `--color-line` | `#e2e4ed` | `#202738` | Garis pembatas halus, border kartu |
| `--color-surface` | `#f8fafc` | `#0e121d` | Latar kartu bento, pill, container |
| `--bg-page` | `#ffffff` | `#08090e` | Latar belakang halaman kanvas utama |
| `--bg-section-alt` | `#f8fafc` | `#0b0e17` | Latar section selang-seling |
| `--color-brand` | `#1b45c4` | `#1b45c4` | Aksen warna identitas (Royal Cobalt Blue) |
| `--color-brand-light`| `#2f6fe0` | `#2f6fe0` | Hover state, tautan aktif, glow |
| `--color-brand-ink` | `#123a9e` | `#123a9e` | Teks tombol aksen, state aktif |

---

## 3. Permukaan & Hirarki Visual (Surface Rules)
- **Glassmorphism Selektif**: Maksimal 1 sticky surface transparan di layar pada satu waktu. Navigasi pill dock ([`<PillNav />`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/pill-nav.tsx)) dan header menggunakan `backdrop-blur-md` dengan latar `bg-white/85` (light) dan `dark:bg-slate-900/85` (dark).
- **Transisi Tema Mulus**: Elemen body mengimplementasikan `transition: background-color 0.25s ease, color 0.25s ease` untuk mencegah flickering visual saat berganti tema.
- **Bayangan Halus (Soft Shadows)**: Hindari drop-shadow hitam pekat berlapis-lapis. Gunakan batas tone step halus (`border border-line/70 dark:border-line/40`) dan bayangan lembut (`shadow-2xs` hingga `shadow-sm`).
- **Asset Berkinerja Tinggi (WebP First)**: Seluruh gambar raster dan icon tools dikonversi ke WebP untuk memastikan loading instan di jaringan seluler.
- **Komponen Toggle Aksesibel**: Kontrol tema ([`ThemeToggle`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/theme-language-toggle.tsx)) dan alih bahasa ([`LanguageToggle`](file:///e:/ProjectZekk/Porotofolio-Zekk/src/components/theme-language-toggle.tsx)) ditempatkan konsisten di sudut kanan atas dengan perlindungan anti-hidrasi SSR mismatch via hook `useMounted()`.
