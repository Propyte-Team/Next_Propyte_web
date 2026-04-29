import { pickLang } from '@/lib/i18n/pickLang';

/**
 * Aviso de Privacidad — borrador genérico LFPDPPP.
 * Pendiente revisión por abogado especialista en protección de datos.
 * Actualizar `lastUpdated` en el wrapper cuando cambie el contenido.
 */
export default function PrivacidadContent({ locale }: { locale: string }) {
  return (
    <>
      <p className="lead">
        {pickLang(
          locale,
          'This Privacy Notice ("Notice") describes how Propyte processes your personal data in accordance with Mexico\'s Federal Law on the Protection of Personal Data Held by Private Parties (LFPDPPP) and its Regulations.',
          'Este Aviso de Privacidad ("Aviso") describe cómo Propyte trata tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.',
        )}
      </p>

      <h2>{pickLang(locale, '1. Data Controller', '1. Responsable del tratamiento')}</h2>
      <p>
        {pickLang(
          locale,
          'The data controller is Propyte (commercial name), with offices on 5ta Avenida, Playa del Carmen, Quintana Roo, Mexico, and contact email ',
          'El responsable del tratamiento es Propyte (nombre comercial), con domicilio en 5ta Avenida, Playa del Carmen, Quintana Roo, México, y correo de contacto ',
        )}
        <a href="mailto:privacidad@propyte.com">privacidad@propyte.com</a>.
      </p>

      <h2>{pickLang(locale, '2. Personal data we collect', '2. Datos personales que recabamos')}</h2>
      <p>{pickLang(locale, 'We may collect the following data, directly from you or through our forms, WhatsApp, email, and analytics tools:', 'Podemos recabar los siguientes datos, directamente de ti o a través de nuestros formularios, WhatsApp, correo electrónico y herramientas de analítica:')}</p>
      <ul>
        <li>{pickLang(locale, 'Identification: full name', 'Identificación: nombre completo')}</li>
        <li>{pickLang(locale, 'Contact: email, phone, WhatsApp', 'Contacto: correo, teléfono, WhatsApp')}</li>
        <li>{pickLang(locale, 'Interest profile: city/zone, budget, property type, timeframe', 'Perfil de interés: ciudad/zona, presupuesto, tipo de propiedad, horizonte')}</li>
        <li>{pickLang(locale, 'Browsing: IP, cookies, device, pages visited (see Cookies Policy)', 'Navegación: IP, cookies, dispositivo, páginas visitadas (ver Política de Cookies)')}</li>
        <li>{pickLang(locale, 'Optional financial data: only if you complete the financing simulator (referential, not stored as a credit application)', 'Datos financieros opcionales: solo si completas el simulador de financiamiento (referencial, no se almacena como solicitud de crédito)')}</li>
      </ul>
      <p>
        <strong>{pickLang(locale, 'Sensitive data: ', 'Datos sensibles: ')}</strong>
        {pickLang(locale, 'we do not request or process sensitive personal data (health, ethnic origin, ideology, etc.).', 'no solicitamos ni tratamos datos personales sensibles (salud, origen étnico, ideología, etc.).')}
      </p>

      <h2>{pickLang(locale, '3. Primary purposes', '3. Finalidades primarias')}</h2>
      <p>{pickLang(locale, 'We use your data to:', 'Utilizamos tus datos para:')}</p>
      <ul>
        <li>{pickLang(locale, 'Contact you about properties, developments, financing, or your specific inquiries', 'Contactarte sobre propiedades, desarrollos, financiamiento o las consultas específicas que nos hagas')}</li>
        <li>{pickLang(locale, 'Connect you with allied developers and Propyte certified advisors', 'Conectarte con desarrolladores aliados y asesores certificados Propyte')}</li>
        <li>{pickLang(locale, 'Send personalized investment analyses (ROI, market trends, comparables)', 'Enviarte análisis personalizados de inversión (ROI, tendencias de mercado, comparables)')}</li>
        <li>{pickLang(locale, 'Comply with contractual and legal obligations arising from your interaction with our services', 'Cumplir obligaciones contractuales y legales derivadas de tu interacción con nuestros servicios')}</li>
      </ul>

      <h2>{pickLang(locale, '4. Secondary purposes (optional consent)', '4. Finalidades secundarias (consentimiento opcional)')}</h2>
      <ul>
        <li>{pickLang(locale, 'Market newsletter and exclusive analyses', 'Boletín de mercado y análisis exclusivos')}</li>
        <li>{pickLang(locale, 'Promotions, exclusive launches, and Propyte events', 'Promociones, lanzamientos exclusivos y eventos Propyte')}</li>
        <li>{pickLang(locale, 'Service improvement surveys', 'Encuestas de mejora del servicio')}</li>
      </ul>
      <p>
        {pickLang(
          locale,
          'You may refuse these secondary purposes at any time by writing to ',
          'Puedes negarte a estas finalidades secundarias en cualquier momento escribiendo a ',
        )}
        <a href="mailto:privacidad@propyte.com">privacidad@propyte.com</a>
        {pickLang(locale, '. Refusal will not affect the primary services you request.', '. La negativa no afectará los servicios primarios que solicites.')}
      </p>

      <h2>{pickLang(locale, '5. Data transfers', '5. Transferencias de datos')}</h2>
      <p>{pickLang(locale, 'We may share your data with:', 'Podemos compartir tus datos con:')}</p>
      <ul>
        <li>{pickLang(locale, 'Allied developers — when you request information about a specific property; only the strictly necessary data is transferred', 'Desarrolladores aliados — cuando solicitas información de una propiedad específica; solo se transfieren los datos estrictamente necesarios')}</li>
        <li>{pickLang(locale, 'Propyte certified advisors — to enable contact and follow-up', 'Asesores Propyte certificados — para habilitar el contacto y el seguimiento')}</li>
        <li>{pickLang(locale, 'Service providers under confidentiality agreement: hosting (Hostinger, Vercel, Supabase), CRM (Zoho), email (Hostinger SMTP), analytics (Google Analytics, Meta Pixel)', 'Proveedores de servicios bajo acuerdo de confidencialidad: hosting (Hostinger, Vercel, Supabase), CRM (Zoho), correo (Hostinger SMTP), analítica (Google Analytics, Meta Pixel)')}</li>
        <li>{pickLang(locale, 'Competent authorities, when required by law', 'Autoridades competentes cuando lo requiera la ley')}</li>
      </ul>
      <p>{pickLang(locale, 'No transfer is made for monetary consideration. We do not sell personal data.', 'Ninguna transferencia se realiza con contraprestación económica. No vendemos datos personales.')}</p>

      <h2>{pickLang(locale, '6. ARCO Rights', '6. Derechos ARCO')}</h2>
      <p>{pickLang(locale, 'You have the right to Access, Rectify, Cancel, or Object to (ARCO) the processing of your personal data, and to revoke any consent granted.', 'Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (ARCO) al tratamiento de tus datos personales, así como a revocar el consentimiento que hayas otorgado.')}</p>
      <p><strong>{pickLang(locale, 'How to exercise them:', 'Cómo ejercerlos:')}</strong></p>
      <ol>
        <li>{pickLang(locale, 'Send an email to ', 'Envía un correo a ')}<a href="mailto:privacidad@propyte.com">privacidad@propyte.com</a></li>
        <li>{pickLang(locale, 'Include: full name, official ID copy (INE, passport), description of the right you are exercising, and your request', 'Incluye: nombre completo, copia de identificación oficial (INE, pasaporte), descripción del derecho que ejerces y tu petición')}</li>
        <li>{pickLang(locale, 'Response time: 20 business days from receipt', 'Plazo de respuesta: 20 días hábiles desde la recepción')}</li>
      </ol>
      <p>{pickLang(locale, 'If we do not respond or you disagree with the response, you may file a complaint with INAI (www.inai.org.mx).', 'Si no respondemos o no estás conforme con la respuesta, puedes acudir al INAI (www.inai.org.mx) a presentar una queja.')}</p>

      <h2>{pickLang(locale, '7. Cookies and similar technologies', '7. Cookies y tecnologías similares')}</h2>
      <p>
        {pickLang(locale, 'We use cookies for session management, language preferences, analytics, and personalized advertising. See our ', 'Utilizamos cookies para gestión de sesión, preferencias de idioma, analítica y publicidad personalizada. Consulta nuestra ')}
        <a href={`/${locale}/cookies`}>{pickLang(locale, 'Cookies Policy', 'Política de Cookies')}</a>
        {pickLang(locale, ' for details and to manage preferences.', ' para detalles y manejo de preferencias.')}
      </p>

      <h2>{pickLang(locale, '8. Data retention and security', '8. Conservación y seguridad')}</h2>
      <p>{pickLang(locale, 'We retain your data only as long as necessary for the stated purposes or as required by tax/commercial regulations (up to 5 years from last interaction). We apply administrative, technical, and physical measures to protect your information against unauthorized access, alteration, or loss.', 'Conservamos tus datos durante el tiempo necesario para las finalidades descritas o según lo exija la normativa fiscal/comercial aplicable (hasta 5 años desde la última interacción). Aplicamos medidas administrativas, técnicas y físicas para proteger tu información contra accesos, alteraciones o pérdidas no autorizadas.')}</p>

      <h2>{pickLang(locale, '9. Changes to this Notice', '9. Cambios al presente Aviso')}</h2>
      <p>{pickLang(locale, 'We may update this Notice. Material changes will be communicated via email and through a banner on the site. The current version is always available at /privacidad.', 'Podemos actualizar el presente Aviso. Los cambios materiales se comunicarán por correo y mediante banner en el sitio. La versión vigente está siempre disponible en /privacidad.')}</p>

      <h2>{pickLang(locale, '10. Applicable law and jurisdiction', '10. Ley aplicable y jurisdicción')}</h2>
      <p>{pickLang(locale, 'This Notice is governed by the LFPDPPP, its Regulations, and applicable Mexican law. The competent venue is the city of Playa del Carmen, Quintana Roo.', 'El presente Aviso se rige por la LFPDPPP, su Reglamento y la legislación mexicana aplicable. El foro competente es la ciudad de Playa del Carmen, Quintana Roo.')}</p>
    </>
  );
}
