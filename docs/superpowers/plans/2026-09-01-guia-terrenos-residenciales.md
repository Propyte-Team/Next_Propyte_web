# Guía de Terrenos Residenciales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar `/{locale}/guias/terrenos-residenciales` en ES y EN — la guía comparativa de terrenos de Riviera Maya, alimentada del inventario publicado, con formulario de captura que revela una agenda de Google al enviarse.

**Architecture:** Se reusa `lp-lotes-comparador.ts`, que ya normaliza las tres fuentes de financiamiento del Hub y calcula mensualidades correctas. Se le extrae la parte pura para poder testearla, se le quita el filtro de ciudad en duro, y encima se monta un orquestador (`guia-terrenos.ts`) que agrupa por desarrollo, adjunta el título editorial y aplica una puerta de calidad. La página es un RSC estático que consume ese orquestador.

**Tech Stack:** Next.js App Router (RSC), next-intl, Supabase (schema `real_estate_hub`), react-hook-form + zod, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-guia-terrenos-residenciales-design.md`

---

## Contexto que el ingeniero necesita antes de empezar

**Dónde se trabaja:** worktree `~/Projects/Propyte/Next_Propyte_web-guiaterrenos`, rama `feat/guia-terrenos-residenciales`, creada desde `origin/main` = `981594f`. Las dependencias ya están instaladas y la baseline es **444 tests verdes en 42 archivos**.

**Tres reglas del repo que no son negociables:**

1. **`nombre_desarrollo` NUNCA sale en público.** En `v_units` esa columna se llama `development_name` y en `v_developments`, `name`. Para mostrar un desarrollo se usa `publication_title` (con fallback a `meta_title`). Si escribes `development_name` o `name` en un componente, estás filtrando un dato privado.
2. **Cliente cookie-less para páginas con ISR.** `createPublicSupabaseClient()`, nunca `createServerSupabaseClient()`, o el build falla con `DYNAMIC_SERVER_USAGE`.
3. **Un `source` de lead que no esté en `KNOWN_SOURCES` no falla: se guarda y NUNCA llega a Zoho**, con `zoho_sync_error: 'SKIPPED: unknown source'`. El error es silencioso.

**El dato real con el que vas a trabajar** (capturado de producción el 2026-09-01, 11 unidades tipo Lote/Terreno publicadas en 7 desarrollos):

| Desarrollo | Unidades | Trampa que esconde |
|---|---|---|
| `lotes-residenciales-en-la-region-11-de-tulum` | 5 | Es un solo proyecto con 5 unidades: en la tabla va **una fila**, no cinco. |
| `lotes-residenciales-en-playa-del-carmen-2` | 1 | `area_m2` viene `"0.00"` — cero, no null. Un `?? fallback` no lo atrapa. |
| `club-residencial-con-amenidades` | 1 | `area_m2` es null; la superficie hay que rescatarla de `Propyte_unidades.superficie_terreno_m2`. |
| `amares-riviera-maya` | 1 | `price_mxn` es null. Queda fuera de la guía. |
| `lotes-residenciales-en-arrecifes-playa-del-carmen` | 1 | El único con `esquemas_pago` de plazos reales. Es el caso de control. |
| `lotes-residenciales-y-comerciales-en-playa-del-carmen` | 1 | Su plan de pagos vive solo en prosa. |
| `terrenos-residenciales-con-amenidades-en-playa-del-carmen` | 1 | Plan vía `ext_*` planos de la unidad. |

**Comando de tests:** `npx vitest run <ruta>` para uno, `npx vitest run` para todos.

---

## File Structure

**Nuevos**

| Archivo | Responsabilidad |
|---|---|
| `src/lib/supabase/guia-terrenos.ts` | Agrupa comparables por desarrollo, adjunta título editorial y slug, aplica la puerta de calidad. Exporta una función pura y una que consulta. |
| `src/lib/supabase/guia-terrenos.test.ts` | Fixture real + tests de la función pura. |
| `src/app/[locale]/guias/terrenos-residenciales/page.tsx` | RSC. Metadata, visibilidad, ensamblado. |
| `src/app/[locale]/guias/terrenos-residenciales/_components/BloquesEstaticos.tsx` | Las 4 secciones de copy puro (criterios, cómo leer, por qué crece, perfiles). |
| `src/app/[locale]/guias/terrenos-residenciales/_components/FichaProyecto.tsx` | La ficha de un proyecto. |
| `src/app/[locale]/guias/terrenos-residenciales/_components/TablaComparativa.tsx` | La tabla de N proyectos. |
| `src/components/forms/GuiaTerrenosForm.tsx` | Formulario + revelado de la agenda. Client component. |
| `tests/e2e/guia-terrenos.spec.ts` | e2e del formulario y la agenda. |

**Modificados**

| Archivo | Cambio |
|---|---|
| `src/lib/supabase/lp-lotes-comparador.ts` | Extraer la parte pura; parametrizar ciudad y tipos. |
| `src/lib/zoho/field-maps.ts` | `LeadSource` + `campaignSlug` + `formDescription`. |
| `src/app/api/leads/route.ts` | `KNOWN_SOURCES`. |
| `src/i18n/messages/es.json`, `en.json` | Namespace `guias.terrenosResidenciales`. |
| `src/lib/visibility.ts` | `PAGE_GUIAS_TERRENOS`. |
| `src/app/sitemap.ts` | Entrada en `staticPages`. |
| `src/components/layout/Footer.tsx` | Link en la columna de recursos. |

---

## Task 1: Extraer la parte pura del comparador

Hoy `getLotesComparables()` hace la consulta **y** construye los comparables en un solo bloque de ~110 líneas. Eso lo hace intestable sin mockear Supabase. El repo ya resolvió esto en `lp-casas.ts`, que separa `construirInventario(filas)` (pura) de la consulta. Se replica ese patrón.

**Files:**
- Modify: `src/lib/supabase/lp-lotes-comparador.ts`
- Test: `src/lib/supabase/lp-lotes-comparador.test.ts` (crear)

- [ ] **Step 1: Escribir el test que falla**

Crea `src/lib/supabase/lp-lotes-comparador.test.ts`. El fixture es real, capturado de `v_units` el 2026-09-01:

```ts
import { describe, expect, it } from 'vitest';
import { construirComparables, type FilaComparador } from './lp-lotes-comparador';

// Fixture REAL de producción (2026-09-01), recortado a las columnas que el
// módulo selecciona. Real y no sintético porque los casos que rompen la página
// son rarezas de ESTOS datos: un lote sin precio, uno con superficie 0.00, y
// uno cuyo plan de pagos solo existe en prosa.
const ARRECIFES: FilaComparador = {
  id: '74173087-68fb-4b65-af17-898870941e1a',
  development_id: 'b6dd225a-2338-476d-8e6f-478e9a7cfa88',
  city: 'Playa del Carmen',
  area_m2: 180,
  price_mxn: 1457121.6,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema: null,
  fin_meses_opciones: null,
  fin_esquemas_pago: [
    { id: 'sch_0_32572', meses: 12, tasa: 0, enganche_pct: 20, descuento_pct: 21.4286, contraentrega_pct: 40, contraentrega_via: 'hipotecario' },
    { id: 'sch_1_17113', meses: 24, tasa: 0, enganche_pct: 20, descuento_pct: 17.8571, contraentrega_pct: 40, contraentrega_via: 'hipotecario' },
    { id: 'sch_2_2601', meses: 36, tasa: 0, enganche_pct: 20, descuento_pct: 10.7143, contraentrega_pct: 40, contraentrega_via: 'hipotecario' },
    { id: 'sch_3_47752', meses: 48, tasa: 0, enganche_pct: 20, descuento_pct: 0, contraentrega_pct: 40, contraentrega_via: 'hipotecario' },
  ],
};

const SIN_PRECIO: FilaComparador = {
  id: '656d84c0-32bb-4366-9754-865612dc28c4',
  development_id: '06ea760e-e0cf-45fc-a774-81efe5728a9d',
  city: 'Playa del Carmen',
  area_m2: 665.28,
  price_mxn: null,
  unit_type: 'Lote',
  fin_tasa: null,
  fin_esquema: 'Preguntar por planes de financiamiento.',
  fin_meses_opciones: null,
  fin_esquemas_pago: [
    { id: 'sch_0_43382', meses: 0, tasa: 0, enganche_pct: 90, descuento_pct: 0, contraentrega_pct: 10, contraentrega_via: 'hipotecario' },
  ],
};

describe('construirComparables', () => {
  it('calcula la mensualidad de 48 meses que publica la guía de Gamma', () => {
    // Control externo: la guía de Gamma publica $15,454.32 para este lote a 48
    // meses. Sale de precio de LISTA (1,854,518, no el publicado de 1,457,121.60
    // que ya trae el descuento de 12 meses) x (1 - 20% - 40%) / 48.
    const [lote] = construirComparables(
      [ARRECIFES],
      new Map(),
      new Map([['b6dd225a-2338-476d-8e6f-478e9a7cfa88', 1854518]]),
    );

    const plazo48 = lote.plazos.find((p) => p.meses === 48);
    expect(plazo48).toBeDefined();
    expect(plazo48!.mensualidadMxn).toBeCloseTo(15454.32, 1);
  });

  it('descarta la fila sin precio en vez de publicar un lote sin cifra', () => {
    expect(construirComparables([SIN_PRECIO], new Map(), new Map())).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/supabase/lp-lotes-comparador.test.ts`
Expected: FAIL — `construirComparables` no está exportado.

- [ ] **Step 3: Extraer la función pura**

En `src/lib/supabase/lp-lotes-comparador.ts`, añade el tipo de fila y saca el cuerpo del `for` de `getLotesComparables()` a una función exportada. **El cuerpo del bucle no se modifica** — se mueve tal cual, desde `const precioPublicado = numeroONull(f.price_mxn);` hasta el `lotes.push({...})`, junto con el `sort` final.

```ts
/** Las columnas de `v_units` que consume el comparador. */
export interface FilaComparador {
  id: string;
  development_id: string | null;
  city: string | null;
  area_m2: number | string | null;
  price_mxn: number | string | null;
  unit_type?: string | null;
  fin_tasa: number | string | null;
  fin_esquema: string | null;
  fin_meses_opciones: unknown;
  fin_esquemas_pago: unknown;
}

/**
 * Construye los comparables a partir de filas ya consultadas.
 *
 * Separada de la consulta para poder testearla con un fixture real, mismo
 * patrón que `construirInventario` en `lp-casas.ts`.
 *
 * @param superficieBase  id de unidad → `superficie_terreno_m2` de la tabla base
 * @param precioMinDev    id de desarrollo → precio mínimo EN PESOS, o null
 */
export function construirComparables(
  filas: FilaComparador[],
  superficieBase: Map<string, number | null>,
  precioMinDev: Map<string, number | null>,
): LoteComparable[] {
  const lotes: LoteComparable[] = [];
  for (const f of filas) {
    // … cuerpo del bucle actual, sin cambios …
  }
  return lotes.sort((a, z) => {
    if (a.esDeEstaLanding !== z.esDeEstaLanding) return a.esDeEstaLanding ? -1 : 1;
    return a.precioListaMxn - z.precioListaMxn;
  });
}
```

Después, `getLotesComparables()` termina en:

```ts
  return construirComparables(filas as unknown as FilaComparador[], superficieBase, precioMinDev);
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/supabase/lp-lotes-comparador.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verificar que no se rompió la LP**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 446 tests verdes, `tsc` sin salida.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/lp-lotes-comparador.ts src/lib/supabase/lp-lotes-comparador.test.ts
git commit -m "refactor(comparador): extraer construirComparables para poder testearla

El calculo de mensualidades no tenia test porque vivia dentro de la
consulta. Se separa igual que construirInventario en lp-casas.ts, con
fixture real y el caso de Arrecifes fijado contra la cifra que publica
la guia de Gamma."
```

---

## Task 2: Parametrizar ciudad y tipos en la consulta

La guía es de Riviera Maya (Playa del Carmen **y** Tulum). Hoy la consulta tiene `'Playa del Carmen'` en duro. Además escribe `['Lote','Terreno']` a mano, cuando el repo ya tiene una única fuente de grafías.

**Files:**
- Modify: `src/lib/supabase/lp-lotes-comparador.ts:~410-434`

- [ ] **Step 1: Confirmar qué grafías expone el catálogo**

Run: `npx tsx -e "import {TYPE_DB_VALUES} from './src/lib/supabase/taxonomy-values'; console.log(TYPE_DB_VALUES.terreno)"`
Expected: un array que incluye al menos `Lote` y `Terreno`. Anota el resultado — si no los incluye, **detente y reporta**: significa que el catálogo cambió y el filtro de la guía necesita otra fuente.

- [ ] **Step 2: Cambiar la firma sin romper a la LP**

```ts
import { TYPE_DB_VALUES } from './taxonomy-values';

/** Ciudades de la LP de lotes. Es campaña de Playa del Carmen y así se queda. */
const CIUDADES_LP = ['Playa del Carmen'];

export async function getLotesComparables(
  ciudades: string[] = CIUDADES_LP,
): Promise<LoteComparable[]> {
```

y en la consulta, sustituye las dos líneas del filtro:

```ts
    .in('city', ciudades)
    .in('unit_type', TYPE_DB_VALUES.terreno)
```

**No toques ninguna llamada existente:** el default deja la LP exactamente igual.

- [ ] **Step 3: Verificar que la LP no cambió**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo verde.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/lp-lotes-comparador.ts
git commit -m "feat(comparador): parametrizar ciudades y tomar los tipos del catalogo

La guia de terrenos necesita Riviera Maya completa, no solo Playa del
Carmen. El default deja la LP intacta. Las grafias salen de
TYPE_DB_VALUES en vez de estar escritas a mano."
```

---

## Task 3: El orquestador de la guía

Aquí vive lo que la guía tiene y la LP no: **una fila por PROYECTO** (Gamma compara proyectos, y Tulum tiene 5 unidades), el título editorial, el link a la ficha, y la puerta de calidad.

**Files:**
- Create: `src/lib/supabase/guia-terrenos.ts`
- Test: `src/lib/supabase/guia-terrenos.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { agruparPorProyecto, type DatosDesarrollo } from './guia-terrenos';
import type { LoteComparable } from './lp-lotes-comparador';

function comparable(over: Partial<LoteComparable> & { id: string }): LoteComparable {
  return {
    etiqueta: 'x', ciudad: 'Tulum', superficieM2: 100, precioListaMxn: 1_000_000,
    esDeEstaLanding: false, fuente: 'ext_planos', plazos: [], contado: null,
    apartadoMxn: null, motivoSinPlan: null, developmentId: null,
    ...over,
  } as LoteComparable;
}

const DESARROLLOS: Record<string, DatosDesarrollo> = {
  tulum: {
    id: 'tulum', slug: 'lotes-residenciales-en-la-region-11-de-tulum',
    tituloEditorial: 'Lotes residenciales en la Región 11 de Tulum',
    ciudad: 'Tulum', zona: 'Región 11', amenidades: [], imagenes: ['/a.webp'],
    totalUnidades: 221, entregaTexto: 'Entrega y escrituración inmediata',
  },
};

describe('agruparPorProyecto', () => {
  it('colapsa las 5 unidades de Tulum en un solo proyecto', () => {
    const unidades = [123, 160, 166, 173.97, 276.6].map((m2, i) =>
      comparable({ id: `u${i}`, developmentId: 'tulum', superficieM2: m2, precioListaMxn: 299_000 + i * 1000 }),
    );
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos).toHaveLength(1);
    expect(proyectos[0].slug).toBe('lotes-residenciales-en-la-region-11-de-tulum');
  });

  it('la fila representa el lote MAS BARATO, que es el "desde" de la guia', () => {
    const unidades = [
      comparable({ id: 'caro', developmentId: 'tulum', precioListaMxn: 720_448.96, superficieM2: 276.6 }),
      comparable({ id: 'barato', developmentId: 'tulum', precioListaMxn: 299_000, superficieM2: 123 }),
    ];
    const [p] = agruparPorProyecto(unidades, DESARROLLOS);
    expect(p.precioDesdeMxn).toBe(299_000);
    expect(p.superficieDesdeM2).toBe(123);
  });

  it('NO calcula precio por m2 cuando la superficie viene en 0', () => {
    // `lotes-residenciales-en-playa-del-carmen-2` publica area_m2 = "0.00".
    // Dividir entre eso da Infinity, y una tabla comparativa con "$Infinity/m2"
    // es peor que una celda vacía.
    const [p] = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum', superficieM2: 0, precioListaMxn: 1_720_094 })],
      DESARROLLOS,
    );
    expect(p.precioPorM2Mxn).toBeNull();
  });

  it('descarta el proyecto cuyo desarrollo no trae titulo editorial', () => {
    // Sin `publication_title` el unico nombre disponible seria el interno, y ese
    // no sale en publico jamas. Antes que filtrarlo, el proyecto no aparece.
    const sinTitulo = { ...DESARROLLOS.tulum, tituloEditorial: '' };
    const proyectos = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum' })],
      { tulum: sinTitulo },
    );
    expect(proyectos).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/lib/supabase/guia-terrenos.test.ts`
Expected: FAIL — el módulo no existe.

- [ ] **Step 3: Añadir `developmentId` a `LoteComparable`**

El agrupado necesita saber de qué desarrollo viene cada unidad, y hoy el tipo no lo expone (la LP solo usa `esDeEstaLanding`). En `lp-lotes-comparador.ts`, añade el campo a la interfaz y pásalo en el `lotes.push`:

```ts
export interface LoteComparable {
  // … campos existentes …
  /** Desarrollo de origen. La guía agrupa por él; la LP no lo usa. */
  developmentId: string | null;
}
```

```ts
    lotes.push({
      id,
      developmentId: devId,
      // … resto sin cambios …
    });
```

- [ ] **Step 4: Escribir el orquestador**

```ts
// ============================================================
// Capa de datos de la guía de terrenos residenciales.
//
// La diferencia con el comparador de la LP: aquí se compara PROYECTO contra
// proyecto, como en la guía de Gamma. La LP compara lotes sueltos, y un
// desarrollo con 5 unidades publicadas ocuparía 5 filas de una tabla que
// promete comparar 6 desarrollos.
//
// CAMINO A NO APLICA AQUÍ. La LP oculta nombres a propósito porque no tiene
// rutas de salida. Esta guía sí enlaza a la ficha, así que usa el TÍTULO
// EDITORIAL (`publication_title`). Sigue sin usar `nombre_desarrollo`, que es
// el dato privado: si un desarrollo no tiene título editorial, se queda fuera.
// ============================================================

import { createPublicSupabaseClient } from '@/lib/supabase/public';
import {
  getLotesComparables,
  type LoteComparable,
  type PlazoOpcion,
} from './lp-lotes-comparador';

/** Ciudades de la guía. Riviera Maya, no solo Playa del Carmen. */
export const CIUDADES_GUIA = ['Playa del Carmen', 'Tulum'];

export interface DatosDesarrollo {
  id: string;
  slug: string;
  /** `publication_title`, con fallback a `meta_title`. NUNCA `name`. */
  tituloEditorial: string;
  ciudad: string;
  zona: string | null;
  amenidades: string[];
  imagenes: string[];
  totalUnidades: number | null;
  entregaTexto: string | null;
}

export interface ProyectoGuia {
  id: string;
  slug: string;
  tituloEditorial: string;
  ciudad: string;
  zona: string | null;
  amenidades: string[];
  imagenes: string[];
  totalUnidades: number | null;
  entregaTexto: string | null;
  precioDesdeMxn: number;
  superficieDesdeM2: number | null;
  /** null cuando no hay superficie utilizable. Nunca una división entre cero. */
  precioPorM2Mxn: number | null;
  plazos: PlazoOpcion[];
  /** Redactado en lenguaje de comprador cuando no hay plan de mensualidades. */
  motivoSinPlan: string | null;
}

/**
 * Colapsa las unidades en un proyecto por desarrollo.
 *
 * La unidad representativa es la MÁS BARATA: la guía publica cifras "desde",
 * igual que Gamma.
 */
export function agruparPorProyecto(
  unidades: LoteComparable[],
  desarrollos: Record<string, DatosDesarrollo>,
): ProyectoGuia[] {
  const porDesarrollo = new Map<string, LoteComparable[]>();
  for (const u of unidades) {
    if (!u.developmentId) continue;
    const lista = porDesarrollo.get(u.developmentId) ?? [];
    lista.push(u);
    porDesarrollo.set(u.developmentId, lista);
  }

  const proyectos: ProyectoGuia[] = [];

  for (const [devId, lista] of porDesarrollo) {
    const dev = desarrollos[devId];
    // Sin título editorial no hay nombre publicable. Fuera.
    if (!dev || !dev.tituloEditorial) continue;

    const representativa = lista.reduce((a, z) => (z.precioListaMxn < a.precioListaMxn ? z : a));

    // `> 0` y no `!== null`: el inventario publica superficies en 0.00, y
    // dividir entre eso da Infinity.
    const m2 = representativa.superficieM2;
    const superficieUtil = m2 !== null && m2 > 0 ? m2 : null;

    proyectos.push({
      id: devId,
      slug: dev.slug,
      tituloEditorial: dev.tituloEditorial,
      ciudad: dev.ciudad,
      zona: dev.zona,
      amenidades: dev.amenidades,
      imagenes: dev.imagenes,
      totalUnidades: dev.totalUnidades,
      entregaTexto: dev.entregaTexto,
      precioDesdeMxn: representativa.precioListaMxn,
      superficieDesdeM2: superficieUtil,
      precioPorM2Mxn:
        superficieUtil === null
          ? null
          : Math.round(representativa.precioListaMxn / superficieUtil),
      plazos: representativa.plazos,
      motivoSinPlan: representativa.motivoSinPlan,
    });
  }

  return proyectos.sort((a, z) => a.precioDesdeMxn - z.precioDesdeMxn);
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/lib/supabase/guia-terrenos.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/guia-terrenos.ts src/lib/supabase/guia-terrenos.test.ts src/lib/supabase/lp-lotes-comparador.ts
git commit -m "feat(guia-terrenos): agrupar comparables por proyecto

La guia compara desarrollos, no lotes sueltos: Tulum tiene 5 unidades
publicadas y en la tabla es una fila. La representativa es la mas barata,
que es el 'desde' que publica Gamma.

Dos guardas: superficie 0.00 no produce precio por m2 (el inventario
publica ceros), y un desarrollo sin titulo editorial no aparece antes que
exponer el nombre interno."
```

---

## Task 4: La consulta de la guía

**Files:**
- Modify: `src/lib/supabase/guia-terrenos.ts`

- [ ] **Step 1: Añadir la función de consulta**

Va al final de `guia-terrenos.ts`. No lleva test unitario: es I/O puro, y lo que se podía testear ya está en `agruparPorProyecto`.

**Reusa `getLotesComparables(CIUDADES_GUIA)` en vez de escribir otra consulta a `v_units`.** Ahí ya viven el rescate de superficie desde `Propyte_unidades` y el control de precio de lista, y duplicar esa consulta significaría que el día que alguien arregle un caso raro lo arregle en un solo sitio de los dos. La guía solo añade su propia consulta de **desarrollos**, que es el dato que la LP deliberadamente no pide.

```ts
/**
 * Los terrenos publicados de Riviera Maya, listos para la guía.
 *
 * PUERTA DE CALIDAD: entra el proyecto que tenga precio, superficie utilizable
 * y título editorial. La medición del 2026-09-01 daba 6 de 7 — el único fuera
 * era `amares-riviera-maya`, por no tener precio capturado. En cuanto se lo
 * capturen entra solo: no hay lista que mantener.
 */
export async function getTerrenosGuia(): Promise<ProyectoGuia[]> {
  const unidades = await getLotesComparables(CIUDADES_GUIA);
  if (unidades.length === 0) return [];

  const devIds = [...new Set(unidades.map((u) => u.developmentId).filter(Boolean))] as string[];
  if (devIds.length === 0) return [];

  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  const hub = supabase.schema('real_estate_hub' as 'public');

  // OJO: `name` es `nombre_desarrollo` y NO se selecciona. El título sale de
  // `publication_title`, con `meta_title` de respaldo. El dato privado no llega
  // ni a esta capa.
  const { data: devs } = await hub
    .from('v_developments')
    .select(
      'id, slug, publication_title, meta_title, city, zone, amenities, images, total_units, delivery_text',
    )
    .in('id', devIds)
    .not('approved_at', 'is', null)
    .is('deleted_at', null);

  const desarrollos: Record<string, DatosDesarrollo> = {};
  for (const d of (devs ?? []) as unknown as Record<string, unknown>[]) {
    const id = d.id as string;
    desarrollos[id] = {
      id,
      slug: (d.slug as string) ?? '',
      tituloEditorial: ((d.publication_title as string) || (d.meta_title as string) || '').trim(),
      ciudad: (d.city as string) ?? '',
      zona: (d.zone as string) ?? null,
      amenidades: Array.isArray(d.amenities) ? (d.amenities as string[]) : [],
      imagenes: Array.isArray(d.images) ? (d.images as string[]) : [],
      totalUnidades: d.total_units === null ? null : Number(d.total_units),
      entregaTexto: (d.delivery_text as string) ?? null,
    };
  }

  return agruparPorProyecto(unidades, desarrollos);
}
```

Con esto, los imports que necesita `guia-terrenos.ts` son `createPublicSupabaseClient`, `getLotesComparables`, `type LoteComparable` y `type PlazoOpcion`. **No importa `construirComparables`, `FilaComparador` ni `TYPE_DB_VALUES`** — si los dejaste en el import de la Task 3, quítalos ahora o el lint los marcará como no usados.

- [ ] **Step 2: Verificar contra el inventario real**

Run: `npx tsx -e "import('./src/lib/supabase/guia-terrenos').then(async m => { const p = await m.getTerrenosGuia(); console.log(p.length, p.map(x => [x.slug, x.precioDesdeMxn, x.precioPorM2Mxn, x.plazos.length])); })"`

Expected: **6 proyectos**, ninguno con slug `amares-riviera-maya`, y `lotes-residenciales-en-arrecifes-playa-del-carmen` con 4 plazos. Si sale otro número, **detente y reporta el desglose** antes de seguir — la puerta cambió o el inventario cambió.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/guia-terrenos.ts
git commit -m "feat(guia-terrenos): consulta del inventario de Riviera Maya

Selecciona publication_title y meta_title, nunca name: el nombre interno
no cruza a esta capa siquiera."
```

---

## Task 5: Registrar el lead source `guia_terrenos`

`campaignSlug` y `formDescription` son `switch` **exhaustivos sin `default`**, así que en cuanto añadas el literal al tipo, `tsc` te va a señalar exactamente dónde falta el caso. Es el guardia del repo: úsalo.

**Files:**
- Modify: `src/lib/zoho/field-maps.ts`, `src/app/api/leads/route.ts`
- Test: `src/lib/zoho/field-maps.guia-terrenos.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { sourceToZohoPayload } from './field-maps';

describe('guia_terrenos', () => {
  it('produce un lead de Zoho con campaña propia', () => {
    const payload = sourceToZohoPayload(
      'guia_terrenos',
      { name: 'Ana Ruiz', email: 'ana@example.com', phone: '+529841234567' },
      'es',
      {},
    );
    expect(payload.Nombre_de_Campa_a).toContain('guias/terrenos-residenciales');
    expect(payload.Nombre_de_Campa_a).toContain('[LEADS]');
    expect(payload.Nombre_del_formulario).toContain('Guía de terrenos');
    expect(payload.Lead_Source).toBe('Sitio web');
  });
});
```

**Antes de escribirlo:** abre `src/lib/zoho/field-maps.contacto.test.ts` y copia la firma exacta con la que ese test llama a `sourceToZohoPayload` — si difiere de la de arriba, usa la del repo.

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/lib/zoho/field-maps.guia-terrenos.test.ts`
Expected: FAIL — `'guia_terrenos'` no es asignable a `LeadSource`.

- [ ] **Step 3: Añadir el literal al tipo**

En `src/lib/zoho/field-maps.ts`, al final de la unión `LeadSource`:

```ts
  /** Landing de pago de casas, Riviera Maya — PDC + Tulum (Google/Meta Ads). */
  | "lp_casas_riviera"
  /** Guía comparativa de terrenos residenciales, alimentada del inventario. */
  | "guia_terrenos";
```

- [ ] **Step 4: Dejar que el compilador señale los switch**

Run: `npx tsc --noEmit`
Expected: errores en `campaignSlug` y en el `desc` de `formDescription`, ambos por no cubrir `"guia_terrenos"`. **Esos dos son los únicos que deben salir** — `campaignTag`, `campaignSubtag`, `tipoDeContacto` y `composeDescription` tienen `default` y no fallan. Si sale un tercero, léelo antes de tocarlo.

- [ ] **Step 5: Añadir los dos casos**

En `campaignSlug`:
```ts
    case "guia_terrenos":         return "guias/terrenos-residenciales";
```

En `formDescription`:
```ts
      case "guia_terrenos":       return "Guía de terrenos residenciales";
```

Los `default` de los otros cuatro son los correctos para esta guía: `[LEADS]`, sin subtag, `Tipo_de_Contacto: "Lead"`, y sin contexto estructurado extra (el formulario solo pide identidad).

- [ ] **Step 6: Añadir a la allowlist del endpoint**

En `src/app/api/leads/route.ts`, al final de `KNOWN_SOURCES`:
```ts
  'lp_casas_riviera',
  'guia_terrenos',
];
```

**No hay que tocar `LeadSchema`:** el formulario solo manda `name`, `email`, `phone`, `website`, `source`, `locale` y `page`, y los siete ya están declarados.

- [ ] **Step 7: Verificar**

Run: `npx vitest run && npx tsc --noEmit`
Expected: todo verde.

- [ ] **Step 8: Commit**

```bash
git add src/lib/zoho/field-maps.ts src/lib/zoho/field-maps.guia-terrenos.test.ts src/app/api/leads/route.ts
git commit -m "feat(leads): registrar el source guia_terrenos

Sin la entrada en KNOWN_SOURCES el lead se guarda y NUNCA llega a Zoho,
con zoho_sync_error SKIPPED y un 200 en la respuesta. El fallo seria
silencioso, asi que va con test."
```

---

## Task 6: Copy en los dos idiomas

**Files:**
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`
- Test: `src/i18n/guia-terrenos.test.ts`

- [ ] **Step 1: Escribir el test de paridad**

```ts
import { describe, expect, it } from 'vitest';
import es from './messages/es.json';
import en from './messages/en.json';

describe('guias.terrenosResidenciales', () => {
  it('tiene exactamente las mismas claves en los dos idiomas', () => {
    const kes = Object.keys((es as Record<string, Record<string, unknown>>).guias.terrenosResidenciales).sort();
    const ken = Object.keys((en as Record<string, Record<string, unknown>>).guias.terrenosResidenciales).sort();
    expect(ken).toEqual(kes);
  });

  it('ninguna cadena queda vacía', () => {
    const ns = (es as Record<string, Record<string, Record<string, unknown>>>).guias.terrenosResidenciales;
    for (const [k, v] of Object.entries(ns)) {
      if (typeof v === 'string') expect(v.trim(), k).not.toBe('');
    }
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/i18n/guia-terrenos.test.ts`
Expected: FAIL — `guias.terrenosResidenciales` no existe.

- [ ] **Step 3: Escribir el copy**

**El material de origen está escrito, no lo inventes:** `docs/superpowers/specs/2026-09-01-guia-terrenos-fuente-gamma.md` tiene el texto narrativo completo del Gamma, sección por sección, con las tres cosas que hay que cambiar señaladas. El inglés sale casi literal de ahí; el español es su traducción.

Dentro del objeto `guias` que ya existe en **ambos** archivos, añade `terrenosResidenciales`. Las claves:

`metaTitle`, `metaDescription`, `h1`, `intro`, `edicion` · `porQueTitle`, `porQueBody` y cuatro pares `criterio1Title`/`criterio1Body` … `criterio4Body` (precio y financiamiento, ubicación, plusvalía, certeza jurídica) · `monedaNota` · `proyectosTitle`, `proyectosIntro` · `tablaTitle`, `tablaIntro` y las cabeceras `colProyecto`, `colPrecio`, `colSuperficie`, `colPrecioM2`, `colEnganche`, `colMensualidad`, `colFinanciamiento`, `colEntrega` · `comoLeerTitle` y tres pares `perfilA*`/`perfilB*`/`perfilC*` · `crecimientoTitle` y cuatro pares `motor1Title`/`motor1Body` … `motor4Body` (infraestructura, población, turismo, inversión) · `noHayMejorTitle`, `noHayMejorBody` y cuatro pares `objetivo1Title`/`objetivo1Body` … `objetivo4Body` · `cierreTitle`, `cierreBody`, `cierreBullets` · `formNombre`, `formEmail`, `formTelefono`, `formEnviar`, `formEnviando`, `formGracias`, `formError` · `agendaTitle`, `agendaBody` · `disclaimer` · `verFicha`, `sinPlan`.

Reglas de redacción, no negociables:

- **Cero nombres de desarrollo.** El copy es genérico; los nombres los pone el dato.
- **Cero cifras.** Ninguna cadena lleva un precio, un porcentaje ni una fecha de entrega: todo eso sale del inventario. Una cifra en el JSON se queda vieja y nadie la vuelve a mirar.
- **El cierre habla del equipo**, no de una persona: «nuestro equipo», «agenda con un asesor». La firma personal del Gamma no se replica.
- `edicion` es el único texto con año («Edición 2026» / «2026 Edition»).

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/i18n/guia-terrenos.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/es.json src/i18n/messages/en.json src/i18n/guia-terrenos.test.ts
git commit -m "feat(i18n): copy de la guia de terrenos en ES y EN

Sin cifras a proposito: precios, plazos y entregas salen del inventario.
Una cifra escrita en el JSON envejece sin que nadie la vuelva a mirar."
```

---

## Task 7: Visibilidad y sitemap

**Files:**
- Modify: `src/lib/visibility.ts`, `src/app/sitemap.ts`
- Test: `src/app/sitemap.test.ts`

- [ ] **Step 1: Añadir el caso al test que ya existe**

En `src/app/sitemap.test.ts`, dentro del primer `it`, cambia el array:

```ts
    for (const path of ['/guias/fiscal-legal', '/guias/costa', '/guias/terrenos-residenciales']) {
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL en el caso nuevo.

- [ ] **Step 3: Registrar la key de visibilidad**

En `src/lib/visibility.ts`, junto a las otras dos de guías:
```ts
  PAGE_GUIAS_COSTA: "page.guias-costa",
  PAGE_GUIAS_TERRENOS: "page.guias-terrenos",
} as const;
```

`isVisible` es fail-open, así que una key que el Hub no conoce deja la página **visible**. Registrarla en el Hub es opcional y posterior.

- [ ] **Step 4: Añadir la entrada al sitemap**

En `src/app/sitemap.ts`, después de la de `/guias/costa`:
```ts
    { path: '/guias/terrenos-residenciales', priority: 0.8, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_GUIAS_TERRENOS },
```

`weekly` y no `monthly`: los precios del inventario cambian.

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/visibility.ts src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(seo): registrar la guia de terrenos en sitemap y visibilidad"
```

---

## Task 8: El formulario con la agenda

**Files:**
- Create: `src/components/forms/GuiaTerrenosForm.tsx`

- [ ] **Step 1: Escribir el componente**

Se calca la estructura de `src/components/property/ContactForm.tsx` — mismo esquema zod, mismo `PhoneInputField` con `Controller`, mismo honeypot, mismos estilos y mismos `aria-*`. Los cambios respecto a aquel:

1. Envía con `submitLead('guia_terrenos', data)` de `@/lib/leads/submit-lead` (no el `submitForm` deprecado).
2. No recibe `propertyId`/`propertyName`.
3. Al pasar a `sent`, **no resetea el formulario**: lo sustituye por el bloque de agenda.

```tsx
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { submitLead } from '@/lib/leads/submit-lead';
import { AlertCircle } from '@/lib/icons';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInput';

const schema = z.object({
  name: z.string().min(1, 'required'),
  email: z.string().email('invalidEmail'),
  phone: z.string().trim().min(1, 'required').refine(isValidPhoneNumber, { message: 'invalidPhone' }),
  website: z.string().optional(), // honeypot
});
type FormValues = z.infer<typeof schema>;

/**
 * Formulario de la guía, con la agenda detrás.
 *
 * El orden importa y es decisión de negocio: primero el lead, después el
 * calendario. Un embed de Google suelto se lleva al prospecto a la agenda sin
 * dejar rastro en el CRM — ni lead, ni UTMs, ni atribución de campaña.
 *
 * La URL vive en una variable de entorno, y si está vacía el bloque de agenda
 * no se renderiza. En este repo las env solo entran por deploy, así que el
 * formulario tiene que funcionar igual sin ella. Nunca un iframe roto.
 */
export default function GuiaTerrenosForm() {
  const t = useTranslations('common');
  const tg = useTranslations('guias.terrenosResidenciales');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const agendaUrl = process.env.NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL || '';

  const { register, handleSubmit, control, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setStatus('sending');
    const result = await submitLead('guia_terrenos', data);
    setStatus(result.ok ? 'sent' : 'error');
  }

  if (status === 'sent') {
    return (
      <div data-testid="guia-terrenos-gracias">
        <h3 className="text-xl font-bold text-[#1A2F3F]">{tg('formGracias')}</h3>
        {agendaUrl ? (
          <>
            <p className="mt-2 text-gray-700">{tg('agendaBody')}</p>
            <iframe
              title={tg('agendaTitle')}
              src={`${agendaUrl}?gv=true`}
              className="mt-4 w-full h-[600px] rounded-xl border border-gray-200"
              loading="lazy"
            />
          </>
        ) : null}
      </div>
    );
  }

  // … el resto: honeypot + los tres campos + botón, calcados de ContactForm.tsx
  // usando tg('formNombre'), tg('formEmail'), tg('formTelefono') como labels.
}
```

**Al escribir los tres campos, copia literalmente los bloques de `ContactForm.tsx`** (líneas ~70-145): el `relative` con el `AlertCircle` posicionado, los `aria-invalid`/`aria-describedby`/`aria-required`, y el `role="alert"` del mensaje. Cambia solo los `id` (`guia-name`, `guia-email`, `guia-phone`) y los labels.

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/GuiaTerrenosForm.tsx
git commit -m "feat(guia-terrenos): formulario con la agenda detras del envio

El lead entra al CRM antes de que aparezca el calendario. Un embed suelto
de Google se lleva al prospecto sin dejar rastro: ni lead, ni UTMs, ni
atribucion."
```

---

## Task 9: Las secciones de la página

**Files:**
- Create: `src/app/[locale]/guias/terrenos-residenciales/_components/BloquesEstaticos.tsx`, `FichaProyecto.tsx`, `TablaComparativa.tsx`

- [ ] **Step 1: `BloquesEstaticos.tsx`**

Server component sin estado. Exporta cuatro piezas —`PorQueEstaGuia`, `ComoLeerLaComparacion`, `PorQueCreceRivieraMaya`, `NoHayUnMejorProyecto`— construidas sobre listas de pares de claves, igual que el `BLOQUES` de `guias/costa/page.tsx`:

```tsx
const CRITERIOS = [
  ['criterio1Title', 'criterio1Body'],
  ['criterio2Title', 'criterio2Body'],
  ['criterio3Title', 'criterio3Body'],
  ['criterio4Title', 'criterio4Body'],
] as const;
```

Cada bloque recibe `t` por props (`t: (k: string) => string`) para no volver a pedir traducciones en cada uno. Rejilla de 2 columnas en `md:`, una en móvil. Paleta del repo: fondo oscuro `bg-[#1A2F3F]`, títulos `text-[#1A2F3F]`, acentos `text-[#0E7490]`.

- [ ] **Step 2: `FichaProyecto.tsx`**

Recibe `{ proyecto: ProyectoGuia; locale: string; t }`. Renderiza foto de portada (`proyecto.imagenes[0]`, con `next/image`), el `tituloEditorial` como `h3`, ciudad y zona, las amenidades como chips, la retícula de datos duros, y un `Link` a `/${locale}/desarrollos/${proyecto.slug}` con el texto de `t('verFicha')`.

Dos reglas:
- **Cada dato duro se renderiza solo si existe.** Nada de `—` ni de `0`. Un campo ausente no se dibuja.
- **Cuando `plazos` viene vacío se muestra `motivoSinPlan`**, que ya está redactado en lenguaje de comprador. Si también es null, se usa `t('sinPlan')`.

- [ ] **Step 3: `TablaComparativa.tsx`**

Recibe `{ proyectos: ProyectoGuia[]; locale: string; t }`.

- Envuelta en `<div className="overflow-x-auto">` — es ancha y el body de la página no debe hacer scroll horizontal.
- Dígitos tabulares en las celdas numéricas (`tabular-nums`), o los precios no se alinean entre filas y una tabla comparativa que no alinea cifras no compara.
- **La columna de mensualidad se renderiza solo si al menos un proyecto tiene plazos.** Se calcula antes: `const hayMensualidad = proyectos.some(p => p.plazos.length > 0)`.
- La mensualidad que se muestra es la del **plazo más largo** (la más baja), igual que hace el comparador de la LP. Dos cifras distintas para el mismo proyecto en la misma página se leen como un error.
- La primera celda de cada fila es el `tituloEditorial` enlazado a su ficha.

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin salida.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/guias/terrenos-residenciales/_components"
git commit -m "feat(guia-terrenos): fichas, tabla comparativa y bloques de copy

La columna de mensualidad solo existe si algun proyecto la tiene, y la
cifra es la del plazo mas largo — la misma convencion que la LP, para que
un proyecto no muestre dos mensualidades distintas en la misma pagina."
```

---

## Task 10: La página

**Files:**
- Create: `src/app/[locale]/guias/terrenos-residenciales/page.tsx`

- [ ] **Step 1: Escribirla**

Se calca `src/app/[locale]/guias/costa/page.tsx`: mismo `generateMetadata` con `alternates.languages` (`es`, `en`, `x-default`) y `openGraph` con `ogLocaleImages(locale)`, mismo `setRequestLocale`, mismo `assertPageVisible`, mismo `Breadcrumbs`.

Diferencias:

```tsx
export const revalidate = 3600;

const PATH = '/guias/terrenos-residenciales';

export default async function GuiaTerrenosPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_TERRENOS);

  const [t, tb, proyectos] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.terrenosResidenciales' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
    getTerrenosGuia(),
  ]);
  // …
}
```

Orden de renderizado: hero → breadcrumbs → `PorQueEstaGuia` → nota de moneda → fichas → tabla → `ComoLeerLaComparacion` → `PorQueCreceRivieraMaya` → `NoHayUnMejorProyecto` → cierre con `GuiaTerrenosForm` → disclaimer.

**Con menos de 2 proyectos no se renderizan ni las fichas ni la tabla**, y el resto de la página sigue igual con el formulario. Una «comparativa» de un proyecto no es una comparativa; el `ComparadorLotes` de la LP ya toma esa misma decisión (`if (lotes.length < 2) return null`).

`revalidate = 3600` y no estático: los precios salen del inventario.

- [ ] **Step 2: Verificar que la ruta responde**

```bash
npm run build 2>&1 | tail -20
```
Expected: build sin errores, y `/[locale]/guias/terrenos-residenciales` aparece en la lista de rutas.

- [ ] **Step 3: Verla en el navegador**

```bash
npm run dev
```
Abre `http://localhost:3000/es/guias/terrenos-residenciales` y `http://localhost:3000/en/guias/terrenos-residenciales`.

Verifica a ojo: **6 proyectos**, la tabla con las 8 columnas, ningún `NaN`, ningún `Infinity`, ninguna celda con `—` sospechosa, y el proyecto sin plan de pagos mostrando su motivo en prosa.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/guias/terrenos-residenciales/page.tsx"
git commit -m "feat(guia-terrenos): la pagina

Carpeta estatica, no segmento dinamico: un [slug] suelta un 200 con el
shell antes de resolver el notFound. ISR a 3600 porque los precios salen
del inventario."
```

---

## Task 11: El link del footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`, `src/i18n/messages/es.json`, `en.json`

- [ ] **Step 1: Añadir la clave al namespace `footer`**

En los dos JSON, dentro de `footer`: `"landGuide"` → `"Guía de terrenos"` / `"Land Guide"`.

- [ ] **Step 2: Añadir el link**

En la columna de recursos (la que abre con `{t('resources')}`), como primer `<li>` de su `<ul>`, con exactamente las mismas clases que sus hermanos:

```tsx
<li><Link href={`/${locale}/guias/terrenos-residenciales`} className="inline-flex items-center min-h-[44px] md:min-h-0 text-sm text-white/70 hover:text-white transition-colors">{t('landGuide')}</Link></li>
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run && npx tsc --noEmit`
Expected: verde. Recarga el navegador y comprueba que el link aparece en el footer y navega bien en los dos idiomas.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Footer.tsx src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(footer): enlazar la guia de terrenos en Recursos"
```

---

## Task 12: El test de fuga de nombres

La regla de que `nombre_desarrollo` no sale en público se ha roto **tres veces** en este proyecto, y las tres se detectaron mirando la página, no el código. Este test la vigila.

**Files:**
- Test: `src/app/[locale]/guias/terrenos-residenciales/no-filtra-nombres.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
import { describe, expect, it } from 'vitest';
import { agruparPorProyecto, type DatosDesarrollo } from '@/lib/supabase/guia-terrenos';
import type { LoteComparable } from '@/lib/supabase/lp-lotes-comparador';

// Nombres internos reales de los desarrollos de terreno publicados. Si alguno
// aparece en lo que la guía va a renderizar, la política está rota.
const NOMBRES_INTERNOS = ['Tierra Madre', 'Valenia', 'Anthar', 'Amares'];

describe('la guía no expone el nombre interno del desarrollo', () => {
  it('el proyecto solo lleva el título editorial', () => {
    const dev: DatosDesarrollo = {
      id: 'd1', slug: 'lotes-residenciales-en-playa-del-carmen',
      tituloEditorial: 'Lotes residenciales en Playa del Carmen',
      ciudad: 'Playa del Carmen', zona: 'Maroma',
      amenidades: [], imagenes: [], totalUnidades: 422, entregaTexto: null,
    };
    const unidad = {
      id: 'u1', developmentId: 'd1', etiqueta: 'x', ciudad: 'Playa del Carmen',
      superficieM2: 200, precioListaMxn: 1_599_840, esDeEstaLanding: false,
      fuente: 'ext_planos', plazos: [], contado: null, apartadoMxn: null,
      motivoSinPlan: null,
    } as unknown as LoteComparable;

    const serializado = JSON.stringify(agruparPorProyecto([unidad], { d1: dev }));
    for (const nombre of NOMBRES_INTERNOS) {
      expect(serializado).not.toContain(nombre);
    }
  });
});
```

- [ ] **Step 2: Correr**

Run: `npx vitest run "src/app/[locale]/guias/terrenos-residenciales/no-filtra-nombres.test.ts"`
Expected: PASS.

- [ ] **Step 3: Verificar que el test MUERDE**

Un test que pasa igual con el bug no prueba nada. Comprueba que falla cuando debe: cambia temporalmente `tituloEditorial` del fixture a `'Tierra Madre | Lotes residenciales'`, corre el test, y confirma que **FALLA**. Después revierte el cambio y confirma que vuelve a pasar.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/guias/terrenos-residenciales/no-filtra-nombres.test.ts"
git commit -m "test(guia-terrenos): vigilar que no se filtre el nombre interno

La politica se ha roto tres veces en este proyecto y las tres se
detectaron mirando la pagina, no el codigo."
```

---

## Task 13: e2e del formulario

**Files:**
- Create: `tests/e2e/guia-terrenos.spec.ts`

- [ ] **Step 1: Leer la convención**

Abre `tests/e2e/forms-todos-obligatorio.spec.ts` y copia su patrón: intercepta `/api/leads` **en los dos casos**, el incompleto y el completo. El incompleto también se intercepta porque si el guardia se rompe la petición sale de verdad y ensucia el CRM con un lead de prueba.

- [ ] **Step 2: Escribir los tres casos**

1. **Incompleto no envía:** llenar solo el nombre, enviar, y esperar que la ruta interceptada **no** reciba petición y que se vea el error de campo requerido.
2. **Completo envía en E.164:** llenar los tres, enviar, y verificar que el cuerpo interceptado trae `source: 'guia_terrenos'` y un `phone` que empieza por `+`.
3. **La agenda aparece después:** tras el envío exitoso, `[data-testid="guia-terrenos-gracias"]` es visible. Si `NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL` no está puesta en el entorno de la prueba, el iframe no estará — el test debe afirmar el bloque de gracias, y el iframe solo condicionado a que la variable exista.

- [ ] **Step 3: Correr**

Run: `npx playwright test tests/e2e/guia-terrenos.spec.ts`
Expected: 3 pasan, y **cero leads creados** — verifícalo mirando que la intercepción cubrió ambos casos.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/guia-terrenos.spec.ts
git commit -m "test(e2e): formulario de la guia de terrenos

Se intercepta /api/leads tambien en el caso incompleto: si el guardia se
rompe, la peticion sale de verdad y ensucia el CRM."
```

---

## Task 14: Verificación final

- [ ] **Step 1: Suite completa**

```bash
npx vitest run && npx tsc --noEmit && npm run build
```
Expected: todos los tests verdes (baseline 444 + los nuevos), `tsc` sin salida, build sin errores.

- [ ] **Step 2: Revisión a ojo en los dos idiomas**

Con `npm run dev`, recorre `/es/guias/terrenos-residenciales` y `/en/guias/terrenos-residenciales` y confirma, uno por uno:

- 6 proyectos, cada uno con su título editorial y su link a ficha funcionando.
- Ningún nombre interno de desarrollo en pantalla.
- Ningún `NaN`, `Infinity`, `null` ni `undefined` visible.
- La tabla hace scroll horizontal dentro de su contenedor; el body no.
- El formulario rechaza el envío incompleto y acepta el completo.
- El link del footer aparece y navega.
- En móvil (375 px) nada se desborda.

- [ ] **Step 3: Reportar antes de abrir el PR**

Escribe en el PR, con cifras medidas y no estimadas: cuántos proyectos salieron, cuántos tienen mensualidad, cuáles no y por qué, y qué falta capturar en el Hub (el precio de `amares-riviera-maya` y el plan de pagos de `club-residencial-con-amenidades`).

Recuerda que **falta poner `NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL` en el servidor**, o la agenda no aparecerá aunque el código esté desplegado. El valor es:

```
https://calendar.google.com/calendar/appointments/schedules/AcZssZ3g3bkzvlKcEERiywhxy_GrfaOmw4pRuKJI7lzMgB4FrF5MF0bS3KYtuWLqErGJgKy7bkbwaxFi
```

- [ ] **Step 4: Un solo PR con todos los commits**

Luis revisa el lote entero de una sentada: un PR, un commit por tarea.

```bash
git push -u origin feat/guia-terrenos-residenciales
gh pr create --title "Guía de terrenos residenciales alimentada del inventario" --body "…"
```

**Mergear es desplegar** en este repo: compila en el servidor y tarda ~4 min desde el push. No lo mergees sin que Luis lo diga.

---

## Task 4b: Enmienda — el precio que encabeza la tabla

Añadida el 2026-09-01 tras ejecutar `getTerrenosGuia()` contra producción. La Task 3
puso `precioDesdeMxn = representativa.precioListaMxn`, y eso resultó ser el precio MAS
CARO: el del plazo mas largo, sin descuento. Para el lote de Arrecifes publica
$1,854,518 y $10,303/m2, cuando la ficha de ese mismo lote en propyte.com muestra
$1,457,122 y la guia de Gamma dice $8,095/m2.

Decision de Luis: **el «desde» y el $/m2 usan el precio mas bajo alcanzable, y la
mensualidad se publica rotulada con su plazo y su propio precio.**

**Files:**
- Modify: `src/lib/supabase/guia-terrenos.ts`
- Test: `src/lib/supabase/guia-terrenos.test.ts`

### Lo que cambia en `ProyectoGuia`

- `precioDesdeMxn` pasa a ser el minimo entre: el precio de cada plazo
  (`plazos[].precioMxn`), el de contado (`contado.precioMxn`) y `precioListaMxn`.
  Los tres son precios reales a los que alguien puede comprar; el mas bajo es el «desde».
- `precioPorM2Mxn` se calcula sobre ese mismo numero, no sobre el de lista.
- Campo nuevo `precioListaMxn: number` — se conserva para poder rotular.
- Campo nuevo `mensualidad: { meses: number; mensualidadMxn: number; precioMxn: number } | null`
  — el plazo MAS LARGO (la mensualidad mas baja), con **su propio precio** al lado.
  Es la unica forma de publicarla sin mentir. `null` si no hay plazos.

### Tests que hay que añadir

Con el caso real de Arrecifes (`precioListaMxn` 1854518, plazo de 12 meses con
`precioMxn` 1457121.6 y plazo de 48 con mensualidad 15454.32):

- `precioDesdeMxn` es 1457121.6, **no** 1854518.
- `precioPorM2Mxn` sobre 180 m2 da 8095, **no** 10303. Es la cifra que publica Gamma.
- `mensualidad.meses` es 48, `mensualidad.precioMxn` es el precio de ESE plazo
  (1854518) y **no** el `precioDesdeMxn`. Este es el test que impide la cifra falsa.
- Un proyecto sin plazos y solo con contado toma el precio de contado como «desde».
- Un proyecto sin plazos ni contado cae a `precioListaMxn`.

### Verificacion

Volver a ejecutar `getTerrenosGuia()` contra produccion y confirmar que Arrecifes
publica ahora 1457121.6 y 8095, y que su `mensualidad` es
`{ meses: 48, mensualidadMxn: 15454.32, precioMxn: 1854518 }`.

---

## Nota para la Task 9 (tabla comparativa): rotular la base de cada celda

Consecuencia medida de la decision de la Task 4b. El `precioDesdeMxn` y el
`precioPorM2Mxn` de cada fila salen de bases distintas:

| Proyecto | base | $/m2 |
|---|---|---|
| Tulum Region 11 | lista | 2,431 |
| Terrenos c/ amenidades | plazo 48 | 7,800 |
| Lotes resid. y comerciales | **contado** | 6,399 (sobre preventa serian 7,999) |
| Arrecifes | **plazo 12** | 8,095 |
| Lotes resid. PdC 2 | contado | — (sin superficie) |
| Club residencial | contado | 8,900 |

O sea: la columna que ordena la tabla compara un precio de contado contra uno a
12 meses. Luis decidio que el «desde» sea el precio mas bajo alcanzable, asi que
esto se queda — pero **cada celda de precio debe llevar su base rotulada**
usando `precioDesdeBase` y `precioDesdeMeses`:

- `'contado'` → «de contado». Y cuando `contado.contraentregaPct > 0`, decirlo:
  dos de los tres proyectos de contado son en realidad **90% al firmar y 10%
  contra entrega**. El campo `contado` viaja justo para esto, y esos dos ademas
  traen `motivoSinPlan` con la frase ya redactada.
- `'plazo'` → «a N meses».
- `'lista'` → sin rotulo; es el precio unico.

Y la mensualidad se publica **siempre con su plazo y su propio precio**
(`mensualidad.precioMxn`), nunca junto al «desde» a secas: son de plazos
distintos y sumarlos mentalmente da una cifra que no existe.

---

## Task 6b: `motivoSinPlan` es español hardcodeado y la guia es bilingue

Detectado en la revision de la Task 6. `lp-lotes-comparador.ts` redacta cuatro
mensajes **en español, en el codigo**, para explicar por que un lote no publica
mensualidades: contado puro, el caso 90/10, tasa por confirmar, y condiciones
cambiando. Nacio para una landing monolingue.

La guia es ES+EN, y con una sola clave `sinPlan` generica quedan dos caminos y los
dos son malos: renderizar `motivoSinPlan` y meter español en la pagina inglesa, o
usar `sinPlan` y perder la distincion de cuatro casos que el spec vende como la
mitigacion del riesgo «se lee como si el proyecto no financiara».

**Solucion: el modulo expone un CODIGO junto a la prosa.** La landing sigue
usando la prosa —no se toca su render— y la guia traduce el codigo.

**Files:** `lp-lotes-comparador.ts`, `guia-terrenos.ts`, los dos JSON de i18n, y
sus tests.

1. En `LoteComparable`, campo nuevo al lado de `motivoSinPlan`:
   ```ts
   /**
    * El mismo motivo que `motivoSinPlan`, como codigo traducible.
    * La prosa se queda porque la LP monolingue la consume tal cual; la guia
    * es bilingue y necesita la clave.
    */
   motivoSinPlanCodigo:
     | 'contado' | 'contado_parcial' | 'tasa_por_confirmar'
     | 'condiciones_cambiando' | null;
   ```
   Se asigna en las MISMAS cuatro ramas que ya redactan la prosa. **Cero cambios
   en la prosa y cero en el orden de las ramas**: la LP debe seguir mostrando
   exactamente lo mismo.

2. `ProyectoGuia` lo propaga desde la unidad representativa.

3. Cuatro claves nuevas en `guias.terrenosResidenciales`, ES y EN:
   `sinPlanContado`, `sinPlanContadoParcial` (con `{enganche}` y
   `{contraentrega}`, misma forma que `baseContadoParcial`),
   `sinPlanTasaPorConfirmar`, `sinPlanCondicionesCambiando`.
   La `sinPlan` generica se queda como respaldo del codigo `null`.

4. Tests: que cada una de las cuatro ramas produzca su codigo, que el codigo y
   la prosa **no se desincronicen** (si hay prosa hay codigo y viceversa), y la
   paridad ES/EN de las claves nuevas con sus placeholders.
