export function SectionTitle({
  title,
  desc,
  eyebrow,
}: {
  title: string;
  desc?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-bold text-brand dark:border-brand/30 dark:bg-brand/10 dark:text-blue-400">
          <span className="size-1.5 rounded-full bg-brand dark:bg-blue-400" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
        {title}
      </h2>
      {desc && (
        <p className="mt-3 text-base leading-relaxed text-body">
          {desc}
        </p>
      )}
    </div>
  );
}




