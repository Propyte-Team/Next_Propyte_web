'use client';

import { usePathname } from 'next/navigation';

export default function MainPadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  const isHome = bare === '/' || bare === '';
  if (isHome) return <>{children}</>;
  return <div className="pt-[76px] lg:pt-[80px]">{children}</div>;
}
