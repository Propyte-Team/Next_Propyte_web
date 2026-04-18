import { getTranslations } from 'next-intl/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getDevelopments } from '@/lib/supabase/queries';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import MarketplaceContent from '@/app/[locale]/propiedades/MarketplaceContent';
import type { Property } from '@/types/property';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return {
    title: isEn
      ? 'New Developments & Pre-Sales | Riviera Maya, Cancun, Tulum, Merida'
      : 'Nuevos Desarrollos y Preventas | Riviera Maya, Cancun, Tulum, Merida',
    description: isEn
      ? 'Explore new real estate developments in Cancun, Playa del Carmen, Tulum and Merida. Pre-sale prices, delivery dates, and investment analysis.'
      : 'Explora nuevos desarrollos inmobiliarios en Cancun, Playa del Carmen, Tulum y Merida. Precios de preventa, fechas de entrega y análisis de inversión.',
    alternates: {
      languages: {
        es: '/es/desarrollos',
        en: '/en/desarrollos',
        'x-default': '/es/desarrollos',
      },
    },
  };
}

export default async function DesarrollosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  let properties: Property[] = [];
  try {
    const supabase = (await createServiceRoleClient()) || (await createServerSupabaseClient());
    if (supabase) {
      const { data } = await getDevelopments(supabase, { limit: 100, orderBy: 'newest' });
      if (data) {
        properties = (data as DevelopmentRow[]).map(mapDevelopmentToProperty);
      }
    }
  } catch (error) {
    console.error('[DesarrollosPage] getDevelopments failed:', error);
  }

  return (
    <>
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: locale === 'es' ? 'Inicio' : 'Home',
              item: `https://propyte.com/${locale}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: locale === 'es' ? 'Desarrollos' : 'Developments',
              item: `https://propyte.com/${locale}/desarrollos`,
            },
          ],
        }}
      />
      <MarketplaceContent properties={properties} />
    </>
  );
}
