'use client';

import { useTranslations } from 'next-intl';

interface SupplyDemandIndicatorProps {
  supplyDemandRatio: number | null;
  activeListings: number | null;
  occupancy: number | null;
}

export function SupplyDemandIndicator({
  supplyDemandRatio,
  activeListings,
  occupancy,
}: SupplyDemandIndicatorProps) {
  const t = useTranslations('supplyDemandIndicator');

  if (supplyDemandRatio == null) {
    return (
      <div className="text-sm text-gray-600 text-center py-4">
        {t('insufficientData')}
      </div>
    );
  }

  // Lower ratio = higher demand relative to supply = better for investors
  // Typical range: 5-50
  const normalizedPosition = Math.min(100, Math.max(0, (1 - supplyDemandRatio / 100) * 100));

  const label =
    normalizedPosition >= 70 ? t('highDemand') :
    normalizedPosition >= 40 ? t('balanced') :
    t('highSupply');

  const color =
    normalizedPosition >= 70 ? 'text-green-600' :
    normalizedPosition >= 40 ? 'text-amber-600' :
    'text-red-600';

  const _bgColor =
    normalizedPosition >= 70 ? 'bg-green-500' :
    normalizedPosition >= 40 ? 'bg-amber-500' :
    'bg-red-500';
  void _bgColor;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{t('title')}</h3>
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
      </div>

      {/* Gradient bar with indicator */}
      <div className="relative">
        <div className="h-3 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" />
        <div
          className="absolute top-0 w-4 h-4 -mt-0.5 rounded-full border-2 border-white shadow-md"
          style={{
            left: `calc(${normalizedPosition}% - 8px)`,
            transition: 'left 0.5s ease',
            backgroundColor: normalizedPosition >= 70 ? '#059669' : normalizedPosition >= 40 ? '#D97706' : '#DC2626',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{t('excessSupply')}</span>
        <span>{t('highDemand')}</span>
      </div>

      {/* Detail metrics */}
      <div className="flex gap-4 text-center">
        {activeListings != null && (
          <div className="flex-1 bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-gray-900">{activeListings.toLocaleString()}</div>
            <div className="text-xs text-gray-600">{t('activeListings')}</div>
          </div>
        )}
        {occupancy != null && (
          <div className="flex-1 bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-gray-900">{Math.round(occupancy)}%</div>
            <div className="text-xs text-gray-600">{t('occupancy')}</div>
          </div>
        )}
        <div className="flex-1 bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-gray-900">{supplyDemandRatio.toFixed(1)}</div>
          <div className="text-xs text-gray-600">{t('ratioSD')}</div>
        </div>
      </div>
    </div>
  );
}
