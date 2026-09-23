import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';

// No hay infraestructura de render (jsdom / @testing-library/react) en este
// repo — vitest.config.mts corre en environment 'node' y solo incluye
// `src/**/*.test.ts`, no `.tsx`. Así que en vez de un render test se verifican
// las dos mitades del enlace: la clave de copy existe en los dos idiomas
// (paridad, mismo patrón que guia-terrenos.test.ts) y el propio Footer.tsx
// referencia la ruta en la columna de Recursos (source-scan, mismo patrón
// que el guardián de sitemap.test.ts). Juntas cubren lo que un render test
// verificaría: que el link existe y que apunta a donde debe.

describe('Footer — link de la guía de terrenos', () => {
  it('footer.landGuide existe y no está vacío en los dos idiomas', () => {
    const esValue = es.footer.landGuide;
    const enValue = en.footer.landGuide;
    expect(esValue?.trim()).toBeTruthy();
    expect(enValue?.trim()).toBeTruthy();
  });

  it('la columna de Recursos enlaza /guias/terrenos-residenciales usando footer.landGuide', () => {
    const src = readFileSync(
      path.resolve(__dirname, 'Footer.tsx'),
      'utf8',
    );

    // Aísla el bloque de la columna "Resources" (entre su título y el cierre
    // de su <ul>) para no depender de dónde caiga el link en el archivo.
    const start = src.indexOf(`{t('resources')}`);
    expect(start, 'no se encontró la columna de Recursos en Footer.tsx').toBeGreaterThan(-1);
    const end = src.indexOf('</ul>', start);
    const bloqueRecursos = src.slice(start, end);

    expect(bloqueRecursos).toContain('/guias/terrenos-residenciales');
    expect(bloqueRecursos).toContain(`{t('landGuide')}`);

    // Debe ser el PRIMER <li> de esa columna, no uno cualquiera en medio.
    const primerLi = bloqueRecursos.indexOf('<li>');
    const liDeLaGuia = bloqueRecursos.indexOf('/guias/terrenos-residenciales');
    const cierrePrimerLi = bloqueRecursos.indexOf('</li>', primerLi);
    expect(liDeLaGuia).toBeGreaterThan(primerLi);
    expect(liDeLaGuia).toBeLessThan(cierrePrimerLi);
  });
});
