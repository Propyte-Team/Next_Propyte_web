# Taxonomía de pilares y hubs faltantes — diseño

**Fecha:** 2026-08-04 · **Rama:** `feat/pilares-taxonomia` (desde `origin/main` @ `ff54201`)
**Fuente de verdad editorial:** `~/Projects/Propyte/docs-editorial/07_Sistema-Pilares_MAESTRO_corte-05ago2026.md`

Resuelve los bloqueos **#7** (los hubs de P1 y P6 no existen, así que ningún brief
puede enlazar a su pilar padre) y **#8** (taxonomía de categorías incompleta) de la
§14 del maestro.

---

## 1. Estado medido, no heredado

Medido el 2026-08-04 contra `oaijxdpevakashxshhvm` y contra el árbol de trabajo.
Donde el maestro (corte 30-jul) y la medición discrepan, manda la medición.

| Hecho | Medición |
|---|---|
| Filas en `blog_posts` | 29 |
| Vivas (`deleted_at IS NULL`) | **21** — 5 publicadas, 16 draft |
| En papelera | **8**, todas duplicados de ISAI |
| Locales | 18 filas `es`, 3 filas `en` |
| Publicadas en `en` | **2** (el maestro declara 0 — el estado avanzó tras el corte) |
| Briefs en `blog_briefs` | 5; solo 3 con `code` (P1-01, P1-02, P1-03), 2 con `code` NULL |
| Briefs que generaron post | 2 |

Tres discrepancias con el maestro que quedan registradas y **no** se resuelven aquí:

1. **ISAI tiene 11 filas**, no una pieza: 3 vivas + 8 en papelera. El brief P1-02
   apunta con `generated_post_id` al duplicado `isai-isabi-2026-quintana-roo-yucatan-1785879299776`,
   **no** al slug canónico del maestro (`isai-quintana-roo-yucatan-2026`).
   Deduplicar es decisión de índice/SEO — dueño: Luis.
2. **P1-01 ya está publicado en `es` y `en`.** El maestro lo marca "EN PRODUCCIÓN ·
   1 gate bloqueando" (la tasa máxima del art. 152). Si el gate sigue abierto, hay
   una pieza YMYL publicada sin cerrarlo. Dueño: Luis.
3. **Ya existía un sistema de pilares** en el repo (`659f2da`, 29-jul) incompatible
   con la numeración canónica. Ver §2.

### El sistema que ya existía

`src/lib/blog/pilares.ts` modela el pilar como **slug de ruta derivado de
`category`**: seis pilares (`como-invertir`, `financiamiento`, `como-comprar`,
`mercado`, `brokers`, `desarrolladores`), sin P1 ni P6 porque sus hubs no existían.
Discrepa del maestro en tres puntos:

- `Legal y fiscal → como-comprar` (P2). El maestro dice **P1**.
- `Estilo de vida → null`, comentado *"Luis, 2026-07-28: no encaja en ninguno"*.
  El bloqueo #8 dice que esos tres posts son **P5**. Misma decisión, dos
  resultados, seis días aparte.
- No existen P1 ni P6.

Y ese mapa **publica UI**: `PilarArticlesSection` lo consume en `/es/brokers`,
`/es/como-comprar` y `/es/como-invertir`; `blog/[slug]` enlaza al pilar.

Impacto exacto de imponer los códigos canónicos sobre ese mapa (exacto porque solo
hay 3 posts publicados en `es`):

| Página | Hoy | Con códigos canónicos |
|---|---|---|
| `/es/como-comprar` | 1 artículo (fideicomiso, vía `Guías de compra`) | 0 — el módulo desaparece |
| `/es/como-invertir` | 2 artículos (ejido, isr, vía `Para Inversionistas`) | 0 — el módulo desaparece |
| hub P1 (nuevo) | no existe | 3 |

---

## 2. Decisiones tomadas

Todas por Luis, 2026-08-04, salvo donde se indique.

1. **Base git:** rama nueva desde `origin/main`. La rama `deploy/mercado-fuente-citable`
   @ `7f72e00` está *behind 3, ahead 0* — ya contenida en main, mergearla sería no-op.
2. **Dos ejes con nombres honestos.** La columna `pilar` es la taxonomía canónica;
   el mapa por categoría se queda gobernando solo la afinidad de superficie. Son
   preguntas distintas: *¿a qué pilar pertenece esta pieza?* vs *¿en qué hubs tiene
   sentido mostrarla?* Una pieza puede ser P1 y aun así caber en `/es/como-comprar`.
   Cero regresión en producción.
3. **Dos audiencias:** `asesores` / `inversionistas`, y el reparto de los 21 se hace
   solo entre esas dos. `audiencia` sigue siendo columna propia (no derivada), con
   catálogo tipado ampliable.
4. **Hubs = índice curado**, los dos. No long-form: P1 es YMYL completo y el bloqueo
   #1 dice que no hay fiscalista asignado, así que un hub que no afirma nada fiscal
   nuevo no queda bloqueado por ese pendiente.
5. **El hub de P6 lleva encuadre propio** (~800 palabras) más enlaces a superficies
   vivas, porque 0 de sus 10 piezas existen y un índice ahí indexaría la nada. El
   encuadre no se vuelve el artículo P6-01.
6. **Chips del filtro derivados de lo publicado**, más un bloque estático de los
   siete pilares que enlaza los siete hubs. Así no hay filtros muertos y los siete
   hubs quedan enlazados igual.
7. **Filtros por query param**, nunca `/es/blog/pilar/x` (decisión previa de Luis).

---

## 3. Los dos ejes

| Eje | Fuente de verdad | Gobierna | Módulo |
|---|---|---|---|
| Taxonomía canónica | columna `blog_posts.pilar` (`P1..P7`) | filtro de `/es/blog`, hubs nuevos | `src/lib/blog/pilares.ts` (reescrito) |
| Afinidad de superficie | mapa `category → hub` | módulo "artículos relacionados" de los hubs viejos | `src/lib/blog/hub-relacionado.ts` (mudado) |

El mapa actual se muda de `pilares.ts` a `hub-relacionado.ts` con sus símbolos
renombrados — `CATEGORIA_A_PILAR → CATEGORIA_A_HUB`, `Pilar → HubRelacionado`,
`pilarDeCategoria → hubDeCategoria`, `categoriasDePilar → categoriasDeHub`,
`pilarHref → hubHref` — y su test lo sigue. Renombre mecánico, **sin cambio de
comportamiento**, en seis consumidores: `PilarArticlesSection.tsx`,
`PilarArticles.tsx`, `blog/[slug]/page.tsx`, `brokers/page.tsx`,
`como-comprar/page.tsx`, `como-invertir/page.tsx`. Los nombres de componente no
cambian (siguen renderizando "artículos relacionados" en un hub); sí cambia el
nombre del prop `pilar → hub`.

Motivo del renombre: que la palabra "pilar" nombre exactamente una cosa. Dos mapas
distintos llamados igual es el modo de fallo que ya costó tiempo en este repo.

### Catálogo canónico

Módulo **neutro, sin `'use client'`**, por el mismo motivo documentado en
`categories.ts`: importado desde un `'use client'`, Next 16 RSC convierte el const
en proxy function y `===` da siempre false.

Cada entrada lleva `code`, `slug`, `hubs` (array — P7 tiene dos) y `audiencia` por
defecto:

| code | slug (va en la URL) | hubs | audiencia |
|---|---|---|---|
| P1 | `fiscal-legal` | `/guias/fiscal-legal` | inversionistas |
| P2 | `proceso-compra` | `/como-comprar` | inversionistas |
| P3 | `inversion-roi` | `/como-invertir` | inversionistas |
| P4 | `financiamiento` | `/financiamiento` | inversionistas |
| P5 | `mercado-zonas` | `/mercado` | inversionistas |
| P6 | `costa-branded` | `/guias/costa` | inversionistas |
| P7 | `canal` | `/brokers`, `/desarrolladores` | asesores |

- **La BD guarda el código; la URL lleva el slug.** Legible y neutro al idioma, sin
  repetir el `?categoria=Para%20Inversionistas` de hoy (label con espacio, atado al
  español).
- Los labels viven en `src/i18n/messages/{es,en}.json`, namespace `pilares`. Sin
  esto el filtro de `/en/blog` saldría en español — y hay 2 posts publicados en `en`.
- La `audiencia` del catálogo es solo el valor de arranque de la migración. La
  columna es independiente para que una pieza pueda desviarse: P7-03 ("cerrar con
  comprador extranjero") es de asesor y a la vez muy fiscal.

---

## 4. Los dos hubs

Rutas como **carpetas estáticas**, no segmento dinámico:

```
src/app/[locale]/guias/fiscal-legal/page.tsx
src/app/[locale]/guias/costa/page.tsx
```

- Sin `[pilar]` dinámico, `/es/guias/lo-que-sea` da **404 real por no matchear
  segmento**, sin depender de `notFound()` — que en este sitio es justo el patrón
  que produce 200 con el shell (`/es/blog/no-existe` y `/es/desarrollos/no-existe`
  responden 200 hoy).
- `/es/guias` pelado queda también en 404 (no se crea `page.tsx` ahí). Decisión
  consciente: no está en el mapa de pilares.
- Gate con `assertPageVisible` y keys nuevas `page.guias-fiscal-legal` /
  `page.guias-costa`. **Verificado:** `isVisible` es fail-open (`map[key] !== false`),
  así que una key que el Hub no conozca **no** tumba el hub. Registrarlas en el Hub
  es opcional y posterior.
- Contenido en `src/i18n/messages/{es,en}.json` (`guias.fiscalLegal`, `guias.costa`),
  con copy real en inglés, no un espejo del español.
- Sitemap: dos entradas al array `staticPages` de `src/app/sitemap.ts` → 4 URLs
  (×2 locales). 170 → 174. El hreflang **no** sale del sitemap: sale de
  `alternates.languages` en el `generateMetadata` de cada página, como ya hace
  `blog/page.tsx`.

**P1 · `/es/guias/fiscal-legal`** — índice curado. Presenta el pilar, ordena la
lectura y enlaza sus piezas resolviéndolas por `pilar='P1'`: 13 clasificadas, de las
que **3 están publicadas hoy**, así que el hub muestra 3 y crece solo. **No reexplica**
ISR, ISAI ni fideicomiso: cada pieza es la dueña de su tema. Al no emitir ninguna
afirmación fiscal nueva, no necesita `ymyl_reviewer_name` y no queda bloqueado por
el bloqueo #1.

**P6 · `/es/guias/costa`** — encuadre propio (~800 palabras): qué preguntas responde
el pilar, por qué la ZOFEMAT decide qué te transmite tu escritura, y qué puedes
verificar tú en la transparencia focalizada de SEMARNAT. Más enlaces a
`/es/desarrollos` y `/es/zonas`. Con 0 piezas, el módulo de artículos relacionados
**no se renderiza vacío**. El encuadre se queda en el nivel panorámico para no
canibalizar P6-01, que es la pieza prioritaria del pilar.

Ninguno de los dos duplica `/es/financiamiento` ni `/es/mercado`: los enlaza.

---

## 5. Esquema y migración

Escritura en producción. Requiere autorización explícita de Luis, con conteos
antes/después, antes de ejecutarse.

```sql
alter table public.blog_posts
  add column pilar text,
  add column audiencia text;

alter table public.blog_posts
  add constraint blog_posts_pilar_chk
    check (pilar is null or pilar in ('P1','P2','P3','P4','P5','P6','P7')),
  add constraint blog_posts_audiencia_chk
    check (audiencia is null or audiencia in ('asesores','inversionistas'));

create index blog_posts_pilar_idx     on public.blog_posts (pilar)     where deleted_at is null;
create index blog_posts_audiencia_idx on public.blog_posts (audiencia) where deleted_at is null;
```

Nullable y sin default: `NULL` significa "sin clasificar", que es honesto. Un default
metería a todas las filas nuevas en un pilar que nadie eligió.

**Consecuencia declarada:** introducir NULL obliga a que todo consumidor nuevo
excluya NULL explícitamente. `getBlogPilares` filtra `pilar is not null`; el filtro
de `/es/blog` solo aplica el `where` cuando el param está presente, así que una fila
sin clasificar sigue apareciendo en el listado sin filtro. Los posts que cree el Hub
nacerán con `pilar = NULL` hasta que el Hub exponga el campo — pendiente del Hub,
fuera de este alcance.

### Reparto de los 21 vivos

`UPDATE` explícitos por `(slug, locale)` — nunca por LIKE ni por patrón. La clave es
compuesta porque tres slugs existen en ambos locales.

| # | slug | loc | status | `category` hoy | → pilar | → audiencia | código |
|---|---|---|---|---|---|---|---|
| 1 | `isr-venta-propiedad-extranjero-mexico` | es | published | Para Inversionistas | P1 | inversionistas | P1-01 |
| 2 | `isr-venta-propiedad-extranjero-mexico` | en | published | Para Inversionistas | P1 | inversionistas | P1-01 |
| 3 | `isai-quintana-roo-yucatan-2026` | es | draft | Guías de compra | P1 | inversionistas | P1-02 ✔ canónico |
| 4 | `isai-isabi-2026-quintana-roo-yucatan-1785879240440` | es | draft | Para Inversionistas | P1 | inversionistas | P1-02 dup |
| 5 | `isai-isabi-2026-quintana-roo-yucatan-1785879299776` | es | draft | Para Inversionistas | P1 | inversionistas | P1-02 dup ← el brief apunta aquí |
| 6 | `fiscal-legalcfdi-compra-inmueble` | es | draft | Legal y fiscal | P1 | inversionistas | P1-03 |
| 7 | `rfc-extranjero-curp-biometrica-2026` | es | draft | Legal y fiscal | P1 | inversionistas | P1-04 |
| 8 | `fideicomiso-extranjeros-guia-2026` | es | published | Guías de compra | P1 | inversionistas | P1-05 |
| 9 | `fideicomiso-extranjeros-guia-2026` | en | draft | Guías de compra | P1 | inversionistas | P1-05 |
| 10 | `residencia-comprar-mexico-playa-del-carmen` | es | draft | Para Inversionistas | P1 | inversionistas | P1-06 |
| 11 | `ejido-vs-propiedad-privada-tulum` | es | published | Para Inversionistas | P1 | inversionistas | P1-07 |
| 12 | `ejido-vs-propiedad-privada-tulum` | en | published | Para Inversionistas | P1 | inversionistas | P1-07 |
| 13 | `due-diligence-inmuebles-mexico-17-puntos` | es | draft | Legal y fiscal | P1 | inversionistas | P1-08 |
| 14 | `guia-inversion-tulum-precios-zonas-plusvalia` | es | draft | Guías de compra | P5 | inversionistas | P5-01 |
| 15 | `tulum-correccion-2025-2026` | es | draft | **Estilo de vida** | P5 | inversionistas | P5-02 ← bloqueo #8 |
| 16 | `playa-del-carmen-inversion-2026` | es | draft | **Estilo de vida** | P5 | inversionistas | P5-03 ← bloqueo #8 |
| 17 | `cancun-zona-residencial-lujo` | es | draft | **Estilo de vida** | P5 | inversionistas | P5-04 ← bloqueo #8 |
| 18 | `caribbean-pulse-reporte-trimestral-riviera-maya` | es | draft | Mercado | P5 | inversionistas | P5-10 |
| 19 | `que-es-un-master-broker-inmobiliario` | es | draft | Para Asesores | P7 | asesores | P7-01 |
| 20 | `compartir-comision-sin-que-te-brinquen` | es | draft | Para Asesores | P7 | asesores | P7-02 |
| 21 | `cerrar-con-comprador-extranjero` | es | draft | Para Asesores | P7 | asesores | P7-03 |

**Conteos esperados después:** `pilar` → P1 = 13, P5 = 5, P7 = 3, resto 0.
`audiencia` → inversionistas = 18, asesores = 3. Filas vivas con `pilar IS NULL` = 0.
P2, P3, P4 y P6 quedan en 0 piezas: es el estado real, no un error.

**Bloqueo #8** se cierra en las filas 15-17 poniéndoles `pilar='P5'`. **No se les
toca `category`**: `category` es el eje que gobierna UI viva, y en ese eje
`Estilo de vida → null` sigue siendo la decisión correcta. Mover el pilar no exige
mover la categoría.

**Filas en papelera (8):** se dejan en `NULL`. Son duplicados de ISAI que están
borrados; clasificarlos afirmaría que forman parte de la taxonomía.

---

## 6. Filtros en `/es/blog`

Se extiende el mecanismo existente (`?categoria=` + `?pagina=` sobre
`searchParams`), no se construye otro.

- Params nuevos `?pilar=<slug>` y `?audiencia=<slug>`, combinables entre sí, con
  `?categoria=` y con `?pagina=`.
- `blogHref` en `src/lib/blog/blog-urls.ts` se extiende con orden estable
  (`categoria → pilar → audiencia → pagina`) y página 1 omitida, para que el
  canonical de una vista siga siendo byte-idéntico a su propio href.
- `BlogPagination` y el bloque de `generateMetadata` heredan el **estado completo**;
  si no, paginar pierde el filtro — el mismo fallo que documenta el comentario de
  `blog-urls.ts` sobre el tope escrito dos veces.
- `getBlogPosts` recibe `pilar` y `audiencia` opcionales. Ya acepta `categories`
  (plural) para el módulo de hubs, así que el patrón existe.
- `getBlogPilares(supabase, locale)`: pilares con ≥1 post publicado, análogo a
  `getBlogCategories`. **Hoy devuelve un solo pilar (P1)**, porque los 3 posts
  publicados en `es` son P1. Es correcto y honesto.
- Bloque estático **"los siete pilares"** que enlaza los siete hubs (5 existentes +
  2 nuevos) con independencia de si tienen posts. Es lo que cumple "cada pilar
  enlaza a su hub" sin crear vistas filtradas vacías e indexables.
- **Valor fuera del catálogo** (`?pilar=basura`): se ignora el filtro y la vista sale
  `robots: noindex, follow` con canonical a la URL limpia. No se usa `notFound()`
  para evitar el soft-404 por streaming que ya se diagnosticó en este sitio.

### Costo declarado, no escondido

Al conservar los dos ejes, `?categoria=Para Inversionistas` y
`?audiencia=inversionistas` devuelven casi el mismo set: dos facetas para un mismo
resultado. **No se toca el tratamiento SEO de `?categoria=`** porque su canonical
self-referencing se arregló deliberadamente en julio-2026 y revertirlo sería
reintroducir un bug cerrado. Queda como pendiente de Luis decidir si `?categoria=`
se retira como faceta pública. Exposición real hoy: 3 posts publicados, así que el
riesgo de índice es mínimo.

---

## 7. Verificación

Test antes del arreglo, y se comprueba **fallando** antes de escribir la
implementación.

| Gate | Comando | Por qué |
|---|---|---|
| Tipos | `npx tsc --noEmit` | `npm run build` pasa con errores de tipo y vitest no typechea |
| Unit | `npm run test:unit` (vitest 4) | |
| Build | `npm run build` | |

- `pilares.test.ts` (nuevo): 7 códigos, slugs únicos, roundtrip código↔slug, P7 con
  dos hubs, todo pilar con label en `es` **y** en `en`, toda ruta de `hubs`
  corresponde a una carpeta real de `src/app/[locale]/`.
- `hub-relacionado.test.ts`: el test mudado, verde sin cambios de expectativa —
  prueba que el renombre no cambió comportamiento.
- `blog-urls.test.ts`: orden de params estable, página 1 omitida, valor inválido
  ignorado.
- Sitemap: assert de las 4 URLs nuevas.
- **HTTP (código de estado, no contenido):** `/es/guias/fiscal-legal` y
  `/en/guias/fiscal-legal` → 200; ídem `costa`; `/es/guias/inventado` → **404 real**.
- **Playwright click-through en `/es/blog`:** clic en el chip de pilar y verificar
  que el grid re-renderiza y la URL lleva el param; combinar con `?pagina=`. `curl`
  y `grep` no ven un filtro que no re-renderiza.

---

## 8. Fuera de alcance

- **Los `pillar_url` de los briefs en el Hub.** Primero existe el hub, después se
  enlaza. P1-01 y P1-03 ya apuntan a `/es/guias/fiscal-legal` y dejan de ser enlace
  colgado en cuanto el hub exista; P1-02 sigue en `/es/como-comprar` como parche.
  Los reacomoda Luis.
- **`/es/financiamiento` y `/es/mercado`.** Marcados "corregir primero" en el maestro
  y bloqueos #4 y #3 en su §14. Aquí solo se enlazan. Si el trabajo llega a tocarlos,
  se para y se avisa.
- Los archivos sin commitear de Meta CAPI en el árbol (`src/app/api/track/`,
  `src/lib/meta/`, `.env.example`, `api/leads/route.ts`, `lib/analytics/track.ts`,
  `lib/leads/submit-lead.ts`).
- Deduplicación de las 11 filas de ISAI.
- El gate del art. 152 de P1-01.
- Exponer `pilar` / `audiencia` en la UI del Hub.
- P8 (Relocación y Vida), diferido a fase 2 por el maestro.

---

## 9. Pendientes con dueño

| # | Pendiente | Dueño |
|---|---|---|
| 1 | Deduplicar las 11 filas de ISAI y fijar cuál es el P1-02 canónico | Luis |
| 2 | Reacomodar los `pillar_url` de los briefs una vez exista el hub de P1 | Luis |
| 3 | Decidir si `?categoria=` se retira como faceta pública | Luis |
| 4 | El gate del art. 152 en una pieza YMYL ya publicada | Luis |
| 5 | Registrar `page.guias-fiscal-legal` y `page.guias-costa` en el Hub | Luis |
| 6 | Exponer `pilar` / `audiencia` en el editor de blog del Hub | Equipo web |
