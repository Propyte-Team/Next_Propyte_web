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
    // Optimizer RE-ACTIVADO 2026-06-26 (perf). `unoptimized:true` se puso en
    // 2026-04-21 (commit e8e3609) SOLO para no consumir el límite de Image
    // Optimization del plan free de Vercel cuando dev.propyte.com vivía ahí.
    // Vercel staging se eliminó (2026-06-17); prod es Hostinger standalone con
    // `sharp 0.34` instalado → el optimizer de Next funciona nativo. Tenerlo
    // apagado servía cada foto a tamaño/peso completo (PSI móvil 2026-06-26:
    // LCP 6.8s, -2.6MB de ahorro en imágenes, payload 4MB).
    // Kill-switch: si el optimizer fallara en Hostinger, exportar
    // NEXT_PUBLIC_DISABLE_IMAGE_OPT=true en el panel + rebuild para revertir.
    unoptimized: process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPT === 'true',
    formats: ['image/avif', 'image/webp'],
    // Cache de 31 días para los assets optimizados (atiende "Usar tiempos de
    // vida de caché eficientes" del PSI en las imágenes servidas por /_next/image).
    minimumCacheTTL: 2_678_400,
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
      // (Normalización de slugs de zona con acento → sin acento se maneja en
      //  zonas/[slug]/page.tsx con permanentRedirect: next.config no matchea no-ASCII.)
      // Rename /corredores → /brokers (2026-06): 301 locale-aware + bare slug.
      { source: '/:locale/corredores',      destination: '/:locale/brokers',           permanent: true },
      { source: '/corredores',              destination: '/es/brokers',                permanent: true },
      { source: '/corredores/',             destination: '/es/brokers',                permanent: true },
      // ── WP legacy slug → Next.js 301s (protege SEO y links viejos) ───────
      { source: '/unidades',                destination: '/es/propiedades',            permanent: true },
      { source: '/unidades/',               destination: '/es/propiedades',            permanent: true },
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
    const isProd = process.env.NODE_ENV === 'production';

    // En prod DENY-amos framing (frame-ancestors 'self' en CSP ya lo cubre, pero
    // XFO sigue siendo útil para clientes que no respetan CSP). En dev usamos
    // SAMEORIGIN para que el Design Playground pueda embeber páginas en iframe.
    const xFrameOptions = isProd ? 'DENY' : 'SAMEORIGIN';

    // CSP shipped as Report-Only first so violations surface in the browser
    // console without blocking. Flip the header key to 'Content-Security-Policy'
    // (drop "-Report-Only") once dev.propyte.com has been validated.
    //
    // Hardening 2026-05-25 (Cyber Neo audit):
    //   - removed 'unsafe-eval' from script-src (Next.js 15+ prod builds no longer require it).
    //   - tightened media-src from `https:` to explicit allowlist.
    //   - frame-ancestors 'none' in prod for additional clickjacking defense.
    // 'unsafe-inline' on script-src is still required until we migrate to
    // nonce-based scripts via middleware (planned uplift).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://*.hotjar.com https://connect.facebook.net https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com https://drive.google.com https://img.youtube.com https://i.ytimg.com https://maps.gstatic.com https://maps.googleapis.com https://www.facebook.com https://www.google-analytics.com https://*.hotjar.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.hotjar.com wss://*.hotjar.com https://stats.g.doubleclick.net https://maps.googleapis.com",
      "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://calendly.com",
      "media-src 'self' https://*.supabase.co https://*.youtube.com https://*.youtube-nocookie.com https://drive.google.com data: blob:",
      "worker-src 'self' blob:",
      isProd ? "frame-ancestors 'none'" : "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    // Staging (dev.propyte.com) o cualquier deploy con NEXT_PUBLIC_NOINDEX=true:
    // emitir X-Robots-Tag a nivel de respuesta HTTP. Es la señal más fuerte
    // para Google (más que <meta>), y aplica también a respuestas no-HTML
    // (sitemap.xml, JSON, etc.). Una vez desindexado, retirar la env var
    // restaura el comportamiento de producción.
    const isNoIndex =
      process.env.NEXT_PUBLIC_NOINDEX === 'true' ||
      (() => {
        const u = process.env.NEXT_PUBLIC_SITE_URL;
        if (!u) return false;
        try {
          const host = new URL(u).host.toLowerCase();
          return host !== 'propyte.com' && host !== 'www.propyte.com';
        } catch {
          return false;
        }
      })();

    const baseHeaders = [
      { key: 'X-Frame-Options', value: xFrameOptions },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=()' },
      { key: 'Content-Security-Policy-Report-Only', value: csp },
    ];

    if (isNoIndex) {
      baseHeaders.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' });
    }

    return [
      {
        source: '/:path*',
        headers: baseHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
