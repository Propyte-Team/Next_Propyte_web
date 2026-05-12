'use client';

import { DollarSign, Square, Layers, Tag, MapPin } from 'lucide-react';
import PriceDisplay from '@/components/ui/PriceDisplay';
import AreaDisplay from '@/components/ui/AreaDisplay';
import type { Currency } from '@/context/CurrencyContext';

interface DevelopmentKeyDataProps {
  priceMxn?: number | null;
  originalCurrency?: Currency;
  areaM2?: number | null;
  totalUnits?: number | null;
  mainType?: string | null;
  zone?: string | null;
  state?: string | null;
  labels: {
    title: string;
    price: string;
    area: string;
    units: string;
    type: string;
    location: string;
  };
}

/**
 * Variante de FloatingKeyData específica para desarrollos. Muestra: precio,
 * área, número de unidades, tipo de desarrollo, ubicación (zona+estado).
 * Sustituye los bedrooms/bathrooms del cuadrito de unidades (no aplica a
 * un desarrollo agregado).
 *
 * Es client component completo — evita pasar LucideIcon refs cruzando el
 * boundary server→client desde DevelopmentDetailPage.
 */
export default function DevelopmentKeyData({
  priceMxn,
  originalCurrency = 'MXN',
  areaM2,
  totalUnits,
  mainType,
  zone,
  state,
  labels,
}: DevelopmentKeyDataProps) {
  const hasPrice = priceMxn != null && priceMxn > 0;
  const hasArea = areaM2 != null && areaM2 > 0;
  const hasUnits = totalUnits != null && totalUnits > 0;
  const hasType = !!(mainType && mainType.trim().length > 0);
  const location = [zone, state].filter(Boolean).join(' · ');
  const hasLocation = !!location;

  const items: Array<{
    icon: typeof DollarSign;
    label: string;
    value: React.ReactNode;
    key: string;
  }> = [];

  if (hasPrice) {
    items.push({
      icon: DollarSign,
      label: labels.price,
      value: (
        <PriceDisplay
          mxn={priceMxn}
          variant="dual"
          size="sm"
          originalCurrency={originalCurrency}
          className="text-white"
        />
      ),
      key: 'price',
    });
  }
  if (hasArea) {
    items.push({
      icon: Square,
      label: labels.area,
      value: <AreaDisplay m2={areaM2} variant="dual" size="sm" className="text-white" />,
      key: 'area',
    });
  }
  if (hasUnits) {
    items.push({
      icon: Layers,
      label: labels.units,
      value: <span className="text-sm font-bold text-white">{totalUnits}</span>,
      key: 'units',
    });
  }
  if (hasType) {
    items.push({
      icon: Tag,
      label: labels.type,
      value: (
        <span className="text-sm font-bold text-white capitalize">
          {mainType!.replace(/_/g, ' ')}
        </span>
      ),
      key: 'type',
    });
  }
  if (hasLocation) {
    items.push({
      icon: MapPin,
      label: labels.location,
      value: <span className="text-sm font-bold text-white truncate">{location}</span>,
      key: 'location',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="hidden md:block">
      <div className="bg-[#1A2F3F] text-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/10">
          <span className="text-2xs font-bold uppercase tracking-wider text-propyte-brand">
            {labels.title}
          </span>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {items.map(({ icon: Icon, label, value, key }) => (
            <div key={key} className="flex items-center gap-2">
              <Icon size={13} className="text-propyte-brand shrink-0" />
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-2xs text-white/75 shrink-0">{label}</span>
                <span className="text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {hasPrice && (
        <p className="mt-2 px-1 text-[10px] text-gray-500 leading-snug italic">
          El precio referencial se calcula con TC Banxico. Precio final depende
          del tipo de cambio acordado en la negociación.
        </p>
      )}
    </div>
  );
}
