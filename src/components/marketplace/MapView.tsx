'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

// Radio en PÍXELES (no en metros ni en grados) dentro del cual dos puntos se
// funden en un mismo cluster "+N". Al ser en píxeles, el agrupado depende del
// zoom: con el mapa alejado, desarrollos distintos que caen a pocos píxeles
// uno de otro se ven como un solo "+N"; al acercar el zoom esa misma distancia
// real ocupa muchos más píxeles en pantalla, así que deja de superar el radio
// y los pines se separan solos en sus ubicaciones reales (reporte 2026-10-05:
// "al hacer zoom deberían separarse en los precios y lugares reales"). Antes
// el agrupado era por coordenada redondeada, fijo sin importar el zoom.
const CLUSTER_PIXEL_RADIUS = 60;

// Zoom a partir del cual se desactiva el agrupado por proximidad por completo
// y cada desarrollo se muestra siempre en su pin individual, sin importar qué
// tan cerca esté de otro en pantalla. Sin este tope, dos desarrollos a pocos
// metros reales uno de otro (mismo predio/manzana) podían seguir cayendo
// dentro de CLUSTER_PIXEL_RADIUS incluso al zoom máximo del mapa (18, default
// de Leaflet, nunca lo sobreescribimos) y la bolita "+N" nunca se abría —
// reporte 2026-10-05: "al hacer el máximo zoom... ya deberían verse las
// etiquetas de cada desarrollo por separado". El clusterer de Google Maps que
// reemplazamos sí tenía este tope (maxZoom); el agrupado por píxeles por sí
// solo no lo garantiza porque es continuo, no un escalón duro.
const DISABLE_CLUSTERING_AT_ZOOM = 17;

// Agrupa "puntos" (ya deduplicados por coordenada exacta) por cercanía en
// píxeles a un zoom dado. Greedy O(n²): de sobra para los cientos de
// desarrollos que tiene el catálogo, y evita sumar una librería de
// clustering — mismo criterio de "control 100%" que ya se documentó arriba
// para los pines (agrupación manual en vez de un paquete de terceros).
function clusterByPixelProximity(points: Group[], map: L.Map, zoom: number): Group[] {
  const projected = points.map((pt) => ({ pt, px: map.project([pt.lat, pt.lng], zoom) }));
  const used = new Array(projected.length).fill(false);
  const result: Group[] = [];

  for (let i = 0; i < projected.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const members = [projected[i]];
    for (let j = i + 1; j < projected.length; j++) {
      if (used[j]) continue;
      if (projected[i].px.distanceTo(projected[j].px) <= CLUSTER_PIXEL_RADIUS) {
        used[j] = true;
        members.push(projected[j]);
      }
    }
    const properties = members.flatMap((m) => m.pt.properties);
    result.push({
      // Ids ordenados en vez del índice de iteración: la key tiene que ser
      // estable entre renders (mismo set de propiedades agrupadas = misma
      // key) para que React no desmonte/remonte el marker sin necesidad.
      key: properties.map((p) => p.id).sort().join('+'),
      lat: members.reduce((sum, m) => sum + m.pt.lat, 0) / members.length,
      lng: members.reduce((sum, m) => sum + m.pt.lng, 0) / members.length,
      properties,
    });
  }
  return result;
}

// Zoom actual del mapa como estado de React. `useMap` no re-renderiza al
// cambiar el zoom por sí solo — hace falta escuchar `zoomend` a mano.
function useCurrentZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    zoomend() {
      setZoom(map.getZoom());
    },
  });
  return zoom;
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
// Inner map content — agrupación manual en dos niveles (ver
// `clusterByPixelProximity` arriba): coordenada exacta, zoom-independiente,
// y luego proximidad en píxeles, zoom-dependiente.
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
  const map = useMap();
  const zoom = useCurrentZoom();

  // Nivel 1 — fijo, no depende del zoom: funde unidades que comparten
  // literalmente la misma coordenada (varias unidades del mismo desarrollo,
  // que heredan el lat/lng del padre). Esas SÍ son el mismo punto en el mapa
  // sea cual sea el zoom, así que nunca deberían "separarse".
  const locationPoints = useMemo<Group[]>(() => {
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

  // Nivel 2 — sí depende del zoom: funde puntos de desarrollos DISTINTOS que
  // caen cerca en pantalla. Se recalcula cuando cambia el zoom, así que al
  // acercar el mapa los clusters se abren solos en las ubicaciones reales.
  // A partir de DISABLE_CLUSTERING_AT_ZOOM se desactiva del todo: cada
  // desarrollo siempre en su propio pin, sin importar la distancia en pantalla.
  const groups = useMemo<Group[]>(
    () =>
      zoom >= DISABLE_CLUSTERING_AT_ZOOM
        ? locationPoints
        : clusterByPixelProximity(locationPoints, map, zoom),
    [locationPoints, map, zoom],
  );

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

        // Cluster pin "+N" — onClick filtra el listado a estos IDs.
        // zIndexOffset alto: cuando un cluster cae cerca de un chip de precio
        // individual (zoom alejado, varios desarrollos próximos), el círculo
        // "+N" gana y no queda tapado a medias por el chip (reporte 2026-10-05).
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
