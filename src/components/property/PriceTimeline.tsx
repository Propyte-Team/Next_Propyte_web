import { useLocale } from 'next-intl';
import { TrendingUp, Calendar, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import type { Property } from '@/types/property';

function generatePriceHistory(property: Property, locale: string) {
  const price = property.price.mxn;
  const events: { date: string; event: string; price: number; change?: string }[] = [];

  if (property.stage === 'preventa') {
    const basePrice = Math.round(price * 0.82);
    const midPrice = Math.round(price * 0.91);
    events.push(
      { date: '2025-06', event: locale === 'es' ? 'Preventa Etapa 1' : 'Presale Stage 1', price: basePrice },
      { date: '2025-10', event: locale === 'es' ? 'Preventa Etapa 2' : 'Presale Stage 2', price: midPrice, change: '+11%' },
      { date: '2026-02', event: locale === 'es' ? 'Precio actual' : 'Current price', price: price, change: '+10%' },
    );
    if (property.roi.appreciation > 0) {
      const deliveryPrice = Math.round(price * (1 + property.roi.appreciation / 100));
      events.push({
        date: '2027-06',
        event: locale === 'es' ? 'Estimado a entrega' : 'Est. at delivery',
        price: deliveryPrice,
        change: `+${property.roi.appreciation}%`,
      });
    }
  } else {
    events.push(
      { date: '2025-09', event: locale === 'es' ? 'Publicado' : 'Listed', price: Math.round(price * 1.03) },
      { date: '2026-01', event: locale === 'es' ? 'Ajuste de precio' : 'Price change', price: price, change: '-3%' },
    );
  }

  return events;
}

interface PriceTimelineProps {
  property: Property;
}

export default function PriceTimeline({ property }: PriceTimelineProps) {
  const locale = useLocale();
  const history = generatePriceHistory(property, locale);

  return (
    <div>
      <h2 className="text-lg font-bold text-[#2C2C2C] mb-4">
        {locale === 'es' ? 'Historial de precios' : 'Price history'}
      </h2>
      <div className="space-y-0">
        {history.map((item, i) => {
          const isLast = i === history.length - 1;
          const isFuture = isLast && property.stage === 'preventa';

          return (
            <div key={i} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isFuture ? 'bg-[#F5A623] border-2 border-[#F5A623]/30' :
                  isLast ? 'bg-[#5CE0D2]' : 'bg-gray-300'
                }`} />
                {!isLast && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
              </div>

              {/* Content */}
              <div className={`pb-5 ${isFuture ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                  {item.change && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      item.change.startsWith('+') ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-red-50 text-red-500'
                    }`}>
                      {item.change}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-[#2C2C2C] mt-0.5">{item.event}</div>
                <div className="text-base font-bold text-[#2C2C2C]">{formatPrice(item.price)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
