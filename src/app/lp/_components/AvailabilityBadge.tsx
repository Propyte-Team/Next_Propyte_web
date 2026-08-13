import { fechaLarga } from './format';

// ============================================================
// Estado del lote a la fecha de corte.
//
// 🚨 ANTES DECÍA «UNO DISPONIBLE», Y ERA FALSO. El texto estaba escrito a mano
// partiendo de que `v_units` devuelve UN registro para este desarrollo. Pero
// ese registro es un TIPO de lote —«Lote Residencial en comunidad privada», de
// 129.6 m²—, no un lote concreto: el Hub guarda una unidad por desarrollo. El
// desarrollador declara 229 lotes disponibles de 310.
//
// Es decir, la página afirmaba escasez con un factor de error de 229, y lo
// hacía en el pixel más caro de una landing cuya tesis entera es que no fabrica
// urgencia. Un visitante que después descubre que quedan cientos de lotes no
// perdona esa cifra, y con razón: es el patrón del «¡últimas unidades!» que el
// resto de la página se dedica a desmontar.
//
// Ahora publica lo que el dato sostiene: el estado comercial literal del
// registro y, si existe, los disponibles DECLARADOS por el desarrollador,
// etiquetados como tales igual que las fechas de urbanización. Sin dato, solo
// el estado. La escasez real de esta página no es de inventario: es que el
// precio y el plazo están fijados a una fecha, y eso ya lo dice la fecha de
// corte.
//
// SUPERFICIE PROPIA. Sobre el hero el fondo es una fotografía, así que el
// contraste no puede depender de qué píxel toque debajo. El pill lleva su
// fondo al 92%: a esa opacidad, incluso contra blanco puro, el terracota claro
// mantiene 4.6:1.
//
// El punto nunca es el único portador del significado: el estado está escrito.
// ============================================================

export default function AvailabilityBadge({
  estado,
  disponibles,
  fechaCorte,
}: {
  /** Estado comercial literal del registro. */
  estado: string | null;
  /** Lotes disponibles que DECLARA el desarrollador. */
  disponibles: number | null;
  /** ISO corto. Se formatea aquí para no repetirlo en cada llamada. */
  fechaCorte: string | null;
}) {
  const corte = fechaCorte ? fechaLarga(fechaCorte) : null;
  if (!estado && !corte) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[var(--lp-r-control)] bg-[var(--lp-dark)]/92 px-3.5 py-2 ring-1 ring-[var(--lp-accent-on-dark)]/35 backdrop-blur-[2px]">
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-[var(--lp-accent-on-dark)] ring-4 ring-[var(--lp-accent-on-dark)]/20"
      />
      {estado && (
        <span className="text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-[var(--lp-accent-on-dark)]">
          {estado}
        </span>
      )}
      {disponibles !== null && (
        <span className="text-[0.6875rem] text-[var(--lp-on-dark-soft)]">
          <span className="lp-num">{disponibles}</span> lotes disponibles según el
          desarrollador
        </span>
      )}
      {corte && (
        <span className="lp-num text-[0.6875rem] tracking-[0.04em] text-[var(--lp-on-dark-soft)]">
          Al {corte}
        </span>
      )}
    </span>
  );
}
