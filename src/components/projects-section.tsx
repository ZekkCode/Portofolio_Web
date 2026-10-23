"use client";

import { useTranslation } from "react-i18next";
import { Parallax } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";

export function ProjectsSection() {
  const { t } = useTranslation();
  const { projects } = useSiteConfig();

  return (
    <section id="proyek" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        title={t("projects.title")}
        desc={t("projects.desc")}
      />

      <Parallax speed={0.04}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => (
            <a
              key={project.id}
              href={project.repo || "#proyek"}
              target={project.repo ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-line/80 bg-white/95 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10 backdrop-blur-md dark:border-line/60 dark:bg-[#111422]/90"
              style={{
                transitionDelay: `${(idx % 3) * 35}ms`,
              }}
            >
              <h3 className="font-semibold text-ink">{project.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                {project.desc}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand/8 px-3 py-1 text-xs font-medium text-brand dark:bg-brand/15 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink">
                {t("projects.viewRepo")}
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  →
                </span>
              </span>
            </a>
          ))}
        </div>
      </Parallax>
    </section>
  );
}


