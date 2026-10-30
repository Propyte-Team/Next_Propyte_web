import Link from 'next/link';

// ============================================================
// Pie mínimo: los únicos enlaces de salida de la página, obligatorios por ley.
// Sin menú, sin «ver más propiedades», sin redes.
// ============================================================

export default function PieLegal({
  aviso,
  inventario,
  tono = 'oscuro',
}: {
  aviso: string;
  /** «Inventario publicado: 10 casas de $4.4 M a $35.7 M MXN.» o null. */
  inventario?: string | null;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';
  return (
    <footer
      className={
        oscuro
          ? 'bg-[var(--lpv-panel-bg)] pb-24 text-[var(--lpv-panel-fg-3)] sm:pb-8'
          : 'border-t border-[var(--lpv-line)] bg-[var(--lpv-bg)] pb-24 text-[var(--lpv-fg-3)] sm:pb-8'
      }
    >
      <div
        className={`mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8 ${
          oscuro ? 'border-t border-[var(--lpv-panel-line)]' : ''
        }`}
      >
        <p className="max-w-[70ch] leading-relaxed">
          {aviso}
          {inventario ? ` ${inventario}` : null}
        </p>
        <nav className="flex shrink-0 gap-5">
          <Link href="/es/privacidad" prefetch={false} className="underline underline-offset-2">
            Privacidad
          </Link>
          <Link href="/es/terminos" prefetch={false} className="underline underline-offset-2">
            Términos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
