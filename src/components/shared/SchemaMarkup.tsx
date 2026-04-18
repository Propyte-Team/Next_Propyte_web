interface SchemaMarkupProps {
  type: 'organization' | 'realEstateListing' | 'localBusiness' | 'professionalService' | 'breadcrumb';
  data?: Record<string, unknown>;
}

export default function SchemaMarkup({ type, data }: SchemaMarkupProps) {
  let schema: Record<string, unknown> = {};

  switch (type) {
    case 'organization':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Propyte',
        url: 'https://propyte.com',
        logo: 'https://propyte.com/logo.png',
        description: 'Marketplace inmobiliario en la Riviera Maya con herramientas de análisis para inversionistas.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '5ta Avenida',
          addressLocality: 'Playa del Carmen',
          addressRegion: 'Quintana Roo',
          addressCountry: 'MX',
        },
        ...data,
      };
      break;
    case 'realEstateListing':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        ...data,
      };
      break;
    case 'localBusiness':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Propyte',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '5ta Avenida',
          addressLocality: 'Playa del Carmen',
          addressRegion: 'Quintana Roo',
          addressCountry: 'MX',
        },
        telephone: '+52XXXXXXXXXX',
        email: 'info@propyte.com',
        ...data,
      };
      break;
    case 'professionalService':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'Propyte MasterBroker',
        description: 'Comercialización profesional para desarrollos inmobiliarios.',
        ...data,
      };
      break;
    case 'breadcrumb':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
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
