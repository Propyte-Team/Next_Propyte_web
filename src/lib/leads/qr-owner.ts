import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Asesor asignado a un código QR.
//
// Un QR puede traer asesor fijo (`qr.qr_codes.asesor_zoho_id`): el QR pegado en
// un restaurante aliado siempre debe caer en quien atiende esa relación.
//
// **Es OPCIONAL a propósito.** Zoho ya asigna dueño por su cuenta — verificado
// el 2026-08-13 con un lead real, que llegó con Owner sin que el payload lo
// mandara. Si esto fuera obligatorio estaríamos pisando un mecanismo que
// funciona. Sin asesor en el QR → no se toca `Owner` y Zoho reparte como
// siempre.
//
// **Cliente DEDICADO con schema fijo.** NO usar `.schema()` sobre el cliente
// compartido del endpoint: deja sticky el header `Accept-Profile` y los INSERT
// posteriores a `public.leads` revientan con 500 (bug detectado empíricamente
// el 2026-05-13, ver `resolve-proyecto-interes.ts`).
// ============================================================

let cachedClient: SupabaseClient | null = null;

function getQrClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "qr" } },
  ) as unknown as SupabaseClient;
  return cachedClient;
}

export interface QrOwner {
  /** `zoho_user_id` de `reports.asesores`. */
  id: string;
  nombre: string | null;
}

/**
 * Resuelve el asesor fijo de un QR por su `short_code`.
 *
 * Fail-soft en todos los caminos: si no hay cliente, si el código no existe, si
 * la consulta falla o si el QR no tiene asesor, devuelve `null` y el lead sigue
 * su curso normal. Un problema al resolver el dueño **jamás** debe costar el
 * lead — es la misma lección que dejó el regex de UTMs.
 *
 * Uso de service role sobre input del usuario: el `short_code` ya viene saneado
 * por `optionalUtmField` al alfabeto `[A-Za-z0-9._~-]`, la consulta es `.eq()`
 * parametrizado (no concatenación) y lo único que devuelve es el id de un
 * asesor — no hay dato sensible que filtrar.
 */
export async function resolveQrOwner(shortCode: string | null | undefined): Promise<QrOwner | null> {
  if (!shortCode) return null;

  const qr = getQrClient();
  if (!qr) return null;

  const { data, error } = await qr
    .from("qr_codes")
    .select("asesor_zoho_id, asesor_nombre")
    .eq("short_code", shortCode)
    .is("deleted_at", null)
    .maybeSingle<{ asesor_zoho_id: string | null; asesor_nombre: string | null }>();

  if (error || !data?.asesor_zoho_id) return null;

  return { id: data.asesor_zoho_id, nombre: data.asesor_nombre };
}
