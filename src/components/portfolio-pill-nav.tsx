"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import PillNav, { type PillNavItem } from "@/components/pill-nav";
import { useSmoothScrollTo } from "@/components/parallax";
import { FileText, FolderOpen, Layers3, Mail, UserRound } from "lucide-react";

const SECTION_NAV_MAP: Record<string, string> = {
  tentang: "#tentang",
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
  "services",
  "cv",
  "stack",
  "proyek",
  "blog",
  "certificates",
  "faq",
  "kontak",
];

function useActiveSection() {
  const [active, setActive] = useState<string>("");
  const activeRef = useRef<string>("");

  useEffect(() => {
    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 1. When near bottom of page, activate the last nav section (#kontak)
      if (scrollY + windowHeight >= docHeight - 70) {
        const target = "#kontak";
        if (activeRef.current !== target) {
          activeRef.current = target;
          setActive(target);
        }
        return;
      }

      // 2. Reading focal point:
      // Eye focus line is in the upper reading zone below the sticky header.
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 64;
      const focalPoint = headerHeight + Math.min(windowHeight * 0.28, 200);

      // If hero / top of page: check if the first tracked section (#tentang) is still below focalPoint
      const firstSection = document.getElementById("tentang");
      if (firstSection) {
        const firstRect = firstSection.getBoundingClientRect();
        if (firstRect.top > focalPoint + 40) {
          if (activeRef.current !== "") {
            activeRef.current = "";
            setActive("");
          }
          return;
        }
      }

      // 3. Primary check: which tracked section's boundary contains the focalPoint?
      let nextActive = "";
      for (let i = 0; i < TRACKED_SECTIONS.length; i++) {
        const id = TRACKED_SECTIONS[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= focalPoint && rect.bottom > focalPoint) {
            nextActive = SECTION_NAV_MAP[id] || `#${id}`;
            break;
          }
        }
      }

      // 4. Fallback check (for transitions or padding gaps): closest section above or at focalPoint
      if (!nextActive) {
        for (let i = TRACKED_SECTIONS.length - 1; i >= 0; i--) {
          const id = TRACKED_SECTIONS[i];
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= focalPoint + 80) {
              nextActive = SECTION_NAV_MAP[id] || `#${id}`;
              break;
            }
          }
        }
      }

      // Prevent continuous state updates if active section hasn't changed
      if (activeRef.current !== nextActive) {
        activeRef.current = nextActive;
        setActive(nextActive);
      }
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });
    document.fonts?.ready?.then(updateActiveSection).catch(() => {});

    // ResizeObserver to track layout shifts (images loaded, dynamic data)
    const resizeObserver = new ResizeObserver(() => {
      updateActiveSection();
    });
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      resizeObserver.disconnect();
    };
  }, []);

  return active;
}

export function PortfolioPillNav() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const activeSection = useActiveSection();
  const scrollTo = useSmoothScrollTo();
  const [scrolled, setScrolled] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Muncul setelah scroll melewati hero (80px)
      setScrolled(scrollY > 80);

      // Otomatis menghilang saat mencapai area footer di paling bawah halaman
      if (scrollY <= 250) {
        setAtBottom(false);
        return;
      }

      const footer = document.querySelector("footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        setAtBottom(rect.top <= windowHeight - 40);
      } else {
        const remainingDistance = docHeight - (scrollY + windowHeight);
        setAtBottom(remainingDistance < 140);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const navTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  const desktopNavItems: PillNavItem[] = [
    {
      label: t("nav.about"),
      href: "#tentang",
      icon: <UserRound size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
    {
      label: t("nav.cv"),
      href: "#cv",
      ariaLabel: t("nav.cv"),
      icon: <FileText size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
    {
      label: t("nav.stack"),
      href: "#stack",
      icon: <Layers3 size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
    {
      label: t("nav.projects"),
      href: "#proyek",
      icon: <FolderOpen size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
    {
      label: t("nav.contact"),
      href: "#kontak",
      icon: <Mail size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
  ];

  const handleItemClick = (item: PillNavItem, _index: number, e: React.MouseEvent<HTMLElement>) => {
    if (item.href?.startsWith("#")) {
      e.preventDefault();
      scrollTo(item.href);
    } else if (item.href?.startsWith("http")) {
      e.preventDefault();
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
  };

  const mobileRailItems = [
    {
      id: "atas",
      label: "Home",
      href: "#atas",
      icon: (
        <span className="font-display text-[10.5px] font-black italic tracking-tighter text-inherit">
          ZT
        </span>
      ),
    },
    {
      id: "tentang",
      label: t("nav.about", "Tentang"),
      href: "#tentang",
      icon: <UserRound size={17} strokeWidth={2} aria-hidden="true" />,
    },
    {
      id: "cv",
      label: t("nav.cv", "CV ATS"),
      href: "#cv",
      icon: <FileText size={17} strokeWidth={2} aria-hidden="true" />,
    },
    {
      id: "stack",
      label: t("nav.stack", "Tech Stack"),
      href: "#stack",
      icon: <Layers3 size={17} strokeWidth={2} aria-hidden="true" />,
    },
    {
      id: "proyek",
      label: t("nav.projects", "Proyek"),
      href: "#proyek",
      icon: <FolderOpen size={17} strokeWidth={2} aria-hidden="true" />,
    },
    {
      id: "kontak",
      label: t("nav.contact", "Kontak"),
      href: "#kontak",
      icon: <Mail size={17} strokeWidth={2} aria-hidden="true" />,
    },
  ];

  const handleMobileNavClick = (href: string, e: React.MouseEvent<HTMLElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollTo(href);
    } else if (href.startsWith("http")) {
      e.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      {/* DESKTOP: Floating at bottom center (reveals when scrolled, hides when reaching bottom footer) */}
      <div
        className={`pointer-events-none fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 hidden -translate-x-1/2 md:flex transition-all duration-300 ${
          scrolled && !atBottom
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="pointer-events-auto">
          <PillNav
            logo={
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[11px] font-black italic tracking-tighter text-white shadow-sm">
                ZT
              </span>
            }
            logoAlt="ZekkTech Home"
            logoHref="#atas"
            items={desktopNavItems}
            activeHref={activeSection}
            onItemClick={handleItemClick}
            layout="joined"
            itemStyle="plain"
            hoverEffect="glide"
            indicator="pill"
            surface="solid"
            theme={navTheme}
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
        className={`fixed end-[calc(0.625rem+env(safe-area-inset-right,0px))] top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-line/80 bg-white/90 p-1.5 shadow-xl backdrop-blur-md transition-all duration-300 md:hidden dark:border-white/10 dark:bg-[#0c0e17]/90 ${
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
              {/* Subtle divider below home button */}
              {index === 1 && (
                <span
                  className="mb-1.5 h-px w-4 bg-line/80 dark:bg-white/10"
                  aria-hidden="true"
                />
              )}
              <a
                href={item.href}
                onClick={(e) => handleMobileNavClick(item.href, e)}
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

                {/* Floating tooltip label on hover/focus */}
                <span className="pointer-events-none absolute end-[calc(100%+8px)] top-1/2 -translate-y-1/2 rounded-md bg-slate-900/95 px-2 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-xs whitespace-nowrap opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 dark:bg-slate-800/95">
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
