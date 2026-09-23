import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatArea, formatPrice } from '@/lib/formatters';
import { translateDateWords } from '@/lib/i18n/translate-date-words';
import type { ProyectoGuia } from '@/lib/supabase/guia-terrenos';
import type { Traductor } from './BloquesEstaticos';
import { explicacionSinPlan, plazoDeLaMensualidad, rotuloBase } from './FichaProyecto';

// ============================================================
// La tabla comparativa de la guía.
//
// SCROLL PROPIO: la tabla es ancha y vive dentro de un `overflow-x-auto`. El
// body de la página no hace scroll horizontal en móvil; la tabla sí, dentro de
// su caja.
//
// DÍGITOS TABULARES en toda celda con cifras. Sin `tabular-nums` los precios
// no alinean entre filas, y una tabla comparativa que no alinea cifras no
// compara nada. (`ComparadorLotes` de la LP resuelve lo mismo con `.lp-num`,
// que es una clase del tema `lp-*` y no existe fuera de `src/app/lp/`.)
//
// LA COLUMNA DE MENSUALIDAD EXISTE O NO EXISTE. Si ningún proyecto publica
// plan, la columna no se dibuja: una columna entera de huecos ocupa el ancho
// que necesitan las que sí tienen datos.
//
// Las celdas sin dato se quedan VACÍAS, tal como promete `tablaIntro`. La
// regla de omitir la etiqueta es de la ficha; en una tabla la etiqueta es el
// encabezado de la columna y es compartido, así que el hueco es el hueco.
// ============================================================

/** Encabezado. `numerica` sólo cambia la alineación: cifras a la derecha. */
function Th({ children, numerica = false }: { children: ReactNode; numerica?: boolean }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
        numerica ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

interface Props {
  proyectos: ProyectoGuia[];
  locale: string;
  t: Traductor;
}

export default function TablaComparativa({ proyectos, locale, t }: Props) {
  if (proyectos.length === 0) return null;

  const hayMensualidad = proyectos.some((p) => p.mensualidad !== null);

  const celda = 'border-b border-gray-100 px-4 py-3 align-top';
  const celdaNum = `${celda} text-right tabular-nums`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#1A2F3F] text-white">
            <Th>{t('colProyecto')}</Th>
            <Th numerica>{t('colPrecio')}</Th>
            <Th numerica>{t('colSuperficie')}</Th>
            <Th numerica>{t('colPrecioM2')}</Th>
            <Th numerica>{t('colEnganche')}</Th>
            {hayMensualidad && <Th numerica>{t('colMensualidad')}</Th>}
            <Th>{t('colFinanciamiento')}</Th>
            <Th>{t('colEntrega')}</Th>
          </tr>
        </thead>
        <tbody>
          {proyectos.map((p) => {
            const rotulo = rotuloBase(p, t);
            const mensualidad = p.mensualidad;
            const plazo = plazoDeLaMensualidad(p);
            const mesesMax = p.plazos.length > 0 ? Math.max(...p.plazos.map((x) => x.meses)) : null;

            return (
              <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                <th scope="row" className={`${celda} text-left font-normal`}>
                  <Link
                    href={`/${locale}/desarrollos/${p.slug}`}
                    className="font-semibold text-[#0E7490] hover:underline"
                  >
                    {p.tituloEditorial}
                  </Link>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {p.zona ? `${p.zona}, ${p.ciudad}` : p.ciudad}
                  </span>
                </th>

                {/* El precio, SIEMPRE con la base de la que sale. */}
                <td className={`${celdaNum} font-semibold text-[#1A2F3F]`}>
                  {formatPrice(p.precioDesdeMxn)}
                  {rotulo && (
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{rotulo}</span>
                  )}
                </td>

                <td className={celdaNum}>
                  {p.superficieDesdeM2 !== null ? formatArea(p.superficieDesdeM2) : null}
                </td>

                <td className={celdaNum}>
                  {p.precioPorM2Mxn !== null ? formatPrice(p.precioPorM2Mxn) : null}
                </td>

                <td className={celdaNum}>
                  {plazo && plazo.engancheMxn > 0 ? formatPrice(plazo.engancheMxn) : null}
                </td>

                {/* La mensualidad va con su plazo y con SU precio: a 48 meses
                    el precio ya no es el del «desde» de dos columnas antes. */}
                {hayMensualidad && (
                  <td className={celdaNum}>
                    {mensualidad && (
                      <>
                        <span className="font-semibold text-[#1A2F3F]">
                          {formatPrice(mensualidad.mensualidadMxn)}
                        </span>
                        <span className="mt-0.5 block text-xs font-normal text-gray-500">
                          {t('basePlazo', { meses: mensualidad.meses })} ·{' '}
                          {formatPrice(mensualidad.precioMxn)}
                        </span>
                      </>
                    )}
                  </td>
                )}

                {/* Sin plazos, la celda dice por qué no los hay — por código,
                    nunca con la prosa española de `motivoSinPlan`. */}
                <td className={`${celda} max-w-[22rem] text-gray-600`}>
                  {mesesMax !== null
                    ? t('basePlazo', { meses: mesesMax })
                    : explicacionSinPlan(p, t)}
                </td>

                {/* `delivery_text` es texto libre en español y sin columna
                    `_en` en el Hub: el vocabulario de fecha se traduce en el
                    render, igual que en la ficha de desarrollo. */}
                <td className={`${celda} text-gray-600`}>
                  {p.entregaTexto ? translateDateWords(p.entregaTexto, locale) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
