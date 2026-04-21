import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopmentBySlug } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const fonts = loadOGFonts();
  const isEn = locale === 'en';

  let title = isEn ? 'Real Estate Development' : 'Desarrollo Inmobiliario';
  let location = '';
  let price = '';
  let badge = '';
  let imageUrl = '';

  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const { data } = await getDevelopmentBySlug(supabase, slug);
      if (data) {
        title = data.name;
        location = [data.zone, data.city].filter(Boolean).join(', ');
        const priceMin = data.price_min_mxn || data.price_mxn;
        if (priceMin) price = isEn ? `From ${formatPrice(priceMin)}` : `Desde ${formatPrice(priceMin)}`;
        if (data.stage === 'preventa') badge = isEn ? 'Pre-sale' : 'Preventa';
        imageUrl = data.images?.[0] ?? '';
      }
    }
  } catch { /* render with defaults */ }

  return new ImageResponse(
    <OGFrame title={title} location={location} price={price} badge={badge} imageUrl={imageUrl} />,
    { ...size, fonts }
  );
}
