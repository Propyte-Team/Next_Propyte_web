import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import '@/styles/globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-H4VD5TVEKM';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
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
    <html lang="es" className={spaceGrotesk.className}>
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
