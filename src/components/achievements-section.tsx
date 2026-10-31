"use client";

import { useTranslation } from "react-i18next";
import { ArrowUpRight, Award, UsersRound } from "lucide-react";
import { recognitions, type RecognitionEntry } from "@/lib/journey-data";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

const safeEvidence = (url?: string) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, "https://zakariamp.vercel.app");
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
};

function RecognitionCard({ entry, language }: { entry: RecognitionEntry; language: string }) {
  const { t } = useTranslation();
  const isEnglish = language.startsWith("en");
  const evidenceUrl = safeEvidence(entry.evidenceUrl);
  const isAward = entry.kind === "award" || entry.kind === "competition";
  const Icon = isAward ? Award : UsersRound;

  return (
    <li className="min-w-0">
      <article className="flex h-full flex-col rounded-2xl border border-line/80 bg-white p-5 shadow-2xs transition-colors hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-blue-500/10 dark:text-blue-400">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand dark:text-blue-400">
              {isAward ? t("achievements.award") : t("achievements.ambassador")}
            </span>
            <h3 className="mt-1 font-display text-base font-bold leading-snug text-ink sm:text-lg">
              {entry.title}
            </h3>
            <p className="mt-1 text-sm text-body">{entry.organizer}</p>
          </div>
        </div>
        {entry.period && <p className="mt-4 text-xs font-medium text-muted">{entry.period}</p>}
        {entry.description && (
          <p className="mt-4 text-sm leading-relaxed text-body">
            {isEnglish ? entry.description.en : entry.description.id}
          </p>
        )}
        {evidenceUrl && (
          <a
            className="mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-blue-400"
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("achievements.evidence")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        )}
      </article>
    </li>
  );
}

export function AchievementsSection() {
  const { t, i18n } = useTranslation();
  if (recognitions.length === 0) return null;

  return (
    <section
      id="achievements"
      aria-label={t("achievements.title")}
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="prestasi" className="absolute -top-20" aria-hidden="true" />
      <ScrollReveal y={18}>
        <SectionTitle title={t("achievements.title")} desc={t("achievements.description")} />
      </ScrollReveal>
      <ul className="grid gap-4 sm:grid-cols-2">
        {recognitions.map((entry) => (
          <RecognitionCard key={entry.id} entry={entry} language={i18n.resolvedLanguage || i18n.language || "id"} />
        ))}
      </ul>
    </section>
  );
}
