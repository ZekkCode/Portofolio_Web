"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  ArrowUpRight,
  FolderGit2,
  Layers,
  FileText,
  Mail,
  CornerDownLeft,
  CornerDownRight,
} from "lucide-react";
import { useSmoothScrollTo } from "@/components/parallax";
import { BuddyChatMessage, DeviceMode } from "@/lib/buddy/buddy-types";

interface BuddyChatProps {
  isOpen: boolean;
  deviceMode: DeviceMode;
  onClose: () => void;
  onMinimize?: () => void;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  lastReply: string;
  quickReplies?: string[];
  actionLink?: string;
  actionLinkLabel?: string;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  target?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "projects",
    label: "Proyek",
    query: "Lihat proyek unggulan Zekk",
    target: "#proyek",
    icon: FolderGit2,
  },
  {
    id: "stack",
    label: "Tech Stack",
    query: "Teknologi apa saja yang dikuasai Zekk?",
    target: "#stack",
    icon: Layers,
  },
  {
    id: "cv",
    label: "Berkas CV",
    query: "Bagaimana cara melihat atau download CV ATS Zekk?",
    target: "#cv",
    icon: FileText,
  },
  {
    id: "contact",
    label: "Kontak",
    query: "Kontak dan email Zakaria Mujur P.",
    target: "#kontak",
    icon: Mail,
  },
];

export function BuddyChat({
  isOpen,
  deviceMode,
  onClose,
  onSendMessage,
  isLoading,
  lastReply,
  quickReplies,
  actionLink,
  actionLinkLabel,
}: BuddyChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<BuddyChatMessage[]>([
    {
      id: "initial",
      sender: "buddy",
      text: "Halo! Mau aku antar ke seksi proyek, intip tech stack, atau buka berkas CV ATS Zekk?",
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
      }, 100);
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

  const handleQuickAction = async (action: QuickAction) => {
    if (isLoading) return;

    if (action.target) {
      scrollTo(action.target, -32);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: action.query,
        timestamp: Date.now(),
      },
    ]);

    await onSendMessage(action.query);
  };

  const handleDynamicReply = async (text: string) => {
    if (isLoading) return;

    // Check if reply maps to section navigation
    const lower = text.toLowerCase();
    if (lower.includes("proyek") || lower.includes("project")) {
      scrollTo("#proyek", -32);
    } else if (lower.includes("cv") || lower.includes("resume")) {
      scrollTo("#cv", -32);
    } else if (lower.includes("stack") || lower.includes("keahlian")) {
      scrollTo("#stack", -32);
    } else if (lower.includes("kontak") || lower.includes("contact") || lower.includes("touch")) {
      scrollTo("#kontak", -32);
    }

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
      scrollTo(target, -32);
    } else if (target.startsWith("http") || target.endsWith(".pdf")) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      scrollTo(target, -32);
    }
  };

  const isMobile = deviceMode === "mobile";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      {/* Main Dialogue Card */}
      <div
        ref={containerRef}
        role="dialog"
        aria-label="Dialog Miss Minute"
        className={
          isMobile
            ? "buddy-chat-bottom-sheet relative flex flex-col rounded-2xl border border-line/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-200 dark:border-line/60 dark:bg-[#10131f]/95 dark:text-slate-100 overflow-hidden"
            : "buddy-chat-floating relative flex flex-col rounded-2xl border border-line/80 bg-white/95 shadow-xl shadow-brand/5 backdrop-blur-xl transition-all duration-200 dark:border-line/60 dark:bg-[#10131f]/95 dark:text-slate-100 overflow-visible"
        }
        style={{
          width: isMobile ? "min(320px, calc(100vw - 28px))" : "296px",
          maxHeight: isMobile ? "min(380px, 52dvh)" : "360px",
        }}
      >
        {/* Header: Mascot Identity without AI Slop Clichés */}
        <div className="flex shrink-0 items-center justify-between border-b border-line/60 bg-surface/40 px-3 py-2 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            {/* Miss Minute Pixel Avatar */}
            <div className="relative size-6 shrink-0 overflow-hidden rounded-md border border-brand/25 bg-brand/10 shadow-2xs dark:border-blue-400/30 dark:bg-blue-950/40">
              <div
                className="size-full buddy-pixelated"
                style={{
                  backgroundImage: "url(/pets/miss-minute-blue.webp)",
                  backgroundSize: `${24 * 8}px ${24 * 9}px`,
                  backgroundPosition: "0px 0px",
                  imageRendering: "pixelated",
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h4 className="font-display text-[11.5px] font-bold tracking-tight text-ink">
                  Miss Minute
                </h4>
                <span className="font-mono text-[8.5px] uppercase tracking-wider font-semibold text-brand dark:text-blue-400">
                  Guide
                </span>
              </div>
              <span className="text-[9.5px] text-body leading-none block mt-0.5">
                Pemandu Portofolio
              </span>
            </div>
          </div>

          {/* Single Clean Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Dialog"
            title="Tutup (Esc)"
            className="flex size-6 items-center justify-center rounded-md text-body hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="overflow-y-auto px-3 py-2.5 space-y-2 text-xs max-h-[175px] transition-all">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] px-2.5 py-1.5 text-[11.5px] leading-relaxed ${
                  msg.sender === "user"
                    ? "rounded-2xl rounded-tr-xs bg-brand text-white shadow-2xs dark:bg-blue-600"
                    : "rounded-2xl rounded-tl-xs border border-line/70 bg-surface/80 text-ink shadow-2xs dark:border-line/40 dark:bg-slate-900/70 dark:text-slate-100"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Action Link Button if Returned by Knowledge Base */}
          {actionLink && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => handleLinkClick(actionLink)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white transition-all shadow-2xs dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
              >
                <span>{actionLinkLabel || "Kunjungi Seksi"}</span>
                <ArrowUpRight className="size-3" />
              </button>
            </div>
          )}

          {/* Typing / Waiting Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line/60 bg-surface/80 px-2.5 py-1.5 text-[11px] text-body dark:border-line/40 dark:bg-slate-900/60">
                <span className="size-1.5 rounded-full bg-brand animate-bounce dark:bg-blue-400" />
                <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.15s] dark:bg-blue-400" />
                <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.3s] dark:bg-blue-400" />
                <span className="text-[10.5px] text-body ms-1 font-medium">Mencari info...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Shortcuts: Symmetric 2x2 Command Grid */}
        <div className="shrink-0 border-t border-line/40 bg-surface/30 px-2.5 py-1.5 dark:bg-slate-900/20">
          <div className="grid grid-cols-2 gap-1.5">
            {quickReplies && quickReplies.length > 0
              ? quickReplies.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDynamicReply(q)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-line/70 bg-white px-2 py-1 text-[10.5px] font-medium text-ink transition-all hover:border-brand/50 hover:bg-brand/5 hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300 shadow-2xs active:scale-95 truncate"
                  >
                    <span className="truncate">{q}</span>
                  </button>
                ))
              : DEFAULT_QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickAction(action)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-white px-2.5 py-1 text-[10.5px] font-medium text-ink transition-all hover:border-brand/50 hover:bg-brand/5 hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300 shadow-2xs active:scale-95"
                    >
                      <Icon className="size-3 text-brand dark:text-blue-400 shrink-0" />
                      <span className="truncate">{action.label}</span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Prompt Input Line */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-line/60 bg-white p-2 dark:bg-[#10131f]"
        >
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-2 text-body/50">
              <CornerDownRight className="size-3" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya seputar Zekk..."
              disabled={isLoading}
              className="w-full rounded-lg border border-line/70 bg-surface/50 ps-7 pe-8 py-1.5 text-[11.5px] text-ink placeholder:text-body/60 focus:border-brand focus:bg-white focus:outline-none dark:border-line/40 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 disabled:opacity-50 transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Kirim Pesan"
              title="Kirim (Enter)"
              className="absolute right-1 flex size-5.5 items-center justify-center rounded-md bg-brand text-white transition-all active:scale-90 hover:bg-brand-ink disabled:opacity-30 disabled:pointer-events-none dark:bg-blue-600 dark:hover:bg-blue-500 shadow-2xs"
            >
              <CornerDownLeft className="size-3" />
            </button>
          </div>
        </form>

        {/* Speech Pointer / Caret pointing down to Miss Minute (Desktop/Tablet) */}
        {!isMobile && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1.5 left-6 size-2.5 rotate-45 border-b border-r border-line/80 bg-white dark:border-line/60 dark:bg-[#10131f]"
          />
        )}
      </div>
    </>
  );
}
