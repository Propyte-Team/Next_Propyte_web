import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

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
export default async function MarketSentiment({ indicators, locale }: MarketSentimentProps) {
  if (indicators.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'property' });
  const overall = computeOverall(indicators);
  const labels = { bullish: t('bullish'), bearish: t('bearish'), neutral: t('neutral') };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{t('marketSentiment')}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{t('marketSentimentSubtitle')}</p>
        </div>
        <OverallBadge direction={overall} labels={labels} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {indicators.map((ind) => (
          <SentimentCard key={ind.id} indicator={ind} labels={labels} />
        ))}
      </div>
    </div>
  );
}

interface DirLabels { bullish: string; bearish: string; neutral: string }

function SentimentCard({ indicator, labels }: { indicator: SentimentIndicator; labels: DirLabels }) {
  const { Icon, bg, text, border, label } = directionStyle(indicator.direction, labels);
  return (
    <div className={`rounded-xl p-4 border ${bg} ${border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${text}`}>
          <Icon size={12} />
          {label}
        </span>
      </div>
      <div className="text-xs font-semibold text-gray-600 mb-1">{indicator.label}</div>
      <div className="text-lg font-bold text-gray-900">{indicator.value}</div>
      <p className="text-[11px] text-gray-600 leading-snug mt-2">{indicator.rationale}</p>
    </div>
  );
}

function OverallBadge({ direction, labels }: { direction: SentimentDirection; labels: DirLabels }) {
  const { Icon, bg, text, border, label } = directionStyle(direction, labels);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${bg} ${text} ${border}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

function directionStyle(
  direction: SentimentDirection,
  labels: DirLabels,
): { Icon: LucideIcon; bg: string; text: string; border: string; label: string } {
  switch (direction) {
    case 'bullish':
      return { Icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: labels.bullish };
    case 'bearish':
      return { Icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', label: labels.bearish };
    default:
      return { Icon: Minus, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', label: labels.neutral };
  }
}

function computeOverall(indicators: SentimentIndicator[]): SentimentDirection {
  const weights = { bullish: 1, neutral: 0, bearish: -1 } as const;
  const score = indicators.reduce((s, ind) => s + weights[ind.direction], 0);
  if (score > 0) return 'bullish';
  if (score < 0) return 'bearish';
  return 'neutral';
}
