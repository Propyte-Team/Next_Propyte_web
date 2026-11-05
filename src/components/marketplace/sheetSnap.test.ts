import { describe, expect, it } from 'vitest';
import {
  HEADER_GAP_PX,
  PEEK_PX,
  nearestSheetState,
  nextSheetState,
  sheetSnapHeights,
} from './sheetSnap';

describe('sheetSnapHeights', () => {
  it('iPhone con la barra de Chrome visible: el borde superior queda bajo la cabecera', () => {
    // Caso del reporte del 2026-11-05: la cabecera fija mide ~122px.
    const viewportH = 664;
    const headerH = 122;
    const snaps = sheetSnapHeights(viewportH, headerH);
    const topOfSheet = viewportH - snaps.full;
    expect(topOfSheet).toBeGreaterThanOrEqual(headerH + HEADER_GAP_PX);
  });

  it('antes del arreglo (85% de la pantalla) la barra de agarre sí quedaba bajo la cabecera', () => {
    const viewportH = 664;
    const headerH = 122;
    const topConElViejo85 = viewportH - viewportH * 0.85;
    expect(topConElViejo85).toBeLessThan(headerH);
  });

  it('mantiene peek < half < full en pantallas normales', () => {
    for (const [h, header] of [
      [664, 122],
      [750, 122],
      [844, 122],
      [932, 130],
      [568, 110],
    ]) {
      const s = sheetSnapHeights(h, header);
      expect(s.peek).toBe(PEEK_PX);
      expect(s.half).toBeGreaterThan(s.peek);
      expect(s.full).toBeGreaterThan(s.half);
    }
  });

  it('en pantallas muy bajas (horizontal) conserva estados distinguibles', () => {
    const s = sheetSnapHeights(360, 122);
    expect(s.half).toBeGreaterThan(s.peek);
    expect(s.full).toBeGreaterThan(s.half);
  });

  it('en pantallas altas no pasa del 85% de la pantalla', () => {
    const s = sheetSnapHeights(1200, 60);
    expect(s.full).toBeLessThanOrEqual(1200 * 0.85);
  });
});

describe('nearestSheetState', () => {
  const snaps = { peek: 120, half: 332, full: 530 };
  it('elige el snap más cercano', () => {
    expect(nearestSheetState(130, snaps)).toBe('peek');
    expect(nearestSheetState(300, snaps)).toBe('half');
    expect(nearestSheetState(520, snaps)).toBe('full');
  });
});

describe('nextSheetState', () => {
  it('cicla peek → half → full → peek', () => {
    expect(nextSheetState('peek')).toBe('half');
    expect(nextSheetState('half')).toBe('full');
    expect(nextSheetState('full')).toBe('peek');
  });
});
