'use client';

import { useCallback, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { formatPriceShort } from '@/lib/formatters';
import type { Property } from '@/types/property';

interface MapViewProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

const RIVIERA_MAYA_CENTER = { lat: 20.42, lng: -87.25 };
const DEFAULT_ZOOM = 9;

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Property | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleMarkerClick = useCallback((property: Property) => {
    setSelected(property);
    if (onPropertyClick) onPropertyClick(property);
  }, [onPropertyClick]);

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#1A2F3F]/10 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A2F3F" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Configura tu API Key de Google Maps</p>
          <p className="text-sm text-gray-400 mt-1">Agrega NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600 font-medium">Error cargando el mapa</p>
          <p className="text-sm text-gray-400 mt-1">Verifica tu API Key de Google Maps</p>
        </div>
      </div>
    );
  }

  const validProperties = properties.filter((p) => p.location.lat && p.location.lng);

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

        {selected && selected.location.lat && selected.location.lng && (
          <InfoWindow
            position={{ lat: selected.location.lat, lng: selected.location.lng }}
            onCloseClick={() => setSelected(null)}
            pixelOffset={[0, -8]}
          >
            <div className="p-1 min-w-[180px]">
              <div className="text-sm font-bold text-[#1A2F3F] mb-1 line-clamp-1">{selected.name}</div>
              <div className="text-xs text-gray-500 mb-2">
                {selected.location.zone}, {selected.location.city}
              </div>
              <div className="text-sm font-bold text-[#0D9488]">
                {formatPriceShort(selected.price.mxn)}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
