import { Campo, BloqueCampos, EnlaceGate } from './ui';
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

/** Detecta montos expresados en unidades indexadas en vez de en pesos. */
function esIndexado(monto: string): boolean {
  const m = monto.toLowerCase();
  return (
    m.includes('salario') || m.includes('uma') || m.includes('cuotas de mantenimiento')
  );
}

export default function CostosNoIncluidos({ lote }: { lote: LoteLanding }) {
  const c = lote.costos;

  const cierre =
    c?.cierrePctMin && c?.cierrePctMax
      ? `${c.cierrePctMin}% a ${c.cierrePctMax}% del valor de venta`
      : null;

  const mantenimiento =
    c?.mantenimientoMxnMin && c?.mantenimientoMxnMax
      ? `${mxn(c.mantenimientoMxnMin)} a ${mxn(c.mantenimientoMxnMax)} al mes`
      : null;

  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed text-white/75">
        El precio del lote no es el costo de adquirirlo. Estos son los conceptos
        adicionales que el desarrollador declara, para que calcules tu presupuesto
        completo antes de hablar con nosotros y no después.
      </p>

      <div className="mt-6">
        <BloqueCampos tono="oscuro">
          <Campo etiqueta="Escrituración" tono="oscuro">
            {cierre ?? <EnlaceGate que="% de gastos de escrituración" tono="oscuro" />}
            {c?.cierreExcluye && (
              <span className="block text-xs text-white/45">
                No incluye {c.cierreExcluye}
              </span>
            )}
          </Campo>

          <Campo etiqueta="Mantenimiento" tono="oscuro">
            {mantenimiento ?? <EnlaceGate que="cuota de mantenimiento" tono="oscuro" />}
            {c?.mantenimientoPorDefinir && (
              <span className="block text-xs text-white/45">
                Monto final por definir, más cerca de la entrega
              </span>
            )}
          </Campo>

          {(c?.cargosUnicos ?? []).map((cargo) => (
            <Campo key={cargo.concepto} etiqueta={cargo.concepto} tono="oscuro">
              {cargo.monto}
              <span className="block text-xs text-white/45">
                {cargo.momento}
                {cargo.reembolsable === true && ', reembolsable'}
                {cargo.reembolsable === false && ', no reembolsable'}
              </span>
              {/* Un cargo indexado a salarios mínimos no es un monto: es una
                  fórmula. Publicarlo sin decir eso deja al comprador creyendo
                  que sabe cuánto va a pagar. No convertimos a pesos porque
                  requiere fijar QUÉ salario mínimo y de qué año aplica, y eso
                  lo define el contrato, no nosotros. */}
              {esIndexado(cargo.monto) && (
                <span className="mt-1.5 block text-xs leading-relaxed text-white/45">
                  Es un cargo indexado: se calcula con el salario mínimo vigente el
                  día que inicies obra, no con el de hoy. Te pasamos el equivalente
                  en pesos y el salario mínimo que aplica en cuanto el desarrollador
                  lo confirme por escrito.
                </span>
              )}
            </Campo>
          ))}
        </BloqueCampos>
      </div>

      <p className="mt-5 max-w-[62ch] text-xs leading-relaxed text-white/45">
        Condiciones publicadas por el desarrollador, sujetas a cambio y
        disponibilidad. Conviene confirmar vigencia y lote específico al momento de
        decidir.
      </p>
    </div>
  );
}
