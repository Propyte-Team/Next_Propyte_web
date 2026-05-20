'use client';

import { useCallback, useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { MapPin } from '@/lib/icons';
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
  /** Hover sync map↔card. Pin coincidente con `hoveredId` recibe scale+ring. */
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

const RIVIERA_MAYA_CENTER = { lat: 20.42, lng: -87.25 };
const DEFAULT_ZOOM = 9;

// Precisión 4 decimales ≈ 11m. Suficiente para considerar "mismo punto" 2+
// unidades del mismo desarrollo (que heredan lat/lng del padre) sin agrupar
// edificios distintos a 100m de distancia.
function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

type Group = {
  key: string;
  lat: number;
  lng: number;
  properties: PropertyWithCoords[];
};

// ─────────────────────────────────────────────────────
// Inner map content — agrupación manual.
// Reemplaza @googlemaps/markerclusterer porque su integración con
// @vis.gl/react-google-maps AdvancedMarker tiene un timing bug (los markers
// se crean async tras carga del SDK, el effect del clusterer no los ve).
// Agrupar manualmente por coord rounded da control 100%.
// ─────────────────────────────────────────────────────
function MapContent({
  properties,
  onPropertyClick,
  onClusterClick,
  hoveredId,
  onHover,
}: {
  properties: PropertyWithCoords[];
  onPropertyClick?: (property: Property) => void;
  onClusterClick?: (propertyIds: string[]) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const [selected, setSelected] = useState<PropertyWithCoords | null>(null);

  // Agrupar properties por coord rounded. Stable via useMemo.
  // (Usamos `Record` para evitar shadowing del componente `Map` de vis.gl.)
  const groups = useMemo<Group[]>(() => {
    const byKey: Record<string, Group> = {};
    for (const p of properties) {
      const key = coordKey(p.location.lat, p.location.lng);
      const existing = byKey[key];
      if (existing) {
        existing.properties.push(p);
      } else {
        byKey[key] = {
          key,
          lat: p.location.lat,
          lng: p.location.lng,
          properties: [p],
        };
      }
    }
    return Object.values(byKey);
  }, [properties]);

  const handleMarkerClick = useCallback(
    (property: PropertyWithCoords) => {
      setSelected(property);
      if (onPropertyClick) onPropertyClick(property);
    },
    [onPropertyClick],
  );

  return (
    <>
      {groups.map((group) => {
        if (group.properties.length === 1) {
          // Single property → marker normal con precio
          const property = group.properties[0];
          const isHovered = hoveredId === property.id;
          return (
            <AdvancedMarker
              key={property.id}
              position={{ lat: group.lat, lng: group.lng }}
              onClick={() => handleMarkerClick(property)}
            >
              <div
                className={`bg-[#1A2F3F] text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-[#0F1923] transition-all duration-150 ${
                  isHovered ? 'scale-[1.2] ring-2 ring-propyte-brand ring-offset-1 z-10 relative' : ''
                }`}
                style={{ boxShadow: isHovered ? '0 4px 12px rgba(162, 249, 255, 0.5)' : '0 2px 6px rgba(0,0,0,0.2)' }}
                onMouseEnter={onHover ? () => onHover(property.id) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
              >
                {formatPriceShort(property.price.mxn)}
              </div>
            </AdvancedMarker>
          );
        }

        // Cluster pin "+N" — onClick filtra el listado a estos IDs
        const count = group.properties.length;
        const size = count > 20 ? 52 : count > 10 ? 44 : 36;
        const fontSize = count > 20 ? 14 : count > 10 ? 13 : 12;
        return (
          <AdvancedMarker
            key={group.key}
            position={{ lat: group.lat, lng: group.lng }}
            onClick={() => {
              if (onClusterClick) {
                onClusterClick(group.properties.map((p) => p.id));
              }
            }}
          >
            <div
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: '#A2F9FF',
                color: '#0F1923',
                fontWeight: 800,
                fontSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 -1px 1px 0 rgba(255, 255, 255, 0.55) inset, 0 1px 1px 0 rgba(255, 255, 255, 0.85) inset, 0 4px 12px rgba(162, 249, 255, 0.45), 0 2px 6px rgba(11, 28, 30, 0.2)',
                border: '2px solid white',
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              +{count}
            </div>
          </AdvancedMarker>
        );
      })}

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
            <div className="text-sm font-bold text-[#0E7490]">
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
export default function MapView({ properties, onPropertyClick, onClusterClick, hoveredId, onHover }: MapViewProps) {
  const t = useTranslations('marketplace');
  const [error, setError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="w-full h-full bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#1A2F3F]/10 rounded-full flex items-center justify-center">
            <MapPin size={24} className="text-[#1A2F3F]" />
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
            <MapPin size={24} strokeWidth={1.75} className="text-[#0E7490]" />
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
          hoveredId={hoveredId}
          onHover={onHover}
        />
      </Map>
    </APIProvider>
  );
}
