import { test, expect } from '@playwright/test';
import { TYPE_SLUGS } from '../../src/app/[locale]/desarrollos/_components/typeConfig';
import { MARKET_SUBMARKET_TO_ZONE } from '../../src/lib/calculator';
import { zoneSlug } from '../../src/lib/utils';

/**
 * Regresión de la tarjeta #235 — una faceta que no existe tiene que responder
 * 404, no 200 con el cuerpo del 404.
 *
 * Medido contra producción el 2026-08-31:
 * `/es/desarrollos/tipo/basura-inventada-xyz` respondía **200** pintando la
 * página de «404 · Página no encontrada», mientras que una ruta que no casaba
 * con ningún patrón (`/es/pagina-que-no-existe`) respondía 404 correctamente.
 * Para un buscador eso son páginas basura indexables sin límite.
 *
 * Se comprueba el ESTADO de la respuesta y no lo que se ve en pantalla: el
 * cuerpo ya decía «404» mientras el fallo estaba vivo, así que un test que
 * mirase el texto habría pasado en verde con el bug dentro.
 *
 *   npx playwright test tests/e2e/soft-404-taxonomia.spec.ts
 */

const INVENTADOS = ['basura-inventada-xyz', 'villa', 'comercial', 'constructor', '__proto__'];

for (const locale of ['es', 'en'] as const) {
  test(`@soft404 ${locale} — una faceta inventada responde 404`, async ({ request }) => {
    for (const slug of INVENTADOS) {
      const ruta = `/${locale}/desarrollos/tipo/${slug}`;
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status(), `${ruta} debería ser un 404 y no una página válida`).toBe(404);
    }
  });

  test(`@soft404 ${locale} — las facetas canónicas siguen respondiendo 200`, async ({
    request,
  }) => {
    // La contraparte: el arreglo no puede llevarse por delante las buenas.
    // La lista sale del MISMO sitio que alimenta `generateStaticParams` y el
    // sitemap, así que no pueden divergir sin que este test lo note.
    expect(TYPE_SLUGS.length, 'la taxonomía se quedó vacía').toBeGreaterThan(0);
    for (const slug of TYPE_SLUGS) {
      const ruta = `/${locale}/desarrollos/tipo/${slug}`;
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status(), `${ruta} dejó de servirse`).toBe(200);
    }
  });
}

/**
 * Regresión de la tarjeta #676, mitad de `/zonas/<slug>`.
 *
 * El mismo defecto de clase que la #235, pero aquí no se quedaba en un 200 con
 * el cuerpo del 404: FABRICABA la página. Medido en producción el 2026-09-02,
 * `/es/zonas/basura-xyz-123` respondía 200 con el título «basura xyz 123,
 * Cancun — Análisis de Mercado de Renta Vacacional», porque generateMetadata
 * rellenaba el nombre con el slug humanizado y la ciudad con 'Cancun'. Un
 * título único y creíble por cada slug inventado.
 *
 * Se arregló con `dynamicParams = false` —la lista de zonas sale del código,
 * no de la base— más el guardia que le faltaba a generateMetadata.
 */

/** Las mismas zonas que alimentan generateStaticParams, del mismo origen. */
const ZONA_SLUGS = [...new Set(Object.values(MARKET_SUBMARKET_TO_ZONE).map(zoneSlug))];

for (const locale of ['es', 'en'] as const) {
  test(`@soft404 ${locale} — una zona inventada responde 404`, async ({ request }) => {
    for (const slug of INVENTADOS) {
      const ruta = `/${locale}/zonas/${slug}`;
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status(), `${ruta} debería ser un 404 y no una página válida`).toBe(404);
    }
  });

  test(`@soft404 ${locale} — una zona inventada no publica metadata fabricada`, async ({
    request,
  }) => {
    // El estado es lo que mide el test de arriba; esto mide la otra mitad del
    // fallo. El título salía con el slug humanizado y la ciudad inventada, así
    // que basta buscar el slug dentro del <title> para detectar la recaída.
    const res = await request.get(`/${locale}/zonas/basura-xyz-123`, { maxRedirects: 0 });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '';
    expect(title, 'el <title> volvió a inventar el nombre de la zona').not.toMatch(/basura/i);
    expect(title, 'el <title> volvió a inventar la ciudad').not.toMatch(/Cancun/i);
  });

  test(`@soft404 ${locale} — las zonas reales siguen respondiendo 200`, async ({ request }) => {
    // La contraparte: cerrar la lista no puede llevarse por delante las buenas.
    //
    // Se prueba una MUESTRA y no las 45, a propósito. Con `dynamicParams =
    // false` las 45 se prerenderizan de la misma lista, así que no fallan una
    // a una: fallan todas o ninguna. El modo de fallo real es que la lista
    // cambie de forma —una zona con acento o con un caracter que el middleware
    // normalice con un 308, que este test leería como «dejó de servirse»—, y
    // para eso basta una muestra repartida más la cuenta de abajo. Pedir 90
    // páginas de análisis, cada una con sus consultas a Supabase, haría el test
    // lento y frágil sin medir nada nuevo.
    expect(ZONA_SLUGS.length, 'la lista de zonas se quedó vacía').toBeGreaterThan(20);

    const muestra = [
      ZONA_SLUGS[0],
      ZONA_SLUGS[Math.floor(ZONA_SLUGS.length / 3)],
      ZONA_SLUGS[Math.floor(ZONA_SLUGS.length / 2)],
      ZONA_SLUGS[ZONA_SLUGS.length - 1],
    ];
    for (const slug of muestra) {
      const ruta = `/${locale}/zonas/${slug}`;
      const res = await request.get(ruta, { maxRedirects: 0 });
      expect(res.status(), `${ruta} dejó de servirse`).toBe(200);
    }
  });

  test(`@soft404 ${locale} — ningún slug de zona necesita normalización`, async ({ request }) => {
    // Guardia de forma, no de red: si una zona nueva entra con acento o con un
    // caracter que el middleware normalice, su página canónica responderia 308
    // y el sitemap apuntaria a un redirect. zoneSlug() ya quita acentos; esto
    // vigila que siga siendo cierto para toda la lista.
    void request;
    const raros = ZONA_SLUGS.filter((s) => !/^[a-z0-9.-]+$/.test(s));
    expect(raros, `estos slugs de zona no son canónicos: ${raros.join(', ')}`).toEqual([]);
  });
}

test('@soft404 el 404 de una ruta sin patrón sigue siendo 404', async ({ request }) => {
  // Control: si esto se rompiera, el test de arriba pasaría por el motivo
  // equivocado y ya no estaría midiendo nada.
  const res = await request.get('/es/pagina-que-no-existe', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});
