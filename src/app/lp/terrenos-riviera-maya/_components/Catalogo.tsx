'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@/lib/icons';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import { dinero, m2, mxn, mxnExacto } from '../../_components/format';
import { ANCLA_INVENTARIO, ChipsUbicacion, useFiltroUbicacion } from '../../_components/v2/ChipsUbicacion';
import FormInventario from '../../_components/v2/FormInventario';
import GaleriaFicha from '../../_components/v2/GaleriaFicha';
import { ESTADO_TEXTO, plural, ubicacionCorta } from '../../_components/v2/util';
import { CIERRE_PUNTOS, COMERCIALIZADORA, FORM, NOTA_MENSUALIDAD } from '../_copy';

// ============================================================
// Lista de fichas técnicas + mensualidad + formulario de cierre.
//
// Comparten un estado: el terreno elegido. Pulsar «Quiero este terreno» en
// una fila lo deja elegido en la calculadora de mensualidad y en el
// formulario de cierre, y baja hasta la calculadora. Sin elección, la
// calculadora muestra el primero de la lista (el más accesible).
//
// LA FILA NO ENLAZA A NADA. Informa y convierte; no navega.
//
// MENSUALIDAD: `(precio - enganche) / meses`, solo donde el desarrollador
// declara enganche y plazos y el precio está en pesos. Es orientativa y se
// dice; la tabla exacta va por escrito. Donde no hay esquema declarado no se
// inventa: se publica el porqué.
// ============================================================

function plazoTexto(p: PropiedadLanding): string {
  if (p.mesesOpciones.length > 0) return `hasta ${Math.max(...p.mesesOpciones)} meses`;
  return 'plan por confirmar';
}

function mensualidadDe(p: PropiedadLanding, meses: number): number | null {
  if (!p.precio || p.precio.moneda !== 'MXN' || !p.enganchePct || meses <= 0) return null;
  const enganche = p.engancheMxn ?? (p.precio.monto * p.enganchePct) / 100;
  const saldo = p.precio.monto - enganche;
  return saldo > 0 ? Math.round(saldo / meses) : null;
}

export default function Catalogo({
  lotes,
  telefonoWhatsApp,
}: {
  lotes: PropiedadLanding[];
  telefonoWhatsApp: string;
}) {
  const { activa, setActiva, visibles, ubicaciones } = useFiltroUbicacion(lotes, 'ciudad');
  const [elegida, setElegida] = useState<string | null>(null);
  const [meses, setMeses] = useState<number | null>(null);
  const anclaMensualidad = useRef<HTMLDivElement>(null);
  const anclaForm = useRef<HTMLDivElement>(null);
  const opciones = lotes.map((l) => ({ slug: l.slug, titulo: l.titulo }));

  const lote = lotes.find((l) => l.slug === elegida) ?? lotes[0] ?? null;

  // Al cambiar de lote, el plazo vuelve al más largo (mensualidad más baja),
  // la misma convención que una cotización.
  useEffect(() => {
    setMeses(null);
  }, [elegida]);

  const elegir = useCallback((slug: string) => {
    setElegida(slug);
    anclaMensualidad.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const plazoActivo =
    lote && lote.mesesOpciones.length > 0
      ? (meses ?? Math.max(...lote.mesesOpciones))
      : null;
  const mensualidad = lote && plazoActivo ? mensualidadDe(lote, plazoActivo) : null;
  const engancheMxn =
    lote && lote.precio && lote.precio.moneda === 'MXN' && lote.enganchePct
      ? (lote.engancheMxn ?? Math.round((lote.precio.monto * lote.enganchePct) / 100))
      : null;

  return (
    <>
      <section id={ANCLA_INVENTARIO} className="scroll-mt-2 bg-[var(--lpv-bg)]">
        <div className="lpt2-filtros border-b border-[var(--lpv-line)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <ChipsUbicacion
              ubicaciones={ubicaciones}
              activa={activa}
              onChange={setActiva}
              etiquetaTodas="Toda la Riviera Maya"
            />
            <p className="lpt2-mono text-sm text-[var(--lpv-fg-3)]" aria-live="polite">
              {plural(visibles.length, 'terreno', 'terrenos')}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <h2 className="lpv-display max-w-[24ch] text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.02em]">
            Los terrenos que tenemos publicados hoy
          </h2>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--lpv-fg-2)]">{COMERCIALIZADORA}</p>

          {visibles.length === 0 ? (
            <p className="py-16 text-center text-[var(--lpv-fg-2)]">
              No hay terrenos publicados en esa ciudad ahora mismo. Elige otra o pide que te avisemos.
            </p>
          ) : (
            <ul className="mt-10 border-b border-[var(--lpv-line)]">
              {visibles.map((l, i) => {
                const esElegida = elegida === l.slug;
                return (
                  <li
                    key={l.id}
                    data-elegida={esElegida}
                    className="lpt2-fila grid gap-6 py-8 md:grid-cols-12 md:gap-8"
                  >
                    <div className="md:col-span-5">
                      <GaleriaFicha
                        imagenes={l.imagenes}
                        alt={`${l.titulo}, ${ubicacionCorta(l)}`}
                        sizes="(min-width: 768px) 40vw, 92vw"
                        prioridad={i < 2}
                      />
                    </div>

                    <div className="flex flex-col md:col-span-7">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(l)}</p>
                        <span className="lpt2-estado shrink-0 px-2 py-1 text-[0.6875rem] font-medium">
                          {ESTADO_TEXTO[l.estadoComercial]}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[1.0625rem] font-medium leading-snug text-[var(--lpv-fg)]">
                        {l.titulo}
                      </h3>

                      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                        <div className="col-span-2 sm:col-span-1">
                          <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Superficie</dt>
                          <dd className="lpt2-mono mt-1 text-[1.75rem] font-medium leading-none text-[var(--lpv-fg)]">
                            {l.m2Terreno ? m2(l.m2Terreno) : <span className="text-base text-[var(--lpv-fg-3)]">por confirmar</span>}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Precio total</dt>
                          <dd className="lpt2-mono mt-1 text-base font-medium leading-tight text-[var(--lpv-fg)]">
                            {l.precio ? dinero(l.precio) : 'por confirmar'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Precio por m²</dt>
                          <dd className="lpt2-mono mt-1 text-base font-medium leading-tight text-[var(--lpv-fg)]">
                            {l.precioM2Mxn ? mxnExacto(l.precioM2Mxn) : <span className="text-[var(--lpv-fg-3)]">por confirmar</span>}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Enganche y plazo</dt>
                          <dd className="lpt2-mono mt-1 text-base font-medium leading-tight text-[var(--lpv-fg)]">
                            {l.enganchePct ? `${l.enganchePct}%` : <span className="text-[var(--lpv-fg-3)]">por confirmar</span>}
                            <span className="block text-sm font-normal text-[var(--lpv-fg-2)]">{plazoTexto(l)}</span>
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-auto pt-6">
                        <button
                          type="button"
                          onClick={() => elegir(l.slug)}
                          aria-pressed={esElegida}
                          className={`inline-flex min-h-[48px] items-center gap-3 border px-5 text-sm font-medium transition-colors duration-200 active:translate-y-px ${
                            esElegida
                              ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                              : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-accent)] hover:bg-[var(--lpv-accent)] hover:text-[var(--lpv-on-accent)]'
                          }`}
                        >
                          {esElegida ? 'Elegido, ver mensualidad' : 'Quiero este terreno'}
                          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ══ MENSUALIDAD: el número que decide la compra de suelo ══ */}
      {lote && (
        <section
          id="mensualidad"
          ref={anclaMensualidad}
          aria-labelledby="mensualidad-titulo"
          className="scroll-mt-2 border-t border-[var(--lpv-line)] bg-[var(--lpv-bg-2)]"
        >
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <h2
                  id="mensualidad-titulo"
                  className="lpv-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.02em]"
                >
                  Cuánto pagarías al mes
                </h2>
                <p className="mt-3 text-sm text-[var(--lpv-fg-3)]">{ubicacionCorta(lote)}</p>
                <p className="mt-1 text-[1.0625rem] font-medium leading-snug">{lote.titulo}</p>
                {lotes.length > 1 && (
                  <p className="mt-4 text-sm leading-relaxed text-[var(--lpv-fg-2)]">
                    Elige otro terreno en la lista de arriba para ver su mensualidad.
                  </p>
                )}
              </div>

              <div className="border border-[var(--lpv-line)] bg-[var(--lpv-bg)] p-6 sm:p-8 lg:col-span-7">
                {lote.mesesOpciones.length > 0 && lote.enganchePct && lote.precio?.moneda === 'MXN' ? (
                  <>
                    <fieldset>
                      <legend className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Plazo</legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[...lote.mesesOpciones].sort((a, b) => a - b).map((m) => {
                          const activo = m === plazoActivo;
                          return (
                            <button
                              key={m}
                              type="button"
                              aria-pressed={activo}
                              onClick={() => setMeses(m)}
                              className={`lpt2-mono min-h-[40px] border px-4 text-sm transition-colors duration-200 ${
                                activo
                                  ? 'border-[var(--lpv-accent)] bg-[var(--lpv-accent)] text-[var(--lpv-on-accent)]'
                                  : 'border-[var(--lpv-line-2)] text-[var(--lpv-fg)] hover:border-[var(--lpv-fg)]'
                              }`}
                            >
                              {m} meses
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div className="mt-8" aria-live="polite">
                      <p className="lpt2-mono text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] font-medium leading-none text-[var(--lpv-fg)]">
                        {mensualidad ? mxn(mensualidad) : 'por confirmar'}
                      </p>
                      <p className="mt-2 text-sm text-[var(--lpv-fg-2)]">
                        al mes, {plazoActivo} pagos sin intereses según el esquema declarado por el desarrollador
                      </p>
                    </div>

                    <dl className="mt-6 grid gap-4 border-t border-[var(--lpv-line)] pt-5 sm:grid-cols-3">
                      <div>
                        <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Precio</dt>
                        <dd className="lpt2-mono mt-1 text-sm font-medium">{lote.precio ? dinero(lote.precio) : 'por confirmar'}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Enganche {lote.enganchePct}%</dt>
                        <dd className="lpt2-mono mt-1 text-sm font-medium">{engancheMxn ? mxn(engancheMxn) : 'por confirmar'}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpv-fg-3)]">Superficie</dt>
                        <dd className="lpt2-mono mt-1 text-sm font-medium">{lote.m2Terreno ? m2(lote.m2Terreno) : 'por confirmar'}</dd>
                      </div>
                    </dl>

                    <p className="mt-5 text-xs leading-relaxed text-[var(--lpv-fg-3)]">
                      Cifra orientativa: la tabla exacta, con fechas y pago final si lo hay, te la mandamos por escrito.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="lpt2-mono text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-medium leading-none text-[var(--lpv-fg)]">
                      {lote.precio ? dinero(lote.precio) : 'Precio por confirmar'}
                    </p>
                    <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-[var(--lpv-fg-2)]">
                      Este terreno no tiene un esquema de mensualidades declarado por el desarrollador. Te confirmamos
                      por escrito si se vende de contado o con qué plan.
                    </p>
                  </>
                )}

                <div className="mt-7">
                  <a
                    href="#solicitar"
                    className="inline-flex min-h-[48px] items-center gap-3 bg-[var(--lpv-accent)] px-5 text-sm font-medium text-[var(--lpv-on-accent)] transition-opacity duration-200 hover:opacity-90 active:translate-y-px"
                  >
                    Pedir la tabla
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-[var(--lpv-fg-3)]">{NOTA_MENSUALIDAD}</p>
          </div>
        </section>
      )}

      {/* ══ CIERRE ══ */}
      <section
        id="solicitar"
        ref={anclaForm}
        className="scroll-mt-4 bg-[var(--lpv-panel-bg)] pb-28 pt-16 text-[var(--lpv-panel-fg)] sm:pb-24 sm:pt-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <div>
            <h2 className="lpv-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              Te mandamos la información completa de los {lotes.length}.
            </h2>
            <ul className="mt-10 max-w-[52ch] divide-y divide-[var(--lpv-panel-line)] border-y border-[var(--lpv-panel-line)]">
              {CIERRE_PUNTOS.map(([titulo, detalle]) => (
                <li key={titulo} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--lpv-panel-fg)]">{titulo}</span>
                  <span className="text-sm leading-relaxed text-[var(--lpv-panel-fg-2)]">{detalle}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <FormInventario
              source="lp_terrenos_rm"
              variante="cierre"
              copy={FORM}
              opciones={opciones}
              seleccion={elegida}
              onSeleccion={setElegida}
              telefonoWhatsApp={telefonoWhatsApp}
              className="border border-[var(--lpv-panel-line)] bg-[var(--lpv-panel-bg-2)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
