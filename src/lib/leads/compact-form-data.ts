import type { FormData } from '@/lib/zoho/field-maps';

/**
 * Body del form, sin las claves vacías, para persistir en `leads.form_data`.
 *
 * Sin esto el cron reconstruye el payload solo desde las columnas top-level y
 * manda a Zoho un lead mutilado: medido el 2026-08-24, 12 de 14 leads de
 * reclutamiento rescatados por el cron llegaron sin City, sin experiencia y sin
 * el texto libre de por qué aplican. El honeypot `website` NUNCA entra: no
 * forma parte de FormData por construcción.
 */
export function compactFormData(data: FormData): Record<string, unknown> | null {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}
