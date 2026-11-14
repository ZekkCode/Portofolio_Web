"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Award, Trophy, Star, Medal, ExternalLink, Calendar } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type AchievementItem } from "@/lib/site-store";

export function AchievementsSection() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";

  const { achievements } = useSiteConfig();

  const publishedAchievements = useMemo(() => {
    const list = achievements ? [...achievements] : [];
    return list
      .filter((a) => a.published !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [achievements]);

  if (publishedAchievements.length === 0) {
    return null; // Gracefully hidden if no achievements published
  }

  const getCategoryBadge = (category: AchievementItem["category"]) => {
    switch (category) {
      case "award":
        return {
          label: isEn ? "Award" : "Penghargaan",
          icon: Trophy,
          classes: "text-amber-600 dark:text-amber-300",
        };
      case "competition":
        return {
          label: isEn ? "Competition" : "Kompetisi",
          icon: Medal,
          classes: "text-blue-600 dark:text-blue-300",
        };
      case "leadership":
        return {
          label: isEn ? "Leadership" : "Kepemimpinan",
          icon: Star,
          classes: "text-purple-600 dark:text-purple-300",
        };
      case "program":
        return {
          label: isEn ? "Selected Program" : "Program Terpilih",
          icon: Award,
          classes: "text-emerald-600 dark:text-emerald-300",
        };
      default:
        return {
          label: isEn ? "Recognition" : "Rekognisi",
          icon: Award,
          classes: "text-brand dark:text-blue-400",
        };
    }
  };

  return (
    <section id="achievements" className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="prestasi" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="rekognisi" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <SectionTitle
          title={isEn ? "Achievements & Recognition" : "Prestasi & Rekognisi"}
          desc={
            isEn
              ? "Verified program milestones, leadership recognition, and competition achievements."
              : "Rekam jejak program resmi terpilih, kepemimpinan organisasi, dan pencapaian terverifikasi."
          }
        />
      </ScrollReveal>

      <ScrollReveal y={20}>
        <div className="grid gap-4 sm:grid-cols-2 auto-rows-fr items-stretch">
          {publishedAchievements.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;
            const title = isEn && item.titleEn ? item.titleEn : item.title;
            const desc = isEn && item.descEn ? item.descEn : item.desc;

            return (
              <div
                key={item.id}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]"
              >
                <div>
                  {/* Header: Category + Date */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${badge.classes}`}
                    >
                      <Icon className="size-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    {item.date && (
                      <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-muted">
                        <Calendar className="size-3" />
                        <span>{item.date}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Organizer */}
                  <div className="mt-3.5">
                    <h3 className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-brand transition-colors">
                      {title}
                    </h3>
                    {item.organizer && (
                      <p className="mt-1 text-xs font-semibold text-brand dark:text-blue-400">
                        {item.organizer}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {desc && (
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-body">
                      {desc}
                    </p>
                  )}
                </div>

                {/* Evidence Link Footer */}
                {item.evidenceUrl && (
                  <div className="mt-4 pt-3 border-t border-line/50 dark:border-line/30 flex items-center justify-end">
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
                    >
                      <span>{isEn ? "View Evidence" : "Lihat Bukti"}</span>
                      <ExternalLink className="size-3" />
                    </a>
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
