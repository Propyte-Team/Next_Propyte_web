// ============================================================
// Las cuatro secciones de copy puro de la guía de terrenos residenciales.
//
// Cero datos: aquí no entra nada del inventario. Todo sale del namespace
// `guias.terrenosResidenciales`, con el mismo patrón de listas de pares de
// claves que usa `guias/costa/page.tsx` — la lista se lee de un vistazo y
// añadir un bloque es añadir un renglón, no otro `<div>` copiado.
//
// El `t` llega por props ya resuelto por la página: cuatro `getTranslations`
// del MISMO namespace serían cuatro cargas del mismo diccionario.
// ============================================================

/**
 * El `t` del namespace `guias.terrenosResidenciales`, tal como lo devuelve
 * `getTranslations`. Con `values` porque tres claves de esta guía llevan
 * interpolación (`basePlazo`, `baseContadoParcial`, `sinPlanContadoParcial`).
 */
export type Traductor = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

/** Los cuatro criterios de comparación. Bloque 1. */
const CRITERIOS = [
  ['criterio1Title', 'criterio1Body'],
  ['criterio2Title', 'criterio2Body'],
  ['criterio3Title', 'criterio3Body'],
  ['criterio4Title', 'criterio4Body'],
] as const;

/** Los tres perfiles de lectura de la tabla. Bloque 2. */
const PERFILES = [
  ['perfilATitle', 'perfilABody'],
  ['perfilBTitle', 'perfilBBody'],
  ['perfilCTitle', 'perfilCBody'],
] as const;

/** Los cuatro motores de crecimiento de la región. Bloque 3. */
const MOTORES = [
  ['motor1Title', 'motor1Body'],
  ['motor2Title', 'motor2Body'],
  ['motor3Title', 'motor3Body'],
  ['motor4Title', 'motor4Body'],
] as const;

/** Los cuatro objetivos de inversión. Bloque 4. */
const OBJETIVOS = [
  ['objetivo1Title', 'objetivo1Body'],
  ['objetivo2Title', 'objetivo2Body'],
  ['objetivo3Title', 'objetivo3Body'],
  ['objetivo4Title', 'objetivo4Body'],
] as const;

const CONTENEDOR = 'mx-auto max-w-[1280px] px-4 md:px-6';

/**
 * Rejilla de pares título/cuerpo. Dos columnas en `md:`, una en móvil.
 *
 * El número ordinal va en el acento del sitio (#0E7490) sobre fondo claro; en
 * el bloque oscuro ese teal cae a ~2.4:1 contra #1A2F3F, así que ahí se
 * sustituye por blanco atenuado en vez de publicar un número ilegible.
 */
function Rejilla({
  pares,
  t,
  tono = 'claro',
}: {
  pares: readonly (readonly [string, string])[];
  t: Traductor;
  tono?: 'claro' | 'oscuro';
}) {
  const oscuro = tono === 'oscuro';

  return (
    <div className="mt-8 grid gap-x-8 gap-y-7 md:grid-cols-2">
      {pares.map(([titulo, cuerpo], i) => (
        <div
          key={titulo}
          className={`border-t pt-4 ${oscuro ? 'border-white/20' : 'border-gray-200'}`}
        >
          <span
            aria-hidden="true"
            className={`block text-xs font-semibold tracking-[0.08em] tabular-nums ${
              oscuro ? 'text-white/60' : 'text-[#0E7490]'
            }`}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3
            className={`mt-2 text-base font-bold md:text-lg ${
              oscuro ? 'text-white' : 'text-[#1A2F3F]'
            }`}
          >
            {t(titulo)}
          </h3>
          <p className={`mt-2 leading-relaxed ${oscuro ? 'text-white/80' : 'text-gray-700'}`}>
            {t(cuerpo)}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Bloque 1 — por qué existe la guía, y los cuatro criterios que compara. */
export function PorQueEstaGuia({ t }: { t: Traductor }) {
  return (
    <section aria-labelledby="guia-por-que" className="bg-white py-12 md:py-16">
      <div className={CONTENEDOR}>
        <h2 id="guia-por-que" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
          {t('porQueTitle')}
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">{t('porQueBody')}</p>
        <Rejilla pares={CRITERIOS} t={t} />
      </div>
    </section>
  );
}

/** Bloque 2 — los tres perfiles con los que se lee la comparación. */
export function ComoLeerLaComparacion({ t }: { t: Traductor }) {
  return (
    <section aria-labelledby="guia-como-leer" className="bg-gray-50 py-12 md:py-16">
      <div className={CONTENEDOR}>
        <h2 id="guia-como-leer" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
          {t('comoLeerTitle')}
        </h2>
        <Rejilla pares={PERFILES} t={t} />
      </div>
    </section>
  );
}

/** Bloque 3 — los cuatro motores de crecimiento de la Riviera Maya. */
export function PorQueCreceRivieraMaya({ t }: { t: Traductor }) {
  return (
    <section
      aria-labelledby="guia-crecimiento"
      className="bg-[#1A2F3F] py-12 text-white md:py-16"
    >
      <div className={CONTENEDOR}>
        <h2 id="guia-crecimiento" className="text-2xl font-bold md:text-3xl">
          {t('crecimientoTitle')}
        </h2>
        <Rejilla pares={MOTORES} t={t} tono="oscuro" />
      </div>
    </section>
  );
}

/** Bloque 4 — no hay un «mejor» proyecto: hay cuatro objetivos distintos. */
export function NoHayUnMejorProyecto({ t }: { t: Traductor }) {
  return (
    <section aria-labelledby="guia-no-hay-mejor" className="bg-white py-12 md:py-16">
      <div className={CONTENEDOR}>
        <h2 id="guia-no-hay-mejor" className="text-2xl font-bold text-[#1A2F3F] md:text-3xl">
          {t('noHayMejorTitle')}
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">{t('noHayMejorBody')}</p>
        <Rejilla pares={OBJETIVOS} t={t} />
      </div>
    </section>
  );
}
