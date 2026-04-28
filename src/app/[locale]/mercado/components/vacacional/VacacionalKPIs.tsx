'use client';

import { BarChart3, TrendingUp, Home, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VacacionalKPIsProps {
  zones: number;
  avgIndex: number;
  avgOccupancy: number;
  totalListings: number;
  locale: string;
}

export function VacacionalKPIs({ zones, avgIndex, avgOccupancy, totalListings }: VacacionalKPIsProps) {
  const t = useTranslations('mercado');

  const kpis = [
    { icon: MapPin, value: zones.toString(), show: zones > 0, label: t('kpiZones'), color: 'text-gray-900' },
    { icon: BarChart3, value: `${avgIndex}/100`, show: avgIndex > 0, label: t('kpiAvgIndex'), color: 'text-teal-700' },
    { icon: TrendingUp, value: `${avgOccupancy}%`, show: avgOccupancy > 0, label: t('kpiAvgOccupancy'), color: 'text-gray-900' },
    { icon: Home, value: totalListings.toLocaleString(), show: totalListings > 0, label: t('kpiActiveProperties'), color: 'text-gray-900' },
  ].filter((kpi) => kpi.show);

  if (kpis.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <p className="text-sm font-semibold text-amber-900">{t('kpiUpdating')}</p>
        <p className="text-xs text-amber-700 mt-1">{t('kpiSelectCity')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map(({ icon: Icon, value, label, color }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-lg p-4 text-center"
        >
          <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
