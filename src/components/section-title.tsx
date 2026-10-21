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
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight">
        {title}
      </h2>
      {desc && <p className="mt-3 text-base leading-relaxed text-body">{desc}</p>}
    </div>
  );
}

