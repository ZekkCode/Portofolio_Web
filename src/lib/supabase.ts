import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publicAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // Supabase dianggap terkonfigurasi jika URL dan salah satu kunci (anon atau service_role) tersedia
  const isConfigured = Boolean(url && (publicAnonKey || serviceRoleKey));

  return {
    url,
    publicAnonKey,
    serviceRoleKey,
    // Kompatibilitas mundur untuk properti 'key'
    key: serviceRoleKey || publicAnonKey,
    isConfigured,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().isConfigured;
}

let publicClientInstance: SupabaseClient | null = null;
let serviceRoleClientInstance: SupabaseClient | null = null;

/**
 * Klien Supabase Publik (Read-Only / PostgREST Anon)
 * Menggunakan publishable / anon key.
 * Digunakan untuk pembacaan konfigurasi publik atau agregat tampilan publik yang diizinkan RLS.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (publicClientInstance) return publicClientInstance;

  const { url, publicAnonKey, serviceRoleKey } = getSupabaseEnv();
  const effectiveKey = publicAnonKey || serviceRoleKey;
  if (!url || !effectiveKey) return null;

  publicClientInstance = createClient(url, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicClientInstance;
}

/**
 * Klien Supabase Privileged (Service Role)
 * HANYA boleh berjalan di lingkungan server terpercaya (Node.js runtime / Route Handlers).
 * Menolak keras fallback ke anon key pada operasi mutasi sensitif untuk mencegah eskalasi privilege atau kegagalan diam-diam.
 */
export function getServiceRoleClient(): SupabaseClient | null {
  if (serviceRoleClientInstance) return serviceRoleClientInstance;

  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url || !serviceRoleKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase Security] SUPABASE_SERVICE_ROLE_KEY belum disetel di server environment. Operasi mutasi database cloud dialihkan ke penyimpanan lokal aman."
      );
    }
    return null;
  }

  serviceRoleClientInstance = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceRoleClientInstance;
}
