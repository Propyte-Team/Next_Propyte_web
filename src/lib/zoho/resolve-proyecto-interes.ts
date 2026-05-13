// ============================================================
// Resolve Proyecto_de_Interes para Form 2 (property_inquiry)
// Spec: web-forms-zoho-integration.md (v1.5) §4 + REQ-F-07
// ============================================================
//
// Query canónico:
//   SELECT m.zoho_record_id
//   FROM real_estate_hub.v_units u
//   LEFT JOIN real_estate_hub."Propyte_zoho_id_map" m
//     ON m.supabase_id = u.development_id::text
//    AND m.entity_type = 'development'
//   WHERE u.id = $1
//
// NOTAS críticas:
//   - Usamos v_units (view) y NO Propyte_unidades raw (regla del proyecto).
//   - supabase_id en id_map es TEXT, no UUID → requiere cast ::text.
//   - Si no hay match: retorna null y el caller agrega nota en Description.
//   - **Cliente DEDICADO** con schema='real_estate_hub' fijo. NO usar .schema()
//     sobre el cliente compartido del endpoint — eso muta el cliente y los
//     INSERTs subsiguientes en public.leads fallan con 500 (bug detectado
//     empíricamente 2026-05-13: cualquier request con propertyId valido →
//     500 "Failed to save lead" porque .schema() dejaba sticky el header
//     Accept-Profile).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente untyped (no generamos types del schema real_estate_hub) — se castea
// a `any` en los .from() para evitar fricción de typing.
let cachedClient: SupabaseClient | null = null;

function getRealEstateHubClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "real_estate_hub" } },
  ) as unknown as SupabaseClient;
  return cachedClient;
}

/**
 * Resuelve el Zoho record ID del desarrollo padre de una unidad.
 *
 * NO recibe el cliente del endpoint — usa uno dedicado para evitar
 * mutación accidental del schema scope.
 *
 * @param unitId UUID de Propyte_unidades.id (campo `property.id` del form).
 * @returns Zoho record ID del desarrollo, o null si no hay mapeo.
 */
export async function resolveProyectoDeInteres(
  // Parámetro `_supabase` mantenido por compat con la firma anterior;
  // ignorado intencionalmente para no mutar el cliente compartido.
  _supabase: unknown,
  unitId: string,
): Promise<string | null> {
  if (!unitId) return null;

  const hub = getRealEstateHubClient();
  if (!hub) return null;

  // Paso 1: unit → development_id
  // Tipos del schema real_estate_hub no están generados — cast a any.
  const { data: unit, error: unitErr } = await (hub.from("v_units") as any)
    .select("development_id")
    .eq("id", unitId)
    .maybeSingle();

  if (unitErr || !unit?.development_id) {
    return null;
  }

  // Paso 2: development_id (uuid) → zoho_record_id (text) vía id_map
  const developmentIdAsText = String(unit.development_id);

  const { data: mapping, error: mapErr } = await (hub.from(
    "Propyte_zoho_id_map",
  ) as any)
    .select("zoho_record_id")
    .eq("supabase_id", developmentIdAsText)
    .eq("entity_type", "development")
    .maybeSingle();

  if (mapErr || !mapping?.zoho_record_id) {
    return null;
  }

  return mapping.zoho_record_id as string;
}
