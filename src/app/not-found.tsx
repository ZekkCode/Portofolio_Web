import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand border border-brand/20 shadow-md">
        <FileQuestion className="size-7" />
      </div>

      <span className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-brand">
        404 — Halaman Tidak Ditemukan
      </span>

      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Halaman yang Dituju Tidak Ada
      </h1>

      <p className="mt-2.5 max-w-md text-sm text-body leading-relaxed">
        Tautan yang Anda tuju mungkin sudah dipindahkan, dihapus, atau alamat URL salah diketik.
      </p>

      <div className="mt-6 flex items-center justify-center">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-ink active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>
      </div>
    </div>
  );
}
