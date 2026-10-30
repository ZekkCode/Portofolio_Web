-- ==============================================================================
-- Migration Rollback: 20261031_harden_rls_and_rpc_rollback.sql
-- Description: Skrip pengembalian kondisi RLS ke status migrasi 20261029/20261030
-- ==============================================================================

-- 1. Rollback site_config
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

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

-- 2. Rollback page_views
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;

CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Rollback project_views
DROP POLICY IF EXISTS "Admin read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Strict validated insert project_views" ON public.project_views;

CREATE POLICY "Admin read project_views"
  ON public.project_views
  FOR SELECT
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com'
  );

CREATE POLICY "Allow insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) = 64
    AND char_length(project_id) <= 64
  );

-- 4. Rollback function permissions
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role, authenticated;
