"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Award,
  ShieldCheck,
  RotateCcw,
  Clock,
  Eye,
  FileText,
  X,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CertificateItem } from "@/lib/site-store";
import {
  hasCertificateEvidence,
  resolveCertificateVerificationStatus,
  type CertificateVerificationStatus,
} from "@/lib/content/certificate-verification";
import { useMounted } from "@/lib/use-mounted";

export function CertificateVerificationBadge({
  status,
  isEn = false,
}: {
  status: CertificateVerificationStatus;
  isEn?: boolean;
}) {
  const { t } = useTranslation();

  if (status === "verified") {
    return (
      <span
        data-verification-badge="verified"
        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
      >
        <ShieldCheck className="size-3 shrink-0" />
        <span>{t("certificates.verifiedBadge", isEn ? "Verified" : "Terverifikasi")}</span>
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
        <span>{t("certificates.needsRecheckBadge", isEn ? "Needs Review" : "Perlu Periksa Ulang")}</span>
      </span>
    );
  }

  return (
    <span
      data-verification-badge="unverified"
      className="inline-flex items-center gap-1 rounded-md border border-line/70 bg-slate-100/80 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-line/40 dark:bg-slate-800/70 dark:text-slate-300"
    >
      <Clock className="size-3 shrink-0" />
      <span>{t("certificates.uncheckedBadge", isEn ? "Unchecked" : "Belum Diperiksa")}</span>
    </span>
  );
}

export function formatCertificateCategory(cat: string, isEn = false): string {
  switch (cat) {
    case "design":
      return isEn ? "Design & UX" : "Desain & UX";
    case "frontend":
      return isEn ? "Frontend & Web" : "Frontend & Web";
    case "systems":
      return isEn ? "Systems & Network" : "Sistem & Jaringan";
    case "all":
      return isEn ? "Cross-Disciplinary" : "Lintas Bidang";
    default:
      return cat;
  }
}

interface CertificateCardProps {
  cert: CertificateItem;
  onPreview: (cert: CertificateItem) => void;
  isEn?: boolean;
}

export function CertificateCard({ cert, onPreview, isEn = false }: CertificateCardProps) {
  const { t } = useTranslation();
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
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3.5 sm:p-4 transition-all duration-200 hover:border-brand/40 hover:shadow-md dark:bg-[#111422] ${
        cert.featured
          ? "border-brand/40 shadow-sm dark:border-blue-500/40"
          : "border-line/80 dark:border-line/60"
      }`}
    >
      <div>
        {/* Visual Thumbnail Sertifikat */}
        <div
          className={`group/thumb relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-xl border border-line/60 bg-slate-100 dark:border-line/40 dark:bg-slate-900/60 ${
            canPreviewInline ? "cursor-pointer" : ""
          }`}
          onClick={() => {
            if (canPreviewInline) onPreview(cert);
          }}
        >
          {cert.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.image}
                alt={cert.title}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/thumb:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                  <Eye className="size-3.5" />
                  <span>{isEn ? "Preview" : "Pratinjau"}</span>
                </span>
              </div>
            </>
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center p-3 text-center transition-colors group-hover/thumb:bg-slate-200/50 dark:group-hover/thumb:bg-slate-800/40">
              <div className="absolute inset-1.5 rounded-lg border border-dashed border-line/70 dark:border-line/40 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-blue-500/15 dark:text-blue-400">
                  <Award className="size-4" />
                </div>
                <span className="font-display text-[11px] font-bold text-ink line-clamp-1 max-w-[180px]">
                  {cert.issuer}
                </span>
                <span className="text-[10px] text-muted line-clamp-1">
                  {cert.credentialId ? `ID: ${cert.credentialId}` : (isEn ? "Credential Document" : "Dokumen Kredensial")}
                </span>
              </div>
              {canPreviewInline && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover/thumb:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                    <Eye className="size-3.5" />
                    <span>{isEn ? "Preview" : "Pratinjau"}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {cert.issuerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cert.issuerLogo}
                alt={cert.issuer}
                className="size-5 rounded border border-line/60 object-contain bg-white p-0.5 dark:bg-slate-900 shrink-0"
                loading="lazy"
              />
            ) : (
              <Award className="size-4 text-brand/60 shrink-0 dark:text-blue-400/70" />
            )}
            <span className="font-medium text-xs text-muted line-clamp-1 truncate">{cert.issuer}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
            {cert.featured && (
              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand dark:bg-blue-500/15 dark:text-blue-400">
                {isEn ? "Featured" : "Unggulan"}
              </span>
            )}
            <CertificateVerificationBadge status={resolvedStatus} isEn={isEn} />
          </div>
        </div>

        <h3 className="font-display text-sm font-bold text-ink group-hover:text-brand transition-colors line-clamp-2">
          {cert.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-muted">
          <span className="font-mono text-[11px] shrink-0">{cert.date}</span>
          <span className="inline-block text-[11px] font-medium text-muted">
            {formatCertificateCategory(cert.category, isEn)}
          </span>
        </div>

        {cert.credentialId && (
          <p className="mt-1 font-mono text-[10px] text-muted truncate">
            ID: {cert.credentialId}
          </p>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-line/40 flex flex-wrap items-center justify-between gap-2">
        {proofLink || canPreviewInline ? (
          <>
            {canPreviewInline && (
              <button
                type="button"
                onClick={() => onPreview(cert)}
                className="inline-flex min-h-[32px] items-center gap-1 text-xs font-semibold text-ink hover:text-brand dark:text-slate-200 dark:hover:text-blue-400"
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
                className="inline-flex min-h-[32px] items-center gap-1 text-xs font-semibold text-brand transition-colors duration-150 hover:text-brand-ink hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>{t("certificates.viewCredential", isEn ? "View Credential" : "Lihat Bukti")}</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </>
        ) : (
          <span className="text-[11px] text-muted">
            {evidenceAttached
              ? t("certificates.restrictedProofNote", isEn ? "Attachment restricted" : "Lampiran dibatasi")
              : t("certificates.noEvidenceNote", isEn ? "Evidence not attached" : "Bukti belum dilampirkan")}
          </span>
        )}
      </div>
    </div>
  );
}

interface CertificatePreviewModalProps {
  cert: CertificateItem | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  total?: number;
  isEn?: boolean;
}

export function CertificatePreviewModal({
  cert,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  total,
  isEn = false,
}: CertificatePreviewModalProps) {
  const { t } = useTranslation();
  const mounted = useMounted();

  useEffect(() => {
    if (!cert) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cert, onClose, onPrev, onNext]);

  if (!cert || !mounted || typeof document === "undefined") return null;

  const resolvedStatus = resolveCertificateVerificationStatus(cert);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cert.title}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-2xl dark:border-line/60 dark:bg-[#111422]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-white dark:bg-[#111422]">
          <div className="min-w-0 pr-4 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                {cert.title}
              </h4>
              <CertificateVerificationBadge status={resolvedStatus} isEn={isEn} />
            </div>
            <p className="text-xs text-muted truncate">
              {cert.issuer} · {cert.date}
              {cert.expiryDate ? ` (${isEn ? "Exp" : "Berlaku s.d."} ${cert.expiryDate})` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {typeof currentIndex === "number" && typeof total === "number" && total > 1 && (
              <span className="font-mono text-xs font-semibold text-muted mr-1">
                {currentIndex + 1} / {total}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? "Close" : "Tutup"}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-slate-50 p-4 dark:bg-[#0b0e18]">
          {/* Navigation Arrows for Modal */}
          {onPrev && onNext && typeof total === "number" && total > 1 && (
            <>
              <button
                type="button"
                onClick={onPrev}
                aria-label={isEn ? "Previous certificate" : "Sertifikat sebelumnya"}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md border border-line hover:bg-white hover:scale-105 active:scale-95 transition dark:bg-slate-800/90 dark:text-white dark:border-line/60"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label={isEn ? "Next certificate" : "Sertifikat berikutnya"}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md border border-line hover:bg-white hover:scale-105 active:scale-95 transition dark:bg-slate-800/90 dark:text-white dark:border-line/60"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          {cert.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cert.image}
              alt={cert.title}
              className="mx-auto max-h-[65vh] w-auto rounded-lg object-contain border border-line/60 shadow-sm"
            />
          ) : cert.credentialPdf && cert.allowDownload !== false ? (
            <iframe
              src={cert.credentialPdf}
              title={cert.title}
              className="h-[65vh] w-full rounded-lg border border-line/60 bg-white"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center text-muted">
              <Award className="size-12 mb-2 text-brand/40" />
              <p className="text-xs font-semibold text-ink">{cert.title}</p>
              <p className="text-[11px]">{cert.issuer}</p>
            </div>
          )}
          {cert.desc && (
            <p className="mt-3 text-xs leading-relaxed text-body">{cert.desc}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs bg-white dark:bg-[#111422]">
          <span className="font-mono text-muted">
            {cert.credentialId ? `ID: ${cert.credentialId}` : ""}
          </span>
          <div className="flex items-center gap-3">
            {cert.credentialPdf && cert.allowDownload !== false && (
              <a
                href={cert.credentialPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand dark:text-slate-200"
              >
                <FileText className="size-3.5" />
                <span>PDF</span>
              </a>
            )}
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline dark:text-blue-400"
              >
                <span>{t("certificates.openLink", isEn ? "Open Credential Link" : "Buka Tautan Bukti")}</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
