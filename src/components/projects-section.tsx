"use client";

import { Parallax } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";

export function ProjectsSection() {
  const { projects } = useSiteConfig();

  return (
    <section id="proyek" className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28">
      <SectionTitle
        eyebrow="Portofolio"
        title="Proyek yang sudah dikerjakan"
        desc="Dari sistem informasi, algoritma information retrieval, bot Telegram, sampai aplikasi booking hotel."
      />

      <Parallax speed={0.04}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, idx) => (
            <a
              key={project.id}
              href={project.repo || "#proyek"}
              target={project.repo ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-line bg-white/85 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10 backdrop-blur-xs"
              style={{
                transitionDelay: `${(idx % 3) * 35}ms`,
              }}
            >
              <h3 className="font-semibold text-ink">{project.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{project.desc}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-brand uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink">
                Lihat repo
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

