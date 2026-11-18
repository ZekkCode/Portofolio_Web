"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Search,
  X,
  Award,
  ShieldCheck,
  RotateCcw,
  Layers,
  Sparkles,
} from "lucide-react";
import { useSiteConfig, type CertificateItem } from "@/lib/site-store";
import {
  getPublishedCertificates,
  getPublishedProfile,
} from "@/lib/content/selectors";
import {
  CertificateCard,
  CertificatePreviewModal,
  formatCertificateCategory,
} from "@/components/certificate-card";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { ScrollToTop } from "@/components/scroll-to-top";
import { resolveCertificateVerificationStatus } from "@/lib/content/certificate-verification";

export function CertificatesClient() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";

  const config = useSiteConfig();
  const pubProfile = useMemo(() => getPublishedProfile(config, locale), [config, locale]);
  const allCertificates = useMemo(
    () => getPublishedCertificates(config, "all", locale),
    [config, locale]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "verified">("all");
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  // Dynamic Categories from Data
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allCertificates.forEach((c) => {
      if (c.category && c.category !== "all") cats.add(c.category);
    });
    const base = ["design", "frontend", "systems"].filter((k) => cats.has(k));
    cats.forEach((k) => {
      if (!base.includes(k)) base.push(k);
    });
    return base;
  }, [allCertificates]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allCertificates.filter((cert) => {
      // Category match
      if (selectedCategory !== "all" && cert.category !== selectedCategory) {
        return false;
      }
      // Status match
      const status = resolveCertificateVerificationStatus(cert);
      if (selectedStatus === "verified" && status !== "verified") {
        return false;
      }
      // Search match
      if (!query) return true;
      const titleMatch = cert.title.toLowerCase().includes(query);
      const issuerMatch = cert.issuer.toLowerCase().includes(query);
      const idMatch = cert.credentialId?.toLowerCase().includes(query);
      const descMatch = cert.desc?.toLowerCase().includes(query);
      return titleMatch || issuerMatch || idMatch || descMatch;
    });
  }, [allCertificates, searchQuery, selectedCategory, selectedStatus]);

  // Statistics
  const totalVerifiedCount = useMemo(
    () =>
      allCertificates.filter(
        (c) => resolveCertificateVerificationStatus(c) === "verified"
      ).length,
    [allCertificates]
  );

  const safeModalIndex = useMemo(() => {
    if (!previewCert) return 0;
    const idx = filteredCertificates.findIndex((c) => c.id === previewCert.id);
    return idx >= 0 ? idx : 0;
  }, [previewCert, filteredCertificates]);

  const handleModalPrev = () => {
    if (filteredCertificates.length <= 1) return;
    const prevIdx =
      (safeModalIndex - 1 + filteredCertificates.length) % filteredCertificates.length;
    setPreviewCert(filteredCertificates[prevIdx]);
  };

  const handleModalNext = () => {
    if (filteredCertificates.length <= 1) return;
    const nextIdx = (safeModalIndex + 1) % filteredCertificates.length;
    setPreviewCert(filteredCertificates[nextIdx]);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  return (
    <div className="relative min-h-screen bg-page text-body antialiased transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/#certificates"
            className="group inline-flex items-center gap-2 rounded-xl border border-line/70 bg-white/70 px-3.5 py-2 text-xs sm:text-sm font-semibold text-ink transition-all hover:border-brand/40 hover:text-brand dark:border-line/40 dark:bg-[#111422]/70 dark:text-slate-200 dark:hover:text-blue-400"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span>{isEn ? "Back to Portfolio" : "Kembali ke Beranda"}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-block font-display text-xs font-bold uppercase tracking-wider text-muted">
              {pubProfile.name}
            </span>
            <div className="h-4 w-px bg-line/60 hidden sm:block" />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            {isEn ? "Home" : "Beranda"}
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">
            {isEn ? "Credentials & Certificates" : "Kredensial & Sertifikasi"}
          </span>
        </nav>

        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 mb-3">
            <Award className="size-3.5" />
            <span>{isEn ? "Verified Credentials Directory" : "Direktori Kredensial Terverifikasi"}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            {isEn ? "Certifications & Technical Credentials" : "Arsip Kredensial & Sertifikasi"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-body">
            {isEn
              ? "Comprehensive catalog of official certifications, professional training, and technical credentials completed across IT Support, Frontend Engineering, UI/UX Design, and Networking Systems."
              : "Daftar lengkap sertifikasi resmi, pelatihan kompetensi, dan kredensial teknis terverifikasi di bidang IT Support, Rekayasa Frontend, Desain Antarmuka UI/UX, dan Jaringan Komputer."}
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-line/70 bg-white p-3.5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Award className="size-4 text-brand dark:text-blue-400" />
                <span className="text-xs font-medium">{isEn ? "Total Credentials" : "Total Kredensial"}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-ink">
                {allCertificates.length}
              </p>
            </div>

            <div className="rounded-2xl border border-line/70 bg-white p-3.5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <div className="flex items-center gap-2 text-muted mb-1">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium">{isEn ? "Verified" : "Terverifikasi"}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-ink text-emerald-600 dark:text-emerald-400">
                {totalVerifiedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-line/70 bg-white p-3.5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Layers className="size-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium">{isEn ? "Core Tracks" : "Bidang Keahlian"}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-ink">
                {availableCategories.length}
              </p>
            </div>

            <div className="rounded-2xl border border-line/70 bg-white p-3.5 shadow-2xs dark:border-line/40 dark:bg-[#111422]">
              <div className="flex items-center gap-2 text-muted mb-1">
                <Sparkles className="size-4 text-amber-500" />
                <span className="text-xs font-medium">{isEn ? "Featured" : "Unggulan"}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-bold text-ink">
                {allCertificates.filter((c) => c.featured).length}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Category Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? "Search credential, issuer, or ID..."
                    : "Cari nama sertifikat, penerbit, atau ID kredensial..."
                }
                className="w-full rounded-xl border border-line/80 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-line/60 dark:bg-[#111422] dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={isEn ? "Clear search" : "Hapus pencarian"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Status Filter Pill */}
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "all" ? "verified" : "all")}
              className={`min-h-[42px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border ${
                selectedStatus === "verified"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border-line/80 bg-white text-body hover:border-brand/40 dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>{isEn ? "Verified Only" : "Terverifikasi Saja"}</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 border ${
                selectedCategory === "all"
                  ? "bg-brand text-white border-brand"
                  : "border-line/80 bg-white text-body hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
              }`}
            >
              {isEn ? "All Tracks" : "Semua Bidang"} ({allCertificates.length})
            </button>
            {availableCategories.map((catKey) => {
              const count = allCertificates.filter((c) => c.category === catKey).length;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 border ${
                    selectedCategory === catKey
                      ? "bg-brand text-white border-brand"
                      : "border-line/80 bg-white text-body hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
                  }`}
                >
                  {formatCertificateCategory(catKey, isEn)} ({count})
                </button>
              );
            })}

            {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline px-2 py-1 dark:text-blue-400"
              >
                <RotateCcw className="size-3" />
                <span>{isEn ? "Reset Filters" : "Atur Ulang Filter"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter summary */}
        <div className="mb-4 flex items-center justify-between text-xs text-muted">
          <span>
            {isEn
              ? `Displaying ${filteredCertificates.length} of ${allCertificates.length} credentials`
              : `Menampilkan ${filteredCertificates.length} dari ${allCertificates.length} kredensial`}
          </span>
        </div>

        {/* Results Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 bg-white/60 px-6 py-16 text-center dark:border-line/40 dark:bg-[#111422]/60">
            <Award className="size-10 text-muted mb-3" />
            <h3 className="font-display text-base font-bold text-ink">
              {isEn ? "No Matching Credentials Found" : "Kredensial Tidak Ditemukan"}
            </h3>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-body">
              {isEn
                ? "Try adjusting your search terms or resetting the active category filter."
                : "Coba sesuaikan kata kunci pencarian atau atur ulang filter kategori yang aktif."}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-brand bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-ink transition"
            >
              <RotateCcw className="size-3.5" />
              <span>{isEn ? "Reset Filter" : "Atur Ulang Pencarian"}</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCertificates.map((cert) => (
              <CertificateCard
                key={cert.id || cert.title}
                cert={cert}
                onPreview={setPreviewCert}
                isEn={isEn}
              />
            ))}
          </div>
        )}

        {/* Modal Lightbox */}
        <CertificatePreviewModal
          cert={previewCert}
          onClose={() => setPreviewCert(null)}
          onPrev={handleModalPrev}
          onNext={handleModalNext}
          currentIndex={safeModalIndex}
          total={filteredCertificates.length}
          isEn={isEn}
        />

        {/* Floating Scroll to Top */}
        <ScrollToTop />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-line/60 bg-white/40 py-8 text-center text-xs text-muted dark:border-line/40 dark:bg-[#0b0e18]/40">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {pubProfile.name} — Arsip Kredensial Resmi</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brand transition-colors">
              {isEn ? "Home" : "Beranda"}
            </Link>
            <Link href="/projects" className="hover:text-brand transition-colors">
              {isEn ? "Projects" : "Proyek"}
            </Link>
            <a
              href={`mailto:${pubProfile.email}`}
              className="hover:text-brand transition-colors"
            >
              {pubProfile.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
