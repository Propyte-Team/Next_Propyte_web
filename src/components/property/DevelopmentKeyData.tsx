'use client';

import { DollarSign, Square, Layers, Tag, MapPin, Percent } from '@/lib/icons';
import PriceDisplay from '@/components/ui/PriceDisplay';
import AreaDisplay from '@/components/ui/AreaDisplay';
import DiscountBadge from '@/components/ui/DiscountBadge';
import type { Currency } from '@/context/CurrencyContext';

interface DevelopmentKeyDataProps {
  priceMxn?: number | null;
  originalCurrency?: Currency;
  areaM2?: number | null;
  totalUnits?: number | null;
  mainType?: string | null;
  zone?: string | null;
  state?: string | null;
  /** % de descuento máx. entre las unidades del desarrollo. 0/null = sin fila. */
  discountPct?: number | null;
  labels: {
    title: string;
    price: string;
    area: string;
    units: string;
    type: string;
    location: string;
    discount?: string;
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
  discountPct,
  labels,
}: DevelopmentKeyDataProps) {
  const hasPrice = priceMxn != null && priceMxn > 0;
  const hasDiscount = discountPct != null && discountPct > 0;
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
          size="md"
          originalCurrency={originalCurrency}
          tone="dark"
          className="text-white"
        />
      ),
      key: 'price',
    });
  }
  if (hasDiscount) {
    items.push({
      icon: Percent,
      label: labels.discount ?? 'Descuento',
      value: <DiscountBadge variant="inline" pct={discountPct!} tone="dark" />,
      key: 'discount',
    });
  }
  if (hasArea) {
    items.push({
      icon: Square,
      label: labels.area,
      value: <AreaDisplay m2={areaM2} variant="dual" size="md" className="text-white" />,
      key: 'area',
    });
  }
  if (hasUnits) {
    items.push({
      icon: Layers,
      label: labels.units,
      value: <span className="text-base font-bold text-white">{totalUnits}</span>,
      key: 'units',
    });
  }
  if (hasType) {
    items.push({
      icon: Tag,
      label: labels.type,
      value: (
        <span className="text-base font-bold text-white capitalize">
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
      value: <span className="text-base font-bold text-white break-words leading-snug">{location}</span>,
      key: 'location',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="hidden md:block">
      <div className="bg-[#1A2F3F] text-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-propyte-brand">
            {labels.title}
          </span>
        </div>
        <div className="px-5 py-4 space-y-3.5">
          {items.map(({ icon: Icon, label, value, key }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon size={18} className="text-propyte-brand shrink-0" />
              {/* flex-wrap: si el valor no cabe junto al label, baja a su
                  propia línea (ml-auto lo mantiene alineado a la derecha) */}
              <div className="flex-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-w-0">
                <span className="text-sm text-white/85 shrink-0">{label}</span>
                <span className="ml-auto min-w-0 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {hasPrice && (
        <p className="mt-2 px-1 text-[10px] text-gray-600 leading-snug italic">
          El precio referencial se calcula con TC Banxico. Precio final depende
          del tipo de cambio acordado en la negociación.
        </p>
      )}
    </div>
  );
}
