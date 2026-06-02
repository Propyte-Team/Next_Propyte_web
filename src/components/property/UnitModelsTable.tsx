'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import { useCurrency } from '@/context/CurrencyContext';
import { useUnits, m2ToSqft } from '@/lib/units-context';
import { normalizeI18nKey } from '@/lib/i18n/normalizeKey';
import { translateTypology } from '@/lib/i18n/typology';
import DiscountBadge from '@/components/ui/DiscountBadge';

interface Unit {
  id: string;
  slug?: string | null;
  unit_number?: string;
  typology?: string;
  unit_type: string;
  unit_subtype?: string | null;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  price_mxn: number;
  price_usd?: number;
  status: string;
  floor?: number;
  has_pool?: boolean;
  // Discount fields (v_units 2026-05-22). Opcionales — sólo render cuando
  // is_discount_active = true; el resto de unidades muestra la celda en blanco.
  discount_price_mxn?: number | string | null;
  discount_pct?: number | string | null;
  is_discount_active?: boolean | null;
}

interface MlEstimate {
  unit_type: string;
  bedrooms: number;
  estimated_rent_residencial: number | null;
  estimated_rent_vacacional: number | null;
  confidence_score: number | null;
}

interface UnitModelsTableProps {
  units: Unit[];
  mlEstimates: MlEstimate[];
  locale: string;
}

const statusStyles: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  apartada: 'bg-yellow-100 text-yellow-700',
  reservado: 'bg-yellow-100 text-yellow-700',
  vendida: 'bg-red-100 text-red-700',
  vendido: 'bg-red-100 text-red-700',
  no_disponible: 'bg-gray-100 text-gray-600',
};

function findRentEstimate(unit: Unit, mlEstimates: MlEstimate[]): number | null {
  const match = mlEstimates.find(
    (e) => e.unit_type === unit.unit_type && e.bedrooms === unit.bedrooms
  );
  return match?.estimated_rent_residencial || match?.estimated_rent_vacacional || null;
}

// Precio referencial: equivalente USD del precio MXN. Usa price_usd de BD
// si está disponible (más preciso); si no, calcula con el rate del context.
function formatReferencialUsd(unit: Unit, rate: number): string {
  const usd = unit.price_usd && unit.price_usd > 0
    ? unit.price_usd
    : unit.price_mxn > 0 ? Math.round(unit.price_mxn / rate) : 0;
  if (usd <= 0) return '—';
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(usd)} USD`;
}

export default function UnitModelsTable({ units, mlEstimates, locale }: UnitModelsTableProps) {
  const router = useRouter();
  const t = useTranslations('unitModels');
  const tAvail = useTranslations('availability');
  const tTypes = useTranslations('types');
  const { rate } = useCurrency();
  // `unit` ya es la variable de cada fila en el map; aliaseo la unidad de área.
  const { unit: areaUnit } = useUnits();
  // Aún silencio el lint del param `mlEstimates` por compat de signature externa;
  // el cálculo de renta queda preservado para futuros usos.
  void mlEstimates;
  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';

  if (units.length === 0) return null;

  // Columna "Descuento" solo aparece si AL MENOS UNA unidad la tiene activa.
  // Evita columna vacía + ruido visual en desarrollos sin descuentos.
  const anyDiscount = units.some((u) => u.is_discount_active === true);

  // Label de "Tipo" en la tabla de modelos:
  // 1. Si la unidad tiene `unit_subtype` poblado (Penthouse, Pentgarden,
  //    Loft, etc.), úsalo crudo — esa es la info más específica.
  // 2. Si no, normalizar `unit_type` (BD trae "Departamento" Capitalized
  //    desde Zoho) y traducir vía i18n. El getMessageFallback global en
  //    request.ts humaniza si la key falta — no rompe SSR.
  const typeLabel = (unit: Unit) => {
    if (unit.unit_subtype && unit.unit_subtype.trim().length > 0) {
      return unit.unit_subtype;
    }
    const key = normalizeI18nKey(unit.unit_type);
    if (!key) return '—';
    if (key === 'departamento') return tTypes('departamentoShort');
    return tTypes(key as 'departamento');
  };

  const statusLabel = (status: string) => {
    const key = normalizeI18nKey(status);
    if (!key) return '—';
    return tAvail(key as 'disponible');
  };

  const unitHref = (unit: Unit) =>
    unit.slug ? `/${locale}/propiedades/${unit.slug}` : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('title')}
        <span className="ml-2 text-sm font-normal text-gray-600">
          ({units.length} {t('unitsSuffix')})
        </span>
      </h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-3 py-3">{t('model')}</th>
              <th className="px-3 py-3">{t('type')}</th>
              <th className="px-2 py-3 text-center">{t('beds')}</th>
              <th className="px-2 py-3 text-center">{t('baths')}</th>
              <th className="px-2 py-3 text-right">{areaUnit === 'm2' ? 'm²' : 'sqft'}</th>
              <th className="px-3 py-3 text-right">{t('price')}</th>
              {anyDiscount && (
                <th className="px-2 py-3 text-right text-[#0E7490]">{t('discountShort')}</th>
              )}
              <th className="px-3 py-3 text-right">
                {locale === 'en' ? 'Ref.' : 'Ref.'}
              </th>
              <th className="px-3 py-3 text-center">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {units.map((unit) => {
              const referencial = formatReferencialUsd(unit, rate);
              const status = unit.status || 'disponible';
              const href = unitHref(unit);
              const isClickable = !!href;
              const rowLabel = unit.unit_number || translateTypology(unit.typology, locale) || t('model');
              const isDiscounted = unit.is_discount_active === true;
              const discountPrice = Number(unit.discount_price_mxn);
              const discountPctNum = Math.round(Number(unit.discount_pct) || 0);
              return (
                <tr
                  key={unit.id}
                  role={isClickable ? 'link' : undefined}
                  aria-label={isClickable ? `${rowLabel} — ${formatPrice(unit.price_mxn)}` : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? () => router.push(href!) : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(href!);
                          }
                        }
                      : undefined
                  }
                  className={`transition-colors ${
                    isDiscounted
                      ? 'bg-[#0E7490]/8 hover:bg-[#0E7490]/14 ' + (isClickable ? 'cursor-pointer focus:bg-[#0E7490]/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]/40' : '')
                      : isClickable
                        ? 'hover:bg-[#5CE0D2]/5 cursor-pointer focus:bg-[#5CE0D2]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]/40'
                        : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="px-3 py-3 font-semibold text-gray-900">
                    {href ? (
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0E7490] hover:text-[#4BCEC0] underline-offset-2 hover:underline"
                      >
                        {translateTypology(unit.typology, locale) || unit.unit_number || '—'}
                      </Link>
                    ) : (
                      translateTypology(unit.typology, locale) || unit.unit_number || '—'
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{typeLabel(unit)}</td>
                  <td className="px-2 py-3 text-center text-gray-700">{unit.bedrooms}</td>
                  <td className="px-2 py-3 text-center text-gray-700">{unit.bathrooms}</td>
                  <td className="px-2 py-3 text-right text-gray-700">{(areaUnit === 'm2' ? unit.area_m2 : m2ToSqft(unit.area_m2))?.toLocaleString(intlLocale)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {unit.price_mxn > 0 ? (
                      isDiscounted && discountPrice > 0 ? (
                        <>
                          <span className="block text-xs text-gray-500 line-through decoration-[#0E7490] decoration-2">
                            {formatPrice(unit.price_mxn)}
                          </span>
                          <span className="block text-[#0E7490]">{formatPrice(discountPrice)}</span>
                        </>
                      ) : (
                        <span className="text-gray-900">{formatPrice(unit.price_mxn)}</span>
                      )
                    ) : '—'}
                  </td>
                  {anyDiscount && (
                    <td className="px-2 py-3 text-right tabular-nums">
                      {isDiscounted && discountPctNum > 0 ? (
                        <DiscountBadge variant="inline" pct={discountPctNum} />
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-gray-500 font-medium">
                    {referencial}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-2xs font-bold rounded-full uppercase ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel(status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {units.map((unit) => {
          const referencial = formatReferencialUsd(unit, rate);
          const status = unit.status || 'disponible';
          const href = unitHref(unit);
          const isDiscounted = unit.is_discount_active === true;
          const discountPrice = Number(unit.discount_price_mxn);
          const discountPctNum = Math.round(Number(unit.discount_pct) || 0);

          const cardBody = (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">
                  {translateTypology(unit.typology, locale) || unit.unit_number || '—'}
                </span>
                <span className={`px-2 py-0.5 text-2xs font-bold rounded-full uppercase ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel(status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">{t('type')}</div>
                <div className="text-right text-gray-700">{typeLabel(unit)}</div>
                <div className="text-gray-600">{t('bedsBaths')}</div>
                <div className="text-right text-gray-700">{unit.bedrooms} / {unit.bathrooms}</div>
                <div className="text-gray-600">{areaUnit === 'm2' ? 'm²' : 'sqft'}</div>
                <div className="text-right text-gray-700">{(areaUnit === 'm2' ? unit.area_m2 : m2ToSqft(unit.area_m2))?.toLocaleString(intlLocale)}</div>
                <div className="text-gray-600">{t('price')}</div>
                <div className="text-right font-bold text-gray-900 tabular-nums">
                  {unit.price_mxn > 0 ? (
                    isDiscounted && discountPrice > 0 ? (
                      <>
                        <span className="block text-xs text-gray-500 line-through decoration-[#0E7490] decoration-2 font-normal">
                          {formatPrice(unit.price_mxn)}
                        </span>
                        <span className="text-[#0E7490]">{formatPrice(discountPrice)}</span>
                      </>
                    ) : formatPrice(unit.price_mxn)
                  ) : '—'}
                </div>
                {isDiscounted && discountPctNum > 0 && (
                  <>
                    <div className="text-gray-600">{t('discount')}</div>
                    <div className="text-right">
                      <DiscountBadge variant="inline" pct={discountPctNum} />
                    </div>
                  </>
                )}
                {referencial !== '—' && (
                  <>
                    <div className="text-gray-600">
                      {locale === 'en' ? 'Ref. price' : 'Precio Ref.'}
                    </div>
                    <div className="text-right text-gray-500 font-medium">{referencial}</div>
                  </>
                )}
              </div>
            </>
          );

          // Mobile card también resalta en cyan brand cuando hay descuento.
          const containerCls = isDiscounted
            ? 'block bg-[#0E7490]/8 border border-[#0E7490]/30 rounded-xl p-4 hover:border-[#0E7490]/60 hover:shadow-sm transition-all active:scale-[0.99]'
            : 'block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#5CE0D2] hover:shadow-sm transition-all active:scale-[0.99]';

          return href ? (
            <Link key={unit.id} href={href} className={containerCls}>
              {cardBody}
            </Link>
          ) : (
            <div key={unit.id} className={containerCls}>
              {cardBody}
            </div>
          );
        })}
      </div>
    </div>
  );
}
