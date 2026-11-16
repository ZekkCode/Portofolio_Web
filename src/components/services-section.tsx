"use client";

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import {
  getPublishedSectionMeta,
  getPublishedServices,
} from "@/lib/content/selectors";
import {
  Layout,
  Code,
  Video,
  Server,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ServiceItem = ReturnType<typeof getPublishedServices>[number];

export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const locale = currentLang === "en" ? "en" : "id";

  const config = useSiteConfig();
  const secMeta = getPublishedSectionMeta(config, "services", locale);
  const items = getPublishedServices(config, locale);

  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  const handlePrevService = () => {
    setCurrentServiceIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNextService = () => {
    setCurrentServiceIndex((prev) => (prev + 1) % items.length);
  };

  const handleServiceTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleServiceTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextService();
      } else {
        handlePrevService();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const renderIcon = (iconName: string, iconUrl?: string, title?: string) => {
    if (iconUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt={title || iconName} className="size-4 sm:size-5 object-contain" />
      );
    }
    switch (iconName.toLowerCase()) {
      case "code":
      case "terminal":
        return <Code className="size-4 sm:size-5" />;
      case "video":
      case "multimedia":
      case "camera":
        return <Video className="size-4 sm:size-5" />;
      case "server":
      case "database":
      case "cpu":
        return <Server className="size-4 sm:size-5" />;
      case "layout":
      case "figma":
      default:
        return <Layout className="size-4 sm:size-5" />;
    }
  };

  const renderServiceCard = (service: ServiceItem, isMobile: boolean) => {
    const key = service.id || service.key;

    return (
      <div
        key={key}
        className={`group relative flex h-full min-w-0 flex-col justify-between rounded-2xl border border-line/80 bg-white transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] ${
          isMobile ? "p-4 min-h-[220px]" : "p-5 sm:p-6"
        }`}
      >
        <div className="flex h-full min-w-0 flex-col">
          {/* Header: Icon & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 rounded-lg bg-brand/10 p-1.5 text-brand dark:bg-blue-500/15 dark:text-blue-400"
              aria-hidden="true"
            >
              {renderIcon(service.iconName, service.iconUrl, service.title)}
            </span>

            <h3 className="font-display text-sm sm:text-lg font-bold text-ink transition-colors group-hover:text-brand dark:group-hover:text-blue-400 leading-snug sm:leading-normal min-w-0 break-words">
              {service.title}
            </h3>
          </div>

          {/* Description */}
          <div className="mt-2.5 sm:mt-3.5 flex-1 min-w-0">
            <p className="text-xs sm:text-sm leading-relaxed text-body">
              {service.desc}
            </p>
          </div>

          {/* Deliverables */}
          {service.deliverables.length > 0 && (
            <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
              {service.deliverables.map((del) => (
                <span
                  key={del}
                  className="rounded border border-line/70 bg-surface/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-body dark:border-line/40 dark:bg-slate-800/70 truncate max-w-full"
                >
                  {del}
                </span>
              ))}
            </div>
          )}

          {/* CTA link */}
          {service.ctaUrl && (
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-line/50 dark:border-line/30 flex items-center justify-end">
              <a
                href={service.ctaUrl}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-brand hover:underline dark:text-blue-400"
              >
                <span>
                  {service.ctaLabel ||
                    (locale === "en" ? "Learn More" : "Pelajari Lebih Lanjut")}
                </span>
                <ArrowRight className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeMobileService = items[currentServiceIndex] || items[0];

  return (
    <section
      id="services"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-4 sm:px-5 py-10 sm:py-20"
    >
      <div id="layanan" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={secMeta.title || t("services.title")}
          desc={secMeta.desc || t("services.desc")}
        />
      </ScrollReveal>

      <ScrollReveal y={20}>
        {/* MOBILE ONLY: Single-Card Carousel dengan Toggle Kiri/Kanan & Swipe */}
        <div
          className="sm:hidden"
          onTouchStart={handleServiceTouchStart}
          onTouchEnd={handleServiceTouchEnd}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tombol Kiri (Sebelumnya) */}
            <button
              type="button"
              onClick={handlePrevService}
              aria-label={locale === "en" ? "Previous service" : "Layanan sebelumnya"}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line/80 bg-white text-ink shadow-sm transition-all hover:border-brand/40 active:scale-95 dark:border-line/60 dark:bg-[#111422] dark:text-white"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Konten Kartu Layanan Aktif */}
            <div className="min-w-0 flex-1">
              {renderServiceCard(activeMobileService, true)}
            </div>

            {/* Tombol Kanan (Berikutnya) */}
            <button
              type="button"
              onClick={handleNextService}
              aria-label={locale === "en" ? "Next service" : "Layanan berikutnya"}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line/80 bg-white text-ink shadow-sm transition-all hover:border-brand/40 active:scale-95 dark:border-line/60 dark:bg-[#111422] dark:text-white"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Indikator Posisi di Bawah */}
          <div className="mt-2.5 flex items-center justify-center">
            <span
              data-services-indicator
              data-carousel-indicator
              className="font-mono text-[11px] font-semibold text-muted"
            >
              {currentServiceIndex + 1} / {items.length}
            </span>
          </div>
        </div>

        {/* DESKTOP ONLY: Grid 2 Kolom Asli */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4 auto-rows-fr items-stretch">
          {items.map((service) => renderServiceCard(service, false))}
        </div>
      </ScrollReveal>
    </section>
  );
}

export default ServicesSection;
