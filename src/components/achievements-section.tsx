"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Award, Trophy, Star, Medal, ExternalLink, Calendar, FileText } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type AchievementItem } from "@/lib/site-store";
import {
  getPublishedAchievements,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";

export function AchievementsSection() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";
  const locale = isEn ? "en" : "id";

  const config = useSiteConfig();
  const secMeta = getPublishedSectionMeta(config, "achievements", locale);

  const publishedAchievements = useMemo(
    () => getPublishedAchievements(config, locale),
    [config, locale]
  );

  if (publishedAchievements.length === 0) {
    return null;
  }

  const getCategoryBadge = (category: AchievementItem["category"]) => {
    switch (category) {
      case "award":
        return {
          label: isEn ? "Award" : "Penghargaan",
          icon: Trophy,
          classes: "text-muted",
        };
      case "competition":
        return {
          label: isEn ? "Competition" : "Kompetisi",
          icon: Medal,
          classes: "text-muted",
        };
      case "leadership":
        return {
          label: isEn ? "Leadership" : "Kepemimpinan",
          icon: Star,
          classes: "text-muted",
        };
      case "program":
        return {
          label: isEn ? "Selected Program" : "Program Terpilih",
          icon: Award,
          classes: "text-muted",
        };
      default:
        return {
          label: isEn ? "Recognition" : "Rekognisi",
          icon: Award,
          classes: "text-muted",
        };
    }
  };

  return (
    <section
      id="achievements"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="prestasi" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="rekognisi" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <SectionTitle
          title={
            secMeta.title ||
            (isEn ? "Achievements & Recognition" : "Prestasi & Rekognisi")
          }
          desc={
            secMeta.desc ||
            (isEn
              ? "Verified program milestones, leadership recognition, and competition achievements."
              : "Rekam jejak program resmi terpilih, kepemimpinan organisasi, dan pencapaian terverifikasi.")
          }
        />
      </ScrollReveal>

      <ScrollReveal y={20}>
        <div className="grid gap-4 sm:grid-cols-2 auto-rows-fr items-stretch">
          {publishedAchievements.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;

            return (
              <div
                key={item.id}
                className={`group relative flex h-full flex-col justify-between rounded-2xl border bg-white p-5 sm:p-6 transition-colors duration-200 hover:border-brand/40 dark:bg-[#111422] ${
                  item.featured
                    ? "border-brand/40 dark:border-blue-500/40"
                    : "border-line/80 dark:border-line/60"
                }`}
              >
                <div>
                  <div className="flex items-start gap-3">
                    {item.organizerLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.organizerLogo}
                        alt={item.organizer || item.title}
                        className="size-9 shrink-0 rounded-lg border border-line/60 object-contain bg-white p-1 dark:bg-slate-900"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-brand transition-colors">
                          {item.title}
                        </h3>
                        {item.date && (
                          <span className="mt-0.5 flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium text-muted">
                            <Calendar className="size-3" />
                            <span>{item.date}</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        {item.organizer && (
                          <span className="font-semibold text-brand dark:text-blue-400">
                            {item.organizer}
                          </span>
                        )}
                        {item.organizer && (
                          <span className="text-muted/50" aria-hidden="true">
                            ·
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 font-medium ${badge.classes}`}>
                          <Icon className="size-3.5 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                        {item.featured && (
                          <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/15 dark:text-blue-400">
                            {isEn ? "Featured" : "Unggulan"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.image && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-line/60 aspect-[16/9] bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {item.desc && (
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-body">
                      {item.desc}
                    </p>
                  )}
                </div>

                {(item.evidenceUrl || item.evidencePdf) && (
                  <div className="mt-4 pt-3 border-t border-line/50 dark:border-line/30 flex flex-wrap items-center justify-end gap-4">
                    {item.evidencePdf && (
                      <a
                        href={item.evidencePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:text-brand hover:underline dark:text-slate-200 dark:hover:text-blue-400"
                      >
                        <FileText className="size-3.5" />
                        <span>{isEn ? "Document PDF" : "Dokumen PDF"}</span>
                      </a>
                    )}
                    {item.evidenceUrl && (
                      <a
                        href={item.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
                      >
                        <span>{isEn ? "View Evidence" : "Lihat Bukti"}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}

export default AchievementsSection;
