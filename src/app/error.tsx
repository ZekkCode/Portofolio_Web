"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error secara aman tanpa membocorkan credentials atau stack internal ke user
    console.error("[Application Error Boundary Caught]:", error?.message || error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md">
        <AlertCircle className="size-7" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Terjadi Kendala Teknis
      </h1>

      <p className="mt-2.5 max-w-md text-sm text-body leading-relaxed">
        Halaman mengalami kendala saat memuat antarmuka grafis atau data. Silakan coba muat ulang sesi Anda.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCcw className="size-4" />
          <span>Muat Ulang Komponen</span>
        </button>

        <a
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <span>Kembali ke Beranda</span>
        </a>
      </div>
    </div>
  );
}
