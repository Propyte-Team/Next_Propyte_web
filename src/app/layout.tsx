import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import { shouldNoIndex } from '@/lib/seo/noindex';

// Fuentes AUTOALOJADAS (src/fonts/), no next/font/google: este pedía las
// fuentes a Google en cada build del VPS y el 2026-10-14 dos deploys murieron
// porque Google devolvió una URL sin extensión. Son los mismos .woff2 (subset
// latin) que servía next/font/google — ver scripts/descargar-fuentes.mjs.
// Un archivo variable declarado peso a peso replica las caras discretas del
// CSS de Google: un peso intermedio (450) cae al mismo sitio que antes.
// El `font-family` explícito es el nombre que daba Google. Next 16 no hashea
// los nombres: sin él la familia se llamaría como la variable JS (`inter`,
// `sans`…), dos landings con `const sans` chocarían, y el canvas de
// ShareDownloadModal, que pide "Space Grotesk" por nombre, no la encontraría.
//
// Brand identity oficial (manual de marca PDF): titulares en Neue Haas Grotesk
// Display Pro y texto en Normalidad VF (ambas Adobe, de pago). Rediseño v3
// (2026-10, propuesta aprobada en Figma "Propuesta v3"): sustitutos libres
// Archivo (titulares) y Hanken Grotesk (texto). Con kit de Adobe el cambio vuelve
// a ser de una sola variable (--font-display / --font-text).
//   - Eyebrows / subtítulos → Space Grotesk Bold (ya incluida).
const archivo = localFont({
  src: [
    { path: '../fonts/archivo-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/archivo-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/archivo-latin.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/archivo-latin.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  declarations: [{ prop: 'font-family', value: 'Archivo' }],
  variable: '--font-display',
});

const hanken = localFont({
  src: [
    { path: '../fonts/hanken-grotesk-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/hanken-grotesk-latin.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  declarations: [{ prop: 'font-family', value: 'Hanken Grotesk' }],
  variable: '--font-text',
});

// preload:false — fuentes de acento (eyebrows, italic editorial, mono de stats).
// NO son el LCP (el H1 usa --font-display=Inter). Quitarles el preload libera
// la ruta crítica en 4G: dejan de competir con Inter+DM Sans en el arranque y
// se cargan al usarse. El diseño no cambia; el swap es gradual y adjustFontFallback
// (default en next/font) evita CLS. PSI móvil 2026-06-26: bajar render-blocking del LCP.
const spaceGrotesk = localFont({
  src: [
    { path: '../fonts/space-grotesk-latin.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/space-grotesk-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/space-grotesk-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/space-grotesk-latin.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/space-grotesk-latin.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'font-family', value: 'Space Grotesk' }],
  variable: '--font-space-grotesk',
});

// Display serif italic — accent voz "humana / editorial" en heros y headlines.
// Solo italic 400/500 — usado para 1-2 palabras acentuadas, no body.
// Serif: su fallback métrico es Times New Roman, como lo elegía next/font/google.
const fraunces = localFont({
  src: [
    { path: '../fonts/fraunces-latin-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/fraunces-latin-italic.woff2', weight: '500', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
  declarations: [{ prop: 'font-family', value: 'Fraunces' }],
  variable: '--font-fraunces',
});

// Mono — data forward. Stats, números, indicadores, code-like markers.
const jetBrainsMono = localFont({
  src: [
    { path: '../fonts/jetbrains-mono-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/jetbrains-mono-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/jetbrains-mono-latin.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'font-family', value: 'JetBrains Mono' }],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com'),
  title: {
    template: '%s | Propyte',
    default: 'Propyte — Real estate en modo inteligente',
  },
  description: 'Real estate, powered by intelligence. La plataforma inmobiliaria mas inteligente de la Riviera Maya.',
  applicationName: 'Propyte',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Propyte',
    locale: 'es_MX',
    alternateLocale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
  // Bloquea indexación en cualquier deploy no productivo donde
  // NEXT_PUBLIC_NOINDEX=true. En producción (propyte.com) queda undefined y
  // los crawlers usan su comportamiento default (indexable).
  ...(shouldNoIndex()
    ? {
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        },
      }
    : {}),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <html lang> resolved from the current request's locale (next-intl v4,
  // plugin-injected request config in src/i18n/request.ts). Works here even
  // though this layout sits above the [locale] segment: the withNextIntl
  // plugin populates the request-scoped locale for the whole RSC tree, not
  // just descendants of [locale]/layout.tsx.
  // <html lang> estático: getLocale() aquí lee headers() → convierte TODO el
  // sitio en dinámico (mata prerender/ISR; causó los 500 DYNAMIC_SERVER_USAGE
  // en detalle de zonas/desarrollos/propiedades jul-2026). next/root-params no
  // aplica (el root layout está arriba de [locale]). El lang correcto por
  // locale lo fija un <script> inline en [locale]/layout.tsx antes de la
  // hidratación; suppressHydrationWarning cubre el atributo mutado.
  // Follow-up definitivo: mover <html>/<body> a [locale]/layout (root layout
  // canónico de next-intl) y usar el param directo.
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${archivo.variable} ${hanken.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${jetBrainsMono.variable} ${hanken.className}`}
    >
      <head>
        {/* WebMCP origin trial (propyte.com + subdominios). Habilita
            document.modelContext en Chrome sin flag para usuarios reales.
            Token PÚBLICO (no secreto). Vence 16-nov-2026 / Chrome ≤156 →
            renovar en developer.chrome.com/origintrials antes de esa fecha.
            ⚠️ REGLA CRÍTICA: nunca repetir un `toolname` en la misma página ni
            dejar `toolparamdescription` sin `toolname` padre → tumba el renderer
            (RESULT_CODE_KILLED_BAD_MESSAGE). Los forms que se renderizan 2x
            (móvil/desktop) usan `registerTool={false}` en la copia extra para
            quedar 100% invisibles a WebMCP (ver BlogSidebarForm). */}
        <meta
          httpEquiv="origin-trial"
          content="AqdaYPcrqwtNCugX/MOjAYDWrtQClCxlDzbPI006D4avRnuzVeh4lDLB0xo56RDleP/KBhashWYw59ztzxZLywsAAABeeyJvcmlnaW4iOiJodHRwczovL3Byb3B5dGUuY29tOjQ0MyIsImZlYXR1cmUiOiJXZWJNQ1AiLCJleHBpcnkiOjE3OTQ4NzM2MDAsImlzU3ViZG9tYWluIjp0cnVlfQ=="
        />
      </head>
      {/* gtag se carga únicamente en <Analytics /> ([locale]/layout) con
          Consent Mode v2 — no duplicar aquí: una segunda config sin consent
          infla pageviews e ignora el banner de cookies. */}
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
