# Frente B+C — rutas rotas y atribución de fuentes · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar las cuatro piezas mecánicas del primer frente de remediación —atribución de fuentes, sitemap contra la compuerta de publicación, facetas de desarrollo vacías y scroll anidado del listado móvil— dejando en cada una la prueba que la habría atrapado.

**Architecture:** Cada pieza es una rama independiente desde `main` actualizado, con ciclo TDD estricto: prueba en rojo, arreglo mínimo, prueba en verde, gates, merge, verificación contra propyte.com. Los arreglos se hacen en el punto más alto de la cadena que cubra todos los síntomas: C1 en la capa de datos (cubre dos páginas), B1 en el generador de sitemap, B2 en la capa de consulta, B3 en el componente de lista.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind, Supabase (`real_estate_hub.v_developments`), vitest (`src/**/*.test.ts`, entorno node), Playwright (`tests/e2e`, proyectos Desktop Chrome y Pixel 5).

**Spec:** `docs/superpowers/specs/2026-08-06-frente-b-c-rutas-y-atribucion-design.md`

**Gates comunes a las cuatro tareas.** Se corren antes de cada commit:

```bash
npx tsc --noEmit          # 0 errores
npm run lint              # 0 errores (los avisos no bloquean)
npm run test:unit         # todo verde
npm run test:e2e:smoke    # todo verde — requiere `npx next dev -p 3000` levantado
npm run build             # limpio
```

El gate de lint se comprobó el 2026-08-06: `npm run lint` es `eslint` sin ruta y **sí
recorre el proyecto** —455 archivos analizados, 16 avisos, 0 errores—, así que sirve como
puerta para errores. Los avisos no hacen fallar el comando: no confundir «pasa el lint» con
«no dejó avisos nuevos».

---

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `src/lib/compliance/provider-names.ts` | **Crear.** Lista única de nombres de proveedor prohibidos en texto visible y el helper que la aplica. Una sola responsabilidad: saber qué no se puede publicar. | 1 |
| `src/lib/compliance/provider-names.test.ts` | **Crear.** Barrido estático del repo contra esa lista. | 1 |
| `src/lib/rental-data/analysis-types.ts` | **Modificar.** Quitar `SourceStat` y `source_stats` de `AnalysisData`. | 1 |
| `src/lib/rental-data/analysis.ts` | **Modificar.** Dejar de construir y emitir `sourceStats`. | 1 |
| `src/components/rentas/RentalAnalysisDashboard.tsx` | **Modificar.** Sustituir los chips por la atribución única. | 1 |
| `src/app/[locale]/mercado/components/tradicional/TradicionalTab.tsx` | **Modificar.** Idem. | 1 |
| `src/app/[locale]/zonas/[slug]/page.tsx` | **Modificar.** Quitar el nombre de proveedor del párrafo de indicadores. | 1 |
| `src/app/sitemap.ts` | **Modificar.** Declarar `visibilityKey` por entrada y filtrar por visibilidad. | 2 |
| `src/app/sitemap.test.ts` | **Modificar.** Añadir las dos pruebas de B1. | 2 |
| `src/lib/supabase/taxonomy-values.ts` | **Crear.** Mapa slug canónico → grafías del inventario, fuente única para filtro y prueba. | 3 |
| `src/lib/supabase/taxonomy-values.test.ts` | **Crear.** Contrato del mapa. | 3 |
| `src/lib/supabase/queries.ts` | **Modificar.** `in`/`overlaps` con los valores del mapa. | 3 |
| `src/components/marketplace/PropertyList.tsx` | **Modificar.** Sin scroller anidado por debajo de `lg`. | 4 |
| `src/app/[locale]/propiedades/MarketplaceContent.tsx` | **Modificar.** Sin altura fija de shell por debajo de `lg`. | 4 |
| `tests/e2e/marketplace-mobile-scroll.spec.ts` | **Crear.** Afirma móvil sin scroll anidado y escritorio con él. | 4 |

---

## Tarea 1 · C1 — Atribución de fuentes

Rama: `fix/c1-atribucion-fuentes`

**Files:**
- Create: `src/lib/compliance/provider-names.ts`
- Create: `src/lib/compliance/provider-names.test.ts`
- Modify: `src/lib/rental-data/analysis-types.ts:53-62`
- Modify: `src/lib/rental-data/analysis.ts:160-170`, `src/lib/rental-data/analysis.ts:282`
- Modify: `src/components/rentas/RentalAnalysisDashboard.tsx:50-59`, `:508-517`
- Modify: `src/app/[locale]/mercado/components/tradicional/TradicionalTab.tsx:395-404`
- Modify: `src/app/[locale]/zonas/[slug]/page.tsx:254-256`

- [ ] **Paso 1: Crear la rama**

```bash
cd /c/Users/Luis/Projects/Propyte/Next_Propyte_web
git fetch origin
git switch -c fix/c1-atribucion-fuentes origin/main
```

- [ ] **Paso 2: Escribir la lista de términos prohibidos**

Crear `src/lib/compliance/provider-names.ts`:

```typescript
/**
 * Proveedores externos de datos que NUNCA pueden aparecer en texto visible al
 * usuario: UI, tooltips, PDF, disclaimers, metodología ni respuestas de API.
 * La atribución pública es siempre "Análisis de mercado Propyte"; lo derivado,
 * "Estimación Propyte".
 *
 * Nombrarlos expone a Propyte legal y relacionalmente frente a esas empresas.
 *
 * Se prohíbe la FORMA DE DISPLAY (con mayúscula inicial o camel/Pascal). Los
 * identificadores internos en minúscula —`airdna_metrics`, `airdnaOccupancy`,
 * `source_portal`— son legítimos y no se tocan: nunca llegan al usuario.
 *
 * Excepción deliberada: "Airbnb" como nombre de la CATEGORÍA de renta
 * vacacional ("Vacacional (Airbnb)") sí se permite. Es el término estándar de
 * la industria, no una atribución de fuente.
 */
export const FORBIDDEN_PROVIDER_DISPLAY_NAMES = [
  'AirDNA',
  'AirROI',
  'Apify',
  'Properstar',
  'Lamudi',
  'Inmuebles24',
  'Vivanuncios',
  'EasyBroker',
  'Segundamano',
  'TheRedSearch',
  'Mercado Libre',
  'MercadoLibre',
] as const;

/** Atribución aprobada para cualquier dato de mercado mostrado al usuario. */
export const PROPYTE_ATTRIBUTION_ES = 'Análisis de mercado Propyte';
export const PROPYTE_ATTRIBUTION_EN = 'Propyte market analysis';

/**
 * Quita comentarios de bloque y de línea antes de buscar.
 *
 * Los comentarios que documentan de dónde sale el dato son contexto de
 * mantenimiento legítimo y nunca llegan al usuario: al escribir esto había 15
 * de esos y solo 2 violaciones reales. Prohibirlos todos habría borrado la
 * documentación sin reducir un gramo de exposición.
 *
 * Limitación conocida: una cadena que contenga `//` —una URL— trunca el resto
 * de esa línea para el escaneo. Es un falso negativo posible y aceptado.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

/**
 * Devuelve los términos prohibidos presentes en texto que puede llegar al
 * usuario. Case-sensitive a propósito: `airdna_metrics` no es una violación,
 * `AirDNA` sí.
 */
export function findForbiddenProviderNames(source: string): string[] {
  const code = stripComments(source);
  return FORBIDDEN_PROVIDER_DISPLAY_NAMES.filter((name) => code.includes(name));
}
```

- [ ] **Paso 3: Escribir la prueba que barre el repo**

Crear `src/lib/compliance/provider-names.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { findForbiddenProviderNames } from './provider-names';

const SRC = path.resolve(__dirname, '../..');

/** Este archivo declara la lista, así que se excluye de su propio barrido. */
const SELF = ['provider-names.ts', 'provider-names.test.ts'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|json)$/.test(entry) && !SELF.includes(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('nombres de proveedores de datos', () => {
  it('no aparecen en ningún archivo de src', () => {
    const offenders: string[] = [];

    for (const file of walk(SRC)) {
      const hits = findForbiddenProviderNames(readFileSync(file, 'utf8'));
      if (hits.length) {
        offenders.push(`${path.relative(SRC, file)} → ${hits.join(', ')}`);
      }
    }

    expect(offenders, `La atribución pública es "Análisis de mercado Propyte". Corregir:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('permite los identificadores internos en minúscula', () => {
    expect(findForbiddenProviderNames('const airdnaOccupancy = row.airdna_metrics')).toEqual([]);
    expect(findForbiddenProviderNames('type AirdnaMarketSummary = { occupancy: number }')).toEqual([]);
  });

  it('permite Airbnb como categoría de renta vacacional', () => {
    expect(findForbiddenProviderNames('Vacacional (Airbnb)')).toEqual([]);
  });

  it('permite el nombre del proveedor en comentarios', () => {
    expect(findForbiddenProviderNames('// Sin dato AirDNA para este market')).toEqual([]);
    expect(findForbiddenProviderNames('/** Resuelve AirDNA por zona */')).toEqual([]);
  });

  it('sí detecta el nombre en una plantilla visible', () => {
    // El bug exacto que se está arreglando.
    expect(findForbiddenProviderNames('`con datos de mercado de AirDNA`')).toEqual(['AirDNA']);
  });
});
```

- [ ] **Paso 4: Correr la prueba y verla fallar**

```bash
npx vitest run src/lib/compliance/provider-names.test.ts
```

Esperado: FALLA en «no aparecen en ningún archivo de src» con **exactamente un** infractor:

```
app/[locale]/zonas/[slug]/page.tsx → AirDNA
```

Verificado el 2026-08-06: de las 17 apariciones de `AirDNA` en `src`, 15 son comentarios y
las 2 restantes son las plantillas de las líneas 255-256 de ese archivo. `AirROI` aparece
una vez, también en comentario (`src/lib/calculator.ts`).

Si el fallo lista más archivos, revisar uno por uno antes de tocarlos: puede ser una fuga
nueva o un falso positivo del stripper de comentarios.

Los nombres de portales de `/es/rentas` y `/es/mercado` **no** los detecta esta prueba: no
están en el código, vienen del dato. Los cubre el paso 6 cortando la emisión en origen.

- [ ] **Paso 5: Quitar el nombre de proveedor del párrafo de zonas**

En `src/app/[locale]/zonas/[slug]/page.tsx`, sustituir el ternario de las líneas 254-256:

```tsx
              {isEn
                ? `Key short-term rental indicators for ${zone}, ${city}, ${state}, based on Propyte market analysis${summaryUpdated ? ` (updated ${summaryUpdated})` : ''}:`
                : `Indicadores clave de renta vacacional en ${zone}, ${city}, ${state}, según el análisis de mercado Propyte${summaryUpdated ? ` (actualizado a ${summaryUpdated})` : ''}:`}
```

- [ ] **Paso 6: Dejar de emitir `source_stats` desde la capa de datos**

En `src/lib/rental-data/analysis-types.ts`, borrar la interfaz `SourceStat` (líneas 53-56) y
la propiedad `source_stats: SourceStat[];` de `AnalysisData` (línea 62).

En `src/lib/rental-data/analysis.ts`, borrar la construcción de `sourceStats` conservando el
cálculo de `latestScraped`, que sí se sigue usando. El bloque de las líneas 160-170 queda:

```typescript
    // Fecha del registro más reciente. El desglose por portal ya no se emite:
    // la atribución pública es agregada ("Análisis de mercado Propyte"), así que
    // los nombres de proveedor no deben salir del servidor ni en el JSON.
    let latestScraped = '';
    for (const r of comparables) {
      if (r.scraped_at && r.scraped_at > latestScraped) latestScraped = r.scraped_at;
    }
```

Y borrar la línea 282, `source_stats: sourceStats,`.

- [ ] **Paso 7: Sustituir los chips por la atribución en `/es/rentas`**

En `src/components/rentas/RentalAnalysisDashboard.tsx`, borrar la interfaz local `SourceStat`
(líneas 50-53) y la propiedad `source_stats: SourceStat[];` (línea 59). Sustituir el bloque
de las líneas 508-517 por:

```tsx
      {/* Atribución + frescura del dato */}
      {data.total_comparables > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 -mt-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Database size={14} className="text-gray-600" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5CE0D2]" />
              Análisis de mercado Propyte <span className="text-gray-600">({data.total_comparables.toLocaleString()} registros)</span>
            </span>
```

El resto del bloque —el `{data.data_freshness && ...}` que sigue— se conserva sin cambios.

- [ ] **Paso 8: Sustituir los chips por la atribución en `/es/mercado`**

En `src/app/[locale]/mercado/components/tradicional/TradicionalTab.tsx`, sustituir el bloque
de las líneas 395-404 por:

```tsx
      {/* Atribución + frescura del dato */}
      {data.total_comparables > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Database size={14} className="text-gray-600" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-propyte-brand" />
            Análisis de mercado Propyte <span className="text-gray-600">({data.total_comparables.toLocaleString()} registros)</span>
          </span>
```

El resto del bloque se conserva sin cambios.

- [ ] **Paso 9: Correr la prueba y verla pasar**

```bash
npx vitest run src/lib/compliance/provider-names.test.ts
```

Esperado: PASS, 3 pruebas.

- [ ] **Paso 10: Gates**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build
```

Esperado: los cuatro sin errores. `tsc` es el que detecta cualquier consumidor de
`source_stats` que se haya pasado por alto — al escribir este plan eran
`RentalAnalysisDashboard.tsx` y `TradicionalTab.tsx`, que tipa su prop como `AnalysisData`.

- [ ] **Paso 11: Commit**

```bash
git add src/lib/compliance src/lib/rental-data/analysis.ts src/lib/rental-data/analysis-types.ts src/components/rentas/RentalAnalysisDashboard.tsx "src/app/[locale]/mercado/components/tradicional/TradicionalTab.tsx" "src/app/[locale]/zonas/[slug]/page.tsx"
git commit -m "fix(cumplimiento): la atribución pública es Propyte, no el proveedor

Las fichas de zona decían 'con datos de mercado de AirDNA' y /es/rentas y la
pestaña tradicional de /es/mercado pintaban chips con properstar, lamudi,
mercadolibre e inmuebles24. La regla de atribución ya existía y no tenía quien
la verificara.

source_stats deja de emitirse desde analysis.ts: cortarlo en la capa de datos
cubre las dos páginas y evita que los nombres viajen en el JSON.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Paso 12: Merge y verificación en producción**

```bash
git switch main && git pull origin main
git merge --no-ff fix/c1-atribucion-fuentes
git push origin main
```

Tras el pull del cron, verificar contra producción. La pestaña «Renta tradicional» de
`/es/mercado` no se activa sola: hay que hacer clic.

```bash
curl -s https://propyte.com/es/zonas/tulum-centro | grep -c "AirDNA"
```

Esperado: `0`. Para `/es/rentas` y `/es/mercado`, comprobación en navegador con clic en la
pestaña tradicional; esperado: ningún nombre de portal y la etiqueta «Análisis de mercado
Propyte · N registros».

---

## Tarea 2 · B1 — El sitemap respeta la compuerta de publicación

Rama: `fix/b1-sitemap-visibilidad`

**Files:**
- Modify: `src/app/sitemap.ts:31-64` (array `staticPages`), `:66-72` (bucle de emisión)
- Modify: `src/app/sitemap.test.ts`

- [ ] **Paso 1: Crear la rama**

```bash
git fetch origin && git switch -c fix/b1-sitemap-visibilidad origin/main
```

- [ ] **Paso 2: Escribir las dos pruebas**

Añadir a `src/app/sitemap.test.ts`, después de los mocks existentes:

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

describe('sitemap y compuerta de visibilidad', () => {
  it('omite las páginas que el Hub marca como no visibles', async () => {
    vi.resetModules();
    vi.doMock('@/lib/visibility', async () => {
      const real = await vi.importActual<typeof import('@/lib/visibility')>('@/lib/visibility');
      return { ...real, getVisibility: async () => ({ 'page.built': false }) };
    });

    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.endsWith('/es/built'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/en/built'))).toBe(false);
    // Una página sin gate no se ve afectada.
    expect(urls.some((u) => u.endsWith('/es/propiedades'))).toBe(true);
  });

  it('sale completo cuando el Hub no responde (fail-open)', async () => {
    vi.resetModules();
    vi.doMock('@/lib/visibility', async () => {
      const real = await vi.importActual<typeof import('@/lib/visibility')>('@/lib/visibility');
      return { ...real, getVisibility: async () => ({}) };
    });

    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.endsWith('/es/built'))).toBe(true);
  });

  it('toda página con assertPageVisible declara su visibilityKey en el sitemap', () => {
    // Guardarraíl: si mañana alguien gatea una página nueva y no la declara aquí,
    // el sitemap volvería a anunciar una URL que el sitio 404ea. Este test cae
    // antes de que eso llegue a producción.
    const APP = path.resolve(__dirname, '[locale]');
    const src = readFileSync(path.resolve(__dirname, 'sitemap.ts'), 'utf8');

    const gated: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) { walk(full); continue; }
        if (entry !== 'page.tsx') continue;
        const body = readFileSync(full, 'utf8');
        const m = body.match(/assertPageVisible\(\s*VISIBILITY_KEYS\.(\w+)/);
        if (!m) continue;
        const route = '/' + path.relative(APP, path.dirname(full)).split(path.sep).join('/');
        gated.push(route === '/' ? '' : route);
      }
    };
    walk(APP);

    const missing = gated.filter((route) => {
      const declared = new RegExp(`path:\\s*'${route}'[^}]*visibilityKey`).test(src);
      const present = new RegExp(`path:\\s*'${route}'`).test(src);
      return present && !declared;
    });

    expect(missing, `Estas rutas tienen gate pero no declaran visibilityKey en sitemap.ts: ${missing.join(', ')}`).toEqual([]);
  });
});
```

- [ ] **Paso 3: Correr las pruebas y verlas fallar**

```bash
npx vitest run src/app/sitemap.test.ts
```

Esperado: FALLAN la primera («omite las páginas…», porque `/es/built` sigue presente) y la
tercera («toda página con assertPageVisible…», listando `/built`, `/destacados` y las demás
rutas gateadas). La segunda pasa ya, porque hoy el sitemap siempre sale completo.

- [ ] **Paso 4: Declarar las claves y filtrar**

En `src/app/sitemap.ts`, añadir el import:

```typescript
import { getVisibility, isVisible, VISIBILITY_KEYS } from '@/lib/visibility';
```

Añadir `visibilityKey` a cada entrada de `staticPages` cuya página llame `assertPageVisible`.
Son **19**, verificadas el 2026-08-06 con
`grep -rn "assertPageVisible(VISIBILITY_KEYS\." src/app --include=page.tsx`. Todas están hoy
en `staticPages`, así que las 19 entradas se modifican:

```typescript
    { path: '/destacados', priority: 0.85, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_DESTACADOS },
    { path: '/built', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_BUILT },
    { path: '/exclusivos', priority: 0.85, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_EXCLUSIVOS },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' as const, visibilityKey: VISIBILITY_KEYS.PAGE_BLOG },
    { path: '/desarrolladores', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_DESARROLLADORES },
    { path: '/brokers', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_BROKERS },
    { path: '/proveedores', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_PROVEEDORES },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_FAQ },
    { path: '/glosario', priority: 0.6, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_GLOSARIO },
    { path: '/unete', priority: 0.6, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_UNETE },
    { path: '/financiamiento', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_FINANCIAMIENTO },
    { path: '/metodologia', priority: 0.8, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_METODOLOGIA },
    { path: '/rentas', priority: 0.85, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_RENTAS },
    { path: '/zonas', priority: 0.85, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_ZONAS },
    { path: '/promociones', priority: 0.75, changeFrequency: 'weekly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_PROMOCIONES },
    { path: '/como-comprar', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_COMO_COMPRAR },
    { path: '/como-invertir', priority: 0.7, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_COMO_INVERTIR },
    { path: '/guias/fiscal-legal', priority: 0.8, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_GUIAS_FISCAL_LEGAL },
    { path: '/guias/costa', priority: 0.8, changeFrequency: 'monthly' as const, visibilityKey: VISIBILITY_KEYS.PAGE_GUIAS_COSTA },
```

Las rutas sin compuerta —`''`, `/propiedades`, `/desarrollos`, `/mercado`, `/contacto`,
`/aviso-legal-inversion`, `/nosotros/*`— no llevan `visibilityKey` y no cambian de
comportamiento. Si el paso 3 reportó alguna ruta que no esté en esta lista, añadirla:
significa que se gateó una página después de escribirse este plan.

Antes del bucle de emisión, resolver la visibilidad una sola vez y filtrar:

```typescript
  // El sitemap no puede anunciar páginas que el sitio 404ea: las mismas claves
  // que consulta assertPageVisible mandan aquí. Fail-open igual que el gate —si
  // el Hub no responde sale el sitemap completo, que es preferible a emitir uno
  // mutilado y que Google lo lea como desindexación.
  const visibility = await getVisibility();
  const visiblePages = staticPages.filter(
    (page) => !page.visibilityKey || isVisible(visibility, page.visibilityKey),
  );

  for (const page of visiblePages) {
```

- [ ] **Paso 5: Correr las pruebas y verlas pasar**

```bash
npx vitest run src/app/sitemap.test.ts
```

Esperado: PASS, todas.

- [ ] **Paso 6: Gates**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build
```

- [ ] **Paso 7: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "fix(seo): el sitemap deja de anunciar páginas que el gate oculta

/built y /destacados devuelven 404 a propósito —assertPageVisible las apaga
según el Hub— pero sitemap.ts no consultaba esa compuerta y las publicaba con
prioridad 0.7 y 0.85.

El guardarraíl es el tercer test: recorre los page.tsx buscando
assertPageVisible y cae si una ruta gateada no declara su visibilityKey.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Paso 8: Merge y verificación en producción**

```bash
git switch main && git pull origin main && git merge --no-ff fix/b1-sitemap-visibilidad && git push origin main
```

Tras el pull del cron:

```bash
curl -s https://propyte.com/sitemap.xml | grep -cE '/(es|en)/(built|destacados)</loc>'
```

Esperado: `0`. **Cuidado con el fail-open:** un `0` también saldría si el Hub estuviera
caído y el sitemap fuera un fallback. Confirmar en la misma ventana que el Hub responde,
comprobando que una página gateada y visible sí sigue en el sitemap:

```bash
curl -s https://propyte.com/sitemap.xml | grep -c '/es/glosario</loc>'
```

Esperado: `1`.

---

## Tarea 3 · B2 — Las facetas de desarrollo devuelven resultados

Rama: `fix/b2-facetas-taxonomia`

**Files:**
- Create: `src/lib/supabase/taxonomy-values.ts`
- Create: `src/lib/supabase/taxonomy-values.test.ts`
- Modify: `src/lib/supabase/queries.ts:129-130`

- [ ] **Paso 1: Crear la rama**

```bash
git fetch origin && git switch -c fix/b2-facetas-taxonomia origin/main
```

- [ ] **Paso 2: Escribir el mapa de valores**

Crear `src/lib/supabase/taxonomy-values.ts`:

```typescript
/**
 * Puente entre los slugs canónicos de las URLs de faceta y las grafías que el
 * inventario guarda de verdad en `real_estate_hub.v_developments`.
 *
 * Por qué existe: el filtro usaba el slug crudo —`.eq('stage','preventa')`—
 * contra una columna que almacena `'Preventa'`. Las ocho facetas devolvían cero
 * resultados mientras el índice mostraba 19 desarrollos.
 *
 * Por qué no se renombran los slugs: la URL es un contrato público y no debe
 * atarse a un texto editable desde el Hub.
 *
 * MANTENIMIENTO: los valores de la derecha son grafías del dato, verificadas
 * contra la vista el 2026-08-06. Si alguien renombra un valor en el Hub, hay que
 * tocar este archivo o la faceta se vacía en silencio.
 */

export const STAGE_DB_VALUES: Record<string, string[]> = {
  preventa: ['Preventa'],
  construccion: ['En construcción'],
  entrega_inmediata: ['Entrega inmediata'],
};

export const TYPE_DB_VALUES: Record<string, string[]> = {
  departamento: ['Departamento'],
  casa: ['Casa', 'Residencia'],
  penthouse: ['Penthouse'],
  villa: ['Villa'],
  // El inventario distingue lote y terreno sin criterio estable; la faceta los
  // unifica porque para el comprador son el mismo producto.
  terreno: ['Terrenos', 'Terreno', 'Lote', 'Lotes'],
  // Sin representación en el inventario a 2026-08-06: la faceta queda vacía por
  // falta de dato, no por el filtro.
  macrolote: ['Macrolote', 'Macrolotes'],
};

/** Todas las grafías conocidas, para el contrato de la prueba. */
export const KNOWN_STAGE_DB_VALUES = [
  'Preventa', 'En construcción', 'Entrega inmediata', 'Entregado',
];
export const KNOWN_TYPE_DB_VALUES = [
  'Departamento', 'Casa', 'Penthouse', 'Villa', 'Lote', 'Lotes', 'Terrenos',
  'Terreno', 'Condominio', 'Local comercial', 'Lote comercial', 'Residencia',
  'Macrolote', 'Macrolotes',
];
```

- [ ] **Paso 3: Escribir la prueba de contrato**

Crear `src/lib/supabase/taxonomy-values.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  STAGE_DB_VALUES, TYPE_DB_VALUES,
  KNOWN_STAGE_DB_VALUES, KNOWN_TYPE_DB_VALUES,
} from './taxonomy-values';
import { STAGE_URL_SLUGS } from '@/app/[locale]/desarrollos/_components/stageConfig';
import { TYPE_SLUGS } from '@/app/[locale]/desarrollos/_components/typeConfig';

describe('contrato de taxonomía de facetas', () => {
  it('toda etapa expuesta en una URL resuelve a al menos una grafía del dato', () => {
    for (const canonical of Object.values(STAGE_URL_SLUGS)) {
      expect(STAGE_DB_VALUES[canonical], `falta la etapa "${canonical}"`).toBeDefined();
      expect(STAGE_DB_VALUES[canonical].length).toBeGreaterThan(0);
    }
  });

  it('todo tipo expuesto en una URL resuelve a al menos una grafía del dato', () => {
    for (const slug of TYPE_SLUGS) {
      expect(TYPE_DB_VALUES[slug], `falta el tipo "${slug}"`).toBeDefined();
      expect(TYPE_DB_VALUES[slug].length).toBeGreaterThan(0);
    }
  });

  it('ninguna grafía del mapa es desconocida para el inventario', () => {
    for (const values of Object.values(STAGE_DB_VALUES)) {
      for (const v of values) expect(KNOWN_STAGE_DB_VALUES).toContain(v);
    }
    for (const values of Object.values(TYPE_DB_VALUES)) {
      for (const v of values) expect(KNOWN_TYPE_DB_VALUES).toContain(v);
    }
  });

  it('ningún valor del mapa es el slug crudo en minúscula', () => {
    // Exactamente el bug que se está arreglando: filtrar 'preventa' contra
    // una columna que guarda 'Preventa'.
    const all = [...Object.values(STAGE_DB_VALUES), ...Object.values(TYPE_DB_VALUES)].flat();
    for (const v of all) expect(v).not.toBe(v.toLowerCase());
  });
});
```

- [ ] **Paso 4: Correr la prueba y verla fallar**

```bash
npx vitest run src/lib/supabase/taxonomy-values.test.ts
```

Esperado: FALLA si algún slug de `TYPE_SLUGS` no está en `TYPE_DB_VALUES`. Añadir al mapa
los slugs que reporte, con su grafía real, antes de continuar.

- [ ] **Paso 5: Usar el mapa en la consulta**

En `src/lib/supabase/queries.ts`, añadir el import:

```typescript
import { STAGE_DB_VALUES, TYPE_DB_VALUES } from './taxonomy-values';
```

Sustituir las líneas 129-130:

```typescript
  // El dato guarda las grafías de display ('Preventa', 'Departamento'), no los
  // slugs de la URL. `in`/`overlaps` sobre el mapa cubre además las variantes
  // plurales del inventario (Terrenos / Lotes).
  if (filters.type) query = query.overlaps('property_types', TYPE_DB_VALUES[filters.type] ?? [filters.type]);
  if (filters.stage) query = query.in('stage', STAGE_DB_VALUES[filters.stage] ?? [filters.stage]);
```

- [ ] **Paso 6: Correr la prueba y verla pasar**

```bash
npx vitest run src/lib/supabase/taxonomy-values.test.ts
```

Esperado: PASS, 4 pruebas.

- [ ] **Paso 7: Verificar contra la base antes de desplegar**

```bash
npx next dev -p 3000 &
sleep 20
for f in etapa/preventa etapa/construccion etapa/entrega-inmediata tipo/departamento tipo/casa tipo/penthouse tipo/terreno tipo/macrolote; do
  printf "%-30s %s\n" "$f" "$(curl -s "http://localhost:3000/es/desarrollos/$f" | grep -oE 'href="/es/desarrollos/[a-z0-9-]+"' | sort -u | wc -l)"
done
```

Esperado, contra los 19 desarrollos publicados: preventa 6, construccion 5,
entrega-inmediata 5, departamento 6, casa 3, penthouse 2, terreno 2, **macrolote 0**.
El cero de `macrolote` es correcto: ese valor no existe en el inventario. Parar el servidor
al terminar.

- [ ] **Paso 8: Gates**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build
```

- [ ] **Paso 9: Commit**

```bash
git add src/lib/supabase/taxonomy-values.ts src/lib/supabase/taxonomy-values.test.ts src/lib/supabase/queries.ts
git commit -m "fix(desarrollos): las facetas de etapa y tipo vuelven a dar resultados

El filtro comparaba el slug de la URL contra la columna del inventario:
.eq('stage','preventa') contra 'Preventa', .contains('property_types',
['departamento']) contra 'Departamento'. Las 8 facetas devolvían cero mientras
el índice mostraba 19 desarrollos.

taxonomy-values.ts es ahora la única fuente de verdad del puente slug→dato, y
resuelve de paso las variantes plurales (terreno casa con Terrenos y Lotes).

macrolote sigue vacía: ese valor no existe en el inventario.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Paso 10: Merge y verificación en producción**

```bash
git switch main && git pull origin main && git merge --no-ff fix/b2-facetas-taxonomia && git push origin main
```

Tras el pull del cron, repetir el bucle del paso 7 contra `https://propyte.com`. Esperados
los mismos números.

- [ ] **Paso 11: Plantear la decisión de `macrolote`**

Sin código. Llevar a Luis: `macrolote` no tiene inventario, así que la faceta y su entrada
de sitemap o se retiran, o se aceptan vacías de forma declarada. También quedan sin faceta
`Entregado` (1), `Villa` (2) y `Local comercial` (2), que serían alcance nuevo.

---

## Tarea 4 · B3 — El listado móvil fluye en el documento

Rama: `fix/b3-listado-movil`

**Files:**
- Create: `tests/e2e/marketplace-mobile-scroll.spec.ts`
- Modify: `src/components/marketplace/PropertyList.tsx:102`
- Modify: `src/app/[locale]/propiedades/MarketplaceContent.tsx:196`

- [ ] **Paso 1: Crear la rama**

```bash
git fetch origin && git switch -c fix/b3-listado-movil origin/main
```

- [ ] **Paso 2: Escribir la prueba**

Crear `tests/e2e/marketplace-mobile-scroll.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

/** Contenedores con scroll vertical propio que sobrepasan su alto visible. */
async function nestedScrollers(page: import('@playwright/test').Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((e) => {
        const cs = getComputedStyle(e);
        return /auto|scroll/.test(cs.overflowY)
          && e.scrollHeight > e.clientHeight + 40
          && e.clientHeight > 100;
      })
      .map((e) => ({
        cls: String(e.className).slice(0, 60),
        clientHeight: e.clientHeight,
        scrollHeight: e.scrollHeight,
      })),
  );
}

test.describe('listado de propiedades', () => {
  test('en móvil la lista fluye en el documento, sin scroller anidado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/es/propiedades', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const scrollers = await nestedScrollers(page);
    expect(
      scrollers,
      `El catálogo no debe vivir en una ventana de scroll anidada en móvil: ${JSON.stringify(scrollers)}`,
    ).toEqual([]);

    // Y el documento sí crece con las tarjetas.
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docH).toBeGreaterThan(5000);
  });

  test('en escritorio el split mapa+lista conserva su scroll interno', async ({ page }) => {
    // El shell de altura fija es intencional en lg: esta aserción impide que el
    // arreglo móvil se lo lleve por delante.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/es/propiedades', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const scrollers = await nestedScrollers(page);
    expect(scrollers.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Paso 3: Correr la prueba y verla fallar**

```bash
npx next dev -p 3000 &
sleep 20
npx playwright test tests/e2e/marketplace-mobile-scroll.spec.ts --project=chromium
```

Esperado: FALLA la prueba móvil, reportando un scroller con `clientHeight` en torno a 571 y
`scrollHeight` en torno a 12.691. La de escritorio pasa ya.

- [ ] **Paso 4: Quitar el scroller anidado por debajo de `lg`**

En `src/components/marketplace/PropertyList.tsx`, línea 102:

```tsx
      <div className="lg:flex-1 lg:overflow-y-auto lg:overscroll-contain" data-lenis-prevent>
```

En `src/app/[locale]/propiedades/MarketplaceContent.tsx`, línea 196:

```tsx
      <div className="flex flex-col lg:h-[calc(100dvh-100px)]">
```

En móvil el shell deja de imponer alto de viewport y la lista deja de crear su propia
región de scroll, así que las tarjetas fluyen en el documento. En `lg` todo queda igual.

- [ ] **Paso 5: Correr la prueba y verla pasar**

```bash
npx playwright test tests/e2e/marketplace-mobile-scroll.spec.ts --project=chromium
```

Esperado: PASS, las dos.

- [ ] **Paso 6: Comprobar que no se rompió el mapa en móvil**

```bash
npx playwright test tests/e2e/marketplace-mobile-scroll.spec.ts --project="Mobile Chrome"
npm run test:e2e
```

Esperado: sin regresión. Revisar a ojo que `MobileBottomSheet` sigue abriendo y cerrando
sobre el mapa. Parar el servidor de desarrollo al terminar.

- [ ] **Paso 7: Gates**

```bash
npx tsc --noEmit && npm run lint && npm run test:unit && npm run build
```

- [ ] **Paso 8: Commit**

```bash
git add tests/e2e/marketplace-mobile-scroll.spec.ts src/components/marketplace/PropertyList.tsx "src/app/[locale]/propiedades/MarketplaceContent.tsx"
git commit -m "fix(marketplace): en móvil el listado fluye en el documento

El shell de mapa+lista imponía h-[calc(100dvh-96px)] también en móvil, así que
49 resultados se veían por una ventana de 571px con overscroll-contain: dos
regiones de scroll compitiendo y ninguna señal de cuál mueve qué.

La prueba afirma las dos direcciones: móvil sin scroller anidado, escritorio
con él, para que el arreglo no se lleve por delante el split intencional de lg.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Paso 9: Merge y verificación en producción**

```bash
git switch main && git pull origin main && git merge --no-ff fix/b3-listado-movil && git push origin main
```

Tras el pull del cron:

```bash
PLAYWRIGHT_BASE_URL=https://propyte.com npx playwright test tests/e2e/marketplace-mobile-scroll.spec.ts --project=chromium
```

Esperado: PASS contra producción.

---

## Cierre del frente

- [ ] **Actualizar el informe de auditoría** con las correcciones acumuladas: B3 rebajado de
  P0 a P1, `/built` y `/destacados` reclasificados como gate deliberado más sitemap
  desincronizado, la fuga de proveedores extendida a `/es/mercado`, y los enlaces del pie
  que no apuntaban a las facetas.
- [ ] **Marcar el frente en el roadmap** (`2026-08-06-auditoria-roadmap-7-frentes.md`) y
  elegir el siguiente: la recomendación de partida es **A — verdad del dato**.
