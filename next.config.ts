import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      // YouTube thumbnails para VideoPlayer (componente property/VideoPlayer.tsx)
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  async redirects() {
    return [
      // ── Existing locale-aware redirects ──────────────────────────────────
      {
        source: '/:locale/rentas',
        destination: '/:locale/mercado?tab=tradicional',
        permanent: true,
      },
      // ── WP legacy slug → Next.js 301s (protege SEO y links viejos) ───────
      { source: '/unidades',                destination: '/es/propiedades',            permanent: true },
      { source: '/unidades/',               destination: '/es/propiedades',            permanent: true },
      { source: '/brokers',                 destination: '/es/corredores',             permanent: true },
      { source: '/brokers/',                destination: '/es/corredores',             permanent: true },
      { source: '/reclutamiento',           destination: '/es/unete',                  permanent: true },
      { source: '/reclutamiento/',          destination: '/es/unete',                  permanent: true },
      { source: '/faqs',                    destination: '/es/faq',                    permanent: true },
      { source: '/faqs/',                   destination: '/es/faq',                    permanent: true },
      { source: '/aviso-de-privacidad',     destination: '/es/privacidad',             permanent: true },
      { source: '/aviso-de-privacidad/',    destination: '/es/privacidad',             permanent: true },
      { source: '/terminos-y-condiciones',  destination: '/es/terminos',               permanent: true },
      { source: '/terminos-y-condiciones/', destination: '/es/terminos',               permanent: true },
      { source: '/nosotros',                destination: '/es/nosotros/quienes-somos', permanent: true },
      { source: '/nosotros/',               destination: '/es/nosotros/quienes-somos', permanent: true },
      // N1: /locale/nosotros sin sub-ruta → quienes-somos
      { source: '/:locale/nosotros',        destination: '/:locale/nosotros/quienes-somos', permanent: true },
    ];
  },
  async headers() {
    // SAMEORIGIN allows the Design Playground (same origin) to embed pages in
    // its iframe. DENY would block it. In production the playground is gated
    // behind NODE_ENV / NEXT_PUBLIC_ENABLE_PLAYGROUND, so SAMEORIGIN is fine.
    const xFrameOptions = 'SAMEORIGIN';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: xFrameOptions },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
