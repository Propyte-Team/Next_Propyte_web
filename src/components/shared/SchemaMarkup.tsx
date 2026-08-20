/**
 * SchemaMarkup — JSON-LD emitter centralizado para Propyte.
 *
 * Cubre el set definido en Manual UX/UI v1.0 §7.3:
 *   - organization (root del Home)
 *   - website (search action — habilita Sitelinks Search Box)
 *   - realEstateListing / apartment / house (detail de propiedades)
 *   - localBusiness (contacto — emite RealEstateAgent, subtipo de LocalBusiness)
 *   - professionalService (Propyte MasterBroker)
 *
 * El NAP (nombre, dirección, teléfono, geo, ficha de Maps) NO se hardcodea aquí:
 * sale de `@/lib/seo/nap`, la fuente única. Ver ese módulo antes de tocar
 * cualquier dato de contacto.
 *   - breadcrumb (delegado a Breadcrumbs.tsx — emite su propio JSON-LD)
 *   - faq (FAQPage genérico)
 *   - blogPosting (artículos del blog)
 *
 * AggregateRating + Review schema queda BLOQUEADO hasta dic-2026 (primer
 * MasterBroker firmado, Manual §7.1). Por ahora no se emite rating en
 * organization para evitar fabricar reseñas inexistentes.
 */
import {
  NAP_NAME,
  NAP_LEGAL_NAME,
  NAP_PHONE,
  NAP_EMAIL,
  NAP_ADDRESS,
  NAP_GEO,
  NAP_SAME_AS,
  NAP_OPENING_HOURS,
  NAP_AREA_SERVED,
  GBP_URL,
} from '@/lib/seo/nap';

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

const ORG_NAME = NAP_NAME;
const ORG_URL = 'https://propyte.com';
const ORG_LOGO = 'https://propyte.com/logo.png';
const ORG_PHONE = NAP_PHONE;
const ORG_EMAIL = NAP_EMAIL;
const ORG_DESCRIPTION =
  'Marketplace inmobiliario en la Riviera Maya con herramientas de análisis para inversionistas.';
const ORG_SAME_AS = [...NAP_SAME_AS];

// Domicilio canónico — espejo de la ficha verificada. Ver `@/lib/seo/nap`.
const REAL_ESTATE_LAB_ADDRESS = NAP_ADDRESS;

// Razón social oficial (SOP-4.2-01 §3) — se usa en LocalBusiness.legalName
const LEGAL_NAME = NAP_LEGAL_NAME;

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
      // RealEstateAgent — subtipo de LocalBusiness. Es más específico y le dice
      // a Google QUÉ somos, no solo que existimos. parentOrganization enlaza al
      // nodo Organization (graph-aware). legalName = Nativa Tulum (SOP).
      //
      // `geo` + `hasMap` + `sameAs` → ficha de Google Business Profile son las
      // señales que atan este sitio a ese pin de Maps. Sin ellas Google tiene
      // que adivinar que la web y la ficha son la misma entidad.
      schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': `${ORG_URL}#localbusiness`,
        name: `${ORG_NAME} · Real Estate Lab`,
        legalName: LEGAL_NAME,
        description:
          'Oficina física de Propyte (Real Estate Lab) en 5ta Avenida esquina Calle 40 Norte, Playa del Carmen, Quintana Roo.',
        url: `${ORG_URL}/es/contacto`,
        image: ORG_LOGO,
        telephone: ORG_PHONE,
        email: ORG_EMAIL,
        address: REAL_ESTATE_LAB_ADDRESS,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: NAP_GEO.latitude,
          longitude: NAP_GEO.longitude,
        },
        hasMap: GBP_URL,
        areaServed: NAP_AREA_SERVED.map((name) => ({ '@type': 'Place', name })),
        parentOrganization: { '@id': `${ORG_URL}#organization` },
        openingHoursSpecification: NAP_OPENING_HOURS,
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
