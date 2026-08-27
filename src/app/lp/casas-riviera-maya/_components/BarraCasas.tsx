'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// Barra fija de móvil. Solo móvil, y solo después del primer pliegue.
//
// POR QUÉ NO ESTÁ DESDE EL PRINCIPIO: en el primer pliegue el formulario del
// hero ya está en pantalla, así que la barra taparía parte del formulario al
// que quiere mandar. Aparece cuando el hero sale de vista, que es el momento
// en que el visitante está explorando la cuadrícula y ya no tiene un campo de
// texto delante.
//
// POR QUÉ NO EN ESCRITORIO: el formulario del cierre es `sticky` en su columna
// y acompaña el scroll. Una barra fija además sería la tercera vez que la
// misma acción ocupa espacio en la misma pantalla.
//
// Detecta con IntersectionObserver sobre el hero, no con un umbral de
// `scrollY` en píxeles: el alto del hero cambia con el ancho del dispositivo y
// un número fijo acierta en un iPhone y falla en un iPad.
// ============================================================

export default function BarraCasas({
  telefonoWhatsApp,
  totalCasas,
}: {
  telefonoWhatsApp: string;
  totalCasas: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entrada]) => setVisible(!entrada.isIntersecting),
      // 0.15: la barra entra cuando queda menos del 15% del hero a la vista,
      // no cuando desaparece el último pixel. Sin el margen, el usuario pasa
      // por una franja de scroll sin ninguna llamada a la acción.
      { threshold: 0.15 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const href = `https://wa.me/${telefonoWhatsApp}?${new URLSearchParams({
    text: 'Hola, vi las casas de la Riviera Maya en su página. ¿Me pasan precios y disponibilidad?',
  }).toString()}`;

  return (
    <div
      // `aria-hidden` cuando está oculta: sin esto el lector de pantalla anuncia
      // dos CTA fantasma que no están en pantalla.
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lpc-line-dark)] bg-[var(--lpc-dark)] transition-transform duration-300 sm:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch gap-px">
        <a
          href="#solicitar"
          tabIndex={visible ? undefined : -1}
          className="flex min-h-[56px] flex-1 items-center justify-center bg-[var(--lpc-on-dark)] px-4 text-center text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-[var(--lpc-ink)]"
        >
          Ver precios de las {totalCasas}
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? undefined : -1}
          onClick={() => trackWhatsAppClick({ surface: 'lp_casas_barra_movil' })}
          aria-label="Escribir por WhatsApp"
          className="flex min-h-[56px] w-[68px] shrink-0 items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" style={{ color: 'var(--lpc-wa)' }} aria-hidden />
        </a>
      </div>
    </div>
  );
}
