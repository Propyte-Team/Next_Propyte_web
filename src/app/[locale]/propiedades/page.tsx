import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnits } from '@/lib/supabase/queries';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';
import MarketplaceContent from './MarketplaceContent';
import type { Property } from '@/types/property';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('marketplaceTitle'),
    description: t('marketplaceDescription'),
    alternates: {
      canonical: `/${locale}/propiedades`,
      languages: {
        es: '/es/propiedades',
        en: '/en/propiedades',
        'x-default': '/es/propiedades',
      },
    },
  };
}

export default async function MarketplacePage() {
  let properties: Property[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await getUnits(supabase, { limit: 100 });
      if (data) {
        properties = (data as UnitRow[]).map(mapUnitToProperty);
      }
    }
  } catch (error) {
    console.error('[MarketplacePage] getUnits failed:', error);
  }

  return <MarketplaceContent properties={properties} />;
}
