'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
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
const CLUSTER_THRESHOLD = 20;

// ─────────────────────────────────────────────────────
// Custom renderer for cluster markers (matches MapCluster.tsx style)
// ─────────────────────────────────────────────────────
function createClusterRenderer() {
  return {
    render({ count, position }: { count: number; position: google.maps.LatLng }) {
      const size = count > 20 ? 48 : count > 10 ? 40 : 32;
      const fontSize = count > 20 ? 14 : 12;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: #1A2F3F;
        color: white;
        font-weight: 700;
        font-size: ${fontSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.15s;
      `;
      el.textContent = String(count);
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.1)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: el,
        zIndex: 1000 + count,
      });
    },
  };
}

// ─────────────────────────────────────────────────────
// Inner map content (needs map context from APIProvider)
// ─────────────────────────────────────────────────────
function MapContent({
  properties,
  onPropertyClick,
}: {
  properties: PropertyWithCoords[];
  onPropertyClick?: (property: Property) => void;
}) {
  const map = useMap();
  const [selected, setSelected] = useState<PropertyWithCoords | null>(null);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const enableClustering = properties.length > CLUSTER_THRESHOLD;

  const handleMarkerClick = useCallback(
    (property: PropertyWithCoords) => {
      setSelected(property);
      if (onPropertyClick) onPropertyClick(property);
    },
    [onPropertyClick],
  );

  // Initialize clusterer once map is ready
  useEffect(() => {
    if (!map || !enableClustering) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({
        map,
        renderer: createClusterRenderer(),
      });
    }
    return () => {
      clusterer.current?.clearMarkers();
      clusterer.current?.setMap(null);
      clusterer.current = null;
    };
  }, [map, enableClustering]);

  // Sync markers with clusterer when properties change
  useEffect(() => {
    if (!clusterer.current || !enableClustering) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markersRef.current));
  }, [properties, enableClustering]);

  const setMarkerRef = useCallback(
    (marker: Marker | null, key: string) => {
      if (!enableClustering) return;
      if (marker && markersRef.current[key]) return;
      if (!marker && !markersRef.current[key]) return;

      if (marker) {
        markersRef.current[key] = marker;
      } else {
        delete markersRef.current[key];
      }
    },
    [enableClustering],
  );

  return (
    <>
      {properties.map((property) => (
        <AdvancedMarker
          key={property.id}
          position={{ lat: property.location.lat, lng: property.location.lng }}
          onClick={() => handleMarkerClick(property)}
          ref={(marker) => setMarkerRef(marker, property.id)}
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
            <div className="text-sm font-bold text-[#1A2F3F] mb-1 line-clamp-1">
              {selected.name}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {selected.location.zone}, {selected.location.city}
            </div>
            <div className="text-sm font-bold text-[#0F766E]">
              {formatPriceShort(selected.price.mxn)}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────
// Main MapView (public API unchanged)
// ─────────────────────────────────────────────────────
export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const t = useTranslations('marketplace');
  const [error, setError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
    (p): p is PropertyWithCoords => p.location.lat != null && p.location.lng != null,
  );

  if (properties.length > 0 && validProperties.length === 0) {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#A2F9FF]/15 rounded-full flex items-center justify-center">
            <MapPin size={24} strokeWidth={1.75} className="text-[#0D9488]" />
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
        <MapContent properties={validProperties} onPropertyClick={onPropertyClick} />
      </Map>
    </APIProvider>
  );
}
