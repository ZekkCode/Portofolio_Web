-- Migration: 20261030_tighten_visitor_rls.sql
-- Description: Cabut izin baca publik dari tabel audit visitor log (project_views)
--              dan batasi eksekusi RPC increment_page_view hanya untuk service_role / server API.

-- 1. Cabut akses SELECT publik pada tabel log audit pengunjung
ALTER TABLE IF EXISTS public.project_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Admin read project_views" ON public.project_views;

-- Hanya pengguna terotentikasi berstatus admin (atau service_role) yang boleh membaca log audit pengunjung
CREATE POLICY "Admin read project_views"
  ON public.project_views
  FOR SELECT
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com'
  );

-- 2. Amankan fungsi penambahan atomik increment_page_view
-- Cabut akses eksekusi langsung dari anon untuk mencegah spam manipulasi angka dari console browser
REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM anon;

-- Izinkan eksekusi hanya untuk service_role (server backend Next.js) dan administrator terotentikasi
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO authenticated;
