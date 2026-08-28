'use client';

import { useEffect, useRef } from 'react';
import { MessageCircle } from '@/lib/icons';
import { trackWhatsAppClick } from '@/lib/analytics/track';

// ============================================================
// Salida a WhatsApp. SUBORDINADA al formulario, a propósito y por diseño.
//
// En esta variante la conversión primaria es el formulario, así que WhatsApp
// aparece UNA sola vez, en el cierre, y en contorno: mismo tap target, cero
// peso visual. Quitarlo del todo sería perder ventas —en un ticket de siete
// cifras es el canal más cómodo—, pero es también el que menos califica y el
// único que no deja lead si el visitante no contesta.
//
// ═══ LA ATRIBUCIÓN NO ES OPCIONAL ═══
//
// El enlace arrastra gclid/wbraid/gbraid/fbclid. Sin ellos, un lead que entra
// por WhatsApp es indistinguible de uno orgánico y la campaña optimiza a
// ciegas. `wbraid` va incluido porque sustituye al `gclid` justo en el segmento
// que no aceptó cookies, que es el que más se pierde.
//
// ═══ POR QUÉ SE ESCRIBE EL `href` EN EL NODO Y NO EN ESTADO ═══
//
// La página es ISR: el HTML lo pinta el servidor y la URL del visitante no
// existe ahí, así que la atribución solo se puede leer después de montar.
// Guardarla en `useState` provocaría un render en cascada —y el linter lo
// marca con razón—, cuando lo que hay que hacer es exactamente lo que un
// efecto sí debe hacer: sincronizar un sistema externo, el DOM, con lo que
// React ya sabe.
//
// El enlace nace funcional desde el servidor, sin atribución, y al hidratar se
// completa. Si el JS nunca corre, sigue siendo un enlace de WhatsApp válido:
// se pierde la atribución, no la venta.
// ============================================================

const CLAVES = ['gclid', 'wbraid', 'gbraid', 'fbclid'] as const;

export default function WhatsAppTerrenos({
  telefono,
  mensaje,
  loteSlug,
}: {
  telefono: string;
  mensaje: string;
  loteSlug: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  // URL base, determinista: idéntica en servidor y en cliente, así que no hay
  // desajuste de hidratación.
  const base =
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` +
    `&utm_content=${encodeURIComponent(loteSlug)}`;

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const enUrl = new URLSearchParams(window.location.search);
    const salida = new URLSearchParams();
    for (const clave of CLAVES) {
      const valor = enUrl.get(clave);
      if (valor) salida.set(clave, valor);
    }
    if (salida.size === 0) return;
    nodo.href = `${base}&${salida.toString()}`;
  }, [base]);

  return (
    <a
      ref={ref}
      href={base}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackWhatsAppClick({ surface: 'lp-terrenos-pdc-cierre', propertySlug: loteSlug })
      }
      className="lpt-cuerpo inline-flex min-h-[52px] items-center gap-2 border-b border-[var(--lpt-linea-fuerte)] px-1 text-sm text-[var(--lpt-claro-2)] transition-colors duration-200 hover:border-[var(--lpt-estaca)] hover:text-[var(--lpt-claro)]"
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      O escríbenos por WhatsApp
    </a>
  );
}
