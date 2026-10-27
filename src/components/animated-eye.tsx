"use client";

import React from "react";

interface AnimatedEyeProps {
  isEngaged?: boolean;
  className?: string;
}

export function AnimatedEye({ isEngaged = false, className = "size-3.5" }: AnimatedEyeProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-full h-full transition-colors duration-500 ${
          isEngaged
            ? "text-brand dark:text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
            : "text-body/80 dark:text-slate-400"
        }`}
      >
        {/* Eye Outline Contour */}
        <path
          d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        />

        {/* Iris & Pupil with subtle CSS blink & micro-motion */}
        <circle
          cx="12"
          cy="12"
          r="3"
          className="animate-eye-pupil transition-transform origin-center"
          fill="currentColor"
        />

        {/* Dynamic glint reflection */}
        <circle
          cx="13.2"
          cy="10.8"
          r="0.8"
          fill="#ffffff"
          className="transition-opacity"
        />
      </svg>
    </span>
  );
}
