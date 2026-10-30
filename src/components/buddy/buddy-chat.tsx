"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, ExternalLink, Sparkles, Minus } from "lucide-react";
import { useSmoothScrollTo } from "@/components/parallax";

interface BuddyChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  lastReply: string;
  quickReplies?: string[];
  actionLink?: string;
  actionLinkLabel?: string;
}

export function BuddyChat({
  isOpen,
  onClose,
  onMinimize,
  onSendMessage,
  isLoading,
  lastReply,
  quickReplies = ["Siapa Zekk?", "Proyek Unggulan", "Lihat CV", "Hubungi Zekk"],
  actionLink,
  actionLinkLabel,
}: BuddyChatProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTo = useSmoothScrollTo();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await onSendMessage(msg);
  };

  const handleQuickClick = async (text: string) => {
    if (isLoading) return;
    await onSendMessage(text);
  };

  const handleLinkClick = (target: string) => {
    scrollTo(target, 0);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Obrolan Miss Minute"
      className="pointer-events-auto absolute bottom-[calc(100%+12px)] left-0 z-50 w-72 sm:w-80 select-text rounded-2xl border border-line/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-line/60 dark:bg-[#111422]/95 dark:text-slate-100"
      style={{
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-blue-500/20 dark:text-blue-400">
            <Sparkles className="size-3" />
          </div>
          <div>
            <h4 className="font-display text-xs font-bold text-ink">Miss Minute</h4>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-body">Zekk Companion</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Kecilkan Miss Minute"
            title="Kecilkan ke dock pojok bawah"
            className="flex size-6 items-center justify-center rounded-lg text-body hover:bg-surface hover:text-ink transition-colors dark:hover:bg-slate-800"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup obrolan"
            title="Tutup dialog"
            className="flex size-6 items-center justify-center rounded-lg text-body hover:bg-surface hover:text-ink transition-colors dark:hover:bg-slate-800"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Bubble Message Body */}
      <div className="my-3 space-y-2.5 text-xs">
        <div className="rounded-xl border border-line/60 bg-surface/70 p-2.5 leading-relaxed text-body dark:bg-slate-900/60 dark:text-slate-200">
          {isLoading ? (
            <div className="flex items-center gap-2 py-1 text-brand dark:text-blue-400">
              <span className="size-2 rounded-full bg-brand animate-ping dark:bg-blue-400" />
              <span className="text-[11px] font-medium">Sedang berpikir...</span>
            </div>
          ) : (
            <p className="whitespace-pre-line">{lastReply}</p>
          )}

          {actionLink && !isLoading && (
            <button
              type="button"
              onClick={() => handleLinkClick(actionLink)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white"
            >
              <span>{actionLinkLabel || "Buka Halaman"}</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {!isLoading && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {quickReplies.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickClick(chip)}
                className="rounded-full border border-line/70 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-body transition-all hover:border-brand/50 hover:bg-brand/10 hover:text-brand dark:border-line/40 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative mt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya tentang Zekk..."
          maxLength={300}
          disabled={isLoading}
          className="w-full rounded-xl border border-line/80 bg-surface/60 py-2 pl-3 pr-9 text-xs text-ink placeholder:text-body/60 outline-none transition-colors focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand dark:border-line/60 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:bg-slate-950"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Kirim pertanyaan"
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-brand text-white transition-opacity disabled:opacity-30 dark:bg-blue-600"
        >
          <Send className="size-3" />
        </button>
      </form>

      {/* Subtle speech pointer notch at bottom */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1.5 left-6 size-3 rotate-45 border-b border-r border-line/80 bg-white dark:border-line/60 dark:bg-[#111422]"
      />
    </div>
  );
}
