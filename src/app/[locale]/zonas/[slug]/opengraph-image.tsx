import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';
import { MARKET_SUBMARKET_TO_ZONE } from '@/lib/calculator';
import { zoneSlug } from '@/lib/utils';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Misma fuente que page.tsx — mantener slug→zoneName en sync.
const ZONE_CONFIGS = Object.entries(MARKET_SUBMARKET_TO_ZONE).map(([, zone]) => ({
  slug: zoneSlug(zone),
  zone,
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

  return new ImageResponse(
    <OGFrame
      title={zoneName}
      location={isEn ? 'Zone analysis · Riviera Maya' : 'Análisis de zona · Riviera Maya'}
      badge={isEn ? 'Market data' : 'Datos de mercado'}
    />,
    { ...size, fonts }
  );
}
