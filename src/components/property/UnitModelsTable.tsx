import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@/lib/formatters';

interface Unit {
  id: string;
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

export default async function UnitModelsTable({ units, mlEstimates, locale }: UnitModelsTableProps) {
  if (units.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'unitModels' });
  const tAvail = await getTranslations({ locale, namespace: 'availability' });
  const tTypes = await getTranslations({ locale, namespace: 'types' });
  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';

  // Type label lookup with short-form fallback for departamento
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
              return (
                <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {unit.typology || unit.unit_number || '—'}
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
          return (
            <div key={unit.id} className="bg-white border border-gray-100 rounded-xl p-4">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
