"use client";

import { useState, useMemo } from "react";
import type {
  SiteConfig,
  FaqItemConfig,
  BlogConfig,
  ManualBlogPostConfig,
  SyncedBlogPostOverride,
  NavMenuItemConfig,
  SectionKey,
  SectionConfigItem,
  ContactConfig,
  FooterConfig,
} from "@/lib/site-config";
import { MediaFieldControl } from "./MediaFieldControl";
import { ConfirmImpactModal, type DeleteImpactItem } from "./ConfirmImpactModal";
import {
  AdminSearchFilterBar,
  AdminPaginationBar,
  AdminItemActionBar,
  reorderItemsWithSortOrder,
  useDragReorder,
} from "./AdminListTools";
import {
  Plus,
  HelpCircle,
  Newspaper,
  Globe,
  RefreshCw,
  Compass,
  LayoutList,
  MessageSquare,
  Star,
  Pin,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";

interface TabContentProps {
  config: SiteConfig;
  setDraft: (next: SiteConfig) => void;
  setStatus: (status: string) => void;
  uploadAndSet: (
    file: File,
    folder: string,
    callback: (url: string) => void,
    fieldKey: string
  ) => Promise<void>;
  uploadingImage: string | null;
  inputClass: string;
}

const FAQ_PAGE_SIZE = 10;

// Allowed section keys strictly obeying AGENTS.md (#11: no workflow section)
const SECTION_LABELS: Record<SectionKey, { name: string; anchors: string }> = {
  hero: { name: "Hero & Lanyard 3D", anchors: "#hero, #atas" },
  about: { name: "Tentang Saya & Statistik", anchors: "#about, #tentang, #about-me" },
  services: { name: "4 Pilar Layanan", anchors: "#services, #layanan" },
  cv: { name: "Folder Berkas CV & PaperCrumple", anchors: "#cv, #resume" },
  journey: { name: "Jejak Akademik & Pengalaman", anchors: "#journey, #akademik" },
  achievements: { name: "Prestasi & Rekognisi", anchors: "#achievements, #prestasi" },
  certificates: { name: "Sertifikasi Terverifikasi", anchors: "#certificates, #sertifikasi" },
  stack: { name: "Tech Stack & Alat", anchors: "#stack, #tech-stack" },
  projects: { name: "Proyek & Studi Kasus", anchors: "#proyek, #projects" },
  blog: { name: "Catatan & Blog ZekkTech", anchors: "#blog" },
  faq: { name: "FAQ / Tanya Jawab", anchors: "#faq, #tanya-jawab" },
  contact: { name: "Kontak & Hologram Card", anchors: "#kontak, #contact" },
};

const VALID_ANCHOR_TARGETS = new Set([
  "#hero",
  "#atas",
  "#about",
  "#tentang",
  "#about-me",
  "#services",
  "#layanan",
  "#cv",
  "#resume",
  "#journey",
  "#akademik",
  "#achievements",
  "#prestasi",
  "#rekognisi",
  "#certificates",
  "#sertifikasi",
  "#stack",
  "#tech-stack",
  "#proyek",
  "#projects",
  "#blog",
  "#faq",
  "#tanya-jawab",
  "#kontak",
  "#contact",
]);

function matchesStatusFilter(
  item: { published?: boolean; visible?: boolean },
  filter: "all" | "published" | "draft" | "hidden"
): boolean {
  if (filter === "published") return item.published !== false && item.visible !== false;
  if (filter === "draft") return item.published === false;
  if (filter === "hidden") return item.published !== false && item.visible === false;
  return true;
}

function isNavTargetValid(href: string, isExternal?: boolean): boolean {
  const clean = (href || "").trim();
  if (!clean) return false;
  if (clean.startsWith("#")) return VALID_ANCHOR_TARGETS.has(clean.toLowerCase());
  if (isExternal || clean.startsWith("https://") || clean.startsWith("http://") || clean.startsWith("/")) {
    return true;
  }
  return false;
}

export function TabContent({
  config,
  setDraft,
  setStatus,
  uploadAndSet,
  uploadingImage,
  inputClass,
}: TabContentProps) {
  const [subTab, setSubTab] = useState<"faq" | "blog" | "navigation" | "sections" | "contactFooter">("faq");

  // FAQ search/filter
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("all");
  const [faqStatusFilter, setFaqStatusFilter] = useState<"all" | "published" | "draft" | "hidden">("all");
  const [faqPage, setFaqPage] = useState(1);

  // Blog sync state
  const [syncingFeed, setSyncingFeed] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<DeleteImpactItem | null>(null);

  const faqList = config.faq || [];
  const blog: BlogConfig = config.blog || {
    visible: true,
    feedUrl: "https://zekktech.biz.id",
    portalUrl: "https://zekktech.biz.id/blog",
    displayCount: 3,
    titleId: "Catatan & Tulisan Terpilih",
    titleEn: "Selected Articles & Logs",
    descId: "",
    descEn: "",
    sourceMode: "hybrid",
    manualPosts: [],
    syncedPosts: [],
    syncedOverrides: {},
  };
  const manualPosts = blog.manualPosts || [];
  const syncedPosts = blog.syncedPosts || [];
  const syncedOverrides = blog.syncedOverrides || {};
  const navList = config.navigation || [];
  const contactSection: ContactConfig = config.contactSection || {};
  const footer: FooterConfig = config.footer || {};

  // ===================== FAQ CRUD =====================
  const addFaq = () => {
    const newFaq: FaqItemConfig = {
      id: "faq-" + Date.now(),
      questionId: "Pertanyaan Baru",
      questionEn: "New Question",
      answerId: "Jawaban penjelasan ringkas dan informatif...",
      answerEn: "Concise and informative explanation answer...",
      category: "umum",
      published: true,
      visible: true,
      sortOrder: faqList.length + 1,
    };
    const nextList = [...faqList, newFaq];
    setFaqSearch("");
    setFaqCategoryFilter("all");
    setFaqStatusFilter("all");
    setFaqPage(Math.max(1, Math.ceil(nextList.length / FAQ_PAGE_SIZE)));
    setDraft({ ...config, faq: nextList });
    setStatus("Item FAQ baru ditambahkan ke draft");
  };

  const updateFaq = (id: string, updates: Partial<FaqItemConfig>) => {
    setDraft({
      ...config,
      faq: faqList.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
    setStatus("Data FAQ diperbarui");
  };

  const requestDeleteFaq = (item: FaqItemConfig) => {
    setPendingDelete({
      entityType: "Butir FAQ",
      itemName: item.questionId || item.questionEn || item.id,
      impacts: [
        "Menghapus pertanyaan ini dari seksi `#faq`.",
        "Menghapus entri FAQPage dari skema JSON-LD SEO.",
        "Menghilangkan referensi tanya-jawab ini dari asisten AI Buddy.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          faq: faqList.filter((f) => f.id !== item.id),
        });
        setPendingDelete(null);
        setStatus("Item FAQ dihapus");
      },
    });
  };

  const moveFaq = (id: string, direction: "up" | "down") => {
    const idx = faqList.findIndex((item) => item.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqList.length) return;
    setDraft({
      ...config,
      faq: reorderItemsWithSortOrder(faqList, idx, targetIdx),
    });
    setStatus("Urutan FAQ diubah");
  };

  const faqDrag = useDragReorder(faqList, (reordered) => {
    setDraft({ ...config, faq: reordered });
    setStatus("Urutan FAQ diperbarui (drag)");
  });

  const isFaqFiltered =
    faqSearch.trim() !== "" || faqCategoryFilter !== "all" || faqStatusFilter !== "all";
  const filteredFaq = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return faqList.filter((item) => {
      if (!matchesStatusFilter(item, faqStatusFilter)) return false;
      if (faqCategoryFilter !== "all" && (item.category || "umum") !== faqCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.questionId.toLowerCase().includes(q) ||
        item.answerId.toLowerCase().includes(q) ||
        (item.questionEn || "").toLowerCase().includes(q) ||
        (item.answerEn || "").toLowerCase().includes(q)
      );
    });
  }, [faqList, faqSearch, faqCategoryFilter, faqStatusFilter]);

  const faqTotalPages = Math.max(1, Math.ceil(filteredFaq.length / FAQ_PAGE_SIZE));
  const safeFaqPage = Math.min(faqPage, faqTotalPages);
  const pagedFaq = filteredFaq.slice((safeFaqPage - 1) * FAQ_PAGE_SIZE, safeFaqPage * FAQ_PAGE_SIZE);

  // ===================== BLOG SETTINGS, SYNC & MANUAL POSTS =====================
  const updateBlog = (updates: Partial<BlogConfig>) => {
    setDraft({
      ...config,
      blog: {
        ...blog,
        ...updates,
      },
    });
    setStatus("Pengaturan Blog diperbarui di draft");
  };

  const handleSyncBlogFeed = async () => {
    setSyncingFeed(true);
    setStatus("Menyinkronkan artikel terbaru dari portal blog...");
    try {
      const res = await fetch("/api/blog-feed?rawSync=1&refresh=1", { cache: "no-store" });
      if (!res.ok) {
        setStatus("Gagal menyinkronkan feed blog");
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setStatus("Respons feed blog tidak berbentuk array");
        return;
      }

      const incoming: ManualBlogPostConfig[] = data.map((p: Record<string, unknown>, idx: number) => {
        const postId = String(p.id || p.slug || `synced-${idx}`);
        const ov = syncedOverrides[postId];
        // Respect manuallyEdited overrides so sync never destroys curated admin edits
        return {
          id: postId,
          slug: String(p.slug || postId),
          title: ov?.manuallyEdited && ov.title ? ov.title : String(p.title || ""),
          excerpt: ov?.manuallyEdited && ov.excerpt ? ov.excerpt : String(p.excerpt || ""),
          coverImage:
            ov?.manuallyEdited && ov.coverImage !== undefined
              ? ov.coverImage
              : String(p.coverImage || ""),
          url: String(p.url || ""),
          category: String(p.category || "Teknologi"),
          date: String(p.publishedAt || p.date || ""),
          published: true,
          visible: ov?.hidden !== true,
          featured: ov?.featured ?? false,
          pinned: ov?.pinned ?? false,
          sortOrder: idx + 1,
        };
      });

      updateBlog({
        syncedPosts: incoming,
        lastSyncedAt: new Date().toISOString(),
      });
      setStatus(`Sinkronisasi selesai: ${incoming.length} artikel berhasil dimuat (override manual dipertahankan).`);
    } catch {
      setStatus("Gagal menghubungi feed blog eksternal");
    } finally {
      setSyncingFeed(false);
    }
  };

  const addManualPost = () => {
    const nextPost: ManualBlogPostConfig = {
      id: "post-" + Date.now(),
      slug: "artikel-baru-" + Date.now().toString().slice(-4),
      title: "Judul Artikel Manual Baru",
      titleEn: "New Manual Article Title",
      excerpt: "Ringkasan isi artikel teknis atau catatan desain...",
      excerptEn: "Summary of technical article or design notes...",
      coverImage: "",
      coverAlt: "",
      url: "https://zekktech.biz.id/blog",
      category: "Engineering",
      date: new Date().toISOString().slice(0, 10),
      readTime: "4 min read",
      featured: false,
      pinned: false,
      published: true,
      visible: true,
      sortOrder: manualPosts.length + 1,
    };
    updateBlog({ manualPosts: [...manualPosts, nextPost] });
  };

  const updateManualPost = (id: string, updates: Partial<ManualBlogPostConfig>) => {
    updateBlog({
      manualPosts: manualPosts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const moveManualPost = (idx: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= manualPosts.length) return;
    updateBlog({
      manualPosts: reorderItemsWithSortOrder(manualPosts, idx, targetIdx),
    });
  };

  const requestDeleteManualPost = (post: ManualBlogPostConfig) => {
    setPendingDelete({
      entityType: "Artikel Blog Manual",
      itemName: post.title || post.id,
      impacts: [
        "Menghapus artikel kurasi manual ini dari seksi Blog/Writing publik.",
        "Menghapus artikel ini dari sumber konteks jawaban AI Buddy.",
      ],
      onConfirm: () => {
        updateBlog({
          manualPosts: manualPosts.filter((p) => p.id !== post.id),
        });
        setPendingDelete(null);
        setStatus("Artikel manual dihapus");
      },
    });
  };

  const manualDrag = useDragReorder(manualPosts, (reordered) => {
    updateBlog({ manualPosts: reordered });
  });

  const updateSyncedOverride = (id: string, updates: Partial<SyncedBlogPostOverride>) => {
    const current = syncedOverrides[id] || { id };
    updateBlog({
      syncedOverrides: {
        ...syncedOverrides,
        [id]: {
          ...current,
          ...updates,
        },
      },
    });
  };

  const clearSyncedOverride = (id: string) => {
    const next = { ...syncedOverrides };
    delete next[id];
    updateBlog({ syncedOverrides: next });
    setStatus("Override artikel sinkron dikembalikan ke bawaan feed");
  };

  // ===================== NAVIGATION MENU CRUD =====================
  const addNavItem = () => {
    const nextNav: NavMenuItemConfig = {
      id: "nav-" + Date.now(),
      labelId: "Menu Baru",
      labelEn: "New Link",
      href: "#proyek",
      iconName: "folder",
      isExternal: false,
      visible: true,
      sortOrder: navList.length + 1,
    };
    setDraft({ ...config, navigation: [...navList, nextNav] });
    setStatus("Item navigasi ditambahkan ke draft");
  };

  const updateNavItem = (id: string, updates: Partial<NavMenuItemConfig>) => {
    setDraft({
      ...config,
      navigation: navList.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });
    setStatus("Menu navigasi diperbarui");
  };

  const moveNavItem = (idx: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= navList.length) return;
    setDraft({
      ...config,
      navigation: reorderItemsWithSortOrder(navList, idx, targetIdx),
    });
    setStatus("Urutan menu navigasi diubah");
  };

  const requestDeleteNavItem = (nav: NavMenuItemConfig) => {
    setPendingDelete({
      entityType: "Item Navigasi PillNav",
      itemName: `${nav.labelId} (${nav.href})`,
      impacts: [
        "Menghapus tautan ini dari bar navigasi melayang di seluruh situs publik.",
      ],
      onConfirm: () => {
        setDraft({
          ...config,
          navigation: navList.filter((n) => n.id !== nav.id),
        });
        setPendingDelete(null);
        setStatus("Item navigasi dihapus");
      },
    });
  };

  const navDrag = useDragReorder(navList, (reordered) => {
    setDraft({ ...config, navigation: reordered });
    setStatus("Urutan navigasi diperbarui (drag)");
  });

  // ===================== PAGE SECTIONS ORDER & META =====================
  const orderedSectionKeys: SectionKey[] = useMemo(() => {
    const allowedKeys = Object.keys(SECTION_LABELS) as SectionKey[];
    const fromOrder = (config.sectionOrder || []).filter((k): k is SectionKey =>
      allowedKeys.includes(k)
    );
    const missing = allowedKeys.filter((k) => !fromOrder.includes(k));
    const combined = [...fromOrder, ...missing];
    return combined.sort((a, b) => {
      const sa = config.sections?.[a]?.sortOrder ?? combined.indexOf(a);
      const sb = config.sections?.[b]?.sortOrder ?? combined.indexOf(b);
      return sa - sb;
    });
  }, [config.sectionOrder, config.sections]);

  const updateSectionConfig = (key: SectionKey, updates: Partial<SectionConfigItem>) => {
    const current: SectionConfigItem = config.sections?.[key] || { visible: true };
    setDraft({
      ...config,
      sections: {
        ...(config.sections || {}),
        [key]: {
          ...current,
          ...updates,
        },
      },
    });
    setStatus(`Pengaturan seksi '${SECTION_LABELS[key].name}' diperbarui`);
  };

  const moveSectionKey = (idx: number, dir: "up" | "down") => {
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= orderedSectionKeys.length) return;
    const nextOrder = [...orderedSectionKeys];
    const [moved] = nextOrder.splice(idx, 1);
    nextOrder.splice(targetIdx, 0, moved);

    const nextSections = { ...(config.sections || {}) };
    nextOrder.forEach((secKey, orderIdx) => {
      nextSections[secKey] = {
        ...(nextSections[secKey] || { visible: true }),
        sortOrder: orderIdx + 1,
      };
    });

    setDraft({
      ...config,
      sectionOrder: nextOrder,
      sections: nextSections,
    });
    setStatus("Urutan seksi halaman utama diperbarui");
  };

  // ===================== CONTACT & FOOTER =====================
  const updateContactSection = (updates: Partial<ContactConfig>) => {
    setDraft({
      ...config,
      contactSection: {
        ...contactSection,
        ...updates,
      },
    });
    setStatus("Konten seksi Kontak diperbarui");
  };

  const updateFooterConfig = (updates: Partial<FooterConfig>) => {
    setDraft({
      ...config,
      footer: {
        ...footer,
        ...updates,
      },
    });
    setStatus("Pengaturan Footer & Watermark diperbarui");
  };

  return (
    <div className="space-y-6">
      <ConfirmImpactModal pendingDelete={pendingDelete} onCancel={() => setPendingDelete(null)} />

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3">
        <button
          type="button"
          onClick={() => setSubTab("faq")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "faq"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <HelpCircle className="size-4" />
          <span>FAQ ({faqList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("blog")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "blog"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Newspaper className="size-4" />
          <span>Blog & Artikel ({manualPosts.length + syncedPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("navigation")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "navigation"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <Compass className="size-4" />
          <span>Menu Navigasi ({navList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("sections")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "sections"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <LayoutList className="size-4" />
          <span>Urutan & Seksi Halaman</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("contactFooter")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            subTab === "contactFooter"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface/60 text-muted hover:text-ink dark:bg-slate-900/60"
          }`}
        >
          <MessageSquare className="size-4" />
          <span>Kontak & Footer</span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: FAQ ===================== */}
      {subTab === "faq" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/50 p-4 dark:border-line/40 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-bold text-ink">Daftar Pertanyaan yang Sering Diajukan (FAQ)</h3>
              <p className="text-xs text-muted">
                Otomatis membangun skema FAQPage JSON-LD dan basis tanya-jawab AI Buddy
              </p>
            </div>
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              <Plus className="size-3.5" />
              <span>Tambah FAQ</span>
            </button>
          </div>

          <AdminSearchFilterBar
            search={faqSearch}
            onSearchChange={(val) => {
              setFaqSearch(val);
              setFaqPage(1);
            }}
            searchPlaceholder="Cari pertanyaan atau jawaban FAQ..."
            filterValue={faqCategoryFilter}
            onFilterChange={(val) => {
              setFaqCategoryFilter(val);
              setFaqPage(1);
            }}
            filterOptions={[
              { value: "all", label: "Semua Kategori" },
              { value: "umum", label: "Umum & Kolaborasi" },
              { value: "proses", label: "Proses & Revisi" },
              { value: "teknis", label: "Teknis & Stack" },
            ]}
            statusFilter={faqStatusFilter}
            onStatusFilterChange={(val) => {
              setFaqStatusFilter(val);
              setFaqPage(1);
            }}
            totalCount={faqList.length}
            filteredCount={filteredFaq.length}
          />

          {pagedFaq.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/80 p-8 text-center">
              <HelpCircle className="mx-auto mb-2 size-8 text-muted" />
              <p className="text-sm font-medium text-ink">Belum Ada Pertanyaan FAQ Sesuai Filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pagedFaq.map((item) => {
                const rawIndex = faqList.findIndex((f) => f.id === item.id);

                return (
                  <div
                    key={item.id}
                    {...(!isFaqFiltered ? faqDrag.getDragProps(rawIndex) : {})}
                    className={`rounded-2xl border bg-white p-5 transition dark:bg-[#0c0e17] ${
                      faqDrag.dragIndex === rawIndex
                        ? "border-brand opacity-70"
                        : "border-line dark:border-line/40"
                    }`}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">
                          {item.questionId || "Pertanyaan Baru"}
                        </span>
                        <select
                          value={item.category || "umum"}
                          onChange={(e) => updateFaq(item.id, { category: e.target.value })}
                          className="rounded-md border border-line bg-surface px-2 py-0.5 text-[10px] font-semibold text-body dark:border-line/40 dark:bg-slate-900"
                        >
                          <option value="umum">Umum</option>
                          <option value="proses">Proses & Revisi</option>
                          <option value="teknis">Teknis</option>
                        </select>
                      </div>

                      <AdminItemActionBar
                        published={item.published}
                        visible={item.visible}
                        onTogglePublished={() =>
                          updateFaq(item.id, { published: item.published === false })
                        }
                        onToggleVisible={() =>
                          updateFaq(item.id, { visible: item.visible === false })
                        }
                        onMoveUp={() => moveFaq(item.id, "up")}
                        onMoveDown={() => moveFaq(item.id, "down")}
                        disableMoveUp={isFaqFiltered || rawIndex <= 0}
                        disableMoveDown={isFaqFiltered || rawIndex >= faqList.length - 1}
                        onDelete={() => requestDeleteFaq(item)}
                        dragHandleProps={!isFaqFiltered ? faqDrag.getHandleProps(rawIndex) : undefined}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted">
                            Pertanyaan (Bahasa Indonesia) *
                          </label>
                          <input
                            type="text"
                            value={item.questionId}
                            onChange={(e) => updateFaq(item.id, { questionId: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted">
                            Jawaban (Bahasa Indonesia) *
                          </label>
                          <textarea
                            rows={3}
                            value={item.answerId}
                            onChange={(e) => updateFaq(item.id, { answerId: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted">
                            Question (English)
                          </label>
                          <input
                            type="text"
                            value={item.questionEn || ""}
                            onChange={(e) => updateFaq(item.id, { questionEn: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted">
                            Answer (English)
                          </label>
                          <textarea
                            rows={3}
                            value={item.answerEn || ""}
                            onChange={(e) => updateFaq(item.id, { answerEn: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPaginationBar
            page={safeFaqPage}
            totalPages={faqTotalPages}
            onPageChange={setFaqPage}
          />
        </div>
      )}

      {/* ===================== SUBTAB 2: BLOG & ARTIKEL ===================== */}
      {subTab === "blog" && (
        <div className="space-y-6">
          {/* Blog Configuration Card */}
          <div className="rounded-2xl border border-line/70 bg-surface/50 p-5 dark:border-line/40 dark:bg-slate-900/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Pengaturan Sumber & Seksi Blog</h3>
                <p className="text-xs text-muted">
                  Pilih mode sumber (`hybrid`, `synced`, atau `manual`), kelola sinkronisasi RSS/JSON eksternal dan artikel kurasi manual
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink dark:border-line/40 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={blog.published !== false}
                    onChange={(e) => updateBlog({ published: e.target.checked })}
                    className="size-3.5 rounded text-emerald-600"
                  />
                  <span>Published</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink dark:border-line/40 dark:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={blog.visible !== false}
                    onChange={(e) => updateBlog({ visible: e.target.checked })}
                    className="size-3.5 rounded text-brand"
                  />
                  <span>Tampilkan Seksi</span>
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Mode Sumber Artikel</label>
                <select
                  value={blog.sourceMode || "hybrid"}
                  onChange={(e) =>
                    updateBlog({ sourceMode: e.target.value as BlogConfig["sourceMode"] })
                  }
                  className={inputClass}
                >
                  <option value="hybrid">Hybrid (Manual + Sinkron)</option>
                  <option value="synced">Synced (Feed Eksternal + Override)</option>
                  <option value="manual">Manual Saja (Artikel Lokal CMS)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">URL Feed / API Sumber</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 size-4 text-muted" />
                  <input
                    type="url"
                    value={blog.feedUrl || ""}
                    onChange={(e) => updateBlog({ feedUrl: e.target.value })}
                    className={`${inputClass} pl-9`}
                    placeholder="https://zekktech.biz.id"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">URL Portal Lengkap (CTA)</label>
                <input
                  type="url"
                  value={blog.portalUrl || ""}
                  onChange={(e) => updateBlog({ portalUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://zekktech.biz.id/blog"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Jumlah Artikel Ditampilkan</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={blog.displayCount || 3}
                  onChange={(e) => updateBlog({ displayCount: parseInt(e.target.value, 10) || 3 })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Label Tombol Semua Artikel (ID)</label>
                <input
                  type="text"
                  value={blog.ctaLabelId || ""}
                  onChange={(e) => updateBlog({ ctaLabelId: e.target.value })}
                  className={inputClass}
                  placeholder="Lihat Semua Artikel"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">All Posts Button Label (EN)</label>
                <input
                  type="text"
                  value={blog.ctaLabelEn || ""}
                  onChange={(e) => updateBlog({ ctaLabelEn: e.target.value })}
                  className={inputClass}
                  placeholder="View All Articles"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Judul Seksi (ID)</label>
                <input
                  type="text"
                  value={blog.titleId || ""}
                  onChange={(e) => updateBlog({ titleId: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Section Title (EN)</label>
                <input
                  type="text"
                  value={blog.titleEn || ""}
                  onChange={(e) => updateBlog({ titleEn: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Sinkronisasi Terakhir</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={syncingFeed}
                    onClick={handleSyncBlogFeed}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-ink disabled:opacity-60"
                  >
                    <RefreshCw className={`size-3.5 ${syncingFeed ? "animate-spin" : ""}`} />
                    <span>{syncingFeed ? "Menyinkronkan..." : "Sinkronkan Feed Sekarang"}</span>
                  </button>
                </div>
                {blog.lastSyncedAt && (
                  <p className="mt-1 font-mono text-[10px] text-muted">
                    Sync terakhir: {new Date(blog.lastSyncedAt).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Manual Posts CRUD */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-display text-sm font-bold text-ink">
                  Artikel Manual / Kurasi CMS ({manualPosts.length})
                </h4>
                <p className="text-xs text-muted">
                  Tulis atau tautkan artikel pilihan secara manual beserta cover, kategori, dan status unggulan
                </p>
              </div>
              <button
                type="button"
                onClick={addManualPost}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-ink"
              >
                <Plus className="size-3.5" />
                <span>Tambah Artikel Manual</span>
              </button>
            </div>

            {manualPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted dark:border-line/40">
                Belum ada artikel manual.
              </div>
            ) : (
              <div className="space-y-4">
                {manualPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    {...manualDrag.getDragProps(idx)}
                    className="rounded-2xl border border-line bg-white p-4 dark:border-line/40 dark:bg-[#0c0e17]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 dark:border-line/40">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-ink">
                          {post.title || "Artikel Baru"}
                        </span>
                        {post.pinned && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                            Pinned
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(post.pinned)}
                            onChange={(e) => updateManualPost(post.id, { pinned: e.target.checked })}
                            className="size-3.5 rounded text-blue-600"
                          />
                          <Pin className="size-3 text-blue-600" />
                          <span>Pin</span>
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(post.featured)}
                            onChange={(e) => updateManualPost(post.id, { featured: e.target.checked })}
                            className="size-3.5 rounded text-amber-500"
                          />
                          <Star className="size-3 text-amber-500" />
                          <span>Unggulan</span>
                        </label>

                        <AdminItemActionBar
                          published={post.published}
                          visible={post.visible}
                          onTogglePublished={() =>
                            updateManualPost(post.id, { published: post.published === false })
                          }
                          onToggleVisible={() =>
                            updateManualPost(post.id, { visible: post.visible === false })
                          }
                          onMoveUp={() => moveManualPost(idx, "up")}
                          onMoveDown={() => moveManualPost(idx, "down")}
                          disableMoveUp={idx === 0}
                          disableMoveDown={idx >= manualPosts.length - 1}
                          onDelete={() => requestDeleteManualPost(post)}
                          dragHandleProps={manualDrag.getHandleProps(idx)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink">Judul Artikel (ID) *</label>
                        <input
                          type="text"
                          value={post.title}
                          onChange={(e) => updateManualPost(post.id, { title: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink">Article Title (EN)</label>
                        <input
                          type="text"
                          value={post.titleEn || ""}
                          onChange={(e) => updateManualPost(post.id, { titleEn: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink">URL Artikel *</label>
                        <input
                          type="url"
                          value={post.url}
                          onChange={(e) => updateManualPost(post.id, { url: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="https://zekktech.biz.id/post/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink">Kategori</label>
                        <input
                          type="text"
                          value={post.category || ""}
                          onChange={(e) => updateManualPost(post.id, { category: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="UI/UX / Engineering"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink">Tanggal Terbit</label>
                        <input
                          type="text"
                          value={post.date || ""}
                          onChange={(e) => updateManualPost(post.id, { date: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                          placeholder="2026-05-01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink">Alt Text Gambar Cover</label>
                        <input
                          type="text"
                          value={post.coverAlt || ""}
                          onChange={(e) => updateManualPost(post.id, { coverAlt: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <MediaFieldControl
                          label="Cover Artikel"
                          value={post.coverImage || ""}
                          onChange={(url) => updateManualPost(post.id, { coverImage: url })}
                          folder="blog"
                          fieldKey={`blog-cov-${post.id}`}
                          uploadAndSet={uploadAndSet}
                          uploadingImage={uploadingImage}
                          config={config}
                          accept="image/webp,image/png,image/jpeg"
                          previewShape="wide"
                        />
                      </div>
                      <div className="sm:col-span-1 lg:col-span-1.5">
                        <label className="block text-xs font-semibold text-ink">Ringkasan (ID)</label>
                        <textarea
                          rows={2}
                          value={post.excerpt || ""}
                          onChange={(e) => updateManualPost(post.id, { excerpt: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                      <div className="sm:col-span-1 lg:col-span-2">
                        <label className="block text-xs font-semibold text-ink">Excerpt (EN)</label>
                        <textarea
                          rows={2}
                          value={post.excerptEn || ""}
                          onChange={(e) => updateManualPost(post.id, { excerptEn: e.target.value })}
                          className={`mt-1 ${inputClass}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Synced Posts & Override Protection Manager */}
          {syncedPosts.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-line bg-surface/40 p-5 dark:border-line/40 dark:bg-slate-900/30">
              <div>
                <h4 className="font-display text-sm font-bold text-ink">
                  Artikel Tersinkron & Perlindungan Override ({syncedPosts.length})
                </h4>
                <p className="text-xs text-muted">
                  Tandai artikel sebagai tersembunyi, pin ke atas, atau kunci editan manual agar tidak tertimpa saat tombol Sinkronkan dijalankan kembali
                </p>
              </div>

              <div className="space-y-3">
                {syncedPosts.map((sp) => {
                  const ov = syncedOverrides[sp.id];
                  const isHidden = ov?.hidden === true;
                  const isLocked = ov?.manuallyEdited === true;

                  return (
                    <div
                      key={sp.id}
                      className="rounded-xl border border-line bg-white p-3.5 dark:border-line/40 dark:bg-[#0c0e17] space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-ink">
                            {ov?.title || sp.title}
                          </span>
                          <p className="font-mono text-[10px] text-muted">{sp.url}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[11px]">
                            <input
                              type="checkbox"
                              checked={isLocked}
                              onChange={(e) =>
                                updateSyncedOverride(sp.id, { manuallyEdited: e.target.checked })
                              }
                              className="size-3 rounded text-brand"
                            />
                            <span>Kunci Edit Manual</span>
                          </label>
                          <label className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[11px]">
                            <input
                              type="checkbox"
                              checked={Boolean(ov?.pinned)}
                              onChange={(e) =>
                                updateSyncedOverride(sp.id, {
                                  pinned: e.target.checked,
                                  manuallyEdited: true,
                                })
                              }
                              className="size-3 rounded text-blue-600"
                            />
                            <span>Pin</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => updateSyncedOverride(sp.id, { hidden: !isHidden })}
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                              isHidden
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}
                          >
                            {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                            <span>{isHidden ? "Disembunyikan" : "Tampil"}</span>
                          </button>
                          {ov && (
                            <button
                              type="button"
                              onClick={() => clearSyncedOverride(sp.id)}
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted hover:text-ink"
                              title="Reset override"
                            >
                              <RotateCcw className="size-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={ov?.title ?? sp.title}
                          onChange={(e) =>
                            updateSyncedOverride(sp.id, {
                              title: e.target.value,
                              manuallyEdited: true,
                            })
                          }
                          className={inputClass}
                          placeholder="Judul override..."
                        />
                        <input
                          type="text"
                          value={ov?.coverImage ?? (sp.coverImage || "")}
                          onChange={(e) =>
                            updateSyncedOverride(sp.id, {
                              coverImage: e.target.value,
                              manuallyEdited: true,
                            })
                          }
                          className={inputClass}
                          placeholder="URL cover override..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== SUBTAB 3: NAVIGATION MENU ===================== */}
      {subTab === "navigation" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/70 bg-surface/50 p-4 dark:border-line/40 dark:bg-slate-900/40">
            <div>
              <h3 className="text-sm font-bold text-ink">Manajemen Menu Navigasi (PillNav)</h3>
              <p className="text-xs text-muted">
                Ubah label ID/EN, ikon menu, urutan, atau tambah tautan bagian/eksternal dengan validasi target
              </p>
            </div>
            <button
              type="button"
              onClick={addNavItem}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-ink"
            >
              <Plus className="size-3.5" />
              <span>Tambah Menu</span>
            </button>
          </div>

          <div className="space-y-3">
            {navList.map((nav, idx) => {
              const targetValid = isNavTargetValid(nav.href, nav.isExternal);

              return (
                <div
                  key={nav.id}
                  {...navDrag.getDragProps(idx)}
                  className="rounded-2xl border border-line bg-white p-4 dark:border-line/40 dark:bg-[#0c0e17]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 dark:border-line/40">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-ink">
                        {nav.labelId}
                      </span>
                      <span className="font-mono text-xs text-muted">{nav.href}</span>
                      {targetValid ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                          <AlertCircle className="size-3" /> Target tidak dikenal
                        </span>
                      )}
                    </div>

                    <AdminItemActionBar
                      visible={nav.visible}
                      onToggleVisible={() => updateNavItem(nav.id, { visible: nav.visible === false })}
                      onMoveUp={() => moveNavItem(idx, "up")}
                      onMoveDown={() => moveNavItem(idx, "down")}
                      disableMoveUp={idx === 0}
                      disableMoveDown={idx >= navList.length - 1}
                      onDelete={() => requestDeleteNavItem(nav)}
                      dragHandleProps={navDrag.getHandleProps(idx)}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-ink">Label (ID)</label>
                      <input
                        type="text"
                        value={nav.labelId}
                        onChange={(e) => updateNavItem(nav.id, { labelId: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink">Label (EN)</label>
                      <input
                        type="text"
                        value={nav.labelEn}
                        onChange={(e) => updateNavItem(nav.id, { labelEn: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink">Target / Anchor</label>
                      <input
                        type="text"
                        value={nav.href}
                        onChange={(e) => updateNavItem(nav.id, { href: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                        placeholder="#tentang / #proyek / https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink">Ikon</label>
                      <select
                        value={nav.iconName || "user"}
                        onChange={(e) => updateNavItem(nav.id, { iconName: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      >
                        <option value="user">User (Tentang)</option>
                        <option value="file">File (CV)</option>
                        <option value="layers">Layers (Stack)</option>
                        <option value="folder">Folder (Proyek)</option>
                        <option value="mail">Mail (Kontak)</option>
                        <option value="award">Award (Sertifikat)</option>
                        <option value="briefcase">Briefcase (Layanan/Karier)</option>
                        <option value="graduation">Graduation (Akademik)</option>
                        <option value="newspaper">Newspaper (Blog)</option>
                        <option value="help">Help (FAQ)</option>
                        <option value="globe">Globe (External)</option>
                      </select>
                    </div>
                    <label className="inline-flex items-center gap-2 pb-2 text-xs font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={Boolean(nav.isExternal)}
                        onChange={(e) => updateNavItem(nav.id, { isExternal: e.target.checked })}
                        className="size-4 rounded text-brand"
                      />
                      <span>Tautan Eksternal</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 4: PAGE SECTIONS MANAGER ===================== */}
      {subTab === "sections" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line/70 bg-surface/50 p-4 dark:border-line/40 dark:bg-slate-900/40">
            <h3 className="text-sm font-bold text-ink">Pengelola Urutan, Visibilitas & Judul Seksi</h3>
            <p className="text-xs text-muted">
              Atur susunan tampil vertikal seluruh seksi halaman utama serta sesuaikan judul & subjudul ID/EN (mengikuti konvensi portofolio personal)
            </p>
          </div>

          <div className="space-y-3">
            {orderedSectionKeys.map((key, idx) => {
              const meta: SectionConfigItem = config.sections?.[key] || { visible: true };
              const info = SECTION_LABELS[key];

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-line bg-white p-4 dark:border-line/40 dark:bg-[#0c0e17]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 dark:border-line/40">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-brand/10 font-mono text-xs font-bold text-brand">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-display text-sm font-bold text-ink">{info.name}</span>
                        <span className="ml-2 font-mono text-[10px] text-muted">{info.anchors}</span>
                      </div>
                    </div>

                    <AdminItemActionBar
                      visible={meta.visible !== false}
                      onToggleVisible={() => updateSectionConfig(key, { visible: meta.visible === false })}
                      onMoveUp={() => moveSectionKey(idx, "up")}
                      onMoveDown={() => moveSectionKey(idx, "down")}
                      disableMoveUp={idx === 0}
                      disableMoveDown={idx >= orderedSectionKeys.length - 1}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Eyebrow (ID)</label>
                      <input
                        type="text"
                        value={meta.eyebrowId || ""}
                        onChange={(e) => updateSectionConfig(key, { eyebrowId: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Judul Seksi (ID)</label>
                      <input
                        type="text"
                        value={meta.titleId || ""}
                        onChange={(e) => updateSectionConfig(key, { titleId: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Subjudul / Deskripsi (ID)</label>
                      <input
                        type="text"
                        value={meta.descId || ""}
                        onChange={(e) => updateSectionConfig(key, { descId: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Eyebrow (EN)</label>
                      <input
                        type="text"
                        value={meta.eyebrowEn || ""}
                        onChange={(e) => updateSectionConfig(key, { eyebrowEn: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Section Title (EN)</label>
                      <input
                        type="text"
                        value={meta.titleEn || ""}
                        onChange={(e) => updateSectionConfig(key, { titleEn: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted">Subtitle / Description (EN)</label>
                      <input
                        type="text"
                        value={meta.descEn || ""}
                        onChange={(e) => updateSectionConfig(key, { descEn: e.target.value })}
                        className={`mt-1 ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 5: CONTACT & FOOTER ===================== */}
      {subTab === "contactFooter" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5 dark:border-line/40 dark:bg-[#0c0e17] space-y-4">
            <h3 className="font-display text-sm font-bold text-ink border-b border-line pb-2.5 dark:border-line/40">
              Konten Seksi Kontak (`#kontak`)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Badge Seksi (ID)</label>
                <input
                  type="text"
                  value={contactSection.badgeId || ""}
                  onChange={(e) => updateContactSection({ badgeId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Section Badge (EN)</label>
                <input
                  type="text"
                  value={contactSection.badgeEn || ""}
                  onChange={(e) => updateContactSection({ badgeEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Judul Utama (ID)</label>
                <input
                  type="text"
                  value={contactSection.titleId || ""}
                  onChange={(e) => updateContactSection({ titleId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Mari Berkolaborasi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Heading (EN)</label>
                <input
                  type="text"
                  value={contactSection.titleEn || ""}
                  onChange={(e) => updateContactSection({ titleEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Start a Conversation"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Deskripsi Ajakan (ID)</label>
                <textarea
                  rows={2}
                  value={contactSection.descId || ""}
                  onChange={(e) => updateContactSection({ descId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Description (EN)</label>
                <textarea
                  rows={2}
                  value={contactSection.descEn || ""}
                  onChange={(e) => updateContactSection({ descEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Label Tombol Utama (ID)</label>
                <input
                  type="text"
                  value={contactSection.emailCtaId || ""}
                  onChange={(e) => updateContactSection({ emailCtaId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Kirim Email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Primary Button (EN)</label>
                <input
                  type="text"
                  value={contactSection.emailCtaEn || ""}
                  onChange={(e) => updateContactSection({ emailCtaEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Send Email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Label Tombol Sekunder (ID)</label>
                <input
                  type="text"
                  value={contactSection.secondaryCtaId || ""}
                  onChange={(e) => updateContactSection({ secondaryCtaId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Berkas CV"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Secondary Button (EN)</label>
                <input
                  type="text"
                  value={contactSection.secondaryCtaEn || ""}
                  onChange={(e) => updateContactSection({ secondaryCtaEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Career Files"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-ink pt-1">
              <input
                type="checkbox"
                checked={contactSection.showProfileCard !== false}
                onChange={(e) => updateContactSection({ showProfileCard: e.target.checked })}
                className="size-4 rounded text-brand"
              />
              <span>Tampilkan Hologram Profile Card di Seksi Kontak</span>
            </label>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 dark:border-line/40 dark:bg-[#0c0e17] space-y-4">
            <h3 className="font-display text-sm font-bold text-ink border-b border-line pb-2.5 dark:border-line/40">
              Footer, Hak Cipta & Watermark Pixel (`zakaria mp`)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Tagline Footer (ID)</label>
                <input
                  type="text"
                  value={footer.taglineId || ""}
                  onChange={(e) => updateFooterConfig({ taglineId: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Footer Tagline (EN)</label>
                <input
                  type="text"
                  value={footer.taglineEn || ""}
                  onChange={(e) => updateFooterConfig({ taglineEn: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Nama Pemilik Hak Cipta</label>
                <input
                  type="text"
                  value={footer.copyrightName || ""}
                  onChange={(e) => updateFooterConfig({ copyrightName: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Zakaria Mujur Prasetyo"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Label Tautan Email Langsung</label>
                <input
                  type="text"
                  value={footer.directEmailLabel || ""}
                  onChange={(e) => updateFooterConfig({ directEmailLabel: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="zakariamujur6@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Teks Watermark Bawah (Font Pixel)</label>
                <input
                  type="text"
                  value={footer.watermarkText ?? "zakaria mp"}
                  onChange={(e) => updateFooterConfig({ watermarkText: e.target.value })}
                  className={`mt-1 ${inputClass}`}
                  placeholder="zakaria mp"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={footer.showWatermark !== false}
                    onChange={(e) => updateFooterConfig({ showWatermark: e.target.checked })}
                    className="size-4 rounded text-brand"
                  />
                  <span>Tampilkan Watermark Pixel Gradien Biru</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TabContent;
