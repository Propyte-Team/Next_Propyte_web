import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces, JetBrains_Mono, Inter, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import '@/styles/globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-H4VD5TVEKM';

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

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

// Display serif italic — accent voz "humana / editorial" en heros y headlines.
// Solo italic 400/500 — usado para 1-2 palabras acentuadas, no body.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  style: ['italic'],
  weight: ['400', '500'],
});

// Mono — data forward. Stats, números, indicadores, code-like markers.
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // <html lang="es"> is the default; the locale-specific layout sets a
  // dynamic lang via a client-side useEffect (Header component) so it
  // updates when the user toggles ES↔EN without a full page reload.
  return (
    <html
      lang="es"
      className={`${inter.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${jetBrainsMono.variable} ${dmSans.className}`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
