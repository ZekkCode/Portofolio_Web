"use client";

import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import {
  getPublishedSectionMeta,
  getPublishedServices,
} from "@/lib/content/selectors";
import { Layout, Code, Video, Server, ArrowRight } from "lucide-react";

export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const locale = currentLang === "en" ? "en" : "id";

  const config = useSiteConfig();
  const secMeta = getPublishedSectionMeta(config, "services", locale);
  const items = getPublishedServices(config, locale);

  if (items.length === 0) {
    return null;
  }

  const renderIcon = (iconName: string, iconUrl?: string, title?: string) => {
    if (iconUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt={title || iconName} className="size-5 object-contain" />
      );
    }
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

  return (
    <section
      id="services"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="layanan" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={secMeta.title || t("services.title")}
          desc={secMeta.desc || t("services.desc")}
        />
      </ScrollReveal>

      <ScrollReveal y={20}>
        <div className="grid gap-4 sm:grid-cols-2 auto-rows-fr items-stretch">
          {items.map((service) => (
            <div
              key={service.id || service.key}
              className="group relative flex h-full flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 sm:p-6 transition-colors duration-200 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 text-brand dark:text-blue-400" aria-hidden="true">
                    {renderIcon(service.iconName, service.iconUrl, service.title)}
                  </span>

                  <h3 className="font-display text-base sm:text-lg font-bold text-ink transition-colors group-hover:text-brand dark:group-hover:text-blue-400">
                    {service.title}
                  </h3>
                </div>

                <p className="mt-3.5 flex-1 text-xs sm:text-sm leading-relaxed text-body">
                  {service.desc}
                </p>

                {service.deliverables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.deliverables.map((del) => (
                      <span
                        key={del}
                        className="rounded-md border border-line/70 bg-surface/80 px-2 py-0.5 text-[11px] font-medium text-body dark:border-line/40 dark:bg-slate-800/70"
                      >
                        {del}
                      </span>
                    ))}
                  </div>
                )}

                {service.ctaUrl && (
                  <div className="mt-4 pt-3 border-t border-line/50 dark:border-line/30 flex items-center justify-end">
                    <a
                      href={service.ctaUrl}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
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
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}

export default ServicesSection;
