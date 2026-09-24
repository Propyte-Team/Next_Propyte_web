import type { LeadSource } from '@/lib/zoho/field-maps';

export const KNOWN_SOURCES = [
  'contact',
  'property_inquiry',
  'b2b_request',
  'developer_request',
  'broker_registration',
  'provider_form',
  'built_consultation',
  'affiliate_request',
  'newsletter',
  'lead_magnet',
  'glossary_pdf',
  'lp_lotes_pdc',
  'lp_casas_riviera',
  'guia_terrenos',
] as const satisfies readonly LeadSource[];

// Guardia de tipos: si se agrega un LeadSource y no se registra aquí,
// TypeScript señalará el source faltante.
type _FaltanEnKnownSources = Exclude<
  LeadSource,
  (typeof KNOWN_SOURCES)[number]
>;

const _checkKnownSources: _FaltanEnKnownSources extends never
  ? true
  : ['falta en KNOWN_SOURCES:', _FaltanEnKnownSources] = true;