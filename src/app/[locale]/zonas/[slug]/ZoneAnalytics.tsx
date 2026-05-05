'use client';

import { useTranslations } from 'next-intl';
import { ZoneScoreCard } from '@/components/analytics/ZoneScoreCard';
import { OccupancyTrend } from '@/components/analytics/OccupancyTrend';
import { ADRTrend } from '@/components/analytics/ADRTrend';
import { SeasonalPattern } from '@/components/analytics/SeasonalPattern';
import { RevPARChart } from '@/components/analytics/RevPARChart';
import { SupplyDemandIndicator } from '@/components/analytics/SupplyDemandIndicator';
import { MarketAlertBanner } from '@/components/analytics/MarketAlertBanner';
import type { ZoneScore, MetricForecast, SeasonalIndex } from '@/lib/supabase/queries';
import { TrendingUp, Building2, DollarSign, BarChart3 } from 'lucide-react';

interface Development {
  id: string;
  name: string;
  slug: string;
  city: string;
  zone: string;
  price_min_mxn: number;
  roi_projected: number | null;
  stage: string;
  images: string[] | null;
  developers?: { name: string; logo_url: string | null } | null;
}

interface ZoneAnalyticsProps {
  zone: string;
  city: string;
  score: ZoneScore | null;
  occupancyTrend: Array<{ date: string; value: number }>;
  adrTrend: Array<{ date: string; value: number }>;
  occupancyForecasts: MetricForecast[];
  adrForecasts: MetricForecast[];
  occupancySeasonal: SeasonalIndex[];
  adrSeasonal: SeasonalIndex[];
  developments: Development[];
  locale: string;
}

function KPICard({ label, value, suffix = '', icon: Icon }: {
  label: string;
  value: string | number | null;
  suffix?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-teal-600" />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : '—'}
        {suffix && <span className="text-sm font-normal text-gray-600 ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

export function ZoneAnalytics({
  zone,
  city,
  score,
  occupancyTrend,
  adrTrend,
  occupancyForecasts,
  adrForecasts,
  occupancySeasonal,
  adrSeasonal,
  developments,
  locale,
}: ZoneAnalyticsProps) {
  const t = useTranslations('zoneAnalytics');

  return (
    <div className="space-y-8">
      {/* Alerts */}
      <MarketAlertBanner city={city} maxAlerts={2} />

      {/* Score + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Score Card */}
        <div className="lg:col-span-1">
          {score ? (
            <ZoneScoreCard score={score} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">
              {t('scoreUnavailable')}
            </div>
          )}
        </div>

        {/* KPI Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            label={t('occupancy')}
            value={score?.median_occupancy ? Math.round(score.median_occupancy) : null}
            suffix="%"
            icon={BarChart3}
          />
          <KPICard
            label="ADR"
            value={score?.median_adr ? `$${Math.round(score.median_adr).toLocaleString()}` : null}
            icon={DollarSign}
          />
          <KPICard
            label="RevPAR"
            value={score?.revpar ? `$${Math.round(score.revpar).toLocaleString()}` : null}
            icon={TrendingUp}
          />
          <KPICard
            label={t('activeListings')}
            value={score?.active_listings ?? null}
            icon={Building2}
          />
        </div>
      </div>

      {/* Charts Row 1: Occupancy + ADR Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <OccupancyTrend
            historical={occupancyTrend}
            forecasts={occupancyForecasts}
            title={t('occupancyTrend')}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <ADRTrend
            historical={adrTrend}
            forecasts={adrForecasts}
            title={t('adrTrend')}
          />
        </div>
      </div>

      {/* Charts Row 2: RevPAR + Supply/Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <RevPARChart
            occupancyData={occupancyTrend}
            adrData={adrTrend}
            title={t('revparTitle')}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <SupplyDemandIndicator
            supplyDemandRatio={score?.supply_demand_ratio ?? null}
            activeListings={score?.active_listings ?? null}
            occupancy={score?.median_occupancy ?? null}
          />
        </div>
      </div>

      {/* Seasonality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {occupancySeasonal.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SeasonalPattern
              indices={occupancySeasonal}
              title={t('occupancySeasonal')}
              metricLabel={t('occupancyFactor')}
            />
          </div>
        )}
        {adrSeasonal.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SeasonalPattern
              indices={adrSeasonal}
              title={t('adrSeasonal')}
              metricLabel={t('adrFactor')}
            />
          </div>
        )}
      </div>

      {/* Top Developments */}
      {developments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('topDevelopments')} {zone}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">
                    {t('development')}
                  </th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">
                    {t('developer')}
                  </th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">
                    {t('from')}
                  </th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">
                    ROI
                  </th>
                  <th className="text-center py-2 px-3 text-gray-600 font-medium">
                    {t('stage')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {developments.map((dev) => (
                  <tr key={dev.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <a
                        href={`/${locale}/desarrollos/${dev.slug}`}
                        className="font-medium text-teal-700 hover:text-teal-900"
                      >
                        {dev.name}
                      </a>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {dev.developers?.name || '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-900">
                      ${(dev.price_min_mxn / 1_000_000).toFixed(1)}M
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-teal-700">
                      {dev.roi_projected ? `${dev.roi_projected}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                        {dev.stage === 'preventa' ? t('stagePresale') :
                         dev.stage === 'construccion' ? t('stageConstruction') :
                         t('stageReady')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
