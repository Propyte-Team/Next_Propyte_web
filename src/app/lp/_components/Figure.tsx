import Image from 'next/image';
import type { ImagenLanding } from '@/lib/supabase/lp-lotes';

// ============================================================
// Toda imagen de la landing, rotulada.
//
// EL PROBLEMA QUE RESUELVE. De cuatro imágenes, solo la aérea del polígono
// declaraba ser lo que era. Las otras tres —renders del desarrollador con
// vecinos jugando pádel y niños en la alberca— se publicaban sin decirlo, en
// una página cuya tesis explícita es que no vende renders como si fueran obra
// entregada. La inconsistencia no es un detalle de estilo: es la contradicción
// más visible que puede tener este argumento.
//
// `caption` NO ES OPCIONAL, y ese es el punto. Si fuera opcional, la próxima
// imagen entraría sin rótulo y nadie lo notaría hasta que un comprador lo
// notara. Al ser obligatorio en el tipo, el build falla antes.
//
// El prefijo lo pone el componente, no quien lo llama: «Render del
// desarrollador» tiene que decirse con las mismas palabras en las cuatro, y
// dejarlo al copy de cada llamada garantiza que en algún sitio se suavice.
// ============================================================

const PREFIJO: Record<ImagenLanding['tipo'], string> = {
  render: 'Render del desarrollador.',
  foto: 'Fotografía real.',
};

export default function Figure({
  imagen,
  sizes,
  priority = false,
  className = '',
  aspecto = 'aspect-[4/3]',
  tono = 'claro',
}: {
  imagen: ImagenLanding;
  sizes: string;
  priority?: boolean;
  className?: string;
  aspecto?: string;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';

  return (
    <figure className={className}>
      <div className={`relative overflow-hidden rounded-[var(--lp-r-media)] ${aspecto}`}>
        <Image
          src={imagen.url}
          alt={imagen.alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="object-cover"
        />
      </div>
      <figcaption
        className={`mt-2.5 max-w-[52ch] text-xs leading-relaxed ${
          oscuro ? 'text-[var(--lp-on-dark-soft)]' : 'text-[var(--lp-muted)]'
        }`}
      >
        <span className={oscuro ? 'text-[var(--lp-on-dark)]/80' : 'text-[var(--lp-ink-soft)]'}>
          {PREFIJO[imagen.tipo]}
        </span>{' '}
        {imagen.caption}
      </figcaption>
    </figure>
  );
}
