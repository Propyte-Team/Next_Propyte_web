import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
import { getMockUnit } from '@/lib/mocks/unit-fixtures';
import { formatPrice } from '@/lib/formatters';
import type { UnitRow } from '@/lib/mappers/unit-to-property';

export async function buildPropertyMetadata(slug: string, locale: string): Promise<Metadata> {
  let row: UnitRow | null = null;

  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const { data } = await getUnitBySlug(supabase, slug);
      if (data) row = data as UnitRow;
    }
  } catch {
    // fall through to mock
  }

  if (!row) row = getMockUnit(slug);
  if (!row) return {};

  const description = (locale === 'en' ? row.description_en : row.description_es) || '';
  const price = row.price_mxn || 0;
  const title = row.unit_number ? `${row.development_name || row.name} — ${row.unit_number}` : row.name;
  const fullTitle = price > 0 ? `${title} — ${formatPrice(price)}` : title;

  return {
    title: fullTitle,
    description: description.slice(0, 155),
    openGraph: {
      title,
      description: description.slice(0, 155),
      images: row.images?.[0] ? [{ url: row.images[0], width: 1200, height: 630 }] : [],
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
      siteName: 'Propyte',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 155),
      images: row.images?.[0] ? [row.images[0]] : [],
    },
    alternates: {
      canonical: `https://propyte.com/${locale}/propiedades/${slug}`,
      languages: {
        es: `/es/propiedades/${slug}`,
        en: `/en/propiedades/${slug}`,
        'x-default': `/es/propiedades/${slug}`,
      },
    },
  };
}
