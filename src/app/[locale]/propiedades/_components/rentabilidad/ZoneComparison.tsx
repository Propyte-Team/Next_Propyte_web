'use client';

import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/formatters';
import type { AirdnaZoneSummary } from '@/lib/supabase/queries';

interface ZoneComparisonProps {
  metric: 'adr' | 'occupancy';
  zones: AirdnaZoneSummary[];
  locale: string;
  title: string;
}

export default function ZoneComparison({ metric, zones, title }: ZoneComparisonProps) {
  const t = useTranslations('simulator');
  const rows = zones
    .map((z) => ({ name: z.zone, value: metric === 'adr' ? z.adr : z.occupancy }))
    .filter((r) => r.value != null && (r.value as number) > 0)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 4);
  if (rows.length < 2) return null;
  const max = Math.max(...rows.map((r) => r.value as number));
  const fmt = (v: number) => (metric === 'adr' ? formatPrice(v) : `${Math.round(v)}%`);
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-sm font-bold text-gray-900 mb-3">{title}</div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.name} className="text-xs">
            <div className="flex justify-between mb-1"><span className="text-gray-700">{r.name}</span><span className="font-bold text-gray-900">{fmt(r.value as number)}</span></div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${((r.value as number) / max) * 100}%`, background: i === 0 ? '#0E7490' : '#94D8D0' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-2xs text-gray-500 mt-2">{t('zoneCityLevelNote')}</p>
    </div>
  );
}
