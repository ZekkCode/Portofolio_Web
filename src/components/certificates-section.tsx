"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { profile } from "@/lib/profile";

type CategoryFilter = "all" | "design" | "frontend" | "systems";

export function CertificatesSection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const certificates = profile.certificates || [];
  const filtered =
    filter === "all" ? certificates : certificates.filter((c) => c.category === filter);

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
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
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
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              filter === tab.key
                ? "bg-brand text-white shadow-2xs"
                : "border border-line bg-white text-body hover:border-brand/40 hover:text-ink dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Grid of Verified Credentials */}
      <Parallax speed={0.08}>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line/60 bg-white/60 p-12 text-center text-xs text-body dark:border-line/40 dark:bg-[#111422]/60">
            {t("certificates.empty", "Belum ada kredensial dalam kategori ini.")}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((cert) => (
              <div
                key={cert.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-medium">{cert.issuer}</span>
                    <span className="font-mono text-[11px]">{cert.date}</span>
                  </div>

                  <h4 className="mt-2.5 font-display text-sm font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                    {cert.title}
                  </h4>
                </div>

                {cert.credentialUrl && (
                  <div className="mt-4 pt-2.5 border-t border-line/40">
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded dark:text-blue-400"
                    >
                      <span>{t("certificates.viewCredential")}</span>
                      <ArrowUpRight className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Parallax>
    </section>
  );
}

