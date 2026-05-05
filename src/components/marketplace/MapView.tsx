'use client';

import { useCallback, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { formatPriceShort } from '@/lib/formatters';
import type { Property, PropertyLocation } from '@/types/property';

type PropertyWithCoords = Property & {
  location: PropertyLocation & { lat: number; lng: number };
};

interface MapViewProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

const RIVIERA_MAYA_CENTER = { lat: 20.42, lng: -87.25 };
const DEFAULT_ZOOM = 9;

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const t = useTranslations('marketplace');
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<PropertyWithCoords | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleMarkerClick = useCallback((property: PropertyWithCoords) => {
    setSelected(property);
    if (onPropertyClick) onPropertyClick(property);
  }, [onPropertyClick]);

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#1A2F3F]/10 rounded-full flex items-center justify-center">
            <MapPin size={24} strokeWidth={2} className="text-[#1A2F3F]" />
          </div>
          <p className="text-gray-600 font-medium">{t('mapApiKeyMissing')}</p>
          <p className="text-sm text-gray-600 mt-1">{t('mapApiKeyHint')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600 font-medium">{t('mapError')}</p>
          <p className="text-sm text-gray-600 mt-1">{t('mapErrorHint')}</p>
        </div>
      </div>
    );
  }

  const validProperties = properties.filter(
    (p): p is PropertyWithCoords => p.location.lat != null && p.location.lng != null
  );

  // Empty state cuando hay properties pero ninguna tiene coords (data gap en Supabase)
  if (properties.length > 0 && validProperties.length === 0) {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F5A623]/15 rounded-full flex items-center justify-center">
            <MapPin size={24} strokeWidth={1.75} className="text-[#F5A623]" />
          </div>
          <p className="text-gray-600 font-medium">{t('mapNoCoords')}</p>
          <p className="text-sm text-gray-600 mt-2">{t('mapNoCoordsHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} onError={() => setError(true)}>
      <Map
        defaultCenter={RIVIERA_MAYA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="propyte-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full"
      >
        {validProperties.map((property) => (
          <AdvancedMarker
            key={property.id}
            position={{ lat: property.location.lat, lng: property.location.lng }}
            onClick={() => handleMarkerClick(property)}
          >
            <div
              className="bg-[#1A2F3F] text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-[#0F1923] transition-colors"
              style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
            >
              {formatPriceShort(property.price.mxn)}
            </div>
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.location.lat, lng: selected.location.lng }}
            onCloseClick={() => setSelected(null)}
            pixelOffset={[0, -8]}
          >
            <div className="p-1 min-w-[180px]">
              <div className="text-sm font-bold text-[#1A2F3F] mb-1 line-clamp-1">{selected.name}</div>
              <div className="text-xs text-gray-600 mb-2">
                {selected.location.zone}, {selected.location.city}
              </div>
              <div className="text-sm font-bold text-[#0F766E]">
                {formatPriceShort(selected.price.mxn)}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
