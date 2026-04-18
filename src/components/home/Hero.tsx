'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Search, MapPin, Building2, Key } from 'lucide-react';
import { useSearchType } from '@/context/SearchContext';
import StatCounter from '@/components/shared/StatCounter';

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
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const { type, setType } = useSearchType();
  const [query, setQuery] = useState('');

  const videoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  const imageUrl =
    process.env.NEXT_PUBLIC_HERO_IMAGE_URL ||
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1920&h=1080&fit=crop';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const path = type === 'propiedades' ? 'propiedades' : 'desarrollos';
    const url = query
      ? `/${locale}/${path}?search=${encodeURIComponent(query)}`
      : `/${locale}/${path}`;
    router.push(url);
  }

  const quickLinks = [
    { label: t('quickPDC'), href: `/${locale}/propiedades?city=Playa+del+Carmen` },
    { label: t('quickTulum'), href: `/${locale}/propiedades?city=Tulum` },
    { label: t('quickBeachfront'), href: `/${locale}/propiedades?amenity=playa` },
    { label: t('quickUnder3M'), href: `/${locale}/propiedades?priceMax=3000000` },
  ];

  const placeholderKey = type === 'propiedades' ? 'searchPlaceholderUnit' : 'searchPlaceholderDev';

  return (
    <section className="propyte-hero hero-grain relative w-full min-h-[calc(100vh-80px)] md:min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* 3-tier background fallback: video → image → gradient */}
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

      {/* Gradient overlay (top translucent, bottom darker for contrast) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/65" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 text-center py-16 md:py-24 pt-24 md:pt-32">
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-tight mb-3 drop-shadow-lg">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-medium text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
          {t('subtitle')}
        </p>

        {/* Tabbed search */}
        <div className="max-w-2xl mx-auto">
          {/* Tab pills */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('desarrollos')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                type === 'desarrollos'
                  ? 'bg-white text-[#1A2F3F] shadow-lg'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/25'
              }`}
            >
              <Building2 size={15} strokeWidth={1.75} />
              {tNav('searchTypeDev')}
            </button>
            <button
              type="button"
              onClick={() => setType('propiedades')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                type === 'propiedades'
                  ? 'bg-white text-[#1A2F3F] shadow-lg'
                  : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/25'
              }`}
            >
              <Key size={15} strokeWidth={1.75} />
              {tNav('searchTypeUnit')}
            </button>
          </div>

          {/* Search bubble (calca header bubble) */}
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
              placeholder={tNav(placeholderKey)}
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

        {/* Social proof stats */}
        {stats && stats.developments > 0 && (
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 mb-2">
            <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
              <StatCounter
                to={stats.developments}
                suffix="+"
                className="text-[#5CE0D2] text-xl md:text-2xl font-bold"
              />
              <span className="text-white/80 text-sm font-medium">{tNav('searchTypeDev')}</span>
            </div>
            {stats.units > 0 && (
              <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
                <StatCounter
                  to={stats.units}
                  suffix="+"
                  className="text-[#5CE0D2] text-xl md:text-2xl font-bold"
                />
                <span className="text-white/80 text-sm font-medium">{tNav('searchTypeUnit')}</span>
              </div>
            )}
            {stats.cities > 0 && (
              <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
                <StatCounter
                  to={stats.cities}
                  className="text-[#5CE0D2] text-xl md:text-2xl font-bold"
                />
                <span className="text-white/80 text-sm font-medium">
                  {locale === 'es' ? 'Ciudades' : 'Cities'}
                </span>
              </div>
            )}
            {stats.zones > 0 && (
              <div className="hero-stat flex items-center gap-2 bg-black/25 backdrop-blur-md rounded-full px-5 py-2.5">
                <StatCounter
                  to={stats.zones}
                  suffix="+"
                  className="text-[#5CE0D2] text-xl md:text-2xl font-bold"
                />
                <span className="text-white/80 text-sm font-medium">
                  {locale === 'es' ? 'Zonas' : 'Zones'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-white/15 hover:bg-white/25 hover:-translate-y-0.5 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200"
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
