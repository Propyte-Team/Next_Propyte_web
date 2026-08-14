'use client';

import { usePathname } from 'next/navigation';
import { isDarkHeroRoute } from '@/shared/constants/dark-hero-routes';

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;

  // Listing archives — el header se reduce porque no hay burbuja, entonces
  // el padding-top también baja para evitar el espacio blanco horrible arriba.
  const isListingArchive = !!bare.match(/^\/(desarrollos|propiedades)\/?$/);

  // bg-dark detrás del padding-top → el área debajo del header transparente
  // coincide con el hero oscuro. Sin esto se veía un strip blanco.
  const isDarkHero = isDarkHeroRoute(pathname);
  // Valores mobile recalculados según el alto real de MobileHeader.tsx:
  // fila 1 = pt-5 (20px) + min-h-[44px] = 64px.
  // fila 2 (burbuja) = pt-2 (8px) + h-11 (44px) + pb-1.5 (6px) = 58px extra.
  // Sin burbuja (listing archives) el header mide 64px; con burbuja, 122px.
  const padTop = isListingArchive ? 'pt-[64px] lg:pt-[56px]' : 'pt-[122px] lg:pt-[80px]';

  return (
    <div className={`${padTop}${isDarkHero ? ' bg-[#0F1923]' : ''}`}>
      {children}
    </div>
  );
}
