/**
 * SchemaMarkup — JSON-LD emitter centralizado para Propyte.
 *
 * Cubre el set definido en Manual UX/UI v1.0 §7.3:
 *   - organization (root del Home)
 *   - website (search action — habilita Sitelinks Search Box)
 *   - realEstateListing / apartment / house (detail de propiedades)
 *   - localBusiness (contacto, Real Estate Lab address per SOP Hostess §2.1)
 *   - professionalService (Propyte MasterBroker)
 *   - breadcrumb (delegado a Breadcrumbs.tsx — emite su propio JSON-LD)
 *   - faq (FAQPage genérico)
 *   - blogPosting (artículos del blog)
 *
 * AggregateRating + Review schema queda BLOQUEADO hasta dic-2026 (primer
 * MasterBroker firmado, Manual §7.1). Por ahora no se emite rating en
 * organization para evitar fabricar reseñas inexistentes.
 */
interface SchemaMarkupProps {
  type:
    | 'organization'
    | 'website'
    | 'realEstateListing'
    | 'localBusiness'
    | 'professionalService'
    | 'breadcrumb'
    | 'faq'
    | 'blogPosting';
  data?: Record<string, unknown>;
}

const ORG_NAME = 'Propyte';
const ORG_URL = 'https://propyte.com';
const ORG_LOGO = 'https://propyte.com/logo.png';
const ORG_PHONE = '+52 984 463 8032';
const ORG_EMAIL = 'info@propyte.com';
const ORG_DESCRIPTION =
  'Marketplace inmobiliario en la Riviera Maya con herramientas de análisis para inversionistas.';
const ORG_SAME_AS = [
  'https://www.instagram.com/propyte.mx/',
  'https://www.facebook.com/propyte',
];

// Real Estate Lab — domicilio canónico SOP Hostess §2.1
const REAL_ESTATE_LAB_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Calle 5 Norte 95',
  addressLocality: 'Playa del Carmen',
  addressRegion: 'Quintana Roo',
  postalCode: '77710',
  addressCountry: 'MX',
} as const;

// Razón social oficial (SOP-4.2-01 §3) — se usa en LocalBusiness.legalName
const LEGAL_NAME = 'Nativa Tulum';

export default function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  let schema: Record<string, unknown> = {};

  switch (type) {
    case 'organization':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${ORG_URL}#organization`,
        name: ORG_NAME,
        url: ORG_URL,
        logo: ORG_LOGO,
        description: ORG_DESCRIPTION,
        telephone: ORG_PHONE,
        email: ORG_EMAIL,
        address: REAL_ESTATE_LAB_ADDRESS,
        sameAs: ORG_SAME_AS,
        ...data,
      };
      break;

    case 'website':
      // WebSite + SearchAction — activa Sitelinks Search Box en Google.
      // El query placeholder {search_term_string} es estándar Schema.org.
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${ORG_URL}#website`,
        url: ORG_URL,
        name: ORG_NAME,
        description: ORG_DESCRIPTION,
        publisher: { '@id': `${ORG_URL}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${ORG_URL}/es/propiedades?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        ...data,
      };
      break;

    case 'realEstateListing':
      // RealEstateListing shape per Schema.org. El componente que lo invoque
      // pasa data con el shape específico (Apartment/House/Residence con
      // floorSize, numberOfRooms, price, priceCurrency, offers, geo, brand).
      schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        ...data,
      };
      break;

    case 'localBusiness':
      // LocalBusiness — Real Estate Lab como punto físico, con parentOrganization
      // apuntando a Organization (graph-aware). legalName = Nativa Tulum (SOP).
      schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${ORG_URL}#localbusiness`,
        name: `${ORG_NAME} · Real Estate Lab`,
        legalName: LEGAL_NAME,
        description:
          'Oficina física de Propyte (Real Estate Lab) en 5ta Avenida, Playa del Carmen, Quintana Roo.',
        url: `${ORG_URL}/es/contacto`,
        telephone: ORG_PHONE,
        email: ORG_EMAIL,
        address: REAL_ESTATE_LAB_ADDRESS,
        parentOrganization: { '@id': `${ORG_URL}#organization` },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00',
          },
        ],
        sameAs: ORG_SAME_AS,
        ...data,
      };
      break;

    case 'professionalService':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'Propyte MasterBroker',
        description: 'Comercialización profesional para desarrollos inmobiliarios.',
        provider: { '@id': `${ORG_URL}#organization` },
        ...data,
      };
      break;

    case 'breadcrumb':
      // Mantenido por compatibilidad. Para nuevas páginas, usar el componente
      // Breadcrumbs que emite UI + JSON-LD juntos.
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        ...data,
      };
      break;

    case 'faq':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        ...data,
      };
      break;

    case 'blogPosting':
      // BlogPosting shape per Schema.org. El componente del blog pasa data con
      // headline, image, datePublished, dateModified, author, publisher,
      // mainEntityOfPage. publisher por default apunta a la Organization.
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        publisher: {
          '@type': 'Organization',
          '@id': `${ORG_URL}#organization`,
          name: ORG_NAME,
          logo: {
            '@type': 'ImageObject',
            url: ORG_LOGO,
          },
        },
        ...data,
      };
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
