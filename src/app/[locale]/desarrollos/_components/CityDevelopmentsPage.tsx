import { notFound } from 'next/navigation';
import { MapPin } from '@/lib/icons';
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { pickLang } from '@/lib/i18n/pickLang';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import SiteMedia from '@/components/shared/SiteMedia';
import MarketplaceContent from '@/app/[locale]/propiedades/MarketplaceContent';
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

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-4">
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
        customEyebrow={t('eyebrow', { region: cityInfo.region })}
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
