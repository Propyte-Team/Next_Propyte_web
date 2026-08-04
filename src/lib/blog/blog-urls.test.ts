import { describe, it, expect } from 'vitest';
import {
  blogHref,
  BLOG_PAGE_PARAM, BLOG_CATEGORY_PARAM, BLOG_PILAR_PARAM, BLOG_AUDIENCIA_PARAM,
} from './blog-urls';

describe('blogHref', () => {
  it('sin estado devuelve el listado limpio', () => {
    expect(blogHref('es')).toBe('/es/blog');
    expect(blogHref('en')).toBe('/en/blog');
  });

  it('omite la página 1 — /blog y /blog?pagina=1 serían dos URLs del mismo contenido', () => {
    expect(blogHref('es', { page: 1 })).toBe('/es/blog');
    expect(blogHref('es', { page: 2 })).toBe('/es/blog?pagina=2');
  });

  it('conserva el comportamiento de categoría', () => {
    expect(blogHref('es', { category: 'Para Asesores' })).toBe('/es/blog?categoria=Para+Asesores');
  });

  it('añade pilar y audiencia', () => {
    expect(blogHref('es', { pilar: 'fiscal-legal' })).toBe('/es/blog?pilar=fiscal-legal');
    expect(blogHref('es', { audiencia: 'asesores' })).toBe('/es/blog?audiencia=asesores');
  });

  it('el orden de params es estable: categoria, pilar, audiencia, pagina', () => {
    // El canonical de una vista tiene que ser byte-idéntico a su propio href.
    const href = blogHref('es', {
      page: 3, audiencia: 'inversionistas', pilar: 'mercado-zonas', category: 'Mercado',
    });
    expect(href).toBe('/es/blog?categoria=Mercado&pilar=mercado-zonas&audiencia=inversionistas&pagina=3');
  });

  it('combina pilar y audiencia sin categoría', () => {
    expect(blogHref('es', { pilar: 'fiscal-legal', audiencia: 'inversionistas' }))
      .toBe('/es/blog?pilar=fiscal-legal&audiencia=inversionistas');
  });

  it('null, undefined y cadena vacía no emiten param', () => {
    expect(blogHref('es', { category: null, pilar: undefined, audiencia: '', page: null })).toBe('/es/blog');
  });

  it('los nombres de param están exportados en un solo lugar', () => {
    expect(BLOG_CATEGORY_PARAM).toBe('categoria');
    expect(BLOG_PILAR_PARAM).toBe('pilar');
    expect(BLOG_AUDIENCIA_PARAM).toBe('audiencia');
    expect(BLOG_PAGE_PARAM).toBe('pagina');
  });
});
