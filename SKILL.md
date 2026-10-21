# Skills & Competencies Guide — ZekkTech

Dokumen ini memuat taksonomi keahlian teknis Zakaria Mujur Prasetyo (ZekkTech) serta panduan skill AI Agent yang terpasang di repositori.

---

## 1. Keahlian & Spesialisasi Pengembang

### A. Frontend Web Development
- **Core Technologies**: HTML5 Semantik, Modern CSS (Tailwind CSS v4, Vanilla CSS), Modern JavaScript (ESNext), TypeScript 5.
- **Frameworks & Libs**: Next.js 16 (App Router, Server & Client Components, Turbopack), React 19, Three.js, Lenis Scroll.
- **Performa & Animasi**: WebGL2 Shaders & Refraction, GPU-accelerated Parallax (`translate3d`), CSS Keyframe Choreography, Viewport Culling.
- **Standardisasi**: Arsitektur responsif mobile-first, optimasi Core Web Vitals (LCP, INP, CLS), kompresi WebP/AVIF.

### B. UI/UX Design & Desain Produk
- **Design Tools**: Figma (Auto-layout, Components, Variables, Interactive Prototypes), Adobe XD.
- **Metodologi**: User-Centered Design, Wireframing, High-Fidelity Mockups, Design System, Responsive Breakpoints.
- **Design Taste**: Tipografi editorial, grid hierarki fungsional, eliminasi elemen AI slop, glassmorphism terkontrol.

### C. Graphic Design & Multimedia
- **Creative Suite**: Adobe Photoshop, Adobe Illustrator, Filmora, CapCut.
- **Branding & Identitas**: Desain logo/monogram, typography pairing, poster promosi, materi publikasi digital organisasi.

### D. IT Support & Infrastruktur
- **Hardware & Jaringan**: Perakitan PC desktop, troubleshooting hardware/software, instalasi OS (Linux/Windows).
- **Tooling & Version Control**: Git, GitHub, Shell scripting (PowerShell, Bash), headless automation testing.

---

## 2. Agen AI Skills Terpasang (`.agents/skills/`)

Repositori ini dilengkapi skill otomatisasi khusus untuk menjaga standar kode dan estetika:

### 1. `design-taste-frontend` (`.agents/skills/design-taste-frontend/`)
- **Tujuan**: Mencegah dan mengoreksi kecacatan desain web modern (AI slop tells) seperti bayangan berlebihan, teks kapital paksa, dan border tipis mengambang.
- **Skrip Inspeksi**:
  ```powershell
  node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:3000 --widths 1440
  ```

### 2. `stop-slop` (`.agents/skills/stop-slop/`)
- **Tujuan**: Menghapus pola tulisan dan UI buatan AI yang klise, seperti em-dash (`—`), kata-kata filler, frasa "delve/tapestry", dan dekorasi emoji tak bermakna.
