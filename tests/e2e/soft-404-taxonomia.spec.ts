import { test, expect } from '@playwright/test';
import { TYPE_SLUGS } from '../../src/app/[locale]/desarrollos/_components/typeConfig';

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

test('@soft404 el 404 de una ruta sin patrón sigue siendo 404', async ({ request }) => {
  // Control: si esto se rompiera, el test de arriba pasaría por el motivo
  // equivocado y ya no estaría midiendo nada.
  const res = await request.get('/es/pagina-que-no-existe', { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});
