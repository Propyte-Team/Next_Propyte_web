# Taxonomía de pilares y hubs faltantes — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `/es/guias/fiscal-legal` y `/es/guias/costa` existan (hoy 404) y que la taxonomía canónica de pilares genere filtros combinables en `/es/blog`.

**Architecture:** Dos ejes separados y con nombres distintos. La columna nueva `blog_posts.pilar` (`P1..P7`) es la taxonomía canónica del maestro editorial y gobierna el filtro del blog y los dos hubs nuevos; el mapa `category → hub` que ya existe se muda a `hub-relacionado.ts` y sigue gobernando solo el módulo "artículos relacionados" de los hubs viejos, sin cambio de comportamiento. Los hubs nuevos son carpetas estáticas (no segmento dinámico) para que cualquier `/es/guias/x` dé 404 real sin depender de `notFound()`.

**Tech Stack:** Next 16.2 (App Router, RSC), next-intl 4.11, Supabase JS, vitest 4, Playwright 1.59, Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-04-pilares-taxonomia-hubs-design.md`
**Fuente de verdad editorial:** `~/Projects/Propyte/docs-editorial/07_Sistema-Pilares_MAESTRO_corte-30jul2026.md`

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/blog/hub-relacionado.ts` **(crear, mudado)** | Eje de afinidad de superficie: `category → hub`. Contenido actual de `pilares.ts` con símbolos renombrados. |
| `src/lib/blog/hub-relacionado.test.ts` **(crear, mudado)** | El test actual de `pilares.test.ts`, renombrado. Prueba que la mudanza no cambió comportamiento. |
| `src/lib/blog/pilares.ts` **(reescribir)** | Catálogo canónico `P1..P7`: código, slug, hubs, audiencia. Módulo neutro sin `'use client'`. |
| `src/lib/blog/pilares.test.ts` **(reescribir)** | Integridad del catálogo + que todo código tenga label en es **y** en. |
| `src/lib/blog/blog-urls.ts` **(modificar)** | Añade `?pilar=` y `?audiencia=` con orden estable. |
| `src/lib/blog/blog-urls.test.ts` **(crear)** | Orden de params, página 1 omitida, valores ausentes. |
| `src/components/blog/PilarArticles.tsx` **(modificar)** | Recibe `viewAllHref` en vez de derivarlo de `categories`. Sirve a los dos ejes. |
| `src/components/blog/PilarArticlesSection.tsx` **(modificar)** | Renombre de símbolos + pasa `viewAllHref`. |
| `src/components/blog/ArticulosDePilar.tsx` **(crear)** | Módulo de artículos por pilar canónico, para los hubs nuevos. |
| `src/components/blog/PilarFilter.tsx` **(crear)** | Chips de pilar como `<a href>` server-rendered, patrón de `CategoryFilter`. |
| `src/components/blog/AudienciaFilter.tsx` **(crear)** | Ídem para audiencia. |
| `src/components/blog/MapaDePilares.tsx` **(crear)** | Bloque estático que enlaza los 7 hubs, independiente de si tienen posts. |
| `src/lib/supabase/queries.ts` **(modificar)** | `getBlogPosts` acepta `pilar`/`audiencia`; nuevo `getBlogPilares`; `BlogPost` y `BLOG_SELECT` incluyen las columnas nuevas. |
| `src/app/[locale]/guias/fiscal-legal/page.tsx` **(crear)** | Hub P1. |
| `src/app/[locale]/guias/costa/page.tsx` **(crear)** | Hub P6. |
| `src/app/[locale]/blog/page.tsx` **(modificar)** | Lee los params nuevos, los pasa a la query, monta los filtros, `noindex` si el valor es inválido. |
| `src/components/blog/BlogPagination.tsx` **(modificar)** | Hereda el estado completo del filtro. |
| `src/lib/visibility.ts` **(modificar)** | Dos keys nuevas. |
| `src/app/sitemap.ts` **(modificar)** | Dos entradas → 4 URLs. |
| `src/app/sitemap.test.ts` **(crear)** | Assert de las 4 URLs nuevas. |
| `src/i18n/messages/{es,en}.json` **(modificar)** | Namespace `pilares` → `hubRelacionado`; namespaces nuevos `pilares`, `audiencias`, `guias`. |
| `src/app/[locale]/blog/[slug]/page.tsx`, `brokers/page.tsx`, `como-comprar/page.tsx`, `como-invertir/page.tsx` **(modificar)** | Renombre mecánico de símbolos y del namespace i18n. |
| `tests/e2e/blog-filtros.spec.ts` **(crear)** | Click-through de los filtros y de los hubs. |

---

## Task 1: Mudar el mapa de categorías a `hub-relacionado.ts`

Renombre puro, sin cambio de comportamiento. El objetivo es que la palabra "pilar" nombre exactamente una cosa.

**Files:**
- Create: `src/lib/blog/hub-relacionado.ts`, `src/lib/blog/hub-relacionado.test.ts`
- Delete: `src/lib/blog/pilares.ts`, `src/lib/blog/pilares.test.ts` (se reescriben en Task 2)
- Modify: `src/app/[locale]/blog/[slug]/page.tsx:13,139,161,307,310`, `src/components/blog/PilarArticlesSection.tsx:4,28`, `src/i18n/messages/es.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Escribir el test mudado**

Crear `src/lib/blog/hub-relacionado.test.ts` con exactamente las mismas expectativas que el actual, solo con los símbolos renombrados:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CATEGORIA_A_HUB, HUBS_RELACIONADOS, HUB_LABEL_KEY,
  hubDeCategoria, categoriasDeHub, hubHref,
} from './hub-relacionado';

/** Las 7 categorías publicadas en BD (locale es, status published) al 2026-07-28. */
const CATEGORIAS_EN_BD = [
  'Estilo de vida', 'Guías de compra', 'Inversión', 'Legal y fiscal',
  'Mercado', 'Para Asesores', 'Para Inversionistas',
];

afterEach(() => vi.restoreAllMocks());

describe('mapa de afinidad de superficie', () => {
  it('cubre TODAS las categorías que existen en BD', () => {
    const sinMapear = CATEGORIAS_EN_BD.filter((c) => !(c in CATEGORIA_A_HUB));
    expect(sinMapear).toEqual([]);
  });

  it('"Arquitectura y diseño" ya está mapeada aunque todavía no tenga artículos', () => {
    expect('Arquitectura y diseño' in CATEGORIA_A_HUB).toBe(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Arquitectura y diseño')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('cada hub declarado es una ruta válida', () => {
    for (const h of Object.values(CATEGORIA_A_HUB)) {
      if (h !== null) expect(HUBS_RELACIONADOS).toContain(h);
    }
  });

  it('todo hub tiene clave de etiqueta i18n', () => {
    for (const h of HUBS_RELACIONADOS) expect(HUB_LABEL_KEY[h]).toBeTruthy();
  });

  it('resuelve el mapa acordado', () => {
    expect(hubDeCategoria('Inversión')).toBe('como-invertir');
    expect(hubDeCategoria('Para Inversionistas')).toBe('como-invertir');
    expect(hubDeCategoria('Guías de compra')).toBe('como-comprar');
    expect(hubDeCategoria('Legal y fiscal')).toBe('como-comprar');
    expect(hubDeCategoria('Mercado')).toBe('mercado');
    expect(hubDeCategoria('Para Asesores')).toBe('brokers');
  });

  it('"Estilo de vida" no tiene hub y NO avisa (es deliberado)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Estilo de vida')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('una categoría nueva sin mapear avisa en vez de fallar en silencio', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Fiscalidad avanzada')).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('la vuelta agrupa las categorías de cada hub', () => {
    expect(categoriasDeHub('como-invertir').sort()).toEqual(['Inversión', 'Para Inversionistas']);
    expect(categoriasDeHub('como-comprar').sort()).toEqual(['Guías de compra', 'Legal y fiscal']);
    expect(categoriasDeHub('brokers')).toEqual(['Para Asesores']);
    expect(categoriasDeHub('financiamiento')).toEqual([]);
    expect(categoriasDeHub('desarrolladores')).toEqual([]);
  });

  it('hubHref respeta el locale', () => {
    expect(hubHref('es', 'como-invertir')).toBe('/es/como-invertir');
    expect(hubHref('en', 'brokers')).toBe('/en/brokers');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/blog/hub-relacionado.test.ts`
Expected: FAIL — `Failed to resolve import "./hub-relacionado"`.

- [ ] **Step 3: Crear el módulo mudado**

Crear `src/lib/blog/hub-relacionado.ts`:

```ts
/**
 * Mapa categoría de artículo → hub donde mostrarla ("afinidad de superficie").
 *
 * OJO — esto NO es la taxonomía de pilares del maestro editorial. Esa vive en
 * `pilares.ts` y en la columna `blog_posts.pilar` (P1..P7). Son dos preguntas
 * distintas, separadas a propósito:
 *   - `pilares.ts`  → ¿a qué pilar PERTENECE esta pieza? (taxonomía, uno a uno)
 *   - este archivo  → ¿en qué hub tiene sentido MOSTRARLA? (superficie, muchos a muchos)
 * Una pieza puede ser P1 (fiscal) y aun así reforzar /es/como-comprar.
 *
 * Sin este enlace bidireccional cada artículo compite con su propio hub por la
 * misma intención en vez de reforzarlo; con ~60 artículos nuevos previstos eso es
 * canibalización a escala.
 *
 * OJO — este mapa **publica UI**: añadir una entrada hace aparecer el módulo
 * "Artículos relacionados" en esa página hub y el enlace al hub en esos
 * artículos. Verificar que la categoría tenga artículos antes de mapearla.
 *
 * `null` = decidido NO tener hub (Luis, 2026-07-28: "Estilo de vida" no encaja
 * en ninguno). Se distingue de `undefined` (categoría que nadie mapeó todavía) a
 * propósito: si aparece una categoría nueva en BD y nadie toca este archivo, el
 * artículo se queda sin hub EN SILENCIO. `hubDeCategoria` avisa en dev.
 */

export const HUBS_RELACIONADOS = [
  'como-invertir',
  'financiamiento',
  'como-comprar',
  'mercado',
  'brokers',
  'desarrolladores',
] as const;

export type HubRelacionado = (typeof HUBS_RELACIONADOS)[number];

/** Clave = valor EXACTO de `blog_posts.category` (no se localiza, es la misma en es/en). */
export const CATEGORIA_A_HUB: Record<string, HubRelacionado | null> = {
  'Inversión': 'como-invertir',
  'Para Inversionistas': 'como-invertir',
  'Guías de compra': 'como-comprar',
  'Legal y fiscal': 'como-comprar',
  'Mercado': 'mercado',
  'Para Asesores': 'brokers',
  // Sin hub por decisión explícita — no es un olvido.
  'Estilo de vida': null,
  // Categoría creada 2026-07-29 para el contenido de arquitectura y diseño de
  // vivienda (autor por defecto: Pablo Toral). Sin hub, por el mismo criterio
  // que "Estilo de vida": es contenido editorial, no una etapa del embudo de
  // compra. Si se decide colgarla de /como-comprar, es cambiar este valor.
  'Arquitectura y diseño': null,
};

/** Clave i18n del texto de enlace, en el namespace `hubRelacionado`. */
export const HUB_LABEL_KEY: Record<HubRelacionado, string> = {
  'como-invertir': 'comoInvertir',
  financiamiento: 'financiamiento',
  'como-comprar': 'comoComprar',
  mercado: 'mercado',
  brokers: 'brokers',
  desarrolladores: 'desarrolladores',
};

/**
 * Hub de una categoría. `null` tanto si la categoría no tiene hub por decisión
 * como si es desconocida — pero la desconocida se registra, porque una categoría
 * nueva sin mapear es un artículo que pierde su enlace sin avisar.
 */
export function hubDeCategoria(category: string): HubRelacionado | null {
  if (!(category in CATEGORIA_A_HUB)) {
    console.warn(
      `[hub-relacionado] categoría "${category}" sin entrada en CATEGORIA_A_HUB — el artículo queda sin enlace a hub. Añádela (o mapéala a null si es deliberado).`
    );
    return null;
  }
  return CATEGORIA_A_HUB[category] ?? null;
}

/** Categorías que alimentan un hub. Vacío = ese hub no tiene artículos que mostrar. */
export function categoriasDeHub(hub: HubRelacionado): string[] {
  return Object.entries(CATEGORIA_A_HUB)
    .filter(([, h]) => h === hub)
    .map(([cat]) => cat);
}

export function hubHref(locale: string, hub: HubRelacionado): string {
  return `/${locale}/${hub}`;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/blog/hub-relacionado.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Renombrar el namespace i18n**

En `src/i18n/messages/es.json` y `src/i18n/messages/en.json`, renombrar la clave de nivel raíz `"pilares"` a `"hubRelacionado"`. El contenido no cambia. En es.json queda:

```json
"hubRelacionado": {
  "comoInvertir": "Cómo invertir en bienes raíces en México",
  "financiamiento": "Opciones de financiamiento en México",
  "comoComprar": "Cómo comprar propiedad en México",
  "mercado": "Inteligencia de mercado inmobiliario",
  "brokers": "Para brokers y agencias inmobiliarias",
  "desarrolladores": "Comercialización de desarrollos inmobiliarios"
}
```

En `en.json` se renombra la clave conservando sus valores en inglés tal como están.

- [ ] **Step 6: Actualizar los consumidores**

En `src/app/[locale]/blog/[slug]/page.tsx`:
- línea 13: `import { hubDeCategoria, hubHref, HUB_LABEL_KEY } from '@/lib/blog/hub-relacionado';`
- línea 139: `getTranslations({ locale, namespace: 'hubRelacionado' }),`
- línea 135: renombrar la variable desestructurada `tPilar` → `tHub`
- línea 161: `const hub = hubDeCategoria(post.category);`
- líneas 307 y 310 y cualquier otro uso de `pilar` en ese bloque JSX: `href={hubHref(locale, hub)}` y `{tHub(HUB_LABEL_KEY[hub] as 'comoInvertir')}`. Renombrar también la guarda que envuelve el bloque (era `pilar &&`).

En `src/components/blog/PilarArticlesSection.tsx`:
- línea 4: `import { categoriasDeHub, type HubRelacionado } from '@/lib/blog/hub-relacionado';`
- el prop `pilar: Pilar` pasa a `hub: HubRelacionado`
- línea 28: `const categories = categoriasDeHub(hub);`
- línea 52: `console.error(\`[PilarArticlesSection] ${hub}:\`, error);`

En los tres hubs viejos, cambiar el nombre del prop:
- `src/app/[locale]/brokers/page.tsx:134` → `<PilarArticlesSection locale={locale} hub="brokers" />`
- `src/app/[locale]/como-comprar/page.tsx:220` → `<PilarArticlesSection locale={locale} hub="como-comprar" />`
- `src/app/[locale]/como-invertir/page.tsx:289` → `<PilarArticlesSection locale={locale} hub="como-invertir" />`

- [ ] **Step 7: Borrar los archivos viejos**

```bash
git rm src/lib/blog/pilares.ts src/lib/blog/pilares.test.ts
```

- [ ] **Step 8: Verificar que nada quedó apuntando al módulo viejo**

Run: `grep -rn "blog/pilares\|pilarDeCategoria\|categoriasDePilar\|CATEGORIA_A_PILAR\|PILAR_LABEL_KEY\|namespace: 'pilares'" src`
Expected: sin resultados.

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run test:unit`
Expected: PASS, toda la suite.

- [ ] **Step 9: Commit**

```bash
git add -A src/lib/blog src/components/blog src/app/\[locale\]/blog src/app/\[locale\]/brokers src/app/\[locale\]/como-comprar src/app/\[locale\]/como-invertir src/i18n/messages
git commit -m "refactor(blog): el mapa por categoría se llama hub-relacionado, no pilares

Libera el nombre 'pilar' para la taxonomía canónica del maestro (P1..P7). Son
dos preguntas distintas: a qué pilar pertenece una pieza, y en qué hub tiene
sentido mostrarla. Sin cambio de comportamiento: el test mudado conserva sus
expectativas."
```

---

## Task 2: Catálogo canónico de pilares

**Files:**
- Create: `src/lib/blog/pilares.ts`, `src/lib/blog/pilares.test.ts`
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/blog/pilares.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PILARES, PILAR_CODES, AUDIENCIAS,
  pilarPorCodigo, pilarPorSlug, esAudiencia, esPilarCode, pilarHubHref,
} from './pilares';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';

describe('catálogo canónico de pilares', () => {
  it('tiene los siete pilares del maestro', () => {
    expect(PILARES).toHaveLength(7);
    expect(PILARES.map((p) => p.code)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
  });

  it('códigos y slugs son únicos', () => {
    expect(new Set(PILARES.map((p) => p.code)).size).toBe(7);
    expect(new Set(PILARES.map((p) => p.slug)).size).toBe(7);
  });

  it('PILAR_CODES cubre exactamente los códigos del catálogo', () => {
    expect([...PILAR_CODES].sort()).toEqual(PILARES.map((p) => p.code).sort());
  });

  it('resuelve por código y por slug, y da null a lo desconocido', () => {
    expect(pilarPorCodigo('P1')?.slug).toBe('fiscal-legal');
    expect(pilarPorSlug('fiscal-legal')?.code).toBe('P1');
    expect(pilarPorCodigo('P9')).toBeNull();
    expect(pilarPorSlug('inventado')).toBeNull();
    // El slug NO es el código: pasar uno donde va el otro no debe colar.
    expect(pilarPorSlug('P1')).toBeNull();
    expect(pilarPorCodigo('fiscal-legal')).toBeNull();
  });

  it('el roundtrip código↔slug cierra para los siete', () => {
    for (const p of PILARES) {
      expect(pilarPorSlug(p.slug)?.code).toBe(p.code);
      expect(pilarPorCodigo(p.code)?.slug).toBe(p.slug);
    }
  });

  it('P7 tiene dos hubs (asesores y desarrolladores); el resto uno', () => {
    for (const p of PILARES) {
      expect(p.hubs.length).toBe(p.code === 'P7' ? 2 : 1);
    }
    expect(pilarPorCodigo('P7')?.hubs).toEqual(['/brokers', '/desarrolladores']);
  });

  it('los hubs son rutas relativas sin prefijo de locale', () => {
    for (const p of PILARES) {
      for (const h of p.hubs) {
        expect(h.startsWith('/')).toBe(true);
        expect(h).not.toMatch(/^\/(es|en)\//);
      }
    }
  });

  it('los dos hubs que este trabajo construye están declarados', () => {
    expect(pilarPorCodigo('P1')?.hubs).toEqual(['/guias/fiscal-legal']);
    expect(pilarPorCodigo('P6')?.hubs).toEqual(['/guias/costa']);
  });

  it('toda audiencia del catálogo está en AUDIENCIAS', () => {
    for (const p of PILARES) expect(AUDIENCIAS).toContain(p.audiencia);
  });

  it('el reparto de audiencia es el acordado: solo P7 es de asesores', () => {
    const asesores = PILARES.filter((p) => p.audiencia === 'asesores').map((p) => p.code);
    expect(asesores).toEqual(['P7']);
  });

  it('los guards discriminan', () => {
    expect(esAudiencia('asesores')).toBe(true);
    expect(esAudiencia('Asesores')).toBe(false);
    expect(esAudiencia('')).toBe(false);
    expect(esPilarCode('P1')).toBe(true);
    expect(esPilarCode('P8')).toBe(false);
  });

  it('pilarHubHref prefija el locale al hub primario', () => {
    expect(pilarHubHref('es', pilarPorCodigo('P1')!)).toBe('/es/guias/fiscal-legal');
    expect(pilarHubHref('en', pilarPorCodigo('P6')!)).toBe('/en/guias/costa');
    expect(pilarHubHref('es', pilarPorCodigo('P7')!)).toBe('/es/brokers');
  });

  it('todo pilar tiene label en español Y en inglés', () => {
    // Hay 2 posts publicados en `en`: un catálogo con labels solo en español
    // haría que el filtro de /en/blog saliera en español.
    for (const p of PILARES) {
      expect((es.pilares as Record<string, string>)[p.code]).toBeTruthy();
      expect((en.pilares as Record<string, string>)[p.code]).toBeTruthy();
    }
  });

  it('toda audiencia tiene label en español Y en inglés', () => {
    for (const a of AUDIENCIAS) {
      expect((es.audiencias as Record<string, string>)[a]).toBeTruthy();
      expect((en.audiencias as Record<string, string>)[a]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/blog/pilares.test.ts`
Expected: FAIL — `Failed to resolve import "./pilares"` (se borró en Task 1).

- [ ] **Step 3: Escribir el catálogo**

Crear `src/lib/blog/pilares.ts`:

```ts
/**
 * Catálogo canónico de pilares editoriales (P1..P7).
 *
 * Fuente de verdad: `docs-editorial/07_Sistema-Pilares_MAESTRO_corte-30jul2026.md` §3.
 * El Hub empareja briefs por `code` y guarda el destino en `blog_briefs.pillar_url`,
 * así que el CÓDIGO es el identificador estable — no el slug, no el label.
 *
 * NO confundir con `hub-relacionado.ts`. Ese mapa responde "¿en qué hub muestro
 * esta pieza?" (afinidad de superficie, muchos a muchos). Este responde "¿a qué
 * pilar PERTENECE?" (taxonomía, uno a uno, guardada en `blog_posts.pilar`).
 *
 * Módulo neutro SIN 'use client' a propósito: importado desde un módulo
 * 'use client', Next 16 RSC convierte el const en proxy function en el server y
 * `===` devuelve siempre false. Mismo motivo que documenta
 * `src/components/blog/categories.ts`.
 *
 * La BD guarda `code`; la URL lleva `slug`. Así `?pilar=fiscal-legal` es legible
 * y neutro al idioma, en vez de repetir el `?categoria=Para%20Inversionistas`
 * (label con espacio, atado al español).
 *
 * P8 (Relocación y Vida) está diferido a fase 2 por el maestro: no se declara.
 */

export const AUDIENCIAS = ['inversionistas', 'asesores'] as const;
export type Audiencia = (typeof AUDIENCIAS)[number];

export const PILAR_CODES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] as const;
export type PilarCode = (typeof PILAR_CODES)[number];

export interface Pilar {
  /** Código canónico del maestro. Es lo que se guarda en `blog_posts.pilar`. */
  readonly code: PilarCode;
  /** Lo que viaja en `?pilar=`. Legible y estable. */
  readonly slug: string;
  /** Hubs del pilar, sin prefijo de locale. El primero es el primario. */
  readonly hubs: readonly string[];
  /**
   * Audiencia por defecto al clasificar una pieza de este pilar. La columna
   * `blog_posts.audiencia` manda si difiere: P7-03 ("cerrar con comprador
   * extranjero") es de asesor y a la vez muy fiscal.
   */
  readonly audiencia: Audiencia;
}

export const PILARES: readonly Pilar[] = [
  { code: 'P1', slug: 'fiscal-legal',   hubs: ['/guias/fiscal-legal'],          audiencia: 'inversionistas' },
  { code: 'P2', slug: 'proceso-compra', hubs: ['/como-comprar'],                audiencia: 'inversionistas' },
  { code: 'P3', slug: 'inversion-roi',  hubs: ['/como-invertir'],               audiencia: 'inversionistas' },
  { code: 'P4', slug: 'financiamiento', hubs: ['/financiamiento'],              audiencia: 'inversionistas' },
  { code: 'P5', slug: 'mercado-zonas',  hubs: ['/mercado'],                     audiencia: 'inversionistas' },
  { code: 'P6', slug: 'costa-branded',  hubs: ['/guias/costa'],                 audiencia: 'inversionistas' },
  { code: 'P7', slug: 'canal',          hubs: ['/brokers', '/desarrolladores'], audiencia: 'asesores' },
] as const;

export function esPilarCode(v: string): v is PilarCode {
  return (PILAR_CODES as readonly string[]).includes(v);
}

export function esAudiencia(v: string): v is Audiencia {
  return (AUDIENCIAS as readonly string[]).includes(v);
}

/** Pilar por código canónico (`P1`). `null` si no existe. */
export function pilarPorCodigo(code: string): Pilar | null {
  return PILARES.find((p) => p.code === code) ?? null;
}

/** Pilar por slug de URL (`fiscal-legal`). `null` si no existe. */
export function pilarPorSlug(slug: string): Pilar | null {
  return PILARES.find((p) => p.slug === slug) ?? null;
}

/** URL del hub primario del pilar, con locale. */
export function pilarHubHref(locale: string, pilar: Pilar): string {
  return `/${locale}${pilar.hubs[0]}`;
}
```

- [ ] **Step 4: Añadir los labels a los messages**

En `src/i18n/messages/es.json`, añadir dos namespaces de nivel raíz:

```json
"pilares": {
  "P1": "Fiscal y legal",
  "P2": "Proceso de compra",
  "P3": "Inversión, ROI y renta",
  "P4": "Financiamiento",
  "P5": "Mercado y zonas",
  "P6": "Costa y branded residences",
  "P7": "Asesores y desarrolladores"
},
"audiencias": {
  "inversionistas": "Para inversionistas",
  "asesores": "Para asesores"
}
```

En `src/i18n/messages/en.json`:

```json
"pilares": {
  "P1": "Tax and legal",
  "P2": "The buying process",
  "P3": "Investment, ROI and rental",
  "P4": "Financing",
  "P5": "Market and areas",
  "P6": "Beachfront and branded residences",
  "P7": "Brokers and developers"
},
"audiencias": {
  "inversionistas": "For investors",
  "asesores": "For brokers"
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/blog/pilares.test.ts`
Expected: PASS, 14 tests.

Si falla el import de JSON con `resolveJsonModule`, comprobar `tsconfig.json`; el repo ya importa messages en `src/i18n/`, así que debería resolver. Si vitest no resuelve el alias `@/`, usar la ruta relativa `../../i18n/messages/es.json`.

- [ ] **Step 6: Verificar tipos y commit**

Run: `npx tsc --noEmit`
Expected: sin errores.

```bash
git add src/lib/blog/pilares.ts src/lib/blog/pilares.test.ts src/i18n/messages
git commit -m "feat(blog): catálogo canónico de los siete pilares del maestro

La BD guardará el código (P1..P7) y la URL llevará el slug, para no repetir el
?categoria=Para%20Inversionistas atado al español. Los labels van en messages
es/en porque hay 2 posts publicados en inglés."
```

---

## Task 3: `blogHref` con `?pilar=` y `?audiencia=`

**Files:**
- Modify: `src/lib/blog/blog-urls.ts`
- Create: `src/lib/blog/blog-urls.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/blog/blog-urls.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  blogHref,
  BLOG_PAGE_PARAM, BLOG_CATEGORY_PARAM, BLOG_PILAR_PARAM, BLOG_AUDIENCIA_PARAM,
} from './blog-urls';

describe('blogHref', () => {
  it('sin estado devuelve el listado limpio', () => {
    expect(blogHref('es')).toBe('/es/blog');
    expect(blogHref('en')).toBe('/en/blog');
  });

  it('omite la página 1 — /blog y /blog?pagina=1 serían dos URLs del mismo contenido', () => {
    expect(blogHref('es', { page: 1 })).toBe('/es/blog');
    expect(blogHref('es', { page: 2 })).toBe('/es/blog?pagina=2');
  });

  it('conserva el comportamiento de categoría', () => {
    expect(blogHref('es', { category: 'Para Asesores' })).toBe('/es/blog?categoria=Para+Asesores');
  });

  it('añade pilar y audiencia', () => {
    expect(blogHref('es', { pilar: 'fiscal-legal' })).toBe('/es/blog?pilar=fiscal-legal');
    expect(blogHref('es', { audiencia: 'asesores' })).toBe('/es/blog?audiencia=asesores');
  });

  it('el orden de params es estable: categoria, pilar, audiencia, pagina', () => {
    // El canonical de una vista tiene que ser byte-idéntico a su propio href.
    const href = blogHref('es', {
      page: 3, audiencia: 'inversionistas', pilar: 'mercado-zonas', category: 'Mercado',
    });
    expect(href).toBe('/es/blog?categoria=Mercado&pilar=mercado-zonas&audiencia=inversionistas&pagina=3');
  });

  it('combina pilar y audiencia sin categoría', () => {
    expect(blogHref('es', { pilar: 'fiscal-legal', audiencia: 'inversionistas' }))
      .toBe('/es/blog?pilar=fiscal-legal&audiencia=inversionistas');
  });

  it('null, undefined y cadena vacía no emiten param', () => {
    expect(blogHref('es', { category: null, pilar: undefined, audiencia: '', page: null })).toBe('/es/blog');
  });

  it('los nombres de param están exportados en un solo lugar', () => {
    expect(BLOG_CATEGORY_PARAM).toBe('categoria');
    expect(BLOG_PILAR_PARAM).toBe('pilar');
    expect(BLOG_AUDIENCIA_PARAM).toBe('audiencia');
    expect(BLOG_PAGE_PARAM).toBe('pagina');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/lib/blog/blog-urls.test.ts`
Expected: FAIL — no existe el export `BLOG_PILAR_PARAM`.

- [ ] **Step 3: Extender el builder**

Reemplazar el contenido de `src/lib/blog/blog-urls.ts`:

```ts
/**
 * Nombres de los query params del blog y constructor de URLs, en un solo lugar.
 *
 * Antes cada consumidor escribía el literal: la paginación y el filtro usaban
 * 'pagina'/'categoria' a mano, y la auditoría de julio-2026 probó `?page=2`
 * (nombre en inglés) y obtuvo un 200 con la página 1 — un tope escrito dos veces
 * falla en silencio. Con el builder, cambiar un nombre de param mueve
 * paginación, filtro, canonical y hreflang a la vez.
 */

export const BLOG_PAGE_PARAM = 'pagina';
export const BLOG_CATEGORY_PARAM = 'categoria';
export const BLOG_PILAR_PARAM = 'pilar';
export const BLOG_AUDIENCIA_PARAM = 'audiencia';

export interface BlogUrlState {
  category?: string | null;
  /** SLUG del pilar (`fiscal-legal`), no el código (`P1`). Ver `lib/blog/pilares.ts`. */
  pilar?: string | null;
  audiencia?: string | null;
  /** 1 se omite de la URL: `/blog` y `/blog?pagina=1` serían dos URLs del mismo contenido. */
  page?: number | null;
}

/**
 * Ruta relativa del listado de blog para un estado dado. Determinista y con
 * orden de params estable (categoría, pilar, audiencia, página) para que el
 * canonical de una vista sea siempre byte-idéntico a su propio href.
 */
export function blogHref(locale: string, state: BlogUrlState = {}): string {
  const params = new URLSearchParams();
  if (state.category) params.set(BLOG_CATEGORY_PARAM, state.category);
  if (state.pilar) params.set(BLOG_PILAR_PARAM, state.pilar);
  if (state.audiencia) params.set(BLOG_AUDIENCIA_PARAM, state.audiencia);
  if (state.page && state.page > 1) params.set(BLOG_PAGE_PARAM, String(state.page));
  const qs = params.toString();
  return `/${locale}/blog${qs ? `?${qs}` : ''}`;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/lib/blog/blog-urls.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog/blog-urls.ts src/lib/blog/blog-urls.test.ts
git commit -m "feat(blog): blogHref acepta pilar y audiencia con orden estable

Primer test del builder: no tenía ninguno, y es el módulo que existe justo
porque un nombre de param escrito dos veces ya falló en silencio."
```

---

## Task 4: `PilarArticles` recibe `viewAllHref`

El módulo derivaba el "Ver todos" de `categories[0]`. Los hubs nuevos filtran por pilar, no por categoría, así que el href lo calcula quien llama. Un solo componente para los dos ejes.

**Files:**
- Modify: `src/components/blog/PilarArticles.tsx:8-14,24,32-39`, `src/components/blog/PilarArticlesSection.tsx:38-63`

- [ ] **Step 1: Cambiar la interfaz del componente**

En `src/components/blog/PilarArticles.tsx`, reemplazar la interfaz y la firma:

```tsx
interface PilarArticlesProps {
  locale: string;
  posts: BlogPost[];
  /**
   * Destino del "Ver todos". Lo calcula quien llama porque los dos ejes filtran
   * distinto: los hubs viejos por `?categoria=`, los nuevos por `?pilar=`.
   * `null` esconde el enlace.
   */
  viewAllHref: string | null;
  t: { title: string; minRead: string; viewAll: string };
}

export default function PilarArticles({ locale, posts, viewAllHref, t }: PilarArticlesProps) {
```

Y el bloque del enlace (líneas 32-39) pasa a:

```tsx
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7490] hover:underline"
            >
              {t.viewAll} <ArrowRight size={15} />
            </Link>
          )}
```

El `import { blogHref } from '@/lib/blog/blog-urls';` de la línea 6 ya no se usa en este archivo: borrarlo.

- [ ] **Step 2: Actualizar `PilarArticlesSection` para calcular el href**

En `src/components/blog/PilarArticlesSection.tsx`, añadir el import y pasar el href:

```tsx
import { blogHref } from '@/lib/blog/blog-urls';
```

y en el `return`:

```tsx
  return (
    <PilarArticles
      locale={locale}
      posts={data.posts}
      viewAllHref={categories.length > 0 ? blogHref(locale, { category: categories[0] }) : null}
      t={data.labels}
    />
  );
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores. Si aparece un error en `PilarArticles` por `categories`, quedó un uso sin migrar.

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/blog/PilarArticles.tsx src/components/blog/PilarArticlesSection.tsx
git commit -m "refactor(blog): PilarArticles recibe viewAllHref en vez de derivarlo

Los hubs nuevos filtran por ?pilar= y los viejos por ?categoria=. Calcular el
href en quien llama deja un solo componente sirviendo a los dos ejes."
```

---

## Task 5: Migración de esquema y datos — REQUIERE AUTORIZACIÓN

**PARAR AQUÍ.** Es escritura en la base de producción (`oaijxdpevakashxshhvm`). No ejecutar nada de este task sin autorización explícita de Luis en el momento, con los conteos a la vista.

**Files:**
- Create: `scripts/sql/2026-08-04-pilar-audiencia.sql` (queda en el repo como registro de lo ejecutado)

- [ ] **Step 1: Escribir el SQL completo**

Crear `scripts/sql/2026-08-04-pilar-audiencia.sql`:

```sql
-- Taxonomía canónica de pilares en blog_posts.
-- Fuente: docs-editorial/07_Sistema-Pilares_MAESTRO_corte-30jul2026.md §4-§10.
-- Cierra los bloqueos #7 y #8 de su §14.
--
-- Nullable y sin default a propósito: NULL = "sin clasificar", que es honesto.
-- Un default metería cada fila nueva en un pilar que nadie eligió.

alter table public.blog_posts
  add column if not exists pilar text,
  add column if not exists audiencia text;

alter table public.blog_posts
  add constraint blog_posts_pilar_chk
    check (pilar is null or pilar in ('P1','P2','P3','P4','P5','P6','P7')),
  add constraint blog_posts_audiencia_chk
    check (audiencia is null or audiencia in ('asesores','inversionistas'));

create index if not exists blog_posts_pilar_idx
  on public.blog_posts (pilar) where deleted_at is null;
create index if not exists blog_posts_audiencia_idx
  on public.blog_posts (audiencia) where deleted_at is null;

-- Reparto de las 21 filas vivas. Clave compuesta (slug, locale): tres slugs
-- existen en los dos locales. Un solo statement, atómico, y el row count dice
-- si las 21 hicieron match.
update public.blog_posts p
set pilar = v.pilar, audiencia = v.audiencia
from (values
  -- P1 · Fiscal y Legal (13)
  ('isr-venta-propiedad-extranjero-mexico',              'es', 'P1', 'inversionistas'), -- P1-01
  ('isr-venta-propiedad-extranjero-mexico',              'en', 'P1', 'inversionistas'), -- P1-01
  ('isai-quintana-roo-yucatan-2026',                     'es', 'P1', 'inversionistas'), -- P1-02 canónico
  ('isai-isabi-2026-quintana-roo-yucatan-1785879240440', 'es', 'P1', 'inversionistas'), -- P1-02 duplicado
  ('isai-isabi-2026-quintana-roo-yucatan-1785879299776', 'es', 'P1', 'inversionistas'), -- P1-02 duplicado (el brief apunta aquí)
  ('fiscal-legalcfdi-compra-inmueble',                   'es', 'P1', 'inversionistas'), -- P1-03
  ('rfc-extranjero-curp-biometrica-2026',                'es', 'P1', 'inversionistas'), -- P1-04
  ('fideicomiso-extranjeros-guia-2026',                  'es', 'P1', 'inversionistas'), -- P1-05
  ('fideicomiso-extranjeros-guia-2026',                  'en', 'P1', 'inversionistas'), -- P1-05
  ('residencia-comprar-mexico-playa-del-carmen',         'es', 'P1', 'inversionistas'), -- P1-06
  ('ejido-vs-propiedad-privada-tulum',                   'es', 'P1', 'inversionistas'), -- P1-07
  ('ejido-vs-propiedad-privada-tulum',                   'en', 'P1', 'inversionistas'), -- P1-07
  ('due-diligence-inmuebles-mexico-17-puntos',           'es', 'P1', 'inversionistas'), -- P1-08
  -- P5 · Mercado y Zonas (5). Las tres marcadas ← son el bloqueo #8: están como
  -- "Estilo de vida" y son Mercado. Se les mueve el PILAR, no la categoría.
  ('guia-inversion-tulum-precios-zonas-plusvalia',       'es', 'P5', 'inversionistas'), -- P5-01
  ('tulum-correccion-2025-2026',                         'es', 'P5', 'inversionistas'), -- P5-02 ← bloqueo #8
  ('playa-del-carmen-inversion-2026',                    'es', 'P5', 'inversionistas'), -- P5-03 ← bloqueo #8
  ('cancun-zona-residencial-lujo',                       'es', 'P5', 'inversionistas'), -- P5-04 ← bloqueo #8
  ('caribbean-pulse-reporte-trimestral-riviera-maya',    'es', 'P5', 'inversionistas'), -- P5-10
  -- P7 · Canal (3)
  ('que-es-un-master-broker-inmobiliario',               'es', 'P7', 'asesores'),       -- P7-01
  ('compartir-comision-sin-que-te-brinquen',             'es', 'P7', 'asesores'),       -- P7-02
  ('cerrar-con-comprador-extranjero',                    'es', 'P7', 'asesores')        -- P7-03
) as v(slug, locale, pilar, audiencia)
where p.slug = v.slug and p.locale = v.locale and p.deleted_at is null;
```

- [ ] **Step 2: Correr el conteo ANTES y enseñárselo a Luis**

Con el MCP de Supabase (`project_id: oaijxdpevakashxshhvm`):

```sql
select
  count(*) filter (where deleted_at is null)                          as vivas,
  count(*) filter (where deleted_at is not null)                      as papelera,
  count(*) filter (where deleted_at is null and status = 'published') as publicadas
from public.blog_posts;
```

Expected: `vivas=21, papelera=8, publicadas=5`.

**Si estos números no cuadran, PARAR:** significa que la BD cambió desde la medición del 2026-08-04 y el reparto de 21 filas del Step 1 ya no describe la realidad. Volver a medir antes de escribir.

- [ ] **Step 3: Pedir autorización explícita**

Mostrar a Luis: el conteo del Step 2, el reparto esperado (P1=13, P5=5, P7=3; inversionistas=18, asesores=3) y el SQL del Step 1. Esperar un sí explícito. No continuar sin él.

- [ ] **Step 4: Ejecutar el DDL**

Ejecutar la primera mitad del archivo (los tres `alter`/`create index`) con `apply_migration`, nombre `2026-08-04-pilar-audiencia`.

- [ ] **Step 5: Ejecutar el UPDATE y verificar el row count**

Ejecutar el `update` con `execute_sql`.
Expected: **21 filas afectadas**. Si son menos, algún slug no hizo match: no seguir, comparar contra la BD antes de reintentar.

- [ ] **Step 6: Correr el conteo DESPUÉS**

```sql
select pilar, audiencia, count(*)
from public.blog_posts
where deleted_at is null
group by pilar, audiencia
order by pilar, audiencia;

select count(*) as vivas_sin_clasificar
from public.blog_posts
where deleted_at is null and pilar is null;
```

Expected: `P1/inversionistas=13`, `P5/inversionistas=5`, `P7/asesores=3`, y `vivas_sin_clasificar=0`.

- [ ] **Step 7: Commit del registro**

```bash
git add scripts/sql/2026-08-04-pilar-audiencia.sql
git commit -m "chore(sql): registro de la migración de pilar y audiencia

21 filas vivas clasificadas por los códigos canónicos del maestro. Cierra el
bloqueo #8: Tulum, Playa y Cancún pasan a P5 sin tocarles la categoría, que es
el eje que gobierna UI viva. Las 8 filas en papelera quedan en NULL."
```

---

## Task 6: Queries por pilar y audiencia

**Files:**
- Modify: `src/lib/supabase/queries.ts:2410-2432` (tipo), `:2434-2439` (select), `:2451-2479` (`getBlogPosts`), `:2529-2548` (añadir `getBlogPilares` justo después de `getBlogCategories`)

- [ ] **Step 1: Añadir las columnas al tipo y al select**

En `BlogPost` (después de `noindex`, línea 2431):

```ts
  /** Pilar canónico (`P1..P7`) o null si nadie la clasificó. Ver lib/blog/pilares.ts. */
  pilar: string | null;
  audiencia: string | null;
```

Y `BLOG_SELECT` pasa a:

```ts
const BLOG_SELECT = `
  id, slug, locale, status, title, excerpt, content, category, tags,
  featured_image, author_name, author_image, read_time_min,
  meta_title, meta_description, related_city, published_at, created_at, updated_at,
  noindex, pilar, audiencia
`.trim();
```

- [ ] **Step 2: Extender `getBlogPosts`**

Reemplazar la firma y añadir los dos filtros:

```ts
export async function getBlogPosts(
  c: Client,
  opts: {
    locale?: string; category?: string; categories?: string[];
    /** CÓDIGO del pilar (`P1`), no el slug. La traducción slug→código la hace quien llama. */
    pilar?: string;
    audiencia?: string;
    limit?: number; page?: number;
  } = {}
): Promise<{ posts: BlogPost[]; total: number }> {
  const { locale = 'es', category, categories, pilar, audiencia, limit = 9, page = 1 } = opts;
```

y después del bloque de categoría (línea 2474):

```ts
  if (category) q = q.eq('category', category);
  else if (categories && categories.length) q = q.in('category', categories);

  // Los dos ejes son independientes y combinables: `pilar` es la taxonomía
  // canónica, `category` la afinidad de superficie.
  if (pilar) q = q.eq('pilar', pilar);
  if (audiencia) q = q.eq('audiencia', audiencia);
```

- [ ] **Step 3: Añadir `getBlogPilares`**

Justo después de `getBlogCategories` (línea 2548), mismo patrón:

```ts
/**
 * Códigos de pilar con al menos un post visible en este locale.
 *
 * Deriva de lo publicado, igual que `getBlogCategories`: un chip que lleva a una
 * vista vacía es un filtro muerto y una URL indexable sin contenido. Hoy devuelve
 * un solo pilar (P1) porque los 3 posts publicados en `es` son de P1 — es el
 * estado real, no un error.
 *
 * Excluye NULL explícitamente: las columnas se añadieron nullable, así que una
 * fila sin clasificar no debe inventar un chip vacío.
 */
export async function getBlogPilares(c: Client, locale: string): Promise<string[]> {
  let q = c
    .from('blog_posts')
    .select('pilar')
    .is('deleted_at', null)
    .not('pilar', 'is', null)
    .eq('locale', locale)
    .order('pilar');

  if (includeStaged) {
    q = q.in('status', ['published', 'staged']);
  } else {
    q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
  }

  const { data, error } = await q;
  if (error) { console.error('[getBlogPilares]', error.message); return []; }
  const seen = new Set<string>();
  (data ?? []).forEach((r: { pilar: string }) => seen.add(r.pilar));
  return Array.from(seen);
}
```

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run test:unit`
Expected: PASS.

Nota: estas funciones no tienen test unitario porque toda la suite del repo es pura y estas piden BD. Se verifican en Task 12 con click-through real.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/queries.ts
git commit -m "feat(blog): getBlogPosts filtra por pilar y audiencia; getBlogPilares

getBlogPilares excluye NULL explícitamente: las columnas son nullable y una
fila sin clasificar no debe producir un chip que lleve a una vista vacía."
```

---

## Task 7: Módulo de artículos por pilar canónico

**Files:**
- Create: `src/components/blog/ArticulosDePilar.tsx`

- [ ] **Step 1: Crear el componente**

Mismo patrón que `PilarArticlesSection` (cookie-less para no romper ISR, fail-soft), pero por el eje canónico:

```tsx
import { getTranslations } from 'next-intl/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { getBlogPosts, type BlogPost } from '@/lib/supabase/queries';
import { blogHref } from '@/lib/blog/blog-urls';
import { pilarPorCodigo, type PilarCode } from '@/lib/blog/pilares';
import PilarArticles from './PilarArticles';

type PilarLabels = { title: string; minRead: string; viewAll: string };

/**
 * Artículos de un pilar CANÓNICO (`blog_posts.pilar`), para los hubs nuevos.
 *
 * El hermano `PilarArticlesSection` resuelve el otro eje (afinidad por
 * categoría) y sirve a los hubs viejos. Ver `lib/blog/pilares.ts` vs
 * `lib/blog/hub-relacionado.ts`.
 *
 * `createPublicSupabaseClient` (cookie-less) para no volver dinámica por request
 * la página que lo incluye. Fail-soft: cualquier error deja la sección fuera y
 * nunca tumba el hub.
 */
export default async function ArticulosDePilar({
  locale,
  code,
  limit = 6,
}: {
  locale: string;
  code: PilarCode;
  limit?: number;
}) {
  const pilar = pilarPorCodigo(code);
  if (!pilar) return null;

  let data: { posts: BlogPost[]; labels: PilarLabels } | null = null;
  try {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const [{ posts }, t] = await Promise.all([
        getBlogPosts(supabase, { locale, pilar: code, limit, page: 1 }),
        getTranslations({ locale, namespace: 'blog' }),
      ]);
      data = {
        posts,
        labels: {
          title: t('pilarArticlesTitle'),
          minRead: t('minRead'),
          viewAll: t('pilarViewAll'),
        },
      };
    }
  } catch (error) {
    console.error(`[ArticulosDePilar] ${code}:`, error);
  }

  if (!data) return null;

  return (
    <PilarArticles
      locale={locale}
      posts={data.posts}
      viewAllHref={blogHref(locale, { pilar: pilar.slug })}
      t={data.labels}
    />
  );
}
```

- [ ] **Step 2: Verificar tipos y commit**

Run: `npx tsc --noEmit`
Expected: sin errores.

```bash
git add src/components/blog/ArticulosDePilar.tsx
git commit -m "feat(blog): módulo de artículos por pilar canónico para los hubs nuevos"
```

---

## Task 8: Hub P1 — `/es/guias/fiscal-legal`

Índice curado. No emite ninguna afirmación fiscal nueva, así que no necesita revisor YMYL nombrado y no queda bloqueado por el bloqueo #1 (sin fiscalista asignado).

**Files:**
- Create: `src/app/[locale]/guias/fiscal-legal/page.tsx`
- Modify: `src/lib/visibility.ts:52` (añadir keys), `src/i18n/messages/es.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Añadir las keys de visibilidad**

En `src/lib/visibility.ts`, dentro de `VISIBILITY_KEYS`, después de `PAGE_PROMOCIONES`:

```ts
  // Hubs de pilar creados 2026-08-04. NO están registradas en el Hub todavía:
  // `isVisible` es fail-open (`map[key] !== false`), así que una key que el Hub
  // no conoce deja la página VISIBLE. Registrarlas es opcional y posterior.
  PAGE_GUIAS_FISCAL_LEGAL: "page.guias-fiscal-legal",
  PAGE_GUIAS_COSTA: "page.guias-costa",
```

- [ ] **Step 2: Añadir el contenido a los messages**

En `src/i18n/messages/es.json`, namespace nuevo de nivel raíz `guias`:

```json
"guias": {
  "fiscalLegal": {
    "metaTitle": "Guía fiscal y legal para comprar propiedad en México",
    "metaDescription": "Los impuestos, trámites y revisiones legales de una compra inmobiliaria en México, explicados uno por uno y con la ley citada. Punto de partida del pilar fiscal y legal de Propyte.",
    "h1": "Fiscal y legal",
    "intro": "Comprar en México tiene una capa fiscal y una capa legal que casi nadie te explica completas antes de firmar. No es una sola pregunta: es el impuesto que pagas al comprar, el que pagas al vender, los trámites que necesitas como extranjero, y las revisiones que decidan si lo que compras es lo que crees que compras. Esta página ordena esa capa y te manda a la pieza que responde cada cosa.",
    "comoLeerTitle": "En qué orden leerlo",
    "comoLeerBody": "Si estás por comprar, el orden útil es: primero qué impuestos y trámites te toca a ti según tu situación migratoria y fiscal, después qué revisar del inmueble antes de firmar, y al final qué pasa cuando lo vendes o lo heredas. Cada pieza se sostiene sola, así que puedes entrar por la que te aprieta hoy.",
    "avisoTitle": "Sobre las cifras y las citas",
    "avisoBody": "Cada cifra fiscal de este pilar se publica con la disposición que la sostiene: artículo de ley, regla de la Resolución Miscelánea o ley de hacienda municipal, con su fecha. Cuando un dato no se puede sostener con fuente primaria, no se escribe. Nada de esto sustituye la asesoría de un contador o un fiscalista para tu caso concreto.",
    "relacionadosTitle": "Dónde sigue",
    "relacionadosBody": "La capa fiscal no vive sola: el esquema con el que pagas cambia tu costo total, y la zona donde compras cambia tu base gravable.",
    "linkFinanciamiento": "Esquemas de financiamiento",
    "linkComoComprar": "El proceso de compra, paso a paso",
    "linkMercado": "Datos de mercado por zona"
  }
}
```

En `src/i18n/messages/en.json`, la misma estructura con copy propio en inglés (no una traducción literal — el hreflang tiene que apuntar a una página que se sostenga en inglés):

```json
"guias": {
  "fiscalLegal": {
    "metaTitle": "Tax and legal guide to buying property in Mexico",
    "metaDescription": "The taxes, paperwork and legal checks behind a Mexican property purchase, covered one at a time with the statute cited. Entry point to Propyte's tax and legal pillar.",
    "h1": "Tax and legal",
    "intro": "Buying in Mexico carries a tax layer and a legal layer that almost nobody walks you through in full before you sign. It is not one question: it is the tax you pay when you buy, the tax you pay when you sell, the paperwork you need as a foreign buyer, and the checks that decide whether what you are buying is what you think you are buying. This page orders that layer and points you to the piece that answers each part.",
    "comoLeerTitle": "What to read first",
    "comoLeerBody": "If a purchase is close, the useful order is: first which taxes and filings apply to you given your immigration and tax residency, then what to verify about the property before signing, and last what happens when you sell it or pass it on. Each piece stands on its own, so start with whatever is pressing today.",
    "avisoTitle": "About the figures and the citations",
    "avisoBody": "Every tax figure in this pillar is published with the provision behind it: the article of law, the Miscellaneous Tax Resolution rule or the municipal finance act, with its date. When a figure cannot be supported by a primary source, we do not publish it. None of this replaces advice from an accountant or tax lawyer for your specific case.",
    "relacionadosTitle": "Where this continues",
    "relacionadosBody": "The tax layer does not stand alone: the payment scheme you choose changes your total cost, and the area you buy in changes your taxable base.",
    "linkFinanciamiento": "Financing schemes",
    "linkComoComprar": "The buying process, step by step",
    "linkMercado": "Market data by area"
  }
}
```

- [ ] **Step 3: Crear la página**

Crear `src/app/[locale]/guias/fiscal-legal/page.tsx`:

```tsx
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ArticulosDePilar from '@/components/blog/ArticulosDePilar';
import { pilarPorCodigo } from '@/lib/blog/pilares';

/**
 * Hub del pilar P1 (Fiscal y Legal).
 *
 * Carpeta ESTÁTICA a propósito, no un segmento `[pilar]`: así `/es/guias/x` da
 * 404 real por no matchear ruta, en vez de un 200 con el shell. En este sitio
 * las rutas dinámicas flushean shell con 200 antes de resolver `notFound()`.
 *
 * Índice curado: presenta el pilar y manda a sus piezas. NO reexplica ISR, ISAI
 * ni fideicomiso — cada pieza es dueña de su tema, y duplicar aquí sería
 * competirle a su propio hijo por la misma intención. Al no emitir ninguna
 * afirmación fiscal nueva, esta página no necesita revisor YMYL nombrado.
 */

const PILAR = pilarPorCodigo('P1')!;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guias.fiscalLegal' });
  const path = PILAR.hubs[0];

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        es: `/es${path}`,
        en: `/en${path}`,
        'x-default': `/es${path}`,
      },
    },
    openGraph: {
      type: 'website',
      title: `${t('metaTitle')} | Propyte`,
      description: t('metaDescription'),
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function GuiaFiscalLegalPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_FISCAL_LEGAL);

  const [t, tb] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.fiscalLegal' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

  return (
    <>
      <section className="bg-[#1A2F3F] text-white py-14 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t('h1')}</h1>
          <p className="mt-5 max-w-3xl text-base md:text-lg text-white/80 leading-relaxed">
            {t('intro')}
          </p>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={[{ label: t('h1') }]}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />

          <div className="mt-8 grid gap-8 md:grid-cols-2 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-[#1A2F3F]">{t('comoLeerTitle')}</h2>
              <p className="mt-3 text-gray-700 leading-relaxed">{t('comoLeerBody')}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1A2F3F]">{t('avisoTitle')}</h2>
              <p className="mt-3 text-gray-700 leading-relaxed">{t('avisoBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <ArticulosDePilar locale={locale} code="P1" />

      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold text-[#1A2F3F]">{t('relacionadosTitle')}</h2>
          <p className="mt-3 max-w-3xl text-gray-700 leading-relaxed">{t('relacionadosBody')}</p>
          <nav className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/como-comprar`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkComoComprar')}
            </Link>
            <Link href={`/${locale}/financiamiento`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkFinanciamiento')}
            </Link>
            <Link href={`/${locale}/mercado`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkMercado')}
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Verificar tipos y arrancar**

Run: `npx tsc --noEmit`
Expected: sin errores. Si `Breadcrumbs` pide props distintos, copiar la firma exacta de `src/app/[locale]/blog/page.tsx:126-132`.

Run: `npm run dev` y abrir `http://localhost:3000/es/guias/fiscal-legal`
Expected: 200, h1 "Fiscal y legal", los 3 artículos publicados de P1 en el módulo.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/guias/fiscal-legal src/lib/visibility.ts src/i18n/messages
git commit -m "feat(guias): hub del pilar P1 en /guias/fiscal-legal

Mata el 404 del bloqueo #7: los briefs P1-01 y P1-03 ya apuntaban aquí. Índice
curado, sin afirmación fiscal nueva, así que no depende del fiscalista pendiente.
Carpeta estática para que /es/guias/x siga dando 404 real."
```

---

## Task 9: Hub P6 — `/es/guias/costa`

Cero de sus diez piezas existen, así que el hub lleva encuadre propio (~800 palabras) en vez de indexar la nada. El encuadre se queda en nivel panorámico para no canibalizar P6-01, que es la pieza prioritaria del pilar.

**Files:**
- Create: `src/app/[locale]/guias/costa/page.tsx`
- Modify: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Añadir el contenido a los messages**

En `src/i18n/messages/es.json`, dentro del namespace `guias` creado en Task 8:

```json
"costa": {
  "metaTitle": "Comprar frente al mar en México: qué te transmite tu escritura",
  "metaDescription": "La franja de playa es propiedad federal y no se vende. Qué significa entonces 'frente al mar', qué te transmite tu escritura, qué no, y cómo verificarlo tú mismo en fuentes oficiales.",
  "h1": "Costa y branded residences",
  "intro": "\"Frente al mar\" es la promesa más repetida del Caribe mexicano y la menos examinada. Detrás hay una capa legal concreta que decide qué compras exactamente, y que casi no está escrita para compradores: la franja de arena no es del desarrollo, no se vende, y tu escritura no te la transmite. Esta página explica el marco y te dice qué puedes verificar por tu cuenta antes de firmar.",
  "zofematTitle": "La franja de playa no se vende",
  "zofematBody": "La Zona Federal Marítimo Terrestre —la ZOFEMAT— es la faja de veinte metros de ancho contigua a la playa. Es bien del dominio público de la Federación: inalienable e imprescriptible. Eso significa que nadie te la puede vender y nadie la puede adquirir por el paso del tiempo. Lo que existe sobre ella son concesiones: permisos temporales que la Federación otorga para usarla, con vigencia, obligaciones y causas de terminación.",
  "escrituraTitle": "Lo que sí te transmite tu escritura",
  "escrituraBody": "Tu escritura transmite el lote que colinda con la franja federal, no la franja. Son dos cosas distintas con dos títulos distintos, y una no arrastra a la otra: la compraventa del lote no te cede la concesión de la ZOFEMAT contigua. Cuando un proyecto ofrece acceso, palapa, camastros o club de playa sobre esa franja, lo que hay detrás —si está en regla— es una concesión a nombre de alguien, con una vigencia que se vence. La pregunta útil no es si el desarrollo tiene playa, sino a nombre de quién está la concesión, hasta cuándo, y qué pasa contigo cuando venza.",
  "verificarTitle": "Cómo verificarlo tú mismo",
  "verificarBody": "SEMARNAT publica los títulos de concesión de ZOFEMAT en su apartado de transparencia focalizada. Eso convierte \"verifícalo tú mismo\" en un paso real y no en un consejo vacío: puedes buscar si existe concesión para el predio que te interesa, a nombre de quién está y con qué vigencia, antes de firmar cualquier cosa. Si un vendedor no puede decirte el número de título y su vencimiento, eso ya es información.",
  "extranjeroTitle": "Si eres extranjero, son dos trámites, no uno",
  "extranjeroBody": "Comprar en la zona restringida —los cincuenta kilómetros de costa— se resuelve con un fideicomiso ante una institución bancaria mexicana. La concesión de ZOFEMAT es otra cosa, con su propio régimen. Tener fideicomiso no te da concesión, y tener concesión no sustituye al fideicomiso. Confundirlos es el error más común de esta capa, y se paga tarde.",
  "masAlla": "Qué más cambia frente al mar",
  "masAllaBody": "La costa no solo cambia el título: cambia el costo de mantener. Salinidad y corrosión aceleran el desgaste de estructura e instalaciones; el seguro contra huracán y marejada tiene exclusiones que conviene leer antes; el sargazo se reparte de forma muy distinta según la zona y afecta la ocupación real; y la línea de costa se mueve. Cada uno de esos temas merece su propia pieza y las estamos escribiendo. Mientras tanto, si estás evaluando un proyecto concreto, el inventario y los datos por zona son el mejor punto de partida.",
  "linkDesarrollos": "Ver desarrollos frente al mar",
  "linkZonas": "Datos por zona",
  "linkMercado": "Inteligencia de mercado"
}
```

En `src/i18n/messages/en.json`, la misma estructura con copy propio en inglés:

```json
"costa": {
  "metaTitle": "Buying beachfront in Mexico: what your deed actually conveys",
  "metaDescription": "The beach strip is federal property and cannot be sold. So what does 'beachfront' mean, what does your deed convey, what does it not, and how can you verify it yourself in official records.",
  "h1": "Beachfront and branded residences",
  "intro": "\"Beachfront\" is the most repeated promise in the Mexican Caribbean and the least examined. Behind it sits a specific legal layer that decides what you are actually buying, and it is barely written down for buyers: the strip of sand does not belong to the development, cannot be sold, and your deed does not convey it. This page explains the framework and tells you what you can verify yourself before signing.",
  "zofematTitle": "The beach strip is not for sale",
  "zofematBody": "The Federal Maritime Land Zone — ZOFEMAT — is the twenty-metre-wide strip adjoining the beach. It is federal public domain property: inalienable and not subject to prescription. Nobody can sell it to you and nobody can acquire it through the passage of time. What exists over it are concessions: temporary permits the federal government grants for its use, with an expiry date, obligations and grounds for termination.",
  "escrituraTitle": "What your deed does convey",
  "escrituraBody": "Your deed conveys the lot adjoining the federal strip, not the strip itself. Two different things with two different titles, and one does not carry the other: buying the lot does not assign you the concession over the adjoining ZOFEMAT. When a project offers beach access, a palapa, loungers or a beach club on that strip, what sits behind it — if it is in order — is a concession in someone's name, with an expiry date. The useful question is not whether the development has a beach, but whose name the concession is in, until when, and what happens to you when it expires.",
  "verificarTitle": "How to verify it yourself",
  "verificarBody": "SEMARNAT publishes ZOFEMAT concession titles in its targeted transparency section. That turns \"verify it yourself\" into a real step rather than empty advice: you can check whether a concession exists for the property you are considering, whose name it is in and how long it runs, before signing anything. If a seller cannot give you the title number and its expiry date, that is already information.",
  "extranjeroTitle": "As a foreign buyer, these are two filings, not one",
  "extranjeroBody": "Buying inside the restricted zone — the fifty kilometres along the coast — is handled through a trust held by a Mexican bank. A ZOFEMAT concession is a separate matter under its own regime. Holding a trust does not give you a concession, and holding a concession does not replace the trust. Confusing the two is the most common mistake in this layer, and it surfaces late.",
  "masAlla": "What else changes on the coast",
  "masAllaBody": "The coast changes more than the title: it changes the cost of ownership. Salt and corrosion accelerate wear on structure and building systems; hurricane and storm-surge coverage carries exclusions worth reading in advance; sargassum lands very unevenly by area and affects real occupancy; and the shoreline moves. Each of those deserves its own piece and we are writing them. In the meantime, if you are evaluating a specific project, the inventory and the area-level data are the better starting point.",
  "linkDesarrollos": "Browse beachfront developments",
  "linkZonas": "Area-level data",
  "linkMercado": "Market intelligence"
}
```

- [ ] **Step 2: Crear la página**

Crear `src/app/[locale]/guias/costa/page.tsx`:

```tsx
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { assertPageVisible } from '@/lib/page-visibility';
import { VISIBILITY_KEYS } from '@/lib/visibility';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import ArticulosDePilar from '@/components/blog/ArticulosDePilar';
import { pilarPorCodigo } from '@/lib/blog/pilares';

/**
 * Hub del pilar P6 (Producto: Costa y Branded).
 *
 * Carpeta ESTÁTICA a propósito, no un segmento `[pilar]`: así `/es/guias/x` da
 * 404 real por no matchear ruta, en vez de un 200 con el shell.
 *
 * A diferencia del hub de P1, este lleva encuadre PROPIO: cero de las diez piezas
 * del pilar existen todavía, y un índice sin hijos indexa la nada. El encuadre se
 * queda en nivel panorámico —qué es la ZOFEMAT, qué transmite la escritura y qué
 * no, dónde verificarlo— para no canibalizar P6-01, que es la pieza prioritaria
 * del pilar y la que desarrolla el tema a fondo.
 */

const PILAR = pilarPorCodigo('P6')!;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guias.costa' });
  const path = PILAR.hubs[0];

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        es: `/es${path}`,
        en: `/en${path}`,
        'x-default': `/es${path}`,
      },
    },
    openGraph: {
      type: 'website',
      title: `${t('metaTitle')} | Propyte`,
      description: t('metaDescription'),
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default async function GuiaCostaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertPageVisible(VISIBILITY_KEYS.PAGE_GUIAS_COSTA);

  const [t, tb] = await Promise.all([
    getTranslations({ locale, namespace: 'guias.costa' }),
    getTranslations({ locale, namespace: 'breadcrumbs' }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://propyte.com';

  return (
    <>
      <section className="bg-[#1A2F3F] text-white py-14 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t('h1')}</h1>
          <p className="mt-5 max-w-3xl text-base md:text-lg text-white/80 leading-relaxed">
            {t('intro')}
          </p>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <Breadcrumbs
            items={[{ label: t('h1') }]}
            locale={locale}
            homeLabel={tb('home')}
            ariaLabel={tb('ariaLabel')}
            baseUrl={siteUrl}
          />

          <div className="mt-8 max-w-3xl space-y-8">
            {([
              ['zofematTitle', 'zofematBody'],
              ['escrituraTitle', 'escrituraBody'],
              ['verificarTitle', 'verificarBody'],
              ['extranjeroTitle', 'extranjeroBody'],
              ['masAlla', 'masAllaBody'],
            ] as const).map(([title, body]) => (
              <div key={title}>
                <h2 className="text-xl md:text-2xl font-bold text-[#1A2F3F]">{t(title)}</h2>
                <p className="mt-3 text-gray-700 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Con 0 piezas devuelve null: un hub sin contenido no muestra un módulo
          vacío. Es el comportamiento correcto, no un bug — crecerá cuando el
          pilar tenga artículos clasificados como P6. */}
      <ArticulosDePilar locale={locale} code="P6" />

      <section className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <nav className="flex flex-wrap gap-3">
            <Link href={`/${locale}/desarrollos`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkDesarrollos')}
            </Link>
            <Link href={`/${locale}/zonas`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkZonas')}
            </Link>
            <Link href={`/${locale}/mercado`} className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#0E7490] hover:bg-gray-100 transition-colors">
              {t('linkMercado')}
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verificar el conteo de palabras del cuerpo**

El acuerdo con Luis es ~800 palabras de encuadre propio. Contar el cuerpo en español:

Run: `node -e "const m=require('./src/i18n/messages/es.json').guias.costa;const txt=['intro','zofematBody','escrituraBody','verificarBody','extranjeroBody','masAllaBody'].map(k=>m[k]).join(' ');console.log(txt.split(/\s+/).length,'palabras')"`
Expected: entre 500 y 900. Si baja de 500, la página es delgada y hay que ampliar los bloques antes de mergear.

- [ ] **Step 4: Arrancar y ver**

Run: `npm run dev` y abrir `http://localhost:3000/es/guias/costa` y `http://localhost:3000/en/guias/costa`
Expected: 200 en los dos, cinco bloques de cuerpo, sin módulo de artículos, tres enlaces al final.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[locale\]/guias/costa src/i18n/messages
git commit -m "feat(guias): hub del pilar P6 en /guias/costa

Cierra la otra mitad del bloqueo #7. Como 0 de sus 10 piezas existen, lleva
encuadre propio en vez de indexar la nada, en nivel panorámico para no
canibalizar P6-01 (ZOFEMAT), que es la pieza prioritaria del pilar."
```

---

## Task 10: Sitemap y 404 real

**Files:**
- Modify: `src/app/sitemap.ts:46-48`
- Create: `src/app/sitemap.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/app/sitemap.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// El sitemap consulta Supabase para desarrollos y posts; aquí solo interesan las
// URLs estáticas, así que los clientes se anulan y el try/catch del propio
// sitemap absorbe la ausencia de datos dinámicos.
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => null),
  createServiceRoleClient: vi.fn(async () => null),
}));
vi.mock('@/lib/seo/noindex', () => ({ shouldNoIndex: () => false }));

beforeEach(() => vi.clearAllMocks());

describe('sitemap', () => {
  it('incluye los dos hubs de pilar en los dos locales', async () => {
    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);

    for (const path of ['/guias/fiscal-legal', '/guias/costa']) {
      for (const locale of ['es', 'en']) {
        expect(urls).toContain(`https://propyte.com/${locale}${path}`);
      }
    }
  });

  it('no duplica ninguna URL', async () => {
    const { default: sitemap } = await import('./sitemap');
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL — las 4 URLs no están.

Si el mock de `NEXT_PUBLIC_SITE_URL` da otro host, ajustar el `expect` al valor real de `BASE_URL` en el entorno de test.

- [ ] **Step 3: Añadir las entradas**

En `src/app/sitemap.ts`, en el array `staticPages`, después de la línea de `/financiamiento`:

```ts
    // Hubs de pilar. El hreflang NO sale de aquí: lo emite `alternates.languages`
    // en el generateMetadata de cada página, igual que blog/page.tsx.
    { path: '/guias/fiscal-legal', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/guias/costa', priority: 0.8, changeFrequency: 'monthly' as const },
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verificar el 404 real con códigos de estado**

Con `npm run build && npm start` (no `dev`: en dev los códigos de estado de rutas ausentes pueden diferir):

```bash
for u in /es/guias/fiscal-legal /en/guias/fiscal-legal /es/guias/costa /en/guias/costa /es/guias/inventado /es/guias; do
  printf '%s -> %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$u")"
done
```

Expected:
```
/es/guias/fiscal-legal -> 200
/en/guias/fiscal-legal -> 200
/es/guias/costa -> 200
/en/guias/costa -> 200
/es/guias/inventado -> 404
/es/guias -> 404
```

**Si `/es/guias/inventado` devuelve 200, parar:** significa que hay un segmento dinámico capturando `/guias/*` en alguna parte y el diseño del 404 real no se sostiene.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(seo): los dos hubs de pilar entran al sitemap

170 -> 174 URLs. Primer test del sitemap: verifica las 4 nuevas y que no haya
duplicados."
```

---

## Task 11: Filtros `?pilar=` y `?audiencia=` en `/es/blog`

**Files:**
- Create: `src/components/blog/PilarFilter.tsx`, `src/components/blog/AudienciaFilter.tsx`, `src/components/blog/MapaDePilares.tsx`
- Modify: `src/app/[locale]/blog/page.tsx` (completo), `src/components/blog/BlogPagination.tsx`, `src/i18n/messages/{es,en}.json`

- [ ] **Step 1: Crear los chips de pilar**

Crear `src/components/blog/PilarFilter.tsx`, mismo patrón que `CategoryFilter` — enlaces reales server-rendered, porque con `<button>` + `router.push` el rastreador solo alcanza lo que el hero enlaza:

```tsx
import Link from 'next/link';
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
import { pilarPorCodigo } from '@/lib/blog/pilares';

interface PilarFilterProps {
  /** CÓDIGOS con posts publicados, de `getBlogPilares`. */
  codes: string[];
  /** Código activo, o null. */
  active: string | null;
  /** Resto del estado a conservar al cambiar de pilar (categoría, audiencia). */
  keep: BlogUrlState;
  allLabel: string;
  filterAriaLabel: string;
  /** Label por código, resuelto por el server component que renderiza. */
  labels: Record<string, string>;
  locale: string;
}

/**
 * Chips de pilar canónico. Al cambiar de pilar se descarta la página (`page`
 * omitido): la página 3 de un filtro rara vez existe en el siguiente.
 */
export default function PilarFilter({
  codes, active, keep, allLabel, filterAriaLabel, labels, locale,
}: PilarFilterProps) {
  if (codes.length === 0) return null;

  return (
    <nav className="flex flex-wrap gap-2" aria-label={filterAriaLabel}>
      <Link
        href={blogHref(locale, { ...keep, pilar: null, page: null })}
        aria-current={!active ? 'page' : undefined}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active ? 'bg-[#1A2F3F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {allLabel}
      </Link>
      {codes.map((code) => {
        const pilar = pilarPorCodigo(code);
        if (!pilar) return null;
        return (
          <Link
            key={code}
            href={blogHref(locale, { ...keep, pilar: pilar.slug, page: null })}
            aria-current={active === code ? 'page' : undefined}
            className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
              active === code
                ? 'bg-[#5CE0D2] text-[#0F1923]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {labels[code] ?? code}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Crear los chips de audiencia**

Crear `src/components/blog/AudienciaFilter.tsx`, igual pero sobre `AUDIENCIAS`:

```tsx
import Link from 'next/link';
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
import { AUDIENCIAS } from '@/lib/blog/pilares';

interface AudienciaFilterProps {
  active: string | null;
  keep: BlogUrlState;
  allLabel: string;
  filterAriaLabel: string;
  labels: Record<string, string>;
  locale: string;
}

/**
 * Chips de audiencia. A diferencia de los de pilar, las dos audiencias se
 * muestran siempre: son un catálogo cerrado de dos valores acordado con Luis, no
 * un descubrimiento de BD.
 */
export default function AudienciaFilter({
  active, keep, allLabel, filterAriaLabel, labels, locale,
}: AudienciaFilterProps) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={filterAriaLabel}>
      <Link
        href={blogHref(locale, { ...keep, audiencia: null, page: null })}
        aria-current={!active ? 'page' : undefined}
        className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
          !active ? 'bg-[#1A2F3F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {allLabel}
      </Link>
      {AUDIENCIAS.map((a) => (
        <Link
          key={a}
          href={blogHref(locale, { ...keep, audiencia: a, page: null })}
          aria-current={active === a ? 'page' : undefined}
          className={`inline-flex items-center min-h-[44px] px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
            active === a ? 'bg-[#5CE0D2] text-[#0F1923]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {labels[a] ?? a}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: `BlogPagination` hereda el estado completo**

En `src/components/blog/BlogPagination.tsx` hay un solo sitio que construye hrefs (`hrefFor`, línea 38) y hoy solo conserva la categoría. Sin este cambio, paginar dentro de un filtro de pilar pierde el filtro — el mismo fallo que documenta la cabecera de `blog-urls.ts`.

Cambiar el import de la línea 3:

```tsx
import { blogHref, type BlogUrlState } from '@/lib/blog/blog-urls';
```

Reemplazar el prop de las líneas 9-10:

```tsx
  /** Filtro activo completo: viaja en cada href para no perderlo al paginar. */
  keep?: BlogUrlState;
```

Reemplazar el default de la línea 31:

```tsx
  keep = {},
```

Y reemplazar `hrefFor` (línea 38):

```tsx
  const hrefFor = (page: number) => blogHref(locale, { ...keep, page });
```

El resto del archivo no cambia: los nueve usos de `hrefFor` ya heredan el estado.

- [ ] **Step 4: Añadir labels de UI a los messages**

En el namespace `blog` de `src/i18n/messages/es.json`:

```json
"pilarFilterAriaLabel": "Filtrar artículos por pilar",
"audienciaFilterAriaLabel": "Filtrar artículos por audiencia",
"allPilares": "Todos los temas",
"allAudiencias": "Todo el público",
"mapaPilaresTitle": "Los siete pilares",
"mapaPilaresBody": "Cada pilar tiene su propia guía. Entra por el que te toque."
```

En `en.json`:

```json
"pilarFilterAriaLabel": "Filter articles by pillar",
"audienciaFilterAriaLabel": "Filter articles by audience",
"allPilares": "All topics",
"allAudiencias": "Everyone",
"mapaPilaresTitle": "The seven pillars",
"mapaPilaresBody": "Each pillar has its own guide. Start with the one that applies to you."
```

- [ ] **Step 5: Reescribir `blog/page.tsx`**

Cambios sobre `src/app/[locale]/blog/page.tsx`:

a) La interfaz de props acepta los params nuevos:

```tsx
interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categoria?: string; pilar?: string; audiencia?: string; pagina?: string }>;
}
```

b) Un helper compartido resuelve y valida el estado, para que `generateMetadata` y la página no lo deriven por separado (es exactamente el "tope escrito dos veces" que ya falló aquí). Añadir arriba del archivo:

```tsx
import { pilarPorSlug, esAudiencia } from '@/lib/blog/pilares';

/**
 * Resuelve los params a estado validado.
 *
 * Un valor fuera del catálogo NO es 404: es un param basura en una ruta que sí
 * existe. Se ignora el filtro y se marca la vista `noindex` para que la URL
 * basura no entre al índice. No se usa `notFound()` a propósito — en este sitio
 * las rutas dinámicas flushean shell con 200 antes de resolverlo.
 */
function resolveBlogState(sp: { categoria?: string; pilar?: string; audiencia?: string; pagina?: string }) {
  const pilar = sp.pilar ? pilarPorSlug(sp.pilar) : null;
  const audienciaValida = sp.audiencia && esAudiencia(sp.audiencia) ? sp.audiencia : null;
  const paramInvalido = Boolean((sp.pilar && !pilar) || (sp.audiencia && !audienciaValida));

  return {
    category: sp.categoria || null,
    pilar,
    audiencia: audienciaValida,
    page: Math.max(1, Number(sp.pagina) || 1),
    paramInvalido,
    /** Lo que va en `blogHref`: slug, no código. */
    urlState: {
      category: sp.categoria || null,
      pilar: pilar?.slug ?? null,
      audiencia: audienciaValida,
    },
  };
}
```

c) `generateMetadata` usa el helper, canonicaliza con el estado limpio y añade `robots` cuando el param es basura:

```tsx
export async function generateMetadata({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const tp = await getTranslations({ locale, namespace: 'pilares' });
  const { category, pilar, audiencia, page, paramInvalido, urlState } = resolveBlogState(sp);

  let title = t('listingTitle');
  let description = t('listingDescription');
  if (category) {
    title = t('listingTitleCategory', { category });
    description = t('listingDescriptionCategory', { category });
  } else if (pilar) {
    title = t('listingTitleCategory', { category: tp(pilar.code) });
    description = t('listingDescriptionCategory', { category: tp(pilar.code) });
  }
  if (page > 1) title = t('listingTitlePaged', { title, page });

  const brandedTitle = `${title} | Propyte`;
  const state = { ...urlState, page };

  return {
    title,
    description,
    // Un valor fuera del catálogo se ignora en el listado, así que esa URL
    // mostraría el set completo bajo otra dirección: contenido duplicado.
    ...(paramInvalido ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'website',
      title: brandedTitle,
      description,
      locale: locale === 'en' ? 'en_US' : 'es_MX',
      alternateLocale: locale === 'en' ? 'es_MX' : 'en_US',
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: 'summary_large_image', title: brandedTitle, description },
    alternates: {
      canonical: blogHref(locale, state),
      languages: {
        es: blogHref('es', state),
        en: blogHref('en', state),
        'x-default': blogHref('es', state),
      },
    },
  };
}
```

d) El componente usa el helper, pasa `pilar.code` a la query y monta los tres filtros:

```tsx
  const sp = await searchParams;
  const { category, pilar, audiencia, page: currentPage, urlState } = resolveBlogState(sp);
  const supabase = createPublicSupabaseClient();

  const [{ posts, total }, categories, pilarCodes, teamMembers] = supabase
    ? await Promise.all([
        getBlogPosts(supabase, {
          locale,
          category: category ?? undefined,
          pilar: pilar?.code,
          audiencia: audiencia ?? undefined,
          limit: POSTS_PER_PAGE,
          page: currentPage,
        }),
        getBlogCategories(supabase, locale),
        getBlogPilares(supabase, locale),
        getTeamMembers(supabase),
      ])
    : [{ posts: [], total: 0 }, [], [], []];
```

Los labels de pilar y audiencia se resuelven en el server y se pasan como `Record`:

```tsx
  const tp = await getTranslations({ locale, namespace: 'pilares' });
  const ta = await getTranslations({ locale, namespace: 'audiencias' });
  const pilarLabels = Object.fromEntries(PILARES.map((p) => [p.code, tp(p.code)]));
  const audienciaLabels = Object.fromEntries(AUDIENCIAS.map((a) => [a, ta(a)]));
```

y el bloque de filtros sustituye al `<div className="mt-6 mb-8">` actual:

```tsx
          <div className="mt-6 mb-8 space-y-3">
            <CategoryFilter
              categories={categories}
              active={category}
              allLabel={t('allCategories') || 'Todos'}
              filterAriaLabel={t('categoryFilterAriaLabel')}
              locale={locale}
            />
            <PilarFilter
              codes={pilarCodes}
              active={pilar?.code ?? null}
              keep={urlState}
              allLabel={t('allPilares')}
              filterAriaLabel={t('pilarFilterAriaLabel')}
              labels={pilarLabels}
              locale={locale}
            />
            <AudienciaFilter
              active={audiencia}
              keep={urlState}
              allLabel={t('allAudiencias')}
              filterAriaLabel={t('audienciaFilterAriaLabel')}
              labels={audienciaLabels}
              locale={locale}
            />
          </div>
```

`BlogPagination` pasa a recibir `keep={urlState}` en vez de `activeCategory`. El `EmptyState` conserva su lógica, añadiendo el caso de filtro de pilar o audiencia activo al condicional que muestra "volver al blog":

```tsx
                ...(category || pilar || audiencia
                  ? [{ label: t('emptyStateCtaBack'), href: `/${locale}/blog`, variant: 'secondary' as const }]
                  : []),
```

Los breadcrumbs usan el label del pilar cuando es el filtro activo:

```tsx
  const activeLabel = category ?? (pilar ? tp(pilar.code) : null);
  const breadcrumbItems = activeLabel
    ? [{ label: t('listingTitle'), href: `/${locale}/blog` }, { label: activeLabel }]
    : [{ label: t('listingTitle') }];
```

Añadir a los imports: `getBlogPilares` desde queries, `PilarFilter`, `AudienciaFilter`, y `PILARES, AUDIENCIAS, pilarPorSlug, esAudiencia` desde `@/lib/blog/pilares`.

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores. Si `BlogHero` recibía `activeCategory`, dejarlo como está: sigue siendo el eje de categoría.

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/\[locale\]/blog/page.tsx src/components/blog src/i18n/messages
git commit -m "feat(blog): filtros ?pilar= y ?audiencia= combinables con categoria y pagina

Un helper único resuelve y valida el estado para metadata y página: derivarlo
dos veces es el fallo que ya costó un ?page=2 respondiendo 200 con la página 1.
Valor fuera del catálogo se ignora y la vista sale noindex, sin notFound() para
no caer en el soft-404 por streaming."
```

---

## Task 12: Bloque de los siete pilares y click-through

**Files:**
- Create: `src/components/blog/MapaDePilares.tsx`, `tests/e2e/blog-filtros.spec.ts`
- Modify: `src/app/[locale]/blog/page.tsx`

- [ ] **Step 1: Crear el bloque**

Los chips de filtro solo ofrecen pilares con resultados, así que hoy enlazan 1 hub. Este bloque enlaza los 7 con independencia de si tienen posts, que es lo que cumple "cada pilar enlaza a su hub" sin crear vistas filtradas vacías e indexables.

Crear `src/components/blog/MapaDePilares.tsx`:

```tsx
import Link from 'next/link';
import { PILARES, pilarHubHref } from '@/lib/blog/pilares';

/**
 * Los siete hubs de pilar, enlazados siempre.
 *
 * Deliberadamente independiente de si el pilar tiene artículos: los chips del
 * filtro derivan de lo publicado (hoy, un solo pilar) y sin este bloque seis de
 * los siete hubs quedarían sin enlace desde el blog. Enlaza al HUB, no a una
 * vista filtrada, para no multiplicar URLs indexables sin contenido.
 */
export default function MapaDePilares({
  locale,
  title,
  body,
  labels,
}: {
  locale: string;
  title: string;
  body: string;
  labels: Record<string, string>;
}) {
  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <h2 className="text-2xl font-bold text-[#1A2F3F]">{title}</h2>
        <p className="mt-2 text-gray-700">{body}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILARES.map((p) => (
            <li key={p.code}>
              <Link
                href={pilarHubHref(locale, p)}
                className="flex items-center min-h-[44px] px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-[#1A2F3F] hover:border-[#5CE0D2] hover:text-[#0E7490] transition-colors"
              >
                {labels[p.code] ?? p.code}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Montarlo en el listado**

En `src/app/[locale]/blog/page.tsx`, justo antes de `<NewsletterCTA />`:

```tsx
      <MapaDePilares
        locale={locale}
        title={t('mapaPilaresTitle')}
        body={t('mapaPilaresBody')}
        labels={pilarLabels}
      />
```

- [ ] **Step 3: Escribir el e2e**

Crear `tests/e2e/blog-filtros.spec.ts`. Click-through real porque `curl` y `grep` no ven un filtro que no re-renderiza:

```ts
import { test, expect } from '@playwright/test';

test.describe('filtros del blog por pilar', () => {
  test('el chip de pilar filtra y la URL lo refleja @smoke', async ({ page }) => {
    await page.goto('/es/blog');

    const antes = await page.locator('article, a[href*="/es/blog/"]').count();
    expect(antes).toBeGreaterThan(0);

    const filtro = page.getByRole('navigation', { name: /pilar/i });
    await expect(filtro).toBeVisible();

    // El primer chip que no sea "todos".
    const chip = filtro.getByRole('link').nth(1);
    const label = await chip.textContent();
    await chip.click();

    await expect(page).toHaveURL(/[?&]pilar=/);
    // El grid se volvió a renderizar en el servidor: el chip activo lo declara.
    await expect(filtro.getByRole('link', { name: label!.trim() })).toHaveAttribute('aria-current', 'page');
  });

  test('pilar y paginación se combinan sin perderse', async ({ page }) => {
    await page.goto('/es/blog?pilar=fiscal-legal');
    await expect(page).toHaveURL(/pilar=fiscal-legal/);

    const siguiente = page.getByRole('navigation', { name: /pagina|página|pagination/i }).getByRole('link').last();
    if (await siguiente.count() > 0 && await siguiente.isVisible()) {
      await siguiente.click();
      // Si la paginación pierde el filtro, este assert cae.
      await expect(page).toHaveURL(/pilar=fiscal-legal/);
      await expect(page).toHaveURL(/pagina=/);
    }
  });

  test('un pilar inventado no rompe: muestra el listado y se desindexa', async ({ page }) => {
    const res = await page.goto('/es/blog?pilar=inventado');
    expect(res?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('el mapa enlaza los siete hubs y los dos nuevos responden 200 @smoke', async ({ page, request }) => {
    await page.goto('/es/blog');
    const mapa = page.getByRole('heading', { name: /siete pilares|seven pillars/i });
    await expect(mapa).toBeVisible();

    for (const path of ['/es/guias/fiscal-legal', '/es/guias/costa']) {
      await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
      expect((await request.get(path)).status()).toBe(200);
    }
    // Un pilar inexistente da 404 real, no 200 con lista vacía.
    expect((await request.get('/es/guias/inventado')).status()).toBe(404);
  });
});
```

- [ ] **Step 4: Correr el e2e**

Run: `npm run build && npx playwright test tests/e2e/blog-filtros.spec.ts`
Expected: 4 passed.

Si el `name` de la navegación de paginación no coincide, leer el `aria-label` real desde `blog.paginationAriaLabel` en `es.json` y ajustar el selector.

- [ ] **Step 5: Gates finales**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run test:unit`
Expected: PASS, toda la suite.

Run: `npm run build`
Expected: build completo. Comprobar en la salida que `/[locale]/guias/fiscal-legal` y `/[locale]/guias/costa` aparecen en la lista de rutas.

- [ ] **Step 6: Verificación manual en navegador**

Abrir y comprobar a ojo:
- `http://localhost:3000/es/blog` — tres filas de chips, el mapa de los 7 pilares al final
- clic en el chip de "Fiscal y legal" → el grid muestra solo P1, la URL lleva `?pilar=fiscal-legal`
- añadir a mano `&audiencia=asesores` → grid vacío con `EmptyState` y el CTA de volver
- `http://localhost:3000/en/blog` — los chips en inglés, no en español
- `http://localhost:3000/es/guias/fiscal-legal` — el módulo de artículos muestra las 3 piezas publicadas de P1
- `view-source:http://localhost:3000/es/guias/fiscal-legal` — el `<link rel="alternate" hreflang="en">` está presente

- [ ] **Step 7: Commit**

```bash
git add src/components/blog/MapaDePilares.tsx src/app/\[locale\]/blog/page.tsx tests/e2e/blog-filtros.spec.ts
git commit -m "feat(blog): mapa de los siete pilares y e2e de los filtros

Los chips derivan de lo publicado (hoy un pilar), así que sin este bloque seis
de los siete hubs no tendrían enlace desde el blog. El e2e hace click-through
real: un filtro que no re-renderiza no se ve con curl."
```

---

## Cierre

- [ ] Correr los tres gates en limpio: `npx tsc --noEmit && npm run test:unit && npm run build`
- [ ] Confirmar que los archivos de Meta CAPI siguen sin commitear: `git status --porcelain` debe seguir listando `src/app/api/track/`, `src/lib/meta/`, `.env.example`, `src/app/api/leads/route.ts`, `src/lib/analytics/track.ts`, `src/lib/leads/submit-lead.ts`
- [ ] Confirmar que no se tocó `/es/financiamiento` ni `/es/mercado`: `git diff --name-only origin/main | grep -E 'financiamiento|mercado'` debe salir vacío (salvo `sitemap.ts`, que solo añade líneas)
- [ ] Pasar a Luis el copy de los dos hubs para revisión de voz antes del merge
- [ ] **Pedir autorización explícita antes del merge a `main`.** Deploy = push a `main` y Hostinger hace pull por cron; no hay workflow de Actions que revierta nada.
