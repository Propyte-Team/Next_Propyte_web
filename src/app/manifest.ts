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
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
