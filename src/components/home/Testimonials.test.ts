import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';

// No hay infraestructura de render en este repo — vitest corre en environment
// 'node' y solo incluye `src/**/*.test.ts`, no `.tsx`. Así que se verifican por
// separado las piezas que un render test cubriría de una vez: que el copy
// existe en los dos idiomas, que el tipo del Hub declara el campo, que la
// página lo pasa, y que el componente lo pinta CONDICIONADO a que exista.
// Mismo patrón que Footer.test.ts.
//
// Lo que estas pruebas protegen de verdad es la condición. Pintar el enlace es
// fácil de acertar; lo fácil de romper es pintarlo siempre, y entonces los
// testimonios sin liga —los de `recruitment`, que no tiene ninguna— quedarían
// con un enlace a `undefined`.

const leer = (archivo: string) =>
  readFileSync(path.resolve(__dirname, archivo), 'utf8');

describe('Testimonios — liga a la publicación original', () => {
  it('verifiedSourceLabel existe en los dos idiomas y admite el nombre', () => {
    const esValue = es.testimonials.verifiedSourceLabel;
    const enValue = en.testimonials.verifiedSourceLabel;

    expect(esValue?.trim()).toBeTruthy();
    expect(enValue?.trim()).toBeTruthy();

    // Es una etiqueta accesible: sin el nombre, tres enlaces seguidos suenan
    // idénticos en un lector de pantalla.
    expect(esValue).toContain('{name}');
    expect(enValue).toContain('{name}');
  });

  it('HubTestimonial declara source_url y admite null', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../../lib/hub-content.ts'),
      'utf8',
    );

    const inicio = src.indexOf('export interface HubTestimonial');
    expect(inicio, 'no se encontró HubTestimonial').toBeGreaterThan(-1);
    const bloque = src.slice(inicio, src.indexOf('}', inicio));

    expect(bloque).toMatch(/source_url:\s*string\s*\|\s*null/);
  });

  it('la home pasa source_url del Hub al componente', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../../app/[locale]/page.tsx'),
      'utf8',
    );

    const inicio = src.indexOf('const homeTestimonials');
    expect(inicio, 'no se encontró el mapeo homeTestimonials').toBeGreaterThan(-1);
    const bloque = src.slice(inicio, src.indexOf('}));', inicio));

    expect(bloque).toMatch(/sourceUrl:\s*t\.source_url/);
  });

  it('el enlace SOLO se pinta cuando hay liga', () => {
    const src = leer('Testimonials.tsx');

    // La condición y el <a> tienen que estar, en ese orden.
    const condicion = src.indexOf('item.sourceUrl ?');
    expect(condicion, 'el enlace no está condicionado a item.sourceUrl').toBeGreaterThan(-1);

    const ancla = src.indexOf('href={item.sourceUrl}');
    expect(ancla, 'no se encontró el enlace').toBeGreaterThan(-1);
    expect(ancla).toBeGreaterThan(condicion);

    // Y tiene que existir la otra rama: sin liga, la insignia sigue ahí como
    // texto. Si alguien borra el ternario y deja solo el enlace, esto cae.
    expect(src).toContain(') : (');
  });

  it('el enlace sale a Instagram de forma segura y con etiqueta accesible', () => {
    const src = leer('Testimonials.tsx');

    const inicio = src.indexOf('href={item.sourceUrl}');
    const bloque = src.slice(inicio, src.indexOf('>', src.indexOf('className', inicio)));

    expect(bloque).toContain('target="_blank"');
    // noopener es lo que impide que la pestaña abierta pueda manipular la
    // nuestra por window.opener.
    expect(bloque).toContain('rel="noopener noreferrer"');
    expect(bloque).toContain("aria-label={t('verifiedSourceLabel'");
  });

  it('el icono de la insignia no se le anuncia a un lector de pantalla', () => {
    const src = leer('Testimonials.tsx');

    // Dentro del enlace, el icono es decorativo: la etiqueta ya dice de qué
    // va. Sin aria-hidden, el lector anuncia el nombre del svg antes del
    // texto. Se comprueba en las dos ramas.
    const iconos = src.match(/<ShieldCheck[^>]*>/g) ?? [];
    expect(iconos.length).toBe(2);
    for (const icono of iconos) {
      expect(icono).toContain('aria-hidden="true"');
    }
  });

  it('el tipo del item deja sourceUrl opcional, para el respaldo de i18n', () => {
    const src = leer('Testimonials.tsx');

    const inicio = src.indexOf('interface TestimonialItem');
    const bloque = src.slice(inicio, src.indexOf('}', inicio));

    // Opcional Y nullable: el respaldo de i18n no trae el campo, y el Hub
    // puede mandarlo en null. Si se declarara `string` a secas, la home no
    // compilaría.
    expect(bloque).toMatch(/sourceUrl\?:\s*string\s*\|\s*null/);
  });
});
