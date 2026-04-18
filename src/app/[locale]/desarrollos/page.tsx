import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProperties } from '@/lib/supabase/queries';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import DesarrollosPageContent from './DesarrollosPageContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return {
    title: isEn
      ? 'New Developments & Pre-Sales | Riviera Maya, Cancun, Tulum, Merida'
      : 'Nuevos Desarrollos y Preventas | Riviera Maya, Cancun, Tulum, Merida',
    description: isEn
      ? 'Explore 700+ new real estate developments in Cancun, Playa del Carmen, Tulum, and Merida. Pre-sale prices, delivery dates, and investment analysis.'
      : 'Explora 700+ nuevos desarrollos inmobiliarios en Cancun, Playa del Carmen, Tulum y Merida. Precios de preventa, fechas de entrega y analisis de inversion.',
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

  // Try Supabase, fall back to static data
  let properties: Record<string, unknown>[] = [];
  let totalCount = 0;
  let cities: { city: string; count: number }[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, count } = await getProperties(supabase, {
      limit: 50,
      orderBy: 'newest',
    });

    if (data && data.length > 0) {
      properties = data;
      totalCount = count || data.length;

      const { data: cityCounts } = await supabase
        .from('properties')
        .select('city')
        .eq('published', true);

      const cityMap: Record<string, number> = {};
      cityCounts?.forEach((r: { city: string }) => { cityMap[r.city] = (cityMap[r.city] || 0) + 1; });
      cities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count }));
    } else {
      throw new Error('No data from Supabase');
    }
  } catch {
    // Supabase unavailable — render empty state
    properties = [];
    totalCount = 0;
    cities = [];
  }

  return (
    <>
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `https://propyte.com/${locale}` },
            { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Desarrollos' : 'Developments', item: `https://propyte.com/${locale}/desarrollos` },
          ],
        }}
      />
      <DesarrollosPageContent
        properties={properties as any[]}
        totalCount={totalCount}
        cities={cities}
        locale={locale}
      />
    </>
  );
}
