'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Search, MapPin, ShoppingBag, Sparkles } from 'lucide-react';
import StatCounter from '@/components/shared/StatCounter';

type IntentTab = 'comprar' | 'preventa';

interface HeroProps {
  stats?: {
    developments: number;
    units: number;
    cities: number;
    zones: number;
  };
}

// Speckit §18 social-proof floors — cuando Supabase regresa 0 (data gap),
// el hero mantiene estos mínimos promocionales en lugar de mostrar "0 Ciudades".
const FLOORS = { developments: 170, units: 500, cities: 5, zones: 30 };

export default function Hero({ stats }: HeroProps) {
  const t = useTranslations('hero');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<IntentTab>('comprar');
  const [query, setQuery] = useState('');

  const videoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  const imageUrl = process.env.NEXT_PUBLIC_HERO_IMAGE_URL;

  const d = Math.max(stats?.developments ?? 0, FLOORS.developments);
  const u = Math.max(stats?.units ?? 0, FLOORS.units);
  const c = Math.max(stats?.cities ?? 0, FLOORS.cities);
  const z = Math.max(stats?.zones ?? 0, FLOORS.zones);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const stage = tab === 'preventa' ? 'preventa' : 'entrega_inmediata';
    const params = new URLSearchParams({ stage });
    if (query) params.set('search', query);
    router.push(`/${locale}/desarrollos?${params.toString()}`);
  }

  const quickLinks = [
    { label: t('quickPDC'), href: `/${locale}/propiedades?city=Playa+del+Carmen` },
    { label: t('quickTulum'), href: `/${locale}/propiedades?city=Tulum` },
    { label: t('quickBeachfront'), href: `/${locale}/propiedades?amenity=playa` },
    { label: t('quickUnder3M'), href: `/${locale}/propiedades?priceMax=3000000` },
  ];

  return (
    <section className="propyte-hero hero-grain relative w-full min-h-[calc(100vh-80px)] md:min-h-[680px] flex items-center justify-center overflow-hidden">
      {videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={imageUrl}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1923] via-[#1A2F3F] to-[#0D2740]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/65" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 text-center py-16 md:py-24 pt-24 md:pt-32">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-tight mb-3 drop-shadow-lg">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-medium text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
          {t('subtitle')}
        </p>

        <div className="max-w-2xl mx-auto">
          {/* Intent tabs: Comprar / Preventa (Speckit §18) */}
          <div className="flex justify-center gap-2 mb-4" role="tablist" aria-label={t('searchButton')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'comprar'}
              onClick={() => setTab('comprar')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                tab === 'comprar'
                  ? 'bg-white text-[#1A2F3F] shadow-lg'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/25'
              }`}
            >
              <ShoppingBag size={15} strokeWidth={1.75} />
              {t('tabComprar')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'preventa'}
              onClick={() => setTab('preventa')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                tab === 'preventa'
                  ? 'bg-white text-[#1A2F3F] shadow-lg'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/25'
              }`}
            >
              <Sparkles size={15} strokeWidth={1.75} />
              {t('tabPreventa')}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="propyte-search-bubble flex items-center w-full h-14 md:h-[60px] rounded-full pl-5 pr-1.5 md:pr-2 gap-2 mx-auto max-w-xl"
            role="search"
          >
            <Search size={20} strokeWidth={2} className="text-gray-400 shrink-0" />
            <label htmlFor="hero-search-input" className="sr-only">
              {tNav('search')}
            </label>
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tNav('searchPlaceholderDev')}
              autoComplete="off"
              className="flex-1 h-full text-base md:text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent min-w-0"
            />
            <button
              type="submit"
              aria-label={tNav('search')}
              className="search-bubble-btn flex items-center justify-center w-10 h-10 md:w-11 md:h-11 bg-[#5CE0D2] hover:bg-[#4BCEC0] text-white rounded-full shrink-0 transition-all hover:scale-105"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          </form>
        </div>

        {/* Social-proof stats — siempre 4 pills con floors Speckit §18 */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 mb-2">
          <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
            <StatCounter to={d} suffix="+" className="text-[#5CE0D2] text-xl md:text-2xl font-bold" />
            <span className="text-white/80 text-sm font-medium">{t('statsDevelopments')}</span>
          </div>
          <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
            <StatCounter to={u} suffix="+" className="text-[#5CE0D2] text-xl md:text-2xl font-bold" />
            <span className="text-white/80 text-sm font-medium">{t('statsUnits')}</span>
          </div>
          <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
            <StatCounter to={c} className="text-[#5CE0D2] text-xl md:text-2xl font-bold" />
            <span className="text-white/80 text-sm font-medium">{t('statsCities')}</span>
          </div>
          <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
            <StatCounter to={z} suffix="+" className="text-[#5CE0D2] text-xl md:text-2xl font-bold" />
            <span className="text-white/80 text-sm font-medium">{t('statsZones')}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 text-sm font-medium text-white bg-white/15 hover:bg-white/25 hover:-translate-y-0.5 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
            >
              <MapPin size={14} strokeWidth={1.75} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
