"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("zakariamujur6@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        setLoading(false);
        return;
      }

      // Berhasil login, arahkan ke dashboard
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server autentikasi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-[#07080e]">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-body hover:text-ink transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Portofolio</span>
          </Link>
        </div>

        {/* Card Shell */}
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xl dark:border-line/60 dark:bg-[#0f121d]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-blue-950/40 dark:text-blue-400">
              <Lock className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-ink">
                Autentikasi Administrator
              </h1>
              <p className="text-xs text-body">ZekkTech Portfolio Management</p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-body border-t border-line/60 pt-4 dark:border-line/40">
            Akses terbatas hanya untuk pemilik portofolio. Seluruh sesi, hak tulis, dan mutasi data diverifikasi langsung oleh server.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink">
                Email Administrator
              </label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 ps-9 text-xs text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-line/60 dark:bg-[#151928]"
                />
                <Mail className="absolute left-3 top-3 size-3.5 text-muted" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">
                Kata Sandi
              </label>
              <div className="relative mt-1.5">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 ps-9 text-xs text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-line/60 dark:bg-[#151928]"
                />
                <Lock className="absolute left-3 top-3 size-3.5 text-muted" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-ink active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? "Memverifikasi Sesi..." : "Masuk ke Panel Admin"}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>

          <div className="mt-6 border-t border-line/60 pt-4 text-center dark:border-line/40">
            <p className="text-[11px] text-muted">
              Perlindungan sesi HTTPS + HTTP-Only Cookie + CSRF Guard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

