/**
 * Alturas de la hoja inferior móvil (MobileBottomSheet) en píxeles.
 *
 * La hoja es `fixed bottom-0`, así que su borde superior queda a
 * `viewportH - altura` del tope de la pantalla. La barra de agarre vive en ese
 * borde: si sube más allá del alto de la cabecera móvil (`fixed z-50`), el
 * logo la tapa y la persona ya no puede tocarla para volver a bajar la hoja
 * (reporte 2026-11-05, iPhone + Chrome). Por eso la altura «full» se limita a
 * lo que deja libre la cabecera.
 */

export type SheetState = 'peek' | 'half' | 'full';

/** Altura de la hoja replegada: barra de agarre + el filo de la primera tarjeta. */
export const PEEK_PX = 120;

/** Proporción máxima de la pantalla que puede ocupar la hoja. */
export const FULL_RATIO = 0.85;

/** Proporción de la altura «media». */
export const HALF_RATIO = 0.5;

/** Aire mínimo entre el borde inferior de la cabecera y el borde superior de la hoja. */
export const HEADER_GAP_PX = 12;

/** Diferencia mínima entre estados consecutivos para que el snap sea distinguible. */
const MIN_STEP_PX = 48;

export function sheetSnapHeights(
  viewportH: number,
  headerH: number,
): Record<SheetState, number> {
  const peek = PEEK_PX;
  // Lo que queda libre bajo la cabecera, sin dejar que baje de un piso útil
  // (pantallas muy bajas, p. ej. celular horizontal).
  const underHeader = viewportH - headerH - HEADER_GAP_PX;
  const full = Math.max(peek + MIN_STEP_PX * 2, Math.min(viewportH * FULL_RATIO, underHeader));
  const half = Math.max(peek + MIN_STEP_PX, Math.min(viewportH * HALF_RATIO, full - MIN_STEP_PX));
  return { peek, half, full };
}

/** Estado de snap más cercano a una altura dada. */
export function nearestSheetState(
  heightPx: number,
  snaps: Record<SheetState, number>,
): SheetState {
  let best: SheetState = 'peek';
  let bestDist = Infinity;
  (Object.keys(snaps) as SheetState[]).forEach((key) => {
    const dist = Math.abs(heightPx - snaps[key]);
    if (dist < bestDist) {
      best = key;
      bestDist = dist;
    }
  });
  return best;
}

/** Siguiente estado al tocar la barra de agarre (ciclo peek → half → full → peek). */
export function nextSheetState(state: SheetState): SheetState {
  if (state === 'peek') return 'half';
  if (state === 'half') return 'full';
  return 'peek';
}
