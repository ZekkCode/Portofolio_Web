import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth-server";
import { runR2Diagnostics } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * Endpoint Diagnostik Cloudflare R2 Khusus Administrator
 * 
 * Keamanan:
 * - Wajib autentikasi administrator via session cookie, Supabase SSR, atau secret header.
 * - Non-admin menerima HTTP 401 Unauthorized.
 * - Mengembalikan laporan status koneksi S3 yang disanitasi tanpa membocorkan access key atau secret.
 * - Tidak mengekspos daftar objek bucket ke publik.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { error: "Akses ditolak: Endpoint diagnostik hanya dapat diakses oleh administrator terotentikasi." },
      { status: 401 }
    );
  }

  try {
    const diagnostic = await runR2Diagnostics();
    const status = diagnostic.ok ? 200 : diagnostic.status === "missing_credentials" ? 503 : 502;

    return NextResponse.json(diagnostic, { status });
  } catch (err) {
    console.error("[api/admin/r2-diagnostic] Diagnostik gagal:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      {
        ok: false,
        status: "internal_error",
        message: "Terjadi kesalahan server saat menjalankan diagnostik storage.",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
