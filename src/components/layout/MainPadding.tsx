'use client';

import { usePathname } from 'next/navigation';

// Routes whose hero section uses a dark (#0F1923) background.
// The padding div must match so the body's white background doesn't bleed through.
const DARK_HERO_ROUTES = ['/unete', '/corredores', '/reclutamiento', '/built', '/nosotros', '/blog'];

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;

  // Listing archives — el header se reduce porque no hay burbuja, entonces
  // el padding-top también baja (de 80px a ~52px) para evitar el espacio
  // blanco horrible arriba.
  const isListingArchive = !!bare.match(/^\/(desarrollos|propiedades)\/?$/);

  const isDarkHero = DARK_HERO_ROUTES.some((r) => bare.startsWith(r));
  const padTop = isListingArchive ? 'pt-[52px] lg:pt-[56px]' : 'pt-[76px] lg:pt-[80px]';

  return (
    <div className={`${padTop}${isDarkHero ? ' bg-[#0F1923]' : ''}`}>
      {children}
    </div>
  );
}
