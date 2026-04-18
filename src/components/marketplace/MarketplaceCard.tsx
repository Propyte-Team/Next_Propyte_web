'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, ChevronLeft, ChevronRight, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import type { Property } from '@/types/property';

interface MarketplaceCardProps {
  property: Property;
  priority?: boolean;
}

export default function MarketplaceCard({ property, priority = false }: MarketplaceCardProps) {
  const locale = useLocale();
  const tStages = useTranslations('stages');
  const tMkt = useTranslations('marketplace');
  const [currentImg, setCurrentImg] = useState(0);
  const [saved, setSaved] = useState(false);

  const intlLocale = locale === 'en' ? 'en-US' : 'es-MX';
  const formattedPrice = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(property.price.mxn);

  const badgeColors: Record<string, string> = {
    preventa: 'bg-[#F5A623]',
    nuevo: 'bg-[#22C55E]',
    construccion: 'bg-[#1A2F3F]',
    entrega_inmediata: 'bg-[#5CE0D2]',
    proximamente: 'bg-[#6366F1]',
    vendido: 'bg-gray-500',
  };

  return (
    <div className="border-b border-r border-gray-100 hover:shadow-md transition-shadow group">
      <Link href={`/${locale}/propiedades/${property.slug}`} className="block">
        {/* Image with carousel */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {property.images.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(${(i - currentImg) * 100}%)` }}
            >
              <Image
                src={src}
                alt={`${property.name} - ${i + 1}`}
                fill
                sizes="(max-width: 1023px) 100vw, 25vw"
                className="object-cover"
                priority={priority && i === 0}
              />
            </div>
          ))}

          {/* Carousel arrows */}
          {property.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === 0 ? property.images.length - 1 : i - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label={tMkt('cardPrevImage')}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImg(i => (i === property.images.length - 1 ? 0 : i + 1));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label={tMkt('cardNextImage')}
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {/* Save heart */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved(!saved);
            }}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center"
            aria-label={tMkt('cardSave')}
          >
            <Heart
              size={20}
              className={`drop-shadow-md transition-colors ${saved ? 'fill-red-500 text-red-500' : 'fill-transparent text-white hover:text-red-300'}`}
              strokeWidth={2}
            />
          </button>

          {/* Badge */}
          {property.badge && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded ${badgeColors[property.badge] || 'bg-gray-600'}`}>
                {tStages(property.badge)}
              </span>
            </div>
          )}

          {/* Photo indicator dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {property.images.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImg ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Price */}
          <div className="text-lg font-bold text-[#2C2C2C]">{formattedPrice}</div>

          {/* Specs: solo cuando haya algún valor real (units tienen, developments aggregate no) */}
          {(property.specs.bedrooms > 0 || property.specs.bathrooms > 0 || property.specs.area > 0) && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
              {property.specs.bedrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bedrooms}</span>
                  <span className="text-gray-400">{tMkt('cardBedShort')}</span>
                  {(property.specs.bathrooms > 0 || property.specs.area > 0) && (
                    <span className="text-gray-300 mx-0.5">|</span>
                  )}
                </>
              )}
              {property.specs.bathrooms > 0 && (
                <>
                  <span className="font-semibold">{property.specs.bathrooms}</span>
                  <span className="text-gray-400">{tMkt('cardBathShort')}</span>
                  {property.specs.area > 0 && <span className="text-gray-300 mx-0.5">|</span>}
                </>
              )}
              {property.specs.area > 0 && (
                <>
                  <span className="font-semibold">{property.specs.area.toLocaleString(intlLocale)}</span>
                  <span className="text-gray-400">m²</span>
                </>
              )}
            </div>
          )}

          {/* Development-only: inventory + delivery */}
          {property.kind === 'development' && (property.inventory || property.delivery) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              {property.inventory && property.inventory.available !== undefined && (
                <span>
                  {property.inventory.total
                    ? tMkt('cardAvailableOfTotal', {
                        available: property.inventory.available,
                        total: property.inventory.total,
                      })
                    : tMkt('cardAvailableOnly', { available: property.inventory.available })}
                </span>
              )}
              {property.delivery && (property.delivery.text || property.delivery.estimated) && (
                <>
                  {property.inventory?.available !== undefined && (
                    <span className="text-gray-300">·</span>
                  )}
                  <span>
                    {tMkt('cardDeliveryLabel')}: {property.delivery.text || property.delivery.estimated}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Address */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 line-clamp-1">
            <MapPin size={10} className="flex-shrink-0" />
            {property.location.zone}, {property.location.city}
          </div>

          {/* Developer attribution */}
          {property.developer && (
            <div className="text-[10px] text-gray-400 mt-1.5">{property.developer}</div>
          )}

          {/* Investment metrics row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {property.roi.projected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#5CE0D2]/8 text-[#4BCEC0] text-[10px] font-bold rounded-full">
                ROI {property.roi.projected}%
              </span>
            )}
            {property.capRate != null && property.capRate > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#1A2F3F]/8 text-[#1A2F3F] text-[10px] font-bold rounded-full">
                Cap {property.capRate.toFixed(1)}%
              </span>
            )}
            {property.annualRevenue != null && property.annualRevenue > 0 && (
              <span className="text-[10px] text-gray-400 font-medium">
                ${(property.annualRevenue / 1000).toFixed(0)}K/{tMkt('cardYearSuffix')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
