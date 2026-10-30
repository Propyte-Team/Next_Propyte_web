'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
// `Map` se renombra para no pisar el `Map` nativo que usa `agrupar()`.
import { APIProvider, AdvancedMarker, Map as MapaGoogle, useMap } from '@vis.gl/react-google-maps';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { Calendar, Ruler } from '@/lib/icons';
import { dinero, dineroCompacto, m2, mxnExacto } from '../../_components/format';
import { plural, ubicacionCorta } from '../../_components/v2/util';

// ============================================================
// Mapa de los lotes (brief de la diseñadora, 30-oct-2026: «mapa interactivo
// con los distintos lotes»).
//
// Un punto por coordenada, no por lote. `v_units` publica la coordenada del
// DESARROLLO, así que los cinco lotes de Tulum caen en el mismo sitio y
// cuatro de Playa del Carmen, de desarrollos distintos, comparten una
// coordenada idéntica. Dibujar trece marcadores encimados sería mentir sobre
// la precisión del dato: el marcador dice cuántos lotes hay en ese punto y el
// panel de al lado los lista uno por uno con superficie, precio, precio por
// metro y plazo, los mismos números que la fila del catálogo.
//
// UNA SOLA FUENTE DE ESTADO. El punto resaltado es el que contiene la fila
// abierta del catálogo (`abierta`); pulsar un marcador abre la primera fila
// de ese punto y pulsar un lote del panel abre la suya. Así el mapa y la
// lista se resaltan mutuamente sin un segundo estado que sincronizar.
//
// FILTROS. Recibe `visibles` del catálogo, ya filtrados por ciudad, plazo y
// presupuesto: al filtrar, solo quedan los marcadores que coinciden y el
// encuadre se recalcula.
//
// DOS LIENZOS, UN SOLO MARCADOR. El mapa se puede pintar con Google Maps
// (`@vis.gl/react-google-maps`, como pedía el brief) o con Leaflet +
// OpenStreetMap (`MapaLotesOsm.tsx`). Hoy (30-oct-2026) la cuenta de Google
// Cloud del sitio NO tiene facturación habilitada: la API responde
// `BillingNotEnabledMapError`, pinta el mapa oscuro con «For development
// purposes only» y un aviso de Google encima, y no avisa por
// `gm_authFailure`. El marketplace ya pasó por esto y corre sobre Leaflet
// desde oct-2026 (`components/marketplace/MapView.tsx`). Por eso
// `PROVEEDOR.preferido` arranca en `'osm'`: cero fricción y nada que cobrar.
// Para volver a Google cuando la facturación exista basta cambiarlo a
// `'google'`; aun así, si Google falla (sin clave, clave de ejemplo,
// `gm_authFailure` o el aviso de facturación), se cae a OpenStreetMap solo.
//
// DEGRADA A NADA solo cuando no hay nada que pintar: si ningún lote publica
// coordenadas, el componente devuelve `null` y la página es la de antes.
//
// Reglas heredadas: ningún nombre de desarrollo en el DOM (ni en el marcador
// ni en el panel: ubicación, superficie y precio), ninguna cifra inventada,
// `prefers-reduced-motion` respetado en el CSS del tema.
// ============================================================

const PROVEEDOR: { preferido: 'google' | 'osm' } = { preferido: 'osm' };

/** Centro de respaldo mientras no hay puntos: Riviera Maya entera. */
const CENTRO_RIVIERA = { lat: 20.55, lng: -87.2 };
const CLAVE_EJEMPLO = 'your_google_maps_api_key_here';
/** Map ID del sitio (ya usado en `GeoAnalysis.tsx`); `AdvancedMarker` lo exige. */
const MAP_ID = 'propyte-property-map';
const ICONO = 'h-3.5 w-3.5 shrink-0 text-[var(--lpv-fg-3)]';

const MapaOsm = dynamic(() => import('./MapaLotesOsm'), { ssr: false });

export interface PuntoMapa {
  clave: string;
  lat: number;
  lng: number;
  /** Lotes en el punto, en el orden del inventario (precio ascendente). */
  lotes: PropiedadLanding[];
  /** Zona y ciudad si todos coinciden; solo la ciudad si difieren. */
  ubicacion: string;
  /** Texto del marcador: cuántos lotes y desde cuánto, o superficie y precio si es uno. */
  etiqueta: string;
}

function etiquetaMarcador(lotes: PropiedadLanding[], ubicacion: string): string {
  const [primero] = lotes;
  if (lotes.length === 1 && primero) {
    const partes = [primero.m2Terreno ? m2(primero.m2Terreno) : null, primero.precio ? dineroCompacto(primero.precio) : null];
    return partes.filter((p): p is string => p !== null).join(' · ') || ubicacion;
  }
  const desde = primero?.precio ? ` · desde ${dineroCompacto(primero.precio)}` : '';
  return `${plural(lotes.length, 'lote', 'lotes')}${desde}`;
}

function agrupar(lotes: PropiedadLanding[]): PuntoMapa[] {
  const porClave = new Map<string, PuntoMapa>();
  for (const lote of lotes) {
    if (!lote.coordenadas) continue;
    const { lat, lng } = lote.coordenadas;
    const clave = `${lat},${lng}`;
    const punto = porClave.get(clave);
    if (punto) punto.lotes.push(lote);
    else porClave.set(clave, { clave, lat, lng, lotes: [lote], ubicacion: '', etiqueta: '' });
  }
  for (const punto of porClave.values()) {
    const cortas = new Set(punto.lotes.map(ubicacionCorta));
    punto.ubicacion = cortas.size === 1 ? [...cortas][0] : (punto.lotes[0]?.ciudad ?? '');
    punto.etiqueta = etiquetaMarcador(punto.lotes, punto.ubicacion);
  }
  return [...porClave.values()];
}

function textoPlazo(lote: PropiedadLanding, plazoFiltro: number | null): string {
  const plazos = lote.mesesOpciones;
  if (plazos.length === 0) return 'plazo no declarado';
  if (plazoFiltro && plazos.includes(plazoFiltro)) return `${plazoFiltro} meses`;
  return `hasta ${Math.max(...plazos)} meses`;
}

/** Encuadra los puntos visibles en Google. Solo re-encuadra cuando cambian los puntos. */
function EncuadreGoogle({ puntos }: { puntos: PuntoMapa[] }) {
  const mapa = useMap();
  const firma = puntos.map((p) => p.clave).join('|');
  useEffect(() => {
    if (!mapa || puntos.length === 0) return;
    if (puntos.length === 1) {
      mapa.setCenter({ lat: puntos[0].lat, lng: puntos[0].lng });
      mapa.setZoom(13);
      return;
    }
    const limites = new google.maps.LatLngBounds();
    for (const p of puntos) limites.extend({ lat: p.lat, lng: p.lng });
    mapa.fitBounds(limites, { top: 56, right: 56, bottom: 56, left: 56 });
    // `firma` resume `puntos`: mismo conjunto de claves, mismo encuadre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, firma]);
  return null;
}

function MapaConGoogle({
  clave,
  puntos,
  activo,
  onAbrir,
  onFallo,
}: {
  clave: string;
  puntos: PuntoMapa[];
  activo: string | null;
  onAbrir: (id: string) => void;
  onFallo: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  // Google no llama a `gm_authFailure` por falta de facturación: inyecta un
  // aviso con un botón `.dismissButton` dentro del mapa. Se vigila el DOM y,
  // si aparece, se cambia de lienzo antes de que el visitante lo lea.
  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    const observador = new MutationObserver(() => {
      if (nodo.querySelector('.dismissButton')) onFallo();
    });
    observador.observe(nodo, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [onFallo]);

  return (
    <div ref={contenedor} className="h-full w-full">
      <APIProvider apiKey={clave} onError={onFallo}>
        <MapaGoogle
          defaultCenter={CENTRO_RIVIERA}
          defaultZoom={8}
          mapId={MAP_ID}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          className="h-full w-full"
        >
          <EncuadreGoogle puntos={puntos} />
          {puntos.map((punto) => {
            const esActivo = punto.clave === activo;
            return (
              <AdvancedMarker
                key={punto.clave}
                position={{ lat: punto.lat, lng: punto.lng }}
                title={`${punto.ubicacion}: ${punto.etiqueta}`}
                zIndex={esActivo ? 2 : 1}
                onClick={() => {
                  const primero = punto.lotes[0];
                  if (primero) onAbrir(primero.id);
                }}
              >
                <div className="lpt2-marcador" data-activo={esActivo} data-lpt2-marcador>
                  <span className="lpt2-marcador-chip lpt2-mono">{punto.etiqueta}</span>
                  <span className="lpt2-marcador-pie" aria-hidden />
                </div>
              </AdvancedMarker>
            );
          })}
        </MapaGoogle>
      </APIProvider>
    </div>
  );
}

function desplazarA(id: string) {
  const nodo = document.getElementById(id);
  if (!nodo) return;
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  nodo.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'center' });
}

export default function MapaLotes({
  lotes,
  visibles,
  abierta,
  onAbrir,
  onElegir,
  elegido,
  plazoFiltro,
}: {
  /** Inventario completo: decide si el mapa existe. */
  lotes: PropiedadLanding[];
  /** Lo que pasa los filtros activos: decide qué marcadores se dibujan. */
  visibles: PropiedadLanding[];
  /** Fila abierta del catálogo; su punto va resaltado. */
  abierta: string | null;
  onAbrir: (id: string) => void;
  onElegir: (slug: string) => void;
  elegido: string | null;
  plazoFiltro: number | null;
}) {
  const claveGoogle = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [falloGoogle, setFalloGoogle] = useState(false);

  // Clave inválida o dominio no autorizado: Google sí avisa por aquí.
  useEffect(() => {
    const w = window as Window & { gm_authFailure?: () => void };
    const previo = w.gm_authFailure;
    w.gm_authFailure = () => setFalloGoogle(true);
    return () => {
      w.gm_authFailure = previo;
    };
  }, []);

  const puntos = useMemo(() => agrupar(visibles), [visibles]);
  const hayCoordenadas = useMemo(() => lotes.some((l) => l.coordenadas !== null), [lotes]);
  const sinPunto = visibles.filter((l) => l.coordenadas === null).length;

  if (!hayCoordenadas) return null;

  const puntoActivo = puntos.find((p) => p.lotes.some((l) => l.id === abierta)) ?? null;
  const usarGoogle =
    PROVEEDOR.preferido === 'google' && !!claveGoogle && claveGoogle !== CLAVE_EJEMPLO && !falloGoogle;

  return (
    <section aria-label="Mapa de los terrenos" className="border-b border-[var(--lpv-line)] bg-white">
      <div className="mx-auto grid max-w-[96rem] lg:grid-cols-12">
        <div
          className="relative h-[340px] bg-[var(--lpv-bg-2)] sm:h-[440px] lg:col-span-8 lg:h-[560px]"
          data-lpt2-mapa={usarGoogle ? 'google' : 'osm'}
        >
          {usarGoogle ? (
            <MapaConGoogle
              clave={claveGoogle as string}
              puntos={puntos}
              activo={puntoActivo?.clave ?? null}
              onAbrir={onAbrir}
              onFallo={() => setFalloGoogle(true)}
            />
          ) : (
            <MapaOsm puntos={puntos} activo={puntoActivo?.clave ?? null} onAbrir={onAbrir} />
          )}
        </div>

        {/* Panel: los lotes del punto resaltado, con los números del catálogo. */}
        <div className="flex min-w-0 flex-col border-t border-[var(--lpv-line)] lg:col-span-4 lg:border-l lg:border-t-0">
          {puntoActivo ? (
            <>
              <div className="px-5 pb-4 pt-6 sm:px-8">
                <p className="text-[0.8125rem] text-[var(--lpv-fg-3)]">Ubicación</p>
                <p className="lpt2-display mt-1 text-[clamp(1.5rem,1.2rem+1vw,2rem)] text-[var(--lpv-fg)]">
                  {puntoActivo.ubicacion}
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--lpv-fg-2)]">
                  {plural(puntoActivo.lotes.length, 'terreno en este punto', 'terrenos en este punto')}
                </p>
              </div>
              <ul className="divide-y divide-[var(--lpv-line)] border-t border-[var(--lpv-line)] lg:max-h-[420px] lg:overflow-y-auto">
                {puntoActivo.lotes.map((lote) => {
                  const esAbierto = lote.id === abierta;
                  const esElegido = elegido === lote.slug;
                  return (
                    <li key={lote.id} className="lpt2-mapa-lote px-5 py-4 sm:px-8" data-abierto={esAbierto}>
                      <button
                        type="button"
                        onClick={() => {
                          onAbrir(lote.id);
                          desplazarA(`lote-${lote.id}`);
                        }}
                        aria-pressed={esAbierto}
                        className="flex w-full items-baseline justify-between gap-4 text-left"
                      >
                        <span className="lpt2-display text-[1.75rem] text-[var(--lpv-fg)]">
                          {lote.m2Terreno ? (
                            <>
                              {m2(lote.m2Terreno).replace(' m²', '')}
                              <span className="ml-1 align-top text-[0.5em] font-normal text-[var(--lpv-fg-3)]">m²</span>
                            </>
                          ) : (
                            <span className="lpt2-display-ligero text-[0.6em] text-[var(--lpv-fg-3)]">superficie por confirmar</span>
                          )}
                        </span>
                        <span className="lpt2-display text-[1.25rem] text-[var(--lpv-fg)]">
                          {lote.precio ? dinero(lote.precio) : 'Precio por confirmar'}
                        </span>
                      </button>
                      <p className="lpt2-mono mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-[var(--lpv-fg-2)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Ruler className={ICONO} aria-hidden />
                          {lote.precioM2Mxn ? `${mxnExacto(lote.precioM2Mxn)} / m²` : 'precio por m² por confirmar'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className={ICONO} aria-hidden />
                          {textoPlazo(lote, plazoFiltro)}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => onElegir(lote.slug)}
                        aria-pressed={esElegido}
                        className="lpt2-plazo mt-3 min-h-[36px] px-4 text-[0.8125rem]"
                      >
                        {esElegido ? 'Elegido' : 'Me interesa'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="px-5 py-8 text-[0.9375rem] text-[var(--lpv-fg-2)] sm:px-8">
              {visibles.length === 0
                ? 'Ningún terreno cumple con los filtros elegidos.'
                : 'Elige un punto del mapa para ver sus terrenos.'}
            </p>
          )}
          {sinPunto > 0 && (
            <p className="mt-auto border-t border-[var(--lpv-line)] px-5 py-3 text-[0.75rem] text-[var(--lpv-fg-3)] sm:px-8">
              {plural(sinPunto, 'terreno sin coordenadas publicadas aparece', 'terrenos sin coordenadas publicadas aparecen')} solo en la lista.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
