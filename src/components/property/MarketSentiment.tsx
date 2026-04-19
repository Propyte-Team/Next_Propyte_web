import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

export type SentimentDirection = 'bullish' | 'neutral' | 'bearish';

export interface SentimentIndicator {
  id: string;
  label: string;
  direction: SentimentDirection;
  value: string;
  rationale: string;
}

interface MarketSentimentProps {
  indicators: SentimentIndicator[];
  locale: string;
}

/**
 * Market sentiment panel — 3 directional indicators that summarize
 * whether the zone's fundamentals lean bullish/neutral/bearish.
 *
 * Derives from:
 *  - price per m² trend (appreciation)
 *  - occupancy trend (demand)
 *  - delivery pipeline (supply pressure)
 */
export default function MarketSentiment({ indicators, locale }: MarketSentimentProps) {
  const isEn = locale === 'en';
  if (indicators.length === 0) return null;

  const overall = computeOverall(indicators);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {isEn ? 'Market sentiment' : 'Sentimiento de mercado'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEn
              ? 'Directional signals from market fundamentals.'
              : 'Señales direccionales de fundamentales.'}
          </p>
        </div>
        <OverallBadge direction={overall} locale={locale} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {indicators.map((ind) => (
          <SentimentCard key={ind.id} indicator={ind} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function SentimentCard({ indicator, locale }: { indicator: SentimentIndicator; locale: string }) {
  const { Icon, bg, text, border, label } = directionStyle(indicator.direction, locale);
  return (
    <div className={`rounded-xl p-4 border ${bg} ${border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${text}`}>
          <Icon size={12} />
          {label}
        </span>
      </div>
      <div className="text-xs font-semibold text-gray-500 mb-1">{indicator.label}</div>
      <div className="text-lg font-bold text-gray-900">{indicator.value}</div>
      <p className="text-[11px] text-gray-500 leading-snug mt-2">{indicator.rationale}</p>
    </div>
  );
}

function OverallBadge({ direction, locale }: { direction: SentimentDirection; locale: string }) {
  const { Icon, bg, text, border, label } = directionStyle(direction, locale);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${bg} ${text} ${border}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

function directionStyle(
  direction: SentimentDirection,
  locale: string,
): { Icon: LucideIcon; bg: string; text: string; border: string; label: string } {
  const isEn = locale === 'en';
  switch (direction) {
    case 'bullish':
      return {
        Icon: TrendingUp,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-100',
        label: isEn ? 'Bullish' : 'Alcista',
      };
    case 'bearish':
      return {
        Icon: TrendingDown,
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-100',
        label: isEn ? 'Bearish' : 'Bajista',
      };
    default:
      return {
        Icon: Minus,
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-100',
        label: isEn ? 'Neutral' : 'Neutral',
      };
  }
}

function computeOverall(indicators: SentimentIndicator[]): SentimentDirection {
  const weights = { bullish: 1, neutral: 0, bearish: -1 } as const;
  const score = indicators.reduce((s, ind) => s + weights[ind.direction], 0);
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
}
