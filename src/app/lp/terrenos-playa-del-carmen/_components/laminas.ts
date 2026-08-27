import type { ImagenesLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// El índice de láminas.
//
// Cada imagen de la página lleva un número («FIG. 04») y la leyenda de
// amenidades las referencia por ese número. Si los números se escribieran a
// mano en cada llamada, el primer reordenamiento de secciones los desalinearía
// y la leyenda apuntaría a la lámina equivocada —un error que se ve tarde y
// que nadie va a estar recontando.
//
// Así que se numeran UNA vez, en ORDEN DE DOCUMENTO, y con las que de verdad
// se pintaron: una imagen cuyo archivo desapareció de la galería del Hub
// resuelve a `null`, no entra al índice y no deja un hueco en la numeración.
// Igual que una hoja de planos real, donde las láminas van 01, 02, 03 sin
// saltos.
// ============================================================

/**
 * Orden del mosaico de la sección de la privada. Vive AQUÍ y no en `Privada.tsx`
 * porque es a la vez el orden de pintado y el orden de numeración, y tenerlo
 * en dos sitios ya falló una vez: el mosaico salió rotulado «FIG. 07 GIMNASIO ·
 * FIG. 05 CASA CLUB · FIG. 08 CANCHAS» —numeración correcta, orden de lectura
 * roto— porque esta lista y la de `Privada` no coincidían. Un índice que no
 * sigue al ojo se lee como un error de maquetación, y lo es.
 *
 * `Privada` importa esto y pinta en este orden. No hay segunda copia.
 */
export const ORDEN_MOSAICO: (keyof ImagenesLanding)[] = [
  'alberca',
  'gimnasio',
  'casaClub',
  'canchasCenital',
  'cine',
  'casaClubComedor',
  'domingo',
  'amenidades',
  'andador',
];

/**
 * Orden de aparición en toda la página. ESTE array es el contrato de numeración.
 *
 * ⚠️ `hero` NO ESTÁ, a propósito. El hero se pinta con un `<Image>` a sangre
 * dentro de `page.tsx`, no con `FiguraTerrenos`, así que no lleva cartela y no
 * puede llevarla: la ocuparía el titular. Cuando sí estaba en esta lista se
 * comía el número 01 y las láminas visibles empezaban en «FIG. 02» sin que
 * existiera una 01 en ningún sitio — medido en el HTML servido. Un índice que
 * arranca en 02 se lee como un error de maquetación, y con razón.
 */
export const ORDEN_LAMINAS: (keyof ImagenesLanding)[] = [
  // Sección 02 · El sitio.
  'urbanizacion',
  'casasCenital',
  // Sección 05 · La privada. Se COMPONE del orden real del mosaico, no se
  // reescribe: ver el comentario de `ORDEN_MOSAICO`.
  ...ORDEN_MOSAICO,
];

export type IndiceLaminas = Partial<Record<keyof ImagenesLanding, string>>;

/** `{ hero: 'FIG. 01', urbanizacion: 'FIG. 02', … }`, solo con las presentes. */
export function numerarLaminas(imagenes: ImagenesLanding): IndiceLaminas {
  const indice: IndiceLaminas = {};
  let n = 0;
  for (const clave of ORDEN_LAMINAS) {
    if (imagenes[clave]) {
      n += 1;
      indice[clave] = `FIG. ${String(n).padStart(2, '0')}`;
    }
  }
  return indice;
}
