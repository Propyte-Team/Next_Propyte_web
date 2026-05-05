'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin, TrendingUp, Activity, Building2, Gauge } from 'lucide-react';
import type { ZoneScore } from '@/lib/supabase/queries';

interface GeoAnalysisProps {
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string;
  zone: string | null;
  state: string | null;
  zoneScore: ZoneScore | null;
  locale: string;
}

const DEFAULT_CENTERS: Record<string, { lat: number; lng: number }> = {
  Cancun: { lat: 21.1619, lng: -86.8515 },
  'Playa del Carmen': { lat: 20.6296, lng: -87.0739 },
  Tulum: { lat: 20.2114, lng: -87.4654 },
  Merida: { lat: 20.9674, lng: -89.5926 },
};

export default function GeoAnalysis({
  lat, lng, address, city, zone, state, zoneScore, locale: _locale,
}: GeoAnalysisProps) {
  const t = useTranslations('geoAnalysis');
  const [mapError, setMapError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasCoords = lat != null && lng != null;
  const fallbackCenter = DEFAULT_CENTERS[city] || { lat: 20.42, lng: -87.25 };
  const center = hasCoords ? { lat: lat!, lng: lng! } : fallbackCenter;
  const canRenderMap = apiKey && apiKey !== 'your_google_maps_api_key_here' && !mapError;

  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="aspect-[16/9] bg-[#F4F6F8] rounded-xl overflow-hidden relative">
        {canRenderMap ? (
          <APIProvider apiKey={apiKey!} onError={() => setMapError(true)}>
            <Map
              defaultCenter={center}
              defaultZoom={hasCoords ? 15 : 11}
              mapId="propyte-property-map"
              gestureHandling="cooperative"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {hasCoords && (
                <AdvancedMarker position={center}>
                  <div className="flex flex-col items-center">
                    <div className="bg-[#0D9488] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      {t('location')}
                    </div>
                    <div
                      className="w-3 h-3 bg-[#0D9488] rotate-45 -mt-1.5"
                      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                    />
                  </div>
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
            <MapPin size={40} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm font-medium">
              {mapError ? t('mapUnavailable') : t('mapComingSoon')}
            </p>
          </div>
        )}
      </div>

      {/* Address + Zone info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-600 mb-1">{t('address')}</div>
          <div className="text-sm font-semibold text-gray-900">
            {address || `${zone || ''}, ${city}`.replace(/^,\s*/, '')}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-600 mb-1">{t('zone')}</div>
          <div className="text-sm font-semibold text-gray-900">
            {zone || city}{state ? `, ${state}` : ''}
          </div>
        </div>
      </div>

      {/* Zone scores grid */}
      {zoneScore && (
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{t('zonePerformance')}</h3>
          <p className="text-xs text-gray-600 mb-4">
            {t('basedOn', { zone: zone || city })}
          </p>

          {zoneScore.score != null && (
            <div className="mb-4 bg-gradient-to-br from-[#1A2F3F] to-[#0F1923] rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5CE0D2]/80">
                    {t('compositeScore')}
                  </div>
                  <div className="text-3xl font-extrabold mt-1">
                    {Math.round(zoneScore.score)}
                    <span className="text-lg text-white/60 font-bold">/100</span>
                  </div>
                </div>
                {zoneScore.cluster_label && (
                  <span className="px-3 py-1 bg-[#5CE0D2]/15 text-[#5CE0D2] text-xs font-bold rounded-full uppercase tracking-wider">
                    {zoneScore.cluster_label}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {zoneScore.yield_component != null && (
              <ScoreCard
                icon={<TrendingUp size={18} />}
                label={t('yield')}
                value={zoneScore.yield_component}
              />
            )}
            {zoneScore.occupancy_component != null && (
              <ScoreCard
                icon={<Gauge size={18} />}
                label={t('occupancy')}
                value={zoneScore.occupancy_component}
              />
            )}
            {zoneScore.adr_growth_component != null && (
              <ScoreCard
                icon={<Activity size={18} />}
                label={t('adrGrowth')}
                value={zoneScore.adr_growth_component}
              />
            )}
            {zoneScore.supply_pressure_component != null && (
              <ScoreCard
                icon={<Building2 size={18} />}
                label={t('supplyPressure')}
                value={zoneScore.supply_pressure_component}
              />
            )}
          </div>

          {/* Raw metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {zoneScore.median_occupancy != null && (
              <RawMetric
                label={t('medianOccupancy')}
                value={`${Math.round(zoneScore.median_occupancy)}%`}
              />
            )}
            {zoneScore.median_adr != null && (
              <RawMetric
                label={t('medianAdr')}
                value={`$${Math.round(zoneScore.median_adr).toLocaleString()}`}
              />
            )}
            {zoneScore.active_listings != null && (
              <RawMetric
                label={t('activeListings')}
                value={zoneScore.active_listings.toLocaleString()}
              />
            )}
            {zoneScore.revpar != null && (
              <RawMetric
                label="RevPAR"
                value={`$${Math.round(zoneScore.revpar).toLocaleString()}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const rounded = Math.round(value);
  const color = rounded >= 70 ? '#22C55E' : rounded >= 50 ? '#F5A623' : '#EF4444';
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-600 truncate">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{rounded}</span>
        <span className="text-xs text-gray-600">/100</span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, rounded))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function RawMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-600 truncate">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</div>
    </div>
  );
}
