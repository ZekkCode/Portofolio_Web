# Skills & Competencies Guide — ZekkTech

Dokumen ini memuat taksonomi keahlian teknis Zakaria Mujur Prasetyo (ZekkTech) serta panduan skill AI Agent yang terpasang di repositori.

---

## 1. Keahlian & Spesialisasi Pengembang

### A. Frontend Web Development
- **Core Technologies**: HTML5 Semantik, Modern CSS (Tailwind CSS v4, Vanilla CSS), Modern JavaScript (ESNext), TypeScript 5.
- **Frameworks & Libs**: Next.js 16 (App Router, Server & Client Components, Turbopack), React 19, Three.js, Lenis Scroll, GSAP ScrollTrigger.
- **Performa & Animasi**: WebGL2 Shaders & Refraction, GPU-accelerated Parallax (`translate3d`), CSS Keyframe Choreography, Viewport Culling.
- **Tema & Lokalisasi**: Dark/Light mode theme system (`next-themes`), Internationalization dwibahasa ID/EN (`i18next`, `react-i18next`).
- **Standardisasi**: Arsitektur responsif mobile-first, optimasi Core Web Vitals (LCP, INP, CLS), kompresi WebP/AVIF.

### B. UI/UX Design & Desain Produk
- **Design Tools**: Figma (Auto-layout, Components, Variables, Interactive Prototypes), Adobe XD.
- **Metodologi**: User-Centered Design, Wireframing, High-Fidelity Mockups, Design System, Responsive Breakpoints.
- **Design Taste**: Tipografi editorial, grid hierarki fungsional, eliminasi elemen AI slop, glassmorphism terkontrol.

### C. Graphic Design & Multimedia
- **Creative Suite**: Adobe Photoshop, Adobe Illustrator, Filmora, CapCut.
- **Branding & Identitas**: Desain logo/monogram, typography pairing, poster promosi, materi publikasi digital organisasi.

### D. IT Support & Infrastruktur Cloud
- **Cloud & Database**: Supabase Cloud Database (PostgreSQL, Row Level Security/RLS), Cloudflare R2 Object Storage (AWS S3 SDK client).
- **Hardware & Jaringan**: Perakitan PC desktop, troubleshooting hardware/software, instalasi OS (Linux/Windows).
- **Tooling & Version Control**: Git, GitHub, Shell scripting (PowerShell, Bash), headless automation testing via Chrome DevTools Protocol (CDP).

---

## 2. Agen AI Skills Terpasang (`.agents/skills/`)

Repositori ini dilengkapi skill otomatisasi khusus untuk menjaga standar kode dan estetika:

### 1. `better-icons` (`.agents/skills/better-icons/`)
- **Sumber**: [`better-auth/better-icons`](https://github.com/better-auth/better-icons.git)
- **Tujuan**: Pencarian dan pengambilan ikon SVG standar produksi dari 200+ koleksi ikon (Iconify/Lucide/Heroicons/Tabler) tanpa perlu menggambar manual.
- **Perintah CLI**:
  ```powershell
  better-icons search <query>
  better-icons get <icon-id>
  ```

### 2. `ui-design-brain` (`.agents/skills/ui-design-brain/`)
- **Sumber**: [`carmahhawwari/ui-design-brain`](https://github.com/carmahhawwari/ui-design-brain.git)
- **Tujuan**: Basis pengetahuan 60+ pola komponen antarmuka produksi dari *component.gallery* (aksesibilitas, sizing, state, dan preset gaya SaaS/Minimal/Portfolio) untuk mencegah layout generik.

### 3. `anti-slop-design` (`.agents/skills/anti-slop-design/`)
- **Sumber**: [`wwewtech/anti-slop-design`](https://github.com/wwewtech/anti-slop-design.git)
- **Tujuan**: Menghilangkan 12 kiasan desain AI (gradient ungu pekat, border mengambang, kapitalisasi berlebihan) dan menegakkan hierarki visual 1-ke-3 serta surface styling murni.

### 4. `anti-slop` (`.agents/skills/anti-slop/`)
- **Sumber**: [`elithrar/dotfiles`](https://github.com/elithrar/dotfiles.git)
- **Tujuan**: Menghilangkan pola kalimat AI pada teks narasi/prosa tanpa merusak gaya bahasa otentik penulis asli (*surgical precision editing*).

### 5. `design-taste-frontend` (`.agents/skills/design-taste-frontend/`)
- **Sumber**: [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill)
- **Tujuan**: Mencegah dan mengoreksi kecacatan desain web modern melalui inspeksi browser headless real-time.
- **Skrip Inspeksi**:
  ```powershell
  node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:3000 --widths 1440
  ```

### 6. `stop-slop` (`.agents/skills/stop-slop/`)
- **Sumber**: [`hardikpandya/stop-slop`](https://github.com/hardikpandya/stop-slop)
- **Tujuan**: Menghapus pola tulisan klise buatan AI seperti em-dash (`—`), kata-kata filler, frasa "delve/tapestry", dan dekorasi emoji berlebihan.

### 7. `anti-ai-slop-writing` (`.agents/skills/anti-ai-slop-writing/`)
- **Sumber**: [`jalaalrd/anti-ai-slop-writing`](https://github.com/jalaalrd/anti-ai-slop-writing.git)
- **Tujuan**: Menghasilkan tulisan yang alami dan bebas dari pola statistik AI (variasi panjang kalimat, eliminasi *rule of three*, pembersihan kata-kata terlarang, dan gaya aktif langsung).

### 8. `supabase` (`.agents/skills/supabase/`)
- **Sumber**: [`supabase/agent-skills`](https://github.com/supabase/agent-skills.git)
- **Tujuan**: Instruksi lengkap operasi database Supabase, konfigurasi auth, realtime, storage, edge functions, dan client Next.js App Router.

### 9. `supabase-postgres-best-practices` (`.agents/skills/supabase-postgres-best-practices/`)
- **Sumber**: [`supabase/agent-skills`](https://github.com/supabase/agent-skills.git)
- **Tujuan**: Best practice penulisan skema PostgreSQL, pengindeksan performa tinggi, optimasi query, dan penegakan Row Level Security (RLS) anti-bocor.

### 10. `migrate-radix-to-base` (`.agents/skills/migrate-radix-to-base/`)
- **Sumber**: [`shadcn-ui/ui`](https://github.com/shadcn-ui/ui)
- **Tujuan**: Migrasi proyek React dan komponen shadcn/ui dari Radix UI ke Base UI (MUI Base), menangani objek rute, consumer props, dan migrasi wrapper secara progresif.

### 11. `paper-to-code-components` (`.agents/skills/paper-to-code-components/`)
- **Sumber**: [`millionco/paper-to-code-components`](https://www.ui-skills.com/skills/millionco/paper-to-code-components)
- **Tujuan**: Menerjemahkan desain Paper/Figma menjadi kode React/Next.js dengan batasan komponen terdefinisi, tokenisasi nilai arbitrer Tailwind, preservasi fidelitas visual, dan integrasi komponen shadcn.

### 12. `shadcn` (`.agents/skills/shadcn/`)
- **Sumber**: [`shadcn-ui/ui`](https://github.com/shadcn-ui/ui)
- **Tujuan**: Workflow terstruktur untuk mencari, menambahkan, menyusun, dan memperbaiki komponen antarmuka shadcn/ui dengan pola resmi dan integrasi registry.

### 13. `ui-styling` (`.agents/skills/ui-styling/`)
- **Sumber**: [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **Tujuan**: Pedoman styling UI tingkat lanjut: kombinasi shadcn/ui, utilitas Tailwind CSS, tata letak responsif adaptif, aksesibilitas WCAG, micro-interactions, dan mode gelap.

### 14. `seo` (`.agents/skills/seo/`)
- **Sumber**: [`iannuttall/seo`](https://github.com/iannuttall/seo)
- **Tujuan**: Integrasi CLI dan server MCP Google Search Console, Google Analytics, dan Bing Webmaster untuk audit kueri pencarian, deteksi kanibalisasi kata kunci, evaluasi alasan pengindeksan, dan pemantauan backlink.

### 15. `web-quality-seo` (`.agents/skills/web-quality-seo/`)
- **Sumber**: [`addyosmani/web-quality-skills`](https://github.com/addyosmani/web-quality-skills)
- **Tujuan**: Audit teknis SEO berbasis Google Search guidelines dan Lighthouse: pengujian crawlability, semantik metadata, skema JSON-LD, Core Web Vitals, mobile-friendly tap targets, dan pencegahan penalti indexing.

### 16. `gsap-scrolltrigger` (`.agents/skills/gsap-scrolltrigger/`)
- **Sumber**: [`greensock/gsap-skills`](https://github.com/greensock/gsap-skills)
- **Tujuan**: Panduan resmi ScrollTrigger dari GreenSock untuk animasi scroll-driven, pin element, scrubbing, koordinasi batch, dan integrasi timeline tanpa layout shift.


