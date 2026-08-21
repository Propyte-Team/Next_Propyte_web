import Script from 'next/script';
import { OPENAI_PIXEL_ID } from '@/lib/analytics/openai-ads';
import { CONSENT_BOOT_JS } from '@/lib/cookies/consent';
import OpenAiPageView from './OpenAiPageView';

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  // Google Ads tag (AW-XXXXXXXXX) — comparte gtag.js con GA4; las conversiones
  // se disparan en trackGenerateLead() con NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LEAD.
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  // `debug: true` solo fuera de produccion: en prod ensucia la consola del
  // visitante y expone el detalle de cada evento medido.
  const openAiDebug = process.env.NODE_ENV === 'production' ? '' : ', debug: true';
  // Skip Meta Pixel when env var is missing or still set to the placeholder.
  const metaPixelEnabled =
    !!metaPixelId && metaPixelId !== 'XXXXXXXXXXXXXXXXX' && /^\d+$/.test(metaPixelId);

  return (
    <>
      {gaId && (
        <>
          {/* Consent Mode v2 default: deny analytics+ads until user opts in.
              functionality + security stay granted (essential). The cookie
              banner dispatches gtag('consent', 'update', {...}) on accept.

              Y justo despues, si el visitante YA decidio en una visita
              anterior, se re-aplica esa decision aqui mismo. Sin esto el
              recurrente se queda en denied toda la sesion porque el banner no
              se le muestra y nadie comunica su consentimiento (ver
              CONSENT_BOOT_JS). El update va en el mismo script que el default,
              asi que entra en dataLayer en orden y antes de que gtag.js cargue
              (lazyOnload). */}
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
              (function(){
                ${CONSENT_BOOT_JS}
                if (!__propyteConsent.decided) return;
                gtag('consent', 'update', {
                  analytics_storage: __propyteConsent.analytics ? 'granted' : 'denied',
                  ad_storage: __propyteConsent.marketing ? 'granted' : 'denied',
                  ad_user_data: __propyteConsent.marketing ? 'granted' : 'denied',
                  ad_personalization: __propyteConsent.marketing ? 'granted' : 'denied'
                });
              })();
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
              gtag('js', new Date());
              gtag('config', '${gaId}');
              ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — gated by ad_storage consent. fbq() queues calls before
          the script loads, so events fired during page transitions are not
          lost. Cookie banner flips `_propyte_pixel_consent` → re-call fbq('consent','grant'). */}
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
              (function(){
                ${CONSENT_BOOT_JS}
                // Antes iba 'revoke' fijo y solo el banner lo levantaba al
                // GUARDAR: el recurrente que ya habia aceptado quedaba revocado
                // toda la sesion. fbq() encola, asi que esto se aplica aunque
                // fbevents.js todavia no haya cargado.
                fbq('consent', __propyteConsent.marketing ? 'grant' : 'revoke');
              })();
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

      {/* OpenAI Ads Pixel (oaiq) — campañas dentro de ChatGPT.
          `afterInteractive`, no `lazyOnload` como Meta/Hotjar: el snippet
          define la cola `window.oaiq` de forma sincrónica y de ella depende
          <OpenAiPageView />. Con lazyOnload, un page_viewed disparado durante
          una navegación temprana caería al vacío. El fetch del SDK sigue
          siendo async, así que no bloquea el render. */}
      {OPENAI_PIXEL_ID && (
        <>
          <Script id="openai-pixel-init" strategy="afterInteractive">
            {`
              !function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
              (function(){
                // El consentimiento del SDK arranca CONCEDIDO. Hay que fijarlo
                // antes del init o el píxel mediría sin permiso. Este pixel ya
                // leía localStorage por su cuenta; ahora usa el MISMO snippet
                // que GA4 y Meta para que las tres lecturas no divergan.
                ${CONSENT_BOOT_JS}
                oaiq("consent", __propyteConsent.marketing);
                oaiq("init", { pixelId: "${OPENAI_PIXEL_ID}"${openAiDebug} });
                // page_viewed NO se dispara solo con el init.
                oaiq("measure", "page_viewed", {
                  type: "contents",
                  contents: [{ id: window.location.pathname, name: document.title || window.location.pathname, content_type: "page" }]
                });
              })();
            `}
          </Script>
          <OpenAiPageView />
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
