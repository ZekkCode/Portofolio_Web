"use client";

import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, defaultServices, type ServiceItemConfig } from "@/lib/site-store";
import { Layout, Code, Video, Server, Sparkles, ArrowRight } from "lucide-react";

export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";

  const { services: cfgServices } = useSiteConfig();
  const rawList = cfgServices && cfgServices.length > 0 ? cfgServices : defaultServices;
  const items = rawList
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "code":
      case "terminal":
        return <Code className="size-5" />;
      case "video":
      case "multimedia":
      case "camera":
        return <Video className="size-5" />;
      case "server":
      case "database":
      case "cpu":
        return <Server className="size-5" />;
      case "layout":
      case "figma":
      default:
        return <Layout className="size-5" />;
    }
  };

  const renderCard = (service: ServiceItemConfig) => {
    const title = isEn ? service.titleEn || service.titleId : service.titleId;
    const desc = isEn ? service.descEn || service.descId : service.descId;

    return (
      <div
        key={service.id || service.key}
        className="group relative flex h-full flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
      >
        <div className="flex h-full flex-col">
          {/* Header: Icon di Kiri, Teks Judul Layanan di Sebelah Kanan Icon */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-blue-500/10 dark:text-blue-400">
              {renderIcon(service.iconName)}
            </div>

            <h3 className="font-display text-base sm:text-lg font-bold text-brand dark:text-blue-400 transition-colors group-hover:text-brand-ink dark:group-hover:text-blue-300">
              {title}
            </h3>
          </div>

          <p className="mt-3.5 flex-1 text-xs sm:text-sm leading-relaxed text-body">
            {desc}
          </p>

          {service.ctaUrl && (
            <div className="mt-4 pt-3 border-t border-line/50 dark:border-line/30 flex items-center justify-end">
              <a
                href={service.ctaUrl}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
              >
                <span>{isEn ? "Learn More" : "Pelajari Lebih Lanjut"}</span>
                <ArrowRight className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section id="services" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="layanan" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle title={t("services.title")} desc={t("services.desc")} />
      </ScrollReveal>

      {/* Grid Banner Layanan: Sejajar, Rapi, Simetris 2x2 Tanpa Disparitas Parallax */}
      <ScrollReveal y={20}>
        <div className="grid gap-4 sm:grid-cols-2 auto-rows-fr items-stretch">
          {items.map(renderCard)}
        </div>
      </ScrollReveal>
    </section>
  );
}

export default ServicesSection;
