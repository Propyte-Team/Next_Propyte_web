import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Propyte',
    default: 'Propyte — Real estate en modo inteligente',
  },
  description: 'Real estate, powered by intelligence. La plataforma inmobiliaria mas inteligente de la Riviera Maya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={spaceGrotesk.className}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
