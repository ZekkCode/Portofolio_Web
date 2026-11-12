"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import type { FolderEntry } from "@/components/folder";
import type { RoleKey } from "@/components/cv-preview-modal";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { ArrowUpRight, FileText } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CvPreviewModal = dynamic(
  () => import("@/components/cv-preview-modal").then((m) => m.CvPreviewModal),
  { ssr: false }
);

// Dynamically code-split the 3D folder component for capable devices
const DynamicFolder = dynamic(() => import("@/components/folder"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CvPageInfo {
  page: number;
  roleKey: Exclude<RoleKey, "all">;
  title: string;
  subtitle: string;
  image: string;
  color: string;
}

const CV_PAGES: CvPageInfo[] = [
  {
    page: 1,
    roleKey: "graphic",
    title: "Profil & Pengalaman",
    subtitle: "Desain Grafis & Creative Media",
    image: "/cv-page-1.png",
    color: "#0284c7",
  },
  {
    page: 2,
    roleKey: "uiux",
    title: "Pendidikan & Organisasi",
    subtitle: "S1 TI UTM (IPK 3.70) · GDGoC",
    image: "/cv-page-2.png",
    color: "#0284c7",
  },
  {
    page: 3,
    roleKey: "frontend",
    title: "Proyek & Rekayasa Web",
    subtitle: "Next.js, TypeScript & Trevio",
    image: "/cv-page-3.png",
    color: "#1b45c4",
  },
  {
    page: 4,
    roleKey: "itsupport",
    title: "Sistem IT & Jaringan",
    subtitle: "Linux, Jaringan Lab & Otomasi",
    image: "/cv-page-4.png",
    color: "#d97706",
  },
];

/**
 * Lightweight, accessible HTML/CSS document folder preview for limited devices.
 * Zero canvas rasterization or WebGL overhead while preserving all 4 CV categories,
 * visual identity, and full document modal preview.
 */
export function StaticCvFolder({
  isOpen,
  pages,
  onOpenPreview,
}: {
  isOpen: boolean;
  pages: CvPageInfo[];
  onOpenPreview: (role: RoleKey) => void;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto py-6 select-none">
      <div className="relative w-[320px] sm:w-[420px] aspect-[1.3/1] rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 p-4 shadow-2xl border border-white/20 dark:border-white/10 flex flex-col justify-between overflow-hidden">
        {/* Top Folder Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-blue-400" />
            <span className="font-mono text-xs font-bold text-sky-200">CV / Zekk</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-sky-300/80">4 Halaman ATS</span>
        </div>

        {/* Fanned Document Cards Container */}
        <div className="relative h-44 sm:h-52 w-full my-auto flex items-center justify-center">
          {pages.map((p, idx) => {
            const rot = (idx - 1.5) * 3;
            const yShift = isOpen ? (idx % 2 === 0 ? -16 : -24) : 0;
            const xShift = isOpen ? (idx - 1.5) * 22 : 0;
            return (
              <div
                key={p.page}
                onClick={() => onOpenPreview(p.roleKey)}
                style={{
                  transform: `translate3d(${xShift}px, ${yShift}px, 0) rotate(${isOpen ? rot : 0}deg)`,
                  zIndex: idx + 1,
                }}
                className="absolute w-[200px] sm:w-[240px] aspect-[1/1.35] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-3 cursor-pointer transition-all duration-500 ease-out hover:scale-105 hover:z-20 will-change-transform"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    Hal {p.page}
                  </span>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {p.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {p.subtitle}
                  </p>
                </div>
                <div className="relative mt-2.5 h-16 sm:h-20 w-full rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.title}
                    className="size-full object-cover object-top opacity-85"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Folder Bottom Bar */}
        <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[10px] text-sky-200/80 font-mono">
          <span>ATS Verified · 2025</span>
          <span>Klik lembar untuk pratinjau</span>
        </div>
      </div>
    </div>
  );
}

export function CvFolderSection() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");

  const { intentProps: cvIntentProps } = usePrefetchOnIntent(
    () => import("@/components/cv-preview-modal"),
    { key: "cv-preview-modal" }
  );
  const [isFolderOpen, setIsFolderOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  });
  const [isMobile, setIsMobile] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GSAP ScrollTrigger: tutup di atas, buka otomatis di tengah, tutup saat scroll lewat ke bawah
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 20%",
      onEnter: () => setIsFolderOpen(true),
      onLeave: () => setIsFolderOpen(false),
      onEnterBack: () => setIsFolderOpen(true),
      onLeaveBack: () => setIsFolderOpen(false),
    });

    if (trigger.isActive) {
      queueMicrotask(() => setIsFolderOpen(true));
    }

    return () => {
      trigger.kill();
    };
  }, []);

  const openPreview = (role: RoleKey) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  // Setiap lembar di dalam folder menggunakan render gambar otentik ATS resolusi tinggi penuh
  const folderItems: FolderEntry[] = CV_PAGES.map((item) => ({
    image: item.image,
    title: item.title,
    description: item.subtitle,
    alt: `Curriculum Vitae Zakaria Mujur P. - Hal ${item.page}`,
  }));

  return (
    <section id="cv" ref={sectionRef} className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <div id="resume" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("cv.title")}
          desc={t("cv.desc")}
        />
      </ScrollReveal>

      {/* Main Interactive Stage: 3D Folder Berkas Karir */}
      <div
        ref={stageRef}
        className="relative mt-8 flex min-h-[400px] sm:min-h-[460px] items-center justify-center py-6"
      >
        <DynamicFolder
          label="CV / Zekk"
          color={isDark ? "#2563eb" : "#1b45c4"}
          mode="flap"
          variant="glass"
          open={isFolderOpen}
          onOpenChange={setIsFolderOpen}
          size={isMobile ? 0.95 : 1.25}
          items={folderItems}
          paperColor="#ffffff"
          tabPosition="right"
          layout="spread"
          openOn="click"
          draggable={true}
          zoomOnClick={false}
          peek={true}
          intro={false}
          tilt={isMobile ? 0.35 : 0.6}
          bounce={0.35}
          speed={1.15}
          frost={0.3}
          theme={isDark ? "dark" : "light"}
          onItemClick={(_item, index) => {
            const item = CV_PAGES[index];
            if (item) {
              openPreview(item.roleKey);
            }
          }}
        />

        {/* Floating Center Button: "Buka Berkas Karier" */}
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <button
            type="button"
            onClick={() => openPreview("all")}
            {...cvIntentProps}
            className="pointer-events-auto group inline-flex min-h-[44px] h-11 items-center gap-2.5 rounded-xl border border-brand-light/30 bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FileText className="size-4 text-sky-200 transition-transform group-hover:scale-110 motion-reduce:transform-none" />
            <span>{t("cv.openAll", "Buka Berkas Karier")}</span>
            <ArrowUpRight className="size-4 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
          </button>
        </div>
      </div>

      {/* CV Preview Modal (lazy-loaded on demand) */}
      {modalOpen && (
        <CvPreviewModal
          isOpen={modalOpen}
          initialRole={selectedRole}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}

export default CvFolderSection;
