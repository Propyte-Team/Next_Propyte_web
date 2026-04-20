'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';

interface Unit {
  id: string;
  slug?: string | null;
  unit_number?: string;
  typology?: string;
  unit_type: string;
  bedrooms: number;
  bathrooms: number;
  area_m2: number;
  price_mxn: number;
  price_usd?: number;
  status: string;
  floor?: number;
  has_pool?: boolean;
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
  no_disponible: 'bg-gray-100 text-gray-500',
};

function findRentEstimate(unit: Unit, mlEstimates: MlEstimate[]): number | null {
  const match = mlEstimates.find(
    (e) => e.unit_type === unit.unit_type && e.bedrooms === unit.bedrooms
  );
  return match?.estimated_rent_residencial || match?.estimated_rent_vacacional || null;
}

export default function UnitModelsTable({ units, mlEstimates, locale }: UnitModelsTableProps) {
  const router = useRouter();
  const t = useTranslations('unitModels');
  const tAvail = useTranslations('availability');
  const tTypes = useTranslations('types');
  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';

  if (units.length === 0) return null;

  const typeLabel = (type: string) => {
    if (type === 'departamento') return tTypes('departamentoShort');
    try {
      return tTypes(type as 'departamento');
    } catch {
      return type;
    }
  };

  const statusLabel = (status: string) => {
    try {
      return tAvail(status as 'disponible');
    } catch {
      return status;
    }
  };

  const unitHref = (unit: Unit) =>
    unit.slug ? `/${locale}/propiedades/${unit.slug}` : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t('title')}
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({units.length} {t('unitsSuffix')})
        </span>
      </h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">{t('model')}</th>
              <th className="px-4 py-3">{t('type')}</th>
              <th className="px-4 py-3 text-center">{t('beds')}</th>
              <th className="px-4 py-3 text-center">{t('baths')}</th>
              <th className="px-4 py-3 text-right">m²</th>
              <th className="px-4 py-3 text-right">{t('price')}</th>
              <th className="px-4 py-3 text-right">{t('estRent')}</th>
              <th className="px-4 py-3 text-center">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {units.map((unit) => {
              const rentEst = findRentEstimate(unit, mlEstimates);
              const status = unit.status || 'disponible';
              const href = unitHref(unit);
              const isClickable = !!href;
              const rowLabel = unit.unit_number || unit.typology || t('model');
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
                    isClickable
                      ? 'hover:bg-[#5CE0D2]/5 cursor-pointer focus:bg-[#5CE0D2]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]/40'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {href ? (
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0D9488] hover:text-[#4BCEC0] underline-offset-2 hover:underline"
                      >
                        {unit.typology || unit.unit_number || '—'}
                      </Link>
                    ) : (
                      unit.typology || unit.unit_number || '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{typeLabel(unit.unit_type)}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{unit.bedrooms}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{unit.bathrooms}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{unit.area_m2?.toLocaleString(intlLocale)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {unit.price_mxn > 0 ? formatPrice(unit.price_mxn) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4BCEC0] font-semibold">
                    {rentEst ? formatPrice(rentEst) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusStyles[status] || 'bg-gray-100 text-gray-500'}`}>
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
          const rentEst = findRentEstimate(unit, mlEstimates);
          const status = unit.status || 'disponible';
          const href = unitHref(unit);

          const cardBody = (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">
                  {unit.typology || unit.unit_number || '—'}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusStyles[status] || 'bg-gray-100 text-gray-500'}`}>
                  {statusLabel(status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">{t('type')}</div>
                <div className="text-right text-gray-700">{typeLabel(unit.unit_type)}</div>
                <div className="text-gray-500">{t('bedsBaths')}</div>
                <div className="text-right text-gray-700">{unit.bedrooms} / {unit.bathrooms}</div>
                <div className="text-gray-500">m²</div>
                <div className="text-right text-gray-700">{unit.area_m2?.toLocaleString(intlLocale)}</div>
                <div className="text-gray-500">{t('price')}</div>
                <div className="text-right font-bold text-gray-900">
                  {unit.price_mxn > 0 ? formatPrice(unit.price_mxn) : '—'}
                </div>
                {rentEst && (
                  <>
                    <div className="text-gray-500">{t('estRentShort')}</div>
                    <div className="text-right font-semibold text-[#4BCEC0]">{formatPrice(rentEst)}/mes</div>
                  </>
                )}
              </div>
            </>
          );

          return href ? (
            <Link
              key={unit.id}
              href={href}
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#5CE0D2] hover:shadow-sm transition-all active:scale-[0.99]"
            >
              {cardBody}
            </Link>
          ) : (
            <div
              key={unit.id}
              className="bg-white border border-gray-100 rounded-xl p-4"
            >
              {cardBody}
            </div>
          );
        })}
      </div>
    </div>
  );
}
