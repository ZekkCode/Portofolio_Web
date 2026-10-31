"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { profile } from "@/lib/profile";
import {
  GraduationCap,
  School,
  MapPin,
  Calendar,
  BookOpen,
  FolderGit2,
  ArrowUpRight,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function AcademicJourneySection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
        default: "(prefers-reduced-motion: no-preference)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set(line, { scaleY: 1 });
          return;
        }

        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top 75%",
              end: "bottom 65%",
              scrub: 0.3,
            },
          }
        );
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="akademik"
      className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
      aria-label="Academic Journey"
    >
      {/* Anchor aliases for friendly URL navigation */}
      <div id="academic" className="absolute top-0 -mt-24" aria-hidden="true" />
      <div id="pendidikan" className="absolute top-0 -mt-24" aria-hidden="true" />

      <ScrollReveal y={24}>
        <SectionTitle
          title={t("academic.title", "Jejak Akademik")}
          desc={t(
            "academic.desc",
            "Latar belakang pendidikan formal dan bidang keilmuan yang menjadi fondasi rekayasa digital."
          )}
        />
      </ScrollReveal>

      <div ref={containerRef} className="relative mt-10">
        {/* Background Track Line */}
        <div
          className="absolute start-4 sm:start-6 top-3 bottom-3 w-0.5 rounded-full bg-line/70 dark:bg-line/40"
          aria-hidden="true"
        />
        {/* Scroll-Linked Active Progress Line */}
        <div
          ref={lineRef}
          className="absolute start-4 sm:start-6 top-3 bottom-3 w-0.5 origin-top rounded-full bg-brand will-change-transform dark:bg-blue-500"
          aria-hidden="true"
        />

        <div className="space-y-8 sm:space-y-10">
          {profile.education.map((edu, idx) => {
            const isUniversity = edu.id === "utm";
            const focusList = currentLang === "en" ? edu.focusEn : edu.focus;
            const statusLabel = currentLang === "en" ? edu.statusEn : edu.status;

            return (
              <div
                key={edu.id}
                className="group relative ps-11 sm:ps-16"
              >
                {/* Milestone Node on Track */}
                <div
                  className={`absolute start-1.5 sm:start-3.5 top-1.5 flex size-6 items-center justify-center rounded-full border-2 border-white shadow-xs transition-transform duration-200 group-hover:scale-110 dark:border-[#08090e] ${
                    edu.current
                      ? "bg-brand text-white dark:bg-blue-500"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                  aria-hidden="true"
                >
                  {isUniversity ? (
                    <GraduationCap className="size-3.5" />
                  ) : (
                    <School className="size-3.5" />
                  )}
                </div>

                {/* Card Container */}
                <div className="overflow-hidden rounded-2xl border border-line/80 bg-white p-5 sm:p-7 shadow-2xs transition-all duration-300 hover:border-brand/50 hover:shadow-md dark:border-line/60 dark:bg-[#111422]">
                  {/* Card Header: Institution & Period */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line/60 pb-4 dark:border-line/40">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand dark:text-blue-400">
                          #0{idx + 1}
                        </span>
                        <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink">
                          {edu.institution}
                        </h3>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <MapPin className="size-3 text-muted/80" />
                        <span>{edu.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                          edu.current
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
                        <Calendar className="size-3 text-muted/80" />
                        <span>{edu.period}</span>
                      </span>
                    </div>
                  </div>

                  {/* Degree & Major */}
                  <div className="mt-4">
                    <p className="font-display text-base font-semibold text-ink">
                      {edu.program}
                    </p>
                    <p className="text-xs text-muted">
                      {edu.degree}
                    </p>
                  </div>

                  {/* Focus & Competencies Chips */}
                  <div className="mt-5">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink mb-2.5">
                      <BookOpen className="size-3.5 text-brand dark:text-blue-400" />
                      <span>{t("academic.focusTitle", "Fokus Studi & Kompetensi:")}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {focusList.map((focusItem) => (
                        <span
                          key={focusItem}
                          className="rounded-lg border border-line/60 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-line/40 dark:bg-[#181d30]/70 dark:text-slate-300"
                        >
                          {focusItem}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verified Academic Projects */}
                  {edu.projects && edu.projects.length > 0 && (
                    <div className="mt-5 border-t border-line/50 pt-4 dark:border-line/30">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink mb-2.5">
                        <FolderGit2 className="size-3.5 text-brand dark:text-blue-400" />
                        <span>{t("academic.projectsTitle", "Proyek Akademik Relevan:")}</span>
                      </h4>
                      <div className="space-y-2">
                        {edu.projects.map((proj) => (
                          <div
                            key={proj.title}
                            className="rounded-xl border border-line/60 bg-slate-50/50 p-3 text-xs dark:border-line/30 dark:bg-[#181d30]/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-ink">
                                {proj.title}
                              </span>
                              {"repo" in proj && proj.repo && (
                                <a
                                  href={proj.repo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline dark:text-blue-400"
                                >
                                  <span>{t("academic.viewProject", "Lihat Repositori")}</span>
                                  <ArrowUpRight className="size-3" />
                                </a>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-body">
                              {proj.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
