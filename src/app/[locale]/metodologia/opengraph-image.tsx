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
      title={
        isEn
          ? 'SOP-3.2 Scorecard: how we validate a development'
          : 'Scorecard SOP-3.2: cómo validamos un desarrollo'
      }
      location={isEn ? 'Propyte methodology' : 'Metodología Propyte'}
      badge={isEn ? 'Documented · auditable' : 'Documentado · auditable'}
    />,
    { ...size, fonts }
  );
}
