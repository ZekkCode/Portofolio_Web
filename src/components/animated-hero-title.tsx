"use client";

import React from "react";

export function AnimatedHeroTitle({
  name = "Zakaria Mujur Prasetyo",
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const cleanName = (name || "Zakaria Mujur Prasetyo").trim();
  const words = cleanName.split(/\s+/);

  return (
    <h1
      aria-label={cleanName}
      className={`font-display text-[20px] min-[380px]:text-[22px] sm:text-3xl md:text-[32px] lg:text-[38px] font-extrabold tracking-tight text-ink leading-tight select-none flex flex-wrap min-[350px]:flex-nowrap items-baseline gap-x-1.5 sm:gap-x-2.5 whitespace-normal min-[350px]:whitespace-nowrap ${className}`}
    >
      {words.map((word, wordIdx) => (
        <React.Fragment key={`${word}-${wordIdx}`}>
          {wordIdx > 0 && <span className="sr-only"> </span>}
          <span className="inline-flex cursor-default opacity-100 translate-y-0 scale-100">
            {word.split("").map((char, charIdx) => (
              <span
                key={`${char}-${charIdx}`}
                className="inline-block transition-all duration-200 hover:text-brand hover:-translate-y-1 hover:scale-105 active:scale-95 motion-reduce:transform-none"
              >
                {char}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </h1>
  );
}
