"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SiteConfig } from "@/lib/site-config";
import { publishCloudConfig } from "@/lib/site-store";
import { ArrowLeft, Eye, Send } from "lucide-react";
import Home from "@/app/page";

interface PreviewClientProps {
  initialConfig: SiteConfig;
  userEmail: string;
}

export function PreviewClient({ initialConfig }: PreviewClientProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishStatus(null);
    try {
      const res = await publishCloudConfig(initialConfig);
      if (res.success) {
        setPublishStatus("Draf berhasil dipublikasikan ke situs publik!");
        setTimeout(() => {
          router.push("/admin");
        }, 1200);
      } else {
        setPublishStatus(`Gagal publikasi: ${res.message || "Periksa integritas data"}`);
      }
    } catch {
      setPublishStatus("Koneksi gagal");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Floating Top Draft Preview Banner */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/90 px-4 py-2.5 text-slate-950 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-slate-950 animate-ping" />
          <Eye className="size-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Mode Pratinjau Draf CMS (Privat)
          </span>
          <span className="hidden sm:inline text-xs opacity-80">
            • Konten ini belum tampil untuk pengunjung publik
          </span>
        </div>

        <div className="flex items-center gap-2">
          {publishStatus && (
            <span className="text-xs font-semibold bg-white/40 px-2.5 py-0.5 rounded-lg">
              {publishStatus}
            </span>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Editor</span>
          </Link>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>{publishing ? "Mempublikasikan..." : "Publikasikan Sekarang"}</span>
          </button>
        </div>
      </div>

      {/* Render Public Home Page */}
      <Home />
    </div>
  );
}
