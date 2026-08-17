'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';
import { getCapturedUTMs } from '@/hooks/useUTMCapture';

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
  // Identificadores de clic de anuncio, leídos DESPUÉS de montar.
  //
  // No se pueden leer en render: el HTML lo pinta el servidor con ISR y la URL
  // del visitante no existe ahí. Meterlos en el primer render produciría un
  // mismatch de hidratación; en un `useEffect` el enlace nace sin ellos y se
  // completa al hidratar.
  //
  // Por qué importa: WhatsApp es el objetivo primario de esta página y hasta
  // ahora su `href` no llevaba NADA de atribución. Un lead que llega por
  // WhatsApp era indistinguible de uno orgánico, así que Google Ads nunca supo
  // qué clic pagado lo produjo. `wbraid` va incluido a propósito: sustituye al
  // `gclid` justo cuando el visitante NO aceptó cookies, que es el segmento que
  // más se estaba perdiendo.
  const [atribucion, setAtribucion] = useState('');

  useEffect(() => {
    const enUrl = new URLSearchParams(window.location.search);
    const salida = new URLSearchParams();

    for (const clave of ['gclid', 'wbraid', 'gbraid', 'fbclid'] as const) {
      const valor = enUrl.get(clave);
      if (valor) salida.set(clave, valor);
    }

    // La URL manda, pero el visitante pudo navegar dentro del sitio y perderla.
    // `useUTMCapture` ya la guardó en sessionStorage al aterrizar.
    if ([...salida.keys()].length === 0) {
      const capturado = getCapturedUTMs();
      if (capturado.gclid) salida.set('gclid', capturado.gclid);
      else if (capturado.wbraid) salida.set('wbraid', capturado.wbraid);
      if (capturado.fbclid) salida.set('fbclid', capturado.fbclid);
    }

    setAtribucion(salida.toString());
  }, []);

  const url =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` +
    `&utm_content=${encodeURIComponent(loteSlug)}` +
    (atribucion ? `&${atribucion}` : '');

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
