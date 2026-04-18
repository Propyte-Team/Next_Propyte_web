'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Heart, Share2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@/types/property';
import { formatPrice } from '@/lib/formatters';
import ImageGallery from '@/components/property/ImageGallery';
import PropertySpecs from '@/components/property/PropertySpecs';
import FinancialSimulator from '@/components/property/FinancialSimulator';
import ContactSidebar from '@/components/property/ContactSidebar';
import MobileContactBar from '@/components/property/MobileContactBar';
import SimilarProperties from '@/components/property/SimilarProperties';
import ContactForm from '@/components/property/ContactForm';
import Badge from '@/components/ui/Badge';
import StickyBar from '@/components/property/StickyBar';
import Highlights from '@/components/property/Highlights';
import Proximity from '@/components/property/Proximity';
import PriceTimeline from '@/components/property/PriceTimeline';
import VirtualTour from '@/components/property/VirtualTour';
import VideoPlayer from '@/components/property/VideoPlayer';

interface PropertyPageContentProps {
  property: Property;
  similar: Property[];
  locale: string;
  smartRentEstimate?: number | null;
  smartRentEstimateVac?: number | null;
  totalComparables?: number;
  dataFreshness?: string | null;
  airdnaOccupancy?: number;
  airdnaAdr?: number;
}

export default function PropertyPageContent({ property, similar, locale, smartRentEstimate, smartRentEstimateVac, totalComparables, dataFreshness, airdnaOccupancy, airdnaAdr }: PropertyPageContentProps) {
  const t = useTranslations('property');
  const tStages = useTranslations('stages');
  const tTypes = useTranslations('types');
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const description = property.description[locale as 'es' | 'en'] || property.description.es;

  return (
    <div className="pb-24 md:pb-16">
      <StickyBar property={property} />
      {/* Breadcrumbs */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3">
        <nav className="flex items-center gap-1 text-xs text-gray-500">
          <Link href={`/${locale}`} className="hover:text-[#5CE0D2]">{locale === 'es' ? 'Inicio' : 'Home'}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades`} className="hover:text-[#5CE0D2]">{locale === 'es' ? 'Propiedades' : 'Properties'}</Link>
          <ChevronRight size={12} />
          <Link href={`/${locale}/propiedades?city=${encodeURIComponent(property.location.city)}`} className="hover:text-[#5CE0D2]">{property.location.city}</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{property.name}</span>
        </nav>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Gallery */}
        <ImageGallery images={property.images} alt={property.name} media={property.media} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content — 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header — Zillow style */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#2C2C2C]">
                    {formatPrice(property.price.mxn)}
                  </div>
                  {property.roi.projected > 0 && (
                    <div className="inline-flex items-center mt-1 px-2.5 py-0.5 bg-[#5CE0D2]/10 text-[#4BCEC0] text-sm font-bold rounded-full">
                      ROI {property.roi.projected}% anual
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      saved ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Heart size={16} className={saved ? 'fill-red-500' : ''} />
                    {saved ? (locale === 'es' ? 'Guardado' : 'Saved') : (locale === 'es' ? 'Guardar' : 'Save')}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors">
                    <Share2 size={16} />
                    {locale === 'es' ? 'Compartir' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Key facts — pipe format */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-4 text-lg">
                {property.specs.bedrooms > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{property.specs.bedrooms}</span>
                      <span className="text-gray-500 text-base">{t('bedrooms')}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                  </>
                )}
                {property.specs.bathrooms > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{property.specs.bathrooms}</span>
                      <span className="text-gray-500 text-base">{t('bathrooms')}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <span className="font-bold">{property.specs.area.toLocaleString('es-MX')}</span>
                  <span className="text-gray-500 text-base">m²</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 text-base">{tTypes(property.specs.type)}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mt-3">{property.name}</h1>
              <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                <MapPin size={16} />
                <span>{property.location.address || `${property.location.zone}, ${property.location.city}, ${property.location.state}`}</span>
              </div>

              <div className="flex items-center gap-3 mt-3">
                {property.badge && <Badge type={property.badge} label={tStages(property.badge)} />}
                <span className="text-sm text-gray-500">
                  {locale === 'es' ? 'por' : 'by'} <span className="font-semibold text-[#2C2C2C]">{property.developer}</span>
                </span>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2C] mb-3">{t('description')}</h2>
              <div className={`text-gray-600 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
                {description}
              </div>
              <button onClick={() => setExpanded(!expanded)} className="text-[#5CE0D2] text-sm font-semibold mt-2 hover:underline">
                {expanded ? t('readLess') : t('readMore')}
              </button>
            </div>

            <Highlights property={property} />

            {/* Virtual Tour & Video */}
            {(property.media?.virtualTour || property.media?.video) && (
              <div>
                <h2 className="text-xl font-bold text-[#2C2C2C] mb-4">
                  {locale === 'es' ? 'Recorre la propiedad' : 'Explore the property'}
                </h2>
                <div className={`grid gap-4 ${property.media.virtualTour && property.media.video ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {property.media.virtualTour && (
                    <div id="virtual-tour">
                      <VirtualTour url={property.media.virtualTour} propertyName={property.name} />
                    </div>
                  )}
                  {property.media.video && (
                    <div id="video">
                      <VideoPlayer url={property.media.video} propertyName={property.name} thumbnail={property.images[0]} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <PropertySpecs property={property} />
            <PriceTimeline property={property} />
            <FinancialSimulator property={property} state={property.location.state} mlEstimatedRent={smartRentEstimate || undefined} mlEstimatedRentVac={smartRentEstimateVac || undefined} totalComparables={totalComparables} dataFreshness={dataFreshness || undefined} airdnaOccupancy={airdnaOccupancy} airdnaAdr={airdnaAdr} />

            {/* Location & Proximity */}
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2C] mb-3">{t('location')}</h2>
              <div className="bg-[#F4F6F8] rounded-xl h-56 flex items-center justify-center mb-5">
                <div className="text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p className="font-medium">{property.location.zone}, {property.location.city}</p>
                  <p className="text-xs mt-1">{property.location.address}</p>
                </div>
              </div>
              <Proximity city={property.location.city} zone={property.location.zone} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#2C2C2C] mb-4">{t('contactAdvisor')}</h2>
              <ContactForm propertyId={property.id} propertyName={property.name} />
            </div>

            {similar.length > 0 && (
              <div>
                <SimilarProperties properties={similar} />
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <ContactSidebar property={property} smartRentEstimate={smartRentEstimate} />
          </div>
        </div>
      </div>

      <MobileContactBar property={property} />
    </div>
  );
}
