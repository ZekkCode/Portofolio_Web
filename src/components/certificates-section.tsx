"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    <section id="sertifikasi" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
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
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((cert) => (
            <div
              key={cert.title}
              className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-white p-4.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-line/50 pb-2.5 dark:border-line/30">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand dark:text-blue-400">
                    <svg className="size-3 fill-current text-emerald-500" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{t("certificates.verifiedBadge")}</span>
                  </span>
                  <span className="font-mono text-[11px] font-medium text-muted">
                    {cert.date}
                  </span>
                </div>

                <h4 className="mt-3 font-display text-sm font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                  {cert.title}
                </h4>
                <p className="mt-1 text-xs font-medium text-muted">
                  {cert.issuer}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-line/40 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                  {cert.category}
                </span>
                {cert.credentialUrl ? (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline dark:text-blue-400"
                  >
                    <span>{t("certificates.viewCredential")}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-muted italic">
                    {t("certificates.verifiedOffline")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Parallax>
    </section>
  );
}

