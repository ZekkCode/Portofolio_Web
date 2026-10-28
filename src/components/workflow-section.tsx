"use client";

import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

const steps = [
  { num: "01", titleKey: "workflow.step1Title", descKey: "workflow.step1Desc" },
  { num: "02", titleKey: "workflow.step2Title", descKey: "workflow.step2Desc" },
  { num: "03", titleKey: "workflow.step3Title", descKey: "workflow.step3Desc" },
  { num: "04", titleKey: "workflow.step4Title", descKey: "workflow.step4Desc" },
] as const;

export function WorkflowSection() {
  const { t } = useTranslation();

  return (
    <section id="workflow" className="relative mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="alur-kerja" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle title={t("workflow.title")} desc={t("workflow.desc")} />
      </ScrollReveal>

      <Parallax speed={0.08}>
        <div className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Horizontal connector line — desktop only */}
          <div className="pointer-events-none absolute top-10 left-[calc(12.5%+20px)] hidden h-px w-[calc(75%-40px)] bg-line/60 lg:block" />

          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-start gap-4">
              {/* Vertical connector line — mobile/tablet only */}
              {i < steps.length - 1 && (
                <div className="absolute top-14 left-5 h-[calc(100%+24px-56px)] w-px bg-line/60 lg:hidden" />
              )}

              <div className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-black text-white">
                {step.num}
              </div>

              <div className="w-full rounded-2xl border border-line/80 bg-white p-5 shadow-2xs sm:p-6 dark:border-line/60 dark:bg-[#111422]">
                <h3 className="font-display text-base font-semibold text-ink">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Parallax>
    </section>
  );
}
