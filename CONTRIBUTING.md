# Contributing Guidelines

Terima kasih atas ketertarikan Anda untuk berkontribusi pada pengembangan portfolio ZekkTech.

---

## 1. Alur Kontribusi

1. **Fork Repositori**: Buat salinan repositori ke akun GitHub Anda.
2. **Buat Branch Fitur**:
   ```bash
   git checkout -b feat/nama-fitur-baru
   ```
3. **Terapkan Standar Kode**:
   - Selalu patuhi standar tipografi dan anti-slop di [`DESIGN.md`](./DESIGN.md).
   - Pastikan seluruh aset gambar berformat WebP ringan (~1-2 KB per icon).
   - Jaga ukuran kode tetap ringkas dan hindari abstraksi berlebihan (YAGNI).
4. **Verifikasi Sebelum Mengajukan PR**:
   ```powershell
   ./node_modules/.bin/tsc --noEmit
   node scripts/check.mjs
   npm run build
   ```
5. **Kirimkan Pull Request**: Sertakan penjelasan perubahan dan lampiran screenshot hasil uji.

---

## 2. Kode Etik (Code of Conduct)
Harap saling menghormati, berkomunikasi secara profesional, dan menghindari ujaran diskriminatif atau tidak pantas dalam setiap diskusi issue maupun pull request.
