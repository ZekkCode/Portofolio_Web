# Daftar Periksa Regresi & Gerbang Rilis — ZekkTech Portfolio

Status Pemeriksaan: Seluruh butir di bawah diverifikasi pada build produksi lokal (`next start -p 3001`) setelah seluruh edit final kode sumber selesai.

---

## 1. Gerbang Kualitas Wajib (`AGENTS.md`)

| Pemeriksaan | Perintah | Hasil |
| :--- | :--- | :--- |
| Linter | `npm run lint` | Lulus (`0` error, `0` warning) |
| TypeScript | `./node_modules/.bin/tsc --noEmit` | Lulus (`0` error) |
| Production Build | `npm run build` | Lulus (`19/19` static/dynamic routes) |
| Headless E2E & LocalStorage Check | `$env:BASE_URL="http://localhost:3001"; node scripts\check.mjs` | Lulus (`Semua cek lulus.`) |
| Dev Server Sanity Check | `npx next dev -p 3002` | Lulus (`HTTP 200`) |

---

## 2. Kepatuhan Aturan Permanen Proyek (`AGENTS.md` §6)

- [x] **Rule 1 (CV Folder GSAP ScrollTrigger)**: Awal tertutup (`aria-expanded="false"`), membuka saat masuk `#cv` (`onEnter` / `onEnterBack` -> `"true"`), menutup saat melewati ke bawah/atas (`onLeave` / `onLeaveBack` -> `"false"`).
- [x] **Rule 2 & 3 (`defaultProjects = []` & Zero Hero Repo Banner)**: `defaultProjects` tetap `[]` dan tidak ada banner Hero Repo di atas grid proyek; `scripts/check.mjs` hanya memutasi `localStorage` uji sementara tanpa menyentuh Supabase/R2.
- [x] **Rule 4 & 6 (Anti-Slop Copywriting & Ikon)**: Menggunakan `lucide-react` alih-alih panah unicode manual pada UI JSX/markup.
- [x] **Rule 5, 7, 8, 9, 10, 11, 12, 13**: Semua seksi terpasang lengkap (`#atas`/`#hero`, `#tentang`/`#about`, `#cv`/`#resume`, `#services`/`#layanan`, `#certificates`, `#stack`, `#proyek`/`#projects`, `#faq`, `#kontak`/`#contact`), `PortfolioPillNav` & `ScrollToTop`, watermark pixel footer `zakaria mp`, tanpa seksi Workflow/Cara Kerja, Hero `mailto:zakariamujur6@gmail.com` + Berkas Karier, serta modal pratinjau CV 4 halaman + `<PaperCrumple />` terbuka dari tombol `"Lihat CV"`.

---

## 3. Verifikasi Cross-Viewport, Tema, Bahasa & Animasi

- [x] **Desktop Light (`1440×900` & `1366×768`)**: Tidak ada overflow horizontal, tidak ada gambar rusak (`brokenImgs: []`), Lanyard 3D aktif, ProfileCard portrait terbingkai `cover`.
- [x] **Desktop Dark & EN (`1440×900`)**: Tema gelap aktif (`html.dark`), tombol bahasa mengubah judul/CTA ke Inggris (`Services & Focus`, `View CV`, `Contact Me`), kontras Hero, Academic, Blog, dan Kontak terjaga.
- [x] **Mobile (`360×800`, `390×844`, `430×932`)**: Tidak ada overflow horizontal (`scrollWidth === innerWidth` di ketiga ukuran), stiker tidak bertumpuk pada Hero saat cold load `390×844`.
- [x] **Runtime & WebGL**: `consoleErrorCount: 0`, `exceptionsCount: 0`, `networkFailures: []`, `lostCanvases: 0` di trace desktop maupun mobile.
- [x] **Admin Login (`/admin/login`)**: Ter-render bersih dan responsif di desktop `1440×900`.
