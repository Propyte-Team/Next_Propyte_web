'use client';

import { usePathname } from 'next/navigation';
import { isDarkHeroRoute } from '@/shared/constants/dark-hero-routes';

// Alto de reserva antes de que el JS de Header.tsx mida el header real y
// publique --mobile-header-height / --desktop-header-height (ver
// useCssHeightVar). Son solo un piso de seguridad para el primer paint /
// sin-JS — nunca deben quedar en 0 para evitar que el contenido quede
// pegado a la barra de arriba. El valor real siempre gana en cuanto React
// hidrata, así que no hace falta mantenerlos sincronizados a mano con
// MobileHeader.tsx.
const PAD_TOP = 'pt-[var(--mobile-header-height,_122px)] lg:pt-[var(--desktop-header-height,_80px)]';

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;

  // bg-dark detrás del padding-top → el área debajo del header transparente
  // coincide con el hero oscuro. Sin esto se veía un strip blanco.
  const isDarkHero = isDarkHeroRoute(pathname);

  return (
    <div className={`${PAD_TOP}${isDarkHero ? ' bg-[#0F1923]' : ''}`}>
      {children}
    </div>
  );
}
