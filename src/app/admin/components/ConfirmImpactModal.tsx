"use client";

import { useEffect } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

export interface DeleteImpactItem {
  entityType: string;
  itemName: string;
  impacts: string[];
  onConfirm: () => void;
}

interface ConfirmImpactModalProps {
  pendingDelete: DeleteImpactItem | null;
  onCancel: () => void;
}

export function ConfirmImpactModal({ pendingDelete, onCancel }: ConfirmImpactModalProps) {
  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, onCancel]);

  if (!pendingDelete) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Konfirmasi hapus ${pendingDelete.itemName}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-rose-500/30 bg-white p-5 shadow-2xl dark:bg-[#111422]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Hapus {pendingDelete.entityType}?
              </h3>
              <p className="text-xs text-muted truncate max-w-[260px]">
                {pendingDelete.itemName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-muted hover:text-ink"
            aria-label="Tutup dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-body">
          <p className="font-semibold text-ink">Dampak penghapusan ini:</p>
          <ul className="list-disc pl-4 space-y-1">
            {pendingDelete.impacts.map((imp, idx) => (
              <li key={idx}>{imp}</li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-line/70 px-4 py-2 text-xs font-semibold text-body hover:bg-surface dark:border-line/40"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              pendingDelete.onConfirm();
              onCancel();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
          >
            <Trash2 className="size-3.5" />
            <span>Ya, Hapus dari Draf</span>
          </button>
        </div>
      </div>
    </div>
  );
}
