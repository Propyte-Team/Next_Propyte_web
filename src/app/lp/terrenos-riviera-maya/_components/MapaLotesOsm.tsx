'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PuntoMapa } from './MapaLotes';

// ============================================================
// Lienzo de respaldo del mapa de lotes: Leaflet + teselas de OpenStreetMap.
//
// Mismo camino que tomó el marketplace (`components/marketplace/MapView.tsx`,
// oct-2026): Google Maps devuelve `BillingNotEnabledMapError` mientras la
// cuenta de Google Cloud no tenga facturación, y en ese estado pinta el mapa
// oscuro con un aviso encima. OpenStreetMap no pide clave ni facturación.
//
// Dibuja EXACTAMENTE los mismos marcadores que el lienzo de Google (misma
// clase `lpt2-marcador`, mismo texto), así que el visitante no nota qué
// proveedor hay debajo. Se carga con `next/dynamic` y `ssr: false` porque
// Leaflet toca `window` al importarse.
// ============================================================

const CENTRO_RIVIERA: [number, number] = [20.55, -87.2];

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * El chip se centra y cuelga sobre el punto con `translate(-50%,-100%)`
 * dentro del propio HTML: el ancho varía con el texto, y un `iconAnchor`
 * fijo lo descentraría.
 */
function icono(etiqueta: string, activo: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="lpt2-marcador" data-activo="${activo}" data-lpt2-marcador style="position:absolute;left:0;top:0;transform:translate(-50%,-100%)"><span class="lpt2-marcador-chip lpt2-mono">${escapar(etiqueta)}</span><span class="lpt2-marcador-pie"></span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function Encuadre({ puntos }: { puntos: PuntoMapa[] }) {
  const mapa = useMap();
  const firma = puntos.map((p) => p.clave).join('|');
  useEffect(() => {
    if (puntos.length === 0) return;
    if (puntos.length === 1) {
      mapa.setView([puntos[0].lat, puntos[0].lng], 13);
      return;
    }
    mapa.fitBounds(
      L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [56, 56] },
    );
    // `firma` resume `puntos`: mismo conjunto de claves, mismo encuadre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, firma]);
  return null;
}

export default function MapaLotesOsm({
  puntos,
  activo,
  onAbrir,
}: {
  puntos: PuntoMapa[];
  /** Clave del punto resaltado. */
  activo: string | null;
  onAbrir: (id: string) => void;
}) {
  return (
    // `isolate`: Leaflet pone z-index hasta 1000 en sus controles; sin un
    // stacking context propio taparían la barra de filtros pegajosa.
    <div className="isolate h-full w-full">
      <MapContainer
        center={CENTRO_RIVIERA}
        zoom={8}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Encuadre puntos={puntos} />
        {puntos.map((punto) => (
          <Marker
            key={punto.clave}
            position={[punto.lat, punto.lng]}
            icon={icono(punto.etiqueta, punto.clave === activo)}
            title={`${punto.ubicacion}: ${punto.etiqueta}`}
            alt={`${punto.ubicacion}: ${punto.etiqueta}`}
            zIndexOffset={punto.clave === activo ? 1000 : 0}
            eventHandlers={{
              click: () => {
                const primero = punto.lotes[0];
                if (primero) onAbrir(primero.id);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
