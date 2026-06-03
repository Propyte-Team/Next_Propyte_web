import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, Building2 } from '@/lib/icons';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { pickLang } from '@/lib/i18n/pickLang';
import { formatPrice } from '@/lib/formatters';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import EmptyState from '@/components/ui/EmptyState';
import ImagePlaceholder from '@/components/shared/ImagePlaceholder';
import { CITY_MAP } from './cityConfig';

interface CityDevelopmentsPageProps {
  locale: string;
  citySlug: string;
}

export default async function CityDevelopmentsPage({ locale, citySlug }: CityDevelopmentsPageProps) {
  const cityInfo = CITY_MAP[citySlug];
  if (!cityInfo) notFound();

  const t = await getTranslations({ locale, namespace: 'cityDevelopments' });
  const supabase = createPublicSupabaseClient();

  let properties: Array<{
    id: string;
    slug: string;
    name: string;
    city: string;
    zone: string;
    state?: string;
    price_min_mxn?: number | null;
    price_mxn?: number | null;
    stage?: string;
    property_types?: string[];
    images?: string[];
    developer_name?: string;
    developer_logo_url?: string;
  }> = [];
  let count = 0;

  try {
    if (!supabase) throw new Error('No Supabase');
    const { data, count: dbCount } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select(
        'id, slug, name, city, zone, state, price_min_mxn, stage, property_types, images, developer_name, developer_logo_url',
        { count: 'exact' }
      )
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .ilike('city', `%${cityInfo.matchTerm}%`)
      .order('price_min_mxn', { ascending: false, nullsFirst: false })
      .limit(100);

    if (data && data.length > 0) {
      properties = data;
      count = dbCount || data.length;
    }
  } catch (err) {
    console.error('City developments query failed:', err);
  }

  const zoneMap: Record<string, number> = {};
  properties.forEach((p) => {
    zoneMap[p.zone || cityInfo.name] = (zoneMap[p.zone || cityInfo.name] || 0) + 1;
  });
  const zones = Object.entries(zoneMap).sort((a, b) => b[1] - a[1]);
  const withPrice = properties.filter((p) => (p.price_min_mxn || p.price_mxn || 0) > 0);
  const minPrice =
    withPrice.length > 0 ? Math.min(...withPrice.map((p) => p.price_min_mxn || p.price_mxn || 0)) : 0;

  return (
    <>
      <SchemaMarkup
        type="breadcrumb"
        data={{
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: `https://propyte.com/${locale}` },
            {
              '@type': 'ListItem',
              position: 2,
              name: t('breadcrumbDevelopments'),
              item: `https://propyte.com/${locale}/desarrollos`,
            },
            { '@type': 'ListItem', position: 3, name: cityInfo.name },
          ],
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4">
        <nav className="flex items-center gap-1 text-xs text-gray-600 mb-6">
          <Link href={`/${locale}`} className="hover:text-[#0E7490]">
            {t('breadcrumbHome')}
          </Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/desarrollos`} className="hover:text-[#0E7490]">
            {t('breadcrumbDevelopments')}
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">{cityInfo.name}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t('h1', { city: cityInfo.name })}
          </h1>
          <p className="mt-2 text-lg text-gray-600">{pickLang(locale, cityInfo.descEn, cityInfo.descEs)}</p>
        </div>

        {/* TODO(media): reemplazar por foto real de la ciudad (gestión vía Hub) */}
        <ImagePlaceholder
          icon={MapPin}
          label={`Foto de ${cityInfo.name}`}
          className="h-44 md:h-60 mb-8"
        />

        {count > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-propyte-cyan-100/60 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#0E7490]">{count}</div>
              <div className="text-xs text-gray-600">{t('stat_developments')}</div>
            </div>
            <div className="bg-propyte-cyan-100/60 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#0E7490]">{zones.length}</div>
              <div className="text-xs text-gray-600">{t('stat_zones')}</div>
            </div>
            {minPrice > 0 && (
              <div className="bg-propyte-cyan-100/60 rounded-xl p-4 text-center col-span-2">
                <div className="text-lg font-bold text-[#0E7490]">{formatPrice(minPrice)}</div>
                <div className="text-xs text-gray-600">{t('stat_startingFrom')}</div>
              </div>
            )}
          </div>
        )}

        {count === 0 && (
          <div className="rounded-2xl border border-dashed border-propyte-brand/40 bg-propyte-cyan-100/60 mb-10">
            <EmptyState
              icon={Building2}
              title={t('emptyTitle', { city: cityInfo.name })}
              description={t('emptyBody')}
              actions={[
                { label: t('emptyCta'), href: `/${locale}/contacto?asunto=lanzamientos-${citySlug}` },
                { label: t('exploreOther'), href: `/${locale}/desarrollos`, variant: 'secondary' },
              ]}
            />
          </div>
        )}

        {zones.length > 1 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {t('zonesIn', { city: cityInfo.name })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {zones.map(([zone, zoneCount]) => (
                <span key={zone} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {zone} ({zoneCount})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((dev) => (
            <Link
              key={dev.id}
              href={`/${locale}/desarrollos/${dev.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-propyte-brand/30 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {dev.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dev.images[0]} alt={dev.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 size={36} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-propyte-brand text-[#0F1923] text-xs font-bold rounded-full uppercase">
                    {dev.stage === 'preventa' ? t('stagePresale') : t('stageConstruction')}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-[#0E7490] transition-colors line-clamp-1">
                  {dev.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>
                    {dev.zone !== dev.city ? `${dev.zone}, ` : ''}
                    {dev.city}
                  </span>
                </div>
                {(dev.price_min_mxn || dev.price_mxn || 0) > 0 && (
                  <div className="mt-2 font-bold text-gray-900">
                    {t('from')}
                    {formatPrice(dev.price_min_mxn || dev.price_mxn || 0)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 prose prose-gray max-w-none">
          <h2>{t('investingIn', { city: cityInfo.name })}</h2>
          <p>
            {count > 0
              ? t('investingDescription', {
                  city: cityInfo.name,
                  state: cityInfo.state,
                  count,
                  zones: zones.length,
                })
              : t('investingDescriptionEmpty', {
                  city: cityInfo.name,
                  state: cityInfo.state,
                })}
          </p>
        </div>
      </div>
    </>
  );
}
