"use client";

import { useTranslation } from "react-i18next";
import { BookOpenText, CalendarDays, GraduationCap } from "lucide-react";
import { academicHistory, type LocalizedText } from "@/lib/journey-data";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

function localize(value: LocalizedText, language: string): string {
  return language.startsWith("en") ? value.en : value.id;
}

export function AcademicJourneySection() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "id";

  return (
    <section
      id="academics"
      aria-labelledby="academic-heading"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="akademik" className="absolute -top-20" aria-hidden="true" />
      <ScrollReveal y={18}>
        <div id="academic-heading">
          <SectionTitle
            title={t("academic.title")}
            desc={t("academic.description")}
          />
        </div>
      </ScrollReveal>
      <ol className="relative ms-4 border-s-2 border-line/80 ps-7 dark:border-line/70">
        {academicHistory.map((entry) => (
          <li key={entry.id} className="relative pb-2">
            <span className="absolute -start-[43px] top-6 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-sm dark:border-[#08090e]">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <ScrollReveal y={16}>
              <article className="rounded-2xl border border-line/80 bg-white p-5 shadow-2xs dark:border-line/60 dark:bg-[#111422] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                      {entry.institution}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-brand dark:text-blue-400">
                      {localize(entry.program, language)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-surface px-3 py-1.5 text-xs font-medium text-body dark:border-line/60">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    <time dateTime={entry.startYear}>{entry.startYear}</time>
                    <span aria-hidden="true">–</span>
                    {entry.endYear ? <time dateTime={entry.endYear}>{entry.endYear}</time> : <span>{t("academic.present")}</span>}
                  </span>
                </div>
                <div className="mt-5 flex items-start gap-2.5 border-t border-line/60 pt-4 dark:border-line/40">
                  <BookOpenText className="mt-0.5 size-4 shrink-0 text-brand dark:text-blue-400" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-body">
                    <span className="font-semibold text-ink">{t("academic.focus")}: </span>
                    {localize(entry.focus, language)}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
