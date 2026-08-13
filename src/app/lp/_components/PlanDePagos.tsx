import { DisclaimerCifras, EnlaceGate, TituloSeccion, RULE_LIGHT } from './ui';
import { mxn } from './format';
import SelectorPlazo from './SelectorPlazo';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Plan de pagos.
//
// Sigue siendo server component: lo único que se hidrata es `SelectorPlazo`,
// que recibe las opciones ya calculadas y solo decide cuál se ve. La
// aritmética de dinero no cruza al cliente.
//
// Este bloque publicaba las dos opciones de plazo como tarjetas estáticas, con
// el argumento de que un "simulador" de dos estados no justificaba mandar JS a
// una ruta cuyo LCP es el criterio de aceptación más apretado. Luis pidió los
// chips seleccionables (2026-08-12). El costo real resultó ser un componente
// de ~90 líneas sin dependencias, y la lectura mejora: una cifra grande que
// responde a lo que tocas comunica mejor que dos cifras medianas compitiendo.
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
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--lp-ink-soft)]">
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

      <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--lp-ink-soft)]">
        Financiamiento directo con el desarrollador
        {plan.sinIntereses && ', sin intereses'}. El esquema que publica es{' '}
        {plan.enganchePct}% de enganche, {plan.mensualidadesPct}% en mensualidades y{' '}
        {plan.contraentregaPct}% contra entrega. Estas cifras son ese esquema
        aplicado al precio de este lote.
      </p>

      <SelectorPlazo opciones={plan.opciones} sinIntereses={plan.sinIntereses} />

      {/* Desglose completo: lo que entra al inicio, en medio y al final. */}
      <dl className={`mt-6 border-x border-b border-t-2 border-t-[var(--lp-accent)] ${RULE_LIGHT}`}>
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
            <dt className="text-sm text-[var(--lp-ink-soft)]">
              {f.k}
              <span className="block text-xs text-[var(--lp-muted)]">{f.nota}</span>
            </dt>
            <dd className="text-right lp-num text-sm text-[var(--lp-ink)]">
              {f.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <DisclaimerCifras />
      </div>
    </section>
  );
}
