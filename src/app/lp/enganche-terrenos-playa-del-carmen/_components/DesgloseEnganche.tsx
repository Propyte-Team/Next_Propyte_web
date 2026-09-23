'use client';

import { useState } from 'react';
import type { PlanPago } from '@/lib/supabase/lp-lotes';
import { mxn } from './formato';

// ============================================================
// EL DESGLOSE. Es la razón de existir de esta variante.
//
// ═══ QUÉ APUESTA ESTA VARIANTE ═══
//
// Las otras dos ponen la MENSUALIDAD como gancho. Esta pone el ENGANCHE, que es
// la cifra que decide si alguien puede entrar hoy o no: la mensualidad se
// evalúa contra el sueldo, pero el enganche se evalúa contra el ahorro que ya
// tienes, y es lo que frena a quien no puede juntar el 20%.
//
// Publicarlo grande es una apuesta con dos filos y hay que decirlo: $202,176 MXN
// es una cifra que ahuyenta a parte del tráfico. La hipótesis es que ahuyenta
// exactamente al que nunca iba a comprar, y que a cambio el que SÍ puede entra
// sabiendo el número y llega a la conversación sin la sorpresa que hoy mata
// leads en la primera llamada.
//
// ═══ LOS TRES TRAMOS, Y POR QUÉ SE PUBLICAN LOS TRES ═══
//
// El esquema es 20% enganche + 60% mensualidades + 20% contraentrega. Publicar
// solo el enganche sería el mismo truco que publicar solo la mensualidad: el
// 20% de contraentrega es un pago fuerte y real, y esconderlo hasta la llamada
// es lo que convierte un lead en una discusión.
//
// ⚠️ TODA CIFRA VIENE DE `plan`, NUNCA SE RECALCULA AQUÍ. `construirPlan` ya
// resolvió que los pagos son `meses - 1` porque el último mes ES la
// contraentrega. Dividir entre `meses` aquí daría una mensualidad más baja y
// más bonita, y sería falsa.
// ============================================================

export default function DesgloseEnganche({
  plan,
  precioMxn,
}: {
  plan: PlanPago;
  precioMxn: number;
}) {
  // ⚠️ `mxn` se IMPORTA, no llega como prop. Pasarlo como prop desde el
  // servidor rompe el build en la fase de prerender —las funciones no cruzan la
  // frontera server/client— y el motivo largo, con la salida equivocada que se
  // descartó, está en `formato.ts`.
  // Arranca en el plazo MÁS LARGO: es la mensualidad más baja, y es la razón
  // por la que la persona sigue leyendo.
  const [meses, setMeses] = useState(plan.opciones.at(-1)?.meses ?? null);
  const opcion = plan.opciones.find((o) => o.meses === meses) ?? plan.opciones.at(-1);

  const tramos = [
    {
      n: '01',
      titulo: 'Enganche',
      pct: plan.enganchePct,
      cifra: mxn(plan.engancheMxn),
      pie: 'Un solo pago. Con esto el lote queda apartado a tu nombre.',
      destacado: true,
    },
    {
      n: '02',
      titulo: 'Mensualidades',
      pct: plan.mensualidadesPct,
      cifra: opcion ? mxn(opcion.mensualidadMxn) : null,
      pie: opcion
        ? `${opcion.pagos} pagos mensuales${plan.sinIntereses ? ', sin intereses' : ''}. Directo con el desarrollador: sin banco, sin buró y sin comprobante de ingresos.`
        : null,
      destacado: false,
    },
    {
      n: '03',
      titulo: 'Contraentrega',
      pct: plan.contraentregaPct,
      cifra: mxn(plan.contraentregaMxn),
      pie: 'El último pago, al entregarte el lote. Va aquí y no en letra chica porque es un pago fuerte y tienes que contar con él.',
      destacado: false,
    },
  ];

  return (
    <div>
      {/* ═══ EL SELECTOR ═══
          Va ARRIBA del desglose, no dentro de la tarjeta de mensualidades: es
          la única cosa de la sección que se puede tocar, y esconderlo en la
          tarjeta del medio lo hace invisible. */}
      {plan.opciones.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="lpe-cuerpo text-[0.9375rem] text-[var(--lpe-tinta-2)]">
            El resto, en
          </span>
          {/* Fondo BLANCO, no `--lpe-hueso`: esta sección ya vive sobre hueso,
              así que un grupo hueso sobre hueso desaparece y la opción inactiva
              se lee como texto suelto en vez de como un botón. Medido en
              pantalla. */}
          <div
            role="group"
            aria-label="Plazo de las mensualidades"
            className="flex gap-2 rounded-[var(--lpe-r-pill)] border border-[var(--lpe-linea)] bg-[var(--lpe-blanco)] p-1.5"
          >
            {plan.opciones.map((o) => {
              const activo = o.meses === meses;
              return (
                <button
                  key={o.meses}
                  type="button"
                  onClick={() => setMeses(o.meses)}
                  aria-pressed={activo}
                  className={`lpe-cuerpo min-h-11 rounded-[var(--lpe-r-pill)] px-5 text-[0.9375rem] transition-[background-color,color] duration-200 ${
                    activo
                      ? 'bg-[var(--lpe-tinta)] font-medium text-[var(--lpe-blanco)]'
                      : 'text-[var(--lpe-tinta-2)] hover:text-[var(--lpe-tinta)]'
                  }`}
                >
                  {o.meses} meses
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ LA BARRA DE PROPORCIÓN ═══
          20 / 60 / 20 a escala real. No es decoración: es la única forma de que
          alguien entienda de un golpe que el enganche es la quinta parte y que
          la contraentrega pesa lo mismo. Los porcentajes salen del esquema del
          desarrollador, así que la barra no puede mentir sobre él. */}
      <div className="mt-10">
        <div
          className="flex h-3 w-full gap-1 overflow-hidden rounded-[var(--lpe-r-pill)]"
          role="img"
          aria-label={`Proporción del precio: ${plan.enganchePct}% de enganche, ${plan.mensualidadesPct}% en mensualidades y ${plan.contraentregaPct}% de contraentrega`}
        >
          <div
            className="rounded-[var(--lpe-r-pill)] bg-[var(--lpe-teal)]"
            style={{ width: `${plan.enganchePct}%` }}
          />
          <div
            className="rounded-[var(--lpe-r-pill)] bg-[var(--lpe-aqua)]"
            style={{ width: `${plan.mensualidadesPct}%` }}
          />
          <div
            className="rounded-[var(--lpe-r-pill)] bg-[var(--lpe-tinta-3)]"
            style={{ width: `${plan.contraentregaPct}%` }}
          />
        </div>
        {/* ⚠️ LA BARRA NECESITA LEYENDA. Sin ella, quien ve tres segmentos de
            color tiene que adivinar cuál es cuál: el `aria-label` resuelve al
            lector de pantalla y deja al resto igual de perdido. Los cuadros de
            color son los MISMOS tokens que los segmentos, así que no pueden
            desincronizarse de la barra. */}
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            { c: 'var(--lpe-teal)', t: 'Enganche', p: plan.enganchePct },
            { c: 'var(--lpe-aqua)', t: 'Mensualidades', p: plan.mensualidadesPct },
            { c: 'var(--lpe-tinta-3)', t: 'Contraentrega', p: plan.contraentregaPct },
          ].map((l) => (
            <li key={l.t} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: l.c }}
              />
              <span className="lpe-cuerpo text-[0.8125rem] text-[var(--lpe-tinta-2)]">
                {l.p}% {l.t.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>

        <p className="lpe-cuerpo mt-4 text-[0.8125rem] text-[var(--lpe-tinta-3-texto)]">
          Sobre un precio de lista de {mxn(precioMxn)}.
        </p>
      </div>

      {/* ═══ LOS TRES TRAMOS ═══
          Dos columnas, y el ENGANCHE ocupa las dos: es la protagonista de la
          página y en tres columnas iguales su cifra partía en dos líneas
          («$202,176 / MXN»), que es exactamente lo contrario de destacarla.
          Con banda propia entra en una línea, cabe más grande, y la jerarquía
          la hace el ESPACIO en vez de un badge de «el mejor». */}
      <ol className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-5">
        {tramos.map((t) => (
          <li
            key={t.n}
            className={`rounded-[var(--lpe-r)] p-7 sm:p-8 ${
              t.destacado
                ? 'flex flex-col gap-5 bg-[var(--lpe-aqua-suave)] ring-1 ring-[var(--lpe-teal)] sm:flex-row sm:items-end sm:justify-between sm:gap-10 lg:col-span-2'
                : 'flex flex-col border border-[var(--lpe-linea)] bg-[var(--lpe-blanco)]'
            }`}
          >
            <div className={t.destacado ? 'min-w-0' : ''}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="lpe-rotulo text-[var(--lpe-teal-texto)]">
                  {t.n} · {t.titulo}
                </span>
                {!t.destacado && (
                  <span className="lpe-cifra text-[0.875rem] text-[var(--lpe-tinta-3-texto)]">
                    {t.pct}%
                  </span>
                )}
              </div>

              {t.cifra ? (
                <p
                  className={`lpe-cifra mt-4 ${
                    t.destacado
                      ? 'text-[clamp(2.5rem,1.5rem+3.4vw,4rem)]'
                      : 'text-[clamp(1.75rem,1.3rem+1.6vw,2.375rem)]'
                  }`}
                >
                  {t.cifra}
                </p>
              ) : (
                /* Sin dato no se rellena el hueco con una frase de relleno: se
                   dice que falta y se remite al plan que sí lo trae. */
                <p className="lpe-cuerpo mt-4 text-[0.9375rem] text-[var(--lpe-tinta-2)]">
                  Te lo desglosamos en el plan.
                </p>
              )}

              {t.titulo === 'Mensualidades' && opcion && (
                <p className="lpe-cuerpo mt-1.5 text-[0.9375rem] text-[var(--lpe-tinta-2)]">
                  × {opcion.pagos} pagos
                </p>
              )}
            </div>

            {/* En la tarjeta destacada el pie va en la SEGUNDA columna, al lado
                de la cifra; en las otras dos, debajo. `max-w` para que no se
                estire a lo ancho de la banda completa y quede ilegible. */}
            {t.pie && (
              <p
                className={`lpe-cuerpo text-[0.875rem] leading-relaxed text-[var(--lpe-tinta-2)] ${
                  t.destacado ? 'sm:max-w-[38ch] sm:pb-2' : 'mt-5'
                }`}
              >
                {t.pie}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
