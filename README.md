# ZekkTech — Portfolio

Portfolio satu halaman untuk **Zakaria Mujur Prasetyo**. Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript. Tanpa database, tanpa API — halaman statis, cocok untuk Vercel free tier.

## Jalankan lokal

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # cek build produksi
npm run lint
```

## Struktur

```
src/
  app/
    layout.tsx          # font, metadata SEO, lang
    page.tsx            # section: hero, tentang, stack, proyek, kontak
    globals.css         # token Tailwind + grid background CSS-only
    admin/
      page.tsx          # panel admin: atur lanyard + CRUD proyek
  components/
    grid-background.tsx
    lanyard.tsx         # komponen 3D (three.js, React Bits)
    lanyard-stage.tsx   # hero: lanyard + config tersimpan
    projects-section.tsx
    section-title.tsx
  lib/
    profile.ts          # konten dasar: bio, stack, pengalaman, kontak
    site-store.ts       # default config lanyard + proyek, simpan ke localStorage
public/
  card-front.svg        # muka kartu default (ganti lewat admin)
  photo-placeholder.svg
  card.png, lanyard.png # aset desain referensi
```

## Panel admin — `/admin`

Buka `http://localhost:3000/admin` (atau `/admin` di domain produksi).

- **Tab Lanyard**: semua prop komponen bisa diatur — gambar depan/belakang/tali (unggah atau URL), orientasi, finishing (glossy/matte/holographic/metallic), warna kartu, sudut, ukuran, posisi gantung, panjang & lebar tali, metal klip, gravitasi, redaman, elastisitas, angin, interaktif, animasi intro. Preview 3D di sebelahnya langsung ikut berubah; tarik kartunya untuk tes fisika.
- **Tab Proyek**: tambah, ubah, hapus proyek (judul, deskripsi, tag, URL repo).
- **Simpan** menulis ke `localStorage` browser (`zekk:site:v1`) — tanpa server, jadi hanya terlihat di browser itu. **Ekspor** mengunduh `site-config.json`; untuk permanen, tempel nilainya ke `defaultLanyard` / `defaultProjects` di `src/lib/site-store.ts`. **Reset** kembali ke default. Halaman admin `noindex`.

## Ubah konten

Hampir semua teks ada di **`src/lib/profile.ts`**:

| Field | Tampil di |
| --- | --- |
| `name`, `tagline`, `roles` | fallback kartu ID (hero) |
| `bio`, `stats` | section Tentang |
| `experience` | timeline Pengalaman |
| `stack` | section Tech Stack |
| `projects` | default grid Proyek (bisa diedit lewat `/admin`) |
| `contact` | section Kontak + tombol header |

Foto/kartu: unggah lewat `/admin` (tab Lanyard → Gambar depan), atau ganti file `public/card-front.svg`.

## Ubah warna & ukuran

Token ada di blok `@theme` dalam `src/app/globals.css`:

```css
--color-brand: #1b45c4;      /* biru kartu & aksen */
--color-brand-light: #2f6fe0;
--color-brand-ink: #123a9e;
--color-line: #dcdce8;       /* garis grid & border */
```

Ukuran/gerak kartu diatur dari `/admin` (disimpan di `localStorage`) atau lewat `defaultLanyard` di `src/lib/site-store.ts`. Grid background: `--grid-size` (24px, jadi 18px di mobile).

## Deploy ke Vercel

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Atau import repo GitHub di dashboard Vercel — framework terdeteksi otomatis, tidak perlu env var.

