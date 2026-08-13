import { fechaLarga } from './format';

// ============================================================
// Un dato que todavía no tenemos, con dueño y fecha.
//
// EL PROBLEMA QUE RESUELVE. Cuatro campos renderizados como huecos no leen como
// honestidad: leen como base de datos incompleta. Es exactamente el atributo que
// esta página intenta construir, dañado por la forma de presentarlo. «Licencia
// del desarrollo: —» dice «no lo sabemos y no lo hemos mirado». «En trámite,
// actualizado el 13 de agosto» dice «lo sabemos, está pasando, y te decimos
// cuándo lo verificamos por última vez».
//
// LA FECHA NO ES DECORACIÓN. Sin ella, «en trámite» es una promesa sin caducidad
// —la misma frase sirve igual hoy que dentro de un año— y el visitante no puede
// distinguir un pendiente vivo de una página abandonada.
//
// Un componente, dos estados: cuando el dato llega, el mismo bloque lo publica.
// La alternativa (un componente para el hueco y otro para el valor) garantiza
// que el día que lleguen los datos alguien se olvide de cambiar el primero.
// ============================================================

export default function PendingStatus({
  titulo,
  children,
  actualizado,
  cta,
  tono = 'claro',
}: {
  titulo: string;
  /** El porqué del pendiente. Sin eufemismos y sin disculpas. */
  children: React.ReactNode;
  /** ISO corto. La fecha en que se verificó por última vez. */
  actualizado: string | null;
  /** Qué puede hacer el visitante ahora mismo con este pendiente. */
  cta?: React.ReactNode;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';

  return (
    <div
      className={`border-l-2 pl-4 sm:pl-5 ${
        oscuro ? 'border-[var(--lp-accent-on-dark)]/60' : 'border-[var(--lp-accent)]/60'
      }`}
    >
      <p
        className={`text-[0.625rem] uppercase tracking-[0.14em] ${
          oscuro ? 'text-[var(--lp-accent-on-dark)]' : 'text-[var(--lp-accent)]'
        }`}
      >
        En trámite
      </p>

      <p
        className={`mt-2 max-w-[46ch] text-sm font-medium leading-snug ${
          oscuro ? 'text-[var(--lp-on-dark)]' : 'text-[var(--lp-ink)]'
        }`}
      >
        {titulo}
      </p>

      <div
        className={`mt-2.5 max-w-[62ch] text-sm leading-relaxed ${
          oscuro ? 'text-[var(--lp-on-dark-soft)]' : 'text-[var(--lp-ink-soft)]'
        }`}
      >
        {children}
      </div>

      {cta && (
        <p
          className={`mt-3 text-sm ${
            oscuro ? 'text-[var(--lp-on-dark)]/85' : 'text-[var(--lp-ink)]'
          }`}
        >
          {cta}
        </p>
      )}

      {actualizado && (
        <p
          className={`lp-num mt-3 text-[0.6875rem] ${
            oscuro ? 'text-[var(--lp-on-dark-soft)]' : 'text-[var(--lp-muted)]'
          }`}
        >
          Verificado el {fechaLarga(actualizado)}
        </p>
      )}
    </div>
  );
}
