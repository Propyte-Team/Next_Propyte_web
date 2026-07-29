import { describe, it, expect } from 'vitest';
import { matchEntityPath } from './match-entity-path';

// El middleware corre en CADA request que pase el matcher. Esta función decide si
// una ruta es candidata a redirección y de qué tipo de entidad, sin tocar la BD.
// Los entity_type devueltos son los de real_estate_hub.slug_redirects.

describe('matchEntityPath', () => {
  it('reconoce el detalle de blog en los dos locales', () => {
    expect(matchEntityPath('/es/blog/mi-articulo')).toEqual({
      locale: 'es',
      entityType: 'blog_post',
      slug: 'mi-articulo',
      seccion: 'blog',
    });
    expect(matchEntityPath('/en/blog/mi-articulo')).toEqual({
      locale: 'en',
      entityType: 'blog_post',
      slug: 'mi-articulo',
      seccion: 'blog',
    });
  });

  // Los 3,569 redirects existentes son de estas dos, no de blog.
  it('mapea desarrollos y propiedades a sus entity_type de la tabla', () => {
    expect(matchEntityPath('/es/desarrollos/algun-desarrollo')?.entityType).toBe('development');
    expect(matchEntityPath('/es/propiedades/alguna-unidad')?.entityType).toBe('unit');
  });

  it('ignora los listados, que no son detalle de nada', () => {
    expect(matchEntityPath('/es/blog')).toBeNull();
    expect(matchEntityPath('/es/desarrollos')).toBeNull();
    expect(matchEntityPath('/es/propiedades/')).toBeNull();
  });

  it('ignora rutas que no son de estas tres secciones', () => {
    expect(matchEntityPath('/es/mercado')).toBeNull();
    expect(matchEntityPath('/es/nosotros/equipo-comercial')).toBeNull();
    expect(matchEntityPath('/')).toBeNull();
  });

  it('ignora locales que el sitio no sirve', () => {
    // Sin esto, /fr/blog/x entraría a buscar en la BD por nada.
    expect(matchEntityPath('/fr/blog/mi-articulo')).toBeNull();
    expect(matchEntityPath('/blog/mi-articulo')).toBeNull();
  });

  it('ignora sub-rutas más profundas que el detalle', () => {
    // No existe /es/blog/slug/algo. Tratarlo como detalle buscaría un slug falso.
    expect(matchEntityPath('/es/blog/mi-articulo/comentarios')).toBeNull();
  });

  it('tolera la barra final', () => {
    expect(matchEntityPath('/es/blog/mi-articulo/')).toEqual({
      locale: 'es',
      entityType: 'blog_post',
      slug: 'mi-articulo',
      seccion: 'blog',
    });
  });

  it('ignora rutas de assets y de API que comparten prefijo', () => {
    expect(matchEntityPath('/api/blog/mi-articulo')).toBeNull();
    expect(matchEntityPath('/_next/static/chunks/es/blog/x.js')).toBeNull();
  });
});
