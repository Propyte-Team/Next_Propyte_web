import { EnlaceGate, TituloSeccion, RULE_LIGHT } from './ui';
import { mxn } from './format';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Plan de pagos.
//
// Server component a propósito: el patch pedía un simulador con selectores de
// enganche y plazo, pero con un solo esquema declarado por el desarrollador
// (20/60/20) el "simulador" tendría exactamente dos estados. Publicar las dos
// opciones de plazo lado a lado da la misma información sin enviar JavaScript a
// una ruta cuyo LCP es el criterio de aceptación más apretado.
//
// Toda la aritmética viene de `construirPlan` en la capa de datos: los tres
// porcentajes se parsean del esquema declarado y los importes se calculan. Si el
// esquema no parsea o falta la tasa, `plan` es null y este bloque publica el
// gate en vez de una cifra inventada.
//
// El número de pagos es `meses - 1`: el registro declara "59 MSI + 1
// mensualidad final", así que en 60 meses hay 59 mensualidades y una
// contraentrega. Dividir entre 60 daría una mensualidad más baja que la real.
// ============================================================

export default function PlanDePagos({ lote }: { lote: LoteLanding }) {
  const plan = lote.plan;

  if (!plan) {
    return (
      <section aria-labelledby="plan-titulo">
        <TituloSeccion id="plan-titulo">Cómo se paga</TituloSeccion>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-graphite">
          El financiamiento es directo con el desarrollador, pero todavía no
          publicamos las mensualidades porque falta un dato y preferimos decírtelo
          antes que estimarlo.
        </p>
        <div className="mt-4">
          <EnlaceGate que="tasa de financiamiento" />
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="plan-titulo">
      <TituloSeccion id="plan-titulo">
        {plan.sinIntereses ? 'Cómo se paga, sin intereses' : 'Cómo se paga'}
      </TituloSeccion>

      <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-graphite">
        Financiamiento directo con el desarrollador
        {plan.sinIntereses && ', sin intereses'}. El esquema que publica es{' '}
        {plan.enganchePct}% de enganche, {plan.mensualidadesPct}% en mensualidades y{' '}
        {plan.contraentregaPct}% contra entrega. Estas cifras son ese esquema
        aplicado al precio de este lote.
      </p>

      {/* Las dos opciones de plazo, lado a lado. La comparación es el valor. */}
      <div className="mt-6 grid gap-px border-t-2 border-navy bg-navy/12 sm:grid-cols-2">
        {plan.opciones.map((o) => (
          <div key={o.meses} className="bg-white p-5">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-navy/55">
              Plazo de {o.meses} meses
            </p>
            <p className="mt-3 font-mono text-2xl tabular-nums text-navy">
              {mxn(o.mensualidadMxn)}
            </p>
            <p className="mt-1 text-xs text-graphite/70">
              al mes, {o.pagos} pagos
            </p>
          </div>
        ))}
      </div>

      {/* Desglose completo: lo que entra al inicio, en medio y al final. */}
      <dl className={`mt-6 border-x border-b border-t-2 border-t-navy ${RULE_LIGHT}`}>
        {[
          {
            k: `Enganche (${plan.enganchePct}%)`,
            v: mxn(plan.engancheMxn),
            nota: 'Al firmar',
          },
          {
            k: `Mensualidades (${plan.mensualidadesPct}%)`,
            v: mxn(plan.mensualidadesTotalMxn),
            nota: 'Repartido en los pagos de arriba',
          },
          {
            k: `Contra entrega (${plan.contraentregaPct}%)`,
            v: mxn(plan.contraentregaMxn),
            nota: 'El pago final, en el último mes del plazo',
          },
        ].map((f) => (
          <div
            key={f.k}
            className={`grid grid-cols-[1fr_auto] items-baseline gap-4 border-t ${RULE_LIGHT} px-4 py-3.5`}
          >
            <dt className="text-sm text-graphite">
              {f.k}
              <span className="block text-xs text-graphite/55">{f.nota}</span>
            </dt>
            <dd className="text-right font-mono text-sm tabular-nums text-navy">
              {f.v}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 max-w-[62ch] text-xs leading-relaxed text-graphite/70">
        Cifras calculadas sobre el precio publicado y el esquema que declara el
        desarrollador, redondeadas al peso. No son una tabla de amortización: esa
        te la mandamos por escrito, con las fechas de cada pago, antes de que
        firmes nada. Condiciones sujetas a cambio y disponibilidad.
      </p>
    </section>
  );
}
