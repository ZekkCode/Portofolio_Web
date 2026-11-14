"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { useSiteConfig } from "@/lib/site-store";
import { getPublishedProfile } from "@/lib/content/selectors";
import { playSwitchSound } from "@/lib/sound-effects";

interface PersonaCardItem {
  id: "dev" | "design";
  src: string;
  label: string;
  caption: string;
  alt: string;
}

export function AboutPersonaCard() {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";
  const isEn = locale === "en";
  const config = useSiteConfig();
  const { name, aboutPersona } = getPublishedProfile(config, locale);
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);

  const cards: [PersonaCardItem, PersonaCardItem] = [
    {
      id: "dev",
      src: aboutPersona.frontImage,
      label: aboutPersona.frontLabel,
      caption: aboutPersona.frontCaption,
      alt: isEn
        ? `${name} — ${aboutPersona.frontLabel} ID card`
        : `${name} — Kartu identitas ${aboutPersona.frontLabel}`,
    },
    {
      id: "design",
      src: aboutPersona.backImage || aboutPersona.frontImage,
      label: aboutPersona.backLabel,
      caption: aboutPersona.backCaption,
      alt: isEn
        ? `${name} — ${aboutPersona.backLabel} ID card`
        : `${name} — Kartu identitas ${aboutPersona.backLabel}`,
    },
  ];

  const activeCard = cards[activeIndex];
  const toggleCard = () => {
    playSwitchSound();
    setActiveIndex((prev) => (prev === 0 ? 1 : 0));
  };

  return (
    <div className="flex flex-col items-center lg:items-end w-full">
      <div className="w-full max-w-[232px] sm:max-w-[268px] lg:max-w-[280px]">
        {/* Layered screen/card stack: right & bottom inset prevents edge clipping on 320px viewports */}
        <div className="pr-3.5 pb-2.5 sm:pr-5 sm:pb-4">
          <button
            type="button"
            data-sound="switch"
            onClick={toggleCard}
            aria-pressed={activeIndex === 1}
            aria-label={
              isEn
                ? `Showing ${activeCard.label} card. Click to switch to ${cards[activeIndex === 0 ? 1 : 0].label}.`
                : `Menampilkan kartu ${activeCard.label}. Klik untuk beralih ke ${cards[activeIndex === 0 ? 1 : 0].label}.`
            }
            className="group relative block w-full aspect-[1457/2048] text-left cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-canvas rounded-xl"
          >
            {cards.map((card, index) => {
              const isFront = index === activeIndex;

              return (
                <div
                  key={card.id}
                  aria-hidden={!isFront}
                  className={`absolute inset-0 rounded-xl overflow-hidden border bg-[#0038b8] will-change-transform transition-[transform,opacity,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    isFront
                      ? "z-20 opacity-100 translate-x-0 translate-y-0 rotate-0 scale-100 border-black/10 dark:border-white/20 shadow-[0_20px_42px_-16px_rgba(11,42,138,0.34)] dark:shadow-[0_24px_48px_-14px_rgba(0,0,0,0.75)] group-hover:-translate-y-0.5"
                      : "z-10 opacity-90 translate-x-3.5 translate-y-3 rotate-[3.5deg] scale-[0.955] border-black/15 dark:border-white/10 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_16px_34px_-12px_rgba(0,0,0,0.6)] group-hover:translate-x-5 group-hover:translate-y-3.5 group-hover:rotate-[4.75deg]"
                  }`}
                >
                  <Image
                    src={card.src}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 640px) 228px, 260px"
                    unoptimized
                    draggable={false}
                    className="object-cover"
                  />
                  {/* Dim back layer subtly so the front screen holds unambiguous focal hierarchy */}
                  <div
                    className={`pointer-events-none absolute inset-0 bg-slate-950/15 dark:bg-black/25 transition-opacity duration-500 motion-reduce:transition-none ${
                      isFront ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              );
            })}
          </button>
        </div>

        {/* Restraint hairline persona switcher & caption */}
        <div className="mt-1 border-t border-line/70 pt-2.5 dark:border-line/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3" role="tablist" aria-label={isEn ? "Role ID card" : "Kartu peran"}>
              {cards.map((card, idx) => {
                const selected = idx === activeIndex;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    data-sound={selected ? undefined : "switch"}
                    onClick={() => {
                      if (!selected) playSwitchSound();
                      setActiveIndex(idx as 0 | 1);
                    }}
                    className={`relative whitespace-nowrap py-1 text-[11px] sm:text-xs transition-colors focus:outline-none focus-visible:text-brand ${
                      selected
                        ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-brand dark:after:bg-blue-400"
                        : "font-medium text-muted hover:text-ink"
                    }`}
                  >
                    {card.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              data-sound="switch"
              onClick={toggleCard}
              aria-label={isEn ? "Switch card layer" : "Ganti lapisan kartu"}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap py-1 text-[11px] font-medium text-muted hover:text-ink transition-colors focus:outline-none focus-visible:text-brand"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">{isEn ? "Flip" : "Ganti"}</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-muted" aria-live="polite">
            {activeCard.caption}
          </p>
        </div>
      </div>
    </div>
  );
}
