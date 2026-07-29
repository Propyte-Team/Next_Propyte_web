import { describe, it, expect, vi } from 'vitest';
import {
  redirectsPageUrl,
  entidadesPageUrl,
  filasToMap,
  entidadesToSlugVigente,
  traerTodasLasPaginas,
  TAMANO_PAGINA,
} from './load-map';

/**
 * El bug que estos tests fijan (medido el 29-jul en producción):
 *
 * La versión anterior pedía `limit=5000` sobre una tabla de 3,569 filas y creía
 * traerlas todas. PostgREST topa en 1000 filas por respuesta e **ignora el limit
 * más grande sin avisar**: devolvía 1000 y HTTP 200. El mapa cubría el 28% de la
 * tabla, de forma arbitraria — `manlika` y `nubba` quedaban fuera, así que el
 * middleware estaba vivo en producción y no redirigía. Mismo patrón que el
 * lookup muerto que vino a reemplazar: fallo silencioso, sin error.
 */

describe('redirectsPageUrl', () => {
  it('pide entity_id, que es la columna estable', () => {
    const url = redirectsPageUrl('https://proj.supabase.co', 0);

    expect(url).toContain('/rest/v1/slug_redirects');
    expect(url).toContain('entity_id');
    expect(url).toContain('entity_type');
    expect(url).toContain('old_slug');
    expect(url).toContain('kind');
  });

  // Sin ORDER BY estable, paginar por offset puede saltarse o duplicar filas.
  it('ordena por una clave única para que el offset sea estable', () => {
    expect(redirectsPageUrl('https://proj.supabase.co', 0)).toContain('order=id');
  });

  it('pide páginas del tamaño que PostgREST permite, con offset', () => {
    expect(redirectsPageUrl('https://p.supabase.co', 0)).toContain(`limit=${TAMANO_PAGINA}`);
    expect(redirectsPageUrl('https://p.supabase.co', 2000)).toContain('offset=2000');
  });

  it('no pide más de lo que PostgREST devuelve', () => {
    // El tope del servidor es 1000. Pedir más es la mentira que causó el bug.
    expect(TAMANO_PAGINA).toBeLessThanOrEqual(1000);
  });
});

describe('entidadesPageUrl', () => {
  it('apunta a la tabla y columna de slug de cada entidad', () => {
    const dev = entidadesPageUrl('https://p.supabase.co', 'Propyte_desarrollos', 'ext_slug_desarrollo', 0);
    expect(dev).toContain('Propyte_desarrollos');
    expect(dev).toContain('select=id,ext_slug_desarrollo');
    expect(dev).toContain('order=id');

    const uni = entidadesPageUrl('https://p.supabase.co', 'Propyte_unidades', 'slug_unidad', 0);
    expect(uni).toContain('Propyte_unidades');
    expect(uni).toContain('select=id,slug_unidad');
  });
});

describe('traerTodasLasPaginas', () => {
  it('junta las páginas y para cuando una viene incompleta', async () => {
    const paginas = [
      Array.from({ length: 3 }, (_, i) => ({ n: i })),
      Array.from({ length: 3 }, (_, i) => ({ n: 3 + i })),
      [{ n: 6 }], // incompleta: es la última
    ];
    const traer = vi.fn(async (offset: number) => paginas[offset / 3] ?? []);

    const todas = await traerTodasLasPaginas(traer, { tamanoPagina: 3, maxPaginas: 10 });

    expect(todas).toHaveLength(7);
    expect(traer).toHaveBeenCalledTimes(3);
  });

  it('para cuando la página siguiente viene vacía', async () => {
    const traer = vi.fn(async (offset: number) => (offset === 0 ? [{ n: 1 }, { n: 2 }] : []));

    const todas = await traerTodasLasPaginas(traer, { tamanoPagina: 2, maxPaginas: 10 });

    expect(todas).toHaveLength(2);
    expect(traer).toHaveBeenCalledTimes(2);
  });

  // Sin tope, un error de servidor que devuelva siempre una página llena haría
  // que el middleware pidiera páginas para siempre.
  it('respeta el tope de páginas', async () => {
    const traer = vi.fn(async () => [{ n: 1 }, { n: 2 }]);

    const todas = await traerTodasLasPaginas(traer, { tamanoPagina: 2, maxPaginas: 4 });

    expect(traer).toHaveBeenCalledTimes(4);
    expect(todas).toHaveLength(8);
  });

  it('devuelve vacío si la primera página viene vacía', async () => {
    const todas = await traerTodasLasPaginas(async () => [], { tamanoPagina: 5, maxPaginas: 3 });

    expect(todas).toEqual([]);
  });
});

describe('filasToMap', () => {
  it('llavea por entity_type y old_slug, y conserva entity_id', () => {
    const map = filasToMap([
      {
        entity_type: 'development',
        old_slug: 'viejo',
        new_slug: 'nuevo',
        kind: 'redirect',
        entity_id: 'e1',
      },
    ]);

    expect(map.get('development:viejo')).toEqual({
      entityId: 'e1',
      newSlug: 'nuevo',
      kind: 'redirect',
    });
  });

  // Antes se descartaban: sin destino no podían producir un 308. Ahora un
  // development/unit se resuelve por entity_id, así que la fila SÍ sirve.
  it('conserva un redirect sin new_slug cuando tiene entity_id', () => {
    const map = filasToMap([
      { entity_type: 'development', old_slug: 'x', new_slug: null, kind: 'redirect', entity_id: 'e1' },
    ]);

    expect(map.get('development:x')).toEqual({ entityId: 'e1', newSlug: null, kind: 'redirect' });
  });

  // Las 2,870 filas de unidades no se cargan: no se pueden resolver con la llave
  // anónima sin mandar 410 a páginas que renderizan. Ver resolve-target.ts.
  it('descarta las filas de unidades, que están fuera de alcance', () => {
    const map = filasToMap([
      { entity_type: 'unit', old_slug: 'x', new_slug: 'y', kind: 'redirect', entity_id: 'u1' },
    ]);

    expect(map.size).toBe(0);
  });

  it('conserva las filas gone', () => {
    const map = filasToMap([
      { entity_type: 'blog_post', old_slug: 'retirado', new_slug: null, kind: 'gone', entity_id: null },
    ]);

    expect(map.get('blog_post:retirado')).toEqual({ entityId: null, newSlug: null, kind: 'gone' });
  });

  // El destino es un SLUG, no una ruta. Una fila hostil en el Hub no puede mandar
  // al visitante fuera del sitio ni salirse del prefijo de sección.
  it('anula destinos que no son un slug limpio en vez de propagarlos', () => {
    const map = filasToMap([
      { entity_type: 'blog_post', old_slug: 'a', new_slug: '//evil.com', kind: 'redirect', entity_id: null },
      { entity_type: 'blog_post', old_slug: 'b', new_slug: 'https://evil.com', kind: 'redirect', entity_id: null },
      { entity_type: 'blog_post', old_slug: 'c', new_slug: '../../etc/passwd', kind: 'redirect', entity_id: null },
      { entity_type: 'blog_post', old_slug: 'd', new_slug: 'otra/ruta', kind: 'redirect', entity_id: null },
      { entity_type: 'blog_post', old_slug: 'e', new_slug: 'slug-legitimo', kind: 'redirect', entity_id: null },
    ]);

    for (const k of ['a', 'b', 'c', 'd']) {
      expect(map.get(`blog_post:${k}`)?.newSlug).toBeNull();
    }
    expect(map.get('blog_post:e')?.newSlug).toBe('slug-legitimo');
  });

  it('descarta filas con entity_type desconocido', () => {
    expect(filasToMap([{ entity_type: 'algo_nuevo', old_slug: 'x', new_slug: 'y', kind: 'redirect' }]).size).toBe(0);
  });

  it('descarta filas con old_slug sucio', () => {
    const map = filasToMap([
      { entity_type: 'development', old_slug: 'con/barra', new_slug: 'y', kind: 'redirect', entity_id: 'e1' },
      { entity_type: 'development', old_slug: '', new_slug: 'y', kind: 'redirect', entity_id: 'e1' },
    ]);

    expect(map.size).toBe(0);
  });

  it('descarta un kind desconocido', () => {
    expect(
      filasToMap([{ entity_type: 'development', old_slug: 'x', new_slug: 'y', kind: 'vandalizado', entity_id: 'e1' }])
        .size,
    ).toBe(0);
  });

  it('tolera una respuesta que no es un array', () => {
    expect(filasToMap(null).size).toBe(0);
    expect(filasToMap(undefined).size).toBe(0);
    expect(filasToMap({ message: 'error' }).size).toBe(0);
  });
});

describe('entidadesToSlugVigente', () => {
  it('mapea id → slug publicado', () => {
    const m = entidadesToSlugVigente(
      [{ id: 'e1', ext_slug_desarrollo: 'un-slug' }],
      'ext_slug_desarrollo',
    );

    expect(m.get('e1')).toBe('un-slug');
  });

  // Una entidad publicada sin slug no tiene página: debe caer en 410, no en 308.
  it('omite entidades sin slug', () => {
    const m = entidadesToSlugVigente([{ id: 'e1', ext_slug_desarrollo: null }], 'ext_slug_desarrollo');

    expect(m.size).toBe(0);
  });

  it('omite slugs que no son limpios', () => {
    const m = entidadesToSlugVigente(
      [{ id: 'e1', slug_unidad: 'con/barra' }, { id: 'e2', slug_unidad: 'bien' }],
      'slug_unidad',
    );

    expect(m.has('e1')).toBe(false);
    expect(m.get('e2')).toBe('bien');
  });

  it('tolera una respuesta que no es un array', () => {
    expect(entidadesToSlugVigente(null, 'slug_unidad').size).toBe(0);
    expect(entidadesToSlugVigente({ message: 'error' }, 'slug_unidad').size).toBe(0);
  });
});
