import { describe, it, expect } from 'vitest';
import { redirectMapUrl, rowsToMap } from './load-map';

// El middleware traía un lookup contra /rest/v1/slug_redirects pidiendo
// new_path y redirect_type. Esa tabla no existe: slug_redirects vive en el schema
// real_estate_hub y sus columnas son new_slug y kind. PostgREST devolvía error,
// `if (res.ok)` lo descartaba y el catch {} se lo comía — los redirects de slugs
// legacy de WordPress nunca funcionaron. Estos tests fijan la forma correcta.

describe('redirectMapUrl', () => {
  it('apunta a la tabla real con las columnas que existen', () => {
    const url = redirectMapUrl('https://proj.supabase.co');

    expect(url).toContain('/rest/v1/slug_redirects');
    expect(url).toContain('entity_type');
    expect(url).toContain('old_slug');
    expect(url).toContain('new_slug');
    expect(url).toContain('kind');
    // Las columnas de la tabla fantasma que pedía el lookup viejo.
    expect(url).not.toContain('new_path');
    expect(url).not.toContain('redirect_type');
  });

  it('acota el resultado en lugar de traer la tabla entera', () => {
    // Son 3,569 filas: sin límite el middleware se traería todo en cada instancia fría.
    expect(redirectMapUrl('https://proj.supabase.co')).toMatch(/limit=\d+/);
  });
});

describe('rowsToMap', () => {
  it('llavea por entity_type y old_slug', () => {
    const map = rowsToMap([
      { entity_type: 'development', old_slug: 'viejo', new_slug: 'nuevo', kind: 'redirect' },
    ]);

    expect(map.get('development:viejo')).toEqual({ newSlug: 'nuevo', kind: 'redirect' });
  });

  it('conserva las filas gone, que no tienen destino', () => {
    const map = rowsToMap([
      { entity_type: 'blog_post', old_slug: 'retirado', new_slug: null, kind: 'gone' },
    ]);

    expect(map.get('blog_post:retirado')).toEqual({ newSlug: null, kind: 'gone' });
  });

  // El destino es un SLUG, no una ruta. Una fila hostil en el Hub no puede
  // mandar al visitante fuera del sitio. El middleware ya defendía así el lookup
  // viejo; la defensa se conserva.
  it('descarta destinos que no son un slug limpio', () => {
    const map = rowsToMap([
      { entity_type: 'development', old_slug: 'a', new_slug: '//evil.com', kind: 'redirect' },
      { entity_type: 'development', old_slug: 'b', new_slug: 'https://evil.com', kind: 'redirect' },
      { entity_type: 'development', old_slug: 'c', new_slug: '../../etc/passwd', kind: 'redirect' },
      { entity_type: 'development', old_slug: 'd', new_slug: 'otra/ruta', kind: 'redirect' },
      { entity_type: 'development', old_slug: 'e', new_slug: 'slug-legitimo', kind: 'redirect' },
    ]);

    expect(map.has('development:a')).toBe(false);
    expect(map.has('development:b')).toBe(false);
    expect(map.has('development:c')).toBe(false);
    expect(map.has('development:d')).toBe(false);
    expect(map.get('development:e')).toEqual({ newSlug: 'slug-legitimo', kind: 'redirect' });
  });

  it('descarta filas con entity_type desconocido', () => {
    const map = rowsToMap([
      { entity_type: 'algo_nuevo', old_slug: 'x', new_slug: 'y', kind: 'redirect' },
    ]);

    expect(map.size).toBe(0);
  });

  // Una fila 'redirect' sin destino no puede producir un 308 hacia null. El CHECK
  // de la BD ya lo impide, pero el middleware no debe confiar en eso.
  it('descarta un redirect sin destino', () => {
    const map = rowsToMap([
      { entity_type: 'blog_post', old_slug: 'x', new_slug: null, kind: 'redirect' },
    ]);

    expect(map.size).toBe(0);
  });

  it('tolera una respuesta que no es un array', () => {
    expect(rowsToMap(null).size).toBe(0);
    expect(rowsToMap(undefined).size).toBe(0);
    expect(rowsToMap({ message: 'error' }).size).toBe(0);
  });
});
