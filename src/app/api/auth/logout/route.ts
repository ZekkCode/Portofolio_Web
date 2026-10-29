import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyCsrfOrigin } from "@/lib/auth-server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Permintaan lintas domain ditolak" },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);

    // Logout dari Supabase SSR jika aktif
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        // Abaikan jika offline
      }
    }

    return NextResponse.json({ success: true, message: "Berhasil keluar" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal logout";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

