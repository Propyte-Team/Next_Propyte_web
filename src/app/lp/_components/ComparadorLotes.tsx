'use client';

import { useId, useState } from 'react';
import { mxn } from './format';
import { DisclaimerCifras } from './ui';
import type { LoteComparable } from '@/lib/supabase/lp-lotes-comparador';

// ============================================================
// Comparador de lotes de Playa del Carmen.
//
// UBICACIÓN: después del CTA de cierre, nunca antes. La landing se construyó
// sin rutas de salida a propósito — el logo ni siquiera es clicable. Este
// bloque captura a quien ya decidió que este lote no era el suyo; ponerlo
// arriba desviaría a quien iba a convertir.
//
// CAMINO A: cada opción se identifica por ubicación + superficie + precio
// desde. Cero nombres comerciales, y compara mejor que un nombre. La capa de
// datos ni siquiera selecciona `development_name`, así que no hay nada que
// filtrar aquí: el nombre no existe en este árbol.
//
// DOS NIVELES DE SELECCIÓN: lote y, dentro del lote, plazo. El segundo solo
// aparece donde hay plan de mensualidades — un lote que se vende de contado no
// tiene plazos que ofrecer y decirlo es más útil que esconderlo.
//
// EL PRECIO PUEDE CAMBIAR CON EL PLAZO. Un desarrollo aplica descuento por
// pronto pago escalonado, así que a menor plazo el precio baja. Cuando pasa, se
// publica el precio de ESE plazo junto al de lista. Calcular la mensualidad de
// 48 meses sobre el precio de 12 sería la cifra falsa más fácil de publicar en
// toda la página.
// ============================================================

export default function ComparadorLotes({ lotes }: { lotes: LoteComparable[] }) {
  const grupoLote = useId();
  const grupoPlazo = useId();
  const [loteId, setLoteId] = useState(() => lotes[0]?.id ?? null);
  // Índice del plazo, no meses: los plazos disponibles cambian con el lote y un
  // valor en meses del lote anterior no siempre existe en el nuevo.
  //
  // `null` significa "el plazo más largo", que es la mensualidad más baja y la
  // misma convención que usa el bloque de pagos de arriba. Arrancar en el
  // índice 0 hacía que el lote de esta landing mostrara $12,905 aquí y $10,280
  // cuatro secciones más arriba: dos cifras distintas para el mismo lote se
  // leen como un error de la página, no como dos opciones.
  const [plazoIdx, setPlazoIdx] = useState<number | null>(null);

  if (lotes.length < 2) return null;

  const lote = lotes.find((l) => l.id === loteId) ?? lotes[0];
  if (!lote) return null;

  const idxActivo = plazoIdx ?? lote.plazos.length - 1;
  const plazo = lote.plazos[Math.min(idxActivo, lote.plazos.length - 1)] ?? null;
  const hayDescuento = plazo !== null && plazo.descuentoPct > 0;

  // `lp-num`: las etiquetas son casi todas cifras («130 m² · desde $1,010,880»)
  // y se apilan verticalmente para compararse. Sin dígitos tabulares los
  // precios no cuadran entre opciones, que es justo lo único que hace un
  // comparador.
  const CHIP =
    'lp-num block cursor-pointer select-none rounded-[var(--lp-r-control)] border px-4 py-2.5 text-sm ' +
    'transition-colors duration-150 border-[var(--lp-line-dark)] text-[var(--lp-on-dark-soft)] ' +
    'hover:border-[var(--lp-on-dark-soft)] hover:text-[var(--lp-on-dark)] ' +
    'peer-checked:border-[var(--lp-accent-on-dark)] peer-checked:bg-[var(--lp-accent-on-dark)] ' +
    'peer-checked:text-[var(--lp-dark)] peer-checked:font-medium ' +
    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ' +
    'peer-focus-visible:outline-[var(--lp-accent-on-dark)]';

  return (
    <section aria-labelledby="comparador-titulo" className="bg-[var(--lp-dark-2)]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        {/* El título estaba en clave de descarte —«Si este lote no es el
            tuyo»— porque el bloque vivía al final, después del cierre. Al
            subirlo a la primera mitad de la página ese encuadre deja de servir:
            quien acaba de llegar buscando «terrenos residenciales en playa del
            carmen» no ha descartado nada todavía. Ahora nombra la categoría en
            plural, que es además el término exacto que compra la campaña. */}
        <h2
          id="comparador-titulo"
          className="max-w-[24ch] lp-display text-[clamp(1.5rem,1.2rem+1.1vw,2.125rem)] leading-tight tracking-[-0.02em] text-balance text-[var(--lp-on-dark)]"
        >
          Terrenos residenciales en Playa del Carmen
        </h2>
        {/* La línea de comercializadora. Propyte no es la desarrolladora de
            estos lotes: los comercializa, y puede conseguir cualquier otro de
            la zona. Decirlo cambia la pregunta del visitante de «¿me sirve
            ESTE?» a «¿me consiguen el que me sirve?», que es la que de verdad
            queremos contestar. No promete inventario concreto: promete
            búsqueda, que es lo que sí se puede sostener. */}
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--lp-on-dark-soft)]">
          Estos son los terrenos que tenemos publicados hoy en Playa del Carmen.
          Somos comercializadora, no desarrolladora: si ninguno encaja con tu
          presupuesto o tu superficie, dínoslo y te buscamos otro en la zona.
        </p>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--lp-on-dark-soft)]">
          Mismas reglas que en el resto de la página: solo publicamos la
          mensualidad donde el desarrollador tiene el esquema declarado. Donde no
          la ves, es porque no la hay, no porque no quepa.
        </p>

        {/* Nivel 1: el lote. */}
        <fieldset className="mt-8">
          <legend className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-on-dark-soft)]">
            Elige el lote
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {lotes.map((l) => {
              const id = `${grupoLote}-${l.id}`;
              return (
                <div key={l.id}>
                  <input
                    type="radio"
                    id={id}
                    name={grupoLote}
                    className="peer sr-only"
                    checked={l.id === lote.id}
                    onChange={() => {
                      setLoteId(l.id);
                      // Vuelve a "el más largo" del lote nuevo, no al índice
                      // del anterior: los plazos no coinciden entre lotes.
                      setPlazoIdx(null);
                    }}
                  />
                  <label htmlFor={id} className={CHIP}>
                    {l.etiqueta}
                    {l.esDeEstaLanding && (
                      <span className="ml-2 opacity-70">· el de este anuncio</span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 rounded-[var(--lp-r-media)] border border-[var(--lp-line-dark)] p-6">
          {/* Nivel 2: el plazo, solo donde hay plan. */}
          {lote.plazos.length > 1 && (
            <fieldset>
              <legend className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--lp-on-dark-soft)]">
                Plazo
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {lote.plazos.map((p, i) => {
                  const id = `${grupoPlazo}-${lote.id}-${p.meses}`;
                  return (
                    <div key={p.meses}>
                      <input
                        type="radio"
                        id={id}
                        name={`${grupoPlazo}-${lote.id}`}
                        className="peer sr-only"
                        checked={p.meses === plazo?.meses}
                        onChange={() => setPlazoIdx(i)}
                      />
                      <label htmlFor={id} className={CHIP}>
                        {p.meses} meses
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className={lote.plazos.length > 1 ? 'mt-6' : ''} aria-live="polite">
            {plazo ? (
              <>
                <p className="lp-num text-4xl leading-none text-[var(--lp-on-dark)]">
                  {mxn(plazo.mensualidadMxn)}
                </p>
                <p className="mt-2 text-sm text-[var(--lp-on-dark-soft)]">
                  al mes · {plazo.pagos} pagos sin intereses
                </p>

                {/* El precio de ESTE plazo. Solo se explicita cuando cambia con
                    el plazo: en los demás lotes sería ruido. */}
                {hayDescuento ? (
                  <p className="mt-4 text-sm text-[var(--lp-on-dark-soft)]">
                    Precio a {plazo.meses} meses{' '}
                    <span className="lp-num text-[var(--lp-on-dark)]">
                      {mxn(plazo.precioMxn)}
                    </span>{' '}
                    — el desarrollador descuenta {plazo.descuentoPct.toFixed(1)}% sobre
                    los {mxn(lote.precioListaMxn)} de lista por pagar en menos tiempo.
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-[var(--lp-on-dark-soft)]">
                    Precio{' '}
                    <span className="lp-num text-[var(--lp-on-dark)]">
                      {mxn(plazo.precioMxn)}
                    </span>
                  </p>
                )}

                <dl className="mt-5 border-t border-[var(--lp-line-dark)]">
                  {[
                    { k: 'Enganche', v: plazo.engancheMxn, nota: 'Al firmar' },
                    {
                      k: 'Mensualidades',
                      v: plazo.mensualidadMxn * plazo.pagos,
                      nota: `${plazo.pagos} pagos de ${mxn(plazo.mensualidadMxn)}`,
                    },
                    {
                      k: 'Contra entrega',
                      v: plazo.contraentregaMxn,
                      // Dato material, no letra chica: si el pago final se cubre
                      // con hipotecario, el comprador tiene que calificar para un
                      // crédito. Omitirlo compararía peras con manzanas.
                      nota:
                        plazo.contraentregaVia === 'hipotecario'
                          ? 'Al entregar. El desarrollador lo plantea con crédito hipotecario.'
                          : 'Al entregar',
                    },
                  ]
                    .filter((f) => f.v > 0)
                    .map((f) => (
                      <div
                        key={f.k}
                        className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--lp-line-dark)] py-3.5"
                      >
                        <dt className="text-sm text-[var(--lp-on-dark-soft)]">
                          {f.k}
                          <span className="lp-num block text-xs opacity-70">{f.nota}</span>
                        </dt>
                        <dd className="lp-num text-right text-sm text-[var(--lp-on-dark)]">
                          {mxn(f.v)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </>
            ) : (
              // Gate. Se publica el porqué, no un vacío ni un guion.
              <>
                <p className="lp-num text-3xl leading-none text-[var(--lp-on-dark)]">
                  {mxn(lote.precioListaMxn)}
                </p>
                <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-[var(--lp-on-dark-soft)]">
                  {lote.motivoSinPlan}
                </p>
                {lote.contado && lote.contado.descuentoPct > 0 && (
                  <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-[var(--lp-on-dark-soft)]">
                    Pagándolo de contado, el desarrollador descuenta{' '}
                    {lote.contado.descuentoPct.toFixed(0)}%:{' '}
                    <span className="lp-num text-[var(--lp-on-dark)]">
                      {mxn(lote.contado.precioMxn)}
                    </span>
                    .
                  </p>
                )}
              </>
            )}

            {lote.apartadoMxn !== null && (
              <p className="mt-4 text-sm text-[var(--lp-on-dark-soft)]">
                El apartado para reservarlo es de{' '}
                <span className="lp-num text-[var(--lp-on-dark)]">
                  {mxn(lote.apartadoMxn)}
                </span>
                .
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <DisclaimerCifras
            tono="oscuro"
            alcance="el esquema que declara cada desarrollador"
          />
        </div>

        <div className="mt-7">
          {/* Contorno, no sólido. Este bloque va DESPUÉS del cierre y su lote no
              es el protagonista de la página: un botón sólido aquí compite con
              el CTA del cierre por la misma acción y a dos pantallas de
              distancia. Mismo destino y mismo tap target, menos peso. */}
          <a
            href="#solicitar"
            className="inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-[var(--lp-r-control)] border border-[var(--lp-accent-on-dark)]/45 px-7 text-sm font-medium text-[var(--lp-accent-on-dark)] transition-colors duration-200 hover:border-[var(--lp-accent-on-dark)] hover:bg-[var(--lp-accent-on-dark)]/10"
          >
            Pedir el detalle de este lote
          </a>
        </div>
      </div>
    </section>
  );
}
