"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { profile } from "@/lib/profile";

type CategoryFilter = "all" | "design" | "frontend" | "systems";

export function CertificatesSection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const certificates = profile.certificates || [];
  const filtered =
    filter === "all" ? certificates : certificates.filter((c) => c.category === filter);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "design":
        return t("certificates.filterDesign", "Desain & UX");
      case "frontend":
        return t("certificates.filterFrontend", "Frontend & Web");
      case "systems":
        return t("certificates.filterSystems", "Sistem & Jaringan");
      default:
        return cat;
    }
  };

  return (
    <section id="certificates" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="sertifikasi" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={t("certificates.title")}
          desc={t("certificates.desc")}
        />
      </ScrollReveal>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label={t("certificates.title", "Sertifikasi")}
        className="mb-8 flex flex-wrap items-center justify-center gap-2"
      >
        {(
          [
            { key: "all", labelKey: "certificates.filterAll" },
            { key: "design", labelKey: "certificates.filterDesign" },
            { key: "frontend", labelKey: "certificates.filterFrontend" },
            { key: "systems", labelKey: "certificates.filterSystems" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${
              filter === tab.key
                ? "bg-brand text-white border border-brand/30 shadow-xs"
                : "border border-line/80 bg-transparent text-body hover:bg-brand/5 hover:border-brand/40 hover:text-brand dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Grid of Credentials - Stable without parallax drift */}
      <ScrollReveal y={16}>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-line/60 bg-white/60 p-12 text-center text-xs text-body dark:border-line/40 dark:bg-[#111422]/60">
            {t("certificates.empty", "Belum ada kredensial dalam kategori ini.")}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((cert) => (
              <div
                key={cert.title}
                className="group relative flex flex-col justify-between rounded-xl border border-line/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 dark:border-line/60 dark:bg-[#111422]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-medium line-clamp-1">{cert.issuer}</span>
                    <span className="font-mono text-[11px] shrink-0">{cert.date}</span>
                  </div>

                  <h4 className="mt-2.5 font-display text-sm font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                    {cert.title}
                  </h4>

                  <div className="mt-2">
                    <span className="inline-block text-[11px] font-medium text-muted">
                      {getCategoryLabel(cert.category)}
                    </span>
                  </div>
                </div>

                {cert.credentialUrl ? (
                  <div className="mt-4 pt-2.5 border-t border-line/40">
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-brand transition-colors duration-150 hover:text-brand-ink hover:underline active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <span>{t("certificates.viewCredential", "Lihat Bukti")}</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}
