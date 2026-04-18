'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, DollarSign, Building2, ArrowUpRight } from 'lucide-react';
import type { ZoneScore } from '@/lib/supabase/queries';

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
  const [stats, setStats] = useState({
    avgScore: '—',
    avgOccupancy: '—',
    avgADR: '—',
    totalListings: '—',
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/zone-scores?city=Cancun')
      .then((r) => r.json())
      .then((data) => {
        if (data.scores && data.scores.length > 0) {
          const scores: ZoneScore[] = data.scores;

          // Top 5 zones by score
          const sorted = [...scores]
            .filter((s) => s.score != null)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, 5);

          setZones(sorted.map((s) => ({
            zone: s.zone,
            city: s.city,
            score: Math.round(s.score ?? 0),
            slug: s.zone.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '-'),
            occupancy: s.median_occupancy ? `${Math.round(s.median_occupancy)}%` : '—',
            adr: s.median_adr ? `$${Math.round(s.median_adr).toLocaleString()}` : '—',
          })));

          // Aggregate stats
          const validScores = scores.filter((s) => s.score != null);
          const avgScore = validScores.length > 0
            ? Math.round(validScores.reduce((sum, s) => sum + (s.score ?? 0), 0) / validScores.length)
            : 0;
          const validOcc = scores.filter((s) => s.median_occupancy != null);
          const avgOcc = validOcc.length > 0
            ? Math.round(validOcc.reduce((sum, s) => sum + (s.median_occupancy ?? 0), 0) / validOcc.length)
            : 0;
          const validAdr = scores.filter((s) => s.median_adr != null);
          const avgAdr = validAdr.length > 0
            ? Math.round(validAdr.reduce((sum, s) => sum + (s.median_adr ?? 0), 0) / validAdr.length)
            : 0;
          const totalListings = scores.reduce((sum, s) => sum + (s.active_listings ?? 0), 0);

          setStats({
            avgScore: `${avgScore}/100`,
            avgOccupancy: `${avgOcc}%`,
            avgADR: `$${avgAdr.toLocaleString()}`,
            totalListings: totalListings.toLocaleString(),
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const statCards = [
    { icon: TrendingUp, value: stats.avgScore, label: t('stat1Label'), color: 'text-[#22C55E]' },
    { icon: DollarSign, value: stats.avgADR, label: t('stat2Label'), color: 'text-[#5CE0D2]' },
    { icon: BarChart3, value: stats.avgOccupancy, label: t('stat3Label'), color: 'text-[#F5A623]' },
    { icon: Building2, value: stats.totalListings, label: t('stat4Label'), color: 'text-[#1A2F3F]' },
  ];

  // Fallback zones while loading or if no data
  const displayZones = zones.length > 0 ? zones : [
    { zone: 'Zona Hotelera', city: 'Cancun', score: 0, slug: 'zona-hotelera', occupancy: '—', adr: '—' },
    { zone: 'Puerto Cancún', city: 'Cancun', score: 0, slug: 'puerto-cancún', occupancy: '—', adr: '—' },
    { zone: 'Centro', city: 'Cancun', score: 0, slug: 'centro', occupancy: '—', adr: '—' },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">{t('title')}</h2>
            <p className="text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-[#F4F6F8] rounded-xl p-5 text-center hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mb-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Trending zones */}
        <div className="bg-[#1A2F3F] rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-white mb-4">{t('zonesTitle')}</h3>
          <div className="space-y-3">
            {displayZones.map((zone) => (
              <Link
                key={zone.zone}
                href={`/${locale}/zonas/${zone.slug}`}
                className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/15 rounded-lg transition-colors group"
              >
                <div>
                  <span className="text-white font-semibold">{zone.zone}</span>
                  <span className="text-white/60 text-sm ml-3">{zone.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-xs hidden sm:inline">
                    Occ: {zone.occupancy} · ADR: {zone.adr}
                  </span>
                  {zone.score > 0 && (
                    <span className="text-[#22C55E] font-bold text-sm">{zone.score}/100</span>
                  )}
                  <ArrowUpRight size={16} className="text-[#22C55E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6 text-center">
          {loaded && zones.length > 0
            ? 'Datos basados en análisis de AirDNA y comparables de renta. Actualizado semanalmente.'
            : 'Fuentes: datos estimados basados en análisis de mercado de la Riviera Maya. Rendimientos pasados no garantizan resultados futuros.'}
        </p>
      </div>
    </section>
  );
}
