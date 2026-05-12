-- ============================================================
-- Migration: public.leads — preparar para integración Zoho CRM
-- Spec: Next_Propyte_web/specs/web-forms-zoho-integration.md (v1.5) §6.5
-- Fecha: 2026-05-12
-- ============================================================
--
-- Esta migración se ENTREGA a Luis para aplicar en Supabase SQL Editor
-- (regla del proyecto: DDL en prod requiere autorización explícita).
--
-- Verificaciones post-aplicación (vía MCP execute_sql):
--   1. SELECT column_name, is_nullable FROM information_schema.columns
--      WHERE table_schema='public' AND table_name='leads'
--      ORDER BY ordinal_position;
--      → property_id debe ser is_nullable='YES'
--      → debe haber 14 columnas nuevas
--   2. SELECT indexname FROM pg_indexes
--      WHERE tablename='leads' AND schemaname='public';
--      → debe incluir idx_leads_zoho_retry
--   3. SELECT prosecdef, proconfig FROM pg_proc
--      WHERE proname='claim_zoho_retry_batch';
--      → prosecdef=true, proconfig contiene 'search_path=pg_catalog, public'
--   4. SELECT * FROM public.claim_zoho_retry_batch(0);
--      → ejecuta sin error, retorna 0 filas (clamp 0→1 internal)
--
-- Rollback: ninguna columna se ELIMINA en este migration (additive).
-- La función puede dropearse con: DROP FUNCTION public.claim_zoho_retry_batch(int);

BEGIN;

-- ============================================================
-- 1. Hacer property_id nullable (CRÍTICO)
--    Sin esto, 9 de 11 forms no pueden persistir (todos los que
--    no son Form 2 property_inquiry envían property_id NULL).
-- ============================================================
ALTER TABLE public.leads
  ALTER COLUMN property_id DROP NOT NULL;

-- ============================================================
-- 2. Columnas intake/UTM faltantes que el endpoint actual esperaba
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS intake_status text DEFAULT 'nuevo',  -- estado al ingresar (Zoho es SoT del pipeline real)
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS utm_content   text,
  ADD COLUMN IF NOT EXISTS utm_term      text,
  ADD COLUMN IF NOT EXISTS gclid         text;

-- ============================================================
-- 3. Columnas para integración Zoho + auditoría
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id       text,
  ADD COLUMN IF NOT EXISTS zoho_account_id    text,
  ADD COLUMN IF NOT EXISTS zoho_sync_error    text,
  ADD COLUMN IF NOT EXISTS zoho_synced_at     timestamptz,
  ADD COLUMN IF NOT EXISTS zoho_retry_count   smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nombre_campana     text,
  ADD COLUMN IF NOT EXISTS nombre_formulario  text;

-- ============================================================
-- 4. Index parcial — el cron solo escanea filas que requieren reintento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_zoho_retry
  ON public.leads (created_at)
  WHERE zoho_lead_id IS NULL
    AND zoho_retry_count < 3;

-- ============================================================
-- 5. Función RPC para claim atómico (FOR UPDATE SKIP LOCKED)
--    supabase-js no expone FOR UPDATE → necesitamos function vía .rpc()
--
-- HARDENING (REQ-S-03):
--   * p_limit clamped 1..500 dentro del cuerpo — mitiga DoS si actor con
--     role service_role llama con limit gigante
--   * SET search_path = pg_catalog, public explícito — mitiga function-hijacking
--     vía search_path en SECURITY DEFINER (CVE pattern conocido)
--   * REVOKE FROM PUBLIC antes del GRANT al service_role
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_zoho_retry_batch(p_limit int DEFAULT 50)
RETURNS SETOF public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_limit int;
BEGIN
  -- Clamp 1..500 (defense). NULL → default 50.
  v_limit := least(greatest(coalesce(p_limit, 50), 1), 500);

  RETURN QUERY
  UPDATE public.leads l
  SET zoho_retry_count = l.zoho_retry_count + 1
  WHERE l.id IN (
    SELECT id FROM public.leads
    WHERE zoho_lead_id IS NULL
      AND (zoho_sync_error IS NOT NULL OR created_at < now() - interval '5 minutes')
      AND zoho_retry_count < 3
      AND created_at > now() - interval '24 hours'
    ORDER BY created_at
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING l.*;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_zoho_retry_batch(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_zoho_retry_batch(int) TO service_role;

-- ============================================================
-- 6. COMMENT sobre zoho_sync_error — recuerda al implementador la regla PII
-- ============================================================
COMMENT ON COLUMN public.leads.zoho_sync_error IS
  'Error message from Zoho sync attempt. MUST be passed through sanitizeErrorMessage() before insert — strips email/phone/RFC/CURP (REQ-S-02 in spec web-forms-zoho-integration.md v1.5). Do NOT store raw Zoho response bodies; they echo PII.';

COMMENT ON COLUMN public.leads.intake_status IS
  'Estado del lead al momento de ingresar al sistema. Zoho CRM es source of truth del pipeline real — este campo NO se sincroniza con Zoho status. Defaults a ''nuevo''.';

COMMENT ON COLUMN public.leads.zoho_retry_count IS
  'Cuenta intentos COMENZADOS de sincronización a Zoho (incrementa en claim_zoho_retry_batch, no al éxito). Max 3 — tras eso el lead queda invisible al cron hasta reset manual (ver Apéndice F del spec).';

COMMIT;
