"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Eye, FileText, X, Award, ShieldCheck, Clock, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type CertificateItem } from "@/lib/site-store";
import {
  getPublishedCertificates,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";
import {
  hasCertificateEvidence,
  resolveCertificateVerificationStatus,
  resolveCertificatesSectionDesc,
  type CertificateVerificationStatus,
} from "@/lib/content/certificate-verification";

export function CertificatesSection() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";
  const [filter, setFilter] = useState<string>("all");
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);
  const [currentCertIndex, setCurrentCertIndex] = useState(0);

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
      if (c.category) cats.add(c.category);
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

  useEffect(() => {
    if (filtered.length > 0 && currentCertIndex >= filtered.length) {
      setCurrentCertIndex(0);
    }
  }, [filtered.length, currentCertIndex]);

  const handlePrevCert = () => {
    if (filtered.length <= 1) return;
    setCurrentCertIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  const handleNextCert = () => {
    if (filtered.length <= 1) return;
    setCurrentCertIndex((prev) => (prev + 1) % filtered.length);
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

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "design":
        return t("certificates.filterDesign", "Desain & UX");
      case "frontend":
        return t("certificates.filterFrontend", "Frontend & Web");
      case "systems":
        return t("certificates.filterSystems", "Sistem & Jaringan");
      default:
        return cat;
    }
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

  const renderVerificationBadge = (status: CertificateVerificationStatus) => {
    if (status === "verified") {
      return (
        <span
          data-verification-badge="verified"
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          <ShieldCheck className="size-3 shrink-0" />
          <span>{t("certificates.verifiedBadge", "Terverifikasi")}</span>
        </span>
      );
    }
    if (status === "needs_reverification") {
      return (
        <span
          data-verification-badge="needs_reverification"
          className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
        >
          <RotateCcw className="size-3 shrink-0" />
          <span>{t("certificates.needsRecheckBadge", "Perlu Periksa Ulang")}</span>
        </span>
      );
    }
    return (
      <span
        data-verification-badge="unverified"
        className="inline-flex items-center gap-1 rounded-md border border-line/70 bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-line/40 dark:bg-slate-800/70 dark:text-slate-300"
      >
        <Clock className="size-3 shrink-0" />
        <span>{t("certificates.uncheckedBadge", "Belum Diperiksa")}</span>
      </span>
    );
  };

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
            {t("certificates.filterAll")}
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
              {getCategoryLabel(catKey)}
            </button>
          ))}
        </div>
      )}

      {/* Helper Card Render */}
      {(() => {
        const renderCertCard = (cert: CertificateItem, isMobile: boolean) => {
          const proofLink =
            cert.credentialUrl ||
            (cert.allowDownload !== false ? cert.credentialPdf : undefined);
          const canPreviewInline = Boolean(
            cert.image || (cert.credentialPdf && cert.allowDownload !== false)
          );
          const evidenceAttached = hasCertificateEvidence(cert);
          const resolvedStatus = resolveCertificateVerificationStatus(cert);

          return (
            <div
              key={cert.id || cert.title}
              data-cert-id={cert.id}
              data-verification-status={resolvedStatus}
              className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 sm:p-5 transition-colors duration-200 hover:border-brand/40 dark:bg-[#111422] ${
                isMobile ? "min-h-[220px]" : ""
              } ${
                cert.featured
                  ? "border-brand/40 dark:border-blue-500/40"
                  : "border-line/80 dark:border-line/60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  {cert.issuerLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cert.issuerLogo}
                      alt={cert.issuer}
                      className="size-7 rounded border border-line/60 object-contain bg-white p-0.5 dark:bg-slate-900"
                      loading="lazy"
                    />
                  ) : (
                    <Award className="size-5 text-brand/60 shrink-0 dark:text-blue-400/70" />
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {cert.featured && (
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/15 dark:text-blue-400">
                        {isEn ? "Featured" : "Unggulan"}
                      </span>
                    )}
                    {renderVerificationBadge(resolvedStatus)}
                  </div>
                </div>

                <h3 className="font-display text-sm font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
                  {cert.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-muted">
                  <span className="font-medium line-clamp-1">{cert.issuer}</span>
                  <span className="font-mono text-[11px] shrink-0">{cert.date}</span>
                </div>

                {cert.credentialId && (
                  <p className="mt-1 font-mono text-[10px] text-muted truncate">
                    ID: {cert.credentialId}
                  </p>
                )}

                <div className="mt-1.5">
                  <span className="inline-block text-[11px] font-medium text-muted">
                    {getCategoryLabel(cert.category)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-line/40 flex flex-wrap items-center justify-between gap-2">
                {proofLink || canPreviewInline ? (
                  <>
                    {canPreviewInline && (
                      <button
                        type="button"
                        onClick={() => setPreviewCert(cert)}
                        className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-ink hover:text-brand dark:text-slate-200 dark:hover:text-blue-400"
                      >
                        <Eye className="size-3.5" />
                        <span>{isEn ? "Preview" : "Pratinjau"}</span>
                      </button>
                    )}
                    {proofLink && (
                      <a
                        href={proofLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-brand transition-colors duration-150 hover:text-brand-ink hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <span>{t("certificates.viewCredential", "Lihat Bukti")}</span>
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-muted">
                    {evidenceAttached
                      ? t("certificates.restrictedProofNote", "Lampiran dibatasi")
                      : t("certificates.noEvidenceNote", "Bukti belum dilampirkan")}
                  </span>
                )}
              </div>
            </div>
          );
        };

        return (
          <ScrollReveal y={16}>
            {filtered.length === 0 ? (
              <div
                role="tabpanel"
                className="rounded-xl border border-line/60 bg-white/60 p-12 text-center text-xs text-body dark:border-line/40 dark:bg-[#111422]/60"
              >
                {t("certificates.empty", "Belum ada kredensial yang ditampilkan.")}
              </div>
            ) : (
              <>
                {/* MOBILE ONLY: Circular Carousel dengan Swipe & Navigasi Melingkar Tanpa Batas */}
                <div
                  className="sm:hidden space-y-3"
                  onTouchStart={handleCertTouchStart}
                  onTouchEnd={handleCertTouchEnd}
                >
                  <div role="tabpanel">
                    {renderCertCard(filtered[currentCertIndex] || filtered[0], true)}
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
                        {currentCertIndex + 1} / {filtered.length}
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

                {/* DESKTOP ONLY: Grid Kredensial Asli */}
                <div role="tabpanel" className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {filtered.map((cert) => renderCertCard(cert, false))}
                </div>
              </>
            )}
          </ScrollReveal>
        );
      })()}

      {/* Lightbox Preview Modal */}
      {previewCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewCert.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewCert(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl dark:bg-[#111422]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="min-w-0 pr-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                    {previewCert.title}
                  </h4>
                  {renderVerificationBadge(resolveCertificateVerificationStatus(previewCert))}
                </div>
                <p className="text-xs text-muted truncate">
                  {previewCert.issuer} · {previewCert.date}
                  {previewCert.expiryDate ? ` (${isEn ? "Exp" : "Berlaku s.d."} ${previewCert.expiryDate})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                aria-label={isEn ? "Close" : "Tutup"}
                className="flex size-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 p-4 dark:bg-[#0b0e18]">
              {previewCert.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewCert.image}
                  alt={previewCert.title}
                  className="mx-auto max-h-[65vh] w-auto rounded-lg object-contain border border-line/60"
                />
              ) : previewCert.credentialPdf && previewCert.allowDownload !== false ? (
                <iframe
                  src={previewCert.credentialPdf}
                  title={previewCert.title}
                  className="h-[65vh] w-full rounded-lg border border-line/60 bg-white"
                />
              ) : null}
              {previewCert.desc && (
                <p className="mt-3 text-xs leading-relaxed text-body">{previewCert.desc}</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs">
              <span className="font-mono text-muted">
                {previewCert.credentialId ? `ID: ${previewCert.credentialId}` : ""}
              </span>
              <div className="flex items-center gap-3">
                {previewCert.credentialPdf && previewCert.allowDownload !== false && (
                  <a
                    href={previewCert.credentialPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand dark:text-slate-200"
                  >
                    <FileText className="size-3.5" />
                    <span>PDF</span>
                  </a>
                )}
                {previewCert.credentialUrl && (
                  <a
                    href={previewCert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:underline dark:text-blue-400"
                  >
                    <span>{t("certificates.openLink", "Buka Tautan Bukti")}</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
