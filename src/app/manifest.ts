import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Propyte — Real estate en modo inteligente',
    short_name: 'Propyte',
    description: 'La plataforma inmobiliaria más inteligente de la Riviera Maya.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F1923',
    theme_color: '#5CE0D2',
    // Las rutas llevan extensión: los convenciones de archivo de App Router
    // (`app/icon.png`, `app/apple-icon.png`) se sirven en `/icon.png` y
    // `/apple-icon.png`. Sin la extensión el manifest pedía `/apple-icon` y el
    // navegador cobraba un 404 en cada carga de página.
    //
    // `sizes` declara la dimensión REAL de los archivos (698x699, los dos son
    // el mismo activo). Antes decían 32x32 y 180x180, que era falso: con eso el
    // navegador elige el icono equivocado creyendo que tiene dos resoluciones
    // distintas donde solo hay una. Pendiente de diseño: activos cuadrados de
    // verdad (180x180 y 512x512) para instalación en móvil.
    icons: [
      {
        src: '/icon.png',
        sizes: '698x699',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '698x699',
        type: 'image/png',
      },
    ],
  };
}
