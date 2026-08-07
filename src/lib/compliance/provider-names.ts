/**
 * Proveedores externos de datos que NUNCA pueden aparecer en texto visible al
 * usuario: UI, tooltips, PDF, disclaimers, metodología ni respuestas de API.
 * La atribución pública es siempre "Análisis de mercado Propyte"; lo derivado,
 * "Estimación Propyte".
 *
 * Nombrarlos expone a Propyte legal y relacionalmente frente a esas empresas.
 *
 * Se prohíbe la FORMA DE DISPLAY (con mayúscula inicial o camel/Pascal). Los
 * identificadores internos en minúscula —`airdna_metrics`, `airdnaOccupancy`,
 * `source_portal`— son legítimos y no se tocan: nunca llegan al usuario.
 *
 * Excepción deliberada: "Airbnb" como nombre de la CATEGORÍA de renta
 * vacacional ("Vacacional (Airbnb)") sí se permite. Es el término estándar de
 * la industria, no una atribución de fuente.
 */
export const FORBIDDEN_PROVIDER_DISPLAY_NAMES = [
  'AirDNA',
  'AirROI',
  'Apify',
  'Properstar',
  'Lamudi',
  'Inmuebles24',
  'Vivanuncios',
  'EasyBroker',
  'Segundamano',
  'TheRedSearch',
  'Mercado Libre',
  'MercadoLibre',
] as const;

/** Atribución aprobada para cualquier dato de mercado mostrado al usuario. */
export const PROPYTE_ATTRIBUTION_ES = 'Análisis de mercado Propyte';
export const PROPYTE_ATTRIBUTION_EN = 'Propyte market analysis';

/**
 * Tipo de archivo que se escanea. Determina si se le aplica semántica de
 * comentarios de JavaScript antes de buscar — ver `findForbiddenProviderNames`.
 */
export type ScannableFileType = 'code' | 'json';

/**
 * Quita comentarios de bloque y de línea antes de buscar.
 *
 * Los comentarios que documentan de dónde sale el dato son contexto de
 * mantenimiento legítimo y nunca llegan al usuario: al escribir esto había 15
 * de esos y solo 2 violaciones reales. Prohibirlos todos habría borrado la
 * documentación sin reducir un gramo de exposición.
 *
 * Limitación conocida —y aceptada SOLO para `.ts`/`.tsx`, donde sí existen
 * comentarios de verdad que hay que quitar—: una cadena que contenga `//`
 * —una URL— trunca el resto de esa línea para el escaneo. En `.json` no hay
 * comentarios que quitar, así que esta función nunca se le aplica: ver
 * `findForbiddenProviderNames`. Aplicarla ahí abriría el mismo agujero sin
 * ninguna razón, justo en los archivos donde vive el texto visible al
 * usuario (`src/i18n/messages/*.json`).
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

/**
 * Devuelve los términos prohibidos presentes en texto que puede llegar al
 * usuario. Case-sensitive a propósito: `airdna_metrics` no es una violación,
 * `AirDNA` sí.
 *
 * `fileType` decide si se aplica `stripComments` antes de buscar:
 * - `'code'` (default): quita comentarios de bloque y de línea — legítimo en
 *   `.ts`/`.tsx`, donde documentar la procedencia del dato en un comentario
 *   no expone a nadie.
 * - `'json'`: escanea el contenido tal cual. JSON no tiene comentarios, y
 *   tratarlo como si los tuviera trunca cualquier línea que contenga `//`
 *   —una URL— ocultando lo que venga después en esa misma línea.
 */
export function findForbiddenProviderNames(
  source: string,
  fileType: ScannableFileType = 'code',
): string[] {
  const scanned = fileType === 'json' ? source : stripComments(source);
  return FORBIDDEN_PROVIDER_DISPLAY_NAMES.filter((name) => scanned.includes(name));
}
