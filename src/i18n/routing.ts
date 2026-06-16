import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  // propyte.com (raíz) siempre va a /es, sin importar el Accept-Language del
  // navegador. Sin esto, next-intl detecta el idioma y manda a /en a visitantes
  // con navegador en inglés. El usuario puede cambiar a /en manualmente.
  localeDetection: false,
});
