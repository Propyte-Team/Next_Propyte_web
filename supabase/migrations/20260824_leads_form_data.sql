-- ============================================================
-- Migration: public.leads — persistir el payload crudo del form
-- Fecha: 2026-08-24
-- ============================================================
--
-- POR QUÉ
-- El cron /api/cron/zoho-retry reconstruye el payload de Zoho con
-- rebuildPayload(), que solo lee columnas top-level: name, email, phone,
-- message, property_id. Todo lo demás del form se perdía en el reintento.
--
-- Medido en producción el 2026-08-24: de los 14 leads `affiliate_request`
-- rescatados por el cron, 12 llegaron a Zoho con City, Description
-- (experiencia) y Mensaje (motivación) en NULL. El asesor recibía un
-- aspirante sin ciudad, sin experiencia y sin el texto de por qué aplica.
-- Los 11 que pasaron por push directo los traían completos.
--
-- El comentario de rebuildPayload() ya anticipaba esta columna:
--   "Si en el futuro queremos retry 'perfecto', agregamos una columna
--    `form_data jsonb` con el body crudo."
--
-- ORDEN DE DESPLIEGUE (importante)
--   1. Aplicar ESTA migración.
--   2. Después desplegar el código que escribe `form_data`.
-- Al revés, el INSERT de /api/leads falla con columna inexistente y el lead
-- se PIERDE ENTERO (no hay fila que el cron pueda rescatar).
-- Es additive y nullable: mientras el código viejo siga corriendo, no pasa nada.
--
-- Rollback: ALTER TABLE public.leads DROP COLUMN form_data;

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS form_data jsonb;

COMMENT ON COLUMN public.leads.form_data IS
  'Campos del formulario tal como llegaron a /api/leads, para que el reintento del cron reconstruya el MISMO payload que el push directo (city, experience, interest, whatsapp, page, etc.). NO incluye el honeypot `website`. Contiene PII (nombre, email, teléfono, texto libre) igual que las columnas top-level: aplica la misma regla que zoho_sync_error — nunca copiar a logs sin sanitizeErrorMessage().';

COMMIT;

-- ============================================================
-- 2. zoho_sync_error_prev — no borrar la pista del fallo original
-- ============================================================
-- Al rescatar, el cron pisaba zoho_sync_error con null. Las 14 filas rescatadas
-- de agosto 2026 mostraban error=null y parecían no haber fallado nunca: la
-- causa hubo que reconstruirla comparando Created_Time en Zoho contra
-- created_at en Supabase. Con esta columna, la próxima vez se lee directo.
--
-- Mismo orden de despliegue: columna primero, código después. Si el cron
-- escribe una columna inexistente, updateLeadLocal falla 3 veces, el lead se
-- queda sin zoho_lead_id y a los 3 intentos queda invisible para siempre.

BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS zoho_sync_error_prev text;

COMMENT ON COLUMN public.leads.zoho_sync_error_prev IS
  'Primer zoho_sync_error que vio el cron antes de rescatar la fila. Solo se escribe una vez (el primer intento lleva la causa; los siguientes son consecuencia). Misma regla PII que zoho_sync_error: pasar por sanitizeErrorMessage().';

COMMIT;
