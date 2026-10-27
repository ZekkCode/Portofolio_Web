-- ==============================================================================
-- Skema Database Supabase untuk ZekkTech Portfolio
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda (https://app.supabase.com)
-- ==============================================================================

-- 1. Tabel Konfigurasi Situs (Lanyard, Profile Card, Proyek, Berkas CV, Header Logo)
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Izinkan publik membaca konfigurasi situs
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  USING (true);

-- Izinkan write/update konfigurasi (dapat dibatasi via Service Role Key di server Next.js)
CREATE POLICY "Allow upsert site_config"
  ON public.site_config
  FOR ALL
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
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  USING (true);

-- Izinkan update counter page views
CREATE POLICY "Allow update page_views"
  ON public.page_views
  FOR ALL
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
CREATE POLICY "Public read project_views"
  ON public.project_views
  FOR SELECT
  USING (true);

-- Izinkan penambahan log view tervalidasi
CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  WITH CHECK (true);

