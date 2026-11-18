"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type CertificateItem } from "@/lib/site-store";
import {
  getPublishedCertificates,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";
import { resolveCertificatesSectionDesc } from "@/lib/content/certificate-verification";
import {
  CertificateCard,
  CertificatePreviewModal,
  formatCertificateCategory,
} from "@/components/certificate-card";

export function CertificatesSection() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";
  const [filter, setFilter] = useState<string>("all");
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);
  const [currentCertIndex, setCurrentCertIndex] = useState(0);
  const DESKTOP_INITIAL_COUNT = 8;

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const config = useSiteConfig();
  const secMeta = getPublishedSectionMeta(config, "certificates", locale);
  const publishedCertificates = useMemo(
    () => getPublishedCertificates(config, "all", locale),
    [config, locale]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    publishedCertificates.forEach((c) => {
      if (c.category && c.category !== "all") cats.add(c.category);
    });
    const base = ["design", "frontend", "systems"].filter((k) => cats.has(k));
    cats.forEach((k) => {
      if (!base.includes(k)) base.push(k);
    });
    return base;
  }, [publishedCertificates]);

  const filtered =
    filter === "all"
      ? publishedCertificates
      : publishedCertificates.filter((c) => c.category === filter);

  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setCurrentCertIndex(0);
  };

  const safeCertIndex =
    filtered.length > 0 && currentCertIndex < filtered.length ? currentCertIndex : 0;

  const handlePrevCert = () => {
    if (filtered.length <= 1) return;
    const nextIdx = (safeCertIndex - 1 + filtered.length) % filtered.length;
    setCurrentCertIndex(nextIdx);
    if (previewCert) setPreviewCert(filtered[nextIdx]);
  };

  const handleNextCert = () => {
    if (filtered.length <= 1) return;
    const nextIdx = (safeCertIndex + 1) % filtered.length;
    setCurrentCertIndex(nextIdx);
    if (previewCert) setPreviewCert(filtered[nextIdx]);
  };

  const handleCertTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleCertTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextCert();
      } else {
        handlePrevCert();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const resolvedSectionDesc = useMemo(
    () =>
      resolveCertificatesSectionDesc(
        secMeta.desc,
        publishedCertificates,
        t("certificates.desc")
      ),
    [secMeta.desc, publishedCertificates, t]
  );

  return (
    <section
      id="certificates"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="sertifikasi" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={secMeta.title || t("certificates.title")}
          desc={resolvedSectionDesc}
        />
      </ScrollReveal>

      {/* Filter Tabs */}
      {publishedCertificates.length > 0 && (
        <div
          role="tablist"
          aria-label={secMeta.title || t("certificates.title", "Sertifikasi")}
          className="mb-8 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            onClick={() => handleFilterChange("all")}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none ${
              filter === "all"
                ? "bg-brand text-white border border-brand/30"
                : "border border-line/80 bg-transparent text-body hover:bg-brand/5 hover:border-brand/40 hover:text-brand dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
            }`}
          >
            {t("certificates.filterAll", isEn ? "All" : "Semua")}
          </button>
          {availableCategories.map((catKey) => (
            <button
              key={catKey}
              type="button"
              role="tab"
              aria-selected={filter === catKey}
              onClick={() => handleFilterChange(catKey)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none ${
                filter === catKey
                  ? "bg-brand text-white border border-brand/30"
                  : "border border-line/80 bg-transparent text-body hover:bg-brand/5 hover:border-brand/40 hover:text-brand dark:border-line/60 dark:text-slate-300 dark:hover:bg-brand/10 dark:hover:border-brand/50 dark:hover:text-blue-400"
              }`}
            >
              {formatCertificateCategory(catKey, isEn)}
            </button>
          ))}
        </div>
      )}

      <ScrollReveal y={16}>
        {filtered.length === 0 ? (
          <div
            role="tabpanel"
            className="rounded-xl border border-line/60 bg-white/60 p-12 text-center text-xs text-body dark:border-line/40 dark:bg-[#111422]/60"
          >
            {t("certificates.empty", isEn ? "No credentials displayed." : "Belum ada kredensial yang ditampilkan.")}
          </div>
        ) : (
          <>
            {/* MOBILE ONLY: Circular Carousel */}
            <div
              className="sm:hidden space-y-3"
              onTouchStart={handleCertTouchStart}
              onTouchEnd={handleCertTouchEnd}
            >
              <div role="tabpanel">
                <CertificateCard
                  cert={filtered[safeCertIndex] || filtered[0]}
                  onPreview={setPreviewCert}
                  isEn={isEn}
                />
              </div>

              {filtered.length > 1 ? (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handlePrevCert}
                    aria-label={isEn ? "Previous credential (circular)" : "Sertifikat sebelumnya (melingkar)"}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] dark:text-white"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <span data-carousel-indicator className="font-mono text-xs font-semibold text-muted">
                    {safeCertIndex + 1} / {filtered.length}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextCert}
                    aria-label={isEn ? "Next credential (circular)" : "Sertifikat berikutnya (melingkar)"}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] dark:text-white"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-center pt-1">
                  <span className="font-mono text-xs font-semibold text-muted">
                    1 / 1
                  </span>
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: Grid Kredensial Pilihan (8 Teratas) */}
            <div className="hidden sm:block">
              <div role="tabpanel" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {filtered.slice(0, DESKTOP_INITIAL_COUNT).map((cert) => (
                  <CertificateCard
                    key={cert.id || cert.title}
                    cert={cert}
                    onPreview={setPreviewCert}
                    isEn={isEn}
                  />
                ))}
              </div>
            </div>

            {/* Tombol Navigasi ke Halaman Kredensial Lengkap (Mencegah scroll kepanjangan di halaman utama) */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/certificates"
                className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-brand/30 bg-brand/5 px-6 py-2.5 text-xs sm:text-sm font-semibold text-brand shadow-2xs transition-all duration-150 hover:bg-brand hover:text-white hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
              >
                <span>
                  {isEn
                    ? `View All Credentials (${publishedCertificates.length})`
                    : `Lihat Semua Kredensial (${publishedCertificates.length})`}
                </span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        )}
      </ScrollReveal>

      {/* Lightbox Preview Modal */}
      <CertificatePreviewModal
        cert={previewCert}
        onClose={() => setPreviewCert(null)}
        onPrev={handlePrevCert}
        onNext={handleNextCert}
        currentIndex={previewCert ? filtered.findIndex((c) => c.id === previewCert.id) : 0}
        total={filtered.length}
        isEn={isEn}
      />
    </section>
  );
}
