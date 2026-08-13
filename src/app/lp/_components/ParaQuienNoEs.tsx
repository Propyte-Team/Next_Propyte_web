import { EnlaceGate } from './ui';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Para quién no es este producto. Panel del módulo «Antes de firmar».
//
// El texto va ÍNTEGRO: no se acorta ni se suaviza al entrar al acordeón. Lo
// único que cambia es que ya no ocupa una sección de scroll propia.
//
// Es el bloque que más ventas evita y por eso el que más vale: filtra al
// visitante cuyo plan no encaja antes de que gaste tres llamadas con un asesor,
// y el asesor es el cuello de botella de la operación.
// ============================================================

export default function ParaQuienNoEs({ lote }: { lote: LoteLanding }) {
  return (
    <div className="flex max-w-[62ch] flex-col gap-4 text-base leading-relaxed text-white/75">
      <p>
        Comprar el terreno y poder construir no ocurren el mismo día. La
        escrituración está proyectada para finales de 2026 según el desarrollador, y
        hoy el título está en fideicomiso: el lote no es escriturable en este
        momento. La construcción depende de que se entreguen servicios y vialidades,
        proyectados hacia el último trimestre de 2027.
      </p>
      <p>
        Si necesitas mudarte pronto, este no es tu producto y es mejor decirlo ahora.
        Si esperas rendimiento por renta desde el primer día, un terreno no lo da: lo
        da lo que construyas encima.
      </p>
      <p>
        Y si tu presupuesto total no alcanza el precio del lote más los gastos de
        escrituración{' '}
        {lote.costos?.cierrePctMin && lote.costos?.cierrePctMax ? (
          <span className="lp-num text-sm">
            ({lote.costos.cierrePctMin}% a {lote.costos.cierrePctMax}% adicional)
          </span>
        ) : (
          <EnlaceGate que="% de gastos de cierre" tono="oscuro" />
        )}{' '}
        más los cargos únicos que listamos en este mismo bloque, conviene esperar en
        lugar de estirarte.
      </p>
    </div>
  );
}
