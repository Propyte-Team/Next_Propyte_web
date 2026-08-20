'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, DollarSign, Building2, ArrowUpRight } from '@/lib/icons';
import type { ZoneScore } from '@/lib/supabase/queries';
import { averageIndex } from '@/lib/rental-data/pools';

interface TrendingZone {
  zone: string;
  city: string;
  score: number;
  slug: string;
  occupancy: string;
  adr: string;
}

export default function TrendingMarket() {
  const t = useTranslations('trending');
  const locale = useLocale();
  const [zones, setZones] = useState<TrendingZone[]>([]);
  // null = sin dato. Antes el estado guardaba strings y los promedios caían a 0,
  // así que la portada publicaba una tarjeta con "0%" de ocupación y "$0" de
  // tarifa mientras las filas de zona de abajo, correctamente, decían "—". Un 0
  // es una cifra: afirma que el mercado no se renta. La ausencia se oculta.
  const [stats, setStats] = useState<{
    avgScore: number | null;
    avgOccupancy: number | null;
    avgADR: number | null;
    totalListings: number | null;
  }>({ avgScore: null, avgOccupancy: null, avgADR: null, totalListings: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/zone-scores', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.scores && data.scores.length > 0) {
          const scores: ZoneScore[] = data.scores;

          const sorted = [...scores]
            .filter((s) => s.score != null)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, 5);

          setZones(sorted.map((s) => ({
            zone: s.zone,
            city: s.city,
            score: Math.round(s.score ?? 0),
            slug: s.zone.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '-'),
            occupancy: s.occupancy_p50_ttm != null ? `${Math.round(s.occupancy_p50_ttm)}%` : '—',
            adr: s.adr_p50_ttm != null ? `$${Math.round(s.adr_p50_ttm).toLocaleString()}` : '—',
          })));

          // averageIndex ignora las zonas sin índice en vez de contarlas como
          // cero (misma regla que /mercado, ver src/lib/rental-data/pools.ts).
          const avgScore = averageIndex(scores);
          const validOcc = scores.filter((s) => s.occupancy_p50_ttm != null);
          const avgOcc = validOcc.length > 0
            ? validOcc.reduce((sum, s) => sum + (s.occupancy_p50_ttm ?? 0), 0) / validOcc.length
            : null;
          const validAdr = scores.filter((s) => s.adr_p50_ttm != null);
          const avgAdr = validAdr.length > 0
            ? validAdr.reduce((sum, s) => sum + (s.adr_p50_ttm ?? 0), 0) / validAdr.length
            : null;
          const totalListings = scores.reduce((sum, s) => sum + (s.active_listings ?? 0), 0);

          setStats({
            avgScore: avgScore != null ? Math.round(avgScore) : null,
            avgOccupancy: avgOcc != null ? Math.round(avgOcc) : null,
            avgADR: avgAdr != null ? Math.round(avgAdr) : null,
            totalListings,
          });
        }
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoaded(true);
      });
    return () => controller.abort();
  }, []);

  // Mismo criterio que VacacionalKPIs en /mercado: la tarjeta se oculta cuando
  // el valor no es positivo. Un dato ausente nunca se renderiza como figura.
  const statCards = [
    { icon: TrendingUp, value: stats.avgScore, format: (n: number) => `${n}/100`, label: t('stat1Label'), color: 'text-[#15803D]' },
    { icon: DollarSign, value: stats.avgADR, format: (n: number) => `$${n.toLocaleString()}`, label: t('stat2Label'), color: 'text-[#0E7490]' },
    { icon: BarChart3, value: stats.avgOccupancy, format: (n: number) => `${n}%`, label: t('stat3Label'), color: 'text-[#0E7490]' },
    { icon: Building2, value: stats.totalListings, format: (n: number) => n.toLocaleString(), label: t('stat4Label'), color: 'text-[#1A2F3F]' },
  ].filter((c): c is typeof c & { value: number } => c.value != null && c.value > 0);

  // Hide entire section when loaded with no zone data — empty stats + fake zones
  // create distrust, not neutrality (audit §CRÍTICO)
  if (loaded && zones.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
            <p className="text-gray-600 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats grid — glass cristalino light sobre bg blanco */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {statCards.map((stat, i) => (
              <div key={i} className="propyte-card-glass-light p-5 text-center transition-transform hover:-translate-y-0.5">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mb-3 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.format(stat.value)}</div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Trending zones — surface dark brand */}
        <div className="bg-[#0B1C1E] rounded-2xl p-6 md:p-8 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">{t('zonesTitle')}</h3>
          <div className="space-y-3">
            {zones.map((zone) => (
              <Link
                key={zone.zone}
                href={`/${locale}/zonas/${zone.slug}`}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-[#A2F9FF]/10 rounded-lg transition-colors group border border-transparent hover:border-[#A2F9FF]/30"
              >
                <div>
                  <span className="text-white font-semibold">{zone.zone}</span>
                  <span className="text-white/60 text-sm ml-3">{zone.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-xs hidden sm:inline">
                    {t('occupancy')}: {zone.occupancy} · {t('adr')}: {zone.adr}
                  </span>
                  {zone.score > 0 && (
                    <span className="text-[#A2F9FF] font-bold text-sm">{zone.score}/100</span>
                  )}
                  <ArrowUpRight size={16} className="text-[#A2F9FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-6 text-center">
          {loaded && zones.length > 0 ? t('footnoteWithData') : t('footnoteNoData')}
        </p>
      </div>
    </section>
  );
}
