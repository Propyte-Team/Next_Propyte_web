'use client';

import { DollarSign, Square, Bed, Bath } from 'lucide-react';
import PriceDisplay from '@/components/ui/PriceDisplay';
import AreaDisplay from '@/components/ui/AreaDisplay';
import type { Currency } from '@/context/CurrencyContext';

interface FloatingKeyDataProps {
  /** Precio en MXN (fuente de verdad). Si null, omite la fila precio. */
  priceMxn?: number | null;
  /** Moneda en que se cotizó originalmente. La otra es "Referencial". Default 'MXN'. */
  originalCurrency?: Currency;
  /** Área en m² (fuente de verdad). Si null/0, omite la fila área. */
  areaM2?: number | null;
  bedrooms: string | null;
  bathrooms: string | null;
  labels: {
    title: string;
    price: string;
    area: string;
    bedrooms: string;
    bathrooms: string;
  };
}

export default function FloatingKeyData({
  priceMxn,
  originalCurrency = 'MXN',
  areaM2,
  bedrooms,
  bathrooms,
  labels,
}: FloatingKeyDataProps) {
  const hasPrice = priceMxn != null && priceMxn > 0;
  const hasArea = areaM2 != null && areaM2 > 0;
  const items: Array<{ icon: typeof DollarSign; label: string; value: React.ReactNode; key: string }> = [];
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
  if (bedrooms) {
    items.push({
      icon: Bed,
      label: labels.bedrooms,
      value: <span className="text-sm font-bold text-white">{bedrooms}</span>,
      key: 'bedrooms',
    });
  }
  if (bathrooms) {
    items.push({
      icon: Bath,
      label: labels.bathrooms,
      value: <span className="text-sm font-bold text-white">{bathrooms}</span>,
      key: 'bathrooms',
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
                <span className="text-2xs text-white/55 shrink-0">{label}</span>
                <span className="text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
        {hasPrice && (
          <div className="px-4 pb-3 pt-1 border-t border-white/10">
            <p className="text-[10px] text-white/55 leading-snug italic">
              Precios mostrados en moneda referencial son aproximados y se calculan con tipo
              de cambio de Banxico. El precio final depende del tipo de cambio acordado en
              la negociación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
