-- ==============================================================================
-- Skema Database Supabase Siap Produksi untuk ZekkTech Portfolio
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

-- Izinkan publik (anon & authenticated) membaca konfigurasi situs
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Izinkan write/update konfigurasi
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
CREATE POLICY "Allow upsert site_config"
  ON public.site_config
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 2. Tabel Counter Kunjungan / Page Views (Persisten di Cloud)
CREATE TABLE IF NOT EXISTS public.page_views (
  id TEXT PRIMARY KEY DEFAULT 'portfolio',
  count BIGINT NOT NULL DEFAULT 1420,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Izinkan publik membaca counter page views
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Izinkan update counter page views
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;
CREATE POLICY "Allow update page_views"
  ON public.page_views
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Inisialisasi baris default awal jika belum ada
INSERT INTO public.page_views (id, count, updated_at)
VALUES ('portfolio', 1420, NOW())
ON CONFLICT (id) DO NOTHING;


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

-- Izinkan publik membaca data view tervalidasi
DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
CREATE POLICY "Public read project_views"
  ON public.project_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Izinkan penambahan log view tervalidasi
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;
CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);


-- 4. Fungsi Atomik Penambahan Kunjungan (Anti Race-Condition)
CREATE OR REPLACE FUNCTION public.increment_page_view(page_id text, default_seed bigint DEFAULT 1420)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
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
