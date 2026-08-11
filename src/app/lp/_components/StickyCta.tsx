'use client';

import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// Barra de CTA fija en móvil.
//
// Tres elementos: la mensualidad como ancla de precio, el CTA primario y
// WhatsApp. La mensualidad va aquí porque es la cifra de mayor palanca del
// segmento y en móvil el visitante la pierde de vista al hacer scroll; tenerla
// siempre presente es lo que sostiene la intención hasta el formulario.
//
// Si no hay plan de pagos (falta la tasa), la barra cae a dos elementos en lugar
// de mostrar un hueco.
// ============================================================

export default function StickyCta({
  loteSlug,
  telefono,
  mensualidad,
  mensaje,
}: {
  loteSlug: string;
  telefono: string;
  mensualidad: string | null;
  mensaje: string;
}) {
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}&utm_content=${encodeURIComponent(loteSlug)}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/12 bg-white/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex items-stretch gap-2 px-4 py-2.5">
        {mensualidad && (
          <div className="flex shrink-0 flex-col justify-center pr-1">
            <span className="text-[0.5625rem] uppercase tracking-[0.08em] text-navy/50">
              Al mes
            </span>
            <span className="font-mono text-sm tabular-nums leading-tight text-navy">
              {mensualidad}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            document
              .getElementById('solicitar')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className="min-h-[48px] flex-1 cursor-pointer bg-teal-a11y px-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-a11y/90"
        >
          {mensualidad ? 'Ver mi plan' : 'Pedir el detalle'}
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackWhatsAppClick({ surface: 'lp-lotes-pdc-sticky', propertySlug: loteSlug })
          }
          aria-label="Escribir por WhatsApp"
          className="flex min-h-[48px] min-w-[48px] cursor-pointer items-center justify-center border border-navy/15 text-graphite transition-colors duration-200 hover:border-navy/35"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
