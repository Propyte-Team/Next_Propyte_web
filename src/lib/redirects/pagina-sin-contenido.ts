/**
 * Cuerpo HTML para las respuestas 404 y 410 que emite el middleware.
 *
 * ── Por qué el middleware sirve su propio HTML ─────────────────────────────────
 * El status correcto solo se puede fijar antes de que empiece el streaming, y la
 * cadena de `loading.tsx` compromete el 200 antes de que corra el componente de
 * página. Por eso estas respuestas nacen y mueren en el middleware.
 *
 * Y por eso no pueden ser `text/plain`: quien llega desde un enlace viejo o desde
 * Google es una persona, y merece una salida hacia el catálogo en vez de la
 * palabra "Gone" sobre fondo blanco. Sin assets externos —ni fuentes, ni CSS, ni
 * imágenes— para que no dependa de nada que el edge no tenga a mano.
 */
export type StatusSinPagina = 404 | 410;

type Copy = { titulo: string; cuerpo: string; alCatalogo: string; alInicio: string };

const COPY: Record<'es' | 'en', Record<StatusSinPagina, Copy>> = {
  es: {
    404: {
      titulo: 'Esta página no está disponible',
      cuerpo: 'La propiedad o el desarrollo que buscas no está publicado en este momento.',
      alCatalogo: 'Ver desarrollos disponibles',
      alInicio: 'Ir al inicio',
    },
    410: {
      titulo: 'Esta página ya no existe',
      cuerpo: 'El contenido que buscas se retiró de forma permanente.',
      alCatalogo: 'Ver desarrollos disponibles',
      alInicio: 'Ir al inicio',
    },
  },
  en: {
    404: {
      titulo: 'This page is not available',
      cuerpo: 'The property or development you are looking for is not currently published.',
      alCatalogo: 'Browse available developments',
      alInicio: 'Go to homepage',
    },
    410: {
      titulo: 'This page no longer exists',
      cuerpo: 'The content you are looking for has been permanently removed.',
      alCatalogo: 'Browse available developments',
      alInicio: 'Go to homepage',
    },
  },
};

/** Un slug de sección viene de la URL: hay que escaparlo antes de meterlo al HTML. */
function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function paginaSinContenido(opts: {
  status: StatusSinPagina;
  locale: string;
  seccion: string;
}): string {
  const locale = opts.locale === 'en' ? 'en' : 'es';
  const copy = COPY[locale][opts.status];
  const seccion = escaparHtml(opts.seccion);
  const loc = escaparHtml(locale);

  return `<!doctype html>
<html lang="${loc}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Explícito además del status: el status es la señal, esto es el cinturón. -->
<meta name="robots" content="noindex, follow">
<title>${escaparHtml(copy.titulo)} · Propyte</title>
<style>
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: #fbfaf8; color: #1c1917; line-height: 1.6;
}
main { max-width: 32rem; text-align: center; }
h1 { margin: 0 0 .75rem; font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 600; letter-spacing: -.01em; }
p { margin: 0 0 2rem; color: #57534e; }
.acciones { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
a {
  display: inline-block; padding: .7rem 1.25rem; border-radius: .5rem;
  text-decoration: none; font-weight: 500; font-size: .95rem;
}
.primario { background: #1c1917; color: #fbfaf8; }
.secundario { border: 1px solid #d6d3d1; color: #1c1917; }
@media (prefers-color-scheme: dark) {
  body { background: #1c1917; color: #fafaf9; }
  p { color: #a8a29e; }
  .primario { background: #fafaf9; color: #1c1917; }
  .secundario { border-color: #44403c; color: #fafaf9; }
}
</style>
</head>
<body>
<main>
<h1>${escaparHtml(copy.titulo)}</h1>
<p>${escaparHtml(copy.cuerpo)}</p>
<div class="acciones">
<a class="primario" href="/${loc}/${seccion}">${escaparHtml(copy.alCatalogo)}</a>
<a class="secundario" href="/${loc}">${escaparHtml(copy.alInicio)}</a>
</div>
</main>
</body>
</html>`;
}
