import { pickLang } from '@/lib/i18n/pickLang';
import { PRIVACY_EMAIL } from '@/lib/legal/contacts';

/**
 * Política de Cookies — borrador genérico.
 * Lista provisional. Sustituir por inventario auto-generado por
 * Cookiebot/CookieYes cuando se integre el CMP.
 */
export default function CookiesContent({ locale }: { locale: string }) {
  return (
    <>
      <p className="lead">
        {pickLang(
          locale,
          'This Cookies Policy explains what cookies are, what types we use on propyte.com, and how you can manage your preferences.',
          'Esta Política de Cookies explica qué son las cookies, qué tipos utilizamos en propyte.com y cómo puedes gestionar tus preferencias.',
        )}
      </p>

      <h2>{pickLang(locale, '1. What are cookies', '1. Qué son las cookies')}</h2>
      <p>{pickLang(locale, 'Cookies are small text files that a site stores in your browser to remember information between visits (session, language, preferences) and to measure how the site is used (analytics).', 'Las cookies son pequeños archivos de texto que un sitio almacena en tu navegador para recordar información entre visitas (sesión, idioma, preferencias) y para medir el uso del sitio (analítica).')}</p>
      <p>{pickLang(locale, 'There are similar technologies (pixels, local storage, fingerprinting) that we treat under the same policy.', 'Existen tecnologías similares (píxeles, almacenamiento local, fingerprinting) que tratamos bajo la misma política.')}</p>

      <h2>{pickLang(locale, '2. Categories of cookies we use', '2. Categorías de cookies que usamos')}</h2>

      <h3>{pickLang(locale, '2.1 Strictly necessary', '2.1 Estrictamente necesarias')}</h3>
      <p>{pickLang(locale, 'Required for the basic operation of the Site (session, language, currency MXN/USD, security). They cannot be disabled without affecting site usage.', 'Requeridas para el funcionamiento básico del Sitio (sesión, idioma, moneda MXN/USD, seguridad). No se pueden desactivar sin afectar el uso del sitio.')}</p>
      <ul>
        <li><code>NEXT_LOCALE</code> — {pickLang(locale, 'language preference (es/en)', 'preferencia de idioma (es/en)')} · 1 {pickLang(locale, 'year', 'año')}</li>
        <li><code>currency_pref</code> — {pickLang(locale, 'currency preference (MXN/USD)', 'preferencia de moneda (MXN/USD)')} · 6 {pickLang(locale, 'months', 'meses')}</li>
      </ul>
      <p className="text-xs text-[#2C2C2C]/60 italic">
        {pickLang(locale, 'When the consent platform is deployed, an additional consent record cookie will be added here (e.g. cookieyes-consent or cookiebot-*).', 'Cuando se despliegue la plataforma de consentimiento, se añadirá aquí una cookie adicional de registro de consentimiento (p. ej. cookieyes-consent o cookiebot-*).')}
      </p>

      <h3>{pickLang(locale, '2.2 Analytics', '2.2 Analítica')}</h3>
      <p>{pickLang(locale, 'They allow us to understand which pages are most visited, how users navigate, and improve the experience. Aggregated, non-identifying data.', 'Nos permiten entender qué páginas se visitan más, cómo navegan los usuarios y mejorar la experiencia. Datos agregados, no identificativos.')}</p>
      <ul>
        <li><code>_ga</code>, <code>_ga_*</code> — Google Analytics 4 · 13 {pickLang(locale, 'months', 'meses')}</li>
        <li><code>_gid</code> — {pickLang(locale, 'analytics user identifier', 'identificador de usuario analítica')} · 24 {pickLang(locale, 'hours', 'horas')}</li>
      </ul>

      <h3>{pickLang(locale, '2.3 Marketing and advertising', '2.3 Marketing y publicidad')}</h3>
      <p>{pickLang(locale, 'Used to show you relevant ads on Meta (Facebook/Instagram) and Google, and to measure the effectiveness of our campaigns.', 'Utilizadas para mostrarte anuncios relevantes en Meta (Facebook/Instagram) y Google, y para medir la efectividad de nuestras campañas.')}</p>
      <ul>
        <li><code>_fbp</code> — Meta Pixel · 90 {pickLang(locale, 'days', 'días')}</li>
        <li><code>fr</code> — {pickLang(locale, 'Meta advertising', 'publicidad Meta')} · 90 {pickLang(locale, 'days', 'días')}</li>
        <li><code>_gcl_*</code> — Google Ads conversion · 90 {pickLang(locale, 'days', 'días')}</li>
        <li><code>NID</code>, <code>IDE</code> — Google · 13 {pickLang(locale, 'months', 'meses')}</li>
      </ul>

      <p className="text-xs text-[#2C2C2C]/60 italic">
        {pickLang(locale, 'The list above is provisional. Once we deploy our cookie consent platform, the inventory will auto-update with the actual cookies set on each visit.', 'La lista anterior es provisional. Una vez desplegada nuestra plataforma de consentimiento de cookies, el inventario se actualizará automáticamente con las cookies reales que se establecen en cada visita.')}
      </p>

      <h2>{pickLang(locale, '3. Your consent (forthcoming)', '3. Tu consentimiento (próximamente)')}</h2>
      <p>
        <strong>{pickLang(locale, 'Status: ', 'Estado: ')}</strong>
        {pickLang(locale, 'a granular consent platform is being deployed. While it is implemented, only strictly necessary cookies (§2.1) are loaded automatically; analytics and marketing cookies are not activated until the consent banner is live.', 'se está desplegando una plataforma de consentimiento granular. Mientras se implementa, solo se cargan automáticamente las cookies estrictamente necesarias (§2.1); las cookies de analítica y marketing no se activan hasta que el banner de consentimiento esté disponible.')}
      </p>
      <p>{pickLang(locale, 'When the banner is live, you will be able to:', 'Cuando el banner esté disponible podrás:')}</p>
      <ul>
        <li>{pickLang(locale, 'Accept all categories', 'Aceptar todas las categorías')}</li>
        <li>{pickLang(locale, 'Reject all (except strictly necessary)', 'Rechazar todas (excepto estrictamente necesarias)')}</li>
        <li>{pickLang(locale, 'Configure granularly which categories to allow', 'Configurar granularmente qué categorías permitir')}</li>
      </ul>
      <p>{pickLang(locale, 'Your choice will be recorded for 12 months and can be changed at any time using the "Cookie preferences" link in the footer.', 'Tu elección quedará registrada durante 12 meses y podrás cambiarla en cualquier momento mediante el enlace "Preferencias de cookies" en el pie de página.')}</p>
      <p>
        {pickLang(locale, 'In the meantime, if you wish to opt out of analytics or marketing cookies, you can do so by configuring your browser (see §4) or by writing to ', 'Mientras tanto, si deseas excluirte de las cookies de analítica o marketing, puedes hacerlo configurando tu navegador (ver §4) o escribiendo a ')}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>

      <h2>{pickLang(locale, '4. Disable cookies in your browser', '4. Desactivar cookies en el navegador')}</h2>
      <p>{pickLang(locale, 'Independently of our consent banner, you can configure your browser to block cookies:', 'Independientemente de nuestro banner de consentimiento, puedes configurar tu navegador para bloquear cookies:')}</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
        <li><a href="https://support.mozilla.org/kb/proteccion-mejorada-rastreo-firefox-computadora" target="_blank" rel="noopener noreferrer">Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a></li>
      </ul>
      <p>{pickLang(locale, 'Note: blocking strictly necessary cookies may prevent some sections of the Site from working correctly.', 'Nota: bloquear las cookies estrictamente necesarias puede impedir el correcto funcionamiento de algunas secciones del Sitio.')}</p>

      <h2>{pickLang(locale, '5. Third-party cookies', '5. Cookies de terceros')}</h2>
      <p>{pickLang(locale, 'Some cookies are set by third parties (Google, Meta, embedded video providers, social plugins). These third parties have their own privacy policies, available on their respective sites.', 'Algunas cookies son establecidas por terceros (Google, Meta, proveedores de video embebido, plugins sociales). Esos terceros tienen sus propias políticas de privacidad, disponibles en sus respectivos sitios.')}</p>

      <h2>{pickLang(locale, '6. Changes to this Policy', '6. Cambios a esta Política')}</h2>
      <p>{pickLang(locale, 'We may update this Policy when we add, remove, or modify the cookies we use. The current version is always available at /cookies and includes the last update date.', 'Podemos actualizar esta Política cuando agreguemos, eliminemos o modifiquemos las cookies que utilizamos. La versión vigente está siempre disponible en /cookies y se indica la fecha de última actualización.')}</p>
    </>
  );
}
