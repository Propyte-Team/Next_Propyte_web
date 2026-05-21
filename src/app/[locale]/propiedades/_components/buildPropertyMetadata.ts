import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getUnitBySlug } from '@/lib/supabase/queries';
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
    // fall through to empty metadata
  }

  if (!row) return {};

  const description = (locale === 'en' ? row.description_en : row.description_es) || '';
  const price = row.price_mxn || 0;
  // v_units expone `title` (no `name`). Mismo fallback que mapUnitToProperty para
  // evitar `undefined` en <title> HTML (que afecta SEO).
  const rowTitle = (row.title as string | null) ?? row.name ?? null;
  const base = row.unit_number
    ? `${row.development_name || rowTitle || row.slug || 'Propiedad'} — ${row.unit_number}`
    : (rowTitle || row.development_name || row.slug || 'Propiedad');
  const fullTitle = price > 0 ? `${base} — ${formatPrice(price)}` : base;

  return {
    title: fullTitle,
    description: description.slice(0, 155),
    openGraph: {
      title: base,
      description: description.slice(0, 155),
      type: 'website',
      locale: locale === 'es' ? 'es_MX' : 'en_US',
      siteName: 'Propyte',
    },
    twitter: {
      card: 'summary_large_image',
      title: base,
      description: description.slice(0, 155),
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
