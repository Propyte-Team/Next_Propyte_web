'use client';

import { useEffect, useState } from 'react';
import { CHANGED_EVENT, readConsent } from '@/lib/cookies/consent';

// ============================================================
// Barra fija de móvil. Existe por una razón medida: en un teléfono, el
// formulario del hero sale de pantalla a la primera pasada de scroll, y a
// partir de ahí la página no tiene ninguna vía de conversión a la vista.
//
// ═══ POR QUÉ ESPERA AL BANNER DE COOKIES ═══
//
// El `ConsentBannerLp` es `fixed bottom-0 z-50`. Una barra de CTA en la misma
// esquina se solapa con él, y eso YA PASÓ en la variante A: el banner tapaba
// los dos CTA del hero, en producción, sobre tráfico pagado. Aquí no se resuelve
// midiendo alturas —eso vuelve a romperse en cuanto el banner cambia de copy—
// sino por precedencia: mientras no haya una decisión de cookies, la barra no
// se monta. Una sola cosa fija abajo, siempre.
//
// El efecto secundario es deseable: quien ve la barra ya decidió sobre cookies,
// y si aceptó, su conversión sí va a llegar a Google Ads con atribución.
// ============================================================

export default function BarraMovil({
  mensualidadTexto,
}: {
  /** Ya formateada por el servidor: aquí no se hace aritmética de dinero. */
  mensualidadTexto: string | null;
}) {
  const [decidido, setDecidido] = useState(false);
  const [pasoElHero, setPasoElHero] = useState(false);

  useEffect(() => {
    const sincronizar = () => setDecidido(readConsent() !== null);
    sincronizar();
    window.addEventListener(CHANGED_EVENT, sincronizar);
    return () => window.removeEventListener(CHANGED_EVENT, sincronizar);
  }, []);

  useEffect(() => {
    // Sentinela en vez de un umbral en píxeles: el alto del hero cambia con el
    // viewport y un número fijo acierta en un teléfono y falla en el siguiente.
    const sentinela = document.getElementById('lpt-sentinela');
    if (!sentinela) return;
    const obs = new IntersectionObserver(
      ([entrada]) => setPasoElHero(!entrada.isIntersecting),
      { rootMargin: '0px' },
    );
    obs.observe(sentinela);
    return () => obs.disconnect();
  }, []);

  const visible = decidido && pasoElHero;

  return (
    <div
      // Se renderiza siempre y se oculta con transform: así no hay un montaje
      // que provoque salto de layout, y `aria-hidden` mantiene el orden de
      // lectura limpio mientras no aplica.
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-abismo)]/95 px-4 py-3 backdrop-blur-sm transition-transform duration-300 ease-out lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        {mensualidadTexto && (
          <p className="min-w-0 flex-1">
            <span className="lpt-cota block text-[0.625rem] uppercase tracking-[0.12em] text-[var(--lpt-claro-3)]">
              Desde
            </span>
            <span className="lpt-cota block truncate text-sm text-[var(--lpt-claro)]">
              {mensualidadTexto}
            </span>
          </p>
        )}
        <a
          href="#solicitud"
          tabIndex={visible ? undefined : -1}
          className="lpt-titular shrink-0 rounded-[var(--lpt-r)] bg-[var(--lpt-estaca)] px-5 py-3.5 text-[0.9375rem] text-[var(--lpt-tinta)]"
        >
          Ver mi plan
        </a>
      </div>
    </div>
  );
}
