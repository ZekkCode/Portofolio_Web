"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useSmoothScrollTo } from "@/components/parallax";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const scrollTo = useSmoothScrollTo();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    scrollTo("#atas", 0);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className={`group fixed bottom-6 end-5 sm:bottom-8 sm:end-8 z-40 flex size-11 sm:size-12 items-center justify-center rounded-full border border-line/80 bg-white/95 text-body shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-brand/40 hover:bg-white hover:text-brand active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-[#111422]/95 dark:text-slate-300 dark:hover:bg-[#151928] dark:hover:text-blue-400 ${
        visible
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="size-4.5 sm:size-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}

export default ScrollToTop;
