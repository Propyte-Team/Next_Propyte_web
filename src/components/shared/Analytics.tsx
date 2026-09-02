import Script from 'next/script';
import { STORAGE_KEY } from '@/lib/cookies/consent';

/**
 * Lee el consentimiento guardado DENTRO del snippet inline, antes de que
 * gtag/fbq se inicialicen.
 *
 * Por qué aquí y no en un useEffect del banner: ambos scripts son
 * `lazyOnload`, así que corren después del evento `load` — cualquier efecto
 * de React se les adelanta, encuentra `window.fbq` indefinido y no hace nada.
 * `applyConsentToMetaPixel()` sólo se llamaba desde `writeConsent()`, de modo
 * que el visitante recurrente (que ya no ve el banner) dejaba GA4 en `denied`
 * y el Pixel en `revoke` TODA la sesión, aunque hubiera aceptado. Sin
 * consentimiento activo no se escriben `_fbp`/`_fbc`, y sin esas cookies el
 * CAPI manda eventos sin identificadores: es la causa directa de los avisos
 * de "calidad de coincidencias" en Events Manager.
 *
 * Mismo patrón que ya usa el pixel de OpenAI en este repo.
 */
const READ_CONSENT_JS = `
  var __pc = null;
  try { __pc = JSON.parse(window.localStorage.getItem('${STORAGE_KEY}') || 'null'); } catch (e) {}
`;

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  // Google Ads tag (AW-XXXXXXXXX) — comparte gtag.js con GA4; las conversiones
  // se disparan en trackGenerateLead() con NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LEAD.
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  // Skip Meta Pixel when env var is missing or still set to the placeholder.
  const metaPixelEnabled =
    !!metaPixelId && metaPixelId !== 'XXXXXXXXXXXXXXXXX' && /^\d+$/.test(metaPixelId);

  return (
    <>
      {gaId && (
        <>
          {/* Consent Mode v2 default: deny analytics+ads until user opts in.
              functionality + security stay granted (essential). The cookie
              banner dispatches gtag('consent', 'update', {...}) on accept. */}
          <Script id="ga4-consent-default" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted',
                wait_for_update: 500
              });
            `}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              ${READ_CONSENT_JS}
              // El 'default' de arriba deja todo en denied. Si ya hay decisión
              // guardada hay que comunicarla ANTES del config, o el visitante
              // recurrente navega toda la sesión como si hubiera rechazado.
              if (__pc) {
                gtag('consent', 'update', {
                  analytics_storage: __pc.analytics ? 'granted' : 'denied',
                  ad_storage: __pc.marketing ? 'granted' : 'denied',
                  ad_user_data: __pc.marketing ? 'granted' : 'denied',
                  ad_personalization: __pc.marketing ? 'granted' : 'denied'
                });
              }
              gtag('js', new Date());
              gtag('config', '${gaId}');
              ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — gated by ad_storage consent. fbq() queues calls before
          the script loads, so events fired during page transitions are not
          lost. El banner llama a applyConsentToMetaPixel() al guardar; aquí se
          restaura la decisión previa en cada carga (ver READ_CONSENT_JS). */}
      {metaPixelEnabled && (
        <>
          <Script id="meta-pixel-init" strategy="lazyOnload">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              ${READ_CONSENT_JS}
              // Arranca en el estado que el visitante YA eligió. Si nunca
              // decidió, 'revoke' y los eventos quedan encolados hasta que el
              // banner llame a applyConsentToMetaPixel() desde writeConsent().
              fbq('consent', __pc && __pc.marketing ? 'grant' : 'revoke');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          {/* Noscript fallback for users with JS disabled — harmless tracking
              pixel; respects DNT through the standard FB pipeline. */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {hotjarId && (
        <Script id="hotjar-init" strategy="lazyOnload">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${hotjarId},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}
    </>
  );
}
