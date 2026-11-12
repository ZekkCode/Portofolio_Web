import React from "react";
import { Globe } from "lucide-react";

export function SocialIcon({
  label,
  className = "size-5",
}: {
  label: string;
  className?: string;
}) {
  const norm = label.toLowerCase().trim();

  if (norm.includes("github")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    );
  }

  if (norm.includes("instagram")) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" />
      </svg>
    );
  }

  if (norm.includes("tiktok")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
      </svg>
    );
  }

  if (norm.includes("behance")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.666 0-5.5-2.583-5.5-5.875 0-3.328 1.944-5.125 5.25-5.125 3.32 0 4.975 2.115 4.975 4.875 0 .422-.057.822-.125 1.125h-6.852c.071 1.579 1.094 2.658 2.457 2.658 1.157 0 1.916-.625 2.292-1.658h2.229zm-4.75-5.167c-1.125 0-1.875.75-2.083 1.833h4.167c-.042-1.042-.875-1.833-2.084-1.833zm-10.976-1.833h-4v-4h4c1.104 0 2 .896 2 2s-.896 2-2 2zm-4 2h4.5c1.381 0 2.5 1.119 2.5 2.5s-1.119 2.5-2.5 2.5h-4.5v-7zm0-6h-4v13h8.5c2.485 0 4.5-2.015 4.5-4.5 0-1.578-.814-2.969-2.05-3.774 1.246-.777 2.05-2.148 2.05-3.726 0-2.485-2.015-4.5-4.5-4.5h-4.5z" />
      </svg>
    );
  }

  if (norm.includes("linkedin")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66c0 .92.74 1.66 1.66 1.66.92 0 1.66-.74 1.66-1.66 0-.92-.74-1.66-1.66-1.66z" />
      </svg>
    );
  }

  if (norm.includes("trakteer")) {
    return (
      <svg className={className} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M11.8314 5.58468H6.33722C6.00563 5.58468 5.73682 5.85349 5.73682 6.18509C5.73682 6.51668 6.00563 6.78549 6.33722 6.78549H11.8314C12.163 6.78549 12.4318 6.51668 12.4318 6.18509C12.4318 5.85349 12.163 5.58468 11.8314 5.58468Z"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.4753 7.06901H5.60844V7.73163C5.32979 7.86596 5.08538 8.06512 4.89681 8.31435C4.64005 8.6537 4.50076 9.06742 4.5 9.49295L4.5 14.5408C4.5 15.0604 4.70641 15.5588 5.07383 15.9262C5.44124 16.2936 5.93956 16.5 6.45917 16.5H11.7409C12.2605 16.5 12.7588 16.2936 13.1263 15.9262C13.4937 15.5588 13.7001 15.0605 13.7001 14.5408V9.50772C13.7021 9.05391 13.5466 8.61345 13.26 8.26156C13.0502 8.00397 12.7797 7.80555 12.4753 7.68247V7.06901ZM7.21501 12.4238L9.09013 14.2989L10.9652 12.4238C12.3951 10.9957 10.5182 9.12059 9.09013 10.5486C7.64546 9.09842 5.77034 10.9791 7.21501 12.4238Z"
        />
        <path
          fillRule="evenodd"
          d="M8.36022 4.37275C8.36046 3.97012 8.51129 3.58214 8.78306 3.28507C9.05483 2.988 9.42789 2.80333 9.82891 2.76736C9.75907 2.46714 9.60596 2.19272 9.38718 1.97559C9.1684 1.75847 8.89282 1.60745 8.59209 1.53989C8.29135 1.47233 7.97765 1.49095 7.68702 1.59363C7.39639 1.69631 7.14062 1.87887 6.94907 2.12036C6.75752 2.36185 6.63797 2.65247 6.60414 2.95884C6.57031 3.26521 6.62358 3.57491 6.75782 3.85237C6.89207 4.12984 7.10185 4.36381 7.36307 4.52742C7.62429 4.69104 7.92637 4.77766 8.2346 4.77733C8.29631 4.77769 8.35798 4.7746 8.41934 4.7681C8.38315 4.63932 8.36328 4.50649 8.36022 4.37275V4.37275Z"
        />
        <path
          fillRule="evenodd"
          d="M11.3531 5.22811C11.4875 5.01366 11.5619 4.76714 11.5688 4.51418C11.5756 4.26121 11.5146 4.01103 11.392 3.78963C11.2694 3.56824 11.0898 3.3837 10.8718 3.25521C10.6538 3.12671 10.4054 3.05894 10.1523 3.05894C9.89926 3.05894 9.65082 3.12671 9.43282 3.25521C9.21481 3.3837 9.0352 3.56824 8.91264 3.78963C8.79008 4.01103 8.72903 4.26121 8.73587 4.51418C8.7427 4.76714 8.81717 5.01366 8.9515 5.22811H11.3531Z"
        />
      </svg>
    );
  }

  if (norm.includes("twitter") || norm.includes("x.com") || norm === "x") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  // Graceful fallback for any other social link
  return <Globe className={className} aria-hidden="true" />;
}

export function getSocialHoverClasses(label: string): string {
  const norm = label.toLowerCase().trim();

  if (norm.includes("github")) {
    return "hover:text-[#181717] dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 hover:border-slate-900/30 dark:hover:border-white/30";
  }
  if (norm.includes("instagram")) {
    return "hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30";
  }
  if (norm.includes("tiktok")) {
    return "hover:text-[#000000] dark:hover:text-[#25F4EE] hover:bg-black/5 dark:hover:bg-[#25F4EE]/10 hover:border-black/20 dark:hover:border-[#25F4EE]/30";
  }
  if (norm.includes("behance")) {
    return "hover:text-[#0057FF] hover:bg-[#0057FF]/10 hover:border-[#0057FF]/30";
  }
  if (norm.includes("linkedin")) {
    return "hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30";
  }
  if (norm.includes("trakteer")) {
    return "hover:text-[#BE1E2D] dark:hover:text-[#f87171] hover:bg-[#BE1E2D]/10 hover:border-[#BE1E2D]/30";
  }
  if (norm.includes("twitter") || norm.includes("x.com") || norm === "x") {
    return "hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20";
  }

  return "hover:text-brand hover:border-brand/40 hover:bg-brand/5 dark:hover:bg-brand/10";
}
