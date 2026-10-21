export function SectionTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="font-display text-3xl leading-tight uppercase sm:text-4xl text-ink">
        {title}
      </h2>
      {desc && <p className="mt-3 text-sm leading-relaxed text-body sm:text-base">{desc}</p>}
    </div>
  );
}

