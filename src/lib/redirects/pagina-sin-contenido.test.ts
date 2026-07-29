import { describe, it, expect } from 'vitest';
import { paginaSinContenido } from './pagina-sin-contenido';

describe('paginaSinContenido', () => {
  it('ofrece salida al catálogo de la sección y al inicio, en el locale pedido', () => {
    const html = paginaSinContenido({ status: 404, locale: 'es', seccion: 'desarrollos' });

    expect(html).toContain('href="/es/desarrollos"');
    expect(html).toContain('href="/es"');
    expect(html).toContain('lang="es"');
  });

  it('cambia el copy con el locale', () => {
    const en = paginaSinContenido({ status: 404, locale: 'en', seccion: 'propiedades' });

    expect(en).toContain('lang="en"');
    expect(en).toContain('not currently published');
    expect(en).toContain('href="/en/propiedades"');
  });

  // 404 y 410 no dicen lo mismo: uno es "hoy no", el otro "nunca más".
  it('distingue el mensaje de 404 del de 410', () => {
    const cuatro = paginaSinContenido({ status: 404, locale: 'es', seccion: 'desarrollos' });
    const diez = paginaSinContenido({ status: 410, locale: 'es', seccion: 'desarrollos' });

    expect(cuatro).toContain('no está disponible');
    expect(diez).toContain('ya no existe');
    expect(cuatro).not.toBe(diez);
  });

  // El status ya lo dice, pero un noindex explícito no cuesta nada y cubre el caso
  // de un proxy o CDN que reescriba el status.
  it('trae noindex explícito', () => {
    expect(paginaSinContenido({ status: 410, locale: 'es', seccion: 'blog' })).toContain(
      'name="robots" content="noindex, follow"',
    );
  });

  // La sección viene de la URL: si no se escapa, es una inyección de HTML.
  it('escapa la sección en vez de interpolarla cruda', () => {
    const html = paginaSinContenido({
      status: 404,
      locale: 'es',
      seccion: '"><script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('cae a español ante un locale desconocido', () => {
    const html = paginaSinContenido({ status: 404, locale: 'zz', seccion: 'desarrollos' });

    expect(html).toContain('lang="es"');
    expect(html).toContain('no está disponible');
  });

  // Un solo request en el edge: nada de fuentes, CSS ni imágenes externas.
  it('no depende de ningún recurso externo', () => {
    const html = paginaSinContenido({ status: 404, locale: 'es', seccion: 'desarrollos' });

    expect(html).not.toMatch(/<link[^>]+href="https?:/);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/https?:\/\//);
  });
});
