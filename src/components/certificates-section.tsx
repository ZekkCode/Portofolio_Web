"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Award, ImageIcon } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { profile } from "@/lib/profile";

type CategoryFilter = "all" | "design" | "frontend" | "systems";
type CertificateItem = {
  title: string;
  issuer: string;
  date: string;
  credentialUrl: string;
  category: "design" | "frontend" | "systems";
  imageUrl?: string;
};

const certificates: readonly CertificateItem[] = profile.certificates;

export function CertificatesSection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const filtered = filter === "all"
    ? certificates
    : certificates.filter((certificate) => certificate.category === filter);

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: t("certificates.filterAll") },
    { key: "design", label: t("certificates.filterDesign") },
    { key: "frontend", label: t("certificates.filterFrontend") },
    { key: "systems", label: t("certificates.filterSystems") },
  ];

  const categoryLabel = (category: CertificateItem["category"]) =>
    categories.find((item) => item.key === category)?.label || category;

  return (
    <section
      id="certificates"
      aria-label={t("certificates.title")}
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="sertifikasi" className="absolute -top-20" aria-hidden="true" />
      <ScrollReveal y={18}>
        <SectionTitle
          title={t("certificates.title")}
          desc={t("certificates.desc")}
        />
      </ScrollReveal>

      <div
        className="mb-8 flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label={t("certificates.title")}
      >
        {categories.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={
              "min-h-11 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:text-sm " +
              (filter === item.key
                ? "border-brand bg-brand text-white"
                : "border-line/80 bg-white text-body hover:border-brand/50 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:hover:text-blue-400")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted">
        {t("certificates.selectedCount", { count: certificates.length })}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line/70 p-8 text-center text-sm text-body dark:border-line/50">
          {t("certificates.empty")}
        </div>
      ) : (
        <ScrollReveal y={16}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((certificate) => (
              <li key={certificate.title} className="min-w-0">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-white p-5 shadow-2xs transition-colors hover:border-brand/40 dark:border-line/60 dark:bg-[#111422]">
                  {certificate.imageUrl ? (
                    <div className="mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-line/60 bg-surface dark:border-line/40">
                      {/* Images are optional and must be real certificate assets. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={certificate.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-blue-500/10 dark:text-blue-400">
                      <Award className="size-5" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span className="font-medium">{certificate.issuer}</span>
                    <time dateTime={certificate.date}>{certificate.date}</time>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold leading-snug text-ink">
                    {certificate.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted">{categoryLabel(certificate.category)}</p>
                  {certificate.credentialUrl ? (
                    <a
                      href={certificate.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-4 text-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-blue-400"
                    >
                      {t("certificates.viewCredential", "Lihat Bukti")}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs text-muted">
                      <ImageIcon className="size-3.5" aria-hidden="true" />
                      {t("certificates.evidencePending")}
                    </span>
                  )}
                </article>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}
    </section>
  );
}
