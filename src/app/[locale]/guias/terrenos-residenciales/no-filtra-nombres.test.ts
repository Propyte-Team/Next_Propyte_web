// ============================================================
// `nombre_desarrollo` (columna `name` en `v_developments`) es un dato
// PRIVADO que nunca sale en público. La regla se ha roto tres veces en este
// proyecto — las tres se detectaron mirando la página, no revisando código.
// Este archivo la vigila desde tres ángulos distintos, cada uno cerrando un
// hueco que el anterior deja abierto:
//
//   1. Una instancia — el fixture de abajo. Prueba que ESTE dato en concreto
//      no se filtra. No prueba que NINGÚN dato se filtre: si el fixture
//      cambia o queda desactualizado, el test sigue en verde con el bug vivo.
//   2. La fuente — que `guia-terrenos.ts` no le pida `name` a Postgres. Si
//      la columna nunca llega a esta capa, no hay refactor futuro (cualquier
//      nombre de campo, cualquier objeto) que pueda filtrarla. Es el
//      blindaje real: cierra la clase de bug, no una instancia.
//   3. El inventario real — trae los nombres internos DE LA BASE (no de una
//      lista escrita a mano, que envejece) y barre la salida real de
//      `getTerrenosGuia()` contra ellos.
// ============================================================

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  agruparPorProyecto,
  getTerrenosGuia,
  type DatosDesarrollo,
} from '@/lib/supabase/guia-terrenos';
import type { LoteComparable } from '@/lib/supabase/lp-lotes-comparador';
import { createPublicSupabaseClient } from '@/lib/supabase/public';

// Nombres internos reales de desarrollos publicados. Si alguno aparece en lo
// que la guía va a renderizar, la política está rota.
const NOMBRES_INTERNOS = ['Tierra Madre', 'Valenia', 'Anthar', 'Amares', 'Manilkara'];

function desarrollo(
  over: Partial<DatosDesarrollo> & Pick<DatosDesarrollo, 'id' | 'slug' | 'tituloEditorial'>,
): DatosDesarrollo {
  return {
    ciudad: 'Tulum',
    zona: null,
    amenidades: [],
    imagenes: [],
    totalUnidades: null,
    entregaTexto: null,
    ...over,
  };
}

function comparable(over: Partial<LoteComparable> & { id: string }): LoteComparable {
  return {
    etiqueta: 'x',
    ciudad: 'Tulum',
    superficieM2: 100,
    precioListaMxn: 1_000_000,
    esDeEstaLanding: false,
    fuente: 'ext_planos',
    plazos: [],
    contado: null,
    apartadoMxn: null,
    motivoSinPlan: null,
    motivoSinPlanCodigo: null,
    developmentId: null,
    ...over,
  };
}

describe('la guía no expone el nombre interno del desarrollo', () => {
  it('el proyecto solo lleva el título editorial', () => {
    const desarrollos: Record<string, DatosDesarrollo> = {
      dev1: desarrollo({
        id: 'dev1',
        slug: 'lotes-de-prueba-frente-al-mar',
        tituloEditorial: 'Lotes residenciales frente al mar',
      }),
    };
    const unidades: LoteComparable[] = [comparable({ id: 'u1', developmentId: 'dev1' })];

    const proyectos = agruparPorProyecto(unidades, desarrollos);
    const serializado = JSON.stringify(proyectos);

    for (const nombre of NOMBRES_INTERNOS) {
      expect(serializado, `"${nombre}" apareció en el resultado de agruparPorProyecto`).not.toContain(
        nombre,
      );
    }
  });
});

// ============================================================
// Refuerzo 1 — test ESTRUCTURAL, contra la FUENTE, no contra una instancia.
//
// El test de arriba solo prueba que ESTE fixture no filtra. Lo que blinda de
// verdad es que la consulta a `v_developments` en `guia-terrenos.ts` JAMÁS
// pida la columna `name`: si `name` nunca sale de Postgres hacia esta capa,
// no existe refactor de `agruparPorProyecto` (ni de nada que consuma su
// salida) capaz de filtrarla, sin importar qué campo nuevo se invente para
// cargarla. Por eso este test pesa más que el de arriba — cierra la CLASE de
// bug, no una instancia.
//
// Se implementa como lectura de la fuente (no como mock de Supabase) porque
// lo que hay que vigilar es el STRING que se le manda a Postgres, y un mock
// no lo expone: un mock respondería lo que el test le programe, nunca lo que
// el código de producción realmente pide.
// ============================================================
describe('la fuente nunca le pide `name` a v_developments (blindaje estructural)', () => {
  const rutaFuente = path.resolve(__dirname, '../../../../lib/supabase/guia-terrenos.ts');
  const fuente = readFileSync(rutaFuente, 'utf8');

  it('la consulta a v_developments no selecciona la columna `name`', () => {
    const idxTabla = fuente.indexOf("'v_developments'");
    expect(idxTabla, 'no se encontró la tabla v_developments en guia-terrenos.ts — ¿se movió o renombró?').toBeGreaterThan(-1);

    // Ventana corta después de `.from('v_developments')`: ahí vive el
    // `.select(...)` de ESA consulta y no el de ninguna otra.
    const ventana = fuente.slice(idxTabla, idxTabla + 600);
    const selectMatch = ventana.match(/\.select\(\s*(['"`])([\s\S]*?)\1/);
    expect(selectMatch, 'no se encontró el .select() de la consulta a v_developments').not.toBeNull();

    const columnasSeleccionadas = selectMatch![2]
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    // Ni como columna propia ni como alias (`alias:name`): ambas formas
    // contienen el token `name` con límite de palabra.
    const conNombreCrudo = columnasSeleccionadas.filter((c) => /\bname\b/i.test(c));
    expect(
      conNombreCrudo,
      `la consulta a v_developments pide "name": ${columnasSeleccionadas.join(', ')}`,
    ).toEqual([]);
  });

  it('la interfaz DatosDesarrollo no tiene ningún campo con "name" ni "nombre" crudos', () => {
    // Complementa el test de arriba: aunque `name` nunca se seleccione HOY,
    // esto detecta si alguien declara un campo pensado para cargarlo mañana
    // (`nombreInterno`, `internalName`, `rawName`...) antes de que el primer
    // `.select()` que lo llene se escriba siquiera. Acotado al bloque de la
    // interfaz para no atrapar comentarios que hablan DEL problema (como los
    // de este mismo archivo).
    const idxInterfaz = fuente.indexOf('export interface DatosDesarrollo');
    expect(idxInterfaz, 'no se encontró `export interface DatosDesarrollo`').toBeGreaterThan(-1);
    const cierre = fuente.indexOf('\n}', idxInterfaz);
    const bloqueInterfaz = fuente.slice(idxInterfaz, cierre);

    // Solo las líneas de declaración de campo (`algo: tipo;`), no los
    // comentarios `/** ... */` que documentan la propia regla y mencionan
    // "name"/"nombre" a propósito.
    const camposDeclarados = bloqueInterfaz
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[a-zA-Z_][\w]*\??:/.test(l));

    const camposSospechosos = camposDeclarados.filter((l) => /name|nombre/i.test(l));
    expect(
      camposSospechosos,
      `DatosDesarrollo declara un campo con "name"/"nombre": ${camposSospechosos.join(' | ')}`,
    ).toEqual([]);
  });
});

// Aserción de tipo — no es un test de vitest (los tipos se borran en tiempo
// de ejecución), es una línea que solo COMPILA si `DatosDesarrollo` no tiene
// ninguna de estas claves. La vigila `npx tsc --noEmit`, que ya corre en la
// verificación de cada PR: si alguien agrega `name`, `nombreDesarrollo` o
// equivalentes a la interfaz, esta línea deja de compilar y el build cae —
// sin depender de que nadie recuerde correr el test de arriba.
type ClavesProhibidas = 'name' | 'nombreDesarrollo' | 'nombre_desarrollo' | 'nombreInterno' | 'internalName';
type SinClavesProhibidas = [Extract<keyof DatosDesarrollo, ClavesProhibidas>] extends [never]
  ? true
  : false;
const _blindajeDeTipo: SinClavesProhibidas = true;
void _blindajeDeTipo;

// ============================================================
// Refuerzo 2 — contra el INVENTARIO REAL, no una lista escrita a mano.
//
// `NOMBRES_INTERNOS` (arriba) es fija: el día que se publique un desarrollo
// nuevo con un nombre interno que no esté en esa lista, el test de arriba
// pasa igual aunque la página lo filtre. Esta consulta trae los nombres
// DIRECTO de `real_estate_hub.v_developments.name` y barre la salida real de
// `getTerrenosGuia()` contra ellos: no envejece.
//
// Necesita red y las credenciales de Supabase EN EL PROCESO de vitest
// (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`). A propósito
// NO se implementa aquí ninguna carga de `.env.local` (regla del equipo:
// nunca leer `.env`/`.env.local`/`.env.production`) — a diferencia de
// `next dev`/`next build`, vitest no lo carga solo. El gate depende de que
// quien invoque `vitest` ya las tenga exportadas al proceso (CI con secrets,
// perfil de shell, o `dotenv -e .env.local -- npx vitest run` corrido a
// mano). Sin ellas, el bloque entero se SALTA — mismo patrón que ya usa
// `methodology-invariants.test.ts` para un recurso externo ausente
// (`it.skipIf(!computeDerivedPath)`), aplicado aquí a credenciales en vez de
// a un archivo.
// ============================================================
const TIENE_CREDENCIALES_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!TIENE_CREDENCIALES_SUPABASE)(
  TIENE_CREDENCIALES_SUPABASE
    ? 'la guía no expone ningún nombre interno del inventario real'
    : 'la guía no expone ningún nombre interno del inventario real (SALTADO: faltan NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY en el proceso de vitest)',
  () => {
    it('ningún `name` real de v_developments aparece en getTerrenosGuia()', async () => {
      const supabase = createPublicSupabaseClient();
      expect(
        supabase,
        'createPublicSupabaseClient() devolvió null pese al gate — revisar el gate de arriba',
      ).not.toBeNull();

      const { data: devs, error } = await supabase!
        .schema('real_estate_hub' as 'public')
        .from('v_developments')
        .select('id, name')
        .not('approved_at', 'is', null)
        .is('deleted_at', null);

      expect(error, `la consulta a v_developments falló: ${error?.message}`).toBeNull();

      const nombresReales = (devs ?? [])
        .map((d) => (d as { name: string | null }).name?.trim())
        // Descarta vacíos y nombres de 1-2 caracteres: coincidirían con
        // ruido de la serialización JSON (llaves, comas) y darían falsos
        // positivos que no prueban nada — un control negativo a medias.
        .filter((n): n is string => !!n && n.length > 2);

      // Si el inventario no trae ni un nombre, el barrido no compara contra
      // nada real y pasaría igual con el bug vivo.
      expect(
        nombresReales.length,
        'no se recuperó ningún nombre interno real desde v_developments — el barrido no prueba nada',
      ).toBeGreaterThan(0);

      const proyectos = await getTerrenosGuia();
      const serializado = JSON.stringify(proyectos);

      const filtrados = nombresReales.filter((nombre) => serializado.includes(nombre));
      expect(filtrados, `nombres internos reales filtrados por la guía: ${filtrados.join(', ')}`).toEqual(
        [],
      );
    });
  },
);
