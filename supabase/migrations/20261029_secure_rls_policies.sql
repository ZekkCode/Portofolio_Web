-- Migration: 20261029_secure_rls_policies.sql
-- Description: Revoke unsafe public write policies and enforce strict role-based access control

-- 1. Site Config Security
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
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

-- 2. Page Views Security
ALTER TABLE IF EXISTS public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;

-- 3. Project Views Validation
ALTER TABLE IF EXISTS public.project_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;

CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) = 64
    AND char_length(project_id) <= 64
  );

-- 4. Secure Function Search Path
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
