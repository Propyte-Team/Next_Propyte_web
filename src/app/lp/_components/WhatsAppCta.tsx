'use client';

import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// CTA de WhatsApp con atribución.
//
// SECUNDARIO, NO CO-PRIMARIO. Antes competía de tú a tú con el formulario y la
// página tenía cuatro salidas a WhatsApp contra tres al formulario. En un
// ticket de siete cifras con 60 mensualidades, WhatsApp es el canal más cómodo,
// el que menos califica y el único que no deja lead si el visitante no
// contesta. Sigue presente en los tres puntos de conversión —quitarlo sería
// perder ventas—, pero en contorno: mismo tap target, jerarquía subordinada.
//
// El estilo venía de la paleta ANTERIOR (`aqua-bright`, `bg-whatsapp`), clases
// que no existen en el tema de la landing. Se renderizaba sin borde visible y
// con el verde de marca de un tercero en medio de una página terracota. Ahora
// usa los tokens de `lp-theme.css` como todo lo demás.
//
// Client component solo por el evento `whatsapp_click`. Sin él el canal es
// inatribuible y la campaña optimiza a ciegas.
// ============================================================

export default function WhatsAppCta({
  loteSlug,
  telefono,
  mensaje,
  surface,
}: {
  loteSlug: string;
  telefono: string;
  mensaje: string;
  surface: string;
}) {
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}&utm_content=${encodeURIComponent(loteSlug)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick({ surface, propertySlug: loteSlug })}
      className="inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[var(--lp-r-control)] border border-[var(--lp-on-dark)]/25 px-6 text-sm font-medium text-[var(--lp-on-dark)]/85 transition-colors duration-200 hover:border-[var(--lp-on-dark)]/45 hover:text-[var(--lp-on-dark)]"
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      Escribir por WhatsApp
    </a>
  );
}
