'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Cluster, Marker } from '@googlemaps/markerclusterer';
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
  /**
   * Callback invocado cuando el usuario clickea un cluster pin "+N".
   * Recibe los property.id de las unidades agrupadas para que el listado
   * pueda filtrar a solo esas unidades. (Decisión arquitectónica 2026-05-11.)
   */
  onClusterClick?: (propertyIds: string[]) => void;
}

const RIVIERA_MAYA_CENTER = { lat: 20.42, lng: -87.25 };
const DEFAULT_ZOOM = 9;

// ─────────────────────────────────────────────────────
// Custom renderer para cluster markers — pin "+N" con brand cyan.
// onClusterClickRef se inyecta para que el handler de click pueda
// emitir los IDs de las propiedades al parent en el momento del click,
// sin re-renderear el clusterer en cada cambio de callback.
// ─────────────────────────────────────────────────────
function createClusterRenderer() {
  return {
    render({ count, position }: Cluster) {
      const size = count > 20 ? 52 : count > 10 ? 44 : 36;
      const fontSize = count > 20 ? 14 : count > 10 ? 13 : 12;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: #A2F9FF;
        color: #0F1923;
        font-weight: 800;
        font-size: ${fontSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          0 -1px 1px 0 rgba(255, 255, 255, 0.55) inset,
          0  1px 1px 0 rgba(255, 255, 255, 0.85) inset,
          0  4px 12px rgba(162, 249, 255, 0.45),
          0  2px 6px rgba(11, 28, 30, 0.20);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.15s ease;
        font-variant-numeric: tabular-nums;
      `;
      el.textContent = `+${count}`;
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
  onClusterClick,
}: {
  properties: PropertyWithCoords[];
  onPropertyClick?: (property: Property) => void;
  onClusterClick?: (propertyIds: string[]) => void;
}) {
  const map = useMap();
  const [selected, setSelected] = useState<PropertyWithCoords | null>(null);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const markerToIdRef = useRef<WeakMap<Marker, string>>(new WeakMap());
  // Ref-mirror del callback para que el handler del clusterer (registrado
  // una sola vez) siempre invoque la versión más reciente sin re-suscribir.
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  // Activamos clustering siempre que haya 2+ markers — incluye el caso de
  // varias unidades en el mismo edificio (mismo lat/lng). Decisión 2026-05-11.
  const enableClustering = properties.length >= 2;

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
        onClusterClick: (event, cluster) => {
          // Prevenimos zoom-in default y emitimos IDs al parent para filtrar
          // el listado. Si no hay handler, dejamos pasar el comportamiento
          // estándar de zoom-in.
          if (!onClusterClickRef.current) return;
          event.stop?.();
          const ids = (cluster.markers || [])
            .map((m) => markerToIdRef.current.get(m))
            .filter((id): id is string => typeof id === 'string');
          if (ids.length > 0) onClusterClickRef.current(ids);
        },
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
        markerToIdRef.current.set(marker, key);
      } else {
        const existing = markersRef.current[key];
        if (existing) markerToIdRef.current.delete(existing);
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
// Main MapView
// ─────────────────────────────────────────────────────
export default function MapView({ properties, onPropertyClick, onClusterClick }: MapViewProps) {
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
        <MapContent
          properties={validProperties}
          onPropertyClick={onPropertyClick}
          onClusterClick={onClusterClick}
        />
      </Map>
    </APIProvider>
  );
}
