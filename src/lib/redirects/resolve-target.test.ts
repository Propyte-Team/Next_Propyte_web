import { describe, it, expect } from 'vitest';
import { resolveTarget, type RedirectMap } from './resolve-target';

function mapa(entries: Record<string, { newSlug: string | null; kind: 'redirect' | 'gone' }>): RedirectMap {
  return new Map(Object.entries(entries));
}

describe('resolveTarget', () => {
  it('resuelve una redirección directa', () => {
    const m = mapa({ 'development:viejo': { newSlug: 'nuevo', kind: 'redirect' } });

    expect(resolveTarget(m, 'development', 'viejo')).toEqual({ kind: 'redirect', slug: 'nuevo' });
  });

  it('devuelve null cuando el slug no tiene fila', () => {
    expect(resolveTarget(mapa({}), 'development', 'cualquiera')).toBeNull();
  });

  it('devuelve gone sin destino', () => {
    const m = mapa({ 'blog_post:retirado': { newSlug: null, kind: 'gone' } });

    expect(resolveTarget(m, 'blog_post', 'retirado')).toEqual({ kind: 'gone' });
  });

  // Un desarrollo renombrado dos veces deja dos filas: v1→v2 y v2→v3. Sin seguir
  // la cadena mandaríamos un 308 a v2, que a su vez redirige: cadena de saltos
  // que diluye la señal y suma latencia.
  it('sigue la cadena hasta el destino final', () => {
    const m = mapa({
      'development:v1': { newSlug: 'v2', kind: 'redirect' },
      'development:v2': { newSlug: 'v3', kind: 'redirect' },
      'development:v3': { newSlug: 'v4', kind: 'redirect' },
    });

    expect(resolveTarget(m, 'development', 'v1')).toEqual({ kind: 'redirect', slug: 'v4' });
  });

  it('respeta un gone al final de la cadena', () => {
    const m = mapa({
      'blog_post:v1': { newSlug: 'v2', kind: 'redirect' },
      'blog_post:v2': { newSlug: null, kind: 'gone' },
    });

    expect(resolveTarget(m, 'blog_post', 'v1')).toEqual({ kind: 'gone' });
  });

  // Lo que no puede pasar nunca: que el middleware entre en bucle.
  it('no entra en bucle con un ciclo', () => {
    const m = mapa({
      'development:a': { newSlug: 'b', kind: 'redirect' },
      'development:b': { newSlug: 'a', kind: 'redirect' },
    });

    expect(resolveTarget(m, 'development', 'a')).toBeNull();
  });

  it('no redirige un slug hacia sí mismo', () => {
    const m = mapa({ 'development:mismo': { newSlug: 'mismo', kind: 'redirect' } });

    expect(resolveTarget(m, 'development', 'mismo')).toBeNull();
  });

  it('no cruza entity_type: el mismo slug en otra entidad no aplica', () => {
    const m = mapa({ 'development:compartido': { newSlug: 'nuevo', kind: 'redirect' } });

    expect(resolveTarget(m, 'unit', 'compartido')).toBeNull();
  });

  it('corta una cadena patológicamente larga en lugar de recorrerla completa', () => {
    const entries: Record<string, { newSlug: string | null; kind: 'redirect' | 'gone' }> = {};
    for (let i = 0; i < 50; i++) {
      entries[`development:s${i}`] = { newSlug: `s${i + 1}`, kind: 'redirect' };
    }
    const m = mapa(entries);

    const out = resolveTarget(m, 'development', 's0');

    // No cuelga, y lo que devuelve es un destino intermedio válido — un 308 a
    // mitad de cadena sigue siendo mejor que dejar la URL sin destino.
    expect(out?.kind).toBe('redirect');
    expect(out && 'slug' in out && out.slug).toMatch(/^s\d+$/);
  });
});
