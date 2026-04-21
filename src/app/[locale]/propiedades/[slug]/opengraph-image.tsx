import { ImageResponse } from 'next/og';
import { loadOGFonts } from '@/lib/og/fonts';
import OGFrame from '@/lib/og/OGFrame';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
import { getMockUnit } from '@/lib/mocks/unit-fixtures';
import { formatPrice } from '@/lib/formatters';
import type { UnitRow } from '@/lib/mappers/unit-to-property';

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

  let title = isEn ? 'Property' : 'Propiedad';
  let location = '';
  let price = '';
  let badge = '';
  let imageUrl = '';

  try {
    let row: UnitRow | null = null;
    try {
      const supabase = createPublicSupabaseClient();
      if (supabase) {
        const { data } = await getUnitBySlug(supabase, slug);
        if (data) row = data as UnitRow;
      }
    } catch { /* fallback to mock */ }
    if (!row) row = getMockUnit(slug);

    if (row) {
      title = row.development_name || row.name;
      location = [row.zone, row.city].filter(Boolean).join(', ');
      if (row.price_mxn) price = formatPrice(row.price_mxn);
      if (row.unit_type) {
        badge = row.unit_type;
      } else if (row.unit_number) {
        badge = row.unit_number;
      }
      imageUrl = row.images?.[0] ?? '';
    }
  } catch { /* render with defaults */ }

  return new ImageResponse(
    <OGFrame title={title} location={location} price={price} badge={badge} imageUrl={imageUrl} />,
    { ...size, fonts }
  );
}
