"use client";

import React from "react";

export function AnimatedHeroTitle({
  name = "Zakaria Mujur Prasetyo",
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const words = (name || "Zakaria Mujur Prasetyo").trim().split(/\s+/);

  return (
    <h1
      className={`font-display text-2xl sm:text-3xl md:text-[32px] lg:text-[38px] font-extrabold tracking-tight text-ink leading-tight select-none flex flex-wrap sm:flex-nowrap items-baseline gap-x-2 sm:gap-x-2.5 whitespace-normal sm:whitespace-nowrap ${className}`}
    >
      {words.map((word, wordIdx) => (
        <React.Fragment key={`${word}-${wordIdx}`}>
          {wordIdx > 0 && <span className="sr-only"> </span>}
          <span
            className="inline-flex transition-transform duration-300 hover:-translate-y-0.5 cursor-default"
            style={{
              animation: `heroWordEntrance 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${wordIdx * 0.12}s both`,
            }}
          >
            {word.split("").map((char, charIdx) => (
              <span
                key={`${char}-${charIdx}`}
                className="inline-block transition-all duration-200 hover:text-brand hover:-translate-y-1 hover:scale-105 active:scale-95"
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
