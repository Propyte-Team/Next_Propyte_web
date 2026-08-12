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
      // bottom-20 en móvil: la barra de CTA fija ocupa la parte inferior y no
      // puede quedar tapada: es el objetivo primario de la página.
      className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-3xl rounded-[var(--lp-r-media)] border border-[var(--lp-line)] bg-[var(--lp-paper)] p-4 shadow-[0_12px_40px_rgb(22_25_28/0.14)] lg:bottom-4"
    >
      <p className="text-xs leading-relaxed text-[var(--lp-ink-soft)]">
        Usamos cookies de medición para saber qué anuncios traen visitantes que
        de verdad encuentran lo que buscan. Puedes rechazarlas y la página
        funciona igual.
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
