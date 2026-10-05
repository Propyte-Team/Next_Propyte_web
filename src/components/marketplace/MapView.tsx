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

type Group = {
  key: string;
  lat: number;
  lng: number;
  properties: PropertyWithCoords[];
};

// ─────────────────────────────────────────────────────
// Agrupado: por DESARROLLO, nunca por cercanía en pantalla.
//
// Historia: la v1 agrupaba por coordenada redondeada (fijo); la v2 añadió un
// segundo paso que fundía en una sola bolita "+N" desarrollos DISTINTOS que
// caían cerca en pantalla, recalculado por zoom. Eso traía un problema de
// fondo: el radio en píxeles no sabe de identidad — un cluster podía mezclar
// unidades de desarrollos completamente ajenos (ej. "Av. Libramiento" y
// "Calle Ceiba 2") solo porque caían a <60px en ese zoom. El panel "Mostrando
// N unidades en este punto" terminaba mintiendo: esas unidades NO estaban en
// el mismo punto (reporte 2026-10-06).
//
// `developmentKey` agrupa por identidad real del desarrollo en vez de por
// geometría: dos unidades del MISMO desarrollo siempre se funden en un "+N"
// (es correcto, son el mismo desarrollo aunque el mapa esté muy alejado), y
// dos desarrollos DISTINTOS nunca se funden entre sí, sin importar qué tan
// cerca estén en pantalla ni en qué zoom. Zoom-independiente a propósito: ya
// no hace falta rastrear el zoom del mapa para esto (se quitaron useMap /
// useMapEvents, que solo existían para el agrupado por píxeles).
function developmentKey(p: PropertyWithCoords): string {
  // Unit con desarrollo padre conocido → la key es la del padre, compartida
  // por todas sus unidades hermanas. Development, o unit huérfana sin
  // development_slug (standalone, sin padre), usa su propio slug/id —
  // único por definición, así que nunca se mezcla con otro desarrollo.
  if (p.kind === 'unit' && p.parentDevelopmentSlug) return p.parentDevelopmentSlug;
  return p.slug || p.id;
}

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
//
// `transform:translate(-50%,-100%)` dentro del propio HTML (no `iconAnchor`)
// porque el ancho del chip varía con el precio ("$1.2M MXN" vs "$950K MXN");
// un `iconAnchor` fijo descentraba el chip y lo hacía chocar con el cluster
// "+N" más cercano cuando había varias unidades próximas (reporte 2026-10-05).
// Con translate queda siempre centrado y apuntando hacia abajo al punto,
// sea cual sea el largo del texto.
function priceIcon(label: string, isHovered: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      position:absolute;left:0;top:0;transform:translate(-50%,-100%)${isHovered ? ' scale(1.2)' : ''};
      background:#1A2F3F;color:#fff;padding:4px 8px;border-radius:6px;
      font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;
      box-shadow:${isHovered ? '0 4px 12px rgba(162,249,255,0.5)' : '0 2px 6px rgba(0,0,0,0.2)'};
      ${isHovered ? 'outline:2px solid #A2F9FF;outline-offset:1px;' : ''}
      transition: box-shadow 150ms, transform 150ms;
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
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
// Inner map content — agrupación por desarrollo (ver developmentKey arriba).
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
  const groups = useMemo<Group[]>(() => {
    const byKey: Record<string, PropertyWithCoords[]> = {};
    for (const p of properties) {
      const key = developmentKey(p);
      (byKey[key] ??= []).push(p);
    }
    // Centroide del desarrollo: promedio de lat/lng de sus unidades. En la
    // práctica casi siempre son el mismo punto exacto (las unidades heredan
    // lat/lng del padre), pero promediar es inofensivo si alguna unidad trae
    // una coordenada propia ligeramente distinta y evita que el pin salte a
    // la posición de "la última unidad procesada".
    return Object.entries(byKey).map(([key, members]) => ({
      key,
      lat: members.reduce((sum, p) => sum + p.location.lat, 0) / members.length,
      lng: members.reduce((sum, p) => sum + p.location.lng, 0) / members.length,
      properties: members,
    }));
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

        // Cluster pin "+N" — todas las unidades agrupadas son del MISMO
        // desarrollo (ver developmentKey), así que "N unidades en este punto"
        // siempre es verdad. onClick filtra el listado a estos IDs.
        // zIndexOffset alto: cuando un cluster cae cerca de un chip de precio
        // individual (otro desarrollo próximo), el círculo "+N" gana y no
        // queda tapado a medias por el chip (reporte 2026-10-05).
        const count = group.properties.length;
        return (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={clusterIcon(count)}
            zIndexOffset={1000}
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
    //
    // isolate: el CSS de Leaflet pone z-index hasta 1000 en sus controles
    // (zoom, atribución) y 600-700 en sus panes de marcadores/popups. Sin un
    // contenedor con su propio stacking context, esos z-index "se escapan"
    // y comparan contra el resto de la página — tapaban el panel "Más" del
    // menú lateral (z-50), que abre justo donde empieza el mapa (reporte
    // 2026-10-05). `isolate` encierra todo el z-index de Leaflet dentro de
    // este div; nunca vuelve a competir con nada de fuera.
    <div data-lenis-prevent className="w-full h-full isolate">
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
