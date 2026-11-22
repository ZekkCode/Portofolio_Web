import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  ExternalLink,
  Layers,
  Users,
} from "lucide-react";
import { fetchPublishedContent } from "@/lib/content/public-content";
import {
  getPublishedProfile,
  getPublishedProjectCategories,
  getPublishedProjects,
  getPublishedSeo,
  getPublishedTechStack,
} from "@/lib/content/selectors";
import { resolveSafeHostContext } from "@/lib/seo/allowed-hosts";
import { LanguageToggle, ThemeToggle } from "@/components/theme-language-toggle";
import { ScrollToTop } from "@/components/scroll-to-top";
import type { Project, TechStackItem } from "@/lib/site-config";

const STATUS_LABELS: Record<string, { id: string; en: string }> = {
  completed: { id: "Selesai", en: "Completed" },
  "in-progress": { id: "Berjalan", en: "In Progress" },
  archived: { id: "Arsip", en: "Archived" },
  concept: { id: "Konsep", en: "Concept" },
};

async function resolveRequestContext(): Promise<{ rawHost: string; locale: "id" | "en" }> {
  let rawHost = "";
  let locale: "id" | "en" = "id";
  try {
    const headerList = await headers();
    rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
    const hdrLang = headerList.get("x-zekk-lang")?.trim().toLowerCase();
    if (hdrLang === "en") locale = "en";
  } catch {}
  return { rawHost, locale };
}

function getProjectDetailSlug(project: Project): string {
  return project.slug || project.id;
}

function findProjectBySlug(projects: Project[], slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug || p.id === slug);
}

async function resolveProjectDetail(slug: string) {
  const config = await fetchPublishedContent();
  const { rawHost, locale } = await resolveRequestContext();
  // Slug selalu diturunkan dari judul bahasa Indonesia (atau field slug eksplisit),
  // jadi pencocokan memakai daftar locale id agar stabil di kedua bahasa.
  const publishedId = getPublishedProjects(config, { locale: "id" });
  const match = findProjectBySlug(publishedId, slug);
  if (!match) {
    return {
      config,
      rawHost,
      locale,
      project: null as Project | null,
      others: [] as Project[],
    };
  }
  const publishedLocale =
    locale === "en" ? getPublishedProjects(config, { locale: "en" }) : publishedId;
  const project = publishedLocale.find((p) => p.id === match.id) ?? match;
  const others = publishedLocale.filter((p) => p.id !== match.id);
  return { config, rawHost, locale, project, others };
}

function toMetaDescription(project: Project): string {
  const raw = (project.summary || project.desc || "").replace(/\s+/g, " ").trim();
  if (raw.length <= 155) return raw;
  return `${raw.slice(0, 152).trimEnd()}...`;
}

function toAbsoluteAssetUrl(baseUrl: string, rawPath: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const trimmed = rawPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${cleanBase}${normalizedPath}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { config, rawHost, locale, project } = await resolveProjectDetail(slug);
  if (!project) notFound();
  const seo = getPublishedSeo(config, locale);
  const pub = getPublishedProfile(config, locale);
  const siteUrl = resolveSafeHostContext(rawHost, seo.canonicalUrl || pub.site).siteUrl;
  const detailPath = `/projects/${getProjectDetailSlug(project)}`;
  const title = `${project.title} | ${pub.name}`;
  const description = toMetaDescription(project);
  const cover = project.image ? toAbsoluteAssetUrl(siteUrl, project.image) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: detailPath,
      languages: {
        "id-ID": `${detailPath}?lang=id`,
        "en-US": `${detailPath}?lang=en`,
        "x-default": detailPath,
      },
    },
    openGraph: {
      title,
      description,
      url: detailPath,
      type: "website",
      siteName: `${pub.name} Portfolio`,
      ...(cover
        ? {
            images: [
              {
                url: cover,
                width: 1200,
                height: 630,
                alt: project.imageAlt || project.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { config, rawHost, locale, project, others } = await resolveProjectDetail(slug);
  if (!project) notFound();

  const isEn = locale === "en";
  const seo = getPublishedSeo(config, locale);
  const pub = getPublishedProfile(config, locale);
  const siteUrl = resolveSafeHostContext(rawHost, seo.canonicalUrl || pub.site).siteUrl;
  const detailPath = `/projects/${getProjectDetailSlug(project)}`;
  const pageUrl = `${siteUrl}${detailPath}`;
  const description = toMetaDescription(project);

  const categories = getPublishedProjectCategories(config, locale);
  const categoryLabel =
    (project.category === "both"
      ? "IT & Design"
      : categories.find((c) => c.key === project.category)?.label) ||
    (project.category ? project.category.toUpperCase() : "");

  const techItems = getPublishedTechStack(config, undefined, { locale });
  const techById = new Map(techItems.map((item) => [item.id, item]));
  const linkedTech = (project.techIds || [])
    .map((id) => techById.get(id))
    .filter((item): item is TechStackItem => Boolean(item));
  const linkedTechNames = new Set(linkedTech.map((t) => t.name.toLowerCase()));
  const extraTags = (project.tags || []).filter(
    (tag) => tag && !linkedTechNames.has(tag.toLowerCase())
  );
  const allKeywords = [...linkedTech.map((t) => t.name), ...extraTags];

  const collaboratorsText = (project.collaborators || []).filter(Boolean).join(", ");
  const cover = project.image ? toAbsoluteAssetUrl(siteUrl, project.image) : undefined;
  const galleryEntries = [
    ...(project.image ? [{ src: project.image, alt: project.imageAlt || project.title }] : []),
    ...(project.galleryImages || []).map((src, idx) => ({
      src,
      alt: project.galleryAlts?.[idx] || `${project.title}, gambar ${idx + 2}`,
    })),
  ].filter((entry) => Boolean(entry.src));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#project`,
        name: project.title,
        url: pageUrl,
        description,
        ...(cover ? { image: [cover] } : {}),
        ...(allKeywords.length > 0 ? { keywords: allKeywords.join(", ") } : {}),
        author: { "@id": `${siteUrl}/#person` },
        isPartOf: { "@id": `${siteUrl}/#website` },
        ...(categoryLabel ? { about: categoryLabel } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isEn ? "Home" : "Beranda",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: isEn ? "Projects" : "Proyek",
            item: `${siteUrl}/projects`,
          },
          { "@type": "ListItem", position: 3, name: project.title, item: pageUrl },
        ],
      },
    ],
  };

  const statusLabel = project.status ? STATUS_LABELS[project.status] : undefined;

  return (
    <div className="relative min-h-screen bg-page text-body antialiased transition-colors duration-200">
      <script
        id="project-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-page/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-xl border border-line/70 bg-white/70 px-3.5 py-2 text-xs sm:text-sm font-semibold text-ink transition-all hover:border-brand/40 hover:text-brand dark:border-line/40 dark:bg-[#111422]/70 dark:text-slate-200 dark:hover:text-blue-400"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            <span>{isEn ? "All Projects" : "Semua Proyek"}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-block font-display text-xs font-bold uppercase tracking-wider text-muted">
              {pub.name}
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
          <Link href="/projects" className="hover:text-brand transition-colors">
            {isEn ? "Projects" : "Proyek"}
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">{project.title}</span>
        </nav>

        {/* Title & Metadata */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {categoryLabel && (
              <span className="rounded bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand dark:bg-blue-500/10 dark:text-blue-300">
                {categoryLabel}
              </span>
            )}
            {project.role && (
              <span className="text-xs font-semibold text-brand dark:text-blue-400">
                {project.role}
              </span>
            )}
            {statusLabel && (
              <span className="rounded-full border border-line/70 px-2 py-0.5 text-[10px] font-medium text-muted dark:border-line/40">
                {isEn ? statusLabel.en : statusLabel.id}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            {project.title}
          </h1>
          {project.summary && (
            <p className="mt-3 max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-ink/90">
              {project.summary}
            </p>
          )}
          {project.desc && (
            <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-body">
              {project.desc}
            </p>
          )}
          {(project.period || collaboratorsText) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
              {project.period && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-brand shrink-0" />
                  <span>{project.period}</span>
                </span>
              )}
              {collaboratorsText && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5 text-brand shrink-0" />
                  <span>{collaboratorsText}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cover Image */}
        {project.image && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-line/70 dark:border-line/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.image}
              alt={project.imageAlt || project.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Structured Case Study Highlights */}
        {(project.problem || project.approach || project.architecture || project.outcome) && (
          <section className="mb-8 space-y-5 rounded-2xl border border-line/60 bg-white/60 p-5 sm:p-6 dark:border-line/40 dark:bg-[#111422]/60">
            {project.problem && (
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-ink">
                  {isEn ? "Challenge" : "Tantangan"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{project.problem}</p>
              </div>
            )}
            {project.approach && (
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-ink">
                  {isEn ? "Approach and Solution" : "Pendekatan dan Solusi"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{project.approach}</p>
              </div>
            )}
            {project.architecture && (
              <div>
                <h2 className="inline-flex items-center gap-1.5 font-display text-base sm:text-lg font-bold text-ink">
                  <Layers className="size-4 text-brand" />
                  <span>
                    {isEn ? "Architecture and Technical Decisions" : "Arsitektur dan Keputusan Teknis"}
                  </span>
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{project.architecture}</p>
              </div>
            )}
            {project.outcome && (
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {isEn ? "Results and Impact" : "Hasil dan Dampak"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{project.outcome}</p>
              </div>
            )}
          </section>
        )}

        {/* Linked Tech Stack & Tags */}
        {(linkedTech.length > 0 || extraTags.length > 0) && (
          <section className="mb-8">
            <h2 className="font-display text-base sm:text-lg font-bold text-ink">
              {isEn ? "Technologies Used" : "Teknologi yang Digunakan"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {linkedTech.map((tech) => (
                <span
                  key={tech.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-brand/25 bg-brand/5 px-2.5 py-1 text-xs font-medium text-ink dark:border-blue-400/25 dark:bg-blue-500/10"
                >
                  {tech.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tech.icon} alt="" className="size-3.5 object-contain" />
                  )}
                  <span>{tech.name}</span>
                </span>
              ))}
              {extraTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-line/60 bg-surface px-2.5 py-1 text-xs font-medium text-body dark:border-line/40 dark:bg-slate-900"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {galleryEntries.length > 1 && (
          <section className="mb-8">
            <h2 className="font-display text-base sm:text-lg font-bold text-ink">
              {isEn ? "Gallery" : "Galeri"}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {galleryEntries.slice(1).map((entry) => (
                <div
                  key={entry.src}
                  className="overflow-hidden rounded-xl border border-line/70 dark:border-line/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.src}
                    alt={entry.alt}
                    loading="lazy"
                    className="w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="mb-12 flex flex-wrap items-center gap-3">
          {project.previewUrl && (
            <a
              href={project.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand bg-brand px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-brand-ink"
            >
              <span>Live Demo</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-200"
            >
              <span>{isEn ? "View Repository" : "Buka Repositori"}</span>
              <ArrowRight className="size-3.5" />
            </a>
          )}
          {project.caseStudyUrl && (
            <a
              href={project.caseStudyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line/80 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-200"
            >
              <BookOpen className="size-3.5" />
              <span>{isEn ? "Case Study" : "Studi Kasus"}</span>
            </a>
          )}
          <Link
            href="/projects"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-muted hover:text-brand transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isEn ? "Back to Projects" : "Kembali ke Daftar Proyek"}</span>
          </Link>
        </div>

        {/* Other Projects */}
        {others.length > 0 && (
          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-ink">
              {isEn ? "More Projects" : "Proyek Lainnya"}
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {others.slice(0, 6).map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/projects/${getProjectDetailSlug(other)}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line/80 bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand dark:border-line/60 dark:bg-[#111422] dark:text-slate-200"
                  >
                    <span>{other.title}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ScrollToTop />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-line/60 bg-white/40 py-8 text-center text-xs text-muted dark:border-line/40 dark:bg-[#0b0e18]/40">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {pub.name}, {isEn ? "Project Portfolio" : "Portofolio Proyek"}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brand transition-colors">
              {isEn ? "Home" : "Beranda"}
            </Link>
            <Link href="/projects" className="hover:text-brand transition-colors">
              {isEn ? "Projects" : "Proyek"}
            </Link>
            <a href={`mailto:${pub.email}`} className="hover:text-brand transition-colors">
              {pub.email}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
