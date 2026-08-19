'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Mejora progresiva puramente cosmética sobre BlogFilterBar (Server Component
 * sin JS por crawlability — ver su comentario de cabecera). Si este script no
 * carga o no ejecuta, los <details>/<a href> de abajo siguen funcionando
 * exactamente igual para un usuario o un rastreador sin JS; esto solo pule la
 * experiencia cuando SÍ hay JS:
 *  - Cierra los popovers en cuanto se elige una opción (no espera a que
 *    termine la navegación) y les da feedback visual inmediato.
 *  - Red de seguridad: los vuelve a cerrar cuando la URL efectivamente cambió
 *    (cubre atrás/adelante del navegador). Necesaria porque en una navegación
 *    de Next.js el nodo <details> puede sobrevivir el re-render (mismo tipo,
 *    misma posición) y quedarse con `open` pegado aunque el filtro ya se
 *    aplicó.
 *  - Exclusión mutua entre popovers: al abrir uno, cierra los demás. El
 *    atributo `name` nativo en el <details> ya hace esto sin JS en Chrome
 *    120+/Safari 17.2+; esto cubre el resto del browserslist del proyecto
 *    (chrome>=111, safari>=15.4).
 *  - Cierre con click afuera y con Escape.
 */
export default function BlogFilterEnhancer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>('details[data-blog-filter]').forEach((d) => {
      d.open = false;
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const getDetails = () =>
      Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-blog-filter]'));

    const onToggle = (e: Event) => {
      const opened = e.currentTarget as HTMLDetailsElement;
      if (!opened.open) return;
      getDetails().forEach((d) => {
        if (d !== opened) d.open = false;
      });
    };

    const onDocClick = (e: MouseEvent) => {
      const optionLink = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-blog-filter-option]');
      if (optionLink) {
        // Feedback visible antes de que la navegación termine, y cierre
        // inmediato en vez de esperar a que cambie la URL.
        optionLink.style.opacity = '0.5';
        optionLink.closest<HTMLDetailsElement>('details[data-blog-filter]')?.removeAttribute('open');
        return;
      }
      getDetails().forEach((d) => {
        if (d.open && !d.contains(e.target as Node)) d.open = false;
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') getDetails().forEach((d) => { d.open = false; });
    };

    const details = getDetails();
    details.forEach((d) => d.addEventListener('toggle', onToggle));
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      details.forEach((d) => d.removeEventListener('toggle', onToggle));
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
