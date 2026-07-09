import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';
import { MARKET_SUBMARKET_TO_ZONE, MARKET_SUBMARKET_TO_CITY } from '@/lib/calculator';
import { zoneSlug } from '@/lib/utils';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Region label per city — CDMX/Mérida/Akumal are not "Riviera Maya".
const REGION_LABEL: Record<string, { es: string; en: string }> = {
  'Cancun': { es: 'Riviera Maya', en: 'Riviera Maya' },
  'Playa del Carmen': { es: 'Riviera Maya', en: 'Riviera Maya' },
  'Tulum': { es: 'Riviera Maya', en: 'Riviera Maya' },
  'Akumal': { es: 'Riviera Maya', en: 'Riviera Maya' },
  'CDMX': { es: 'Ciudad de México', en: 'Mexico City' },
  'Merida': { es: 'Yucatán', en: 'Yucatan' },
};

// Misma fuente que page.tsx — mantener slug→zoneName en sync.
const ZONE_CONFIGS = Object.entries(MARKET_SUBMARKET_TO_ZONE).map(([sub, zone]) => ({
  slug: zoneSlug(zone),
  zone,
  city: MARKET_SUBMARKET_TO_CITY[sub] || 'Cancun',
}));

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const fonts = loadOGFonts();
  const isEn = locale === 'en';

  const zoneConfig = ZONE_CONFIGS.find((z) => z.slug === slug);
  const zoneName = zoneConfig?.zone || slug.replace(/-/g, ' ');
  const region = REGION_LABEL[zoneConfig?.city || 'Cancun'] || REGION_LABEL['Cancun'];

  return new ImageResponse(
    <OGFrame
      title={zoneName}
      location={isEn ? `Zone analysis · ${region.en}` : `Análisis de zona · ${region.es}`}
      badge={isEn ? 'Market data' : 'Datos de mercado'}
    />,
    { ...size, fonts }
  );
}
