"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillNav, { type PillNavItem } from "@/components/pill-nav";
import { useSmoothScrollTo } from "@/components/parallax";
import { useSiteConfig } from "@/lib/site-store";
import { getPublishedNavigation, getPublishedProfile } from "@/lib/content/selectors";
import {
  Award,
  BookOpen,
  Briefcase,
  Compass,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  HelpCircle,
  Layers3,
  Link2,
  Mail,
  Newspaper,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SECTION_NAV_DEFAULT: Record<string, string> = {
  tentang: "#tentang",
  akademik: "#tentang",
  services: "#tentang",
  cv: "#cv",
  stack: "#stack",
  proyek: "#proyek",
  blog: "#proyek",
  certificates: "#proyek",
  faq: "#proyek",
  kontak: "#kontak",
};

const TRACKED_SECTIONS = [
  "tentang",
  "akademik",
  "services",
  "cv",
  "stack",
  "proyek",
  "blog",
  "certificates",
  "faq",
  "kontak",
];

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  user: UserRound,
  "user-round": UserRound,
  userround: UserRound,
  file: FileText,
  "file-text": FileText,
  filetext: FileText,
  layers: Layers3,
  layers3: Layers3,
  folder: FolderOpen,
  "folder-open": FolderOpen,
  folderopen: FolderOpen,
  mail: Mail,
  graduation: GraduationCap,
  "graduation-cap": GraduationCap,
  graduationcap: GraduationCap,
  briefcase: Briefcase,
  award: Award,
  wrench: Wrench,
  help: HelpCircle,
  "help-circle": HelpCircle,
  helpcircle: HelpCircle,
  newspaper: Newspaper,
  "book-open": BookOpen,
  bookopen: BookOpen,
  globe: Globe,
  link: Link2,
};

function renderNavIcon(iconName?: string, size = 16) {
  const key = (iconName || "").trim().toLowerCase();
  const Icon = NAV_ICON_MAP[key] || Compass;
  return (
    <Icon
      size={size}
      strokeWidth={size > 16 ? 2 : 1.8}
      aria-hidden="true"
      className="shrink-0"
    />
  );
}

function useNavScrollState(navHrefs: string[]) {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const activeRef = useRef<string>("");
  const scrolledRef = useRef<boolean>(false);
  const atBottomRef = useRef<boolean>(false);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLockedRef = useRef<boolean>(false);
  const hrefSignature = navHrefs.join("|");

  const lockToSection = useCallback((sectionHref: string, durationMs = 800) => {
    isLockedRef.current = true;
    activeRef.current = sectionHref;
    setActive(sectionHref);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      isLockedRef.current = false;
    }, durationMs);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let measureRafId = 0;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastEvalTime = 0;
    let cachedDocHeight = 0;
    let cachedWindowHeight = window.innerHeight;
    let cachedWindowWidth = window.innerWidth;
    let cachedHeaderHeight = 64;
    let cachedFooterTop: number | null = null;
    let cachedSections: { id: string; navHref: string; top: number; bottom: number }[] = [];

    const allowedSet = new Set(hrefSignature.split("|").filter(Boolean));
    const resolveNavHref = (id: string): string => {
      const direct = `#${id}`;
      if (allowedSet.has(direct)) return direct;
      const mapped = SECTION_NAV_DEFAULT[id] || direct;
      if (allowedSet.has(mapped)) return mapped;
      return direct;
    };

    const onManualUserScroll = () => {
      if (isLockedRef.current) {
        isLockedRef.current = false;
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      }
    };

    const measureLayout = () => {
      measureRafId = 0;
      const scrollY = window.scrollY;
      cachedWindowHeight = window.innerHeight;
      cachedWindowWidth = window.innerWidth;
      cachedDocHeight = document.documentElement.scrollHeight;

      const header = document.querySelector("header");
      cachedHeaderHeight = header ? header.getBoundingClientRect().height : 64;

      const footer = document.querySelector("footer");
      cachedFooterTop = footer ? footer.getBoundingClientRect().top + scrollY : null;

      const measured: { id: string; navHref: string; top: number; bottom: number }[] = [];
      for (let i = 0; i < TRACKED_SECTIONS.length; i++) {
        const id = TRACKED_SECTIONS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        measured.push({
          id,
          navHref: resolveNavHref(id),
          top: rect.top + scrollY,
          bottom: rect.bottom + scrollY,
        });
      }
      cachedSections = measured;
    };

    const evaluate = () => {
      rafId = 0;
      if (isLockedRef.current) return;

      const lenisY = (window as unknown as { __zekkLenisScroll?: number }).__zekkLenisScroll;
      const scrollY = typeof lenisY === "number" ? lenisY : window.scrollY;
      const windowHeight = cachedWindowHeight;
      const docHeight = cachedDocHeight || document.documentElement.scrollHeight;

      const nextScrolled = scrollY > 80;
      if (scrolledRef.current !== nextScrolled) {
        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      }

      let nextAtBottom = false;
      if (scrollY > 250) {
        if (cachedFooterTop !== null) {
          nextAtBottom = cachedFooterTop - scrollY <= windowHeight - 40;
        } else {
          nextAtBottom = docHeight - (scrollY + windowHeight) < 140;
        }
      }
      if (atBottomRef.current !== nextAtBottom) {
        atBottomRef.current = nextAtBottom;
        setAtBottom(nextAtBottom);
      }

      const lastAnchor = cachedSections[cachedSections.length - 1]?.navHref || "#kontak";
      if (scrollY + windowHeight >= docHeight - 70) {
        if (activeRef.current !== lastAnchor) {
          activeRef.current = lastAnchor;
          setActive(lastAnchor);
        }
        return;
      }

      const focalPoint = cachedHeaderHeight + Math.min(windowHeight * 0.28, 200);
      let nextActive = "";
      let fallbackActive = "";

      for (let i = 0; i < cachedSections.length; i++) {
        const sec = cachedSections[i];
        const relTop = sec.top - scrollY;
        const relBottom = sec.bottom - scrollY;
        if (i === 0 && relTop > focalPoint + 40) {
          if (activeRef.current !== "") {
            activeRef.current = "";
            setActive("");
          }
          return;
        }
        if (!nextActive && relTop <= focalPoint && relBottom > focalPoint) {
          nextActive = sec.navHref;
        }
        if (relTop <= focalPoint + 80) {
          fallbackActive = sec.navHref;
        }
      }

      const resolved = nextActive || fallbackActive;
      if (activeRef.current !== resolved) {
        activeRef.current = resolved;
        setActive(resolved);
      }
    };

    const scheduleEvaluate = () => {
      if (throttleTimer) return;
      const now = performance.now();
      const elapsed = now - lastEvalTime;
      const waitMs = elapsed >= 96 ? 16 : Math.ceil(96 - elapsed);
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        lastEvalTime = performance.now();
        evaluate();
      }, waitMs);
    };

    const scheduleMeasureAndEvaluate = () => {
      if (measureRafId) return;
      measureRafId = requestAnimationFrame(() => {
        measureLayout();
        lastEvalTime = performance.now();
        evaluate();
      });
    };

    const onResize = () => {
      const nextW = window.innerWidth;
      const nextH = window.innerHeight;
      if (Math.abs(nextW - cachedWindowWidth) < 2 && Math.abs(nextH - cachedWindowHeight) < 2) return;
      scheduleMeasureAndEvaluate();
    };

    ScrollTrigger.addEventListener("refresh", scheduleMeasureAndEvaluate);
    window.addEventListener("scroll", scheduleEvaluate, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("wheel", onManualUserScroll, { passive: true });
    window.addEventListener("touchmove", onManualUserScroll, { passive: true });
    document.fonts?.ready?.then(scheduleMeasureAndEvaluate).catch(() => {});

    measureLayout();
    evaluate();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (measureRafId) cancelAnimationFrame(measureRafId);
      if (throttleTimer) clearTimeout(throttleTimer);
      ScrollTrigger.removeEventListener("refresh", scheduleMeasureAndEvaluate);
      window.removeEventListener("scroll", scheduleEvaluate);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onManualUserScroll);
      window.removeEventListener("touchmove", onManualUserScroll);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [hrefSignature]);

  return { activeSection: active, scrolled, atBottom, lockToSection };
}

function ThemedPillNav(props: Omit<ComponentProps<typeof PillNav>, "theme">) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const navTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";
  return <PillNav {...props} theme={navTheme} />;
}

export function PortfolioPillNav() {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const config = useSiteConfig();
  const pubProfile = useMemo(() => getPublishedProfile(config, locale), [config, locale]);
  const navConfigItems = useMemo(() => getPublishedNavigation(config, locale), [config, locale]);
  const navHrefs = useMemo(() => navConfigItems.map((n) => n.href), [navConfigItems]);
  const { activeSection, scrolled, atBottom, lockToSection } = useNavScrollState(navHrefs);
  const scrollTo = useSmoothScrollTo();

  const brandInitials = useMemo(() => {
    const raw = (pubProfile.brand || "ZekkTech").trim();
    const caps = raw.match(/[A-Z]/g);
    if (caps && caps.length >= 2) return `${caps[0]}${caps[1]}`;
    return raw.slice(0, 2).toUpperCase();
  }, [pubProfile.brand]);

  const desktopNavItems: PillNavItem[] = useMemo(
    () =>
      navConfigItems.map((item) => ({
        label: item.label,
        href: item.href,
        ariaLabel: item.label,
        icon: renderNavIcon(item.iconName, 16),
      })),
    [navConfigItems]
  );

  const handleItemClick = (item: PillNavItem, _index: number, e: React.MouseEvent<HTMLElement>) => {
    if (item.href?.startsWith("#")) {
      e.preventDefault();
      lockToSection(item.href);
      scrollTo(item.href);
    } else if (item.href?.startsWith("http") || item.href?.startsWith("/")) {
      const targetItem = navConfigItems.find((n) => n.href === item.href);
      if (targetItem?.openInNewTab || item.href?.startsWith("http")) {
        e.preventDefault();
        window.open(item.href, "_blank", "noopener,noreferrer");
      }
    }
  };

  const mobileRailItems = useMemo(
    () => [
      {
        id: "atas",
        label: "Home",
        href: "#atas",
        icon: (
          <span className="font-display text-[10.5px] font-black italic tracking-tighter text-inherit">
            {brandInitials}
          </span>
        ),
        openInNewTab: false,
      },
      ...navConfigItems.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: renderNavIcon(item.iconName, 17),
        openInNewTab: Boolean(item.openInNewTab),
      })),
    ],
    [brandInitials, navConfigItems]
  );

  const handleMobileNavClick = (
    href: string,
    openInNewTab: boolean | undefined,
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollTo(href);
    } else if (href.startsWith("http") || openInNewTab) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  if (navConfigItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* DESKTOP: Floating at bottom center (reveals when scrolled, hides when reaching bottom footer) */}
      <div
        className={`pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 hidden -translate-x-1/2 md:flex max-w-[calc(100vw-2rem)] overflow-hidden rounded-full transition-all duration-300 ${
          scrolled && !atBottom
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="pointer-events-auto overflow-hidden rounded-full">
          <ThemedPillNav
            logo={
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-black italic tracking-tighter text-white shadow-sm">
                {brandInitials}
              </span>
            }
            logoAlt={`${pubProfile.brand} Home`}
            logoHref="#atas"
            items={desktopNavItems}
            activeHref={activeSection}
            onItemClick={handleItemClick}
            layout="joined"
            itemStyle="plain"
            hoverEffect="glide"
            indicator="pill"
            surface="solid"
            size="md"
            highlightColor="#1b45c4"
            highlightTextColor="#ffffff"
            bounce={0.25}
            stretch={0.4}
            collapse="never"
            intro={false}
            ariaLabel="Navigasi Desktop"
          />
        </div>
      </div>

      {/* MOBILE: Sleek vertical icon-only rail along the right edge */}
      <nav
        aria-label="Navigasi Cepat Mobile"
        className={`fixed end-[calc(0.625rem+env(safe-area-inset-right,0px))] top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-line/80 bg-white/95 p-1.5 shadow-xl transition-all duration-300 md:hidden dark:border-white/10 dark:bg-[#0c0e17]/95 ${
          !atBottom
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-12 opacity-0 pointer-events-none"
        }`}
      >
        {mobileRailItems.map((item, index) => {
          const isHome = item.id === "atas";
          const isActive = isHome
            ? !activeSection || activeSection === "#atas"
            : activeSection === item.href;

          return (
            <div key={item.id} className="flex flex-col items-center">
              {index === 1 && (
                <span
                  className="mb-1.5 h-px w-4 bg-line/80 dark:bg-white/10"
                  aria-hidden="true"
                />
              )}
              <a
                href={item.href}
                onClick={(e) => handleMobileNavClick(item.href, item.openInNewTab, e)}
                aria-label={item.label}
                aria-current={isActive ? "location" : undefined}
                title={item.label}
                className={`group relative flex size-9 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? "bg-brand text-white shadow-md shadow-brand/35 scale-105"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                }`}
              >
                {item.icon}

                <span className="pointer-events-none absolute end-[calc(100%+8px)] top-1/2 -translate-y-1/2 rounded-md bg-slate-900/95 px-2 py-1 text-[11px] font-medium text-white shadow-md whitespace-nowrap opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 dark:bg-slate-800/95">
                  {item.label}
                </span>
              </a>
            </div>
          );
        })}
      </nav>
    </>
  );
}
