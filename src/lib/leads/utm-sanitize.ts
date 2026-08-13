import { z } from 'zod';

// ============================================================
// Saneo de parametros de atribucion (UTMs, gclid, fbclid, wbraid).
//
// Historia: `/api/leads` validaba estos campos con `.regex(/^[A-Za-z0-9._~-]
// {0,200}$/)` dentro del `z.object`. El alfabeto no admite espacios ni acentos,
// y un valor fuera de el no se descartaba: hacia fallar el `safeParse` entero,
// la ruta respondia 400 y el lead se perdia COMPLETO — ni Supabase ni Zoho ni
// rastro para reintentar. Una campana llamada "Restaurante Corazon" (con
// acento) borraba a todos sus propios leads, en silencio.
//
// Contrato nuevo: sanear siempre, nunca rechazar. La atribucion es metadato;
// jamas debe costar el lead. La propiedad de seguridad original (REQ-S-08: la
// salida no escapa del alfabeto seguro) se conserva intacta, porque el saneo
// garantiza esa forma por construccion en vez de solo comprobarla.
// ============================================================

/** Alfabeto seguro heredado de REQ-S-08. Toda salida no nula lo satisface. */
export const UTM_SAFE_REGEX = /^[A-Za-z0-9._~-]{1,200}$/;

const MAX_LEN = 200;

/**
 * Normaliza un parametro de atribucion a la forma segura, preservando todo el
 * significado que sobreviva. Devuelve `null` cuando no hay dato util: ausencia
 * explicita, no cadena vacia — en Zoho una cadena vacia se lee como "origen
 * conocido y vacio", que es una afirmacion distinta a "sin dato".
 */
export function sanitizeUtm(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const sinAcentos = value.normalize('NFD').replace(/[̀-ͯ]/g, '');

  let limpio = sinAcentos
    .replace(/[^A-Za-z0-9._~-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  if (limpio.length > MAX_LEN) {
    limpio = limpio.slice(0, MAX_LEN).replace(/-+$/, '');
  }

  return limpio.length > 0 ? limpio : null;
}

/**
 * Campo Zod para cualquier parametro de atribucion. Por construccion NUNCA
 * falla el parse: el saneo corre antes de validar, asi que el valor que llega
 * al schema ya es `string` seguro o `null`.
 */
export const optionalUtmField = z.preprocess(sanitizeUtm, z.string().max(MAX_LEN).nullable());
