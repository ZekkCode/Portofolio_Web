-- ==============================================================================
-- Migration: 20261114_cms_schema_v2.sql
-- Description: Skema & Optimasi CMS Full Site-Wide CRUD (Schema v2)
-- Notes:
--   * Idempoten (aman dijalankan ulang di Supabase SQL Editor / CLI)
--   * Tetap mempertahankan kebijakan RLS hardened dari 20261031_harden_rls_and_rpc.sql
--   * Mendukung dokumen canonical idempotent di `public.site_config`:
--       - id = 'current'          (Konfigurasi terbit / published)
--       - id = 'draft'            (Draf editor / preview sebelum terbit)
--       - id = 'revisions_index'  (Daftar metadata riwayat versi hingga 25 entri)
--       - id = 'rev_<id>'         (Snapshot lengkap tiap revisi)
-- ==============================================================================

-- 1. Pastikan tabel utama tersedia lengkap dengan kolom & komentar
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.site_config IS
  'Penyimpanan konfigurasi CMS v2 (current, draft, revisions_index, rev_*).';
COMMENT ON COLUMN public.site_config.id IS
  'Kunci dokumen: current, draft, revisions_index, atau rev_<revisionId>.';
COMMENT ON COLUMN public.site_config.config IS
  'Payload SiteConfig v2 lengkap (profil, proyek, edukasi, pengalaman, layanan, stack, sertifikat, CV, FAQ, blog, SEO, navigasi, footer).';

-- 2. Indeks GIN untuk query JSONB cepat (mis. pencarian atau audit internal)
CREATE INDEX IF NOT EXISTS idx_site_config_config_gin
  ON public.site_config
  USING gin (config jsonb_path_ops);

-- 3. Pastikan tabel statistik & log view tetap ada & terindeks
CREATE TABLE IF NOT EXISTS public.page_views (
  id TEXT PRIMARY KEY DEFAULT 'portfolio',
  count BIGINT NOT NULL DEFAULT 1420,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL DEFAULT 'portfolio',
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_views_dedup
  ON public.project_views (project_id, visitor_hash, created_at DESC);

-- 4. Pastikan Row Level Security tetap aktif di semua tabel
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS idempoten untuk `public.site_config`
-- Catatan: Jika aplikasi berjalan hanya dengan anon key (tanpa SUPABASE_SERVICE_ROLE_KEY),
-- kebijakan SELECT tetap dibuka; jika SUPABASE_SERVICE_ROLE_KEY terpasang di server Vercel,
-- Anda dapat memperketat SELECT anon hanya untuk id = 'current'.
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;
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
