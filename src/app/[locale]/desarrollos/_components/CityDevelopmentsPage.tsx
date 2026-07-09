import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin } from '@/lib/icons';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { pickLang } from '@/lib/i18n/pickLang';
import SchemaMarkup from '@/components/shared/SchemaMarkup';
import SiteMedia from '@/components/shared/SiteMedia';
import MarketplaceContent from '@/app/[locale]/propiedades/MarketplaceContent';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
import type { Property } from '@/types/property';
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

  let properties: Property[] = [];
  let count = 0;
  let zonesCount = 0;

  try {
    if (!supabase) throw new Error('No Supabase');
    // ILIKE sobre matchTerm (accent-insensitive): la columna `city` tiene ambas
    // variantes (Cancun/Cancún), por eso NO usamos eq. Seleccionamos `*` para que
    // mapDevelopmentToProperty tenga todos los campos que la card necesita.
    const { data } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('*')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .ilike('city', `%${cityInfo.matchTerm}%`)
      .order('price_min_mxn', { ascending: false, nullsFirst: false })
      .limit(100);

    if (data && data.length > 0) {
      const rows = data as DevelopmentRow[];
      count = rows.length;
      zonesCount = new Set(rows.map((d) => d.zone).filter(Boolean)).size;
      properties = rows.map((d) => mapDevelopmentToProperty(d, locale));
    }
  } catch (err) {
    console.error('City developments query failed:', err);
  }

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

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4">
        <nav className="flex items-center gap-1 text-xs text-gray-600 mb-4">
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

        {/* Foto de la ciudad — gestionada en Hub › Materiales (slot city.<slug>); fallback a placeholder */}
        <SiteMedia
          mediaKey={`city.${citySlug}`}
          locale={locale}
          icon={MapPin}
          label={`Foto de ${cityInfo.name}`}
          className="h-40 md:h-56"
          sizes="(max-width: 768px) 100vw, 1232px"
          priority
        />
      </div>

      {/* Mismas cards + filtro que /desarrollos, pre-filtrado a la ciudad */}
      <MarketplaceContent
        properties={properties}
        customTitle={t('h1', { city: cityInfo.name })}
        customSubtitle={pickLang(locale, cityInfo.descEn, cityInfo.descEs)}
      />

      {/* SEO prose */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pb-16">
        <div className="prose prose-gray max-w-none">
          <h2>{t('investingIn', { city: cityInfo.name })}</h2>
          <p>
            {count > 0
              ? t('investingDescription', {
                  city: cityInfo.name,
                  state: cityInfo.state,
                  count,
                  zones: zonesCount,
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
