'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// Barra fija de móvil. Solo móvil, y solo cuando el hero sale de vista:
// en el primer pliegue el formulario ya está en pantalla y la barra lo
// taparía. IntersectionObserver sobre `#hero`, no un umbral en píxeles.
// ============================================================

export default function BarraMovil({
  etiqueta,
  telefonoWhatsApp,
  mensajeWhatsApp,
  surface,
  href = '#solicitar',
}: {
  etiqueta: string;
  telefonoWhatsApp: string;
  mensajeWhatsApp: string;
  surface: string;
  href?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entrada]) => setVisible(!entrada.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const wa = `https://wa.me/${telefonoWhatsApp}?${new URLSearchParams({ text: mensajeWhatsApp }).toString()}`;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lpv-panel-line)] bg-[var(--lpv-panel-bg)] transition-transform duration-300 sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch gap-px">
        <a
          href={href}
          tabIndex={visible ? undefined : -1}
          className="flex min-h-[56px] flex-1 items-center justify-center bg-[var(--lpv-panel-accent)] px-4 text-center text-[0.875rem] font-semibold text-[var(--lpv-panel-on-accent)]"
        >
          {etiqueta}
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? undefined : -1}
          onClick={() => trackWhatsAppClick({ surface })}
          aria-label="Escribir por WhatsApp"
          className="flex min-h-[56px] w-[68px] shrink-0 items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" style={{ color: 'var(--lpv-wa)' }} aria-hidden />
        </a>
      </div>
    </div>
  );
}
