'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Search, MapPin, Building2, Home } from 'lucide-react';
import StatCounter from '@/components/shared/StatCounter';

type IntentTab = 'desarrollos' | 'propiedades';

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
  const [tab, setTab] = useState<IntentTab>('desarrollos');
  const [query, setQuery] = useState('');

  const videoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  const imageUrl = process.env.NEXT_PUBLIC_HERO_IMAGE_URL;

  // Stats reales sin pisos inventados. Cada pill se omite si la cifra es 0,
  // y el suffix "+" se aplica solo cuando el valor sugiere conteo agregado (>=10).
  const heroStats = [
    { value: stats?.developments ?? 0, label: t('statsDevelopments') },
    { value: stats?.units ?? 0, label: t('statsUnits') },
    { value: stats?.cities ?? 0, label: t('statsCities') },
    { value: stats?.zones ?? 0, label: t('statsZones') },
  ].filter((s) => s.value > 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Cada tab apunta a su catálogo: Desarrollos = proyectos completos en
    // preventa/construcción; Propiedades = unidades individuales listadas.
    const path = tab === 'desarrollos' ? 'desarrollos' : 'propiedades';
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    const qs = params.toString();
    router.push(`/${locale}/${path}${qs ? `?${qs}` : ''}`);
  }

  const quickLinks = [
    { label: t('quickPDC'), href: `/${locale}/propiedades?city=Playa+del+Carmen` },
    { label: t('quickTulum'), href: `/${locale}/propiedades?city=Tulum` },
    { label: t('quickBeachfront'), href: `/${locale}/propiedades?amenity=playa` },
    { label: t('quickUnder3M'), href: `/${locale}/propiedades?priceMax=3000000` },
  ];

  // Brand: el headline destaca "Riviera Maya" en cyan oficial #A2F9FF — mismo
  // patrón en ES y EN porque ambos títulos terminan con "Riviera Maya".
  const titleRaw = t('title');
  const lastTwoWordsMatch = titleRaw.match(/^(.*)\s(\S+\s+\S+)$/);
  const titleHead = lastTwoWordsMatch ? lastTwoWordsMatch[1] : titleRaw;
  const titleAccent = lastTwoWordsMatch ? lastTwoWordsMatch[2] : '';

  // C4 Hero performance — preload del poster image como recurso LCP cuando existe.
  // Next.js coloca este <link> en <head> automáticamente. Sin esto, el browser
  // descubre la imagen del poster al parsear el <video>, después de varios bytes
  // del HTML, perdiendo tiempo crítico para Largest Contentful Paint.
  return (
    <section className="propyte-hero hero-grain relative w-full min-h-[calc(100vh-80px)] md:min-h-[680px] flex items-center justify-center overflow-hidden">
      {imageUrl && (
        <link rel="preload" as="image" href={imageUrl} fetchPriority="high" />
      )}
      {videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
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

      {/* Overlay vertical aztec — sigue Brand Identity Oficial (#0B1C1E) en
          lugar de negro puro, para preservar warmth del azul-teal corporativo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1C1E]/55 via-[#0B1C1E]/30 to-[#0B1C1E]/85" />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 text-center py-16 md:py-24 pt-24 md:pt-32">
        <span className="brand-eyebrow inline-block mb-4 px-4 py-1.5 rounded-full border border-[#A2F9FF]/40 text-[#A2F9FF] bg-[#A2F9FF]/[0.06] backdrop-blur-sm">
          {t('eyebrow')}
        </span>
        <h1 className="text-h1 text-white leading-tight mb-3 drop-shadow-lg">
          {titleHead}
          {titleAccent && (
            <>
              {' '}
              <span className="text-[#A2F9FF]">{titleAccent}</span>
            </>
          )}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-medium text-white/90 mb-2 max-w-2xl mx-auto drop-shadow-md">
          {t('subtitle')}
        </p>
        <p className="text-sm md:text-base font-semibold tracking-[0.18em] uppercase text-[#A2F9FF] mb-10 drop-shadow-md">
          {t('tagline')}
        </p>

        <div className="max-w-2xl mx-auto">
          {/* Intent tabs: Desarrollos / Propiedades — cada uno enruta a su catálogo */}
          <div className="flex justify-center gap-2 mb-4" role="tablist" aria-label={t('searchButton')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'desarrollos'}
              onClick={() => setTab('desarrollos')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-6 text-sm font-bold rounded-full transition-all ${
                tab === 'desarrollos'
                  ? 'bg-[#A2F9FF] text-[#0B1C1E] shadow-[0_8px_24px_rgba(162,249,255,0.35)]'
                  : 'propyte-glass-pill text-white'
              }`}
            >
              <Building2 size={15} strokeWidth={1.75} />
              {t('tabDesarrollos')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'propiedades'}
              onClick={() => setTab('propiedades')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-6 text-sm font-bold rounded-full transition-all ${
                tab === 'propiedades'
                  ? 'bg-[#A2F9FF] text-[#0B1C1E] shadow-[0_8px_24px_rgba(162,249,255,0.35)]'
                  : 'propyte-glass-pill text-white'
              }`}
            >
              <Home size={15} strokeWidth={1.75} />
              {t('tabPropiedades')}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="propyte-search-bubble flex items-center w-full h-14 md:h-[60px] rounded-full pl-5 pr-1.5 md:pr-2 gap-2 mx-auto max-w-xl"
            role="search"
          >
            <Search size={20} strokeWidth={2} className="text-gray-600 shrink-0" />
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
              className="flex-1 h-full text-base md:text-lg text-gray-800 placeholder:text-gray-600 focus:outline-none bg-transparent min-w-0"
            />
            <button
              type="submit"
              aria-label={tNav('search')}
              className="search-bubble-btn flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-[#A2F9FF] hover:bg-[#81EAF1] text-[#0B1C1E] rounded-full shrink-0 transition-all hover:scale-105"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          </form>
        </div>

        {heroStats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 mb-2">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="hero-stat propyte-glass-pill flex items-center gap-2 rounded-full px-5 py-2.5"
              >
                <StatCounter
                  to={stat.value}
                  suffix={stat.value >= 10 ? '+' : ''}
                  className="text-[#A2F9FF] text-xl md:text-2xl font-bold"
                />
                <span className="text-white/80 text-sm font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="propyte-glass-pill inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 text-sm font-medium text-white hover:-translate-y-0.5 rounded-full transition-all duration-200"
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
