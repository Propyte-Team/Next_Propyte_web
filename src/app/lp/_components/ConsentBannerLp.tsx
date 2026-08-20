'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Solo se muestra si el visitante no ha decidido antes, en este sitio.
    if (readConsent() === null) setVisible(true);
  }, []);

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
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl border-t border-[var(--lp-line)] bg-[var(--lp-paper)] px-4 py-3 shadow-[0_-8px_32px_rgb(22_25_28/0.16)] lg:bottom-4 lg:rounded-[var(--lp-r-media)] lg:border"
    >
      {/* Copy recortado: decía en tres líneas lo que cabe en dos. Cada línea
          aquí es altura robada al primer pliegue. Se conserva lo que importa
          —que se pueden rechazar sin romper la página—, que es la parte
          honesta y la que de verdad reduce el rechazo por desconfianza. */}
      <p className="text-xs leading-relaxed text-[var(--lp-ink-soft)]">
        Usamos cookies de medición. Puedes rechazarlas y la página funciona
        igual.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => decidir(true)}
          className="min-h-[44px] flex-1 cursor-pointer rounded-[var(--lp-r-control)] bg-[var(--lp-accent)] px-4 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-[var(--lp-accent-strong)]"
        >
          Aceptar
        </button>
        <button
          type="button"
          onClick={() => decidir(false)}
          className="min-h-[44px] flex-1 cursor-pointer rounded-[var(--lp-r-control)] border border-[var(--lp-line)] px-4 py-2 text-xs font-medium text-[var(--lp-ink-soft)] transition-colors duration-200 hover:bg-[var(--lp-paper-2)]"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
