import { describe, it, expect } from 'vitest';
import { robotsDeListado } from './robots-listado';

const NOINDEX = { index: false, follow: true };

describe('robotsDeListado', () => {
  it('indexa el listado con resultados', () => {
    expect(
      robotsDeListado({ paramInvalido: false, resultados: 9, hayFiltro: false, page: 1 }),
    ).toBeUndefined();
  });

  it('indexa un filtro que SÍ trae piezas', () => {
    expect(
      robotsDeListado({ paramInvalido: false, resultados: 6, hayFiltro: true, page: 1 }),
    ).toBeUndefined();
  });

  // El caso que motiva el módulo: el filtro ofrece los 7 pilares del maestro y
  // hoy la mayoría no tiene piezas. Esas vistas no deben entrar al índice.
  it('saca del índice un pilar sin piezas', () => {
    expect(
      robotsDeListado({ paramInvalido: false, resultados: 0, hayFiltro: true, page: 1 }),
    ).toEqual(NOINDEX);
  });

  // La canónica de la sección se indexa aunque el inventario esté en cero:
  // sacarla borraría del buscador la puerta de entrada al blog.
  it('indexa el listado desnudo aunque esté vacío', () => {
    expect(
      robotsDeListado({ paramInvalido: false, resultados: 0, hayFiltro: false, page: 1 }),
    ).toBeUndefined();
  });

  it('saca del índice una página fuera de rango, sin filtro', () => {
    expect(
      robotsDeListado({ paramInvalido: false, resultados: 0, hayFiltro: false, page: 99 }),
    ).toEqual(NOINDEX);
  });

  it('respeta el param inválido aunque la vista traiga resultados', () => {
    expect(
      robotsDeListado({ paramInvalido: true, resultados: 9, hayFiltro: false, page: 1 }),
    ).toEqual(NOINDEX);
  });

  it('nunca emite nofollow: la vista vacía sigue enlazando temas y hubs', () => {
    const r = robotsDeListado({ paramInvalido: false, resultados: 0, hayFiltro: true, page: 1 });
    expect(r?.follow).toBe(true);
  });
});
