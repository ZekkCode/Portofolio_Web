-- ==============================================================================
-- Skema Database Supabase Siap Produksi untuk ZekkTech Portfolio
-- Versi Keamanan Diperketat (Strict RLS, Verified Admin Guard & Atomic RPC)
-- Sinkron dengan seluruh berkas migrasi di `supabase/migrations/`
-- ==============================================================================

-- 0. Fungsi Pembantu Verifikasi Administrator Terkonfirmasi
CREATE OR REPLACE FUNCTION public.is_verified_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
  OR EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = 'zakariamujur6@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_admin() TO authenticated, service_role;


-- 1. Tabel Konfigurasi Situs (`current`, `draft`, `revisions_index`, `rev_*`)
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_config_config_gin
  ON public.site_config USING GIN (config);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Public read published site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin read all site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

-- Publik hanya boleh membaca dokumen terpublikasi (`current` / legacy `main`)
CREATE POLICY "Public read published site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (id IN ('current', 'main'));

-- Administrator terverifikasi boleh membaca draf & riwayat revisi
CREATE POLICY "Admin read all site_config"
  ON public.site_config
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_verified_admin()));

-- Hanya administrator terverifikasi yang boleh menulis/mengubah konfigurasi
CREATE POLICY "Admin write site_config"
  ON public.site_config
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_verified_admin()))
  WITH CHECK ((SELECT public.is_verified_admin()));


-- 2. Tabel Counter Kunjungan / Page Views (Persisten di Cloud)
CREATE TABLE IF NOT EXISTS public.page_views (
  id TEXT PRIMARY KEY DEFAULT 'portfolio',
  count BIGINT NOT NULL DEFAULT 1420,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow insert page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow delete page_views" ON public.page_views;
DROP POLICY IF EXISTS "Admin write page_views" ON public.page_views;

CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- 3. Tabel Valid Engaged Views (Deduplikasi Kunjungan 24 Jam — Eksklusif Server `service_role`)
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL DEFAULT 'portfolio',
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT chk_project_views_hash CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT chk_project_views_slug CHECK (char_length(project_id) <= 64 AND project_id ~ '^[a-zA-Z0-9_\-]+$')
);

CREATE INDEX IF NOT EXISTS idx_project_views_dedup
  ON public.project_views (project_id, visitor_hash, created_at DESC);

ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;
DROP POLICY IF EXISTS "Strict validated insert project_views" ON public.project_views;
DROP POLICY IF EXISTS "Admin read project_views" ON public.project_views;

CREATE POLICY "Admin read project_views"
  ON public.project_views
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_verified_admin()));


-- 4. Tabel Pesan Kontak & Anti-Spam Rate Limiter (Eksklusif Server `service_role`)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  turnstile_verified BOOLEAN NOT NULL DEFAULT false,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_provider TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_created
  ON public.contact_messages (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_created
  ON public.contact_messages (sender_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_payload_created
  ON public.contact_messages (payload_hash, created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public write contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anon access contact_messages" ON public.contact_messages;


-- 5. Fungsi Atomik Penambahan Kunjungan (`service_role` only)
CREATE OR REPLACE FUNCTION public.increment_page_view(
  page_id text DEFAULT 'portfolio',
  default_seed bigint DEFAULT 1420
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count bigint;
  safe_page_id text;
  safe_seed bigint;
BEGIN
  safe_page_id := regexp_replace(coalesce(page_id, 'portfolio'), '[^a-zA-Z0-9_\-]', '', 'g');
  IF safe_page_id = '' OR char_length(safe_page_id) > 64 THEN
    safe_page_id := 'portfolio';
  END IF;

  IF default_seed IS NULL OR default_seed < 0 OR default_seed > 1000000000 THEN
    safe_seed := 1420;
  ELSE
    safe_seed := default_seed;
  END IF;

  INSERT INTO public.page_views (id, count, updated_at)
  VALUES (safe_page_id, safe_seed + 1, NOW())
  ON CONFLICT (id) DO UPDATE
    SET count = public.page_views.count + 1,
        updated_at = NOW()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role;
