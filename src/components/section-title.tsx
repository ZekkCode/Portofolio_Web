export function SectionTitle({
  title,
  desc,
}: {
  title: string;
  desc?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink leading-[1.15]">
        {title}
      </h2>
      {desc && (
        <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-body">
          {desc}
        </p>
      )}
    </div>
  );
}




