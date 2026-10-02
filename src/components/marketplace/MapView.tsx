'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

const RIVIERA_MAYA_CENTER: [number, number] = [20.42, -87.25];
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
// Solución temporal 2026-10: Google Maps devuelve
// `BillingNotEnabledMapError` (falta vincular tarjeta/cuenta de facturación
// en Google Cloud — ver claude/mapa-google-maps-billing-2026-10-02.md en el
// proyecto "Sistemas"). Mientras se resuelve, el mapa corre sobre Leaflet +
// tiles de OpenStreetMap: sin API key, sin facturación, cero fricción.
// Revertir a @vis.gl/react-google-maps (sigue en package.json) una vez
// habilitada la facturación, si se prefiere el estilo de Google.
// ─────────────────────────────────────────────────────

// Pines con `L.divIcon` en vez de `L.Icon.Default`: evita el bug clásico de
// bundlers con las imágenes default de Leaflet (marker-icon.png 404) y
// replica el estilo de chip de precio que ya existía con AdvancedMarker.
function priceIcon(label: string, isHovered: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#1A2F3F;color:#fff;padding:4px 8px;border-radius:6px;
      font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;
      box-shadow:${isHovered ? '0 4px 12px rgba(162,249,255,0.5)' : '0 2px 6px rgba(0,0,0,0.2)'};
      transform:${isHovered ? 'scale(1.2)' : 'scale(1)'};
      ${isHovered ? 'outline:2px solid #A2F9FF;outline-offset:1px;' : ''}
      transition: box-shadow 150ms, transform 150ms;
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 20],
  });
}

function clusterIcon(count: number): L.DivIcon {
  const size = count > 20 ? 52 : count > 10 ? 44 : 36;
  const fontSize = count > 20 ? 14 : count > 10 ? 13 : 12;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;background:#A2F9FF;
      color:#0F1923;font-weight:800;font-size:${fontSize}px;display:flex;
      align-items:center;justify-content:center;border:2px solid white;
      cursor:pointer;font-variant-numeric:tabular-nums;
      box-shadow:0 -1px 1px 0 rgba(255,255,255,0.55) inset, 0 1px 1px 0 rgba(255,255,255,0.85) inset, 0 4px 12px rgba(162,249,255,0.45), 0 2px 6px rgba(11,28,30,0.2);
    ">+${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─────────────────────────────────────────────────────
// Inner map content — agrupación manual (idéntica a la versión Google Maps).
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
  // Agrupar properties por coord rounded. Stable via useMemo.
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

  return (
    <>
      {groups.map((group) => {
        if (group.properties.length === 1) {
          // Single property → marker normal con precio
          const property = group.properties[0];
          const isHovered = hoveredId === property.id;
          return (
            <Marker
              key={property.id}
              position={[group.lat, group.lng]}
              icon={priceIcon(formatPriceShort(property.price.mxn), isHovered)}
              eventHandlers={{
                click: () => onPropertyClick?.(property),
                mouseover: () => onHover?.(property.id),
                mouseout: () => onHover?.(null),
              }}
            >
              <Popup offset={[0, -16]}>
                <div className="p-1 min-w-[180px]">
                  <div className="text-sm font-bold text-[#1A2F3F] mb-1 line-clamp-1">
                    {property.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {property.location.zone}, {property.location.city}
                  </div>
                  <div className="text-sm font-bold text-[#0E7490]">
                    {formatPriceShort(property.price.mxn)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        // Cluster pin "+N" — onClick filtra el listado a estos IDs
        const count = group.properties.length;
        return (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={clusterIcon(count)}
            eventHandlers={{
              click: () => onClusterClick?.(group.properties.map((p) => p.id)),
            }}
          />
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────
// Main MapView
// ─────────────────────────────────────────────────────
export default function MapView({ properties, onPropertyClick, onClusterClick, hoveredId, onHover }: MapViewProps) {
  const t = useTranslations('marketplace');

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
    // data-lenis-prevent: el smooth-scroll global (Lenis) intercepta el wheel en
    // toda la página y le ganaba al mapa. Con este atributo Lenis ignora el wheel
    // aquí dentro → Leaflet hace zoom con scroll y NO se scrollea la página
    // mientras el mouse está sobre el mapa.
    <div data-lenis-prevent className="w-full h-full">
      <MapContainer
        center={RIVIERA_MAYA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapContent
          properties={validProperties}
          onPropertyClick={onPropertyClick}
          onClusterClick={onClusterClick}
          hoveredId={hoveredId}
          onHover={onHover}
        />
      </MapContainer>
    </div>
  );
}
