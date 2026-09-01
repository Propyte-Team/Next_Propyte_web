import { test, expect } from '@playwright/test';

/**
 * El banner de cookies no puede tapar el botón del formulario del blog.
 *
 * 01-sep-2026. Al volver obligatorio el teléfono, el campo nuevo añadió 77 px
 * al form del sidebar y empujó el botón «Descargar guía» hacia abajo, justo
 * dentro del banner de cookies, que iba anclado a `sm:right-4` — la misma
 * columna donde vive el formulario. Medido en producción:
 *
 *   1536x864 → banner desde y 621, botón y 631–675   el clic NO llegaba
 *   1440x900 → banner desde y 657, botón y 631–675   el clic NO llegaba
 *   1280x720 → tapado también, y este ya lo estaba antes del cambio
 *
 * Es la SEGUNDA vez que ocurre: la primera fueron los dos CTA del hero de la
 * LP de lotes (commit dacfe82). El patrón se repite porque el fallo nace de la
 * ALTURA ACUMULADA del contenido contra un elemento `fixed`, así que cualquier
 * campo o copy que se añada arriba puede reintroducirlo sin tocar el banner.
 *
 * La comprobación es `elementFromPoint` sobre el centro del botón, no un
 * cálculo de rectángulos: lo que importa no es si se ven encimados, sino si el
 * clic llega. El contexto va limpio a propósito —sin consentimiento previo—
 * porque el visitante nuevo de SEO y de anuncios es justo el que se lo come.
 *
 *   npx playwright test tests/e2e/blog-sidebar-banner.spec.ts
 */

const VIEWPORTS = [
  { width: 1280, height: 720, nombre: '1280x720' },
  { width: 1440, height: 900, nombre: '1440x900' },
  { width: 1536, height: 864, nombre: '1536x864' },
  { width: 1920, height: 1080, nombre: '1920x1080' },
];

const ARTICULO = '/es/blog/cfdi-compra-inmueble';

for (const vp of VIEWPORTS) {
  test(`@banner ${vp.nombre} — el banner de cookies no tapa el botón del form del blog`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(ARTICULO);
    // El banner entra con animación de muelle; se espera a que esté quieto.
    await expect(page.locator('aside[aria-label*="ookie"], aside[aria-label*="Cookie"]')).toBeVisible();
    await page.waitForTimeout(1200);

    const medida = await page.evaluate(() => {
      const form = Array.from(document.querySelectorAll('form'))
        .filter((f) => f.querySelector('.PhoneInput'))
        .find((f) => f.getBoundingClientRect().height > 0);
      if (!form) return { error: 'no hay form visible con teléfono en el sidebar' };
      const btn = form.querySelector('button[type="submit"]') as HTMLElement | null;
      if (!btn) return { error: 'el form no tiene botón de envío' };

      const r = btn.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      if (cy < 0 || cy > window.innerHeight) {
        return { error: 'el botón quedó fuera de la ventana; el test no puede concluir' };
      }
      const receptor = document.elementFromPoint(cx, cy);
      return {
        alcanzable: receptor === btn || btn.contains(receptor as Node),
        // Quién se come el clic, para que el fallo diga qué lo tapa.
        loTapa: receptor
          ? `${receptor.tagName}.${String((receptor as HTMLElement).className).slice(0, 60)}`
          : 'nada',
        botonY: `${Math.round(r.top)}–${Math.round(r.bottom)}`,
      };
    });

    expect(medida.error, medida.error ?? '').toBeUndefined();
    expect(
      medida.alcanzable,
      `en ${vp.nombre} el botón (y ${medida.botonY}) no recibe el clic: lo tapa ${medida.loTapa}`,
    ).toBe(true);
  });
}
