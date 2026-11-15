import type { ExperienceItem, SiteConfig } from "@/lib/site-config";

export const EXPERIENCE_MONTH_COUNTING_RULE_ID = "inclusive_calendar_months" as const;
export const EXPERIENCE_MONTH_COUNTING_RULE_LABEL =
  "Bulan kalender inklusif (selisih bulan + 1), gabungan interval (tanpa menjumlahkan peran bersamaan)";

export const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1,
  januar: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  mar: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  mei: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  aug: 8,
  agu: 8,
  agustus: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  okt: 10,
  oktober: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  des: 12,
  desember: 12,
  december: 12,
};

const SHORT_MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const ACTIVE_END_REGEX = /^(sekarang|present|current|aktif|now|ongoing|saat ini)$/i;

export function toMonthIndex(year: number, month1Based: number): number {
  return year * 12 + (month1Based - 1);
}

export function getCurrentMonthIndex(now: Date = new Date()): number {
  return now.getFullYear() * 12 + now.getMonth();
}

export function formatMonthIndex(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12);
  const month1Based = (monthIndex % 12) + 1;
  return `${year}-${String(month1Based).padStart(2, "0")}`;
}

export function formatMonthIndexHumanId(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12);
  const month0 = monthIndex % 12;
  return `${SHORT_MONTH_NAMES_ID[month0] || "?"} ${year}`;
}

export function countInclusiveMonths(startIdx: number, endIdx: number): number {
  if (endIdx < startIdx) return 0;
  return endIdx - startIdx + 1;
}

export type StructuredYearMonthResult =
  | { status: "empty" }
  | {
      status: "valid";
      year: number;
      month: number;
      monthIndex: number;
      ym: string;
      hadDayPrecision: boolean;
    }
  | { status: "invalid"; raw: string; reason: string };

function isValidCalendarYearMonth(year: number, month: number): boolean {
  return year >= 1950 && year <= 2100 && month >= 1 && month <= 12;
}

function isValidCalendarDay(year: number, month: number, day: number): boolean {
  if (!isValidCalendarYearMonth(year, month) || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

/**
 * Mem-parse field terstruktur startDate/endDate (`YYYY-MM` atau `YYYY-MM-DD`).
 * Tidak menebak angka bulan jika hanya tahun atau format rusak.
 */
export function parseStructuredYearMonth(value?: string): StructuredYearMonthResult {
  const trimmed = (value || "").trim();
  if (!trimmed) return { status: "empty" };

  const ymMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (ymMatch) {
    const year = Number(ymMatch[1]);
    const month = Number(ymMatch[2]);
    if (!isValidCalendarYearMonth(year, month)) {
      return { status: "invalid", raw: trimmed, reason: "Bulan atau tahun di luar rentang valid (1950-2100 / 01-12)." };
    }
    const monthIndex = toMonthIndex(year, month);
    return {
      status: "valid",
      year,
      month,
      monthIndex,
      ym: formatMonthIndex(monthIndex),
      hadDayPrecision: false,
    };
  }

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (!isValidCalendarDay(year, month, day)) {
      return { status: "invalid", raw: trimmed, reason: "Tanggal kalender tidak valid." };
    }
    const monthIndex = toMonthIndex(year, month);
    return {
      status: "valid",
      year,
      month,
      monthIndex,
      ym: formatMonthIndex(monthIndex),
      hadDayPrecision: true,
    };
  }

  return {
    status: "invalid",
    raw: trimmed,
    reason: "Format tanggal terstruktur wajib YYYY-MM (atau YYYY-MM-DD).",
  };
}

type ParsedEndpoint =
  | { kind: "current" }
  | { kind: "month"; year: number; month: number; monthIndex: number; ym: string }
  | { kind: "year_only"; year: number }
  | { kind: "unrecognized"; raw: string };

function parsePeriodEndpoint(rawToken: string): ParsedEndpoint {
  const token = rawToken.trim().replace(/[.,]+$/, "");
  if (!token) return { kind: "unrecognized", raw: rawToken };

  if (ACTIVE_END_REGEX.test(token)) {
    return { kind: "current" };
  }

  // YYYY-MM atau YYYY/MM
  const isoYm = token.match(/^(\d{4})[-/](\d{1,2})$/);
  if (isoYm) {
    const year = Number(isoYm[1]);
    const month = Number(isoYm[2]);
    if (isValidCalendarYearMonth(year, month)) {
      const monthIndex = toMonthIndex(year, month);
      return { kind: "month", year, month, monthIndex, ym: formatMonthIndex(monthIndex) };
    }
    return { kind: "unrecognized", raw: token };
  }

  // YYYY-MM-DD atau YYYY/MM/DD
  const isoYmd = token.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoYmd) {
    const year = Number(isoYmd[1]);
    const month = Number(isoYmd[2]);
    const day = Number(isoYmd[3]);
    if (isValidCalendarDay(year, month, day)) {
      const monthIndex = toMonthIndex(year, month);
      return { kind: "month", year, month, monthIndex, ym: formatMonthIndex(monthIndex) };
    }
    return { kind: "unrecognized", raw: token };
  }

  // MM/YYYY (4-digit year unambiguous)
  const slashMy = token.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMy) {
    const month = Number(slashMy[1]);
    const year = Number(slashMy[2]);
    if (isValidCalendarYearMonth(year, month)) {
      const monthIndex = toMonthIndex(year, month);
      return { kind: "month", year, month, monthIndex, ym: formatMonthIndex(monthIndex) };
    }
    return { kind: "unrecognized", raw: token };
  }

  // NamaBulan YYYY (e.g. "Sep 2024", "September 2024", "Sep-2024")
  const monthFirst = token.match(/^([a-zA-Z]+)[,\s-]+(\d{4})$/);
  if (monthFirst) {
    const month = MONTH_NAME_MAP[monthFirst[1].toLowerCase()];
    const year = Number(monthFirst[2]);
    if (month && isValidCalendarYearMonth(year, month)) {
      const monthIndex = toMonthIndex(year, month);
      return { kind: "month", year, month, monthIndex, ym: formatMonthIndex(monthIndex) };
    }
  }

  // YYYY NamaBulan (e.g. "2024 Sep")
  const yearFirst = token.match(/^(\d{4})[,\s-]+([a-zA-Z]+)$/);
  if (yearFirst) {
    const year = Number(yearFirst[1]);
    const month = MONTH_NAME_MAP[yearFirst[2].toLowerCase()];
    if (month && isValidCalendarYearMonth(year, month)) {
      const monthIndex = toMonthIndex(year, month);
      return { kind: "month", year, month, monthIndex, ym: formatMonthIndex(monthIndex) };
    }
  }

  // Hanya tahun ("2024") -> ditandai ambigu, dilarang menebak bulan
  const yearOnly = token.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year >= 1950 && year <= 2100) {
      return { kind: "year_only", year };
    }
  }

  return { kind: "unrecognized", raw: token };
}

export type AmbiguousPeriodReason =
  | "year_only_missing_month"
  | "single_date_missing_end"
  | "unrecognized_period_format";

export type ParsedPeriodTextResult =
  | { confidence: "empty" }
  | {
      confidence: "exact";
      startIdx: number;
      startYm: string;
      endIdx: number | null;
      endYm: string | null;
      isCurrent: boolean;
    }
  | {
      confidence: "ambiguous";
      raw: string;
      reason: AmbiguousPeriodReason;
      detail: string;
    };

function splitPeriodRange(normalized: string): string[] {
  // Pemisah rentang eksplisit (spasi di sekitar '-', en/em-dash, atau kata hubung rentang).
  // TIDAK pernah memecah tanda '-' di dalam tanggal ISO 'YYYY-MM'.
  const explicitParts = normalized
    .split(/\s*[\u2013\u2014–—]\s*|\s+-\s+|\s+(?:to|s\.d\.|sd|until|hingga|sampai)\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (explicitParts.length !== 1) return explicitParts;

  // Tangani bentuk tanpa spasi di pemisah seperti "2024-09-Sekarang" atau "Sep 2024-Nov 2025"
  const activeCompact = normalized.match(/^(.+?)-(sekarang|present|current|aktif|now|ongoing|saat ini)$/i);
  if (activeCompact) {
    return [activeCompact[1].trim(), activeCompact[2].trim()];
  }

  const monthWordCompact = normalized.match(
    /^([a-zA-Z]+\.?\s+\d{4})\s*-\s*([a-zA-Z]+\.?\s+\d{4})$/
  );
  if (monthWordCompact) {
    return [monthWordCompact[1].trim(), monthWordCompact[2].trim()];
  }

  return explicitParts;
}

/**
 * Parser teks periode non-destruktif yang hanya mengembalikan "exact" apabila
 * bulan & tahun awal serta status selesai/aktifnya benar-benar tidak ambigu.
 */
export function parseExperiencePeriodText(period?: string): ParsedPeriodTextResult {
  const normalized = (period || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { confidence: "empty" };

  const parts = splitPeriodRange(normalized);
  if (parts.length > 2) {
    return {
      confidence: "ambiguous",
      raw: normalized,
      reason: "unrecognized_period_format",
      detail: `Format rentang "${normalized}" memiliki terlalu banyak pemisah sehingga tidak dapat dipastikan.`,
    };
  }

  if (parts.length === 1) {
    const single = parsePeriodEndpoint(parts[0]);
    if (single.kind === "year_only") {
      return {
        confidence: "ambiguous",
        raw: normalized,
        reason: "year_only_missing_month",
        detail: `Periode "${normalized}" hanya memuat tahun tanpa bulan mulai/selesai.`,
      };
    }
    if (single.kind === "month") {
      return {
        confidence: "ambiguous",
        raw: normalized,
        reason: "single_date_missing_end",
        detail: `Periode "${normalized}" hanya memuat satu tanggal tanpa tanggal selesai atau penanda aktif.`,
      };
    }
    return {
      confidence: "ambiguous",
      raw: normalized,
      reason: "unrecognized_period_format",
      detail: `Format periode "${normalized}" tidak dikenali secara pasti.`,
    };
  }

  const left = parsePeriodEndpoint(parts[0]);
  const right = parsePeriodEndpoint(parts[1]);

  if (left.kind === "year_only" || right.kind === "year_only") {
    return {
      confidence: "ambiguous",
      raw: normalized,
      reason: "year_only_missing_month",
      detail: `Periode "${normalized}" masih mencantumkan tahun saja tanpa bulan yang pasti.`,
    };
  }

  if (left.kind !== "month") {
    return {
      confidence: "ambiguous",
      raw: normalized,
      reason: "unrecognized_period_format",
      detail: `Tanggal mulai pada periode "${normalized}" tidak memuat bulan dan tahun yang pasti.`,
    };
  }

  if (right.kind === "current") {
    return {
      confidence: "exact",
      startIdx: left.monthIndex,
      startYm: left.ym,
      endIdx: null,
      endYm: null,
      isCurrent: true,
    };
  }

  if (right.kind === "month") {
    return {
      confidence: "exact",
      startIdx: left.monthIndex,
      startYm: left.ym,
      endIdx: right.monthIndex,
      endYm: right.ym,
      isCurrent: false,
    };
  }

  return {
    confidence: "ambiguous",
    raw: normalized,
    reason: "unrecognized_period_format",
    detail: `Tanggal selesai pada periode "${normalized}" tidak dikenali secara pasti.`,
  };
}

export type ExperienceDateSource = "structured" | "period_fallback" | "none";

export type ExperienceExclusionReason =
  | "draft"
  | "hidden"
  | "missing_dates"
  | "invalid_structured_date"
  | "ambiguous_period"
  | "reversed_dates"
  | "future_start";

export interface ResolvedExperienceRecord {
  id: string;
  role: string;
  org: string;
  orgGroupKey: string;
  period: string;
  startDate: string;
  endDate: string;
  current: boolean;
  published: boolean;
  visible: boolean;
  includedInStats: boolean;
  countedInOrganizations: boolean;
  dateSource: ExperienceDateSource;
  exclusionReason: ExperienceExclusionReason | null;
  exclusionDetail: string | null;
  startIdx: number | null;
  endIdx: number | null;
  startYm: string | null;
  endYm: string | null;
  months: number;
  clampedFutureEnd: boolean;
  originalEndYm: string | null;
  needsReview: boolean;
  reviewHint: string | null;
}

export interface MergedExperienceInterval {
  startIdx: number;
  endIdx: number;
  startYm: string;
  endYm: string;
  months: number;
  recordIds: string[];
  labels: string[];
}

function resolveDatePartOnly(
  exp: ExperienceItem,
  nowIdx: number
): {
  valid: boolean;
  dateSource: ExperienceDateSource;
  reason: Exclude<ExperienceExclusionReason, "draft" | "hidden"> | null;
  detail: string | null;
  startIdx: number | null;
  endIdx: number | null;
  startYm: string | null;
  endYm: string | null;
  clampedFutureEnd: boolean;
  originalEndYm: string | null;
  needsReview: boolean;
  reviewHint: string | null;
} {
  const structuredStart = parseStructuredYearMonth(exp.startDate);
  const structuredEnd = parseStructuredYearMonth(exp.endDate);
  const periodParsed = parseExperiencePeriodText(exp.period);
  const isFlaggedCurrent = Boolean(exp.current);

  if (structuredStart.status === "invalid") {
    return {
      valid: false,
      dateSource: "structured",
      reason: "invalid_structured_date",
      detail: `startDate '${structuredStart.raw}' tidak valid: ${structuredStart.reason}`,
      startIdx: null,
      endIdx: null,
      startYm: null,
      endYm: null,
      clampedFutureEnd: false,
      originalEndYm: null,
      needsReview: true,
      reviewHint: structuredStart.reason,
    };
  }

  let startIdx: number | null = null;
  let startYm: string | null = null;
  let rawEndIdx: number | null = null;
  let rawEndYm: string | null = null;
  let effectiveCurrent = isFlaggedCurrent;
  let dateSource: ExperienceDateSource = "none";

  if (structuredStart.status === "valid") {
    dateSource = "structured";
    startIdx = structuredStart.monthIndex;
    startYm = structuredStart.ym;

    if (effectiveCurrent) {
      rawEndIdx = nowIdx;
      rawEndYm = formatMonthIndex(nowIdx);
    } else if (structuredEnd.status === "valid") {
      rawEndIdx = structuredEnd.monthIndex;
      rawEndYm = structuredEnd.ym;
    } else if (structuredEnd.status === "invalid") {
      return {
        valid: false,
        dateSource: "structured",
        reason: "invalid_structured_date",
        detail: `endDate '${structuredEnd.raw}' tidak valid: ${structuredEnd.reason}`,
        startIdx,
        endIdx: null,
        startYm,
        endYm: null,
        clampedFutureEnd: false,
        originalEndYm: null,
        needsReview: true,
        reviewHint: structuredEnd.reason,
      };
    } else {
      return {
        valid: false,
        dateSource: "structured",
        reason: "missing_dates",
        detail: "Tanggal selesai (endDate) belum diisi untuk pengalaman yang sudah tidak aktif.",
        startIdx,
        endIdx: null,
        startYm,
        endYm: null,
        clampedFutureEnd: false,
        originalEndYm: null,
        needsReview: true,
        reviewHint: "Isi endDate atau centang 'Masih Berlangsung'.",
      };
    }
  } else {
    // Fallback teks periode hanya jika startDate kosong dan teks bersifat eksak
    if (periodParsed.confidence === "empty") {
      return {
        valid: false,
        dateSource: "none",
        reason: "missing_dates",
        detail: "startDate dan teks periode sama-sama kosong.",
        startIdx: null,
        endIdx: null,
        startYm: null,
        endYm: null,
        clampedFutureEnd: false,
        originalEndYm: null,
        needsReview: true,
        reviewHint: "Lengkapi tanggal mulai terstruktur (YYYY-MM).",
      };
    }

    if (periodParsed.confidence === "ambiguous") {
      return {
        valid: false,
        dateSource: "none",
        reason: "ambiguous_period",
        detail: periodParsed.detail,
        startIdx: null,
        endIdx: null,
        startYm: null,
        endYm: null,
        clampedFutureEnd: false,
        originalEndYm: null,
        needsReview: true,
        reviewHint: periodParsed.detail,
      };
    }

    dateSource = "period_fallback";
    startIdx = periodParsed.startIdx;
    startYm = periodParsed.startYm;
    effectiveCurrent = isFlaggedCurrent || periodParsed.isCurrent;
    if (effectiveCurrent) {
      rawEndIdx = nowIdx;
      rawEndYm = formatMonthIndex(nowIdx);
    } else {
      rawEndIdx = periodParsed.endIdx;
      rawEndYm = periodParsed.endYm;
    }
  }

  if (startIdx === null || rawEndIdx === null) {
    return {
      valid: false,
      dateSource,
      reason: "missing_dates",
      detail: "Interval tanggal mulai/selesai tidak lengkap.",
      startIdx: null,
      endIdx: null,
      startYm: null,
      endYm: null,
      clampedFutureEnd: false,
      originalEndYm: null,
      needsReview: true,
      reviewHint: "Lengkapi tanggal mulai dan selesai.",
    };
  }

  // Validasi tanggal mulai di masa depan
  if (startIdx > nowIdx) {
    return {
      valid: false,
      dateSource,
      reason: "future_start",
      detail: `Tanggal mulai (${startYm}) berada di masa depan relatif terhadap ${formatMonthIndex(nowIdx)}.`,
      startIdx,
      endIdx: rawEndIdx,
      startYm,
      endYm: rawEndYm,
      clampedFutureEnd: false,
      originalEndYm: rawEndYm,
      needsReview: true,
      reviewHint: "Tanggal mulai berada di masa depan sehingga tidak dihitung.",
    };
  }

  // Validasi tanggal terbalik (hanya untuk pengalaman non-current)
  if (!effectiveCurrent && rawEndIdx < startIdx) {
    return {
      valid: false,
      dateSource,
      reason: "reversed_dates",
      detail: `Tanggal mulai (${startYm}) lebih akhir daripada tanggal selesai (${rawEndYm}).`,
      startIdx,
      endIdx: rawEndIdx,
      startYm,
      endYm: rawEndYm,
      clampedFutureEnd: false,
      originalEndYm: rawEndYm,
      needsReview: true,
      reviewHint: "Perbaiki urutan tanggal mulai dan tanggal selesai.",
    };
  }

  // Tanggal selesai di masa depan dibatasi sampai bulan referensi `nowIdx`
  let clampedFutureEnd = false;
  let finalEndIdx = rawEndIdx;
  let finalEndYm = rawEndYm || formatMonthIndex(rawEndIdx);
  if (finalEndIdx > nowIdx) {
    clampedFutureEnd = true;
    finalEndIdx = nowIdx;
    finalEndYm = formatMonthIndex(nowIdx);
  }

  return {
    valid: true,
    dateSource,
    reason: null,
    detail: null,
    startIdx,
    endIdx: finalEndIdx,
    startYm,
    endYm: finalEndYm,
    clampedFutureEnd,
    originalEndYm: clampedFutureEnd ? rawEndYm : null,
    needsReview: clampedFutureEnd,
    reviewHint: clampedFutureEnd
      ? `Tanggal selesai (${rawEndYm}) di masa depan dibatasi hingga ${finalEndYm}.`
      : null,
  };
}

export function resolveExperienceRecord(
  exp: ExperienceItem,
  now: Date = new Date()
): ResolvedExperienceRecord {
  const nowIdx = getCurrentMonthIndex(now);
  const published = exp.published !== false;
  const visible = exp.visible !== false;
  const groupKey = (exp.orgGroup || exp.org || "").trim().toLowerCase();
  const datePart = resolveDatePartOnly(exp, nowIdx);

  if (!published) {
    return {
      id: exp.id,
      role: exp.role || "",
      org: exp.org || "",
      orgGroupKey: groupKey,
      period: exp.period || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: Boolean(exp.current),
      published,
      visible,
      includedInStats: false,
      countedInOrganizations: false,
      dateSource: datePart.dateSource,
      exclusionReason: "draft",
      exclusionDetail: "Berstatus Draf (tidak dipublikasikan ke situs publik).",
      startIdx: datePart.startIdx,
      endIdx: datePart.endIdx,
      startYm: datePart.startYm,
      endYm: datePart.endYm,
      months: 0,
      clampedFutureEnd: datePart.clampedFutureEnd,
      originalEndYm: datePart.originalEndYm,
      needsReview: datePart.needsReview,
      reviewHint: datePart.reviewHint,
    };
  }

  if (!visible) {
    return {
      id: exp.id,
      role: exp.role || "",
      org: exp.org || "",
      orgGroupKey: groupKey,
      period: exp.period || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: Boolean(exp.current),
      published,
      visible,
      includedInStats: false,
      countedInOrganizations: false,
      dateSource: datePart.dateSource,
      exclusionReason: "hidden",
      exclusionDetail: "Tersembunyi di situs publik (visible = false).",
      startIdx: datePart.startIdx,
      endIdx: datePart.endIdx,
      startYm: datePart.startYm,
      endYm: datePart.endYm,
      months: 0,
      clampedFutureEnd: datePart.clampedFutureEnd,
      originalEndYm: datePart.originalEndYm,
      needsReview: datePart.needsReview,
      reviewHint: datePart.reviewHint,
    };
  }

  if (!datePart.valid || datePart.startIdx === null || datePart.endIdx === null) {
    return {
      id: exp.id,
      role: exp.role || "",
      org: exp.org || "",
      orgGroupKey: groupKey,
      period: exp.period || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: Boolean(exp.current),
      published,
      visible,
      includedInStats: false,
      countedInOrganizations: Boolean(groupKey),
      dateSource: datePart.dateSource,
      exclusionReason: datePart.reason || "missing_dates",
      exclusionDetail: datePart.detail || "Tanggal pengalaman belum valid.",
      startIdx: datePart.startIdx,
      endIdx: datePart.endIdx,
      startYm: datePart.startYm,
      endYm: datePart.endYm,
      months: 0,
      clampedFutureEnd: false,
      originalEndYm: datePart.originalEndYm,
      needsReview: true,
      reviewHint: datePart.reviewHint,
    };
  }

  const months = countInclusiveMonths(datePart.startIdx, datePart.endIdx);
  return {
    id: exp.id,
    role: exp.role || "",
    org: exp.org || "",
    orgGroupKey: groupKey,
    period: exp.period || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    current: Boolean(exp.current),
    published,
    visible,
    includedInStats: true,
    countedInOrganizations: Boolean(groupKey),
    dateSource: datePart.dateSource,
    exclusionReason: null,
    exclusionDetail: null,
    startIdx: datePart.startIdx,
    endIdx: datePart.endIdx,
    startYm: datePart.startYm,
    endYm: datePart.endYm,
    months,
    clampedFutureEnd: datePart.clampedFutureEnd,
    originalEndYm: datePart.originalEndYm,
    needsReview: datePart.needsReview,
    reviewHint: datePart.reviewHint,
  };
}

export function mergeExperienceIntervals(records: ResolvedExperienceRecord[]): {
  mergedIntervals: MergedExperienceInterval[];
  mergedMonths: number;
} {
  const valid = records
    .filter(
      (r): r is ResolvedExperienceRecord & { startIdx: number; endIdx: number } =>
        r.includedInStats && r.startIdx !== null && r.endIdx !== null
    )
    .sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);

  if (valid.length === 0) {
    return { mergedIntervals: [], mergedMonths: 0 };
  }

  const merged: Array<{
    startIdx: number;
    endIdx: number;
    recordIds: string[];
    labels: string[];
  }> = [
    {
      startIdx: valid[0].startIdx,
      endIdx: valid[0].endIdx,
      recordIds: [valid[0].id],
      labels: [valid[0].org || valid[0].role || valid[0].id],
    },
  ];

  for (let i = 1; i < valid.length; i++) {
    const rec = valid[i];
    const last = merged[merged.length - 1];
    // Gabungkan interval tumpang tindih maupun bersebelahan persis (next.start <= last.end + 1)
    if (rec.startIdx <= last.endIdx + 1) {
      last.endIdx = Math.max(last.endIdx, rec.endIdx);
      last.recordIds.push(rec.id);
      last.labels.push(rec.org || rec.role || rec.id);
    } else {
      merged.push({
        startIdx: rec.startIdx,
        endIdx: rec.endIdx,
        recordIds: [rec.id],
        labels: [rec.org || rec.role || rec.id],
      });
    }
  }

  const mergedIntervals: MergedExperienceInterval[] = merged.map((m) => ({
    startIdx: m.startIdx,
    endIdx: m.endIdx,
    startYm: formatMonthIndex(m.startIdx),
    endYm: formatMonthIndex(m.endIdx),
    months: countInclusiveMonths(m.startIdx, m.endIdx),
    recordIds: m.recordIds,
    labels: m.labels,
  }));

  const mergedMonths = mergedIntervals.reduce((acc, item) => acc + item.months, 0);
  return { mergedIntervals, mergedMonths };
}

export function formatExperienceYearsMetric(params: {
  mergedMonths: number;
  rule: "merge_intervals" | "since_year";
  currentYear: number;
  baseSinceYear: number;
}): string {
  const { mergedMonths, rule, currentYear, baseSinceYear } = params;
  if (rule === "since_year") {
    const diff = Math.max(0, currentYear - baseSinceYear);
    return diff > 0 ? `${diff}+` : "0";
  }
  if (mergedMonths <= 0) return "0";
  if (mergedMonths < 12) return "< 1";
  return `${Math.floor(mergedMonths / 12)}+`;
}

export type ExperienceMigrationStatus =
  | "already_structured"
  | "migratable"
  | "ambiguous_flagged"
  | "reversed_flagged"
  | "invalid_structured_flagged"
  | "missing_flagged";

export interface ExperienceMigrationEntry {
  id: string;
  role: string;
  org: string;
  period: string;
  currentStartDate: string;
  currentEndDate: string;
  currentFlag: boolean;
  status: ExperienceMigrationStatus;
  proposedStartDate?: string;
  proposedEndDate?: string;
  proposedCurrent?: boolean;
  reason: string;
}

export interface ExperienceDateMigrationReport {
  total: number;
  alreadyStructuredCount: number;
  migratableCount: number;
  flaggedCount: number;
  entries: ExperienceMigrationEntry[];
  migratable: ExperienceMigrationEntry[];
  flaggedForReview: ExperienceMigrationEntry[];
}

export function analyzeExperienceDateMigration(
  experienceList: ExperienceItem[] = []
): ExperienceDateMigrationReport {
  const entries: ExperienceMigrationEntry[] = experienceList.map((exp) => {
    const startRes = parseStructuredYearMonth(exp.startDate);
    const currentStartDate = exp.startDate || "";
    const currentEndDate = exp.endDate || "";
    const currentFlag = Boolean(exp.current);

    if (startRes.status === "invalid") {
      return {
        id: exp.id,
        role: exp.role || "",
        org: exp.org || "",
        period: exp.period || "",
        currentStartDate,
        currentEndDate,
        currentFlag,
        status: "invalid_structured_flagged",
        reason: `startDate '${startRes.raw}' tidak valid: ${startRes.reason}`,
      };
    }

    if (startRes.status === "valid") {
      const endRes = parseStructuredYearMonth(exp.endDate);
      if (endRes.status === "invalid") {
        return {
          id: exp.id,
          role: exp.role || "",
          org: exp.org || "",
          period: exp.period || "",
          currentStartDate,
          currentEndDate,
          currentFlag,
          status: "invalid_structured_flagged",
          reason: `endDate '${endRes.raw}' tidak valid: ${endRes.reason}`,
        };
      }
      if (!currentFlag && endRes.status === "valid" && endRes.monthIndex < startRes.monthIndex) {
        return {
          id: exp.id,
          role: exp.role || "",
          org: exp.org || "",
          period: exp.period || "",
          currentStartDate,
          currentEndDate,
          currentFlag,
          status: "reversed_flagged",
          reason: `Tanggal terstruktur terbalik (${startRes.ym} > ${endRes.ym}).`,
        };
      }
      if (!currentFlag && endRes.status === "empty") {
        // Coba ambil hanya endDate bila teks periode memuat tanggal selesai eksak dengan startYm yang sama
        const periodRes = parseExperiencePeriodText(exp.period);
        if (
          periodRes.confidence === "exact" &&
          periodRes.startYm === startRes.ym &&
          !periodRes.isCurrent &&
          periodRes.endYm &&
          periodRes.endIdx !== null &&
          periodRes.endIdx >= startRes.monthIndex
        ) {
          return {
            id: exp.id,
            role: exp.role || "",
            org: exp.org || "",
            period: exp.period || "",
            currentStartDate,
            currentEndDate,
            currentFlag,
            status: "migratable",
            proposedStartDate: startRes.ym,
            proposedEndDate: periodRes.endYm,
            proposedCurrent: false,
            reason: `endDate dapat dilengkapi secara pasti dari periode "${exp.period}" -> ${periodRes.endYm}.`,
          };
        }
        return {
          id: exp.id,
          role: exp.role || "",
          org: exp.org || "",
          period: exp.period || "",
          currentStartDate,
          currentEndDate,
          currentFlag,
          status: "missing_flagged",
          reason: "startDate terisi, tetapi endDate kosong pada pengalaman non-aktif.",
        };
      }

      return {
        id: exp.id,
        role: exp.role || "",
        org: exp.org || "",
        period: exp.period || "",
        currentStartDate,
        currentEndDate,
        currentFlag,
        status: "already_structured",
        reason: "Tanggal terstruktur sudah lengkap.",
      };
    }

    // startDate kosong -> periksa teks periode tanpa menebak format ambigu
    const periodRes = parseExperiencePeriodText(exp.period);
    if (periodRes.confidence === "empty") {
      return {
        id: exp.id,
        role: exp.role || "",
        org: exp.org || "",
        period: exp.period || "",
        currentStartDate,
        currentEndDate,
        currentFlag,
        status: "missing_flagged",
        reason: "startDate dan period sama-sama kosong; perlu diisi manual.",
      };
    }

    if (periodRes.confidence === "ambiguous") {
      return {
        id: exp.id,
        role: exp.role || "",
        org: exp.org || "",
        period: exp.period || "",
        currentStartDate,
        currentEndDate,
        currentFlag,
        status: "ambiguous_flagged",
        reason: periodRes.detail,
      };
    }

    const nextCurrent = Boolean(exp.current || periodRes.isCurrent);
    if (!nextCurrent && periodRes.endIdx !== null && periodRes.endIdx < periodRes.startIdx) {
      return {
        id: exp.id,
        role: exp.role || "",
        org: exp.org || "",
        period: exp.period || "",
        currentStartDate,
        currentEndDate,
        currentFlag,
        status: "reversed_flagged",
        reason: `Tanggal pada teks periode terbalik (${periodRes.startYm} > ${periodRes.endYm}).`,
      };
    }

    return {
      id: exp.id,
      role: exp.role || "",
      org: exp.org || "",
      period: exp.period || "",
      currentStartDate,
      currentEndDate,
      currentFlag,
      status: "migratable",
      proposedStartDate: periodRes.startYm,
      proposedEndDate: nextCurrent ? "" : periodRes.endYm || "",
      proposedCurrent: nextCurrent,
      reason: nextCurrent
        ? `Periode "${exp.period}" eksak -> startDate=${periodRes.startYm}, current=true.`
        : `Periode "${exp.period}" eksak -> startDate=${periodRes.startYm}, endDate=${periodRes.endYm}.`,
    };
  });

  const migratable = entries.filter((e) => e.status === "migratable");
  const flaggedForReview = entries.filter(
    (e) => e.status !== "already_structured" && e.status !== "migratable"
  );

  return {
    total: entries.length,
    alreadyStructuredCount: entries.filter((e) => e.status === "already_structured").length,
    migratableCount: migratable.length,
    flaggedCount: flaggedForReview.length,
    entries,
    migratable,
    flaggedForReview,
  };
}

/**
 * Menerapkan migrasi non-destruktif pada salinan konfigurasi (tidak menimpa record terstruktur
 * maupun menebak format teks yang ambigu).
 */
export function applyNonDestructiveExperienceDateMigration(config: SiteConfig): {
  nextConfig: SiteConfig;
  report: ExperienceDateMigrationReport;
  changedIds: string[];
} {
  const experienceList = config.experience || [];
  const report = analyzeExperienceDateMigration(experienceList);
  const byId = new Map(report.migratable.map((m) => [m.id, m]));
  const changedIds: string[] = [];

  const nextExperience = experienceList.map((exp) => {
    const plan = byId.get(exp.id);
    if (!plan || !plan.proposedStartDate) return exp;
    changedIds.push(exp.id);
    return {
      ...exp,
      startDate: plan.proposedStartDate,
      endDate: plan.proposedCurrent ? "" : plan.proposedEndDate || exp.endDate || "",
      current: Boolean(plan.proposedCurrent),
    };
  });

  return {
    nextConfig:
      changedIds.length > 0 ? { ...config, experience: nextExperience } : config,
    report,
    changedIds,
  };
}
