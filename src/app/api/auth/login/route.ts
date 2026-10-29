import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifyCsrfOrigin,
} from "@/lib/auth-server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // 1. Validasi CSRF / Origin
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Permintaan lintas domain (Cross-Origin) ditolak" },
      { status: 403 }
    );
  }

  // 2. Rate Limiting: Maksimal 5 percobaan per 15 menit per IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1").trim();
  const rate = checkRateLimit(`login:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 15 menit.",
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "zakariamujur6@gmail.com").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

    // A. Percobaan login via Supabase Auth jika URL & Key tersedia
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseKey = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY
    );

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const userRole = data.user.app_metadata?.role;
          if (data.user.email?.toLowerCase().trim() === adminEmail || userRole === "admin") {
            const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
            const token = signSessionToken({ email: data.user.email!, role: "admin", exp });

            const cookieStore = await cookies();
            cookieStore.set(ADMIN_COOKIE_NAME, token, {
              path: "/",
              httpOnly: true,
              sameSite: "strict",
              secure: process.env.NODE_ENV === "production",
              maxAge: SESSION_DURATION_SECONDS,
            });

            return NextResponse.json({
              success: true,
              message: "Login berhasil via Supabase Auth",
              email: data.user.email,
            });
          } else {
            // Pengguna terdaftar tetapi bukan akun admin
            await supabase.auth.signOut();
            return NextResponse.json(
              { success: false, error: "Akses ditolak: Akun ini tidak memiliki hak administrator" },
              { status: 403 }
            );
          }
        }
      } catch {
        // Fallback ke pengecekan adminPassword server lokal
      }
    }

    // B. Pengecekan Kredensial Langsung Server-Side (ADMIN_PASSWORD / ADMIN_SECRET)
    if (adminPassword && adminPassword.length >= 8) {
      const isEmailValid = email === adminEmail;

      // Constant time check password
      const inputPassBuffer = Buffer.from(password);
      const targetPassBuffer = Buffer.from(adminPassword);

      const isPasswordValid =
        inputPassBuffer.length === targetPassBuffer.length &&
        crypto.timingSafeEqual(inputPassBuffer, targetPassBuffer);

      if (isEmailValid && isPasswordValid) {
        const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
        const token = signSessionToken({ email, role: "admin", exp });

        const cookieStore = await cookies();
        cookieStore.set(ADMIN_COOKIE_NAME, token, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: SESSION_DURATION_SECONDS,
        });

        return NextResponse.json({
          success: true,
          message: "Login berhasil sebagai Administrator",
          email,
        });
      }
    }

    // C. Jika kredensial tidak cocok atau env belum diset
    if (!adminPassword && !hasSupabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sistem terkunci: Kredensial admin (ADMIN_PASSWORD atau Supabase Auth) belum disetel di server environment.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Email atau kata sandi tidak valid" },
      { status: 401 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan server internal saat login";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

