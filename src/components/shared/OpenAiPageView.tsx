'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { oaiqPageViewed } from '@/lib/analytics/openai-ads';

/**
 * `page_viewed` de OpenAI Ads en cada navegación de cliente. No renderiza nada.
 *
 * El SDK de oaiq no observa el History API: sin esto, una sesión entera de
 * navegación con el App Router contaría UNA sola vista, la de la carga inicial.
 *
 * La primera ruta NO se cuenta aquí: esa vista ya la dispara el script inline
 * de <Analytics />, que es el único punto donde el orden respecto al `init`
 * está garantizado.
 *
 * El guard es "última ruta medida", no un booleano de primer render: con
 * `reactStrictMode` el efecto se monta dos veces en desarrollo y un booleano
 * dejaría pasar la segunda pasada como si fuera una navegación real.
 */
export default function OpenAiPageView() {
  const pathname = usePathname();
  const lastMeasured = useRef<string | null>(null);

  useEffect(() => {
    if (lastMeasured.current === null) {
      lastMeasured.current = pathname;
      return;
    }
    if (lastMeasured.current === pathname) return;
    lastMeasured.current = pathname;
    oaiqPageViewed(pathname);
  }, [pathname]);

  return null;
}
