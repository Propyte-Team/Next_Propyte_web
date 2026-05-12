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

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resuelve el Zoho record ID del desarrollo padre de una unidad.
 *
 * @param supabase Cliente con permiso de leer real_estate_hub.v_units y Propyte_zoho_id_map.
 *                 En el endpoint usamos service_role (ya bypass RLS).
 * @param unitId   UUID de Propyte_unidades.id (campo `property.id` del form).
 * @returns        Zoho record ID del desarrollo, o null si no hay mapeo.
 */
export async function resolveProyectoDeInteres(
  supabase: SupabaseClient,
  unitId: string,
): Promise<string | null> {
  if (!unitId) return null;

  // Paso 1: unit → development_id
  // v_units expone schema real_estate_hub vía REST si está en Exposed Schemas (lo está).
  const { data: unit, error: unitErr } = await supabase
    .schema("real_estate_hub")
    .from("v_units")
    .select("development_id")
    .eq("id", unitId)
    .maybeSingle();

  if (unitErr || !unit?.development_id) {
    return null;
  }

  // Paso 2: development_id (uuid) → zoho_record_id (text) vía id_map
  // supabase_id es text → cast a string en JS, el filtro .eq compara igualdad textual.
  const developmentIdAsText = String(unit.development_id);

  const { data: mapping, error: mapErr } = await supabase
    .schema("real_estate_hub")
    .from("Propyte_zoho_id_map")
    .select("zoho_record_id")
    .eq("supabase_id", developmentIdAsText)
    .eq("entity_type", "development")
    .maybeSingle();

  if (mapErr || !mapping?.zoho_record_id) {
    return null;
  }

  return mapping.zoho_record_id;
}
