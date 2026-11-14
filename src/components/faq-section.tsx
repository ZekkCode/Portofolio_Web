"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Parallax, ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig } from "@/lib/site-store";
import {
  getPublishedFAQ,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";

export function FaqSection() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || "id") === "en" ? "en" : "id";

  const config = useSiteConfig();
  const secMeta = getPublishedSectionMeta(config, "faq", locale);
  const items = getPublishedFAQ(config, locale);

  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id="faq"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="tanya-jawab" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={secMeta.title || t("faq.title")}
          desc={secMeta.desc || t("faq.desc")}
        />
      </ScrollReveal>

      <Parallax speed={0.07}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-line/80 bg-white dark:border-line/60 dark:bg-[#111422] divide-y divide-line/60 dark:divide-line/40">
          {items.map((item, idx) => {
            const isOpen = openId === item.id;

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
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-question-${item.id}`}
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-body sm:px-6 sm:pb-6">
                      {item.answer}
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
