'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const isEn = locale === 'en';

  const chartData = data.occupancy_trend.map((p) => ({
    date: p.date,
    label: formatMonthShort(p.date, locale),
    occupancy: Math.round(p.value * 100),
  }));

  const adrByBedsEntries = Object.entries(data.adr_by_beds).slice(0, 5);
  const rateTierEntries = Object.entries(data.rate_tiers).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h3 className="text-base font-bold text-gray-900">
            {isEn ? 'Vacation rental market' : 'Mercado de renta vacacional'}
          </h3>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
            AirDNA · {market}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {isEn
            ? 'Short-term rental performance from AirDNA market data.'
            : 'Desempeño de renta corta según datos AirDNA.'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp size={18} />}
          label={isEn ? 'Current occupancy' : 'Ocupación actual'}
          value={data.current_occupancy != null ? `${Math.round(data.current_occupancy * 100)}%` : '—'}
          subtitle={data.avg_occupancy_12m != null
            ? `${isEn ? 'Avg 12m' : 'Prom. 12m'}: ${Math.round(data.avg_occupancy_12m * 100)}%`
            : undefined}
        />
        <KpiCard
          icon={<DollarSign size={18} />}
          label={isEn ? 'Current ADR' : 'ADR actual'}
          value={data.current_adr != null ? `$${data.current_adr.toLocaleString()}` : '—'}
          subtitle={isEn ? 'per night (MXN)' : 'por noche (MXN)'}
        />
        <KpiCard
          icon={<Home size={18} />}
          label={isEn ? 'Active listings' : 'Anuncios activos'}
          value={data.active_listings != null ? data.active_listings.toLocaleString() : '—'}
          subtitle={isEn ? 'in the market' : 'en el mercado'}
        />
        <KpiCard
          icon={<BarChart3 size={18} />}
          label={isEn ? 'Projected revenue' : 'Ingreso proyectado'}
          value={
            data.current_occupancy != null && data.current_adr != null
              ? `$${Math.round(data.current_occupancy * data.current_adr * 30).toLocaleString()}`
              : '—'
          }
          subtitle={isEn ? 'per month (est.)' : 'mensual (est.)'}
        />
      </div>

      {/* Occupancy trend chart */}
      {chartData.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-sm font-bold text-gray-900">
              {isEn ? 'Occupancy trend · last 12 months' : 'Tendencia de ocupación · últimos 12 meses'}
            </div>
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
                  formatter={(v) => [`${v}%`, isEn ? 'Occupancy' : 'Ocupación']}
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
              <div className="text-sm font-bold text-gray-900 mb-3">
                {isEn ? 'Average rate by bedrooms' : 'Tarifa promedio por recámara'}
              </div>
              <div className="space-y-2">
                {adrByBedsEntries.map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 capitalize">{formatBedsLabel(name, locale)}</span>
                    <span className="font-bold text-gray-900">${value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rateTierEntries.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">
                {isEn ? 'Rate tiers' : 'Segmentos tarifarios'}
              </div>
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

function formatBedsLabel(name: string, locale: string): string {
  const isEn = locale === 'en';
  const m = name.match(/^studio$|^(\d+)[-_]?(?:br|bed|bedroom|rec)/i);
  if (m) {
    if (m[0] === 'studio' || m[0].toLowerCase() === 'studio') return isEn ? 'Studio' : 'Estudio';
    const n = parseInt(m[1], 10);
    return isEn ? `${n} bed${n !== 1 ? 's' : ''}` : `${n} rec.`;
  }
  return name.replace(/_/g, ' ');
}
