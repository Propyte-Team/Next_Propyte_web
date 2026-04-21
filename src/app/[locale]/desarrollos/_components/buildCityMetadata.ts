import type { Metadata } from 'next';
import { CITY_MAP } from './cityConfig';

/**
 * Metadata builder shared by the 4 city thin-wrapper pages
 * (cancun, playa-del-carmen, tulum, merida).
 */
export function buildCityMetadata(citySlug: string, locale: string): Metadata {
  const city = CITY_MAP[citySlug];
  if (!city) return {};
  const isEn = locale === 'en';
  return {
    title: isEn
      ? `New Developments in ${city.name}, ${city.state} | Pre-Sales & Prices`
      : `Nuevos Desarrollos en ${city.name}, ${city.state} | Preventas y Precios`,
    description: isEn ? city.descEn : city.descEs,
    openGraph: {
      locale: isEn ? 'en_US' : 'es_MX',
      alternateLocale: isEn ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    alternates: {
      languages: {
        es: `/es/desarrollos/${citySlug}`,
        en: `/en/desarrollos/${citySlug}`,
        'x-default': `/es/desarrollos/${citySlug}`,
      },
    },
  };
}
