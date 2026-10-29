"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import PillNav, { type PillNavItem } from "@/components/pill-nav";
import { useSmoothScrollTo } from "@/components/parallax";
import { profile } from "@/lib/profile";
import { FileText, FolderOpen, Layers3, Mail, UserRound } from "lucide-react";

const SECTION_NAV_MAP: Record<string, string> = {
  tentang: "#tentang",
  services: "#tentang",
  cv: "#cv",
  stack: "#stack",
  proyek: "#proyek",
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

      // When near bottom of page, activate the last nav section (#kontak)
      if (scrollY + windowHeight >= docHeight - 60) {
        const target = "#kontak";
        if (activeRef.current !== target) {
          activeRef.current = target;
          setActive(target);
        }
        return;
      }

      // Section is active when its top enters the upper viewing zone (45% of viewport)
      const ACTIVATION_THRESHOLD = Math.round(windowHeight * 0.45);
      let nextActive = "";

      for (let i = TRACKED_SECTIONS.length - 1; i >= 0; i--) {
        const id = TRACKED_SECTIONS[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= ACTIVATION_THRESHOLD) {
            nextActive = SECTION_NAV_MAP[id] || `#${id}`;
            break;
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

  const mobileNavItems: PillNavItem[] = [
    ...desktopNavItems,
    {
      label: t("nav.email", "Email"),
      href: `mailto:${profile.contact.email}`,
      icon: <Mail size={16} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />,
    },
  ];

  const handleItemClick = (item: PillNavItem, _index: number, e: React.MouseEvent<HTMLElement>) => {
    if (item.href?.startsWith("#")) {
      e.preventDefault();
      scrollTo(item.href, -88);
    } else if (item.href?.startsWith("http")) {
      e.preventDefault();
      window.open(item.href, "_blank", "noopener,noreferrer");
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

      {/* MOBILE: Positioned on the trailing edge with safe-area top inset */}
      <div className="fixed top-[calc(0.625rem+env(safe-area-inset-top,0px))] end-4 z-50 flex justify-end md:hidden">
        <PillNav
          items={mobileNavItems}
          activeHref={activeSection}
          onItemClick={handleItemClick}
          collapse="always"
          surface="solid"
          theme={navTheme}
          size="md"
          highlightColor="#1b45c4"
          highlightTextColor="#ffffff"
          ariaLabel="Navigasi Mobile"
          className="w-auto transition-all duration-300 data-[open]:w-60 data-[open]:max-w-[calc(100vw-2rem)] shadow-lg"
        />
      </div>
    </>
  );
}
