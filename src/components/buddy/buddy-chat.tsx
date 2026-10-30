"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, ExternalLink, Sparkles, Minus, ArrowUpRight } from "lucide-react";
import { useSmoothScrollTo } from "@/components/parallax";
import { BuddyChatMessage, DeviceMode } from "@/lib/buddy/buddy-types";

interface BuddyChatProps {
  isOpen: boolean;
  deviceMode: DeviceMode;
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
  deviceMode,
  onClose,
  onMinimize,
  onSendMessage,
  isLoading,
  lastReply,
  quickReplies = ["Siapa Zekk?", "Lihat Proyek", "Tech Stack", "Download CV"],
  actionLink,
  actionLinkLabel,
}: BuddyChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BuddyChatMessage[]>([
    {
      id: "initial",
      sender: "buddy",
      text: "Hi! Aku Miss Minute, companion portofolio Zekk. Mau lihat proyek, tech stack, CV ATS, atau tanya sesuatu?",
      timestamp: Date.now(),
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTo = useSmoothScrollTo();

  // Append new reply to message list when lastReply changes
  useEffect(() => {
    if (lastReply) {
      setMessages((prev) => {
        // Prevent duplicate appending of the same message
        const last = prev[prev.length - 1];
        if (last && last.sender === "buddy" && last.text === lastReply) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: "buddy",
            text: lastReply,
            timestamp: Date.now(),
          },
        ];
      });
    }
  }, [lastReply]);

  // Auto-scroll messages container
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
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
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Append user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: Date.now(),
      },
    ]);

    setInput("");
    await onSendMessage(trimmed);
  };

  const handleQuickClick = async (text: string) => {
    if (isLoading) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: Date.now(),
      },
    ]);
    await onSendMessage(text);
  };

  const handleLinkClick = (target: string) => {
    if (target.startsWith("#")) {
      scrollTo(target, 0);
    } else if (target.startsWith("http") || target.endsWith(".pdf")) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      scrollTo(target, 0);
    }
    onClose();
  };

  const isMobile = deviceMode === "mobile";

  return (
    <>
      {/* Mobile Subtle Backdrop */}
      {isMobile && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-2xs transition-opacity md:hidden"
        />
      )}

      {/* Main Chat Window */}
      <div
        ref={containerRef}
        role="dialog"
        aria-label="Obrolan Miss Minute"
        className={
          isMobile
            ? "buddy-chat-bottom-sheet flex flex-col rounded-3xl border border-line/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-line/60 dark:bg-[#111422]/95 dark:text-slate-100 overflow-hidden"
            : "buddy-chat-floating flex flex-col rounded-2xl border border-line/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-line/60 dark:bg-[#111422]/95 dark:text-slate-100 overflow-hidden"
        }
        style={{
          width: isMobile ? "calc(100vw - 24px)" : "320px",
          maxHeight: isMobile ? "60dvh" : "440px",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line/60 bg-surface/50 px-3.5 py-2.5 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-2xs dark:bg-blue-500/20 dark:text-blue-400">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display text-xs font-bold text-ink">Miss Minute</h4>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-body">ZekkTech AI Pet</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Sembunyikan Miss Minute"
              title="Sembunyikan ke pojok"
              className="flex size-7 items-center justify-center rounded-lg text-body hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Obrolan"
              title="Tutup Obrolan (Esc)"
              className="flex size-7 items-center justify-center rounded-lg text-body hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Message History */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                  msg.sender === "user"
                    ? "rounded-tr-xs bg-brand text-white dark:bg-blue-600"
                    : "rounded-tl-xs border border-line/60 bg-surface/80 text-ink dark:border-line/40 dark:bg-slate-900/60"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Action Link Button if Available */}
          {actionLink && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleLinkClick(actionLink)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-all shadow-2xs dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
              >
                <span>{actionLinkLabel || "Buka Tautan"}</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          )}

          {/* Thinking / Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line/60 bg-surface/80 px-3 py-2 text-xs text-body dark:border-line/40 dark:bg-slate-900/60">
                <span className="size-1.5 rounded-full bg-blue-500 animate-bounce" />
                <span className="size-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-body ms-1">Sedang berpikir...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Chips */}
        {quickReplies.length > 0 && (
          <div className="shrink-0 border-t border-line/40 bg-surface/30 px-3 py-2 dark:bg-slate-900/20">
            <div className="flex flex-wrap gap-1.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickClick(q)}
                  className="rounded-lg border border-line/70 bg-white/90 px-2 py-1 text-[11px] font-medium text-ink transition-all hover:border-brand/50 hover:bg-brand/5 hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pinned Input Form */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-line/60 bg-white p-2.5 dark:bg-[#111422]"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya seputar Zekk..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-line/70 bg-surface/50 px-3 py-2 text-xs text-ink placeholder:text-body focus:border-brand focus:bg-white focus:outline-none dark:border-line/40 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Kirim Pesan"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-transform active:scale-95 hover:bg-brand/90 disabled:opacity-40 disabled:pointer-events-none dark:bg-blue-600 dark:hover:bg-blue-500 shadow-2xs"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
