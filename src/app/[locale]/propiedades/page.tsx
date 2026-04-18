import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getDevelopments } from '@/lib/supabase/queries';
import MarketplaceContent from './MarketplaceContent';

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
  let properties: any[] = [];
  try {
    const supabase = await createServiceRoleClient() || await createServerSupabaseClient();
    if (supabase) {
      const { data } = await getDevelopments(supabase, {});
      if (data) properties = data;
    }
  } catch {
    // Supabase unavailable
  }

  return <MarketplaceContent properties={properties} />;
}
