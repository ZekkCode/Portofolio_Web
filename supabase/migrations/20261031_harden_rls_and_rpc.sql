-- ==============================================================================
-- Migration: 20261031_harden_rls_and_rpc.sql
-- Description: Penguatan Menyeluruh Row Level Security (RLS), Pembatasan Akses PostgREST,
--              dan Pengamanan Fungsi SECURITY DEFINER untuk ZekkTech Portfolio
-- Author: ZekkCode / Antigravity Security Audit
-- Date: 2026-10-31
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL: public.site_config
-- Sasaran: Publik (anon) HANYA boleh membaca (SELECT).
--          Mutasi (INSERT/UPDATE/DELETE) HANYA untuk Administrator Terotentikasi & service_role.
-- ------------------------------------------------------------------------------

-- Pastikan RLS aktif
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;

-- Cabut seluruh kebijakan lama untuk mencegah kebijakan permisif tumpang-tindih
DROP POLICY IF EXISTS "Public read site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow upsert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow update site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow insert site_config" ON public.site_config;
DROP POLICY IF EXISTS "Allow delete site_config" ON public.site_config;
DROP POLICY IF EXISTS "Admin write site_config" ON public.site_config;

-- Kebijakan 1: Pembacaan konfigurasi publik (Lanyard 3D, Card Profile, CV, Header)
CREATE POLICY "Public read site_config"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Kebijakan 2: Penulisan konfigurasi HANYA untuk Administrator terotentikasi
-- Mengutamakan app_metadata (klaim server-managed yang kebal manipulasi pengguna)
-- dan memverifikasi email administrator terdaftar.
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


-- ------------------------------------------------------------------------------
-- 2. TABEL: public.page_views
-- Sasaran: Publik HANYA boleh membaca agregat tampilan (SELECT).
--          Dilarang keras memberikan izin UPDATE/INSERT/DELETE langsung ke anon/authenticated
--          untuk mencegah manipulasi angka sembarangan via PostgREST endpoint.
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.page_views ENABLE ROW LEVEL SECURITY;

-- Cabut seluruh kebijakan lama yang berpotensi membiarkan anon memodifikasi counter
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow update page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow insert page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow delete page_views" ON public.page_views;
DROP POLICY IF EXISTS "Admin write page_views" ON public.page_views;

-- Kebijakan 1: Publik (anon & authenticated) hanya diizinkan membaca agregat counter
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Catatan: TIDAK ADA kebijakan UPDATE/INSERT untuk anon atau authenticated.
-- Penambahan counter hanya boleh dilakukan oleh:
-- 1. Server backend via service_role key (bypasses RLS)
-- 2. Atau melalui pemanggilan RPC terproteksi increment_page_view()


-- ------------------------------------------------------------------------------
-- 3. TABEL: public.project_views
-- Sasaran: Log privasi pengunjung (visitor_hash, timestamp, IP-derived identifiers)
--          TIDAK BOLEH dibaca oleh publik (anon).
--          Hanya Administrator terotentikasi atau service_role yang boleh membaca log.
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.project_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Admin read project_views" ON public.project_views;
DROP POLICY IF EXISTS "Allow insert project_views" ON public.project_views;
DROP POLICY IF EXISTS "Strict validated insert project_views" ON public.project_views;

-- Kebijakan 1: Privasi pengunjung — HANYA admin terotentikasi yang boleh membaca log audit
CREATE POLICY "Admin read project_views"
  ON public.project_views
  FOR SELECT
  TO authenticated
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    OR (auth.jwt() ->> 'email') = 'zakariamujur6@gmail.com'
  );

-- Kebijakan 2: Validasi ketat penambahan log deduplikasi kunjungan
-- Memvalidasi panjang dan format heksadesimal hash SHA-256 (tepat 64 karakter heksadesimal)
-- serta format slug project_id untuk mencegah penulisan data sampah ke database.
CREATE POLICY "Strict validated insert project_views"
  ON public.project_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    visitor_hash ~ '^[a-f0-9]{64}$'
    AND char_length(project_id) <= 64
    AND project_id ~ '^[a-zA-Z0-9_\-]+$'
  );


-- ------------------------------------------------------------------------------
-- 4. FUNGSI: public.increment_page_view()
-- Sasaran: Sanitasi parameter masukan, perlindungan race condition,
--          pemberlakuan search_path ketat, dan pencabutan hak eksekusi liar dari publik.
-- ------------------------------------------------------------------------------

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
  -- 1. Sanitasi page_id: buang karakter selain alfanumerik, garis bawah, dan tanda hubung
  safe_page_id := regexp_replace(coalesce(page_id, 'portfolio'), '[^a-zA-Z0-9_\-]', '', 'g');
  IF safe_page_id = '' OR char_length(safe_page_id) > 64 THEN
    safe_page_id := 'portfolio';
  END IF;

  -- 2. Batasi default_seed agar tidak dapat dimanipulasi ke angka negatif atau ekstrim
  IF default_seed IS NULL OR default_seed < 0 OR default_seed > 1000000000 THEN
    safe_seed := 1420;
  ELSE
    safe_seed := default_seed;
  END IF;

  -- 3. Upsert atomik bergaransi anti-race-condition
  INSERT INTO public.page_views (id, count, updated_at)
  VALUES (safe_page_id, safe_seed + 1, NOW())
  ON CONFLICT (id) DO UPDATE
    SET count = public.page_views.count + 1,
        updated_at = NOW()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

-- Cabut seluruh izin eksekusi dari PUBLIC (default Postgres yang membahayakan)
REVOKE ALL ON FUNCTION public.increment_page_view(text, bigint) FROM PUBLIC;

-- Cabut izin eksplisit dari anon dan authenticated untuk mencegah bypass rate limiting server
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_page_view(text, bigint) FROM authenticated;

-- Berikan hak eksekusi HANYA kepada service_role (backend Next.js API terotorisasi)
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, bigint) TO service_role;
