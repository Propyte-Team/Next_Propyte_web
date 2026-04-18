'use client';

import type { TabId } from '@/lib/rental-data/types';

interface MercadoHeroProps {
  activeTab: TabId;
  locale: string;
  strStats?: { zones: number; listings: number; cities: number; updatedAt: string };
  ltrStats?: { comparables: number; cities: number; sources: number; updatedAt: string };
}

export function MercadoHero({ activeTab, locale, strStats, ltrStats }: MercadoHeroProps) {
  const isEn = locale === 'en';

  const trustItems = activeTab === 'vacacional'
    ? [
        { value: strStats?.listings?.toLocaleString() || '23,500+', label: isEn ? 'properties mapped' : 'propiedades mapeadas' },
        { value: strStats?.cities?.toString() || '23', label: isEn ? 'cities' : 'ciudades' },
        { value: strStats?.zones?.toString() || '98', label: isEn ? 'zones analyzed' : 'zonas analizadas' },
        { value: isEn ? 'Monthly' : 'Mensual', label: isEn ? 'update' : 'actualización' },
      ]
    : [
        { value: ltrStats?.comparables?.toLocaleString() || '10,118', label: isEn ? 'comparables' : 'comparables' },
        { value: ltrStats?.cities?.toString() || '62', label: isEn ? 'cities' : 'ciudades' },
        { value: ltrStats?.sources?.toString() || '7', label: isEn ? 'data sources' : 'fuentes de datos' },
        { value: isEn ? 'Daily' : 'Diaria', label: isEn ? 'update' : 'actualización' },
      ];

  return (
    <div className="bg-gradient-to-b from-[#F4F6F8] to-white pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block bg-[#5CE0D2/10] text-[#0D9488] text-xs font-semibold px-4 py-1 rounded-full mb-4">
          {isEn
            ? 'Market intelligence with +2M rental records'
            : 'Inteligencia de mercado con +2M registros de renta'}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1A2F3F] mb-3">
          {isEn
            ? 'Analyze the rental market in Mexico'
            : 'Analiza el mercado de rentas en México'}
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          {isEn
            ? 'Real data on occupancy, nightly rates and rental prices by zone. Compare before investing.'
            : 'Datos reales de ocupación, tarifas y precios de renta por zona. Compara antes de invertir.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {trustItems.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-[#1A2F3F] font-mono">{item.value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
