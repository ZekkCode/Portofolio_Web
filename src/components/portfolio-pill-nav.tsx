"use client";

import { useEffect, useState } from "react";
import PillNav, { type PillNavItem } from "@/components/pill-nav";
import { useSmoothScrollTo } from "@/components/parallax";
import { profile } from "@/lib/profile";

const desktopNavItems: PillNavItem[] = [
  { label: "Tentang", href: "#tentang" },
  { label: "CV Role", href: "#cv" },
  { label: "Stack", href: "#stack" },
  { label: "Proyek", href: "#proyek" },
  { label: "Kontak", href: "#kontak" },
];

const mobileNavItems: PillNavItem[] = [
  { label: "Tentang", href: "#tentang" },
  { label: "CV Role", href: "#cv" },
  { label: "Stack", href: "#stack" },
  { label: "Proyek", href: "#proyek" },
  { label: "Kontak", href: "#kontak" },
  { label: "Hubungi WhatsApp", href: profile.contact.whatsapp },
];

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
  const activeSection = useActiveSection();
  const scrollTo = useSmoothScrollTo();

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
            surface="glass"
            theme="light"
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
          surface="glass"
          theme="light"
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
