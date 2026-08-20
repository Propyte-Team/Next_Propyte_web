/**
 * Helper para declarar `openGraph.images` SIN perder las dimensiones.
 *
 * Por qué existe:
 * Next.js genera solo las etiquetas `og:image:width` / `og:image:height` /
 * `og:image:type` cuando la imagen viene del file convention
 * (`opengraph-image.tsx` colocado junto a la page). En cuanto un
 * `generateMetadata()` declara `openGraph.images` a mano, ESE valor pisa al
 * auto-generado: si se pasa un string suelto —`images: ['/es/opengraph-image']`—
 * el HTML sale con `og:image` a secas, sin medidas.
 *
 * Consecuencia real (verificada en prod ago-2026): WhatsApp, LinkedIn y Slack
 * no descargan la imagen para medirla. Sin `og:image:width` asumen miniatura y
 * renderizan la tarjeta CUADRADA pequeña en vez de la grande, aunque
 * `twitter:card` diga `summary_large_image`. La imagen era correcta (1200x630);
 * lo que faltaba eran las medidas.
 *
 * Regla: cualquier `generateMetadata()` que declare `images` apuntando a una
 * ruta `opengraph-image` DEBE pasarla por aquí. Si no declara `images`, no lo
 * toques — Next ya inyecta las etiquetas completas solo.
 *
 * El tamaño es constante porque TODAS las rutas `opengraph-image.tsx` del repo
 * exportan `size = { width: 1200, height: 630 }` y `contentType = 'image/png'`.
 * Si alguna cambia, deja de usar este helper en esa página.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function ogImages(path: string) {
  return [{ url: path, ...OG_IMAGE_SIZE, type: 'image/png' }];
}

/** Atajo para la imagen OG genérica del locale (`/es/opengraph-image`). */
export function ogLocaleImages(locale: string) {
  return ogImages(`/${locale}/opengraph-image`);
}
