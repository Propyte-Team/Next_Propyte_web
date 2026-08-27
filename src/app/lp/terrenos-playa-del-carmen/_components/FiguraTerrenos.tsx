import Image from 'next/image';
import type { ImagenLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Toda imagen de la variante B, rotulada — y numerada.
//
// ═══ POR QUÉ NO SE REUSA `_components/Figure.tsx` ═══
//
// Ese componente es de la variante A y pinta con tokens `--lp-*`: fondo crema,
// radio de media, gris de subtítulo. Montado aquí heredaría la paleta de la
// otra variante, que es justo lo que `lpt-theme.css` prohíbe para que el A/B no
// mida ruido. La REGLA que sí se hereda, y es la que importa, es que `caption`
// no es opcional: si lo fuera, la próxima imagen entraría sin rótulo y nadie
// lo notaría hasta que lo notara un comprador. Al ser obligatorio en el tipo,
// el build falla antes.
//
// ═══ LA LÁMINA ═══
//
// La página es una hoja de campo, así que las imágenes no son tarjetas: son
// LÁMINAS de un plano. Cada una lleva su número («FIG. 04»), su rótulo de qué
// es, y la escuadra naranja de vértice que ya marca el panel del formulario.
// Esquina viva, cero radio: el tema lo declara para todo bloque.
//
// El prefijo «Render del desarrollador» lo pone el componente, no quien lo
// llama. Doce renders y una fotografía real conviven en esta página; si el
// rótulo lo escribiera cada llamada, en algún sitio se suavizaría.
// ============================================================

const PREFIJO: Record<ImagenLanding['tipo'], string> = {
  render: 'Render del desarrollador.',
  foto: 'Fotografía real.',
};

export default function FiguraTerrenos({
  imagen,
  sizes,
  /** Número de lámina. Se pasa a mano para que la numeración siga al documento. */
  lamina,
  /** Dos o tres palabras: qué amenidad o qué vista es. Va en la esquina. */
  rotulo,
  priority = false,
  className = '',
  aspecto = 'aspect-[4/3]',
  /** `false` en mosaicos densos, donde el pie iría repetido bajo cada lámina. */
  conPie = true,
}: {
  imagen: ImagenLanding;
  sizes: string;
  lamina: string;
  rotulo: string;
  priority?: boolean;
  className?: string;
  aspecto?: string;
  conPie?: boolean;
}) {
  return (
    <figure className={className}>
      <div
        className={`lpt-vertice relative overflow-hidden border border-[var(--lpt-linea-fuerte)] bg-[var(--lpt-abismo)] ${aspecto}`}
      >
        <Image
          src={imagen.url}
          alt={imagen.alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-cover"
        />

        {/* Cartela de lámina. Sobre la imagen, no debajo: así el rótulo viaja
            con la vista aunque el mosaico se reordene, y no hay forma de
            publicar una lámina anónima. El velo es un degradado local, no una
            capa a pantalla completa: no toca el centro de la imagen. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--lpt-abismo)] via-[var(--lpt-abismo)]/70 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-baseline gap-3 px-4 pb-3">
          <span className="lpt-cota text-[0.625rem] tracking-[0.14em] text-[var(--lpt-estaca)]">
            {lamina}
          </span>
          <span className="lpt-cota text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--lpt-claro)]">
            {rotulo}
          </span>
        </div>
      </div>

      {conPie && (
        <figcaption className="lpt-cuerpo mt-2.5 max-w-[52ch] text-[0.75rem] leading-relaxed text-[var(--lpt-claro-3)]">
          <span className="text-[var(--lpt-claro-2)]">{PREFIJO[imagen.tipo]}</span>{' '}
          {imagen.caption}
        </figcaption>
      )}
    </figure>
  );
}
