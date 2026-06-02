'use client';

import { DollarSign, Square, Bed, Bath, Tag, type LucideIcon } from '@/lib/icons';
import PriceDisplay from '@/components/ui/PriceDisplay';
import AreaDisplay from '@/components/ui/AreaDisplay';
import DiscountBadge from '@/components/ui/DiscountBadge';
import type { Currency } from '@/context/CurrencyContext';

export interface ExtraKeyDataItem {
  icon: LucideIcon;
  label: string;
  /** Valor renderable — string o JSX. */
  value: React.ReactNode;
  key: string;
}

interface FloatingKeyDataProps {
  /** Precio en MXN (fuente de verdad). Si null, omite la fila precio. */
  priceMxn?: number | null;
  /** Moneda en que se cotizó originalmente. Default 'MXN'. */
  originalCurrency?: Currency;
  /** Área en m² (fuente de verdad). Si null/0, omite la fila área. */
  areaM2?: number | null;
  /** Recámaras (string ya formateado). Default usa fila Bed icon. Omitir si extraItems se usa. */
  bedrooms?: string | null;
  /** Baños. */
  bathrooms?: string | null;
  /** Items adicionales custom (ej. en desarrollos: unidades_count, tipo,
   *  estado+zona). Se renderean DESPUÉS de price/area. Si esto se provee y
   *  bedrooms/bathrooms es null, esos no aparecen. */
  extraItems?: ExtraKeyDataItem[];
  /** Cuando hay descuento activo: muestra precio lista (tachado encima) +
   *  el `priceMxn` ya es el precio post-descuento + chip −%.
   *  Si null/0/undefined, la card render sin tratamiento de descuento. */
  discount?: {
    listPriceMxn: number;
    pct: number;
  };
  labels: {
    title: string;
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
    /** "Descuento" para la fila opcional con el chip de %. Default i18n key. */
    discount?: string;
    /** "Precio de lista" para el strikethrough sobre el price principal. */
    listPrice?: string;
  };
}

export default function FloatingKeyData({
  priceMxn,
  originalCurrency = 'MXN',
  areaM2,
  bedrooms,
  bathrooms,
  extraItems,
  discount,
  labels,
}: FloatingKeyDataProps) {
  const hasPrice = priceMxn != null && priceMxn > 0;
  const hasArea = areaM2 != null && areaM2 > 0;
  const hasDiscount = !!discount && discount.listPriceMxn > 0 && discount.pct > 0;
  const items: ExtraKeyDataItem[] = [];
  if (hasPrice) {
    items.push({
      icon: DollarSign,
      label: labels.price,
      value: (
        <div className="flex flex-col items-end gap-0.5">
          {hasDiscount && (
            <span className="text-2xs text-white/60 line-through decoration-propyte-brand decoration-2 tabular-nums">
              <PriceDisplay
                mxn={discount!.listPriceMxn}
                variant="single"
                size="sm"
                className="text-white/60"
              />
            </span>
          )}
          <PriceDisplay
            mxn={priceMxn}
            variant="dual"
            size="md"
            originalCurrency={originalCurrency}
            tone="dark"
            className="text-white"
          />
        </div>
      ),
      key: 'price',
    });
  }
  if (hasDiscount) {
    items.push({
      icon: Tag,
      label: labels.discount ?? 'Descuento',
      value: <DiscountBadge variant="inline" pct={discount!.pct} tone="dark" />,
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
  if (extraItems && extraItems.length > 0) {
    items.push(...extraItems);
  } else {
    if (bedrooms) {
      items.push({
        icon: Bed,
        label: labels.bedrooms,
        value: <span className="text-base font-bold text-white">{bedrooms}</span>,
        key: 'bedrooms',
      });
    }
    if (bathrooms) {
      items.push({
        icon: Bath,
        label: labels.bathrooms,
        value: <span className="text-base font-bold text-white">{bathrooms}</span>,
        key: 'bathrooms',
      });
    }
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
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                <span className="text-sm text-white/85 shrink-0">{label}</span>
                <span className="text-right">{value}</span>
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
