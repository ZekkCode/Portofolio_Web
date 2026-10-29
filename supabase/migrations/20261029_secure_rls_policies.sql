-- Migration: 20261029_secure_rls_policies.sql
-- Description: Revoke unsafe public write policies and enforce strict role-based access control

-- 1. Site Config Security
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

-- Kebijakan: Publik (anon & authenticated) hanya boleh membaca konfigurasi
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Kebijakan: Hanya administrator terotentikasi yang boleh memodifikasi konfigurasi
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

-- 2. Page Views Security
ALTER TABLE IF EXISTS public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;
DROP POLICY IF EXISTS "Admin write page_views" ON public.page_views;

-- Kebijakan: Publik hanya boleh membaca jumlah tampilan
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Project Views Validation
ALTER TABLE IF EXISTS public.project_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;

CREATE POLICY "Public read project_views"
  ON public.project_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) = 64
    AND char_length(project_id) <= 64
  );

-- 4. Secure Function Search Path & Permissions
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

REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO anon, authenticated;
