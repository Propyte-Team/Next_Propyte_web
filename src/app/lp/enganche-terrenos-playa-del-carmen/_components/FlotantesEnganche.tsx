'use client';

import { useEffect, useState } from 'react';
import { CHANGED_EVENT, readConsent } from '@/lib/cookies/consent';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// Los dos elementos fijos: la burbuja de WhatsApp y la barra de móvil.
//
// ═══ POR QUÉ VIVEN EN EL MISMO ARCHIVO ═══
//
// Porque compiten por la misma esquina y la regla que los separa es una sola:
// abajo solo puede haber UNA cosa fija a la vez. En la landing de referencia la
// burbuja de WhatsApp flota abajo a la derecha en todos los tamaños; aquí eso
// choca con la barra de CTA de móvil, que es la vía de conversión que de verdad
// se mide. Así que la burbuja es de ESCRITORIO (`lg:`) y en móvil manda la
// barra. Si estuvieran en archivos distintos, la próxima persona añadiría la
// burbuja en móvil sin ver el conflicto.
//
// ═══ POR QUÉ LOS DOS ESPERAN AL BANNER DE COOKIES ═══
//
// `ConsentBannerLp` es `fixed bottom-0 z-50`. Ya pasó en la variante A, en
// producción y con tráfico pagado: el banner tapaba los dos CTA del hero. No se
// resuelve midiendo alturas —eso se rompe en cuanto cambia el copy del banner—
// sino por precedencia: mientras no haya decisión de cookies, no se monta nada
// más abajo.
//
// Efecto secundario deseable: quien ve la barra ya decidió sobre cookies, así
// que si aceptó, su conversión llega a Ads con atribución.
// ============================================================

export default function FlotantesEnganche({
  engancheTexto,
  whatsapp,
  mensajeWa,
  loteSlug,
}: {
  /** Ya formateado por el servidor: aquí no se hace aritmética de dinero. */
  engancheTexto: string | null;
  /** Dígitos puros para wa.me. */
  whatsapp: string;
  mensajeWa: string;
  loteSlug: string;
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
    // viewport, y un número fijo acierta en un teléfono y falla en el siguiente.
    const sentinela = document.getElementById('lpe-sentinela');
    if (!sentinela) return;
    const obs = new IntersectionObserver(
      ([entrada]) => setPasoElHero(!entrada.isIntersecting),
      { rootMargin: '0px' },
    );
    obs.observe(sentinela);
    return () => obs.disconnect();
  }, []);

  const visible = decidido && pasoElHero;

  const href =
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeWa)}`;

  return (
    <>
      {/* ── Burbuja de WhatsApp, solo escritorio ── */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-hidden={!decidido}
        tabIndex={decidido ? undefined : -1}
        onClick={() =>
          trackWhatsAppClick({
            surface: 'lp-enganche-pdc-burbuja',
            propertySlug: loteSlug,
          })
        }
        className={`fixed bottom-7 right-7 z-40 hidden h-14 w-14 place-items-center rounded-full bg-[var(--lpe-wa)] text-white shadow-[0_10px_30px_-8px_rgb(15_25_35/0.45)] transition-[transform,opacity] duration-300 hover:scale-105 lg:grid ${
          decidido ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <span className="sr-only">Escríbenos por WhatsApp</span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.26 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29Z" />
        </svg>
      </a>

      {/* ── Barra de móvil ──
          Se renderiza siempre y se oculta con transform: así no hay un montaje
          que provoque salto de layout, y `aria-hidden` deja limpio el orden de
          lectura mientras no aplica. */}
      <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lpe-linea)] bg-[var(--lpe-blanco)]/96 px-4 py-3 backdrop-blur-sm transition-transform duration-300 ease-out lg:hidden ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          {engancheTexto && (
            <p className="min-w-0 flex-1">
              <span className="lpe-cuerpo block text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpe-tinta-3-texto)]">
                Enganche
              </span>
              <span className="lpe-cifra block truncate text-[1.0625rem] text-[var(--lpe-tinta)]">
                {engancheTexto}
              </span>
            </p>
          )}
          <a
            href="#solicitud"
            tabIndex={visible ? undefined : -1}
            // Misma convención que el botón de envío del formulario:
            // `transition-[background-color,transform]` + `active:translate-y-px`.
            // Era el único control de la página sin transición ni estado
            // pulsado, y es el CTA que la barra fija enseña durante todo el
            // scroll en móvil — el más tocado de los tres.
            className="lpe-cuerpo shrink-0 rounded-[var(--lpe-r-pill)] bg-[var(--lpe-teal)] px-6 py-3.5 text-[0.9375rem] font-medium text-[var(--lpe-tinta)] transition-[background-color,transform] duration-200 hover:bg-[var(--lpe-teal-hover)] active:translate-y-px"
          >
            Ver el plan
          </a>
        </div>
      </div>
    </>
  );
}
