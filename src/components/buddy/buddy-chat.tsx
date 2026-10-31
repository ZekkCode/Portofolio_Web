"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  target?: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
  triggerRef,
}: BuddyChatProps) {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language?.startsWith("en"));

  const inputId = useId();
  const titleId = useId();
  const descId = useId();

  const [input, setInput] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [messages, setMessages] = useState<BuddyChatMessage[]>(() => [
    {
      id: "initial",
      sender: "buddy",
      text: isEn
        ? "Hi! Want me to guide you to projects, inspect tech stack, or open Zekk's ATS CV?"
        : "Halo! Mau aku antar ke seksi proyek, intip tech stack, atau buka berkas CV ATS Zekk?",
      timestamp: 0,
    },
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const lastReplySeenRef = useRef<string>(lastReply);
  const scrollTo = useSmoothScrollTo();

  // Dynamic quick actions supporting English and Indonesian
  const quickActions: QuickAction[] = [
    {
      id: "projects",
      label: isEn ? "Projects" : "Proyek",
      query: isEn ? "Show Zekk's featured projects" : "Lihat proyek unggulan Zekk",
      target: "#proyek",
      icon: FolderGit2,
    },
    {
      id: "stack",
      label: "Tech Stack",
      query: isEn ? "What technologies does Zekk master?" : "Teknologi apa saja yang dikuasai Zekk?",
      target: "#stack",
      icon: Layers,
    },
    {
      id: "cv",
      label: isEn ? "ATS Resume" : "Berkas CV",
      query: isEn ? "How can I preview or download Zekk's ATS CV?" : "Bagaimana cara melihat atau download CV ATS Zekk?",
      target: "#cv",
      icon: FileText,
    },
    {
      id: "contact",
      label: isEn ? "Contact" : "Kontak",
      query: isEn ? "Contact and email of Zakaria Mujur P." : "Kontak dan email Zakaria Mujur P.",
      target: "#kontak",
      icon: Mail,
    },
  ];

  // Sync incoming replies from assistant
  useEffect(() => {
    if (lastReply && lastReply !== lastReplySeenRef.current) {
      lastReplySeenRef.current = lastReply;
      const textToAppend = lastReply;
      queueMicrotask(() => {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.sender === "buddy" && lastMsg.text === textToAppend) {
            return prev;
          }
          return [
            ...prev,
            {
              id: `buddy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              sender: "buddy",
              text: textToAppend,
              timestamp: Date.now(),
            },
          ];
        });
        setAnnouncement(`${isEn ? "Miss Minute replied: " : "Miss Minute membalas: "}${textToAppend}`);
      });
    }
  }, [lastReply, isEn]);

  // Screen reader announcement when waiting for API
  useEffect(() => {
    if (isLoading) {
      queueMicrotask(() => {
        setAnnouncement(
          isEn
            ? "Miss Minute is searching information..."
            : "Miss Minute sedang mencari informasi..."
        );
      });
    }
  }, [isLoading, isEn]);

  // Independent message scrolling: scroll only the chat thread container, NEVER window.scrollIntoView
  useEffect(() => {
    if (!isOpen) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    // Auto-scroll only when user is already near bottom to avoid disrupting older reading
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 90;

    if (isNearBottom || messages.length <= 2) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen, isLoading]);

  // Handle closing with focus restoration to companion trigger button
  const handleClose = useCallback(() => {
    onClose();
    if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    } else if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [onClose, triggerRef]);

  // Focus input ONLY on desktop when explicitly opened; NEVER on mobile to prevent virtual keyboard popup
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current =
        (triggerRef?.current as HTMLElement) || (document.activeElement as HTMLElement);

      if (deviceMode === "desktop") {
        const timer = setTimeout(() => {
          inputRef.current?.focus({ preventScroll: true });
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, deviceMode, triggerRef]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Close when clicking outside chat dialog
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        containerRef.current?.contains(target) ||
        target.closest(".buddy-interactive")
      ) {
        return;
      }

      handleClose();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, handleClose]);

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

    // Keep focus inside input after sending on desktop
    if (deviceMode === "desktop") {
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (isLoading) return;

    if (action.target) {
      scrollTo(action.target);
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
      scrollTo("#proyek");
    } else if (lower.includes("cv") || lower.includes("resume")) {
      scrollTo("#cv");
    } else if (lower.includes("stack") || lower.includes("keahlian")) {
      scrollTo("#stack");
    } else if (lower.includes("kontak") || lower.includes("contact") || lower.includes("touch")) {
      scrollTo("#kontak");
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
      scrollTo(target);
    } else if (target.startsWith("http") || target.endsWith(".pdf")) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      scrollTo(target);
    }
  };

  return (
    <>
      {/* Invisible Screen Reader Live Region for Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Main Dialogue Speech Balloon */}
      <div
        ref={containerRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="buddy-chat-floating relative flex flex-col rounded-2xl border border-line/80 bg-white/95 shadow-xl shadow-brand/10 backdrop-blur-xl transition-all duration-200 dark:border-line/60 dark:bg-[#10131f]/95 dark:text-slate-100 overflow-visible focus:outline-none"
        style={{
          width: "min(312px, calc(100vw - 32px))",
          maxHeight: "min(390px, 54dvh)",
        }}
      >
        {/* Header: Mascot Identity without AI Slop Clichés */}
        <div className="flex shrink-0 items-center justify-between border-b border-line/60 bg-surface/40 px-3.5 py-2.5 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
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
                <h4
                  id={titleId}
                  className="font-display text-xs font-bold tracking-tight text-ink"
                >
                  Miss Minute
                </h4>
                <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-brand dark:text-blue-400">
                  Guide
                </span>
              </div>
              <span
                id={descId}
                className="text-[10px] text-body leading-none block mt-0.5"
              >
                {isEn ? "Portfolio Guide" : "Pemandu Portofolio"}
              </span>
            </div>
          </div>

          {/* Accessible Close Button (WCAG 44x44px touch target) */}
          <button
            type="button"
            onClick={handleClose}
            aria-label={isEn ? "Close Miss Minute dialog" : "Tutup dialog Miss Minute"}
            title={isEn ? "Close (Esc)" : "Tutup (Esc)"}
            className="relative flex min-h-[44px] min-w-[44px] -my-2.5 -me-2.5 items-center justify-center text-body hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:text-white transition-colors touch-manipulation rounded-lg"
          >
            <span className="flex size-7 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Message Thread (Isolated Scroll Container) */}
        <div
          ref={messagesContainerRef}
          tabIndex={0}
          role="region"
          aria-label={isEn ? "Chat messages history" : "Riwayat pesan chat"}
          className="overflow-y-auto px-3.5 py-3 space-y-2.5 text-xs max-h-[185px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] px-3 py-2 text-[12.5px] sm:text-xs md:text-[13px] leading-relaxed ${
                  msg.sender === "user"
                    ? "rounded-2xl rounded-tr-xs bg-brand text-white shadow-2xs dark:bg-blue-600 font-medium"
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
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs sm:text-[11.5px] font-semibold text-brand hover:bg-brand hover:text-white transition-all shadow-2xs dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span>{actionLinkLabel || (isEn ? "Visit Section" : "Kunjungi Seksi")}</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Typing / Waiting Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div
                aria-label={isEn ? "Searching information..." : "Mencari info..."}
                className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line/60 bg-surface/80 px-3 py-2 text-xs text-body dark:border-line/40 dark:bg-slate-900/60"
              >
                <span className="size-1.5 rounded-full bg-brand animate-bounce dark:bg-blue-400" />
                <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.15s] dark:bg-blue-400" />
                <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.3s] dark:bg-blue-400" />
                <span className="text-[11px] text-body ms-1 font-medium">
                  {isEn ? "Searching info..." : "Mencari info..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Shortcuts: Symmetric 2x2 Command Grid */}
        <div className="shrink-0 border-t border-line/40 bg-surface/30 px-3 py-2 dark:bg-slate-900/20">
          <div className="grid grid-cols-2 gap-1.5">
            {quickReplies && quickReplies.length > 0
              ? quickReplies.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDynamicReply(q)}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-line/70 bg-white px-2.5 py-1.5 text-xs sm:text-[11px] font-medium text-ink transition-all hover:border-brand/50 hover:bg-brand/5 hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300 shadow-2xs active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand truncate"
                  >
                    <span className="truncate">{q}</span>
                  </button>
                ))
              : quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickAction(action)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-line/70 bg-white px-2.5 py-1.5 text-xs sm:text-[11px] font-medium text-ink transition-all hover:border-brand/50 hover:bg-brand/5 hover:text-brand disabled:opacity-50 dark:border-line/40 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300 shadow-2xs active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <Icon className="size-3.5 text-brand dark:text-blue-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{action.label}</span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Prompt Input Line with Explicit Accessible Label & WCAG 44x44px Touch Target */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-line/60 bg-white p-2.5 dark:bg-[#10131f]"
        >
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-2.5 text-body/50">
              <CornerDownRight className="size-3.5" aria-hidden="true" />
            </div>

            {/* Screen Reader Label */}
            <label htmlFor={inputId} className="sr-only">
              {isEn
                ? "Ask Miss Minute about Zekk's portfolio"
                : "Tanya Miss Minute seputar portofolio Zekk"}
            </label>

            <input
              id={inputId}
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isEn ? "Ask anything about Zekk..." : "Tanya seputar Zekk..."
              }
              aria-label={
                isEn
                  ? "Type message for Miss Minute"
                  : "Tulis pesan untuk Miss Minute"
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-line/70 bg-surface/50 ps-8 pe-11 py-2 text-base sm:text-xs md:text-[13px] text-ink placeholder:text-body/60 focus:border-brand focus:bg-white focus:outline-none dark:border-line/40 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:bg-slate-900 disabled:opacity-50 transition-colors"
            />

            {/* Accessible Send Button (WCAG 44x44px minimum touch target) */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label={
                isEn ? "Send message to Miss Minute" : "Kirim pesan ke Miss Minute"
              }
              title={isEn ? "Send (Enter)" : "Kirim (Enter)"}
              className="absolute right-0 top-0 bottom-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-brand dark:text-blue-400 hover:text-brand-ink disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-r-lg"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-white shadow-2xs hover:bg-brand-ink dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-90 transition-all">
                <CornerDownLeft className="size-3.5" aria-hidden="true" />
              </span>
            </button>
          </div>
        </form>

        {/* Speech Pointer / Caret pointing down to Miss Minute */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1.5 left-6 size-2.5 rotate-45 border-b border-r border-line/80 bg-white dark:border-line/60 dark:bg-[#10131f]"
        />
      </div>
    </>
  );
}
