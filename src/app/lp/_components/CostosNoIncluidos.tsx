import { Campo, BloqueCampos, Gate, TituloSeccion } from './ui';
import { mxn } from './format';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Lo que no está en el precio.
//
// El bloque que nadie publica: gastos de cierre, mantenimiento y los cargos
// únicos que aparecen al escriturar o al iniciar obra. Va antes del formulario
// a propósito, porque filtra al visitante cuyo presupuesto no alcanza el precio
// del lote más los costos reales, y ese filtro ahorra tiempo de asesor, que es
// el cuello de botella de la operación.
// ============================================================

export default function CostosNoIncluidos({ lote }: { lote: LoteLanding }) {
  const c = lote.costos;

  const cierre =
    c?.cierrePctMin && c?.cierrePctMax
      ? `${c.cierrePctMin}% a ${c.cierrePctMax}% del valor de venta`
      : null;

  const mantenimiento =
    c?.mantenimientoMxnMin && c?.mantenimientoMxnMax
      ? `${mxn(c.mantenimientoMxnMin)} a ${mxn(c.mantenimientoMxnMax)} MXN al mes`
      : null;

  return (
    <section aria-labelledby="costos-titulo">
      <TituloSeccion id="costos-titulo">Lo que no está en el precio</TituloSeccion>

      <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-graphite">
        El precio del lote no es el costo de adquirirlo. Estos son los conceptos
        adicionales que el desarrollador declara, para que calcules tu presupuesto
        completo antes de hablar con nosotros y no después.
      </p>

      <div className="mt-6 border-t-2 border-navy">
        <BloqueCampos>
          <Campo etiqueta="Escrituración">
            {cierre ?? <Gate que="% de gastos de escrituración" />}
            {c?.cierreExcluye && (
              <span className="block text-xs text-graphite/55">
                No incluye {c.cierreExcluye}
              </span>
            )}
          </Campo>

          <Campo etiqueta="Mantenimiento">
            {mantenimiento ?? <Gate que="cuota de mantenimiento" />}
            {c?.mantenimientoPorDefinir && (
              <span className="block text-xs text-graphite/55">
                Monto final por definir, más cerca de la entrega
              </span>
            )}
          </Campo>

          {(c?.cargosUnicos ?? []).map((cargo) => (
            <Campo key={cargo.concepto} etiqueta={cargo.concepto}>
              {cargo.monto}
              <span className="block text-xs text-graphite/55">
                {cargo.momento}
                {cargo.reembolsable === true && ', reembolsable'}
                {cargo.reembolsable === false && ', no reembolsable'}
              </span>
            </Campo>
          ))}
        </BloqueCampos>
      </div>

      <p className="mt-5 max-w-[62ch] text-xs leading-relaxed text-graphite/65">
        Condiciones publicadas por el desarrollador, sujetas a cambio y
        disponibilidad. Conviene confirmar vigencia y lote específico al momento de
        decidir.
      </p>
    </section>
  );
}
