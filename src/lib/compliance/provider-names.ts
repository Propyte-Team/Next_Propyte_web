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
 * Quita comentarios de bloque y de línea antes de buscar.
 *
 * Los comentarios que documentan de dónde sale el dato son contexto de
 * mantenimiento legítimo y nunca llegan al usuario: al escribir esto había 15
 * de esos y solo 2 violaciones reales. Prohibirlos todos habría borrado la
 * documentación sin reducir un gramo de exposición.
 *
 * Limitación conocida: una cadena que contenga `//` —una URL— trunca el resto
 * de esa línea para el escaneo. Es un falso negativo posible y aceptado.
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
 */
export function findForbiddenProviderNames(source: string): string[] {
  const code = stripComments(source);
  return FORBIDDEN_PROVIDER_DISPLAY_NAMES.filter((name) => code.includes(name));
}
