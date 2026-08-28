import Image from 'next/image';
import type { ImagenLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Toda imagen de la variante C: en cápsula de 32 px, y ROTULADA.
//
// ═══ LA CÁPSULA ═══
//
// Es la firma del estilo copiado: en la landing de referencia hay 79 nodos con
// `border-radius: 32px` y prácticamente ninguna imagen a esquina viva. Aquí se
// reproduce, y ojo con el detalle técnico: el radio recorta al `<Image fill>`
// solo si el contenedor crea contexto de apilamiento — de ahí el `isolate` de
// `.lpe-capsula`. Sin él, en Safari la imagen se desborda por las esquinas.
//
// ═══ LO QUE NO SE COPIA DEL ORIGINAL ═══
//
// Su galería no dice qué es cada imagen. La nuestra sí, y no es un adorno de
// estilo: 11 de las 12 son RENDERS de un proyecto que hoy no está construido, y
// el prefijo lo pone el componente —no quien lo llama— porque si el rótulo lo
// escribiera cada llamada, en algún sitio se suavizaría.
//
// `caption` NO ES OPCIONAL, y ese es el punto: si lo fuera, la próxima imagen
// entraría sin rótulo y nadie lo notaría hasta que lo notara un comprador. Al
// ser obligatorio en el tipo, el build falla antes.
//
// ⚠️ TODO CAMBIO DE `aspecto` ES UNA REVISIÓN NUEVA. El recorte lo hace
// `object-cover`, así que la imagen que ve el visitante NO es el archivo: en la
// variante B un rótulo con el nombre comercial que en el original quedaba en el
// borde entró al centro del cuadro al ensanchar el recorte. Ver
// `ARCHIVOS_RECHAZADOS` en `lp-lotes.ts`.
// ============================================================

const PREFIJO: Record<ImagenLanding['tipo'], string> = {
  render: 'Render del desarrollador.',
  foto: 'Fotografía real.',
};

export default function FiguraRedonda({
  imagen,
  sizes,
  priority = false,
  className = '',
  aspecto = 'aspect-[4/3]',
  /** Dos o tres palabras sobre la imagen. Sin él la cápsula va limpia. */
  etiqueta,
  /** `false` en mosaicos densos, donde 12 pies serían una columna de letra chica. */
  conPie = true,
}: {
  imagen: ImagenLanding;
  sizes: string;
  priority?: boolean;
  className?: string;
  aspecto?: string;
  etiqueta?: string;
  conPie?: boolean;
}) {
  return (
    <figure className={className}>
      <div className={`lpe-capsula relative bg-[var(--lpe-hueso)] ${aspecto}`}>
        <Image
          src={imagen.url}
          alt={imagen.alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-cover"
        />

        {etiqueta && (
          /* Píldora blanca translúcida, como las del original. Va DENTRO de la
             cápsula para que la etiqueta viaje con la imagen aunque el mosaico
             se reordene. */
          <span className="lpe-cuerpo absolute left-4 top-4 rounded-[var(--lpe-r-pill)] bg-[var(--lpe-blanco)]/92 px-3.5 py-1.5 text-[0.75rem] font-medium text-[var(--lpe-tinta)] backdrop-blur-sm">
            {etiqueta}
          </span>
        )}
      </div>

      {conPie && (
        <figcaption className="lpe-cuerpo mt-3 max-w-[54ch] text-[0.8125rem] leading-relaxed text-[var(--lpe-tinta-3)]">
          <span className="text-[var(--lpe-tinta-2)]">{PREFIJO[imagen.tipo]}</span>{' '}
          {imagen.caption}
        </figcaption>
      )}
    </figure>
  );
}
