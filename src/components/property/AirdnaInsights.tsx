'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslations } from 'next-intl';
import { TrendingUp, DollarSign, Home, BarChart3 } from 'lucide-react';
import type { AirdnaMarketSummary } from '@/lib/supabase/queries';

interface AirdnaInsightsProps {
  data: AirdnaMarketSummary;
  locale: string;
  market: string;
}

/**
 * AirDNA vacation rental market insights:
 * - Occupancy trend area chart (12 months)
 * - Current ADR + ADR by bedrooms
 * - Active listings count
 * - Rate tiers distribution
 */
export default function AirdnaInsights({ data, locale, market }: AirdnaInsightsProps) {
  const t = useTranslations('airdna');

  const chartData = data.occupancy_trend.map((p) => ({
    date: p.date,
    label: formatMonthShort(p.date, locale),
    occupancy: Math.round(p.value),
  }));

  const adrByBedsEntries = Object.entries(data.adr_by_beds).slice(0, 5);
  const rateTierEntries = Object.entries(data.rate_tiers).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-bold text-gray-900">{t('marketTitle')}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
              AirDNA · {market}
            </span>
            {data.latest_date && (
              <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                {t('updated')} {formatDaysAgo(data.latest_date, locale, t)}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">{t('marketSubtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp size={18} />}
          label={t('currentOccupancy')}
          value={data.current_occupancy != null ? `${Math.round(data.current_occupancy)}%` : '—'}
          subtitle={data.avg_occupancy_12m != null
            ? `${t('avg12m')}: ${Math.round(data.avg_occupancy_12m)}%`
            : undefined}
        />
        <KpiCard
          icon={<DollarSign size={18} />}
          label={t('currentAdr')}
          value={data.current_adr != null ? `$${data.current_adr.toLocaleString()}` : '—'}
          subtitle={t('perNight')}
        />
        <KpiCard
          icon={<Home size={18} />}
          label={t('activeListings')}
          value={data.active_listings != null ? data.active_listings.toLocaleString() : '—'}
          subtitle={t('inMarket')}
        />
        <KpiCard
          icon={<BarChart3 size={18} />}
          label={t('projectedRevenue')}
          value={
            data.current_occupancy != null && data.current_adr != null
              ? `$${Math.round((data.current_occupancy / 100) * data.current_adr * 30).toLocaleString()}`
              : '—'
          }
          subtitle={t('perMonthEst')}
        />
      </div>

      {/* Occupancy trend chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-sm font-bold text-gray-900">{t('occupancyTrend')}</div>
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="h-[200px] md:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="airdnaOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5CE0D2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5CE0D2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F4F6F8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, t('occupancy')]}
                  labelStyle={{ color: '#1A2F3F', fontWeight: 600, fontSize: 12 }}
                  contentStyle={{
                    borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#airdnaOcc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ADR by bedrooms + Rate tiers */}
      {(adrByBedsEntries.length > 0 || rateTierEntries.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adrByBedsEntries.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">{t('avgRateByBeds')}</div>
              <div className="space-y-2">
                {adrByBedsEntries.map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 capitalize">{formatBedsLabel(name, t)}</span>
                    <span className="font-bold text-gray-900">${value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rateTierEntries.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">{t('rateTiers')}</div>
              <div className="space-y-2">
                {rateTierEntries.map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 capitalize">{name.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-gray-900">${value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon, label, value, subtitle,
}: { icon: React.ReactNode; label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 truncate">{label}</span>
        <span className="text-[#0D9488]">{icon}</span>
      </div>
      <div className="text-lg md:text-xl font-bold text-gray-900 truncate">{value}</div>
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</div>}
    </div>
  );
}

function formatMonthShort(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
      month: 'short',
    }).replace('.', '');
  } catch {
    return dateStr;
  }
}

type AirdnaT = ReturnType<typeof useTranslations<'airdna'>>;

function formatDaysAgo(dateStr: string, locale: string, t: AirdnaT): string {
  try {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days === 0) return t('today');
    if (days === 1) return t('dayAgo');
    if (days < 30) return t('daysAgo', { days });
    const months = Math.floor(days / 30);
    if (months === 1) return t('monthAgo');
    return t('monthsAgo', { months });
  } catch {
    return dateStr;
  }
}

function formatBedsLabel(name: string, t: AirdnaT): string {
  const m = name.match(/^studio$|^(\d+)[-_]?(?:br|bed|bedroom|rec)/i);
  if (m) {
    if (m[0] === 'studio' || m[0].toLowerCase() === 'studio') return t('studio');
    const n = parseInt(m[1], 10);
    return n === 1 ? t('bedsSingular', { n }) : t('bedsPlural', { n });
  }
  return name.replace(/_/g, ' ');
}
