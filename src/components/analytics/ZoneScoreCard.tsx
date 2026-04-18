'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ZoneScore } from '@/lib/supabase/queries';

interface ZoneScoreCardProps {
  score: ZoneScore;
  compact?: boolean;
  locale?: string;
}

function IndexBadge({ value }: { value: number }) {
  const label =
    value >= 70 ? 'Alto potencial' :
    value >= 50 ? 'Potencial moderado' :
    'En observación';
  const colors =
    value >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    value >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-50 text-gray-500 border-gray-200';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-3xl font-bold ${value >= 70 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-gray-400'}`}>
        {Math.round(value)}
      </span>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">Índice Propyte</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${colors}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, context, trend }: {
  label: string;
  value: string;
  context?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-gray-300';

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        {trend && <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />}
        {context && <span className="text-[10px] text-gray-400">{context}</span>}
      </div>
    </div>
  );
}

export function ZoneScoreCard({ score, compact = false, locale = 'es' }: ZoneScoreCardProps) {
  const isEn = locale === 'en';

  // Determine ADR trend
  const adrGrowth = score.adr_growth_component;
  const adrTrend: 'up' | 'down' | 'flat' =
    adrGrowth != null && adrGrowth > 60 ? 'up' :
    adrGrowth != null && adrGrowth < 40 ? 'down' :
    'flat';

  // Competition level label
  const listings = score.active_listings ?? 0;
  const competitionLabel = isEn
    ? (listings > 200 ? 'High' : listings > 50 ? 'Moderate' : 'Low')
    : (listings > 200 ? 'Alta' : listings > 50 ? 'Moderada' : 'Baja');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all">
      {/* Header: zone name + index */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{score.zone}</h3>
          <p className="text-xs text-gray-400">{score.city}</p>
        </div>
        <IndexBadge value={score.score ?? 0} />
      </div>

      {!compact && (
        <div className="border-t border-gray-100 pt-3 space-y-0.5">
          <MetricRow
            label={isEn ? 'Occupancy' : 'Ocupación'}
            value={score.median_occupancy ? `${Math.round(score.median_occupancy)}%` : '—'}
            trend={score.median_occupancy != null && score.median_occupancy > 58 ? 'up' : score.median_occupancy != null && score.median_occupancy < 40 ? 'down' : 'flat'}
          />
          <MetricRow
            label={isEn ? 'Avg. rate / night' : 'Tarifa prom. / noche'}
            value={score.median_adr ? `$${Math.round(score.median_adr).toLocaleString()} MXN` : '—'}
            trend={adrTrend}
          />
          <MetricRow
            label={isEn ? 'Competition' : 'Competencia'}
            value={`${competitionLabel} · ${listings} ${isEn ? 'properties' : 'propiedades'}`}
          />
        </div>
      )}
    </div>
  );
}
