"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Eye, FileText, X, Award } from "lucide-react";
import { ScrollReveal } from "@/components/parallax";
import { SectionTitle } from "@/components/section-title";
import { useSiteConfig, type CertificateItem } from "@/lib/site-store";
import {
  getPublishedCertificates,
  getPublishedSectionMeta,
} from "@/lib/content/selectors";

export function CertificatesSection() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";
  const [filter, setFilter] = useState<string>("all");
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

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

  return (
    <section
      id="certificates"
      className="relative z-[2] mx-auto w-full max-w-5xl scroll-mt-24 px-5 py-14 sm:py-20"
    >
      <div id="sertifikasi" className="absolute top-0 -mt-24" aria-hidden="true" />
      <ScrollReveal y={24}>
        <SectionTitle
          title={secMeta.title || t("certificates.title")}
          desc={secMeta.desc || t("certificates.desc")}
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
            onClick={() => setFilter("all")}
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
              onClick={() => setFilter(catKey)}
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

      {/* Grid of Credentials */}
      <ScrollReveal y={16}>
        {filtered.length === 0 ? (
          <div
            role="tabpanel"
            className="rounded-xl border border-line/60 bg-white/60 p-12 text-center text-xs text-body dark:border-line/40 dark:bg-[#111422]/60"
          >
            {t("certificates.empty", "Belum ada kredensial yang ditampilkan.")}
          </div>
        ) : (
          <div role="tabpanel" className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((cert) => {
              const proofLink = cert.credentialUrl || (cert.allowDownload !== false ? cert.credentialPdf : undefined);
              const canPreviewInline = Boolean(cert.image || (cert.credentialPdf && cert.allowDownload !== false));

              return (
                <div
                  key={cert.id || cert.title}
                  className={`group relative flex flex-col justify-between rounded-xl border bg-white p-5 transition-colors duration-200 hover:border-brand/40 dark:bg-[#111422] ${
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
                      {cert.featured && (
                        <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/15 dark:text-blue-400">
                          {isEn ? "Featured" : "Unggulan"}
                        </span>
                      )}
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

                  {(proofLink || canPreviewInline) && (
                    <div className="mt-4 pt-2.5 border-t border-line/40 flex flex-wrap items-center justify-between gap-2">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

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
              <div className="min-w-0 pr-4">
                <h4 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                  {previewCert.title}
                </h4>
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
              ) : previewCert.credentialPdf ? (
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
                    <span>{isEn ? "Verify Credential" : "Verifikasi Resmi"}</span>
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
