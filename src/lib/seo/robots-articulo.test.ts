import { describe, it, expect } from 'vitest';
import { robotsDeArticulo } from './robots-articulo';

/**
 * Hay DOS fuentes de noindex y su cruce es donde se esconde el bug:
 *   - el deploy entero (staging), vía shouldNoIndex()
 *   - el artículo, vía la columna `noindex` de public.blog_posts
 * Cualquiera de las dos alcanza para no indexar; ninguna puede anular a la otra.
 */
describe('robotsDeArticulo', () => {
  it('no devuelve directiva cuando nada pide noindex', () => {
    expect(robotsDeArticulo({ postNoindex: false, deployNoindex: false })).toBeUndefined();
  });

  it('no indexa cuando el artículo está marcado', () => {
    expect(robotsDeArticulo({ postNoindex: true, deployNoindex: false })).toEqual({
      index: false,
      follow: true,
    });
  });

  it('no indexa cuando el deploy entero está marcado', () => {
    expect(robotsDeArticulo({ postNoindex: false, deployNoindex: true })).toEqual({
      index: false,
      follow: true,
    });
  });

  it('el artículo no puede forzar indexación en un deploy de staging', () => {
    expect(robotsDeArticulo({ postNoindex: false, deployNoindex: true })?.index).toBe(false);
  });

  /**
   * `follow: true` es deliberado. Un artículo retirado sigue enlazando a
   * desarrollos y a otros artículos: bloquear el rastreo de esos enlaces
   * desperdiciaría la autoridad que la página todavía tiene. noindex retira la
   * página del índice; nofollow además rompería la red interna.
   */
  it('sigue los enlaces aunque no indexe', () => {
    expect(robotsDeArticulo({ postNoindex: true, deployNoindex: false })?.follow).toBe(true);
  });

  // La columna es NOT NULL DEFAULT false, pero un select viejo o un shape parcial
  // puede traer undefined y eso NO debe leerse como "no indexar".
  it('trata un valor ausente como indexable', () => {
    expect(robotsDeArticulo({ postNoindex: undefined, deployNoindex: false })).toBeUndefined();
  });
});
