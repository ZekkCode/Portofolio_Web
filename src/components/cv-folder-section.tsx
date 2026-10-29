"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import Folder, { type FolderEntry } from "@/components/folder";
import { CvPreviewModal, type RoleKey, ROLE_DETAILS } from "@/components/cv-preview-modal";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import { ArrowUpRight, FileText } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
    title: "Sistem IT & Sertifikasi",
    subtitle: "Linux, Otomasi & BNSP Grafis",
    image: "/cv-page-4.png",
    color: "#d97706",
  },
];

export function CvFolderSection() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { cvDocs } = useSiteConfig();
  const mounted = useMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isDark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GSAP ScrollTrigger: tutup di atas, buka otomatis di tengah, tutup saat scroll lewat ke bawah
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setIsFolderOpen(true);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 62%",
      end: "bottom 32%",
      onEnter: () => setIsFolderOpen(true),
      onLeave: () => setIsFolderOpen(false),
      onEnterBack: () => setIsFolderOpen(true),
      onLeaveBack: () => setIsFolderOpen(false),
    });

    if (trigger.isActive) {
      setIsFolderOpen(true);
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

      {/* Main Interactive Stage Box: 3D Folder Berkas Karir */}
      <div
        ref={stageRef}
        className="relative mt-8 overflow-hidden rounded-3xl border border-line/80 bg-white/95 p-6 sm:p-10 shadow-xs dark:border-line/60 dark:bg-[#111422]/90"
      >
        {/* 3D Folder Center Stage */}
        <Parallax speed={-0.12}>
          <div className="relative z-10 flex min-h-[360px] sm:min-h-[420px] items-center justify-center pt-4 pb-8">
            <Folder
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
              zoomOnClick={true}
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

            {/* Floating Center Button: "Buka Berkas CV Lengkap" */}
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <button
                type="button"
                onClick={() => openPreview("all")}
                className="pointer-events-auto group inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-ink/90 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-black hover:shadow-2xl active:scale-95 dark:border-white/20 dark:bg-white/95 dark:text-ink dark:hover:bg-white"
              >
                <FileText className="size-4 text-sky-400 dark:text-brand transition-transform group-hover:scale-110" />
                <span>Buka Berkas CV Lengkap</span>
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-white/70 dark:text-ink/70" />
              </button>
            </div>
          </div>
        </Parallax>

        {/* Bottom Role Quick-Access Navigation */}
        <ScrollReveal y={20} delay={0.1} className="relative z-10 mt-6 border-t border-line/70 pt-6 dark:border-line/40">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CV_PAGES.map((item) => {
              const detail = ROLE_DETAILS[item.roleKey];
              const doc = cvDocs.find((d) => d.roleKey === item.roleKey);
              const title = doc?.title || detail.title;
              const subtitle = item.subtitle;
              const color = doc?.color || detail.color;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => openPreview(item.roleKey)}
                  className="group flex flex-col rounded-2xl border border-line bg-white p-4 text-left shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/50 dark:bg-[#151928]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex size-6 items-center justify-center rounded-md text-white font-mono text-[11px] font-bold"
                      style={{ backgroundColor: color }}
                    >
                      0{item.page}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                  </div>
                  <h4 className="mt-2.5 text-xs sm:text-sm font-bold text-ink leading-snug">{title}</h4>
                  <p className="mt-0.5 text-[11px] text-body line-clamp-1">{subtitle}</p>
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      </div>

      {/* CV Preview Modal */}
      <CvPreviewModal
        isOpen={modalOpen}
        initialRole={selectedRole}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

export default CvFolderSection;
