"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/profile";

export type RoleKey = "all" | "graphic" | "uiux" | "frontend" | "itsupport";

export interface RoleDetail {
  key: RoleKey;
  title: string;
  badge: string;
  subtitle: string;
  color: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  desc: string;
  skills: string[];
  tools: string[];
  responsibilities: string[];
  keyProjects: { name: string; desc: string; url?: string }[];
}

export const ROLE_DETAILS: Record<Exclude<RoleKey, "all">, RoleDetail> = {
  graphic: {
    key: "graphic",
    title: "Desainer Grafis",
    badge: "Visual Arts & Branding",
    subtitle: "Multimedia & Visual Identity",
    color: "#0284c7",
    textColor: "text-sky-700",
    bgLight: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    desc: "Berpengalaman merancang identitas visual, branding brand/UMKM, materi publikasi sosial media, infografis, dan aset multimedia kreatif dengan prinsip estetika komunikasi visual.",
    skills: ["Branding & Logo Design", "Digital Illustration", "Social Media Content", "Print & Poster Design", "Typography & Color Theory", "Video Editing Basics"],
    tools: ["Adobe Photoshop", "Adobe Illustrator", "Figma", "CorelDRAW", "CapCut", "Filmora"],
    responsibilities: [
      "Merancang konsep visual kreatif dan konsisten untuk kebutuhan organisasi dan klien.",
      "Mengelola produksi media publikasi digital untuk event kampus dan komunitas.",
      "Menyusun pedoman identitas brand (color palette, typography, visual assets).",
    ],
    keyProjects: [
      { name: "Visual Identity HIMATIF UTM", desc: "Perancangan grafis event seminar, workshop, dan konten media sosial." },
      { name: "Infografis KOALISI Linux", desc: "Materi visual edukasi open source dan kesadaran keamanan digital." },
      { name: "Branding GDGoC UTM", desc: "Aset kreatif promosi kegiatan komunitas developer kampus." },
    ],
  },
  uiux: {
    key: "uiux",
    title: "UI/UX Designer",
    badge: "User Interface & Experience",
    subtitle: "Product Design & Prototyping",
    color: "#0284c7",
    textColor: "text-sky-600",
    bgLight: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    desc: "Mendesain antarmuka produk digital (web & mobile) yang berpusat pada pengguna (user-centered design), mulai dari wireframing, perancangan design system, hingga interactive prototype yang mudah digunakan.",
    skills: ["User Journey & Flow", "Wireframing & Lo-Fi", "High-Fidelity Prototyping", "Design System & Tokens", "Usability Heuristics", "Responsive Layout"],
    tools: ["Figma", "Adobe XD", "FigJam", "Whimsical", "Component Libraries"],
    responsibilities: [
      "Melakukan riset kebutuhan pengguna dan menerjemahkannya ke dalam user flow terstruktur.",
      "Membangun komponen UI yang konsisten dan reusable dengan auto-layout Figma.",
      "Menghubungkan desainer dengan developer agar implementasi kode selaras dengan desain.",
    ],
    keyProjects: [
      { name: "Trevio Hotel Booking System", desc: "UI aplikasi pemesanan kamar hotel multi-properti dengan verifikasi pembayaran.", url: "https://github.com/Buthzz/trevio-project" },
      { name: "SIGAP-Pangan", desc: "Antarmuka platform pelaporan dan peringatan rantai logistik pangan.", url: "https://github.com/ZekkCode/SIGAP-Pangan" },
      { name: "TOEL Online Test", desc: "UI simulasi ujian TOEFL web untuk mahasiswa dengan navigasi soal adaptif.", url: "https://github.com/ZekkCode/OnlineTest-TOEFL_DPW" },
    ],
  },
  frontend: {
    key: "frontend",
    title: "Frontend Developer",
    badge: "Modern Web Engineering",
    subtitle: "Next.js, React & 3D Interactive",
    color: "#1b45c4",
    textColor: "text-brand",
    bgLight: "bg-brand/10",
    borderColor: "border-brand/30",
    desc: "Mengembangkan aplikasi web modern yang cepat, interaktif, responsif, dan aksesibel. Menggabungkan Next.js App Router, React, Tailwind CSS, TypeScript, serta visual 3D WebGL / Three.js.",
    skills: ["Next.js (App Router, Turbopack)", "React 19 & Hooks", "TypeScript Strict Mode", "Tailwind CSS v4", "Three.js & WebGL Shaders", "State Management & Sync"],
    tools: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js", "VS Code", "GitHub"],
    responsibilities: [
      "Mengembangkan arsitektur frontend modular berbasis komponen dan clean code.",
      "Mengoptimalkan performa web (Core Web Vitals), aksesibilitas, dan SEO teknis.",
      "Mengintegrasikan efek interaktif mutakhir (3D physics lanyard, canvas particle grid, card tilt).",
    ],
    keyProjects: [
      { name: "ZekkTech Portfolio 3D", desc: "Portofolio modern Next.js 16 + Tailwind v4 + Three.js Lanyard + React Bits Folder.", url: "https://github.com/ZekkCode" },
      { name: "Mesin Pencari TP/TF-IDF", desc: "Aplikasi Information Retrieval kalkulasi Cosine Similarity & TF-IDF.", url: "https://github.com/ZekkCode/information-retrieval" },
      { name: "ZEDD Download Manager", desc: "Alat utilitas download sinkronisasi eksternal.", url: "https://github.com/ZekkCode/ZEDD-Zekk-External-Downloader-Drive" },
    ],
  },
  itsupport: {
    key: "itsupport",
    title: "IT Support & Systems",
    badge: "Hardware, Linux & Automation",
    subtitle: "Troubleshooting & Infrastructure",
    color: "#d97706",
    textColor: "text-amber-600",
    bgLight: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    desc: "Mempunyai dasar kuat di bidang hardware, perakitan komputer (PC assembly), troubleshooting perangkat keras & lunak, instalasi dan administrasi sistem operasi Linux, serta otomasi bot.",
    skills: ["Hardware Assembly & Rakit PC", "OS Maintenance (Linux & Windows)", "Network Basics (LAN, IP, DNS)", "Telegram Bot API Automation", "CLI Scripting & yt-dlp", "Troubleshooting Perangkat Lab"],
    tools: ["Ubuntu / Debian Linux", "Windows OS", "Python", "Bash", "yt-dlp", "Hardware Diagnostic Tools"],
    responsibilities: [
      "Merakit dan menganalisis kompatibilitas spesifikasi PC sesuai kebutuhan komputasi.",
      "Melakukan diagnosis serta pemecahan masalah hardware, peripheral, dan jaringan.",
      "Mengembangkan skrip otomatisasi bot untuk mempercepat alur kerja digital.",
    ],
    keyProjects: [
      { name: "ZekkStore Telegram Bot", desc: "Bot otomatis transaksi produk digital berbasis Python & Telegram Bot API.", url: "https://github.com/ZekkCode/BotZekkStoreTelegram" },
      { name: "Network Capture Downloader", desc: "Tutorial dan skrip ekstraksi video streaming HLS (.m3u8) dengan yt-dlp.", url: "https://github.com/ZekkCode/Download-Video-Lewat-Network-Capture" },
      { name: "Linux Workstation Lab Setup", desc: "Konfigurasi lingkungan distro Linux open source untuk komunitas KOALISI." },
    ],
  },
};

interface CvPreviewModalProps {
  isOpen: boolean;
  initialRole?: RoleKey;
  onClose: () => void;
}

export function CvPreviewModal({ isOpen, initialRole = "all", onClose }: CvPreviewModalProps) {
  const [activeRole, setActiveRole] = useState<RoleKey>(initialRole);

  useEffect(() => {
    setActiveRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRoleDetail = activeRole !== "all" ? ROLE_DETAILS[activeRole] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl transition-all">
        {/* Sticky Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-line/80 bg-white/95 px-5 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-3 rounded-full bg-brand" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-body uppercase">
                Curriculum Vitae Preview • zekktech.biz.id
              </p>
              <h2 id="cv-modal-title" className="text-base font-bold text-ink sm:text-lg">
                Zakaria Mujur Prasetyo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-body transition hover:border-ink/40 hover:text-ink sm:inline-flex items-center gap-1.5"
              title="Cetak CV"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-body transition hover:bg-slate-100 hover:text-ink"
              aria-label="Tutup modal"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        {/* Role Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-line bg-slate-50/70 px-4 py-2 sm:px-8 no-scrollbar gap-1.5">
          <button
            type="button"
            onClick={() => setActiveRole("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
              activeRole === "all"
                ? "bg-ink text-white shadow-sm"
                : "text-body hover:bg-line/40 hover:text-ink"
            }`}
          >
            Semua / Ikhtisar
          </button>
          {(Object.keys(ROLE_DETAILS) as Array<Exclude<RoleKey, "all">>).map((key) => {
            const role = ROLE_DETAILS[key];
            const isActive = activeRole === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveRole(key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-brand text-white shadow-sm"
                    : "text-body hover:bg-line/40 hover:text-ink"
                }`}
              >
                <span>{role.title}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable CV Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {/* Header Banner & Identitas */}
          <div className="rounded-2xl border border-line bg-linear-to-br from-slate-50 to-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-brand uppercase">
                    Mahasiswa S1 Teknik Informatika
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                    Freelance Aktif Sejak 2020
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
                  Zakaria Mujur Prasetyo
                </h1>
                <p className="mt-1 text-sm font-semibold text-brand">
                  UI/UX Designer · Frontend Developer · Graphic Designer · IT Support
                </p>
                <p className="mt-2 text-xs leading-relaxed text-body max-w-2xl">
                  Bangkalan, Madura, Jawa Timur • Lulusan SMK Multimedia • Pemilik & Penulis Utama{" "}
                  <a
                    href="https://zekktech.biz.id"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    zekktech.biz.id
                  </a>
                </p>
              </div>

              {/* Quick Contact Box */}
              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
                >
                  {profile.contact.email}
                </a>
                <a
                  href={profile.contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
                >
                  WhatsApp
                </a>
                <a
                  href="https://zekktech.biz.id"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-ink"
                >
                  Kunjungi zekktech.biz.id →
                </a>
              </div>
            </div>
          </div>
          {/* Focused Role Section (If a role is selected) */}
          {currentRoleDetail && (
            <div className={`rounded-2xl border ${currentRoleDetail.borderColor} ${currentRoleDetail.bgLight} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-lg text-white font-black text-xs"
                    style={{ backgroundColor: currentRoleDetail.color }}
                  >
                    {currentRoleDetail.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{currentRoleDetail.title}</h3>
                    <p className="text-xs font-semibold text-body">{currentRoleDetail.subtitle}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${currentRoleDetail.textColor}`}>
                  Fokus Spesialisasi
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-body">{currentRoleDetail.desc}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-bold text-ink">Keahlian Kunci:</h4>
                  <ul className="mt-2 space-y-1 text-xs text-body">
                    {currentRoleDetail.skills.map((s) => (
                      <li key={s} className="flex items-center gap-1.5">
                        <span className="text-brand">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">Tools Utama:</h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {currentRoleDetail.tools.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-2xs border border-line"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-black/5 pt-4">
                <h4 className="text-sm font-bold text-ink">Tanggung Jawab & Kontribusi:</h4>
                <ul className="mt-2 space-y-1.5 text-xs text-body">
                  {currentRoleDetail.responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentRoleDetail.keyProjects.length > 0 && (
                <div className="mt-5 border-t border-black/5 pt-4">
                  <h4 className="text-sm font-bold text-ink">Portofolio Relevan:</h4>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                    {currentRoleDetail.keyProjects.map((p) => (
                      <div key={p.name} className="rounded-xl border border-line bg-white/80 p-3 text-xs shadow-2xs">
                        <p className="font-semibold text-ink">{p.name}</p>
                        <p className="mt-1 text-[11px] text-body">{p.desc}</p>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
                          >
                            Buka Repo / Link →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ringkasan Profil & Bio (dari https://zekktech.biz.id/about) */}
          <div>
            <h3 className="text-sm font-bold text-brand">
              Ringkasan Profil & Filosofi Kerja
            </h3>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-body">
              <p>
                Halo! Saya adalah <strong>Zakaria Mujur Prasetyo (Zekk)</strong>, mahasiswa Teknik Informatika 2024
                di Universitas Trunojoyo Madura yang telah aktif berkarya sebagai freelancer sejak 2020.
                Perjalanan saya dimulai dari ketertarikan mendalam pada dunia grafis dan perakitan komputer sejak usia
                sekolah dasar, yang kemudian diasah secara formal di <strong>SMK jurusan Multimedia</strong>.
              </p>
              <p>
                Saya percaya bahwa produk teknologi terbaik lahir dari sinergi antara <em>tampilan visual yang memikat</em>,{" "}
                <em>pengalaman pengguna (UX) yang intuitif</em>, dan <em>fondasi kode sistem yang kokoh serta terawat</em>.
                Melalui blog teknologi <strong>ZekkTech</strong>, saya juga aktif menulis panduan teknis, edukasi open
                source, dan dokumentasi proyek nyata.
              </p>
            </div>
          </div>
          {/* Riwayat Pengalaman & Organisasi (dari zekktech.biz.id/experience) */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand">
                Pengalaman Kerja & Kepemimpinan Organisasi
              </h3>
              <span className="text-[11px] font-medium text-body">4 Posisi Kunci</span>
            </div>

            <ol className="mt-4 relative border-l border-line pl-5 space-y-6">
              {profile.experience.map((exp) => (
                <li key={exp.org} className="relative">
                  <span
                    className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-white bg-brand shadow-xs"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-ink">{exp.role}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-body">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-brand">
                    {exp.org} • {exp.place}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-body">{exp.desc}</p>
                </li>
              ))}

              <li className="relative">
                <span
                  className="absolute top-1.5 -left-[26px] size-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-ink">Freelance Designer & Tech Specialist</h4>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    2020 - Sekarang
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-600">
                  ZekkTech Studio • Remote
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-body">
                  Menyelesaikan 7+ proyek sistem informasi, bot otomatisasi, branding visual puluhan UMKM & pelajar,
                  serta jasa konsultasi perakitan PC dan troubleshooting sistem.
                </p>
              </li>
            </ol>
          </div>

          {/* Pendidikan & Sertifikasi */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-slate-50/50 p-5">
              <h3 className="text-sm font-bold text-brand">Pendidikan Formal</h3>
              <div className="mt-3 space-y-4 text-xs">
                <div>
                  <p className="font-bold text-ink">S1 Teknik Informatika</p>
                  <p className="text-body font-medium">Universitas Trunojoyo Madura</p>
                  <p className="text-xs text-body">2024 - Sekarang · Bangkalan</p>
                </div>
                <div className="border-t border-line/70 pt-3">
                  <p className="font-bold text-ink">SMK Jurusan Multimedia</p>
                  <p className="text-body font-medium">Lulusan 2024</p>
                  <p className="text-[11px] text-body/80">Fokus: Grafis, Animasi, Video Editing, & Perakitan PC</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-slate-50/50 p-5">
              <h3 className="text-sm font-bold text-brand">Sertifikasi & Prestasi</h3>
              <p className="mt-2 text-xs text-body leading-relaxed">
                Tercatat memiliki <strong>29 sertifikat</strong> pelatihan, workshop teknologi, dan keikutsertaan
                kompetisi nasional maupun lokal di bidang web development, UI/UX, Linux, dan desain digital.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-white border border-line px-2.5 py-1 text-[11px] font-semibold text-ink">
                  29 Sertifikat Terverifikasi
                </span>
                <span className="rounded-md bg-white border border-line px-2.5 py-1 text-[11px] font-semibold text-ink">
                  6+ Tahun Pengalaman Praktis
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-slate-50 px-5 py-4 sm:px-8">
          <p className="text-[11px] text-body">
            Data CV diverifikasi & bersumber dari{" "}
            <a href="https://zekktech.biz.id" target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
              zekktech.biz.id
            </a>
          </p>

          <div className="flex items-center gap-2">
            <a
              href="https://zekktech.biz.id"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-brand"
            >
              Lihat Blog Asli →
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white transition hover:bg-black"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CvPreviewModal;
