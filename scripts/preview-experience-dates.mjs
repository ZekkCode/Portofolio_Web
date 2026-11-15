#!/usr/bin/env node
/**
 * Dry-run CLI preview untuk audit tanggal pengalaman, perhitungan statistik
 * bulan/tahun tergabung, dan migrasi tanggal terstruktur non-destruktif.
 * TIDAK melakukan mutasi apa pun ke Supabase maupun berkas produksi.
 *
 * Contoh:
 *   node scripts/preview-experience-dates.mjs
 *   node scripts/preview-experience-dates.mjs --now 2026-11-15
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("package.json"));
const { createJiti } = require("jiti");
const jiti = createJiti(path.resolve("package.json"), {
  alias: { "@": path.resolve("src") },
});

const { applyNonDestructiveExperienceDateMigration } = jiti(
  path.resolve("src/lib/content/experience-dates.ts")
);
const { computeAutoStatsBreakdown, getPublishedStats } = jiti(
  path.resolve("src/lib/content/selectors.ts")
);

function parseArgs(argv) {
  const opts = {
    source: path.resolve(".local-cms-store/backup-supabase-2026-11-14T14-49-49-796Z.json"),
    now: null,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source" && argv[i + 1]) {
      opts.source = path.resolve(argv[++i]);
    } else if (arg === "--now" && argv[i + 1]) {
      opts.now = argv[++i];
    } else if (arg === "--json") {
      opts.json = true;
    }
  }
  return opts;
}

function extractConfig(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Berkas JSON sumber tidak valid.");
  }
  if (Array.isArray(raw.rows)) {
    const currentRow = raw.rows.find((r) => r && r.id === "current") || raw.rows[0];
    if (currentRow && currentRow.config) return currentRow.config;
  }
  if (raw.config && typeof raw.config === "object") {
    return raw.config;
  }
  return raw;
}

function parseReferenceDate(nowStr) {
  if (!nowStr) return new Date();
  const ymOrYmd = nowStr.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (ymOrYmd) {
    const year = Number(ymOrYmd[1]);
    const month = Number(ymOrYmd[2]);
    const day = Number(ymOrYmd[3] || "15");
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const dt = new Date(nowStr);
  if (Number.isNaN(dt.getTime())) {
    throw new Error(`Tanggal --now tidak valid: ${nowStr}`);
  }
  return dt;
}

const opts = parseArgs(process.argv.slice(2));
const rawJson = JSON.parse(fs.readFileSync(opts.source, "utf8"));
const config = extractConfig(rawJson);
const refDate = parseReferenceDate(opts.now);

const beforeBreakdown = computeAutoStatsBreakdown(config, { now: refDate });
const beforePublished = getPublishedStats(config, { now: refDate });

const { nextConfig, report, changedIds } = applyNonDestructiveExperienceDateMigration(config);
const afterBreakdown = computeAutoStatsBreakdown(nextConfig, { now: refDate });
const afterPublished = getPublishedStats(nextConfig, { now: refDate });

const summary = {
  dryRunOnly: true,
  sourceFile: opts.source,
  referenceDate: refDate.toISOString(),
  asOfMonth: beforeBreakdown.asOfMonth,
  monthCountingRule: beforeBreakdown.monthCountingRule,
  statsBeforeMigration: {
    publishedStats: beforePublished,
    experienceMonths: beforeBreakdown.experienceMonths,
    mergedIntervals: beforeBreakdown.mergedIntervals,
    includedRecords: beforeBreakdown.includedRecords.map((r) => ({
      id: r.id,
      org: r.org,
      dateSource: r.dateSource,
      startYm: r.startYm,
      endYm: r.endYm,
      months: r.months,
    })),
    excludedRecords: beforeBreakdown.excludedRecords.map((r) => ({
      id: r.id,
      org: r.org,
      reason: r.exclusionReason,
      detail: r.exclusionDetail,
    })),
  },
  migrationPlan: {
    total: report.total,
    alreadyStructuredCount: report.alreadyStructuredCount,
    migratableCount: report.migratableCount,
    flaggedCount: report.flaggedCount,
    proposedChanges: report.migratable,
    flaggedForReview: report.flaggedForReview,
    wouldChangeIds: changedIds,
  },
  statsAfterMigration: {
    publishedStats: afterPublished,
    experienceMonths: afterBreakdown.experienceMonths,
    mergedIntervals: afterBreakdown.mergedIntervals,
    includedRecords: afterBreakdown.includedRecords.map((r) => ({
      id: r.id,
      org: r.org,
      dateSource: r.dateSource,
      startYm: r.startYm,
      endYm: r.endYm,
      months: r.months,
    })),
  },
};

if (opts.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log("=== DRY-RUN AUDIT TANGGAL PENGALAMAN & STATISTIK (READ-ONLY) ===");
  console.log(`Sumber       : ${summary.sourceFile}`);
  console.log(`Referensi    : ${summary.asOfMonth} (${summary.referenceDate})`);
  console.log(`Aturan       : ${summary.monthCountingRule}`);
  console.log("");
  console.log("--- Statistik Saat Ini (Setelah Perbaikan Parser Tanpa Mengubah DB) ---");
  console.log(
    `Mode         : ${beforePublished.isAuto ? "auto" : "manual"} | Rule: ${beforeBreakdown.overlappingRule}`
  );
  console.log(
    `Durasi       : ${beforeBreakdown.experienceMonths} bulan net -> tampil "${beforePublished.experienceYears}"`
  );
  console.log(`Organisasi   : ${beforeBreakdown.organizationsCount} (${beforeBreakdown.uniqueOrganizations.join(", ")})`);
  console.log("Interval     :");
  for (const iv of beforeBreakdown.mergedIntervals) {
    console.log(`  - ${iv.startYm} s.d. ${iv.endYm} = ${iv.months} bln [${iv.labels.join(" + ")}]`);
  }
  console.log("Rincian Record:");
  for (const r of beforeBreakdown.includedRecords) {
    console.log(
      `  [HITUNG] ${r.id} (${r.org}): ${r.startYm} s.d. ${r.endYm} = ${r.months} bln | sumber=${r.dateSource}`
    );
  }
  for (const r of beforeBreakdown.excludedRecords) {
    console.log(
      `  [KECUALI] ${r.id} (${r.org}): reason=${r.exclusionReason} | ${r.exclusionDetail}`
    );
  }
  console.log("");
  console.log("--- Rencana Migrasi Non-Destruktif (Dry Run) ---");
  console.log(
    `Sudah terstruktur: ${report.alreadyStructuredCount} | Siap migrasi aman: ${report.migratableCount} | Ditandai tinjauan: ${report.flaggedCount}`
  );
  for (const c of report.migratable) {
    console.log(
      `  [MIGRASI] ${c.id} (${c.org}) "${c.period}" -> startDate=${c.proposedStartDate}, endDate=${c.proposedEndDate || '""'}, current=${c.proposedCurrent}`
    );
  }
  for (const f of report.flaggedForReview) {
    console.log(`  [TINJAU]  ${f.id} (${f.org}) "${f.period}" -> ${f.status}: ${f.reason}`);
  }
  console.log(
    `\nHasil setelah migrasi aman: ${afterBreakdown.experienceMonths} bulan net -> "${afterPublished.experienceYears}" (0 mutasi ke produksi).`
  );
}
