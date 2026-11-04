import Image from 'next/image';
import Link from 'next/link';

export interface DevCardV3Data {
  id: string;
  href: string;
  name: string;
  place: string;
  image: string | null;
  /** Etiqueta de etapa ya traducida; null cuando el Hub no la tiene. */
  stageLabel: string | null;
  presale: boolean;
  priceLabel: string | null;
  /** Datos secundarios bajo el filete: tipos, disponibles, entrega. Solo reales. */
  meta: string[];
}

/**
 * Tarjeta de desarrollo v3: foto con recorte de bordes de 6 px, nombre en
 * Archivo, "Desde" a la derecha y un filete con los datos secundarios. Mismo
 * lenguaje que el carrusel del home (CityCarouselV3). Sin hooks: sirve igual en
 * el listado (cliente) que en la ficha (servidor).
 *
 * `wide` = tarjeta que ocupa dos columnas en escritorio. Con aspecto 16/10 a
 * doble ancho mide lo mismo de alto que una de 4/5, así que la fila no salta.
 */
export default function DevCardV3({
  d,
  fromLabel,
  wide = false,
  priority = false,
}: {
  d: DevCardV3Data;
  fromLabel: string;
  wide?: boolean;
  priority?: boolean;
}) {
  return (
    <article className={`group min-w-0 ${wide ? 'lg:col-span-2' : ''}`}>
      <Link href={d.href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1923] focus-visible:ring-offset-4 rounded-md">
        <div className={`relative overflow-hidden rounded-md bg-[#D9E0E3] aspect-[4/5] ${wide ? 'lg:aspect-[16/10]' : ''}`}>
          {d.image && (
            <Image
              src={d.image}
              alt={d.name}
              fill
              priority={priority}
              sizes={wide ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 66vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
            />
          )}
          {d.stageLabel && (
            <span className={`absolute left-3 top-3 lg:left-4 lg:top-4 text-xs lg:text-[13px] font-semibold px-2.5 py-1.5 lg:px-3 lg:py-[7px] rounded ${d.presale ? 'bg-propyte-brand text-[#0F1923]' : 'bg-[#0F1923] text-white'}`}>
              {d.stageLabel}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start gap-4 mt-3.5 lg:mt-5">
          <div className="min-w-0">
            <h3 className="font-display text-[21px] lg:text-[24px] leading-[1.1] font-semibold tracking-[-0.025em] text-[#13222C]">{d.name}</h3>
            <p className="mt-1 lg:mt-1.5 text-[13px] lg:text-[15px] text-[#5B6B74]">{d.place}</p>
          </div>
          {d.priceLabel && (
            <div className="text-right shrink-0">
              <span className="text-xs lg:text-[13px] text-[#5B6B74]">{fromLabel}</span>
              <b className="block font-display text-lg lg:text-[22px] font-semibold tracking-[-0.02em] text-[#13222C]">{d.priceLabel}</b>
            </div>
          )}
        </div>
        {d.meta.length > 0 && (
          <div className="mt-2.5 lg:mt-3.5 pt-2.5 lg:pt-3.5 border-t border-black/10 text-[13px] lg:text-sm text-[#5B6B74] flex flex-wrap gap-x-4 gap-y-1">
            {d.meta.map((m) => <span key={m}>{m}</span>)}
          </div>
        )}
      </Link>
    </article>
  );
}
