import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const fonts = loadOGFonts();
  const isEn = locale === 'en';

  return new ImageResponse(
    <OGFrame
      title={isEn ? 'Propyte Team — bilingual advisors' : 'Equipo Propyte — asesores bilingües'}
      location={isEn ? 'Riviera Maya & Yucatán' : 'Riviera Maya y Yucatán'}
      badge={isEn ? 'Without pressure' : 'Sin presión'}
    />,
    { ...size, fonts }
  );
}
