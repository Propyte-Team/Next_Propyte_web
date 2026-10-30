'use client';

import { useCallback, useRef, useState } from 'react';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { Calendar, Percent, Ruler } from '@/lib/icons';
import { dinero, m2, mxn, mxnExacto } from '../../_components/format';
import { ANCLA_INVENTARIO } from '../../_components/v2/ChipsUbicacion';
import type { FiltroDef } from '../../_components/v2/filtros';
import { useFiltros } from '../../_components/v2/useFiltros';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, ubicacionCorta } from '../../_components/v2/util';
import { COMERCIALIZADORA, FORM, NOTA_MENSUALIDAD, SIN_PLAN } from '../_copy';

// ============================================================
// El catálogo: filas de ancho completo, una por lote.
//
// Cada fila es una línea de tabla que se puede abrir. Cerrada, muestra lo
// que se compara entre lotes: superficie (grande), título y ubicación,
// precio total y precio por metro. Abierta, enseña las fotos y el plan por
// plazo, con el botón que elige el lote para el formulario. Solo una fila
// está abierta a la vez; la primera arranca abierta para que la página no
// parezca una lista de títulos.
//
// La mensualidad se CALCULA aquí, no viene del Hub: (precio - enganche) /
// meses, sin intereses, y solo cuando el registro declara enganche y plazos
// en pesos. Donde no, se dice por qué no hay cifra en vez de inventarla.
//
// FILTROS (30-oct-2026): ciudad, plazo y presupuesto comparten estado con el
// hero y el formulario por `useFiltros`. El plazo elegido arriba manda sobre
// el selector de la fila: si alguien pidió «24 meses», la cuota que ve es la
// de 24 meses, no la del plazo más largo.
// ============================================================

const ICONO = 'h-3.5 w-3.5 shrink-0 text-[var(--lpv-fg-3)]';

function mensualidad(p: PropiedadLanding, meses: number): number | null {
  if (!p.precio || p.precio.moneda !== 'MXN' || !p.enganchePct || meses <= 0) return null;
  const enganche = p.engancheMxn ?? (p.precio.monto * p.enganchePct) / 100;
  return Math.round((p.precio.monto - enganche) / meses);
}

function Fila({
  lote,
  abierta,
  onToggle,
  onElegir,
  elegido,
  prioridad,
  plazoFiltro,
}: {
  lote: PropiedadLanding;
  abierta: boolean;
  onToggle: () => void;
  onElegir: () => void;
  elegido: boolean;
  prioridad: boolean;
  /** Plazo elegido en los filtros, si lo hay y este lote lo ofrece. */
  plazoFiltro: number | null;
}) {
  const plazos = lote.mesesOpciones;
  // El plazo del filtro manda; la elección manual en la fila solo vale
  // mientras el filtro no cambie (se guarda junto con el filtro que la vio
  // nacer). Derivado, sin efecto: no hay estado que sincronizar.
  const [manual, setManual] = useState<{ base: number | null; valor: number } | null>(null);
  const porDefecto =
    plazoFiltro && plazos.includes(plazoFiltro) ? plazoFiltro : plazos.length > 0 ? Math.max(...plazos) : 0;
  const plazo = manual && manual.base === plazoFiltro ? manual.valor : porDefecto;
  const setPlazo = (valor: number) => setManual({ base: plazoFiltro, valor });
  const cuota = plazos.length > 0 ? mensualidad(lote, plazo) : null;
  const enganche =
    lote.precio && lote.enganchePct
      ? (lote.engancheMxn ?? (lote.precio.monto * lote.enganchePct) / 100)
      : null;
  const estado = lote.estadoComercial !== 'disponible' ? ESTADO_TEXTO[lote.estadoComercial] : null;
  const idDetalle = `detalle-${lote.id}`;

  return (
    <li className="lpt2-fila" data-abierta={abierta}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="grid w-full grid-cols-1 gap-x-8 gap-y-3 px-5 py-6 text-left sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:py-7"
      >
        {/* Superficie: la cifra que se compara primero. */}
        <p className="lpt2-display text-[clamp(2.5rem,1.6rem+3vw,5rem)] text-[var(--lpv-fg)] lg:min-w-[11ch]">
          {lote.m2Terreno ? (
            <>
              {m2(lote.m2Terreno).replace(' m²', '')}
              <span className="ml-1.5 align-top text-[0.4em] font-normal text-[var(--lpv-fg-3)]">m²</span>
            </>
          ) : (
            <span className="lpt2-display-ligero text-[0.45em] text-[var(--lpv-fg-3)]">superficie por confirmar</span>
          )}
        </p>

        <div className="min-w-0">
          <h3 className="text-[1.0625rem] font-medium leading-snug text-[var(--lpv-fg)] lg:text-[1.125rem]">
            {lote.titulo}
          </h3>
          <p className="mt-1 text-[0.9375rem] text-[var(--lpv-fg-2)]">
            {ubicacionCorta(lote)}
            {estado ? ` · ${estado}` : ''}
          </p>
        </div>

        <div className="lg:text-right">
          <p className="lpt2-display text-[clamp(1.5rem,1.1rem+1.4vw,2.5rem)] text-[var(--lpv-fg)]">
            {lote.precio ? dinero(lote.precio) : 'Precio por confirmar'}
          </p>
          <p className="lpt2-mono mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-[var(--lpv-fg-2)] lg:justify-end">
            <span className="inline-flex items-center gap-1.5">
              <Ruler className={ICONO} aria-hidden />
              {lote.precioM2Mxn ? `${mxnExacto(lote.precioM2Mxn)} / m²` : 'precio por m² por confirmar'}
            </span>
            {plazos.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className={ICONO} aria-hidden />
                hasta {Math.max(...plazos)} meses
              </span>
            )}
            {lote.enganchePct ? (
              <span className="inline-flex items-center gap-1.5">
                <Percent className={ICONO} aria-hidden />
                enganche {lote.enganchePct}%
              </span>
            ) : null}
          </p>
        </div>
      </button>

      {abierta && (
        <div id={idDetalle} className="lpt2-detalle grid gap-8 px-5 pb-10 sm:px-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <GaleriaFicha
              imagenes={lote.imagenes}
              alt={`${lote.titulo}, ${ubicacionCorta(lote)}`}
              aspecto="aspect-[3/2]"
              sizes="(min-width: 1024px) 56vw, 100vw"
              tope={8}
              prioridad={prioridad}
            />
          </div>

          <div className="lg:col-span-5">
            {plazos.length > 0 && cuota !== null ? (
              <>
                <p className="inline-flex items-center gap-1.5 text-[0.9375rem] text-[var(--lpv-fg-2)]">
                  <Calendar className={ICONO} aria-hidden />
                  Plazo
                </p>
                <div role="group" aria-label="Plazo en meses" className="mt-3 flex flex-wrap gap-2">
                  {plazos.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={m === plazo}
                      onClick={() => setPlazo(m)}
                      className="lpt2-plazo min-h-[40px] px-4 text-[0.9375rem]"
                    >
                      {m} meses
                    </button>
                  ))}
                </div>
                <p className="lpt2-display mt-6 text-[clamp(2.25rem,1.6rem+2.4vw,4rem)] text-[var(--lpv-fg)]">
                  {mxn(cuota)}
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--lpv-fg-2)]">
                  al mes durante {plazo} meses
                </p>
                {enganche ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[0.9375rem] text-[var(--lpv-fg-2)]">
                    <Percent className={ICONO} aria-hidden />
                    {mxn(enganche)} de enganche ({lote.enganchePct}%)
                  </p>
                ) : null}
                <p className="mt-4 max-w-[48ch] text-[0.8125rem] leading-relaxed text-[var(--lpv-fg-3)]">
                  {NOTA_MENSUALIDAD}
                </p>
              </>
            ) : (
              <>
                <p className="lpt2-display text-[clamp(2.25rem,1.6rem+2.4vw,4rem)] text-[var(--lpv-fg)]">
                  {lote.precio ? dinero(lote.precio) : 'Precio por confirmar'}
                </p>
                {enganche ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[0.9375rem] text-[var(--lpv-fg-2)]">
                    <Percent className={ICONO} aria-hidden />
                    Enganche {lote.enganchePct}%, {mxn(enganche)}
                  </p>
                ) : null}
                <p className="mt-4 max-w-[48ch] text-[0.8125rem] leading-relaxed text-[var(--lpv-fg-3)]">{SIN_PLAN}</p>
              </>
            )}

            <button
              type="button"
              onClick={onElegir}
              aria-pressed={elegido}
              className="mt-8 inline-flex min-h-[52px] items-center rounded-full bg-[var(--lpv-fg)] px-7 text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-90 active:translate-y-px"
            >
              {elegido ? 'Elegido' : 'Quiero este terreno'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function Catalogo({
  lotes,
  defs,
  telefonoWhatsApp,
}: {
  lotes: PropiedadLanding[];
  defs: FiltroDef[];
  telefonoWhatsApp: string;
}) {
  const { seleccion, alternar, limpiar, visibles, activos } = useFiltros(lotes, defs);
  const plazoFiltro = seleccion.plazo ? Number(seleccion.plazo) : null;
  const [abierta, setAbierta] = useState<string | null>(lotes[0]?.id ?? null);
  const [elegido, setElegido] = useState<string | null>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = lotes.map((l) => ({ slug: l.slug, titulo: l.titulo }));

  // Al cambiar el filtro, la primera fila visible queda abierta: una lista
  // de filas cerradas se lee como índice, no como catálogo. Derivado del
  // estado, sin efecto.
  const abiertaEfectiva = visibles.some((v) => v.id === abierta) ? abierta : (visibles[0]?.id ?? null);

  const elegir = useCallback((slug: string) => {
    setElegido(slug);
    anclaForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-white">
        <div className="lpt2-filtros border-b border-[var(--lpv-line)]">
          <div className="lpt2-fila-chips mx-auto flex max-w-[96rem] items-center gap-6 overflow-x-auto px-5 py-3 sm:px-8">
            <button type="button" aria-pressed={activos === 0} onClick={limpiar} className="lpt2-chip">
              Todos
            </button>
            {defs.map((def) => (
              <div
                key={def.id}
                role="group"
                aria-label={def.etiqueta}
                className="flex shrink-0 items-center gap-6 border-l border-[var(--lpv-line)] pl-6"
              >
                {def.opciones.map((o) => (
                  <button
                    key={o.valor}
                    type="button"
                    aria-pressed={seleccion[def.id] === o.valor}
                    onClick={() => alternar(def.id, o.valor)}
                    className="lpt2-chip"
                  >
                    {o.etiqueta} <span className="opacity-55">{o.total}</span>
                  </button>
                ))}
              </div>
            ))}
            <p className="ml-auto shrink-0 whitespace-nowrap pl-6 text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'terreno', 'terrenos')}
            </p>
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="mx-auto max-w-[96rem] px-5 py-24 text-[var(--lpv-fg-2)] sm:px-8">
            Ningún terreno cumple con todo lo que elegiste. Quita un filtro, o pide que te avisemos cuando entre uno así.
          </p>
        ) : (
          <ul className="mx-auto max-w-[96rem] divide-y divide-[var(--lpv-line)] border-b border-[var(--lpv-line)]">
            {visibles.map((lote, i) => (
              <Fila
                key={lote.id}
                lote={lote}
                abierta={abiertaEfectiva === lote.id}
                onToggle={() => setAbierta(abiertaEfectiva === lote.id ? null : lote.id)}
                onElegir={() => elegir(lote.slug)}
                elegido={elegido === lote.slug}
                prioridad={i === 0}
                plazoFiltro={plazoFiltro}
              />
            ))}
          </ul>
        )}

        <div className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 sm:py-24">
          <p className="lpt2-display-ligero max-w-[24ch] text-[clamp(1.5rem,1.1rem+1.8vw,2.75rem)] text-[var(--lpv-fg)]">
            {COMERCIALIZADORA}
          </p>
        </div>
      </section>

      {/* ══ FORMULARIO sobre cobalto ══ */}
      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 bg-[var(--lpv-accent)] pb-28 text-white sm:pb-0"
      >
        <div className="mx-auto grid max-w-[96rem] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-16">
          <h2 className="lpt2-display max-w-[14ch] text-[clamp(2.25rem,1.4rem+3.4vw,5rem)] lg:col-span-6">
            Te mandamos precio, plano y plan de pagos de cada lote.
          </h2>
          <div className="lg:col-span-6">
            <FormInventario
              source="lp_terrenos_rm"
              variante="cierre"
              copy={FORM}
              opciones={opciones}
              seleccion={elegido}
              onSeleccion={setElegido}
              telefonoWhatsApp={telefonoWhatsApp}
              filtros={defs}
              propiedades={lotes}
              className="!p-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
