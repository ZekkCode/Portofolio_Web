# Audit & Penyempurnaan Anti-Slop — Seluruh Situs & Panel Admin (P1)

Cakupan: Seluruh seksi publik pada `/` (`src/app/page.tsx` beserta komponen seksi) dan UI Admin (`/admin`, `/admin/login`), diverifikasi pada tema Light & Dark, Desktop (`1440×900`, `1366×768`) & Mobile (`360×800`, `390×844`, `430×932`), serta bahasa `ID` & `EN`.

---

## 1. Perbaikan Seksi Publik & Konsistensi ZekkTech

1. **Hero, Tentang & Kontak (`src/app/page.tsx`, `src/lib/profile.ts`, `src/lib/site-config.ts`, `src/lib/translations.ts`)**
   - Menambahkan `relative z-[2]` pada seksi utama (`#atas`, `#tentang`, `#stack`, `#kontak`) di atas lapisan stiker dekoratif agar teks dan kontrol selalu terbaca jelas tanpa tertutup stiker (`BackgroundStickers` diatur ke `z-[1] xl:z-20`, mobile Hero disterilkan dari stiker).
   - Mengubah kotak KPI di `#tentang` menjadi ledger statistik tipografis 2×2 yang ringkas (`<dl>` dengan aksen `border-l-2 border-brand/25`).
   - Menghilangkan duplikasi blok Kontak langsung di atas Footer: CTA ganda berulang, kartu Lokasi/Status berkotak ganda, dan kluster 6 tombol sosial digantikan oleh satu CTA utama `"Kirim Email"`, tautan sekunder ke Berkas Karier, serta ledger hairline (Email, Lokasi, Status) bersanding dengan `DynamicProfileCardStage`.
   - Menghilangkan pola copy berulang (`"Berangkat dari..."`) dan menyelaraskan `projects.emptyTitle` (`"Belum Ada Proyek yang Ditampilkan"`).

2. **Profile Card Portrait Framing (`src/components/profile-card-stage.tsx`, `src/lib/site-config.ts`)**
   - Mengubah fallback `imageFit` ke `"cover"` (`defaultProfileCard.imageFit = "cover"`), menghilangkan bilah sisi abu-abu/perak yang sebelumnya muncul di sisi kiri-kanan foto `/profile.webp`.

3. **Academic Journey & Experience Timeline (`src/components/academic-journey-section.tsx`, `src/components/experience-timeline.tsx`)**
   - Menghapus prefix indeks dekoratif `#01`/`#02`, pill status/tahun redundan yang memakan ruang, dot progres duplikat di pojok kanan atas, dan ikon fallback berukuran besar; menempatkan nama institusi di posisi utama dengan monogram ringkas (`SN1`/`UTM`) dan teks status yang tenang.
   - Merapikan daftar proyek pendidikan menjadi baris bersekat halus.
   - Memperbaiki offset masuk `HIMATIF` di `experience-timeline.tsx` (`x: (i) => i * 22`, `start: "top 68%"`) dan menambah `scroll-px-2` agar kartu pertama rata penuh dan tidak terpotong di kiri.

4. **Layanan, Pencapaian, CV, Proyek, Sertifikat, FAQ & Blog**
   - **Services (`src/components/services-section.tsx`)**: Mengganti judul kartu dari biru solid ke warna teks primer (`text-ink`) untuk hierarki lebih tenang, serta `z-[2]`.
   - **Achievements (`src/components/achievements-section.tsx`)**: Mengganti badge kategori berbingkai dengan ikon + label teks inline.
   - **CV Folder (`src/components/cv-folder-section.tsx`)**: Menyatukan label tombol melayang ke `t("cv.viewCv", "Lihat CV")` di atas stage `z-[2]` (modal pratinjau tetap di luar `z-[2]`).
   - **Projects (`src/components/projects-section.tsx`)**: Menghapus badge `#01`, mencegah wrapping label `IT & Design` (`whitespace-nowrap shrink-0`), mengganti kotak bersarang `focusText` dengan aksen garis kiri, menghapus teks pengisi `"Internal"` saat `repo` kosong, menyeimbangkan layout `2`/`4` kartu ke `sm:grid-cols-2`, serta menjaga aturan `AGENTS.md` Rule 2 & 3 (`defaultProjects = []`, tanpa Hero Repo banner).
   - **Blog (`src/components/blog-preview-section.tsx`)**: Mengatur thumbnail artikel dengan `loading="eager" decoding="async"` sehingga seluruh cover eksternal (`workers.dev`) termuat bersih di screenshot, serta menghapus bar footer `"Tab Baru"` yang berulang.
   - **Certificates & FAQ (`src/components/certificates-section.tsx`, `src/components/faq-section.tsx`)**: Penyelarasan layering `z-[2]` dan pembersihan import tidak terpakai.

---

## 2. Perbaikan Admin UI (`/admin`, `/admin/login`) & Kebersihan Kode

- `src/app/admin/admin-client.tsx` & `src/app/admin/components/tab-overview.tsx`: Menghapus badge `"CMS v3"` / titik berkedip `animate-pulse` dan panah teks campuran; mempertahankan indikator status operasional (`"Draf Belum Disimpan"`, kontrol simpan/publikasi) serta memakai ikon `lucide-react` (`ArrowRight`).
- `src/app/admin/components/tab-works.tsx`: Menghapus jargon internal `"(Zero Slop Policy)"` dari antarmuka pengguna.
- `src/app/admin/components/tab-appearance.tsx`: Menyelaraskan prop pratinjau langsung `ProfileCard` pada Admin dan menamai ulang tab ke `Profile Card (Kontak)`.
- Membersihkan seluruh warning ESLint tidak terpakai di `src/app/admin/**`, `src/lib/**`, dan komponen publik (`npm run lint` berakhir `0` errors, `0` warnings).

---

## 3. Verifikasi Visual & Responsif Lintas Mode

- **Light & Dark Desktop (`1440×900`, `1366×768`)**: `horizOverflow: false`, `laptopOverflow: false`, `brokenImgs: []`. Tangkapan layar `p1-v2-desktop-light-*` dan `p1-v2-desktop-dark-*` menunjukkan kontras teks/kartu konsisten, `HIMATIF` rata kiri penuh tanpa terpotong, foto `ProfileCard` `cover` bersih, dan seluruh cover blog eksternal ter-render penuh.
- **Mobile Viewports (`360×800`, `390×844`, `430×932`)**: `overflow: false` pada ketiga lebar viewport (`scrollWidth === innerWidth`). Cold-load mobile (`p1-v2-mobile-cold-hero.png`) menunjukkan area Hero bersih tanpa tabrakan stiker dengan tombol CTA atau judul.
- **ID / EN Switch**: Toggle bahasa di header mengubah copy secara penuh (`Services & Focus`, `View CV`, `Contact Me`).
