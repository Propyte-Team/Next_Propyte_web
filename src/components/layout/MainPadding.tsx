'use client';

import { usePathname } from 'next/navigation';
import { isDarkHeroRoute } from '@/shared/constants/dark-hero-routes';

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;

  // Listing archives — el header se reduce porque no hay burbuja, entonces
  // el padding-top también baja (de 80px a ~52px) para evitar el espacio
  // blanco horrible arriba.
  const isListingArchive = !!bare.match(/^\/(desarrollos|propiedades)\/?$/);

  // bg-dark detrás del padding-top → el área debajo del header transparente
  // coincide con el hero oscuro. Sin esto se veía un strip blanco.
  const isDarkHero = isDarkHeroRoute(pathname);
  const padTop = isListingArchive ? 'pt-[52px] lg:pt-[56px]' : 'pt-[76px] lg:pt-[80px]';

  return (
    <div className={`${padTop}${isDarkHero ? ' bg-[#0F1923]' : ''}`}>
      {children}
    </div>
  );
}
