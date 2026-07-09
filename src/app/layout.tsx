import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces, JetBrains_Mono, Inter, DM_Sans } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import '@/styles/globals.css';
import { shouldNoIndex } from '@/lib/seo/noindex';

// Brand identity oficial (manual de marca PDF) replica la jerarquía de las
// publicaciones de redes sociales:
//   - Títulos display → Neue Haas Grotesk Display Pro (Adobe paid).
//     Substituto free más cercano: Inter (mismo carácter geométrico-grotesk,
//     misma altura-x, terminales rectas). Si se obtiene kit Adobe se swap en
//     una sola variable CSS (--font-heading).
//   - Cuerpo → Normalidad VF (Adobe paid).
//     Substituto free más cercano: DM Sans (humanist, mismas proporciones).
//   - Eyebrows / subtítulos → Space Grotesk Bold (ya incluida).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-text',
  weight: ['300', '400', '500', '700'],
});

// preload:false — fuentes de acento (eyebrows, italic editorial, mono de stats).
// NO son el LCP (el H1 usa --font-display=Inter). Quitarles el preload libera
// la ruta crítica en 4G: dejan de competir con Inter+DM Sans en el arranque y
// se cargan al usarse. El diseño no cambia; el swap es gradual y adjustFontFallback
// (default en next/font) evita CLS. PSI móvil 2026-06-26: bajar render-blocking del LCP.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

// Display serif italic — accent voz "humana / editorial" en heros y headlines.
// Solo italic 400/500 — usado para 1-2 palabras acentuadas, no body.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-fraunces',
  style: ['italic'],
  weight: ['400', '500'],
});

// Mono — data forward. Stats, números, indicadores, code-like markers.
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.propyte.com'),
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
  // Bloquea indexación en staging (dev.propyte.com) o cualquier deploy donde
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
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${jetBrainsMono.variable} ${dmSans.className}`}
    >
      {/* gtag se carga únicamente en <Analytics /> ([locale]/layout) con
          Consent Mode v2 — no duplicar aquí: una segunda config sin consent
          infla pageviews e ignora el banner de cookies. */}
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
