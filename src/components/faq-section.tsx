"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";

const keys = [1, 2, 3, 4, 5] as const;

export function FaqSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <ScrollReveal y={24}>
        <SectionTitle title={t("faq.title")} desc={t("faq.desc")} />
      </ScrollReveal>

      <Parallax speed={0.06}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-line/80 bg-white shadow-2xs dark:border-line/60 dark:bg-[#111422] divide-y divide-line/60 dark:divide-line/40">
          {keys.map((i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                >
                  <span className="text-sm font-bold text-ink sm:text-base">
                    {t(`faq.q${i}`)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`size-5 shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-body sm:px-6 sm:pb-6">
                      {t(`faq.a${i}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Parallax>
    </section>
  );
}
