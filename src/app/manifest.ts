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
    // Activos cuadrados dedicados para instalación en móvil (192x192 y
    // 512x512, fondo sólido #0F1923 — Apple/Android no recomiendan
    // transparencia en estos íconos), separados de `/icon.png` y
    // `/apple-icon.png` (que siguen la convención de Next para el favicon de
    // pestaña y el apple-touch-icon respectivamente).
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
