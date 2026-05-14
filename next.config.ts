import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Fuerza inclusión de los helpers SWC en el output standalone. Sin esto, el
  // tree-shaking de Next.js 16 omite `_interop_require_default.js` y rutas
  // que lo necesitan en runtime fallan con 500 (incident 2026-05-14).
  outputFileTracingIncludes: {
    '/*': ['./node_modules/@swc/helpers/esm/**/*'],
  },
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
      // /equipo (slug corto que existió temporalmente en B4.4) → subpágina canónica
      // bajo /nosotros. Decisión 2026-05-12: el equipo es subpágina de "Nosotros".
      { source: '/:locale/equipo', destination: '/:locale/nosotros/equipo-comercial', permanent: true },
    ];
  },
  async headers() {
    // SAMEORIGIN allows the Design Playground (same origin) to embed pages in
    // its iframe. DENY would block it. In production the playground is gated
    // behind NODE_ENV / NEXT_PUBLIC_ENABLE_PLAYGROUND, so SAMEORIGIN is fine.
    const xFrameOptions = 'SAMEORIGIN';

    // CSP shipped as Report-Only first so violations surface in the browser
    // console without blocking. Flip the header key to 'Content-Security-Policy'
    // (drop "-Report-Only") once dev.propyte.com has been validated.
    // 'unsafe-inline' on script-src is required for Next.js bootstrap + JSON-LD
    // until we move to nonce-based scripts.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://*.hotjar.com https://connect.facebook.net https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com https://drive.google.com https://img.youtube.com https://i.ytimg.com https://maps.gstatic.com https://maps.googleapis.com https://www.facebook.com https://www.google-analytics.com https://*.hotjar.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.hotjar.com wss://*.hotjar.com https://stats.g.doubleclick.net https://maps.googleapis.com",
      "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://calendly.com",
      "media-src 'self' https: data: blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: xFrameOptions },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=()' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
