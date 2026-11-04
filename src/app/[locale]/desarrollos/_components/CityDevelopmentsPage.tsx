import { notFound } from 'next/navigation';
import { MapPin } from '@/lib/icons';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { pickLang } from '@/lib/i18n/pickLang';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import SiteMedia from '@/components/shared/SiteMedia';
import DevelopmentsListV3 from '@/components/developments/v3/DevelopmentsListV3';
import { mapDevelopmentToProperty, type DevelopmentRow } from '@/lib/mappers/development-to-property';
import { attachDevelopmentUnitAggregates } from '@/lib/supabase/development-aggregates';
import type { Property } from '@/types/property';
import { CITY_MAP, cityMatchFilter } from './cityConfig';

interface CityDevelopmentsPageProps {
  locale: string;
  citySlug: string;
}

export default async function CityDevelopmentsPage({ locale, citySlug }: CityDevelopmentsPageProps) {
  const cityInfo = CITY_MAP[citySlug];
  if (!cityInfo) notFound();

  const [t, tA11y] = await Promise.all([
    getTranslations({ locale, namespace: 'cityDevelopments' }),
    getTranslations({ locale, namespace: 'a11y' }),
  ]);
  const supabase = createPublicSupabaseClient();

  let properties: Property[] = [];
  let count = 0;
  let zonesCount = 0;

  try {
    if (!supabase) throw new Error('No Supabase');
    // OR de ILIKE sobre todas las variantes de escritura: ILIKE es
    // accent-SENSITIVE, así que un solo término sin acento devolvía 0 filas
    // (ver cityConfig.ts). Seleccionamos `*` para que mapDevelopmentToProperty
    // tenga todos los campos que la card necesita.
    const { data, error } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('*')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .or(cityMatchFilter(cityInfo.name))
      .order('price_min_mxn', { ascending: false, nullsFirst: false })
      .limit(100);

    // Sin esto un fallo de PostgREST se veía idéntico a "no hay desarrollos":
    // 0 resultados, sin excepción y sin una línea en el log. La página se
    // prerenderiza con revalidate=3600, así que un error en build deja la ciudad
    // vacía por una hora.
    if (error) {
      console.error(`[CityDevelopmentsPage:${citySlug}] query failed:`, error.message);
    }

    if (data && data.length > 0) {
      const rows = data as DevelopmentRow[];
      count = rows.length;
      zonesCount = new Set(rows.map((d) => d.zone).filter(Boolean)).size;
      // Mismos agregados de v_units que /desarrollos: recámaras, tipos de
      // unidad del inventario y área mínima. Sin esto las cards de ciudad
      // quedaban sin ninguno de los tres.
      await attachDevelopmentUnitAggregates(supabase, rows);
      properties = rows.map((d) => mapDevelopmentToProperty(d, locale));
    }
  } catch (err) {
    console.error('City developments query failed:', err);
  }

  return (
    <>
      <Breadcrumbs
        locale={locale}
        homeLabel={t('breadcrumbHome')}
        ariaLabel={tA11y('breadcrumbLabel')}
        items={[
          { label: t('breadcrumbDevelopments'), href: `/${locale}/desarrollos` },
          { label: cityInfo.name },
        ]}
      />

      {/* Mismas tarjetas y filtros que /desarrollos, ya filtrado a la ciudad.
          La foto de la ciudad (Hub › Materiales, slot city.<slug>) va a sangre
          entre el encabezado y los filtros. */}
      <DevelopmentsListV3
        properties={properties}
        title={t('h1', { city: cityInfo.name })}
        lead={pickLang(locale, cityInfo.descEn, cityInfo.descEs)}
        lockedCity
      >
        <div className="px-4 lg:px-10 pb-8 lg:pb-12">
          <SiteMedia
            mediaKey={`city.${citySlug}`}
            locale={locale}
            icon={MapPin}
            label={`Foto de ${cityInfo.name}`}
            className="h-48 md:h-[420px] rounded-md"
            sizes="100vw"
            priority
          />
        </div>
      </DevelopmentsListV3>

      {/* SEO prose */}
      <div className="px-4 lg:px-10 pb-20 lg:pb-28 border-t border-black/10 pt-12 lg:pt-16">
        <div className="max-w-[720px] text-[#13222C]">
          <h2 className="font-display text-[28px] lg:text-[40px] leading-[1.05] font-semibold tracking-[-0.03em]">{t('investingIn', { city: cityInfo.name })}</h2>
          <p className="mt-4 text-[16px] lg:text-[17px] leading-[1.6] text-[#5B6B74]">
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
