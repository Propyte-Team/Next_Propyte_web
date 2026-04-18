'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { MapPin, Building2, Calendar, TrendingUp, Search } from 'lucide-react';
import { formatPrice } from '@/lib/formatters';
import { slugify } from '@/lib/utils';

interface Development {
  id: string;
  slug: string;
  name: string;
  city: string;
  zone: string;
  state: string;
  price_mxn: number;
  property_type: string;
  stage: string;
  description_es: string;
  description_en: string;
  images: string[];
  developers?: { name: string; logo_url: string | null } | null;
}

interface Props {
  properties: Development[];
  totalCount: number;
  cities: { city: string; count: number }[];
  locale: string;
}

export default function DesarrollosPageContent({ properties, totalCount, cities, locale }: Props) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isEn = locale === 'en';

  const filtered = properties.filter(p => {
    if (selectedCity && p.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {isEn ? 'New Developments' : 'Nuevos Desarrollos'}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {isEn
            ? `${totalCount}+ developments in pre-sale across Riviera Maya and Yucatan`
            : `${totalCount}+ desarrollos en preventa en la Riviera Maya y Yucatan`
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={isEn ? 'Search developments...' : 'Buscar desarrollos...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#5CE0D2] focus:ring-2 focus:ring-[#5CE0D2]/20 outline-none transition-colors"
        />
      </div>

      {/* City filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCity(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedCity
              ? 'bg-[#5CE0D2] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isEn ? 'All' : 'Todos'} ({totalCount})
        </button>
        {cities.map(({ city, count }) => (
          <Link
            key={city}
            href={`/${locale}/desarrollos/${slugify(city)}`}
            onClick={(e) => {
              e.preventDefault();
              setSelectedCity(selectedCity === city ? null : city);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCity === city
                ? 'bg-[#5CE0D2] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {city} ({count})
          </Link>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dev) => (
          <Link
            key={dev.id}
            href={`/${locale}/desarrollos/${dev.slug}`}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-[#5CE0D2]/30 hover:shadow-lg transition-all overflow-hidden"
          >
            {/* Image placeholder */}
            <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {dev.images?.[0] ? (
                <img src={dev.images[0]} alt={dev.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 size={48} className="text-gray-300" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-[#5CE0D2] text-white text-xs font-bold rounded-full uppercase">
                  {dev.stage === 'preventa' ? (isEn ? 'Pre-sale' : 'Preventa') : (isEn ? 'Construction' : 'Construccion')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 group-hover:text-[#5CE0D2] transition-colors line-clamp-1">
                {dev.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <MapPin size={14} />
                <span>{dev.zone !== dev.city ? `${dev.zone}, ` : ''}{dev.city}</span>
              </div>

              {dev.price_mxn > 0 && (
                <div className="mt-3 text-lg font-bold text-gray-900">
                  {isEn ? 'From ' : 'Desde '}{formatPrice(dev.price_mxn)}
                </div>
              )}

              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {dev.property_type === 'departamento' ? (isEn ? 'Apartments' : 'Departamentos') :
                   dev.property_type === 'terreno' ? (isEn ? 'Land' : 'Terrenos') :
                   dev.property_type === 'casa' ? (isEn ? 'Houses' : 'Casas') :
                   dev.property_type}
                </span>
                {dev.developers?.name && (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    {dev.developers.name}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">{isEn ? 'No developments found' : 'No se encontraron desarrollos'}</p>
        </div>
      )}
    </div>
  );
}
