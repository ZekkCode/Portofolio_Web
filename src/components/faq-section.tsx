"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, defaultFaq } from "@/lib/site-store";

export function FaqSection() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "id";
  const isEn = currentLang === "en";

  const { faq: cfgFaq } = useSiteConfig();
  const rawList = cfgFaq && cfgFaq.length > 0 ? cfgFaq : defaultFaq;
  const items = rawList
    .filter((f) => f.visible !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20">
      <div id="tanya-jawab" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle title={t("faq.title")} desc={t("faq.desc")} />
      </ScrollReveal>

      <Parallax speed={0.07}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-line/80 bg-white shadow-2xs dark:border-line/60 dark:bg-[#111422] divide-y divide-line/60 dark:divide-line/40">
          {items.map((item, idx) => {
            const isOpen = openId === item.id;
            const question = isEn ? item.questionEn || item.questionId : item.questionId;
            const answer = isEn ? item.answerEn || item.answerId : item.answerId;

            return (
              <div key={item.id || idx}>
                <button
                  id={`faq-question-${item.id}`}
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#161a2b]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span className="text-sm font-bold text-ink sm:text-base">
                    {question}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`size-5 shrink-0 text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-body sm:px-6 sm:pb-6">
                      {answer}
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

export default FaqSection;
