'use client';

import { usePathname } from 'next/navigation';

// Routes whose hero section uses a dark (#0F1923) background.
// The padding div must match so the body's white background doesn't bleed through.
const DARK_HERO_ROUTES = ['/unete', '/corredores', '/reclutamiento', '/built'];

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;
  const isDarkHero = DARK_HERO_ROUTES.some((r) => bare.startsWith(r));
  return (
    <div className={`pt-[76px] lg:pt-[80px]${isDarkHero ? ' bg-[#0F1923]' : ''}`}>
      {children}
    </div>
  );
}
