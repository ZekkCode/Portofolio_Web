import type { SiteConfig, TechStackCategoryConfig, TechStackItem } from "@/lib/site-config";

export type TechStackCategoryLocale = "id" | "en";

export const TECH_STACK_FALLBACK_CATEGORY_KEY = "other";

export const TECH_STACK_FALLBACK_CATEGORY_LABEL: Readonly<Record<TechStackCategoryLocale, string>> = {
  id: "Perangkat Lainnya",
  en: "Other Tools",
};

export const DEFAULT_TECH_STACK_CATEGORIES: TechStackCategoryConfig[] = [
  { key: "uiux", labelId: "UI/UX & Desain", labelEn: "UI/UX & Design", sortOrder: 1, visible: true },
  { key: "frontend", labelId: "Frontend Web", labelEn: "Frontend Web", sortOrder: 2, visible: true },
  { key: "visual", labelId: "Desain Grafis / Media", labelEn: "Visual & Media", sortOrder: 3, visible: true },
  { key: "systems", labelId: "Sistem & Basis Data", labelEn: "Systems & Databases", sortOrder: 4, visible: true },
];

/**
 * Pemetaan kompatibilitas ID lama -> ID kanonik master kategori (hanya berbasis ID, bukan label terjemahan).
 * Digunakan saat skema lama/default memakai `uiux` sementara master kategori aktif memakai `design` (atau sebaliknya).
 */
export const LEGACY_TECH_STACK_CATEGORY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  uiux: ["design"],
  design: ["uiux"],
};

export type TechStackCategoryResolutionType = "exact" | "alias_migrated" | "unknown";

export type ResolvedTechStackCategory = {
  matchedCategory: TechStackCategoryConfig | null;
  resolvedKey: string | null;
  rawKey: string;
  resolutionType: TechStackCategoryResolutionType;
  matchedAliasFrom?: string;
};

export type TechStackGridGroup = {
  key: string;
  category: string;
  tools: TechStackItem[];
  isFallback?: boolean;
};

function cloneDefaultTechStackCategories(): TechStackCategoryConfig[] {
  return DEFAULT_TECH_STACK_CATEGORIES.map((c) => ({ ...c }));
}

function sortByOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  return [...items]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => (a.item.sortOrder ?? a.idx + 1) - (b.item.sortOrder ?? b.idx + 1))
    .map(({ item }) => item);
}

/**
 * Menormalisasi master kategori Tech Stack dengan mempertahankan `id`, memotong spasi `key`,
 * menghilangkan duplikasi ID (case-insensitive), dan fallback ke default hanya bila daftar kosong/tidak valid.
 */
export function normalizeTechStackCategories(
  rawCategories: unknown
): TechStackCategoryConfig[] {
  if (!Array.isArray(rawCategories)) {
    return cloneDefaultTechStackCategories();
  }

  const seenKeys = new Set<string>();
  const normalized: TechStackCategoryConfig[] = [];

  for (let idx = 0; idx < rawCategories.length; idx++) {
    const candidate = rawCategories[idx] as Partial<TechStackCategoryConfig> | null | undefined;
    if (!candidate || typeof candidate !== "object" || typeof candidate.key !== "string") {
      continue;
    }

    const key = candidate.key.trim();
    if (!key) continue;

    const lowerKey = key.toLowerCase();
    if (seenKeys.has(lowerKey)) continue;
    seenKeys.add(lowerKey);

    const id =
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id.trim()
        : undefined;
    const rawLabelId = typeof candidate.labelId === "string" ? candidate.labelId.trim() : "";
    const rawLabelEn = typeof candidate.labelEn === "string" ? candidate.labelEn.trim() : "";

    normalized.push({
      ...(id ? { id } : {}),
      key,
      labelId: rawLabelId || rawLabelEn || key,
      labelEn: rawLabelEn || rawLabelId || key,
      sortOrder: typeof candidate.sortOrder === "number" ? candidate.sortOrder : normalized.length + 1,
      visible: candidate.visible !== false,
    });
  }

  return normalized.length > 0 ? normalized : cloneDefaultTechStackCategories();
}

/**
 * Mengembalikan daftar master kategori Tech Stack aktif yang konsisten untuk Admin maupun Frontend.
 */
export function getTechStackCategoryMasterList(
  categories?: TechStackCategoryConfig[]
): TechStackCategoryConfig[] {
  return sortByOrder(normalizeTechStackCategories(categories));
}

/**
 * Mencocokkan ID kategori item Tech Stack terhadap master kategori aktif:
 * 1. Pencocokan ID persis (selalu menang bila kedua ID ada di master).
 * 2. Pencocokan ID case-insensitive (hanya terhadap ID `key`, bukan label).
 * 3. Kompatibilitas ID lama eksplisit (`LEGACY_TECH_STACK_CATEGORY_ALIASES`).
 * 4. Kategori yang tidak cocok dikembalikan sebagai `unknown` tanpa dipaksa masuk kategori lain.
 */
export function resolveTechStackCategoryMatch(
  rawCategory: unknown,
  masterCategories: TechStackCategoryConfig[]
): ResolvedTechStackCategory {
  const rawKey = typeof rawCategory === "string" ? rawCategory.trim() : "";
  if (!rawKey) {
    return {
      matchedCategory: null,
      resolvedKey: null,
      rawKey: "",
      resolutionType: "unknown",
    };
  }

  const exactMatch = masterCategories.find((c) => c.key === rawKey);
  if (exactMatch) {
    return {
      matchedCategory: exactMatch,
      resolvedKey: exactMatch.key,
      rawKey,
      resolutionType: "exact",
    };
  }

  const lowerRaw = rawKey.toLowerCase();
  const caseInsensitiveMatch = masterCategories.find(
    (c) => c.key.toLowerCase() === lowerRaw
  );
  if (caseInsensitiveMatch) {
    return {
      matchedCategory: caseInsensitiveMatch,
      resolvedKey: caseInsensitiveMatch.key,
      rawKey,
      resolutionType: "alias_migrated",
      matchedAliasFrom: rawKey,
    };
  }

  const aliasCandidates = LEGACY_TECH_STACK_CATEGORY_ALIASES[lowerRaw] || [];
  for (const candidateKey of aliasCandidates) {
    const aliasMatch = masterCategories.find(
      (c) => c.key.toLowerCase() === candidateKey.toLowerCase()
    );
    if (aliasMatch) {
      return {
        matchedCategory: aliasMatch,
        resolvedKey: aliasMatch.key,
        rawKey,
        resolutionType: "alias_migrated",
        matchedAliasFrom: rawKey,
      };
    }
  }

  return {
    matchedCategory: null,
    resolvedKey: null,
    rawKey,
    resolutionType: "unknown",
  };
}

export function resolveTechStackCategoryKey(
  rawCategory: unknown,
  masterCategories: TechStackCategoryConfig[]
): string | null {
  return resolveTechStackCategoryMatch(rawCategory, masterCategories).resolvedKey;
}

/**
 * Mengambil label ID/EN secara konsisten dari entri master kategori Tech Stack.
 */
export function getTechStackCategoryLabel(
  category: Pick<TechStackCategoryConfig, "key" | "labelId" | "labelEn">,
  locale: TechStackCategoryLocale = "id"
): string {
  if (locale === "en") {
    return category.labelEn?.trim() || category.labelId?.trim() || category.key;
  }
  return category.labelId?.trim() || category.labelEn?.trim() || category.key;
}

export function getOtherToolsCategoryLabel(locale: TechStackCategoryLocale = "id"): string {
  return TECH_STACK_FALLBACK_CATEGORY_LABEL[locale];
}

/**
 * Menormalisasi item Tech Stack sekaligus memigrasikan ID kategori lama secara eksplisit
 * ke ID master yang cocok tanpa merusak ID item maupun kategori kustom / tidak dikenal.
 */
export function normalizeTechStackItems(
  rawItems: unknown,
  masterCategories: TechStackCategoryConfig[],
  fallbackItems: TechStackItem[] = []
): TechStackItem[] {
  const source = Array.isArray(rawItems) ? rawItems : fallbackItems;
  return source
    .filter((t): t is TechStackItem => Boolean(t && typeof t === "object" && typeof t.id === "string"))
    .map((t, idx) => {
      const match = resolveTechStackCategoryMatch(t.category, masterCategories);
      const nextCategory = match.resolvedKey ?? match.rawKey;

      return {
        id: t.id,
        name: typeof t.name === "string" ? t.name : "Tool",
        category: nextCategory,
        icon: typeof t.icon === "string" ? t.icon : "/icons/nextjs.svg",
        url: typeof t.url === "string" ? t.url : undefined,
        desc: typeof t.desc === "string" ? t.desc : undefined,
        descEn: typeof t.descEn === "string" ? t.descEn : undefined,
        sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : idx + 1,
        visible: t.visible !== false,
        published: t.published !== false,
        showInMarquee: t.showInMarquee !== false,
        showInGrid: t.showInGrid !== false,
      };
    });
}

/**
 * Mengelompokkan item Tech Stack publik untuk tampilan grid frontend berdasarkan ID master kategori.
 * - Menggunakan ID kategori aktif (termasuk kompatibilitas ID lama yang dipetakan).
 * - Mempertahankan urutan kategori (`sortOrder`), visibilitas kategori (`visible !== false`), dan visibilitas item (`showInGrid`).
 * - Item dari kategori yang sengaja disembunyikan (`visible: false`) tidak dibocorkan ke fallback.
 * - Hanya item dengan kategori yang benar-benar tidak dikenal yang masuk ke kelompok fallback ("Perangkat Lainnya" / "Other Tools").
 */
export function groupTechStackForPublicGrid(
  config: Partial<SiteConfig> | undefined,
  gridTools: TechStackItem[],
  locale: TechStackCategoryLocale = "id",
  otherLabelOverride?: string
): TechStackGridGroup[] {
  const masterCategories = getTechStackCategoryMasterList(config?.techStackCategories);

  const grouped: TechStackGridGroup[] = [];
  for (const cat of masterCategories) {
    const tools = gridTools.filter(
      (tool) => resolveTechStackCategoryMatch(tool.category, masterCategories).resolvedKey === cat.key
    );
    if (cat.visible !== false && tools.length > 0) {
      grouped.push({
        key: cat.key,
        category: getTechStackCategoryLabel(cat, locale),
        tools,
      });
    }
  }

  const unknowns = gridTools.filter(
    (tool) => resolveTechStackCategoryMatch(tool.category, masterCategories).resolutionType === "unknown"
  );
  if (unknowns.length > 0) {
    grouped.push({
      key: TECH_STACK_FALLBACK_CATEGORY_KEY,
      category: otherLabelOverride?.trim() || getOtherToolsCategoryLabel(locale),
      tools: unknowns,
      isFallback: true,
    });
  }

  return grouped;
}

/**
 * Mengubah ID (`key`) kategori di admin secara aman sekaligus menyinkronkan seluruh item Tech Stack terkait
 * tanpa menyentuh relasi `techIds` proyek (yang merujuk pada `tool.id`).
 */
export function renameTechStackCategoryKeyInDraft(
  config: SiteConfig,
  targetIdOrKey: string,
  nextRawKey: string
): {
  ok: boolean;
  error?: string;
  migratedCount: number;
  oldKey?: string;
  newKey?: string;
  nextConfig: SiteConfig;
} {
  const categories =
    Array.isArray(config.techStackCategories) && config.techStackCategories.length > 0
      ? config.techStackCategories
      : cloneDefaultTechStackCategories();

  const targetCat = categories.find((c) => (c.id || c.key) === targetIdOrKey);
  if (!targetCat) {
    return {
      ok: false,
      error: "Kategori tidak ditemukan.",
      migratedCount: 0,
      nextConfig: config,
    };
  }

  const oldKey = targetCat.key;
  const nextKey = nextRawKey.trim();
  if (!nextKey) {
    return {
      ok: false,
      error: "ID kategori tidak boleh kosong.",
      migratedCount: 0,
      oldKey,
      nextConfig: config,
    };
  }

  if (nextKey.toLowerCase() === TECH_STACK_FALLBACK_CATEGORY_KEY) {
    return {
      ok: false,
      error: `ID '${TECH_STACK_FALLBACK_CATEGORY_KEY}' dicadangkan untuk kategori fallback sistem.`,
      migratedCount: 0,
      oldKey,
      nextConfig: config,
    };
  }

  if (nextKey === oldKey) {
    return {
      ok: true,
      migratedCount: 0,
      oldKey,
      newKey: nextKey,
      nextConfig: config,
    };
  }

  const duplicate = categories.find(
    (c) => (c.id || c.key) !== targetIdOrKey && c.key.toLowerCase() === nextKey.toLowerCase()
  );
  if (duplicate) {
    return {
      ok: false,
      error: `ID kategori '${nextKey}' sudah digunakan oleh kategori '${duplicate.labelId || duplicate.key}'.`,
      migratedCount: 0,
      oldKey,
      nextConfig: config,
    };
  }

  let migratedCount = 0;
  const nextTechStack = (config.techStack || []).map((tool) => {
    const match = resolveTechStackCategoryMatch(tool.category, categories);
    if (match.resolvedKey === oldKey) {
      migratedCount++;
      return { ...tool, category: nextKey };
    }
    return tool;
  });

  const nextCategories = categories.map((c) =>
    (c.id || c.key) === targetIdOrKey ? { ...c, key: nextKey } : c
  );

  return {
    ok: true,
    migratedCount,
    oldKey,
    newKey: nextKey,
    nextConfig: {
      ...config,
      techStackCategories: nextCategories,
      techStack: nextTechStack,
    },
  };
}
