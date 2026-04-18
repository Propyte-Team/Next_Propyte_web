import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/formatters';
import PropertyPageContent from './PropertyPageContent';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnitBySlug, getRentalEstimate, getAirdnaMarketSummary } from '@/lib/supabase/queries';
import { CITY_TO_AIRDNA } from '@/lib/calculator';
import { mapUnitToProperty, type UnitRow } from '@/lib/mappers/unit-to-property';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_units')
      .select('slug')
      .limit(1000);
    return (data || []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: property } = await getUnitBySlug(supabase, slug);
    if (!property) return {};

    const description = (locale === 'en' ? property.description_en : property.description_es) || '';
    const price = property.price_mxn || 0;

    return {
      title: price > 0 ? `${property.name} — ${formatPrice(price)}` : property.name,
      description: description.slice(0, 155),
      openGraph: {
        title: property.name,
        description,
        images: property.images?.[0] ? [{ url: property.images[0], width: 800, height: 450 }] : [],
        type: 'website',
        locale: locale === 'es' ? 'es_MX' : 'en_US',
      },
      alternates: {
        languages: {
          es: `/es/propiedades/${slug}`,
          en: `/en/propiedades/${slug}`,
          'x-default': `/es/propiedades/${slug}`,
        },
      },
    };
  } catch {
    return {};
  }
}

export default async function PropertyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  let row: UnitRow | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await getUnitBySlug(supabase, slug);
    if (data) row = data as UnitRow;
  } catch (err) {
    console.error('Unit query failed:', err);
  }

  if (!row) notFound();
  const property = mapUnitToProperty(row);

  // Fetch rental estimate + AirDNA market data
  let smartRentEstimate: number | null = null;
  let smartRentEstimateVac: number | null = null;
  let totalComparables = 0;
  let dataFreshness: string | null = null;
  let airdnaOccupancy: number | undefined;
  let airdnaAdr: number | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const propType = property.specs.type || 'departamento';
      const city = property.location.city;
      const zone = property.location.zone;
      const bedrooms = property.specs.bedrooms;
      const area = property.specs.area;
      const airdnaMarket = CITY_TO_AIRDNA[city] || '';
      const [result, vacResult, countResult, airdnaResult] = await Promise.all([
        getRentalEstimate(supabase, city, propType, bedrooms, zone, 'residencial'),
        getRentalEstimate(supabase, city, propType, bedrooms, zone, 'vacacional'),
        supabase.from('rental_comparables').select('id', { count: 'exact', head: true }).eq('active', true),
        airdnaMarket ? getAirdnaMarketSummary(supabase, airdnaMarket) : Promise.resolve(null),
      ]);
      if (result.data) {
        if (result.data.avg_rent_per_m2 && result.data.avg_rent_per_m2 > 0 && area > 0) {
          smartRentEstimate = Math.round(result.data.avg_rent_per_m2 * area);
        } else {
          smartRentEstimate = result.data.median_rent_mxn;
        }
        dataFreshness = result.data.last_updated;
      }
      if (vacResult.data) {
        smartRentEstimateVac = vacResult.data.median_rent_mxn;
      }
      if (countResult.count) totalComparables = countResult.count;
      if (airdnaResult) {
        airdnaOccupancy = airdnaResult.current_occupancy ?? undefined;
        const bedKey = `${bedrooms}_bedroom`;
        airdnaAdr = airdnaResult.adr_by_beds?.[bedKey] ?? airdnaResult.current_adr ?? undefined;
      }
    }
  } catch (err) {
    console.error('Rental estimate fetch failed:', err);
  }

  return (
    <>
      <SchemaMarkup
        type="realEstateListing"
        data={{
          name: property.name,
          description: property.description[locale as 'es' | 'en'] || property.description.es || '',
          url: `https://propyte.com/${locale}/propiedades/${slug}`,
          image: property.images?.[0],
          ...(property.price.mxn > 0 && {
            offers: {
              '@type': 'Offer',
              price: property.price.mxn,
              priceCurrency: 'MXN',
            },
          }),
          address: {
            '@type': 'PostalAddress',
            addressLocality: property.location.city,
            addressRegion: property.location.state,
            addressCountry: 'MX',
          },
        }}
      />
      <PropertyPageContent
        property={property}
        similar={[]}
        locale={locale}
        smartRentEstimate={smartRentEstimate}
        smartRentEstimateVac={smartRentEstimateVac}
        totalComparables={totalComparables}
        dataFreshness={dataFreshness}
        airdnaOccupancy={airdnaOccupancy}
        airdnaAdr={airdnaAdr}
      />
    </>
  );
}
