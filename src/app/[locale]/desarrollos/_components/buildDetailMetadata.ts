import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getDevelopmentBySlug } from '@/lib/supabase/queries';
import { formatPrice } from '@/lib/formatters';

/**
 * Metadata builder for development detail pages (/desarrollos/[slug]).
 * Fetches the development to build title/description/OG with real data.
 */
export async function buildDetailMetadata(slug: string, locale: string): Promise<Metadata> {
  const isEn = locale === 'en';
  const supabase = createPublicSupabaseClient();
  if (!supabase) return {};

  try {
    const { data: property } = await getDevelopmentBySlug(supabase, slug);
    if (!property) return {};

    const title = isEn
      ? `${property.name} — ${property.city} | Pre-sale ${property.stage === 'preventa' ? 'Prices' : 'Now'}`
      : `${property.name} — ${property.city} | ${property.stage === 'preventa' ? 'Preventa' : 'En Construccion'}`;

    const priceMin = property.price_min_mxn || property.price_mxn || 0;
    const description = isEn
      ? property.description_en ||
        `${property.name} in ${property.zone || ''}, ${property.city}. ${priceMin > 0 ? `From ${formatPrice(priceMin)}.` : ''} Pre-sale opportunity in Riviera Maya.`
      : property.description_es ||
        `${property.name} en ${property.zone || ''}, ${property.city}. ${priceMin > 0 ? `Desde ${formatPrice(priceMin)}.` : ''} Oportunidad de preventa.`;

    return {
      title,
      description: description.slice(0, 155),
      openGraph: {
        title: property.name,
        description,
        type: 'website',
        locale: isEn ? 'en_US' : 'es_MX',
      },
      twitter: {
        card: 'summary_large_image',
        title: property.name,
        description,
      },
      alternates: {
        languages: {
          es: `/es/desarrollos/${slug}`,
          en: `/en/desarrollos/${slug}`,
          'x-default': `/es/desarrollos/${slug}`,
        },
      },
    };
  } catch (err) {
    console.error('buildDetailMetadata failed:', err);
    return {};
  }
}
