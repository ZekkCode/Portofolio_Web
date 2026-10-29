"use client";

import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

interface ServiceItem {
  key: string;
  num: string;
  iconPath: string;
}

const services: ServiceItem[] = [
  {
    key: "s1",
    num: "01",
    iconPath:
      "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm0 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Zm1 5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H5Z",
  },
  {
    key: "s2",
    num: "02",
    iconPath:
      "m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12",
  },
  {
    key: "s3",
    num: "03",
    iconPath:
      "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z",
  },
  {
    key: "s4",
    num: "04",
    iconPath:
      "M5.25 14.25v-2.625M9.75 14.25v-3.75M14.25 14.25v-1.875M18.75 14.25V9m-15.75 9h18a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5h-18A1.5 1.5 0 0 0 1.5 5.25v12a1.5 1.5 0 0 0 1.5 1.5Z",
  },
];

export function ServicesSection() {
  const { t } = useTranslation();

  const renderCard = (service: ServiceItem) => {
    const title = t(`services.${service.key}Title`);
    const desc = t(`services.${service.key}Desc`);

    return (
      <div
        key={service.key}
        className="group relative flex h-full flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
      >
        <div>
          {/* Header: Icon di Kiri, Teks Judul Layanan di Sebelah Kanan Icon */}
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-blue-500/10 dark:text-blue-400">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={service.iconPath} />
              </svg>
            </div>

            <h3 className="font-display text-base sm:text-lg font-bold text-brand dark:text-blue-400 transition-colors group-hover:text-brand-ink dark:group-hover:text-blue-300">
              {title}
            </h3>
          </div>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-body">
            {desc}
          </p>
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
        <div className="grid gap-4 sm:grid-cols-2 items-stretch">
          {services.map(renderCard)}
        </div>
      </ScrollReveal>
    </section>
  );
}
