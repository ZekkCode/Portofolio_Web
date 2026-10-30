"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BUDDY_CONFIG } from "@/lib/buddy/buddy-config";
import { BuddyState, BuddyAPI } from "@/lib/buddy/buddy-types";
import { useBuddyRoaming } from "@/hooks/use-buddy-roaming";
import { BuddySprite } from "@/components/buddy/buddy-sprite";
import { BuddyChat } from "@/components/buddy/buddy-chat";
import "@/components/buddy/buddy.css";

export function BuddyClient() {
  const [mounted, setMounted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState<string>(
    "Halo! Mau aku antar ke seksi proyek, intip tech stack, atau buka berkas CV ATS Zekk?"
  );
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [actionLink, setActionLink] = useState<string | undefined>(undefined);
  const [actionLinkLabel, setActionLinkLabel] = useState<string | undefined>(undefined);

  const replyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize client preferences
  useEffect(() => {
    setMounted(true);

    try {
      const storedHidden = localStorage.getItem(BUDDY_CONFIG.hiddenKey);
      if (storedHidden === "true") {
        setIsHidden(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const isPaused = isChatOpen;

  const { domRef, state, deviceMode, isDocked, playAction, setState } =
    useBuddyRoaming({
      isPaused,
      isHidden,
    });

  // Toggle chat or trigger greeting
  const handleSpriteClick = useCallback(() => {
    if (!isChatOpen) {
      playAction("greeting", 1800);
      setIsChatOpen(true);
    } else {
      setIsChatOpen(false);
    }
  }, [isChatOpen, playAction]);

  const handleSpriteHover = useCallback(() => {
    if (!isChatOpen && state === "idle" && deviceMode === "desktop") {
      playAction("waiting", 1200);
    }
  }, [deviceMode, isChatOpen, playAction, state]);

  // Send message to API
  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      playAction("thinking", 4000);

      try {
        const res = await fetch("/api/buddy/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) {
          throw new Error("Chat response not ok");
        }

        const data = await res.json();
        setLastReply(data.reply || "Ada yang bisa aku bantu lagi?");
        setQuickReplies(data.quickReplies || []);
        setActionLink(data.link);
        setActionLinkLabel(data.linkLabel);

        if (data.action === "success") {
          playAction("success", 2000);
        } else if (data.action === "greeting") {
          playAction("greeting", 1800);
        } else {
          setState("idle");
        }
      } catch {
        setLastReply("Maaf, koneksi ke server sedang sibuk. Coba lagi ya!");
        playAction("failed", 2000);
      } finally {
        setIsLoading(false);
      }
    },
    [playAction, setState]
  );

  // Hide companion
  const handleHide = useCallback(() => {
    setIsHidden(true);
    setIsChatOpen(false);
    try {
      localStorage.setItem(BUDDY_CONFIG.hiddenKey, "true");
    } catch {
      // ignore
    }
  }, []);

  // Restore companion
  const handleShow = useCallback(() => {
    setIsHidden(false);
    playAction("greeting", 1800);
    try {
      localStorage.removeItem(BUDDY_CONFIG.hiddenKey);
    } catch {
      // ignore
    }
  }, [playAction]);

  // Expose global window API for AgentPet compatibility
  useEffect(() => {
    if (typeof window === "undefined") return;

    const api: BuddyAPI = {
      setState,
      play: (act, opts) => playAction(act, opts?.durationMs),
      say: (text, opts) => {
        setLastReply(text);
        setIsChatOpen(true);
        if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
        if (opts?.ttl) {
          replyTimeoutRef.current = setTimeout(() => {
            setIsChatOpen(false);
          }, opts.ttl);
        }
      },
      hide: handleHide,
      show: handleShow,
      toggle: () => (isHidden ? handleShow() : handleHide()),
      get hidden() {
        return isHidden;
      },
      get state() {
        return state;
      },
    };

    window.ZekkBuddy = api;
    window.AgentPet = api;

    return () => {
      delete window.ZekkBuddy;
      delete window.AgentPet;
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    };
  }, [handleHide, handleShow, isHidden, playAction, setState, state]);

  if (!mounted) return null;

  // Minimized dock button when user chooses to hide Miss Minute
  if (isHidden) {
    return (
      <div className="fixed bottom-4 left-4 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={handleShow}
          aria-label="Bangunkan Miss Minute"
          title="Bangunkan Miss Minute (ZekkTech Companion)"
          className="group flex items-center gap-2 rounded-full border border-line/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-brand/40 hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-line/60 dark:bg-[#111422]/95 dark:text-slate-300 dark:hover:bg-[#151928] dark:hover:text-blue-400"
        >
          <span className="text-sm">🕒</span>
          <span className="text-xs font-medium text-ink group-hover:text-brand dark:group-hover:text-blue-400">
            Miss Minute
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={domRef}
      className={`buddy-root pointer-events-none ${isChatOpen ? "!z-50" : ""} ${isDocked ? "opacity-90" : "opacity-100"}`}
      style={{
        transform: "translate3d(24px, 0, 0)",
      }}
    >
      <div className="relative">
        {/* Contextual Chat (Floating on Desktop, Bottom-Sheet on Mobile) */}
        <BuddyChat
          isOpen={isChatOpen}
          deviceMode={deviceMode}
          onClose={() => setIsChatOpen(false)}
          onMinimize={handleHide}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          lastReply={lastReply}
          quickReplies={quickReplies}
          actionLink={actionLink}
          actionLinkLabel={actionLinkLabel}
        />

        {/* Animated Sprite */}
        <BuddySprite
          state={state}
          deviceMode={deviceMode}
          onClick={handleSpriteClick}
          onHover={handleSpriteHover}
        />
      </div>
    </div>
  );
}

export default BuddyClient;
