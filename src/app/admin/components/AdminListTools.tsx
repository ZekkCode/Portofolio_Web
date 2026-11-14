"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  FileEdit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";

/**
 * Memindahkan elemen di dalam array dan memperbarui nilai `sortOrder` 1-based secara konsisten.
 */
export function reorderItemsWithSortOrder<T extends { sortOrder?: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}

export function normalizeSortOrders<T extends { sortOrder?: number }>(items: T[]): T[] {
  return items.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}

/**
 * Toolbar pencarian, filter & paginasi yang konsisten untuk semua daftar entitas Admin.
 */
interface AdminSearchFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (val: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  statusFilter?: "all" | "published" | "draft" | "hidden";
  onStatusFilterChange?: (val: "all" | "published" | "draft" | "hidden") => void;
  totalCount: number;
  filteredCount: number;
}

export function AdminSearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Cari item...",
  filterValue,
  onFilterChange,
  filterOptions,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  filteredCount,
}: AdminSearchFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line/60 bg-surface/50 p-3 dark:border-line/40 dark:bg-slate-900/50">
      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[220px]">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-line/70 bg-white pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none dark:border-line/40 dark:bg-[#0c0e17]"
          />
        </div>

        {filterOptions && onFilterChange && (
          <select
            value={filterValue || "all"}
            onChange={(e) => onFilterChange(e.target.value)}
            className="rounded-lg border border-line/70 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/40 dark:bg-[#0c0e17]"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {onStatusFilterChange && (
          <select
            value={statusFilter || "all"}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "all" | "published" | "draft" | "hidden")
            }
            className="rounded-lg border border-line/70 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-brand focus:outline-none dark:border-line/40 dark:bg-[#0c0e17]"
          >
            <option value="all">Semua Status</option>
            <option value="published">Terpublikasi & Tampil</option>
            <option value="draft">Draf Saja</option>
            <option value="hidden">Disembunyikan</option>
          </select>
        )}
      </div>

      <span className="text-[11px] font-mono text-muted">
        Menampilkan {filteredCount} / {totalCount} item
      </span>
    </div>
  );
}

/**
 * Kontrol paginasi ringan
 */
export function AdminPaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted">
      <span>
        Halaman <strong className="text-ink">{page}</strong> dari <strong className="text-ink">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-line/60 px-2.5 py-1 font-medium text-ink disabled:opacity-40 hover:bg-surface dark:border-line/40"
        >
          <ChevronLeft className="size-3.5" />
          <span>Sebelumnya</span>
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-line/60 px-2.5 py-1 font-medium text-ink disabled:opacity-40 hover:bg-surface dark:border-line/40"
        >
          <span>Berikutnya</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Kontrol standar status (Draf vs Publik), Visibilitas (Tampil vs Sembunyi), Urutan & Hapus
 */
export function AdminItemActionBar({
  published = true,
  visible = true,
  onTogglePublished,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
  onDelete,
  dragHandleProps,
}: {
  published?: boolean;
  visible?: boolean;
  onTogglePublished?: () => void;
  onToggleVisible?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  onDelete?: () => void;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
  };
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          title="Seret untuk mengurutkan"
          className="inline-flex cursor-grab active:cursor-grabbing items-center rounded-lg border border-line/50 p-1 text-muted hover:text-ink dark:border-line/40"
        >
          <GripVertical className="size-3.5" />
        </span>
      )}

      {onMoveUp && (
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disableMoveUp}
          title="Geser Naik"
          className="rounded-lg border border-line/60 p-1 text-muted hover:border-brand/50 hover:text-brand disabled:opacity-35 dark:border-line/40"
        >
          <ChevronUp className="size-3.5" />
        </button>
      )}

      {onMoveDown && (
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disableMoveDown}
          title="Geser Turun"
          className="rounded-lg border border-line/60 p-1 text-muted hover:border-brand/50 hover:text-brand disabled:opacity-35 dark:border-line/40"
        >
          <ChevronDown className="size-3.5" />
        </button>
      )}

      {onTogglePublished && (
        <button
          type="button"
          onClick={onTogglePublished}
          title={
            published
              ? "Status Publik: item aktif terbit. Klik untuk jadikan Draf (privat)"
              : "Status Draf: hanya muncul di Pratinjau Draf. Klik untuk Publikasikan"
          }
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
            published
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          {published ? <Globe className="size-3" /> : <FileEdit className="size-3" />}
          <span>{published ? "Publik" : "Draf"}</span>
        </button>
      )}

      {onToggleVisible && (
        <button
          type="button"
          onClick={onToggleVisible}
          title={
            visible
              ? "Tampil di website. Klik untuk menyembunyikan sementara"
              : "Disembunyikan dari website & Buddy AI. Klik untuk tampilkan"
          }
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
            visible
              ? "border-brand/30 bg-brand/5 text-brand dark:text-blue-400"
              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          <span>{visible ? "Tampil" : "Sembunyi"}</span>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Hapus item"
          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
        >
          <Trash2 className="size-3" />
          <span>Hapus</span>
        </button>
      )}
    </div>
  );
}

/**
 * Hook kecil untuk drag-and-drop urutan baris.
 */
export function useDragReorder<T extends { sortOrder?: number }>(
  items: T[],
  onReordered: (next: T[]) => void
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const getDragProps = (index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        onReordered(reorderItemsWithSortOrder(items, dragIndex, index));
      }
      setDragIndex(null);
    },
  });

  const getHandleProps = (index: number) => ({
    draggable: true,
    onDragStart: () => setDragIndex(index),
    onDragEnd: () => setDragIndex(null),
  });

  return { dragIndex, getDragProps, getHandleProps };
}
