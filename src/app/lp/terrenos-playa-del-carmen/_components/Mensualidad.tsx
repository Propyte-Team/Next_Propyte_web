'use client';

import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { PlanPago } from '@/lib/supabase/lp-lotes';
import { EASE_ESTADO } from './motion';

// ============================================================
// El gancho de la página: la mensualidad, grande, y un interruptor de plazo.
//
// POR QUÉ ESTO Y NO UNA TABLA DE PRECIOS. La búsqueda que trae a esta persona
// no es «cuánto cuesta un terreno», es «puedo pagarlo». Una tabla obliga a
// hacer la división mentalmente; un interruptor la hace delante de ella y
// convierte una cifra de siete dígitos en una de cinco. Es el mismo dato,
// presentado en la unidad en la que se toma la decisión.
//
// ═══ «SIN INTERESES» SE VALIDA POR SUMA, NO POR LA COLUMNA ═══
//
// `plan.sinIntereses` sale de que la tasa esté declarada en 0. Eso no basta:
// una tasa en cero con importes que no cuadran es una tasa mal capturada, y
// publicar «sin intereses» sobre un plan que sí los cobra es una afirmación que
// no se puede sostener. Aquí se exige ADEMÁS que los tres porcentajes sumen 100
// y que el total de mensualidades sea exactamente su parte del precio. Si algo
// no cuadra, la frase no se publica y las cifras sí. Un dato menos, nunca un
// dato falso.
// ============================================================

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const fmt = (n: number) => `${MXN.format(Math.round(n))} MXN`;

/**
 * Cifra que interpola al cambiar de plazo.
 *
 * Igual que el `Contador` del hero, escribe `textContent` a mano en vez de
 * re-renderizar: el HTML del servidor ya trae la mensualidad correcta del plazo
 * por defecto, así que sin JS se lee una cifra real y no un cero.
 */
function CifraMorfa({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previo = useRef(valor);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || previo.current === valor) {
      el.textContent = fmt(valor);
      previo.current = valor;
      return;
    }
    const control = animate(previo.current, valor, {
      duration: 0.5,
      ease: EASE_ESTADO,
      onUpdate: (n) => {
        el.textContent = fmt(n);
      },
      onComplete: () => {
        el.textContent = fmt(valor);
      },
    });
    previo.current = valor;
    return () => {
      control.stop();
      el.textContent = fmt(valor);
    };
  }, [valor, reduce]);

  return (
    <span ref={ref} className={className}>
      {fmt(valor)}
    </span>
  );
}

export default function Mensualidad({
  plan,
  precioMxn,
}: {
  plan: PlanPago;
  precioMxn: number;
}) {
  const [idx, setIdx] = useState(plan.opciones.length - 1);
  const opcion = plan.opciones[idx] ?? plan.opciones[0];

  // La validación por suma descrita arriba. Se calcula en render: es aritmética
  // sobre datos ya presentes, no hay nada que memoizar.
  const sumaPct = plan.enganchePct + plan.mensualidadesPct + plan.contraentregaPct;
  const cuadraPorcentaje = Math.abs(sumaPct - 100) < 0.51;
  const cuadraImporte =
    Math.abs(plan.mensualidadesTotalMxn - precioMxn * (plan.mensualidadesPct / 100)) <
    Math.max(50, precioMxn * 0.001);
  const sinInteresesVerificado = plan.sinIntereses && cuadraPorcentaje && cuadraImporte;

  const tramos = [
    { etiqueta: 'Enganche', pct: plan.enganchePct, mxn: plan.engancheMxn, momento: 'al firmar' },
    {
      etiqueta: 'Mensualidades',
      pct: plan.mensualidadesPct,
      mxn: plan.mensualidadesTotalMxn,
      momento: `en ${opcion.pagos} pagos`,
    },
    {
      etiqueta: 'Contraentrega',
      pct: plan.contraentregaPct,
      mxn: plan.contraentregaMxn,
      momento: 'al entregar',
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
      <div>
        {plan.opciones.length > 1 && (
          <div
            role="group"
            aria-label="Plazo del plan de pagos"
            className="inline-flex border border-[var(--lpt-linea-fuerte)]"
          >
            {plan.opciones.map((o, i) => {
              const activo = i === idx;
              return (
                <button
                  key={o.meses}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-pressed={activo}
                  className={`lpt-cota min-h-11 px-5 text-sm transition-colors duration-200 ${
                    activo
                      ? 'bg-[var(--lpt-estaca)] text-[var(--lpt-tinta)]'
                      : 'text-[var(--lpt-claro-2)] hover:text-[var(--lpt-claro)]'
                  }`}
                >
                  {o.meses} meses
                </button>
              );
            })}
          </div>
        )}

        <p className="lpt-cota mt-8 text-xs uppercase tracking-[0.14em] text-[var(--lpt-claro-3)]">
          Tu mensualidad
        </p>

        {/* La cifra. Es el elemento más grande de la página después del H1, y
            eso es deliberado: es la respuesta a la pregunta que trajo a esta
            persona desde el anuncio. */}
        <p className="lpt-titular mt-1 text-[clamp(2.75rem,1.5rem+5.6vw,5.25rem)] text-[var(--lpt-estaca)]">
          <CifraMorfa valor={opcion.mensualidadMxn} />
        </p>

        <p className="lpt-cuerpo mt-3 max-w-[44ch] text-[0.9375rem] leading-relaxed text-[var(--lpt-claro-2)]">
          {opcion.pagos} pagos mensuales
          {sinInteresesVerificado ? ', sin intereses' : ''}. Le pagas al
          desarrollador: no hay banco, no hay buró, no hay comprobante de
          ingresos.
        </p>
      </div>

      {/* La regla del 20/60/20. Es un plano de pagos, no una tarjeta: tres
          tramos de una misma línea, con su cota debajo. */}
      <div className="w-full lg:w-[26rem]">
        <div
          className="flex h-2 w-full overflow-hidden bg-[var(--lpt-linea)]"
          role="img"
          aria-label={`Reparto del pago: ${tramos
            .map((t) => `${t.etiqueta} ${t.pct}%`)
            .join(', ')}`}
        >
          {tramos.map((t, i) => (
            <span
              key={t.etiqueta}
              className="block h-full transition-[flex-grow] duration-500"
              style={{
                flexGrow: t.pct,
                backgroundColor:
                  i === 1 ? 'var(--lpt-estaca)' : 'var(--lpt-claro-3)',
              }}
            />
          ))}
        </div>

        <dl className="mt-5 divide-y divide-[var(--lpt-linea)]">
          {tramos.map((t) => (
            <div key={t.etiqueta} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="lpt-cuerpo text-sm text-[var(--lpt-claro-2)]">
                {t.etiqueta}{' '}
                <span className="lpt-cota text-[var(--lpt-claro-3)]">
                  {Math.round(t.pct)}% · {t.momento}
                </span>
              </dt>
              <dd className="lpt-cota shrink-0 text-sm text-[var(--lpt-claro)]">{fmt(t.mxn)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
