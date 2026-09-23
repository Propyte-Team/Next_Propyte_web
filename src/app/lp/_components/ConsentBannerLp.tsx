'use client';

import { useEffect, useRef, useState } from 'react';
import { readConsent, writeConsent } from '@/lib/cookies/consent';

// ============================================================
// Banner de consentimiento mínimo para landings de pago.
//
// El `CookieBanner` del sitio no es reutilizable aquí: depende de
// `useTranslations` (necesita NextIntlClientProvider) y de `useCompare`
// (necesita UnitsProvider), ambos montados en `[locale]/layout.tsx`. Traerlos a
// esta ruta significaría montar next-intl y framer-motion en una página cuyo
// presupuesto de JS es lo que sostiene el LCP.
//
// Este banner escribe en la MISMA clave (`propyte:cookies`) con la misma
// función `writeConsent`, así que dispara idéntico `gtag('consent','update')` y
// el consentimiento otorgado aquí se respeta en el resto del sitio y al revés.
// Sin esto, Consent Mode v2 se quedaría en "denied" y Smart Bidding optimizaría
// sobre datos incompletos.
// ============================================================

export default function ConsentBannerLp() {
  const [visible, setVisible] = useState(false);
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Solo se muestra si el visitante no ha decidido antes, en este sitio.
    if (readConsent() === null) setVisible(true);
  }, []);

  // El banner RESERVA su espacio en vez de flotar encima. Es lo único que hace
  // que no tape nada: medido, ninguna posición flotante está libre en las cinco
  // landings a la vez, porque cada una pone su conversión en un sitio distinto.
  // Se mide la altura real (el texto envuelve distinto según el ancho) y se
  // observa el reflow, para que al girar el teléfono el hueco siga cuadrando.
  useEffect(() => {
    const el = barra.current;
    if (!visible || !el) return;
    const aplicar = () => {
      const alto = `${el.offsetHeight}px`;
      document.body.style.paddingTop = alto;
      // El `padding-top` del body NO mueve lo que está posicionado contra el
      // bloque contenedor inicial. La cabecera de `app/lp/layout.tsx` es
      // `absolute top-0` y se quedaba DEBAJO del banner: logo blanco sobre el
      // fondo blanco del banner, invisible en la primera carga. Se publica el
      // alto para que ella lo siga.
      document.documentElement.style.setProperty('--lp-consent-h', alto);
    };
    aplicar();
    const ro = new ResizeObserver(aplicar);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.body.style.paddingTop = '';
      document.documentElement.style.removeProperty('--lp-consent-h');
    };
  }, [visible]);

  if (!visible) return null;

  function decidir(aceptar: boolean) {
    writeConsent({ analytics: aceptar, marketing: aceptar });
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      // ANTES iba en `bottom-20` para dejar libre la barra de CTA fija. Medido
      // en 390x844, ese hueco de 80 px colocaba el banner en y 616–764, encima
      // de los DOS CTA del hero (y 636–692 y y 704–756): al cargar la página
      // NO había un solo botón visible hasta decidir las cookies.
      //
      // Ahora va pegado abajo y más compacto. Puede solaparse con la barra
      // fija, sí — pero esa barra no aparece hasta el 20% del scroll y el
      // banner se va con un tap, mientras que tapar los CTA del hero pasaba en
      // CADA primera carga. Se protege lo permanente, no lo transitorio.
      //
      // ─── 2026-09-01: ESE ARREGLO SE MIDIÓ SOLO EN 390 ───
      //
      // En escritorio el banner seguía CENTRADO abajo (`mx-auto max-w-3xl`,
      // x 336–1104 en 1440) y caía sobre la columna de conversión. Medido en
      // producción, tapaba el elemento de conversión en CUATRO de las cinco
      // landings:
      //
      //   1440 · enganche → dos cifras del hero + el campo «name»
      //          lotes    → «name» y «email»
      //          casas    → los filtros de precio y «Recibir el dossier»
      //          homes    → los filtros y «Send me the dossier»
      //    390 · terrenos → «name» y «email»  ← la que recibe el tráfico pagado
      //          lotes    → «name»
      //
      // Se probaron cuatro geometrías contra las cinco landings en los dos
      // viewports. Centrado abajo: 1/5 limpias en 1440. Anclado a la izquierda:
      // 3/5. A la derecha: 2/5. NINGUNA posición flotante sirve, y no es mala
      // suerte: cada landing pone su conversión en un lado distinto, así que
      // mover el banner solo cambia de víctima.
      //
      // Lo único que funciona es no flotar: barra ARRIBA que reserva su alto
      // con `padding-top` en el body (ver el efecto de más arriba). Medido:
      // 10/10 combinaciones sin un solo solape. El precio es el alto de la
      // barra, y por eso el contenido va en UNA fila —54 px en 1440, 66 en
      // 390, contra los 102/120 de antes—: así `terrenos` conserva su campo
      // dentro del primer pliegue en móvil, que antes estaba TAPADO.
      ref={barra}
      className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--lp-line)] bg-[var(--lp-paper)] px-4 py-2 shadow-[0_8px_32px_rgb(22_25_28/0.16)]"
    >
      {/* Copy recortado: decía en tres líneas lo que cabe en dos. Cada línea
          aquí es altura robada al primer pliegue. Se conserva lo que importa
          —que se pueden rechazar sin romper la página—, que es la parte
          honesta y la que de verdad reduce el rechazo por desconfianza. */}
      <p className="min-w-[11rem] flex-1 text-xs leading-relaxed text-[var(--lp-ink-soft)]">
        Usamos cookies de medición. Puedes rechazarlas y la página funciona
        igual.
      </p>
      {/* Los botones NO crecen: en una barra de ancho completo, dos botones
          `flex-1` medirían media pantalla cada uno para decir «Aceptar». Se
          conservan los 44 px de alto mínimo — el objetivo táctil no se negocia
          para ganar 8 px de barra. */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => decidir(true)}
          className="min-h-[44px] cursor-pointer rounded-[var(--lp-r-control)] bg-[var(--lp-accent)] px-5 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-[var(--lp-accent-strong)]"
        >
          Aceptar
        </button>
        <button
          type="button"
          onClick={() => decidir(false)}
          className="min-h-[44px] cursor-pointer rounded-[var(--lp-r-control)] border border-[var(--lp-line)] px-5 py-2 text-xs font-medium text-[var(--lp-ink-soft)] transition-colors duration-200 hover:bg-[var(--lp-paper-2)]"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
