import { pickLang } from '@/lib/i18n/pickLang';
import { LEGAL_EMAIL } from '@/lib/legal/contacts';

/**
 * Términos y Condiciones — borrador genérico para marketplace inmobiliario.
 * Pendiente revisión por abogado.
 */
export default function TerminosContent({ locale }: { locale: string }) {
  return (
    <>
      <p className="lead">
        {pickLang(
          locale,
          'These Terms and Conditions ("Terms") govern access to and use of the website propyte.com (the "Site") and the services provided by Propyte. By using the Site, you fully accept these Terms.',
          'Estos Términos y Condiciones ("Términos") regulan el acceso y uso del sitio propyte.com (el "Sitio") y los servicios provistos por Propyte. Al usar el Sitio aceptas íntegramente estos Términos.',
        )}
      </p>

      <h2>{pickLang(locale, '1. Nature of the service', '1. Naturaleza del servicio')}</h2>
      <p>{pickLang(locale, 'Propyte operates as a real estate marketplace and information platform. We facilitate the connection between users interested in real estate investments and developers, property managers, and certified advisors.', 'Propyte opera como un marketplace inmobiliario y plataforma de información. Facilitamos la conexión entre usuarios interesados en inversiones inmobiliarias y desarrolladores, gestores y asesores certificados.')}</p>
      <p>
        <strong>{pickLang(locale, 'Important: ', 'Importante: ')}</strong>
        {pickLang(locale, 'Propyte does not directly own the properties listed nor process payment transactions. The final commercial relationship is established between you and the corresponding developer/seller.', 'Propyte no es propietaria directa de las propiedades listadas ni procesa transacciones de pago. La relación comercial final se establece entre tú y el desarrollador/vendedor correspondiente.')}
      </p>

      <h2>{pickLang(locale, '2. Information and disclaimers', '2. Información y disclaimers')}</h2>
      <p>{pickLang(locale, 'Information about properties, prices, ROI, occupancy, and market analyses is referential. Although we work with multiple verified data sources (AirDNA, comparables, official records), the user must verify directly with the developer or seller before making decisions.', 'La información sobre propiedades, precios, ROI, ocupación y análisis de mercado es referencial. Aunque trabajamos con múltiples fuentes de datos verificadas (AirDNA, comparables, registros oficiales), el usuario debe verificar directamente con el desarrollador o vendedor antes de tomar decisiones.')}</p>
      <p>
        <strong>{pickLang(locale, 'Investment Disclaimer: ', 'Disclaimer de inversión: ')}</strong>
        {pickLang(locale, 'real estate investments imply financial, legal, and market risks. ROI, IRR, and other projected indicators are estimates based on historical data and do not guarantee future returns. Propyte does not provide regulated financial, tax, or legal advice. Consult with independent professionals before investing.', 'las inversiones inmobiliarias implican riesgos financieros, legales y de mercado. Los ROI, IRR y demás indicadores proyectados son estimaciones basadas en datos históricos y no garantizan rendimientos futuros. Propyte no presta asesoría financiera, fiscal o legal regulada. Consulta con profesionales independientes antes de invertir.')}
      </p>

      <h2>{pickLang(locale, '3. Acceptable use', '3. Uso aceptable')}</h2>
      <p>{pickLang(locale, 'You agree to use the Site lawfully and in accordance with these Terms. The following are prohibited:', 'Te comprometes a usar el Sitio conforme a la ley y a estos Términos. Está prohibido:')}</p>
      <ul>
        <li>{pickLang(locale, 'Massive automated scraping without prior written authorization', 'Hacer scraping automatizado masivo sin autorización previa por escrito')}</li>
        <li>{pickLang(locale, 'Reproducing, distributing, or commercializing content from the Site without authorization', 'Reproducir, distribuir o comercializar contenido del Sitio sin autorización')}</li>
        <li>{pickLang(locale, 'Submitting false, misleading, or third-party data without consent', 'Suplantar identidad o enviar datos falsos, engañosos o de terceros sin consentimiento')}</li>
        <li>{pickLang(locale, 'Attempting to compromise the security, integrity, or availability of the Site', 'Intentar comprometer la seguridad, integridad o disponibilidad del Sitio')}</li>
        <li>{pickLang(locale, 'Using Propyte trademarks, logos, or content without express written permission', 'Usar marcas, logotipos o contenido Propyte sin permiso expreso por escrito')}</li>
      </ul>

      <h2>{pickLang(locale, '4. Intellectual property', '4. Propiedad intelectual')}</h2>
      <p>{pickLang(locale, 'The brand "Propyte", logos, designs, software, original content, and analyses are the property of Propyte (or its licensors) and are protected by Mexican intellectual property law and applicable international treaties. Their use is allowed solely to access the services in the manner provided by the Site.', 'La marca "Propyte", logotipos, diseños, software, contenidos originales y análisis son propiedad de Propyte (o de sus licenciantes) y están protegidos por la legislación mexicana de propiedad intelectual y tratados internacionales aplicables. Su uso queda permitido únicamente para acceder a los servicios en la forma prevista por el Sitio.')}</p>

      <h2>{pickLang(locale, '5. Limitation of liability', '5. Limitación de responsabilidad')}</h2>
      <p>{pickLang(locale, 'To the maximum extent permitted by law, Propyte is not liable for:', 'En la mayor medida permitida por la ley, Propyte no es responsable por:')}</p>
      <ul>
        <li>{pickLang(locale, 'Indirect, incidental, or consequential damages arising from the use of the Site', 'Daños indirectos, incidentales o consecuentes derivados del uso del Sitio')}</li>
        <li>{pickLang(locale, 'Decisions made based on referential information', 'Decisiones tomadas con base en la información referencial')}</li>
        <li>{pickLang(locale, 'Acts or omissions of allied developers, advisors, or third parties', 'Actos u omisiones de desarrolladores aliados, asesores o terceros')}</li>
        <li>{pickLang(locale, 'Service interruptions due to scheduled maintenance, force majeure, or attacks', 'Interrupciones del servicio por mantenimiento programado, fuerza mayor o ataques')}</li>
      </ul>

      <h2>{pickLang(locale, '6. Indemnification', '6. Indemnización')}</h2>
      <p>{pickLang(locale, 'You agree to hold Propyte harmless from any third-party claim derived from your breach of these Terms or your unlawful use of the Site.', 'Te comprometes a mantener indemne a Propyte ante cualquier reclamación de terceros derivada de tu incumplimiento de estos Términos o de tu uso ilícito del Sitio.')}</p>

      <h2>{pickLang(locale, '7. Privacy', '7. Privacidad')}</h2>
      <p>
        {pickLang(locale, 'The processing of your personal data is governed by the ', 'El tratamiento de tus datos personales se rige por el ')}
        <a href={`/${locale}/privacidad`}>{pickLang(locale, 'Privacy Notice', 'Aviso de Privacidad')}</a>
        {pickLang(locale, ', which is an integral part of these Terms.', ', el cual forma parte integrante de estos Términos.')}
      </p>

      <h2>{pickLang(locale, '8. Modifications', '8. Modificaciones')}</h2>
      <p>{pickLang(locale, 'Propyte may modify these Terms at any time. Material changes will be notified via the Site. Continued use after modification implies acceptance.', 'Propyte podrá modificar estos Términos en cualquier momento. Los cambios materiales se notificarán mediante el Sitio. El uso continuado tras la modificación implica aceptación.')}</p>

      <h2>{pickLang(locale, '9. Applicable law and jurisdiction', '9. Ley aplicable y jurisdicción')}</h2>
      <p>{pickLang(locale, 'These Terms are governed by Mexican law. For any dispute, the parties submit to the courts of the city of Playa del Carmen, Quintana Roo, Mexico, expressly waiving any other jurisdiction.', 'Estos Términos se rigen por la legislación mexicana. Para cualquier controversia las partes se someten a los tribunales de la ciudad de Playa del Carmen, Quintana Roo, México, renunciando expresamente a cualquier otra jurisdicción.')}</p>

      <h2>{pickLang(locale, '10. Contact', '10. Contacto')}</h2>
      <p>
        {pickLang(locale, 'For questions about these Terms write to ', 'Para dudas sobre estos Términos escríbenos a ')}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        {pickLang(locale, ' or use the form on ', ' o usa el formulario en ')}
        <a href={`/${locale}/contacto`}>/contacto</a>.
      </p>
    </>
  );
}
