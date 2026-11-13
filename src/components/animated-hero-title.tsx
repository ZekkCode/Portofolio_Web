"use client";

import React, { useEffect, useState } from "react";

export function AnimatedHeroTitle({
  name = "Zakaria Mujur Prasetyo",
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const words = (name || "Zakaria Mujur Prasetyo").trim().split(/\s+/);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      if (reduced) {
        setEntered(true);
        return;
      }
      raf2 = window.requestAnimationFrame(() => {
        setEntered(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [name]);

  return (
    <h1
      className={`font-display text-[20px] min-[380px]:text-[22px] sm:text-3xl md:text-[32px] lg:text-[38px] font-extrabold tracking-tight text-ink leading-tight select-none flex flex-wrap min-[350px]:flex-nowrap items-baseline gap-x-1.5 sm:gap-x-2.5 whitespace-normal min-[350px]:whitespace-nowrap ${className}`}
    >
      {words.map((word, wordIdx) => (
        <React.Fragment key={`${word}-${wordIdx}`}>
          {wordIdx > 0 && <span className="sr-only"> </span>}
          <span
            className={`inline-flex cursor-default transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:transition-none ${
              entered
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-3 scale-[0.98]"
            }`}
            style={{
              transitionDelay: `${wordIdx * 80}ms`,
            }}
          >
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
