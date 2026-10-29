export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4"
      aria-busy="true"
      aria-label="Memuat halaman portofolio"
    >
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-2 border-brand/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
      <p className="font-mono text-xs font-medium text-body tracking-wider animate-pulse">
        MEMUAT ZEKTECH...
      </p>
    </div>
  );
}
