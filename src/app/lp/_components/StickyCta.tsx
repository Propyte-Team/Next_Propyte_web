'use client';

import { useEffect, useState } from 'react';

// ============================================================
// Barra de CTA fija en móvil.
//
// PRECIO TOTAL PRIMERO. Antes mostraba solo la mensualidad: «$10,280 al mes»
// sin el precio al lado es el patrón visual de la financiera agresiva, que es
// exactamente la percepción que esta página existe para combatir. La
// mensualidad sigue —es la cifra de mayor palanca del segmento— pero
// subordinada al total, no en su lugar.
//
// UN SOLO CTA. El WhatsApp de la barra era el cuarto de la página y en 390px
// dos destinos compitiendo en 48px de alto es fricción, no elección. WhatsApp
// sigue disponible en el hero y en el cierre.
//
// APARECE Y DESAPARECE. Antes estaba fija desde el primer píxel, tapando el
// hero justo cuando el hero hace su trabajo. Ahora entra pasado el 20% del
// scroll y se retira cuando `#solicitar` está a la vista: mientras el
// formulario es visible, una barra que apunta al formulario solo estorba —y en
// 390px llegaba a solaparse con sus propios campos.
// ============================================================

export default function StickyCta({
  precioTotal,
  mensualidad,
}: {
  precioTotal: string | null;
  mensualidad: string | null;
}) {
  const [visible, setVisible] = useState(false);
  const [formularioALaVista, setFormularioALaVista] = useState(false);

  useEffect(() => {
    const alHacerScroll = () => {
      const alcanzable = document.documentElement.scrollHeight - window.innerHeight;
      // Guarda para páginas cortas: sin ella, 0/0 = NaN y la barra no sale nunca.
      setVisible(alcanzable > 0 && window.scrollY / alcanzable > 0.2);
    };
    alHacerScroll();
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    return () => window.removeEventListener('scroll', alHacerScroll);
  }, []);

  useEffect(() => {
    const destino = document.getElementById('solicitar');
    if (!destino) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setFormularioALaVista(entrada.isIntersecting),
      // Un pelo de margen: la barra se va justo ANTES de que el formulario
      // asome bajo ella, no cuando ya lo está tapando.
      { rootMargin: '0px 0px -96px 0px' },
    );
    observador.observe(destino);
    return () => observador.disconnect();
  }, []);

  const mostrar = visible && !formularioALaVista;

  return (
    <div
      // `hidden` en vez de desmontar: el lector de pantalla no anuncia una barra
      // que aparece y desaparece con el scroll, y la transición puede correr.
      aria-hidden={!mostrar}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-[var(--lp-line)] bg-[var(--lp-paper)]/95 backdrop-blur transition-transform duration-300 supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden ${
        mostrar ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          {precioTotal && (
            <p className="lp-num truncate text-base leading-tight text-[var(--lp-ink)]">
              {precioTotal}
            </p>
          )}
          {mensualidad && (
            <p className="lp-num truncate text-xs leading-tight text-[var(--lp-muted)]">
              {mensualidad} al mes
            </p>
          )}
        </div>

        <a
          href="#solicitar"
          // Ancla real, no botón con scrollIntoView: funciona sin JS y el foco
          // aterriza en el formulario. Tap target de 48px con padding real.
          tabIndex={mostrar ? undefined : -1}
          className="inline-flex min-h-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--lp-r-control)] bg-[var(--lp-accent)] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--lp-accent-strong)]"
        >
          {mensualidad ? 'Ver mi plan' : 'Pedir el detalle'}
        </a>
      </div>
    </div>
  );
}
