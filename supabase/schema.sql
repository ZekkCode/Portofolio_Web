-- ==============================================================================
-- Skema Database Supabase Siap Produksi untuk ZekkTech Portfolio
-- Versi Keamanan Diperketat (Anti-Tamper, Strict RLS & Server-Side Admin Guard)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabel Konfigurasi Situs (Lanyard, Profile Card, Proyek, Berkas CV, Header Logo)
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Cabut izin tulis publik yang tidak aman
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

-- Kebijakan 1: Publik (anon & authenticated) hanya diizinkan MEMBACA konfigurasi
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Kebijakan 2: HANYA pengguna terotentikasi dengan hak akses admin yang boleh mengubah/menulis
-- Menggunakan app_metadata (bukan user_metadata yang dapat dimanipulasi pengguna)
CREATE POLICY "Admin write site_config"
  ON public.site_config
  FOR ALL
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com'
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com'
  );


-- 2. Tabel Counter Kunjungan / Page Views (Persisten di Cloud)
CREATE TABLE IF NOT EXISTS public.page_views (
  id TEXT PRIMARY KEY DEFAULT 'portfolio',
  count BIGINT NOT NULL DEFAULT 1420,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;
DROP POLICY IF EXISTS "Admin write page_views" ON public.page_views;

-- Kebijakan: Publik hanya boleh MEMBACA jumlah tampilan
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Hapus izin update langsung dari anon/authenticated untuk mencegah manipulasi angka sembarangan
-- Pembaruan hanya dilakukan lewat RPC terproteksi increment_page_view() atau service_role


-- 3. Tabel Valid Engaged Views (Anti-Bot & Jeda Deduplikasi 24 Jam)
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL DEFAULT 'portfolio',
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pencarian cepat untuk deduplikasi 24 jam
CREATE INDEX IF NOT EXISTS idx_project_views_dedup
  ON public.project_views (project_id, visitor_hash, created_at DESC);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;

CREATE POLICY "Public read project_views"
  ON public.project_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Izinkan penambahan log view tervalidasi dengan validasi panjang hash sha256 (64 hex chars)
CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) = 64
    AND char_length(project_id) <= 64
  );


-- 4. Fungsi Atomik Penambahan Kunjungan (Anti Race-Condition & Search Path Hardened)
CREATE OR REPLACE FUNCTION public.increment_page_view(page_id text, default_seed bigint DEFAULT 1420)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count bigint;
BEGIN
  INSERT INTO public.page_views (id, count, updated_at)
  VALUES (page_id, default_seed + 1, NOW())
  ON CONFLICT (id) DO UPDATE
    SET count = public.page_views.count + 1,
        updated_at = NOW()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

-- Berikan izin eksekusi ke anon & authenticated hanya untuk RPC ini
REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO anon, authenticated;
