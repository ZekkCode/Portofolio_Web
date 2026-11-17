-- ==============================================================================
-- Migration: 20261117_security_rls_hardening.sql
-- Description:
--   1. Fungsi verifikasi admin terkonfirmasi (`auth.users.email_confirmed_at IS NOT NULL`
--      atau `app_metadata.role = 'admin'`) — kebal terhadap manipulasi `user_metadata`.
--   2. Batasi pembacaan publik `public.site_config` HANYA untuk baris terpublikasi
--      (`id IN ('current', 'main')`); sembunyikan `draft`, `revisions_index`, & `rev_*`.
--   3. Cabut kebijakan INSERT langsung `anon` pada `public.project_views` untuk
--      mencegah injeksi baris sampah / storage flood via PostgREST.
--   4. Optimasi evaluasi `(select ...)` satu kali per query sesuai pedoman RLS Postgres.
-- ==============================================================================

-- 1. Fungsi pembantu verifikasi admin berbasis tabel otoritatif `auth.users`
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

-- 2. Kunci akses baca/tulis pada `public.site_config`
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Public read published site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin read all site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

CREATE POLICY "Public read published site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (id IN ('current', 'main'));

CREATE POLICY "Admin read all site_config"
  ON public.site_config
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_verified_admin()));

CREATE POLICY "Admin write site_config"
  ON public.site_config
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_verified_admin()))
  WITH CHECK ((SELECT public.is_verified_admin()));

-- 3. Kunci tabel `public.project_views` (penulisan hanya via backend `service_role`)
ALTER TABLE IF EXISTS public.project_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;
DROP POLICY IF EXISTS "Strict validated insert project_views" ON public.project_views;
DROP POLICY IF EXISTS "Admin read project_views" ON public.project_views;

CREATE POLICY "Admin read project_views"
  ON public.project_views
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_verified_admin()));

-- 4. Pastikan RPC `increment_page_view` hanya dapat dipanggil oleh `service_role`
REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role;
