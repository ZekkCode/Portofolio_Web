"use client";

import React, { useEffect, useRef, useState } from "react";

export type InstitutionLogoSize = "xs" | "sm" | "md";

interface InstitutionLogoProps {
  src?: string | null;
  name?: string | null;
  fallbackCode?: string;
  fallbackIcon?: React.ReactNode;
  size?: InstitutionLogoSize;
  loading?: "lazy" | "eager";
  style?: React.CSSProperties;
  className?: string;
}

const SIZE_CLASSES: Record<
  InstitutionLogoSize,
  { container: string; fallback: string }
> = {
  xs: {
    container: "h-8 min-w-8 max-w-20 px-1 py-0.5",
    fallback: "size-8 text-[10px]",
  },
  sm: {
    container: "h-9 min-w-9 max-w-20 sm:max-w-24 px-1.5 py-1",
    fallback: "size-9 text-[11px]",
  },
  md: {
    container: "h-10 min-w-10 max-w-24 sm:max-w-28 px-1.5 py-1",
    fallback: "size-10 text-[11px]",
  },
};

/**
 * Menghasilkan maksimal 3 karakter inisial bersih dari nama institusi/organisasi
 * untuk fallback saat logo belum tersedia atau gagal dimuat.
 */
export function getInstitutionInitials(
  name?: string | null,
  fallbackCode = "ORG",
): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return fallbackCode;

  const initials = cleaned
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-zA-Z0-9]+/, ""))
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 3)
    .join("")
    .toUpperCase();

  return initials || fallbackCode;
}

/**
 * Renderer bersama logo institusi pendidikan & organisasi:
 * - Menjaga rasio aspek asli tanpa crop/stretch (mendukung logo persegi maupun lebar)
 * - Memberikan latar netral terang pada mode terang/gelap agar logo transparan bertinta gelap tetap terbaca
 * - Otomatis fallback ke inisial / ikon jika URL kosong atau gagal dimuat (onError / naturalWidth === 0)
 */
export function InstitutionLogo({
  src,
  name,
  fallbackCode = "ORG",
  fallbackIcon,
  size = "md",
  loading = "lazy",
  style,
  className = "",
}: InstitutionLogoProps) {
  const cleanSrc = typeof src === "string" ? src.trim() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const showImage = Boolean(cleanSrc) && failedSrc !== cleanSrc;

  useEffect(() => {
    const img = imgRef.current;
    if (cleanSrc && img?.complete && img.naturalWidth === 0) {
      setFailedSrc(cleanSrc);
    }
  }, [cleanSrc]);

  const metrics = SIZE_CLASSES[size];

  if (showImage) {
    return (
      <span
        data-institution-logo="image"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-line/60 bg-white dark:border-white/15 dark:bg-white/95 ${metrics.container} ${className}`}
        style={style}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={cleanSrc}
          alt={cleanName ? `Logo ${cleanName}` : "Logo Institusi"}
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(cleanSrc)}
          className="h-auto w-auto max-h-full max-w-full object-contain"
        />
      </span>
    );
  }

  const initials = getInstitutionInitials(cleanName, fallbackCode);

  return (
    <span
      data-institution-logo="fallback"
      data-logo-fallback={fallbackIcon ? "icon" : "initials"}
      title={cleanName || undefined}
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-line/60 bg-surface/60 font-mono font-bold tracking-tight text-muted select-none dark:border-line/40 dark:bg-slate-900/60 ${metrics.fallback} ${className}`}
      style={style}
    >
      {fallbackIcon ?? initials}
    </span>
  );
}
