"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  X,
  Briefcase,
  Layers,
  RotateCcw,
} from "lucide-react";
import { useSiteConfig, type Project, type TechStackItem } from "@/lib/site-store";
import {
  getPublishedProjects,
  getPublishedProfile,
  getPublishedProjectCategories,
} from "@/lib/content/selectors";
import { ProjectTiltedCard } from "@/components/projects-section";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { ScrollToTop } from "@/components/scroll-to-top";

const RepoPreviewModal = dynamic(
  () => import("@/components/repo-preview-modal").then((m) => m.RepoPreviewModal),
  { ssr: false }
);

export function ProjectsClient() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || "id") === "en";
  const locale = isEn ? "en" : "id";

  const config = useSiteConfig();
  const pubProfile = useMemo(() => getPublishedProfile(config, locale), [config, locale]);
  const allProjects = useMemo(() => getPublishedProjects(config, { locale }), [config, locale]);
  const categories = useMemo(() => getPublishedProjectCategories(config, locale), [config, locale]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const techById = useMemo(() => {
    const map: Record<string, TechStackItem> = {};
    const items = config.techStack || [];
    for (const item of items) {
      if (item.id) map[item.id] = item;
    }
    return map;
  }, [config.techStack]);

  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      map[cat.key] = cat.label;
    }
    return map;
  }, [categories]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allProjects.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      const titleMatch = p.title.toLowerCase().includes(query);
      const descMatch = (p.desc || "").toLowerCase().includes(query);
      const summaryMatch = (p.summary || "").toLowerCase().includes(query);
      const roleMatch = (p.role || "").toLowerCase().includes(query);
      const tagsMatch = (p.tags || []).some((tag) => tag.toLowerCase().includes(query));
      return titleMatch || descMatch || summaryMatch || roleMatch || tagsMatch;
    });
  }, [allProjects, searchQuery, selectedCategory]);

  const githubUrl =
    pubProfile.socials.find((s) => s.platform.toLowerCase() === "github")?.href ||
    `https://github.com/${pubProfile.githubUsername || "ZekkCode"}`;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="relative min-h-screen bg-page text-body antialiased transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/#proyek"
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
            {isEn ? "Projects Directory" : "Katalog Proyek"}
          </span>
        </nav>

        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            {isEn ? "Featured Works & Software Projects" : "Katalog Proyek & Portofolio"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-body">
            {isEn
              ? "Collection of web applications, interactive software systems, and digital interfaces built with modern architecture and high user experience standards."
              : "Koleksi aplikasi web, sistem informasi terintegrasi, dan antarmuka digital yang dirancang dengan arsitektur modern serta standar pengalaman pengguna yang tinggi."}
          </p>

          {/* Metadata Ringkas Tanpa Box Border */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted">
            <div className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4 text-brand dark:text-blue-400" />
              <span>
                <strong className="font-semibold text-ink">{allProjects.length}</strong>{" "}
                {isEn ? "Projects" : "Proyek Terdaftar"}
              </span>
            </div>
            <span className="text-line" aria-hidden="true">•</span>
            <div className="inline-flex items-center gap-1.5">
              <Layers className="size-4 text-purple-600 dark:text-purple-400" />
              <span>
                <strong className="font-semibold text-ink">{categories.length}</strong>{" "}
                {isEn ? "Categories" : "Kategori Bidang"}
              </span>
            </div>
            <span className="text-line" aria-hidden="true">•</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-blue-400"
            >
              <span>GitHub @{pubProfile.githubUsername || "ZekkCode"}</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Toolbar: Search & Category Filter Tabs */}
        {allProjects.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isEn
                      ? "Search project name, role, tech stack..."
                      : "Cari nama proyek, peran, atau teknologi..."
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
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 border ${
                      selectedCategory === tab.key
                        ? "bg-brand text-white border-brand"
                        : "border-line/80 bg-white text-body hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-xs text-brand hover:underline px-2 py-1 dark:text-blue-400"
                  >
                    <RotateCcw className="size-3" />
                    <span>{isEn ? "Reset Filter" : "Atur Ulang"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Project Grid / Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 bg-white/60 px-6 py-16 text-center dark:border-line/40 dark:bg-[#111422]/60">
            <svg
              className="size-10 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
            <h3 className="mt-4 font-display text-base sm:text-lg font-bold text-ink">
              {allProjects.length === 0
                ? t("projects.emptyTitle", "Belum Ada Proyek yang Ditampilkan")
                : isEn
                ? "No Projects Match Your Search"
                : "Tidak Ada Proyek yang Cocok"}
            </h3>
            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-body">
              {allProjects.length === 0
                ? t(
                    "projects.emptyDesc",
                    "Koleksi proyek sedang dikurasi atau belum dipublikasikan ke tampilan publik."
                  )
                : isEn
                ? "Try searching with different terms or selecting another category."
                : "Coba gunakan kata kunci lain atau pilih kategori yang berbeda."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {searchQuery && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand bg-brand px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-brand-ink transition"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{isEn ? "Reset Search" : "Atur Ulang Pencarian"}</span>
                </button>
              )}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line/80 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink shadow-2xs transition-colors hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-200 dark:hover:text-blue-400"
              >
                <span>{isEn ? "View Repositories on GitHub" : "Lihat Repositori di GitHub"}</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-5 ${
              filteredProjects.length === 1
                ? "max-w-xl mx-auto"
                : filteredProjects.length === 2 || filteredProjects.length === 4
                ? "sm:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredProjects.map((project) => {
              const catLabel =
                (project.category === "both"
                  ? "IT & Design"
                  : categoryLabelMap[project.category || ""]) ||
                (project.category ? project.category.toUpperCase() : "");
              const linkedTech = (project.techIds || [])
                .map((id) => techById[id])
                .filter((item): item is TechStackItem => Boolean(item));
              return (
                <ProjectTiltedCard
                  key={project.id}
                  project={project}
                  categoryLabel={catLabel}
                  techItems={linkedTech}
                  onPreview={setSelectedProject}
                  isEn={isEn}
                />
              );
            })}
          </div>
        )}

        {/* Repository Full Preview Modal */}
        {selectedProject && (
          <RepoPreviewModal
            project={selectedProject}
            isOpen={Boolean(selectedProject)}
            onClose={() => setSelectedProject(null)}
          />
        )}

        {/* Floating Scroll to Top */}
        <ScrollToTop />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-line/60 bg-white/40 py-8 text-center text-xs text-muted dark:border-line/40 dark:bg-[#0b0e18]/40">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {pubProfile.name} — Portofolio Proyek Rekayasa</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brand transition-colors">
              {isEn ? "Home" : "Beranda"}
            </Link>
            <Link href="/certificates" className="hover:text-brand transition-colors">
              {isEn ? "Certificates" : "Sertifikasi"}
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
