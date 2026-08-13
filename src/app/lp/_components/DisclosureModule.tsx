import { ChevronDown } from '@/lib/icons';
import { TituloSeccion } from './ui';
import UrbanizacionReal, { ANCLA_URBANIZACION } from './UrbanizacionReal';
import LoQueFaltaConfirmar, {
  ANCLA_GATES,
  NUMERO_PALABRA,
  construirPendientes,
} from './LoQueFaltaConfirmar';
import SituacionJuridica from './SituacionJuridica';
import CostosNoIncluidos from './CostosNoIncluidos';
import ParaQuienNoEs from './ParaQuienNoEs';
import AbrirPanelPorHash from './AbrirPanelPorHash';
import type { LoteLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Antes de firmar: lo que debes saber.
//
// EL PROBLEMA QUE RESOLVÍA. Cinco secciones consecutivas de advertencia
// —urbanización, lo que no sabemos, jurídico, costos, para quién no es— contra
// tres de deseo. El scroll medio de la página era un descargo de
// responsabilidad de varias pantallas, y quien llegaba ahí abandonaba antes de
// ver el contraargumento.
//
// NO SE BORRA NADA. Los cinco contenidos van íntegros, palabra por palabra. Lo
// único que cambia es que dejan de costar cinco pantallas de scroll: quien
// quiere el detalle lo abre, y quien ya decidió no paga el peaje.
//
// `<details>` NATIVO, NO UN ACORDEÓN DE JS. El contenido está en el HTML
// servido: los crawlers lo ven, funciona sin JS y el Ctrl+F del navegador lo
// encuentra. Un acordeón que monta el contenido al abrir habría convertido
// nuestra transparencia en algo que solo existe si el JS carga.
//
// EL RESUMEN DE CADA PANEL SE CALCULA. «Cuatro datos en trámite» sale de contar
// la lista real, no de un número escrito a mano: en un bloque cuyo propósito es
// no mentir, un resumen que se desincroniza del contenido es el peor error
// posible. Por eso `construirPendientes` se exporta.
//
// EL CONTRAARGUMENTO SE QUEDA FUERA. «Por qué el calendario largo es la razón
// para comprar ahora» NO es un panel: va después del módulo, a ancho completo.
// Es la respuesta a todo lo que acaban de leer; esconderla dentro del acordeón
// de objeciones la habría enterrado.
// ============================================================

function Panel({
  id,
  titulo,
  resumen,
  abierto = false,
  children,
}: {
  id: string;
  titulo: string;
  /** Qué hay dentro, sin abrirlo. */
  resumen: string;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={abierto}
      className="group scroll-mt-6 border-b border-[var(--lp-line-dark)]"
    >
      <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 transition-colors duration-200 hover:text-white [&::-webkit-details-marker]:hidden">
        <span className="lp-display flex-1 text-lg leading-snug text-white sm:text-xl">
          {titulo}
        </span>
        <span className="hidden shrink-0 text-xs text-white/45 sm:block">{resumen}</span>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-[var(--lp-accent-on-dark)] transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      {/* El resumen en móvil va dentro, no en el summary: en 390px competía con
          el título y lo partía en tres líneas. */}
      <p className="pb-2 text-xs text-white/45 sm:hidden">{resumen}</p>
      <div className="pb-8 pt-2">{children}</div>
    </details>
  );
}

export default function DisclosureModule({ lote }: { lote: LoteLanding }) {
  const pendientes = construirPendientes(lote);
  const cuantos = NUMERO_PALABRA[pendientes.length] ?? String(pendientes.length);

  const conectados = lote.servicios.filter((s) => s.estado === 'disponible').length;
  const resumenServicios = lote.servicios.length
    ? `${lote.servicios.length} servicios · ${conectados === 0 ? 'ninguno conectado hoy' : `${conectados} conectados`}`
    : 'estatus por confirmar';

  const conceptos =
    (lote.costos?.cargosUnicos.length ?? 0) +
    (lote.costos?.cierrePctMin ? 1 : 0) +
    (lote.costos?.mantenimientoMxnMin ? 1 : 0);

  return (
    <section
      aria-labelledby="antes-de-firmar-titulo"
      className="border-t border-[var(--lp-line-dark)] bg-[var(--lp-dark)]"
    >
      <AbrirPanelPorHash />
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <TituloSeccion id="antes-de-firmar-titulo" tono="oscuro">
          Antes de firmar: lo que debes saber
        </TituloSeccion>
        <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-white/70">
          Publicamos esto porque la mayoría de los anuncios de esta zona simplemente
          no lo menciona. Está todo aquí, agrupado: ábrelo por partes o léelo
          completo.
        </p>

        <div className="mt-10 border-t border-[var(--lp-line-dark)]">
          {/* Abierto por defecto: es el dato que más cambia la decisión, y un
              módulo que abre con los cinco paneles cerrados se lee como una
              caja donde escondimos las malas noticias. */}
          <Panel
            id={ANCLA_URBANIZACION}
            titulo="Qué tiene el lote hoy, y qué falta"
            resumen={resumenServicios}
            abierto
          >
            <UrbanizacionReal lote={lote} />
          </Panel>

          {pendientes.length > 0 && (
            <Panel
              id={ANCLA_GATES}
              titulo={`${cuantos} cosa${pendientes.length > 1 ? 's' : ''} que todavía no sabemos`}
              resumen={`${pendientes.length} ${pendientes.length > 1 ? 'datos' : 'dato'} en trámite`}
            >
              <LoQueFaltaConfirmar lote={lote} />
            </Panel>
          )}

          <Panel
            id="juridico"
            titulo="Situación jurídica, sin adjetivos"
            resumen="Fideicomiso · no escriturable hoy"
          >
            <SituacionJuridica lote={lote} />
          </Panel>

          <Panel
            id="costos"
            titulo="Lo que no está en el precio"
            resumen={conceptos ? `${conceptos} conceptos adicionales` : 'por confirmar'}
          >
            <CostosNoIncluidos lote={lote} />
          </Panel>

          <Panel
            id="para-quien-no-es"
            titulo="Para quién no es este producto"
            resumen="3 perfiles a los que no les sirve"
          >
            <ParaQuienNoEs lote={lote} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
