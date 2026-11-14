-- ==============================================================================
-- Migration: 20261115_contact_messages.sql
-- Description: Penyimpanan & anti-spam rate limiter persisten untuk form kontak
-- Notes:
--   * Idempoten (aman dijalankan ulang)
--   * Row Level Security diaktifkan TANPA policy publik (hanya service_role server)
-- ==============================================================================

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

COMMENT ON TABLE public.contact_messages IS
  'Log pesan form kontak publik & pencatat anti-spam (akses eksklusif server service_role).';

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
