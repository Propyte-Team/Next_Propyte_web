import Image from 'next/image';
import Link from 'next/link';
import { AMENITIES } from '@/components/property/AmenityList';
import { formatArea, formatPrice } from '@/lib/formatters';
import { ArrowRight, Building2, CheckCircle2, MapPin } from '@/lib/icons';
import { translateDateWords } from '@/lib/i18n/translate-date-words';
import type { PlazoOpcion } from '@/lib/supabase/lp-lotes-comparador';
import type { ProyectoGuia } from '@/lib/supabase/guia-terrenos';
import type { Traductor } from './BloquesEstaticos';

// ============================================================
// Ficha de un proyecto de la guía.
//
// REGLA DE OMISIÓN: un dato que no existe NO SE DIBUJA. Ni «—», ni 0, ni una
// etiqueta con la celda vacía. La retícula se arma en un array y se filtra
// antes de renderizar, así que un proyecto sin superficie sencillamente tiene
// una fila menos — no una fila que dice que le falta algo.
//
// Formato de cifras: `formatPrice`/`formatArea` de `@/lib/formatters`, los
// mismos que usan la ficha de desarrollo, el mercado y las corridas. No se
// reimplementa `Intl` aquí, y no se importa el `format.ts` de `src/app/lp/`:
// ese vive en el árbol de las landings, está atado al tema `lp-*` y el repo ya
// tiene su formateador canónico en `src/lib`.
// ============================================================

/**
 * El rótulo que dice de dónde sale el precio «desde».
 *
 * NO es cosmético: el «desde» de cada proyecto sale de una base distinta —hay
 * filas de contado y filas a 12 meses en la misma columna— y sin el rótulo el
 * lector compara dos cosas distintas creyendo que compara la misma.
 *
 * `contado` con `contraentregaPct > 0` NO es contado: dos de los tres
 * proyectos «de contado» son 90% al firmar y 10% contra entrega. Publicar «de
 * contado» a secas se comería ese 10% diferido, así que se rotula con los dos
 * pagos. `lista` no lleva rótulo: es el precio único, no hay base que aclarar.
 */
export function rotuloBase(proyecto: ProyectoGuia, t: Traductor): string | null {
  if (proyecto.precioDesdeBase === 'lista') return null;

  if (proyecto.precioDesdeBase === 'plazo') {
    return proyecto.precioDesdeMeses === null
      ? null
      : t('basePlazo', { meses: proyecto.precioDesdeMeses });
  }

  const contado = proyecto.contado;
  if (contado && contado.contraentregaPct > 0) {
    return t('baseContadoParcial', {
      enganche: contado.enganchePct,
      contraentrega: contado.contraentregaPct,
    });
  }
  return t('baseContado');
}

/**
 * Por qué este proyecto no publica mensualidades, traducido POR CÓDIGO.
 *
 * `ProyectoGuia` ni siquiera CARGA la prosa española equivalente
 * (`LoteComparable.motivoSinPlan`, que sí usa la LP monolingüe
 * `ComparadorLotes.tsx`) — no es solo que este componente la ignore. El
 * código es el único dato que cruza el idioma.
 */
export function explicacionSinPlan(proyecto: ProyectoGuia, t: Traductor): string {
  const codigo = proyecto.motivoSinPlanCodigo;

  if (codigo === 'contado') return t('sinPlanContado');
  if (codigo === 'contado_parcial') {
    const contado = proyecto.contado;
    // Por construcción `contado_parcial` implica `contado`; sin él no hay
    // porcentajes que interpolar y la clave genérica es la única que no miente.
    return contado
      ? t('sinPlanContadoParcial', {
          enganche: contado.enganchePct,
          contraentrega: contado.contraentregaPct,
        })
      : t('sinPlan');
  }
  if (codigo === 'tasa_por_confirmar') return t('sinPlanTasaPorConfirmar');
  if (codigo === 'condiciones_cambiando') return t('sinPlanCondicionesCambiando');
  return t('sinPlan');
}

/**
 * El plazo del que salió la mensualidad publicada — el más largo, el de la
 * mensualidad más baja. Se busca por meses en vez de recalcular el máximo para
 * que el enganche que se publica sea el de ESE plazo y no el de otro.
 */
export function plazoDeLaMensualidad(proyecto: ProyectoGuia): PlazoOpcion | null {
  const mensualidad = proyecto.mensualidad;
  if (!mensualidad) return null;
  return proyecto.plazos.find((p) => p.meses === mensualidad.meses) ?? null;
}

/** Tope de chips de amenidades. El resto se resume en un «+N» sin palabras. */
const CHIPS_MAX = 8;

/**
 * Las amenidades del Hub, resueltas contra la tabla canónica de `AmenityList`
 * — la MISMA tabla, importada, no una copia: duplicar sus regex era
 * garantizar que un día divergieran.
 *
 * No se usa el componente `AmenityList` entero porque está hecho para una
 * sección de página de detalle (sus dos únicos usos son eso) y no cabe en una
 * tarjeta: emite un `<h2>` propio que no se puede suprimir —dentro de este
 * `<article>`, cuyo título es un `<h3>`, sería un encabezado suelto por
 * ficha— y maqueta `md:grid-cols-4` con `truncate`, que en una tarjeta de un
 * tercio de ancho recorta cada etiqueta a unos pocos caracteres.
 *
 * EL FALLBACK. `AmenityList` publica la cadena CRUDA del Hub cuando no
 * matchea ninguna regla. En español eso está bien —es el dato tal cual—, pero
 * en `/en` es texto en español. Aquí la cruda se conserva en español y se
 * DESCARTA en inglés: una amenidad menos en la tarjeta inglesa es más barato
 * que una amenidad en español dentro de la página inglesa, y la ficha del
 * desarrollo —a un clic— las publica todas.
 */
function amenidadesTraducidas(crudas: string[], locale: string) {
  return crudas.flatMap((cruda) => {
    const canonica = AMENITIES.find((c) => c.match.test(cruda));
    if (canonica) {
      return [{ etiqueta: locale === 'en' ? canonica.en : canonica.es, Icono: canonica.icon }];
    }
    return locale === 'en' ? [] : [{ etiqueta: cruda, Icono: CheckCircle2 }];
  });
}

interface Props {
  proyecto: ProyectoGuia;
  locale: string;
  t: Traductor;
}

export default function FichaProyecto({ proyecto, locale, t }: Props) {
  const foto = proyecto.imagenes[0];
  const rotulo = rotuloBase(proyecto, t);
  const mensualidad = proyecto.mensualidad;
  const plazo = plazoDeLaMensualidad(proyecto);

  const amenidades = amenidadesTraducidas(proyecto.amenidades, locale);
  const chips = amenidades.slice(0, CHIPS_MAX);
  const chipsRestantes = amenidades.length - chips.length;

  // La retícula de datos duros. Cada `push` es condicional: lo que no existe
  // no entra al array y por lo tanto no se dibuja.
  const datos: { etiqueta: string; valor: string; nota?: string }[] = [
    { etiqueta: t('colPrecio'), valor: formatPrice(proyecto.precioDesdeMxn), ...(rotulo ? { nota: rotulo } : {}) },
  ];

  if (proyecto.superficieDesdeM2 !== null) {
    datos.push({ etiqueta: t('colSuperficie'), valor: formatArea(proyecto.superficieDesdeM2) });
  }
  if (proyecto.precioPorM2Mxn !== null) {
    datos.push({ etiqueta: t('colPrecioM2'), valor: formatPrice(proyecto.precioPorM2Mxn) });
  }
  if (plazo && plazo.engancheMxn > 0) {
    datos.push({ etiqueta: t('colEnganche'), valor: formatPrice(plazo.engancheMxn) });
  }
  if (mensualidad) {
    // La mensualidad NUNCA va sola: lleva su plazo y SU propio precio. El
    // «desde» de arriba puede ser de otra base —contado, o un plazo más
    // corto— y sumarlos mentalmente da una cifra que no existe.
    datos.push({
      etiqueta: t('colMensualidad'),
      valor: formatPrice(mensualidad.mensualidadMxn),
      nota: `${t('basePlazo', { meses: mensualidad.meses })} · ${formatPrice(mensualidad.precioMxn)}`,
    });
  }
  if (proyecto.entregaTexto) {
    // `delivery_text` es texto libre del Hub, en español, y no tiene columna
    // `_en`: la traducción del vocabulario de fecha («Invierno 2027») es
    // responsabilidad del render, igual que en la ficha de desarrollo.
    datos.push({
      etiqueta: t('colEntrega'),
      valor: translateDateWords(proyecto.entregaTexto, locale),
    });
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {foto ? (
          <Image
            src={foto}
            alt={proyecto.tituloEditorial}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 size={40} className="text-gray-300" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-[#1A2F3F]">
          {proyecto.tituloEditorial}
        </h3>

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={14} aria-hidden="true" />
          <span>{proyecto.zona ? `${proyecto.zona}, ${proyecto.ciudad}` : proyecto.ciudad}</span>
        </p>

        {/* `> 0` y no `!== null`: «0 lotes en el proyecto» es un hueco
            disfrazado de dato, y la regla es que lo que no existe no se
            dibuja. */}
        {proyecto.totalUnidades !== null && proyecto.totalUnidades > 0 && (
          <p className="mt-1 text-sm tabular-nums text-gray-500">
            {t('fichaUnidades', { total: proyecto.totalUnidades })}
          </p>
        )}

        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {chips.map(({ etiqueta, Icono }, i) => (
              <li
                // Índice en la clave: dos crudas distintas pueden colapsar en
                // la misma canónica («Alberca comunitaria» y «Piscina» →
                // «Alberca»), y la etiqueta sola daría claves repetidas.
                key={`${etiqueta}-${i}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
              >
                <Icono size={13} className="shrink-0 text-[#0E7490]" aria-hidden="true" />
                {etiqueta}
              </li>
            ))}
            {chipsRestantes > 0 && (
              <li className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs tabular-nums text-gray-500">
                +{chipsRestantes}
              </li>
            )}
          </ul>
        )}

        <dl className="mt-4 border-t border-gray-200">
          {datos.map((dato) => (
            <div
              key={dato.etiqueta}
              className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-gray-100 py-2.5"
            >
              <dt className="text-sm text-gray-600">{dato.etiqueta}</dt>
              <dd className="text-right text-sm font-semibold tabular-nums text-[#1A2F3F]">
                {dato.valor}
                {dato.nota && (
                  <span className="block text-xs font-normal text-gray-500">{dato.nota}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* Sin plan de pagos no se deja un hueco: se dice por qué no lo hay. */}
        {proyecto.plazos.length === 0 && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {explicacionSinPlan(proyecto, t)}
          </p>
        )}

        <div className="mt-auto pt-5">
          <Link
            href={`/${locale}/desarrollos/${proyecto.slug}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#0E7490] hover:underline"
          >
            {t('verFicha')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
