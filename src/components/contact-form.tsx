"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send, ShieldCheck } from "lucide-react";

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  language?: string;
  size?: "normal" | "compact" | "flexible";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface ContactFormProps {
  submitLabel?: string;
  recipientEmail?: string;
}

type FieldKey = "name" | "email" | "subject" | "message";

const EMAIL_PATTERN =
  /^[^\s@<>()[\]\\,;:\"]+@[^\s@<>()[\]\\,;:\"]+\.[^\s@<>()[\]\\,;:\"]{2,}$/;
const TURNSTILE_SCRIPT_ID = "cf-turnstile-api-script";

export function ContactForm({ submitLabel, recipientEmail }: ContactFormProps) {
  const { t, i18n } = useTranslation();
  const { resolvedTheme } = useTheme();
  const locale = (i18n.language || "id").startsWith("en") ? "en" : "id";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(
    () => (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim()
  );
  const [turnstileRequired, setTurnstileRequired] = useState(
    () => Boolean((process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim())
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
    fallbackEmail?: string;
  } | null>(null);

  const startedAtRef = useRef<number>(0);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  // Sinkronisasi konfigurasi runtime Turnstile (mendukung env dinamis tanpa rebuild)
  useEffect(() => {
    let active = true;
    fetch("/api/contact", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { siteKey?: string; turnstileEnabled?: boolean } | null) => {
        if (!active || !data) return;
        const remoteKey = typeof data.siteKey === "string" ? data.siteKey.trim() : "";
        if (remoteKey) {
          setTurnstileSiteKey(remoteKey);
          setTurnstileRequired(Boolean(data.turnstileEnabled ?? true));
        }
      })
      .catch(() => {
        // Abaikan jika offline; tetap memakai NEXT_PUBLIC_TURNSTILE_SITE_KEY bila tersedia
      });

    return () => {
      active = false;
    };
  }, []);

  // Hitung mundur batas cooldown 429
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const resetTurnstileWidget = useCallback(() => {
    setTurnstileToken("");
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Abaikan error reset saat DOM sudah dibersihkan
      }
    }
  }, []);

  const effectiveTheme: "dark" | "light" =
    resolvedTheme === "dark"
      ? "dark"
      : resolvedTheme === "light"
        ? "light"
        : typeof document !== "undefined" && document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";

  // Muat skrip & render widget Cloudflare Turnstile
  useEffect(() => {
    if (!turnstileSiteKey) return;

    let cancelled = false;
    let mountedInRun = false;

    const mountWidget = () => {
      if (cancelled || mountedInRun || !widgetContainerRef.current || !window.turnstile) return;
      mountedInRun = true;

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }

      widgetContainerRef.current.innerHTML = "";
      setTurnstileToken("");

      try {
        const containerWidth = widgetContainerRef.current.clientWidth || window.innerWidth;
        const widgetSize: "compact" | "flexible" = containerWidth < 305 ? "compact" : "flexible";
        const id = window.turnstile.render(widgetContainerRef.current, {
          sitekey: turnstileSiteKey,
          theme: effectiveTheme,
          language: locale,
          size: widgetSize,
          callback: (token) => {
            if (cancelled) return;
            setTurnstileToken(token);
            setTurnstileReady(true);
          },
          "expired-callback": () => {
            if (cancelled) return;
            setTurnstileToken("");
          },
          "error-callback": () => {
            if (cancelled) return;
            setTurnstileToken("");
          },
        });
        widgetIdRef.current = id;
        setTurnstileReady(true);
      } catch {
        mountedInRun = false;
        setTurnstileReady(false);
      }
    };

    if (window.turnstile) {
      mountWidget();
    } else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        document.head.appendChild(script);
      }

      let pollId = 0;
      const onLoad = () => {
        window.clearInterval(pollId);
        mountWidget();
      };
      script.addEventListener("load", onLoad);

      pollId = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(pollId);
          mountWidget();
        }
      }, 150);

      return () => {
        cancelled = true;
        script?.removeEventListener("load", onLoad);
        window.clearInterval(pollId);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [turnstileSiteKey, effectiveTheme, locale]);

  const validateClient = (): boolean => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      errors.name = t("contact.form.errors.name");
    }
    if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 160) {
      errors.email = t("contact.form.errors.email");
    }
    if (cleanSubject.length > 150) {
      errors.subject = t("contact.form.errors.subject");
    }
    if (cleanMessage.length < 10 || cleanMessage.length > 3000) {
      errors.message = t("contact.form.errors.message");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resolveLocalizedServerError = (data: {
    code?: string;
    error?: string;
    retryAfterSeconds?: number;
  }): string => {
    const wait = data.retryAfterSeconds || 0;
    if (locale === "en") {
      switch (data.code) {
        case "RATE_LIMIT_BURST":
        case "RATE_LIMIT_COOLDOWN":
        case "RATE_LIMIT_IP_WINDOW":
        case "RATE_LIMIT_IP_HOURLY":
        case "RATE_LIMIT_EMAIL":
          return wait > 0
            ? `Too many requests. Please wait ${wait}s before trying again.`
            : "Too many messages sent recently. Please try again later.";
        case "DUPLICATE_MESSAGE":
          return "You already sent this exact message recently. Please edit your message to follow up.";
        case "TURNSTILE_REQUIRED":
          return t("contact.form.turnstileMissing");
        case "TURNSTILE_FAILED":
          return "Turnstile security verification failed or expired. Please complete it again.";
        case "TURNSTILE_NOT_CONFIGURED":
          return "Security verification is not configured on this server yet.";
        case "EMAIL_NOT_CONFIGURED":
          return "Direct email delivery is not configured on the server yet.";
        case "SUBMIT_TOO_FAST":
          return "Submission was too fast. Please wait a second and try again.";
        default:
          return t("contact.form.errors.generic");
      }
    }
    return data.error || t("contact.form.errors.generic");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || cooldownSeconds > 0) return;

    setStatus(null);
    if (!validateClient()) return;

    if (turnstileSiteKey && turnstileRequired && !turnstileToken) {
      setStatus({
        type: "error",
        message: t("contact.form.turnstileMissing"),
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          website: honeypot,
          startedAt: startedAtRef.current || Date.now(),
          turnstileToken,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: string;
        retryAfterSeconds?: number;
        fallbackEmail?: string;
        fieldErrors?: Partial<Record<FieldKey, string>>;
      };

      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        if (typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds > 0) {
          setCooldownSeconds(data.retryAfterSeconds);
        }
        resetTurnstileWidget();
        setStatus({
          type: "error",
          message: resolveLocalizedServerError(data),
          fallbackEmail: data.fallbackEmail || recipientEmail,
        });
        return;
      }

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setFieldErrors({});
      startedAtRef.current = Date.now();
      resetTurnstileWidget();
      setStatus({
        type: "success",
        message: t("contact.form.successMsg"),
      });
    } catch {
      resetTurnstileWidget();
      setStatus({
        type: "error",
        message: t("contact.form.errors.generic"),
        fallbackEmail: recipientEmail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSuccess = () => {
    setStatus(null);
    startedAtRef.current = Date.now();
  };

  if (status?.type === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/25"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-3">
            <p className="font-semibold text-ink dark:text-emerald-200">
              {status.message}
            </p>
            <button
              type="button"
              onClick={handleResetSuccess}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            >
              {t("contact.form.sendAnother")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputBaseClass =
    "w-full rounded-xl border border-line bg-slate-50/70 px-3.5 py-2.5 text-sm text-ink placeholder:text-body/55 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-line/60 dark:bg-[#0b0e1a] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:bg-[#0b0e1a]";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Honeypot anti-bot tersembunyi */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="contact-name"
            className="block text-xs font-semibold text-ink dark:text-slate-200"
          >
            {t("contact.form.nameLabel")}
            <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder={t("contact.form.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            className={inputBaseClass}
          />
          {fieldErrors.name && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="contact-email"
            className="block text-xs font-semibold text-ink dark:text-slate-200"
          >
            {t("contact.form.emailLabel")}
            <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder={t("contact.form.emailPlaceholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            className={inputBaseClass}
          />
          {fieldErrors.email && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="contact-subject"
            className="block text-xs font-semibold text-ink dark:text-slate-200"
          >
            {t("contact.form.subjectLabel")}
          </label>
          <span className="text-[11px] text-body/70 dark:text-slate-400">
            {t("contact.form.subjectOptional")}
          </span>
        </div>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          maxLength={150}
          placeholder={t("contact.form.subjectPlaceholder")}
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (fieldErrors.subject) setFieldErrors((p) => ({ ...p, subject: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.subject)}
          className={inputBaseClass}
        />
        {fieldErrors.subject && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.subject}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="contact-message"
            className="block text-xs font-semibold text-ink dark:text-slate-200"
          >
            {t("contact.form.messageLabel")}
            <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>
          </label>
          <span className="font-mono text-[11px] tabular-nums text-body/70 dark:text-slate-400">
            {message.length}/3000
          </span>
        </div>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          maxLength={3000}
          placeholder={t("contact.form.messagePlaceholder")}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.message)}
          className={`${inputBaseClass} resize-y min-h-[112px]`}
        />
        {fieldErrors.message && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{fieldErrors.message}</p>
        )}
      </div>

      {turnstileSiteKey && (
        <div className="w-full max-w-full overflow-hidden pt-0.5">
          <div
            ref={widgetContainerRef}
            data-turnstile-ready={turnstileReady ? "true" : "false"}
            className="min-h-[65px] w-full"
          />
        </div>
      )}

      {status?.type === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1.5">
              <p className="font-medium leading-relaxed">{status.message}</p>
              {cooldownSeconds > 0 && (
                <p className="font-mono text-[11px] opacity-90">
                  {t("contact.form.rateLimitWait", { seconds: cooldownSeconds })}
                </p>
              )}
              {status.fallbackEmail && (
                <p className="pt-0.5">
                  <span className="mr-1.5 opacity-85">{t("contact.form.fallbackAction")}</span>
                  <a
                    href={`mailto:${status.fallbackEmail}`}
                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    <Mail className="size-3" />
                    <span>{status.fallbackEmail}</span>
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting || cooldownSeconds > 0}
          className="inline-flex min-h-[46px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{t("contact.form.sendingBtn")}</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>
                {cooldownSeconds > 0
                  ? `${cooldownSeconds}s`
                  : submitLabel || t("contact.form.sendBtn")}
              </span>
            </>
          )}
        </button>

        <p className="inline-flex items-center gap-1.5 text-[11px] leading-snug text-body/75 dark:text-slate-400">
          <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
          <span>{t("contact.form.securityNote")}</span>
        </p>
      </div>
    </form>
  );
}
