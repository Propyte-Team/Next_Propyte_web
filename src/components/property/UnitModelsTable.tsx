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
  isEn: boolean;
}

const statusStyles: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  apartada: 'bg-yellow-100 text-yellow-700',
  vendida: 'bg-red-100 text-red-700',
  no_disponible: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, { es: string; en: string }> = {
  disponible: { es: 'Disponible', en: 'Available' },
  apartada: { es: 'Apartada', en: 'Reserved' },
  vendida: { es: 'Vendida', en: 'Sold' },
  no_disponible: { es: 'No disponible', en: 'Unavailable' },
};

const typeLabels: Record<string, { es: string; en: string }> = {
  departamento: { es: 'Depto', en: 'Apt' },
  penthouse: { es: 'Penthouse', en: 'Penthouse' },
  casa: { es: 'Casa', en: 'House' },
  studio: { es: 'Studio', en: 'Studio' },
  townhouse: { es: 'Townhouse', en: 'Townhouse' },
  terreno: { es: 'Terreno', en: 'Land' },
  local_comercial: { es: 'Local', en: 'Commercial' },
  macrolote: { es: 'Macrolote', en: 'Large Lot' },
};

function findRentEstimate(unit: Unit, mlEstimates: MlEstimate[]): number | null {
  const match = mlEstimates.find(
    (e) => e.unit_type === unit.unit_type && e.bedrooms === unit.bedrooms
  );
  return match?.estimated_rent_residencial || match?.estimated_rent_vacacional || null;
}

export default function UnitModelsTable({ units, mlEstimates, isEn }: UnitModelsTableProps) {
  if (units.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isEn ? 'Unit Models' : 'Modelos de Unidades'}
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({units.length} {isEn ? 'units' : 'unidades'})
        </span>
      </h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">{isEn ? 'Model' : 'Modelo'}</th>
              <th className="px-4 py-3">{isEn ? 'Type' : 'Tipo'}</th>
              <th className="px-4 py-3 text-center">{isEn ? 'Beds' : 'Rec'}</th>
              <th className="px-4 py-3 text-center">{isEn ? 'Baths' : 'Baños'}</th>
              <th className="px-4 py-3 text-right">m²</th>
              <th className="px-4 py-3 text-right">{isEn ? 'Price' : 'Precio'}</th>
              <th className="px-4 py-3 text-right">{isEn ? 'Est. Rent/mo' : 'Renta Est./mes'}</th>
              <th className="px-4 py-3 text-center">Status</th>
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
                  <td className="px-4 py-3 text-gray-600">
                    {(isEn ? typeLabels[unit.unit_type]?.en : typeLabels[unit.unit_type]?.es) || unit.unit_type}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{unit.bedrooms}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{unit.bathrooms}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{unit.area_m2?.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {unit.price_mxn > 0 ? formatPrice(unit.price_mxn) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4BCEC0] font-semibold">
                    {rentEst ? formatPrice(rentEst) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusStyles[status] || 'bg-gray-100 text-gray-500'}`}>
                      {(isEn ? statusLabels[status]?.en : statusLabels[status]?.es) || status}
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
                  {(isEn ? statusLabels[status]?.en : statusLabels[status]?.es) || status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">{isEn ? 'Type' : 'Tipo'}</div>
                <div className="text-right text-gray-700">
                  {(isEn ? typeLabels[unit.unit_type]?.en : typeLabels[unit.unit_type]?.es) || unit.unit_type}
                </div>
                <div className="text-gray-500">{isEn ? 'Beds/Baths' : 'Rec/Baños'}</div>
                <div className="text-right text-gray-700">{unit.bedrooms} / {unit.bathrooms}</div>
                <div className="text-gray-500">m²</div>
                <div className="text-right text-gray-700">{unit.area_m2?.toLocaleString('es-MX')}</div>
                <div className="text-gray-500">{isEn ? 'Price' : 'Precio'}</div>
                <div className="text-right font-bold text-gray-900">
                  {unit.price_mxn > 0 ? formatPrice(unit.price_mxn) : '—'}
                </div>
                {rentEst && (
                  <>
                    <div className="text-gray-500">{isEn ? 'Est. Rent' : 'Renta Est.'}</div>
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
