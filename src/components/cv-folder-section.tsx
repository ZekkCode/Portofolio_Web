"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import Folder, { type FolderEntry } from "@/components/folder";
import { CvPreviewModal, type RoleKey } from "@/components/cv-preview-modal";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
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
    title: "Sistem IT & Jaringan",
    subtitle: "Linux, Jaringan Lab & Otomasi",
    image: "/cv-page-4.png",
    color: "#d97706",
  },
];

export function CvFolderSection() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("all");
  const [isFolderOpen, setIsFolderOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  });
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

        {/* Floating Center Button: "Buka Berkas Karier" */}
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <button
            type="button"
            onClick={() => openPreview("all")}
            className="pointer-events-auto group inline-flex min-h-[44px] h-11 items-center gap-2.5 rounded-xl border border-brand-light/30 bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FileText className="size-4 text-sky-200 transition-transform group-hover:scale-110 motion-reduce:transform-none" />
            <span>{t("cv.openAll", "Buka Berkas Karier")}</span>
            <ArrowUpRight className="size-4 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
          </button>
        </div>
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
