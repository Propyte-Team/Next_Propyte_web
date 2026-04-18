'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Search, MapPin, Building2, Home, Map, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// TODO: Habilitar 'rentar' cuando haya inventario de renta
const TABS = ['comprar', 'preventa'] as const;
type Tab = typeof TABS[number];

interface HeroProps {
  stats?: {
    developments: number;
    units: number;
    cities: number;
    zones: number;
  };
}

export default function Hero({ stats }: HeroProps) {
  const t = useTranslations('hero');
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('comprar');
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    // TODO: Habilitar cuando haya inventario de renta
    // if (activeTab === 'rentar') params.set('usage', 'renta');
    if (activeTab === 'preventa') params.set('stage', 'preventa');
    router.push(`/${locale}/propiedades${params.toString() ? '?' + params.toString() : ''}`);
  }

  const quickLinks = [
    { label: t('quickPDC'), href: `/${locale}/propiedades?city=Playa+del+Carmen` },
    { label: t('quickTulum'), href: `/${locale}/propiedades?city=Tulum` },
    { label: t('quickBeachfront'), href: `/${locale}/propiedades?amenity=playa` },
    { label: t('quickUnder3M'), href: `/${locale}/propiedades?priceMax=3000000` },
  ];

  return (
    <section className="relative w-full min-h-[520px] md:min-h-[600px] lg:min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1920&h=1080&fit=crop)',
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 text-center py-16 md:py-24">
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-tight mb-3 drop-shadow-lg">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-medium text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
          {t('subtitle')}
        </p>

        {/* Zillow-style tabbed search */}
        <div className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-t-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#1A2F3F] shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                {t(`tab_${tab}`)}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex bg-white rounded-b-lg rounded-tr-lg shadow-2xl overflow-hidden">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full h-14 md:h-16 pl-12 pr-4 text-base md:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-14 md:h-16 px-8 md:px-10 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white font-bold text-base transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Search size={18} />
                {t('searchButton')}
              </button>
            </div>
          </form>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-white/15 hover:bg-white/25 rounded-full backdrop-blur-sm border border-white/20 transition-all"
            >
              <MapPin size={14} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Social proof stats */}
        {stats && (
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8">
            {[
              { icon: Building2, value: `${stats.developments}+`, label: locale === 'es' ? 'Desarrollos' : 'Developments' },
              { icon: Home, value: `${stats.units}+`, label: locale === 'es' ? 'Unidades' : 'Units' },
              { icon: Map, value: `${stats.cities}`, label: locale === 'es' ? 'Ciudades' : 'Cities' },
              { icon: BarChart3, value: `${stats.zones}+`, label: locale === 'es' ? 'Zonas analizadas' : 'Zones Analyzed' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
                <stat.icon size={16} className="text-[#5CE0D2]" />
                <span className="text-white font-bold text-sm">{stat.value}</span>
                <span className="text-white/70 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
