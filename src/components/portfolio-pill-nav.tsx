"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useMounted } from "@/lib/use-mounted";
import PillNav, { type PillNavItem } from "@/components/pill-nav";
import { useSmoothScrollTo } from "@/components/parallax";
import { profile } from "@/lib/profile";

function useActiveSection() {
  const [active, setActive] = useState<string>("#atas");

  useEffect(() => {
    const sectionIds = ["atas", "tentang", "cv", "stack", "proyek", "kontak"];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = 180;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollY >= top - offset) {
            setActive(`#${id}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return active;
}

export function PortfolioPillNav() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const activeSection = useActiveSection();
  const scrollTo = useSmoothScrollTo();

  const navTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  const desktopNavItems: PillNavItem[] = [
    { label: t("nav.about"), href: "#tentang" },
    { label: t("nav.cv"), href: "#cv" },
    { label: t("nav.stack"), href: "#stack" },
    { label: t("nav.projects"), href: "#proyek" },
    { label: t("nav.contact"), href: "#kontak" },
  ];

  const mobileNavItems: PillNavItem[] = [
    { label: t("nav.about"), href: "#tentang" },
    { label: t("nav.cv"), href: "#cv" },
    { label: t("nav.stack"), href: "#stack" },
    { label: t("nav.projects"), href: "#proyek" },
    { label: t("nav.contact"), href: "#kontak" },
    { label: t("nav.whatsapp"), href: profile.contact.whatsapp },
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
      {/* DESKTOP: Floating at bottom center */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 md:flex">
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

      {/* MOBILE: Positioned on the right */}
      <div className="fixed top-2.5 right-4 z-50 flex justify-end md:hidden">
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
