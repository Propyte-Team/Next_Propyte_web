'use client';

import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// CTA de WhatsApp con atribución.
//
// Co-primario en el hero, no secundario: es el canal que probablemente cierre
// más ventas en este mercado. El mensaje precargado lleva la referencia del lote
// y sus números, para que el asesor abra la conversación sabiendo de qué lote se
// habla sin preguntarlo.
//
// Client component solo por el evento `whatsapp_click`. Sin él el canal es
// inatribuible y la campaña optimiza a ciegas.
// ============================================================

export default function WhatsAppCta({
  loteSlug,
  telefono,
  mensaje,
  surface,
  variante = 'contorno',
}: {
  loteSlug: string;
  telefono: string;
  mensaje: string;
  surface: string;
  variante?: 'contorno' | 'solido';
}) {
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}&utm_content=${encodeURIComponent(loteSlug)}`;

  const clases =
    variante === 'contorno'
      ? 'border border-aqua-bright/40 text-white hover:border-aqua-bright hover:bg-white/5'
      : 'bg-whatsapp text-white hover:bg-whatsapp-dark';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick({ surface, propertySlug: loteSlug })}
      className={`inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 px-6 text-sm font-semibold transition-colors duration-200 ${clases}`}
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      Escribir por WhatsApp
    </a>
  );
}
