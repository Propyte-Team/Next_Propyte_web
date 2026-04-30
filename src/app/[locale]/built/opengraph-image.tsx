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
      title={isEn ? 'Build with Propyte' : 'Construye con Propyte'}
      location={isEn ? 'Architecture & Construction' : 'Arquitectura & Construcción'}
      badge={isEn ? '45+ projects · 18 years' : '45+ proyectos · 18 años'}
    />,
    { ...size, fonts },
  );
}
