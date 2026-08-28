# Next_Propyte_web — Task Manager

> Última actualización: 2026-08-26 — 🔴 **PR #58 VERDE y SIN MERGEAR**: consolida 8 bumps de dependabot + los iconos de marca vendorizados (lucide v1 los eliminó) + los dos jobs de CI que faltaban (`build` y `test:unit`). El merge lo denegó el clasificador — necesita el clic de Luis. `origin/main` = `084d76f` (#56). ⚠️ El `main` LOCAL sigue en `72fc1fa` y el árbol principal tiene trabajo ajeno sin commitear.
>
> Entrada anterior (2026-08-24) — 🚨 **la LP de lotes servía CERO formularios en producción durante 4 días; corregido y desplegado (#54).** Además entró la nueva LP corta `/lp/terrenos-playa-del-carmen` (#39, #53): ya hay dos landings listas para el A/B. `origin/main` = `8b1c8be`. ⚠️ El árbol principal sigue sucio, pero `LeadFormLotes.tsx` y `lotes-playa-del-carmen/page.tsx` **ya están versionados vía #54**: lo correcto es `git checkout --` esos dos y luego `pull`.
>
> **Entrada más reciente (2026-08-24): el flake de los dos escaneos de `src` está ARREGLADO y mergeado — `origin/main` = `646cae6`.** `nap.test.ts` y `provider-names.test.ts` ya NO se descartan como falso positivo: si fallan, es real. La E/S salió del `it` (se lee el árbol una vez a nivel de módulo), así que una caché fría ya no puede tumbarlos.
>
> Entrada anterior (2026-08-24): **teléfono del lead de reclutamiento arreglado y mergeado.** `origin/main` = `4615419`. ⚠️ El `main` LOCAL quedó 9 commits atrás (el árbol tiene trabajo ajeno sin commitear; un `checkout` se lo lleva).
>
> Entrada anterior (2026-08-21): precio por moneda `#36` mergeado, `main` era `72fc1fa`.
>
> 🔴 **Mergear DESPUÉS de `Propyte_hub#38`**, y esperar a que su build termine: los builds de Hostinger se matan entre ellos.
>
> El bug: `PriceDisplay` asumía que el monto **siempre** venía en pesos y sacaba la otra cara dividiendo por el tipo de cambio; `originalCurrency` sólo elegía cuál pintar grande. Un desarrollo cotizado en dólares daba dos cifras falsas a la vez. Y la ficha de desarrollo **ni pasaba esa prop**, así que caía al default `'MXN'` — de ahí el `$145,000 MXN` que reportó Luis.
>
> Contrato nuevo: `amount` + `currency` (la moneda DEL monto), **ambas obligatorias**. Sin default, porque el default era el bug. 17 sitios actualizados. `price.mxn` sigue llevando sólo pesos porque lo usan orden y filtros.
>
> 🐛 **Bug aparte, encontrado auditando los selects:** `getDeveloperDevelopments` pedía `min_price_mxn` y `price_mxn`, que **no existen** en `v_developments` (es `price_min_mxn`). PostgREST responde 42703, la función lo loguea y hace `return []`: **las páginas de desarrollador listaban cero desarrollos.** Arreglado en el mismo PR.
>
> 🧪 **Lección de verificación:** `curl` a una página con streaming devuelve el `loading.tsx` — 200, peso normal, sin `h1` y con las claves i18n crudas. Parece roto y no lo está. Para ver lo que ve el usuario, Playwright. Ver [[feedback_curl_devuelve_el_skeleton_no_la_pagina]].
>
> Detalle: [[project_precio_moneda_desarrollo]]

## 🔴 Pendiente prioritario — mergear la PR #58 (dependencias + CI)

**Está VERDE y `MERGEABLE/CLEAN`. El merge lo denegó el clasificador de permisos
(mergear aquí = desplegar a producción), así que necesita el clic de Luis.**

https://github.com/Propyte-Team/Next_Propyte_web/pull/58 · rama `chore/deps-batch-2026-08`

- [ ] 🔴 **Mergear #58 y cerrar las 10 PRs de dependabot.**
      ```bash
      gh pr merge 58 --squash --delete-branch
      for n in 42 43 44 45 46 47 48 50; do
        gh pr close $n --comment "Superseded by #58 — bump incluido y verificado ahí."
      done
      gh pr close 49 --comment "Bloqueada río arriba: typescript-eslint no soporta TS 7.0."
      gh pr close 41 --comment "Bloqueada río arriba: eslint-plugin-react dentro de eslint-config-next usa la API vieja de reglas."
      ```
- [ ] Retirar el worktree `_deps-review` después de mergear.

**Qué trae (8 bumps en UN solo merge — Hostinger compila en el servidor y sus
builds se matan entre ellos; 8 merges serían 8 builds simultáneos):**
vitest 4.1.11 · @next/bundle-analyzer 16.3.2 · @hookform/resolvers 5.9.1 ·
@supabase/ssr 0.12.4 · isomorphic-dompurify 3.22.0 (se conserva el pin exacto) ·
marked 18.0.10 · framer-motion 13.1.1 · lucide-react 1.33.0.

**🚨 Los dos huecos de CI que arregla** — `ci.yml` NO corría `next build` ni
`test:unit`. Como Hostinger compila en el servidor, un build roto llegaba a
producción con los checks en verde, y 356 tests en 36 archivos no se ejecutaban
en ninguna PR. Jobs `build` y `unit-tests` añadidos.

**Los iconos de marca** — lucide v1 los eliminó del paquete (Facebook,
Instagram, Linkedin, Twitter, Youtube). Rompía el build: el Footer los usa en el
pie de TODAS las páginas y `ShareDownloadModal` en los botones de compartir.
Vendorizados en `src/lib/brand-icons.tsx` con los `iconNode` literales de
lucide 0.577 y el `createLucideIcon` del propio paquete → render idéntico pixel
a pixel.

**Verificación (local, todo junto):** `tsc` 0 · eslint 0 errores · vitest 36
archivos / 356 tests PASS · `next build` con y **sin** secretos exit 0 ·
`next start` + curl `/es` 200 con `h1` y 2× JSON-LD · paths SVG vendorizados
presentes en el HTML del footer · playwright `@smoke` 25 pass / 1 fail
pre-existente.

### 🚫 Bloqueadas río arriba — no son arreglables aquí

- [ ] **#49** `typescript` 7.0.2 → `typescript-eslint does not support TS 7.0`.
- [ ] **#41** `eslint` 9→10 → `eslint-plugin-react`, dentro de
      `eslint-config-next`, usa la API vieja de reglas
      (`contextOrFilename.getFilename is not a function`). Además metía un bloque
      `engines` al lock que `package.json` no declara.

Dependabot las reabrirá solas cuando haya versiones compatibles.

### 🐛 Hallazgo aparte — un test que solo pasa en CI

- [ ] **`tests/e2e/smooth-scroll.spec.ts` falla en local** (Lenis +
      `prefers-reduced-motion`: espera `html.lenis` count 0 y encuentra alguno).
      **Control negativo hecho: reproduce idéntico en `origin/main` limpio**, sin
      ningún cambio de #58, y está **verde en CI Linux**. Pre-existente y
      local-only. Sospechoso: `reuseExistingServer: !process.env.CI` en
      `playwright.config.ts` hace que en local los tests corran contra cualquier
      dev server que ya esté en el 3000, incluido uno de otra rama.

### ⚠️ Nota de dependabot

`open-pull-requests-limit: 10` estaba **en el tope**: hay más actualizaciones
encoladas detrás. Al cerrar estas 10 van a aparecer las siguientes.

## 🔴 Pendiente prioritario — el push directo a Zoho falla 56% en `/unete`

Hallazgo lateral del arreglo del teléfono. **El fix de hoy salva el dato, no la demora:
los leads de reclutamiento siguen tardando hasta 58 min en llegarle al asesor.**

- [ ] 🔴 **Investigar por qué falla el push directo.** Prompt listo con hechos medidos,
      4 hipótesis con su prueba de falsación y las trampas del entorno:
      `C:\Users\ptoral\Desktop\prompt-investigacion-push-zoho.md`.
      Medido: 14 de 25 leads rescatados por el cron, **exclusivo de `affiliate_request`**
      (0/18 en los otros 7 forms), sin `zoho_sync_error` y sin patrón horario.
      Hipótesis principal: los aspirantes reaplican → `DUPLICATE_DATA` → `createNote`,
      dos llamadas encadenadas a Zoho en vez de una (`route.ts` ~206).
- [ ] ⚠️ **Auditar los demás campos por-formulario en la ruta del cron.** `rebuildPayload()`
      solo reconstruye `name/email/phone/message/property_id`. Sin verificar: `city`,
      `experience`, `interest`, `company`, `subject`, `budget`, `projectType`, `brokerType`.
      El teléfono fue el que se notó, no el único que se cae.
- [ ] La solución de fondo que el propio docstring propone: columna `form_data jsonb` con
      el body crudo, para que el reintento no adivine.

## Completadas — Flake de los escaneos de `src` (2026-08-24)

- [x] ✅ **Mergeado `646cae6`.** `withFileTypes` en vez de `statSync` por entrada, y el árbol
      se lee **una sola vez** a nivel de módulo en vez de una pasada por patrón.
      208 ms → 33 ms, pero lo que importa es que la región cronometrada quedó **libre de E/S**.
- [x] ✅ **Control negativo**: con un archivo que mete `AirDNA`, `Calle 5 Norte 95` y `77710`,
      los dos escaneos fallan y nombran el archivo exacto. Siguen midiendo.
- [x] ✅ 326/326 en tres corridas, eslint y `tsc --noEmit` limpios. Sin `next build`: son
      archivos de test, no código que se empaquete.
- [ ] ⚠️ **Sigue abierto el otro síntoma** (el `77710` reportado como hallazgo real en
      `e164680`) — ver la sección de SEO local / Maps.

## Completadas — Teléfono del lead de reclutamiento (2026-08-24)

- [x] ✅ **Fix mergeado a `main`** (`4615419`). Luis pidió «pon el teléfono obligatorio»;
      ya lo era y sí lo llenaban — los 38 leads traían teléfono en `public.leads`. Se
      perdía en el cron, que reconstruye el payload sin `whatsapp`, único campo que
      `field-maps.ts` leía para `affiliate_request`. Llegaba sin `Mobile` **y** sin `Phone`.
- [x] ✅ **12 leads rellenados en Zoho** con `trigger: []`. Verificado leyendo de vuelta:
      cero leads `[EMPLEO]` sin `Mobile`, contrastado con la consulta espejo.
- [x] ✅ Test de regresión que **da negativo contra el código viejo** (2 de 5 fallan ahí).
      325/325, `tsc --noEmit` y eslint limpios sobre `origin/main`.
- [ ] ⚠️ **El `next build` NO corrió sobre la base nueva** — el junction de `node_modules`
      revienta Turbopack. Se cubrió con `tsc --noEmit` + el build verde previo del mismo
      cambio. Si algo raro sale en prod, empezar por ahí.
- [x] Decisión de Luis: **no** se cierra la validación server-side de `/api/leads`. El
      endpoint está diseñado para nunca rechazar un lead y hoy nadie usa ese hueco.

## En progreso — Precio por moneda

- [x] ✅ **Mergeado** `e9172b6` (2026-08-21 17:17:42Z), 3 min antes del Hub `81ae37f`. Prod sin regresión; el deploy de la web NO se verificó de forma independiente (en un desarrollo en pesos la salida es idéntica antes y después).
- [ ] 🟡 **Ver la ficha cuando se publique la primera fila en USD.** Hoy no hay ninguna publicada, así que ese render nunca ha corrido en producción.
- [ ] ⚪ Las métricas de comparación (precio/m², ADR de zona) quedan como «no disponible» para un desarrollo en USD: están denominadas en pesos y no se les pasa el tipo de cambio. Decisión consciente, revisable si molesta.

## En progreso

### Ocupación TTM en /mercado (sesión 2026-08-20, 3ª)

- [ ] 🔴 **Aplicar la migración `20260820_zone_scores_ttm.sql`** — está escrita en `_mercado-ttm/supabase/migrations/` y **nunca aplicada**. Sin ella el pipeline real falla `PGRST204`. Es el primer paso de la secuencia.
- [ ] 🔴 **Correr el pipeline sin `--dry-run`** para poblar las 7 columnas nuevas. Solo después desplegar la web.
- [ ] **Commitear el arreglo del ADR de ciudad** — `city_adr_from_rows` + `tests/test_city_adr.py` están escritos y verdes (232) en `_mercado-ttm-pipeline` pero **sin commitear**.
- [ ] **Aplicar los 9 hallazgos restantes de la revisión final** (ninguno Critical). Los dos que importan: `identical_scores` falta en el union `OmissionReason` de TS (un pool entero mostraría `—` sin explicación), y `zone_clustering.py` sigue leyendo `median_occupancy`/`median_adr` que ya nadie escribe, así que clusteriza sobre valores congelados de febrero — y su `cluster_label` **sí se publica** en el filtro de `/zonas` y el badge de la ficha. Lista completa en el ledger.
- [ ] **Re-verificar el dry-run del ADR de ciudad** — falló con exit 255 (probable credencial; PowerShell 5.1 envuelve el stderr nativo). El cambio está probado unitariamente y toca una ruta disjunta de las cifras ya validadas, pero conviene confirmarlo.

### Dependabot / tooling (sesión 2026-08-18)

Los 12 PRs de Dependabot quedaron resueltos; el único abierto es **#32**, que es de una
persona. Lo que sigue pendiente de ese barrido:

- [x] ✅ **`sharp` 0.35.3 verificado en producción** (2026-08-18) — `/_next/image?url=…&w=32&q=75`
      devuelve **200 con `image/avif`**, que es `sharp` transcodificando en el Linux de
      Hostinger. Home 200 en 0.72 s, `/es/desarrollos` en 1.24 s. Era el único riesgo que la
      verificación local (Windows) no cubría. **Cerrado.**
- [x] ✅ **Comentarios de versión de los workflows corregidos** (2026-08-18, PR #34 → `7b4802e`)
      — los cuatro pins declaran su versión real; cero `# v5`/`# v6` en `main`. 🔑 **Se hizo
      SIN el scope `workflow`**: `git push` de archivos bajo `.github/workflows/` SÍ pasa con
      este token (`gist, read:org, repo`); el scope solo limita la **API de OAuth App**. La
      nota anterior que decía «requiere `gh auth refresh -s workflow`» era falsa. **Cerrado.**
- [ ] **Subir TypeScript 5.9.3 → 6.0.3** — verificado: compila limpio, 0 errores, coste cero
      de código. **NO intentar la 7**: `tsc` pasa pero rompe `eslint-config-next`.
      (Se cerró el PR #16 porque estaba en conflicto y dos majors atrás, no porque fuera mala.)
- [ ] **Subir `next` 16.2.6 → 16.3.1 junto con `@next/bundle-analyzer`** — por eso se cerró
      #15: el analyzer debe ir pegado a la versión de `next`, no suelto.
- [ ] **Decidir `@types/node`: quedó en `^26` pero el CI corre Node 22.** Los tipos van por
      delante del runtime — compila, pero deja usar APIs que en Node 22 no existen. El repo
      no tiene `.nvmrc` ni `engines`. Considerar alinear a `^22`.
- [ ] **Evaluar `framer-motion` 13.x** (major). Nos quedamos en 12.40.0 a propósito. Ojo: el
      SSR con `opacity:0` es frágil aquí — [[feedback_framer_ssr_opacity_cero_atascado]].
- [ ] **Revisar ESLint 10 solo cuando `eslint-plugin-react` publique una major.** Chequeo de
      5 s: `npm view eslint-plugin-react@latest peerDependencies` y
      `npm view eslint-config-next@latest dependencies | grep react`.
- [ ] **Borrar `~/Projects/_deps-bump`** — quedó vacía pero con un handle abierto de otro
      proceso. **No matar los ~65 procesos `node`**: son de sesiones paralelas.

### LP Lotes PdC — arquitectura de persuasión, handoff 2026-08-13 (sesión 2026-08-13)

> Rama `feat/lp-lotes-trustbar`, basada en `origin/main` (`245328c`). **Todo sin commitear.**
> `tsc --noEmit` limpio · `npm run build` verde · verificado en navegador (desktop 1440 + móvil 390).

Fuente: `HANDOFF-lp-lotes-playa-del-carmen.md`. Ojo: el handoff describe un estado
**anterior** a `245328c`. P1.1 (hero desintoxicado), y las partes de P2.3/P3.1 sobre el
formulario al final, ya estaban resueltas antes de empezar.

**Hecho — P1.2 · badge de escasez**
- `_components/AvailabilityBadge.tsx` nuevo. Pill con superficie propia (fondo al 92% +
  ring terracota): sobre el hero el fondo es una foto, así el contraste deja de depender
  del encuadre. 4.6:1 incluso contra blanco puro. Fecha desde `lote.fechaCorte`.
- Instanciado en hero y en cierre. Legible en 390px sin zoom (verificado).

**Hecho — P1.3 · barra de credibilidad**
- `_components/TrustBar.tsx` nuevo. Va tras la banda de cifras, no pegado al hero: las
  cifras son la segunda respiración del titular. **212px** en desktop (criterio ≤280),
  2×2 en 390px. Cuatro celdas, cada una enlace completo.
- Oficina y asesor se leen del Hub; si faltan, la reja se recompone (sin huecos vacíos).
- `#comprobar` y `#urbanizacion` **no existían** — el handoff los daba por hechos. Creadas
  como constantes exportadas con `scroll-mt`, igual que `ANCLA_GATES`. Las 4 anclas resuelven.

**Descartado por decisión de Luis — los 2 testimonios de P1.3.** Los de la home dicen «25%
de plusvalía» y «generando ingresos en Airbnb»; el pie legal de esta LP declara que no
publica proyecciones de plusvalía ni rendimiento, y «Para quién no es» dice que un terreno
no da renta. Además llevan sello «Verificado» sin nada verificable. **No se ponen.**

**Hecho — tipografía de headings, acotada a la LP**
`globals.css` declaraba `:where(h1…h6)` **fuera de `@layer`**. Como `@import "tailwindcss"`
mete las utilities en capas, y una declaración sin capa gana a cualquiera en capa *antes* de
comparar especificidad, ningún `text-*` / `font-*` / `leading-*` surtía efecto en un heading
**de todo el sitio**.

Se midieron 406 headings en 14 rutas, antes y después, para no tocar a ciegas:
- **Fix en la raíz (`@layer base`): mueve 369 de 406.** A mejor los H1 de las interiores
  (56→72px) y el «Tu privacidad» del CookieBanner (36→14px, hoy inflado en todas las rutas);
  a peor el H1 de la home, que cae a **16px**, y el de `/propiedades`. Exige revisar ~15
  headings a mano. **NO aplicado — pendiente de decidir.**
- **Aplicado: `:where(h1:not(.lp-root *), .h1)`**, la exclusión dentro del `:where()` para no
  alterar la especificidad. Verificado: **cambian 24 headings, los 24 en la LP; los otros 382
  intactos.** Los H2 pasan a sus 44px y las etiquetas de `#comprobar` a 11px en DM Sans.
  Validado visualmente en desktop y 390px.

⚠️ Al medir, correr **siempre** con `.next` borrado y el dev server reiniciado: con caché
caliente Turbopack sirve la hoja vieja y la nueva a la vez y el diff da «0 cambios» —
falso negativo perfecto. Harness (`.headings-audit.mjs` / `-diff` / `-probe`) en el
scratchpad de la sesión. Detalle en `feedback_headings_unlayered_pisan_tailwind.md`.

**⚠️ Contaminación de rama.** Otra sesión commiteó `049ebf8` (fix de UTMs) en
`feat/lp-lotes-trustbar` en vez de en `fix/utm-sanitize-no-tumbar-lead`. Si se abre PR de
esta rama, va incluido. Sin mover: esa sesión puede seguir activa.

**Hecho — P1.1 (resto)** · El párrafo de resumen SEO sale del hero y baja a
`QueEstasComprando`, que es donde el visitante ya se pregunta qué compra. No se borró:
la afirmación que hace trabajo —propiedad privada, no ejidal— sigue publicada.

**Hecho — P1.4 · etiquetado de imágenes**
`Figure.tsx` nuevo, con `caption` **obligatorio en el tipo** (si falta, falla el build) y
prefijo canónico puesto por el componente, no por quien lo llama. `ImagenLanding` gana
`tipo: 'render' | 'foto'` y `caption`, declarados en `IMAGENES_CURADAS`.
⚠️ El handoff decía que la aérea era la única CON caption. Es al revés: el render de las
canchas lo tenía y **la fotografía real del polígono —el activo más creíble— no**. Ahora
las 4 están rotuladas; el hero lleva el suyo al pie (es fondo, no cabe en un `<figure>`).
Verificado en navegador: 3 figcaptions + el rótulo del hero, y las 7 imágenes cargan.

**Hecho — P2.2 · los «Falta confirmar» vacíos**
`PendingStatus.tsx` nuevo: estado «En trámite» + título + porqué + **fecha de verificación**
+ CTA. `LicenciaDesarrollo` pasa a dos estados: reja de 4 campos cuando los datos existan,
un solo estado con dueño y fecha mientras no. Se acabó la tabla de cuatro huecos. El
incumplimiento del art. 69 se sigue publicando — omitirlo sería incumplir en silencio.

**Hecho — P2.4 · jerarquía CTA.** Medido en navegador: **WhatsApp bajó de 4 a 2**, enlaces
a `#solicitar` = 5. Eliminado el WhatsApp suelto de `UnDomingoAqui` (que además estaba
sobre fondo claro, donde el componente ni tenía estilo); el CTA del comparador pasa a
contorno. `WhatsAppCta` arrastraba clases de la paleta ANTERIOR (`aqua-bright`,
`bg-whatsapp`) que no existen en el tema de la LP: reescrito con los tokens reales.

**Hecho — P3.4 · barra fija móvil.** Precio total primario + mensualidad secundaria + un
solo CTA; fuera el WhatsApp. Aparece pasado el 20% de scroll y se retira cuando
`#solicitar` entra en viewport (IntersectionObserver). Verificado: oculta en el hero →
visible al 45% → oculta con el formulario a la vista. Tap target 48px, `safe-area-inset`.

**P3.1 — el handoff parte de una premisa falsa.** Dice que el calculador «aparece dos veces
con la misma UI y las mismas cifras». No es cierto: `ComparadorLotes` muestra OTROS lotes,
con modelo de datos distinto (`LoteComparable`, descuento por plazo, `contraentregaVia`,
apartado). Fusionarlos exigiría unificar dos modelos y arriesgar el comparador recién
aprobado. Lo que **sí** estaba duplicado palabra por palabra es el disclaimer de «no es
tabla de amortización»: extraído a `DisclaimerCifras` en `ui.tsx` y usado en ambos.

**Hecho fuera del handoff — `wbraid` (a petición de Luis).** Añadido a `TRACKED_KEYS` y a
`CapturedUTMs` en `useUTMCapture.ts`. Google lo manda EN LUGAR DE `gclid` cuando el
visitante rechaza cookies (típicamente iOS); sin él esos leads llegaban sin atribución
ninguna, y afecta a `/es/desarrolladores`, donde apunta la otra campaña. El resto de la
cadena ya lo esperaba (schema de `/api/leads` + `field-maps`). Verificado que `submitLead`
hace `...utms` (spread), así que no hay que tocar ningún formulario.
⚠️ Llega a **Zoho**, no a Supabase: falta la columna `wbraid` en `public.leads` (migración
pendiente, anotada en `specs/lp-lotes-playa-del-carmen.md`).

**Hecho — P2.1 · «Antes de firmar: lo que debes saber»** (+ P4.1 en lo que dependía de él)
`DisclosureModule.tsx` agrupa los cinco bloques de riesgo en **`<details>` nativos**. Los
cinco contenidos van íntegros; lo que se fue es el peaje de scroll.
- **Medido: 1334 px con un panel abierto vs 3577 px con los cinco → 62.7% de reducción**
  (criterio del handoff: ≥60%). Página completa 11 072 px.
- **Contenido en el HTML servido**, verificado por `curl` sin JS: «certeza jurídica
  absoluta», «artículo 69», «cargo indexado», «no es tu producto», «ningún servicio
  conectado», «condiciones de devolución del apartado» — todas presentes. Nada se esconde
  detrás del JS ni desaparece para un crawler.
- **Las 5 anclas abren su panel**: `#urbanizacion`, `#falta-confirmar`, `#juridico`,
  `#costos`, `#para-quien-no-es`. Lo hace `AbrirPanelPorHash` (client, ~40 líneas): CSS no
  puede abrir un `<details>` por hash y `:target` no toca el atributo `open`. Escucha
  `hashchange` además del montaje, porque los enlaces internos no recargan.
- **Los resúmenes del `summary` se CALCULAN** («5 servicios · ninguno conectado hoy», «3
  datos en trámite», «5 conceptos adicionales»). Por eso se exporta
  `construirPendientes`: un número a mano se desincroniza el día que el Hub publique la
  tasa, y un resumen que miente en el bloque de la honestidad es el peor error posible.
- Panel 1 abierto por defecto: un módulo con los cinco cerrados se lee como la caja donde
  escondimos las malas noticias.
- **El contraargumento queda FUERA** del acordeón, a ancho completo y después del módulo,
  como pide el handoff.

Refactor que exigió: `UrbanizacionReal`, `LoQueFaltaConfirmar` y `CostosNoIncluidos` pasan
a contenido puro (sin `<section>`/`TituloSeccion`/fondo); `CostosNoIncluidos` adaptado a
tono oscuro. Extraídos de `page.tsx` a componentes propios: `SituacionJuridica.tsx` y
`ParaQuienNoEs.tsx` — eran ~200 líneas de JSX jurídico inline que hacían del reordenado un
ejercicio de mover llaves. `page.tsx` baja de ~660 a ~470 líneas.

⚠️ La aérea del panel 1 es `loading="lazy"` y vive a ~5000 px de scroll: hay un instante de
hueco al llegar. **No es un bug** —el espacio está reservado, CLS 0— pero conviene saberlo
antes de reportarlo como tal. Dentro de un `<details>` cerrado el navegador no carga las
lazy; hoy solo el panel 1 tiene imagen y está abierto por defecto.

**🚨 Corregido — el badge afirmaba una escasez falsa (lo detectó Luis viendo la página)**
Decía **«Uno disponible»**, escrito a mano porque `v_units` devuelve UNA fila para este
desarrollo. Pero esa fila es un **TIPO** de lote («Lote Residencial en comunidad privada»,
129.6 m²), no un lote concreto: el desarrollador declara **229 disponibles de 310**, y el
estado del registro es **«Preventa»**, no «Disponible». La página afirmaba escasez con un
factor de error de 229, en el pixel más caro de una landing cuya tesis es no fabricar
urgencia. Yo además le había subido el contraste en P1.2 sin comprobar de dónde salía el
número. Ahora lee `v_developments.available_units` + `status` y publica
`Preventa · 229 lotes disponibles según el desarrollador · Al 13 de agosto de 2026`.
Detalle en `feedback_un_registro_v_units_no_es_una_unidad_disponible.md`.

**⚠️ `origin/main` avanzó durante la sesión.** Otra sesión pusheó el fix de `wbraid`
(`93ec2ee`) además de `e56fb48` y `a313bb2`. **Mi cambio local en `useUTMCapture.ts` es
funcionalmente idéntico al de main y solo difiere en comentarios**: hay que descartarlo
(`git checkout origin/main -- src/hooks/useUTMCapture.ts`) o dará conflicto al integrar.
El clasificador de permisos bloqueó esa operación, así que **queda pendiente de hacer a
mano**. Conviene rebasar la rama sobre `origin/main` antes de seguir.

**Hecho — P2.3 · formulario de 2 pasos**
⚠️ Otra premisa desactualizada: el handoff describe el stepper «¿Qué estás buscando? 1/3»
como un qualifier huérfano «tirado entre el bloque de pagos y la ficha técnica». **Es el
propio formulario**, que ya vivía en el aside sticky. No había nada que absorber.

Lo aplicable sí se hizo — de 3 pasos a 2:
- **Eliminado el paso del presupuesto** (4 rangos). Era el único que no producía ni
  contacto ni intención, y llegaba justo después de que el visitante ya hubiera invertido
  un tap: el punto de abandono más caro. El asesor lo pregunta en WhatsApp, donde cuesta
  cero, y la página ya publica precio + gastos de cierre + cargos únicos, así que el
  visitante se autofiltra mejor que con cuatro rangos.
- **El plazo (48/60) lo sustituye como señal de calificación**: cambia de verdad la
  conversación, se contesta con un tap y va dentro del paso donde ya está escribiendo.
- Paso 2 = **3 campos** (nombre · WhatsApp · plazo). Email **colapsado** tras «Prefiero
  que me lo manden por email».
- «Qué pasa cuando envías» **debajo** del botón, no encima: encima es una lista de
  requisitos antes de actuar, debajo es lo que recibes por haber actuado.
- Payload con `loteRef` (slug), plazo e intención → el lead llega al CRM ya calificado.

**Verificado:** con JS deshabilitado, `#solicitar` y las 3 opciones del paso 1 **están en
el HTML servido**. Con JS: indicador 1/2 → 2/2, 3 campos, email colapsado. Build exit 0.

✅ **`tiempoRespuesta` = «el mismo día hábil», CONFIRMADO por Luis (2026-08-13).** Es un
compromiso de negocio, no copy: aparece dos veces de cara al cliente. Vive en una sola prop
de `LeadFormLotes`.

**Hecho — P4.1 · orden de secciones**
Al medir el DOM contra la secuencia objetivo del handoff, **13 de los 14 puntos alcanzables
ya coincidían**. Lo único que faltaba de verdad era agrupar las amenidades:
- **Amenidades en tres territorios** (`QueEstasComprando`): «Para los que viven contigo»
  (alberca · jardín · cancha · área de niños) · «Para dormir tranquilo» (seguridad 24h ·
  CCTV · acceso controlado) · «Para el día a día» (gimnasio · salón de eventos · pet zone).
  El copy de cada amenidad NO se tocó, como pide el handoff: la lista ya estaba bien
  escrita, lo que faltaba era el orden. Once seguidas obligan a leerlas todas para saber si
  hay alguna que te importe.
- El punto 10 «Cómo leer este precio» ya existía dentro de `FichaLote`.
- El formulario ya cae en el punto 08 del DOM (verificado): en móvil aparece justo tras
  «Cómo se paga»; en desktop es el aside sticky de ese mismo bloque.

**Divergencia deliberada del handoff:** el comparador se queda **DESPUÉS** del cierre, no
en el punto 15. El handoff lo pone antes, pero el razonamiento ya documentado en
`ComparadorLotes` es mejor y no lo rebate: la página no tiene rutas de salida a propósito;
poner alternativas antes del cierre desvía a quien iba a convertir, mientras que después
captura a quien ya decidió que este lote no era el suyo.

**Hecho — P4.2 · espejo indexable: YA EXISTÍA, no había que construirlo**
La unidad está publicada y aprobada, y su desarrollo también. Verificado **en producción**:
`/es/propiedades/lote-residencial-en-comunidad-privada` y
`/es/desarrollos/terrenos-residenciales-con-amenidades-en-playa-del-carmen` responden 200,
**sin `noindex`** y con canonical propio correcto. El `noindex, nofollow` que se ve en local
es artefacto del entorno (su canonical apunta a `dev.propyte.com`). Crear una tercera página
del mismo lote habría sido exactamente el duplicado que el handoff quería evitar.
⚠️ Ojo: el handoff pide el espejo en `/es/desarrollos/lote-residencial-…`, pero ese slug es
de UNIDAD; la ruta de unidades es `/es/propiedades/…`.

**NO aplicado a propósito — el `canonical` de la LP al espejo.** La LP es `noindex, follow`,
y combinar `noindex` con `canonical` a otra URL son señales contradictorias: una dice «no
indexes esto», la otra «consolida en aquello». Google lo desaconseja y el riesgo documentado
es que el `noindex` se propague a la URL canónica — desindexando la página que SÍ rankea. La
LP ya hace lo correcto: no se indexa y el `follow` deja pasar autoridad. **Decisión de Luis.**

**Hecho — P3.3 · tipografía** (`9cff77d`), medido en navegador, no leído del JSX:
- 🚨 **La prosa se leía a 34 caracteres por línea.** `QueEstasComprando` abría un grid de
  texto + imagen DENTRO de la columna izquierda de la página, que ya mide ~550px porque el
  formulario ocupa la derecha: la prosa quedaba en **276px**, con la imagen al lado y un
  hueco muerto debajo. Apilado → **550px ≈ 68ch**, dentro del objetivo 65–75.
- **7 cifras sin `tabular-nums`** → 0. Las 4 opciones del comparador eran las que más
  dolían: son precios que se apilan para compararse y no cuadraban entre sí.
- **La interlínea ya era 1.63** (objetivo 1.65). No se tocó.
- **El formato de moneda NO estaba mezclado.** `mxn()` sin decimales para totales y
  `mxnExacto()` con dos solo para el precio por m² ya era la regla y se cumple; los únicos
  montos con decimales de la página son los $7,800.00 del m². El handoff lo señalaba como
  inconsistencia y no lo es.

**Hecho — `MXN` en toda cifra de dinero** (`35ffc41`, en prod, CDN 12/12)
`Intl` con locale es-MX rinde `$1,010,880`: **el mismo símbolo que el dólar**. Esta página
vende a compradores de EE.UU. y Canadá —ella misma explica el fideicomiso para extranjeros
en zona restringida—, así que un `$` desnudo en un lote de siete cifras es una ambigüedad
de 20× a nuestro favor. Estaba escrito **a mano en 7 sitios** y faltaba justo en el hero,
el plan de pagos, el comparador y la barra fija. Ahora vive en `format.ts` (`mxn()` y
`mxnExacto()` lo incluyen; queda `mxnDesnudo()` para cuando la unidad ya está al lado) y en
`construirEtiqueta` del comparador. Verificado en 390px: sin recortes ni scroll horizontal.

**P3.2 — MEDIDO, no hecho.** El comparador A/B de la home manda los DOS árboles y CSS
oculta uno: desktop 30.3 KB / 249 nodos · móvil **36.6 KB / 325 nodos**. En 1440px sobra el
móvil = **6.4% del HTML** de la home (574 KB). El handoff acierta en el impacto, pero el
arreglo obliga a rediseñar el layout desktop con el markup del móvil en un componente de
**909 líneas de la página principal**; `useMediaQuery` no sirve (en SSR no hay viewport →
mismatch de hidratación o flash). **Merece su propio ciclo con revisión visual.**
⚠️ La primera medición dio «0.9%» porque el selector por clase cogió un fragmento
incompleto. Localizar los árboles **por contenido**, no por clase.

**Fix global de headings — NO aplicado.** Cambia 369 headings del sitio entero: es un
cambio estético masivo que nadie habría revisado antes de salir a producción. Requiere que
Luis lo vea. Ver `feedback_headings_unlayered_pisan_tailwind.md`.

**Pendiente del handoff:**
- **P2.5 LocationMap** — **bloqueada**: necesita un asset de mapa estático que no existe.
- **P4.2 espejo indexable** en `/es/desarrollos/…` + canonical.
- **P3.2** (comparador duplicado de la home) y **P3.3** (medida de lectura y `tabular-nums`;
  el fix de headings lo desbloquea).

---

### LP Lotes Playa del Carmen — rediseño visual (sesión 2026-08-12)

> Rama `feat/lp-lotes-pdc`. Capa de emoción commiteada (`b6a3021`); **el rediseño visual está SIN COMMITEAR**. Typecheck limpio, `npm run build` verde, verificado en navegador. `main` intacto.

Luis: «es feo feo feo, el contenido creo que está bien». Alcance acordado: solo la LP, paleta incluida.

- [x] Tema confinado en `src/app/lp/lp-theme.css` bajo `.lp-root`. `/lp` cuelga fuera de `[locale]` con layout propio ⇒ ningún token puede tocar propyte.com.
- [x] Acento único terracota `#a8402a`, derivado de los muros del propio desarrollo (toda la fotografía es hora dorada; el aztec frío hacía que las imágenes se vieran pegadas).
- [x] Newsreader (next/font) para titulares vía `.lp-display`.
- [x] Gates: de chips ámbar a tinta apagada con subrayado punteado. El ámbar los hacía leer como errores de validación.
- [x] Amenidades: de 11 filas con hairline a 2 columnas (se comían el 20% del scroll).
- [x] Hero: imagen a sangre + degradado, 4 elementos. Las cifras bajaron a banda propia.
- [x] 128 reemplazos de tokens heredados en 12 archivos. Cero residuo de teal/aztec/navy/graphite, banner de consentimiento incluido.
- [x] **Commitear el rediseño** — `bc1e15e` (16 archivos).
- [x] **Deploy a `main`** — `8b87115`, fast-forward desde `eb954ff`. Verificado en producción. El push directo a `main` lo bloquea el clasificador de permisos hasta que Luis lo reafirma.
- [ ] Distribuir más imágenes: hay 10 verificadas como seguras y la página usa 5.
- [ ] Assets que no existen en la base: masterplan con el lote marcado, casa comparable de 207 m². Trabajo de Victor.

- [x] Fix de la imagen en «Qué estás comprando»: tenía `lg:aspect-auto lg:min-h-[360px]` dentro de un grid, así que la celda se estiraba a la altura de la columna de texto y `object-cover` recortaba el centro de un render horizontal (se veían árboles desenfocados). Ahora `<figure>` con relación fija 4/3, `self-start`, sticky en desktop y pie de foto.

### Pedidos nuevos de Luis (2026-08-12) — 2 de 3 hechos

- [x] **Chips de opciones de plazo seleccionables** — `f786a14`. `SelectorPlazo.tsx` es lo único que se hidrata y recibe las opciones ya calculadas: ninguna aritmética de dinero cruza al cliente. Radios nativos `sr-only` + `peer-checked` (teclado y anuncio gratis) y `aria-live` en la cifra. Default al plazo más largo, que es la cifra que ya publica el hero. Verificado en navegador: 60 m → $10,280/59 pagos, 48 m → $12,905/47 pagos.
- [x] **Simulador de financiamiento con selección de desarrollo** — `0dacbda`. Ver la sección de datos abajo: cambió el diagnóstico entero.
- [ ] **Formulario como punto focal.** Hoy vive en columna lateral a media página. **Esperando 2-3 referencias de Luis**: «punto focal» admite lecturas muy distintas (sobre el hero / banda a ancho completo / panel fijo que acompaña scroll / modal desde el CTA) y cada una cambia estructura y medición.

### Datos de financiamiento de los 4 lotes de PdC — verificado 2026-08-12

⚠️ **La hipótesis del gate de herencia era FALSA.** Los otros 3 sí tienen `financiamiento_propio = false`, pero poner el flag en `true` no habría arreglado nada: sus unidades tienen los `ext_*` vacíos. No era un gate mal puesto, el dato vive en el DESARROLLO. Ver [[feedback_hub_financiamiento_tres_fuentes]].

**El Hub captura las condiciones de pago en TRES lugares y cada desarrollo usa uno:**

| | Fuente | Plazos | Mensualidad |
|---|---|---|---|
| 130 m² · $1,010,880 (este) | `ext_*` de la unidad | 48/60 (47/59 pagos) | $12,905 / $10,280 |
| 200 m² · $1,599,840 | **`ext_esquema_pago` en PROSA** del desarrollo | 36 + apartado $25,000 | $26,664 |
| 180 m² · $1,854,518 | `esquemas_pago` JSONB | 12/24/36/48 con descuento | $48,571 … $15,454 |
| 240 m² · $2,136,000 | `esquemas_pago` (solo contado) | — | gate: 90% al firmar + 10% contra entrega |

**Yo reporté que 2 no tenían plan y Luis me corrigió: son 3 de 4.** El de 200 m² tiene su plan a 36 meses escrito en una cadena de texto (`"Preventa: apartado $25,000, enganche 20%, 60% durante obra en 36 meses, 20% contra entrega · Contado: …"`), no en el JSONB estructurado. Contar fuentes estructuradas no es contar datos.

🚨 **El precio del de 180 m² es función del plazo.** `ext_precio_min_mxn` del desarrollo = $1,854,518.40 (lista), pero `v_units.price_mxn` publica $1,457,121.60 = lista − 21.4286%, **el precio del plazo de 12 meses**. A 48 meses el descuento es 0% y vuelve a la lista. Calcular una mensualidad de 48 meses sobre `price_mxn` publicaría una cifra que no existe. El módulo reconstruye la lista y la **valida contra el mínimo declarado** (tolerancia 0.5%); si no cuadra, gate.

Otros dos hechos que corrigen la tabla vieja: cada desarrollo tiene **1 sola unidad** en la base (92/310/422/403 son `unidades_totales`, campo declarativo), y `v_units.area_m2` viene NULL en el de 240 m² — el dato está en `superficie_terreno_m2`, de donde se rescata.

- [ ] **Opcional, mejora de dato:** capturar el esquema del lote de 200 m² en `esquemas_pago` estructurado, para no depender del parser de prosa. Requiere UPDATE a prod y por tanto autorización de Luis. El parser funciona y tiene gate, así que no es urgente.

**RESUELTO 2026-08-12 — «que vean que tenemos varios Lotes».** El comparador publica las 4 opciones de PdC después del CTA de cierre. Hay **5 desarrollos de Lotes publicados**, verificado por Luis en el sitio vivo (`/es/desarrollos` filtrado por Terreno = 5 resultados).

⚠️ **Yo reporté que solo había 1 y estaba equivocado.** Mi consulta filtraba de más; NO reutilizarla. Para contar lotes, replicar el filtro que usa `/desarrollos` o contar contra el sitio. Recordar `feedback_v_units_terreno_query_capitalizada`: Arrecifes usa `unit_type = 'Lote'` + `'Preventa'`, no `'Terreno'`/`'Disponible'`.

**Decisión de Luis: EXCLUIR el de Tulum.** La LP es campaña de Playa del Carmen. Quedan 4 opciones (inventario INTERNO, los nombres NUNCA van a la LP):

| Ubicación | Desde | Sup. mín | Unidades | Etapa |
|---|---|---|---|---|
| Playa del Carmen | $2,136,000 | 240 m² | 92 | Entrega inmediata |
| Arrecifes, PdC (**este lote**) | $1,010,880 | 130 m² | 310 | Preventa, 2030 |
| Maroma, PdC | $1,599,840 | 200 m² | 422 | Preventa, F1 2027 F2 2028 F3 2029 |
| Arrecifes, PdC | $1,854,518 | 180 m² | 403 | Preventa, 2026-12-15 |

Rango $1.0M–$2.1M y 130–240 m². **Etiquetado resuelto y aplicado:** ubicación + superficie + precio desde («Playa del Carmen · 240 m² · desde $2,136,000»), cero nombres comerciales. **Ubicación resuelta:** después del CTA de cierre, como se había decidido. Ojo: el precio «desde» del de 180 m² en esta tabla ($1,854,518) es el de LISTA y es el correcto; el $1,457,121.60 que publica `v_units` es el del plazo de 12 meses.



### Tracking — Meta Pixel (sesión 2026-06-01)

> ✅ Píxel `808922354003079` instalado en `src/app/layout.tsx` (commit `0c50f22` en `main`), **live y disparando PageView** en propyte.com. Solo PageView porque el sitio sigue en coming-soon.

- [ ] **Cuando se publiquen las páginas reales** (financiamiento, contacto, etc., hoy en coming-soon): agregar eventos de conversión del píxel (`Lead`/`Contact`) en los formularios. Recién entonces se puede armar campaña Meta optimizada por píxel web (A/B vs formulario nativo). Ver memoria `project_next_propyte_web_pixel_comingsoon`.
- [ ] **Verificar CAPI** en Events Manager (server-side) para el píxel `808922354003079` — no verificable por MCP ni navegador.

### Iconos infografía + rediseño tags descuento (sesión 2026-06-01)

> ✅ Deployado a `dev.propyte.com` (`dpl_62pk2AkUjF3`) y **aprobado visualmente por Luis**. 5 archivos. Branch: `feat/editorial-markdown-render`.

- [ ] **Commit del bundle de hoy** — 5 archivos uncommitted: `components/home/ProcessInfographic.tsx`, `components/ui/DiscountBadge.tsx`, `components/property/DevelopmentKeyData.tsx`, `components/property/FloatingKeyData.tsx`, `app/[locale]/desarrollos/_components/DevelopmentDetailPage.tsx`. Decisión Luis: commit local en `feat/editorial-markdown-render` o cherry-pick chico a `develop`.
- [ ] **(Opcional)** Label panel DATOS CLAVE dice "Descuento" con valor "−N%"; para desarrollos es "hasta -N% en unidades". Luis lo dejó así; cambiar a "Desc. en unidades"/"Hasta" si después lo pide.

### DiscountBadge — iconos descuento (sesión 2026-05-28) — ✅ validado e iterado 2026-06-01

> Validación visual de Luis: **OK** (la iteración de 2026-06-01 la reemplazó/mejoró — galería a #5CE0D2, precio a tag_2_2). Commit sigue pendiente junto con el bundle de hoy.

- [ ] **(Long-tail)** Cuando `html-encoding-sniffer` saque versión ESM-compatible, considerar volver a `isomorphic-dompurify@^3.x`. No urgente, 2.20 funciona bien.

### Spec UI Fixes Bundle 2026-05-23 — pendientes residuales

> Spec `specs/ui-fixes-bundle-2026-05-23.md` ejecutado al 95%. Working tree con cambios uncommitted en develop (3 deploys CLI a Vercel prod = `dev.propyte.com`). Falta promoción a producción.

- [ ] **Commit a `develop`** — working tree todavía uncommitted. Files: `PriceDisplay.tsx`, `FloatingKeyData.tsx`, `DevelopmentKeyData.tsx`, `promociones/page.tsx`, `i18n/messages/{es,en}.json`, `CurrencyContext.tsx`, `FilterBar.tsx`, `MarketplaceCard.tsx`, `MortgageCalculator.tsx`, `InvestmentComparison.tsx`, `vacacional/ComparisonTable.tsx`, `ComparePanel.tsx`, `WhatsAppButton.tsx`, `useFilters.ts`, `CookieBanner.tsx`. **Eliminado**: `src/components/ui/CurrencyToggle.tsx`.
- [ ] **Z.4 Pedir autorización Luis merge `develop → main`** — Hostinger pull. Deuda acumulada considerable: image proxy + rich content + iconos v3 + Banxico + filtros + soft-delete gate + slug redirects + UI bundle 2026-05-23.
- [ ] **A.x Limpieza debug instrumentation** — `src/hooks/useFilters.ts` tiene logging gated por `localStorage.debug_filters === '1'`. Zero-cost en prod pero opcional removerlo. Decisión Luis: keep o remove.
- [ ] **F.2/F.5 Playwright audit** (defer) — capturar screenshots de surfaces con `PriceDisplay` (StickyBar, MobileContactBar, ShareDownloadModal) y propagar `tone='dark'` si aplica.
- [ ] **A.x Replicar fix dropdown** — verificar que ningún otro componente con `overflow-x-auto` tenga el mismo bug (Cards de Home con scroll horizontal? sliders?).

---

### Image Proxy /propyte-media — auditoría seguridad residual (sesión 2026-05-22)

> Commit `7bae658` deployado y validado en `dev.propyte.com` (audit Playwright 2026-05-22: 440 URLs via proxy, 0 leaks Supabase). Lo único que queda es la auditoría de seguridad real (el proxy es solo cosmético).

- [ ] **Auditar seguridad real Supabase** (lo más importante; el proxy es solo cosmético):
  - Ejecutar `mcp__claude_ai_Supabase__get_advisors type=security` → lista tablas sin RLS
  - Verificar bucket policies de `property-images` (SELECT público, INSERT/UPDATE/DELETE auth)
  - Grep repo para confirmar `service_role` NO está en bundle cliente
  - O simplemente correr `/cyber-neo`
- [ ] **Decidir extender proxy a otros buckets** (esperar decisión Luis) — candidatos: `developer-logos` (logos en home, 1 hit residual), `v_team_members.photo_url`, blog `featured_image`, case studies `image_url`. Patrón en `src/app/propyte-media/[type]/[id]/[idx]/route.ts`. Añadir type='l' (logo), type='t' (team) etc.

### Auditoría de mappers — lección 2026-05-21

> El fix CORASOL reveló un patrón de bug: mappers que sobreescriben campos editoriales con concat fallback. Hay que auditar el resto antes de declarar otros casos como "cache stale".

- [ ] **Auditar mappers restantes** por el mismo patrón `field ? \`${a} — ${b}\` : title`:
  - `src/lib/mappers/development-to-property.ts` (líneas con `publication_title`) — revisar si hay concat similar
  - `src/lib/schema/*.ts` (SchemaMarkup builders) — JSON-LD puede tener su propia lógica
  - `src/app/[locale]/desarrollos/_components/buildDetailMetadata.ts`
  - `src/app/[locale]/propiedades/page.tsx` (listings) — qué campo muestra en card title
  - `src/components/property/UnitDetailPage.tsx` h1
  - Componentes de listings (SimilarListings, etc.)
- [ ] **Verificar 8 columnas Migration 022 NO se pisan** en consumers: `content_features_es/en`, `content_location_es/en`, `content_lifestyle_es/en`, `faq_es/en` deben ganar sobre el fallback al JSONB `ext_content_es -> features ->> body`. Mapper de richContent ya debería respetarlo (Property.richContent) pero confirmar.
- [ ] **Mergear fix mapper a `main`** si decides promover producción — actualmente solo en `develop` + `dev.propyte.com`.

### Continuación previa (siguen pendientes)

- [ ] **`feat/dynamic-content-a1-pulido`** — 2 commits ahead de develop (`78896e0` hub-content tags + `f54597f` A.1 banners home). Workstream Hub consumer.
- [ ] **Decidir merge develop→main** — la deuda creció: iconos v3 + rich content + listados refactor + Banxico + filtros + soft-delete gate + **image proxy `/propyte-media`** (commit 7bae658). Requiere autorización explícita de Luis. Dispara Hostinger pull-on-main → producción.
- [ ] **Reemplazar stats placeholders en `tangibleDiff`** — `+25%`, `3 meses`, `0`, `1:1` con labels editoriales placeholder. Esperan números reales de Luis. Editar `processInfographic.tangibleDiff.stats` en `src/i18n/messages/{es,en}.json`.
- [ ] **Mostrar `source_url` (IG link) en `Testimonials.tsx`** — campo ya en BD (`nativa_tulum.testimonials` + `Propyte_testimonials`), frontend pendiente. Cambio chico ~15 líneas: icon Instagram + link.
- [ ] **Expandir copy editorial → 900 palabras por unidad** — DIFERIDO 2026-05-20 (costo IA). Edición manual `descripcion_larga_unidad` en Hub (gratis, top-traffic primero) o batch AI script one-off.
- [ ] **231 desarrollos sin `tipo_desarrollo`** (NULL en BD post-migración 2026-05-20) — Luis o equipo de data deben categorizar manualmente en Hub. La mayoría son scraper legacy.

---

## Pendientes
- [ ] 🟡 **Decidir el reparto de tráfico: una semana al 100% en la variante corta, ANTES de partir 50/50** — medido por API el 2026-08-24: la campaña lleva 165 clics y $2,311 MXN en 30 días con **una** conversión, que es un clic de WhatsApp. «Lead formulario web» **nunca ha disparado**, coherente con que la landing no tenía formulario. Es decir: **no existe línea base** para un A/B. Ritmo actual ~26 clics/día; partido a la mitad son 13 por brazo, y distinguir 3% de 5% pediría ~4 meses (16 días si el efecto fuera 2%→8%). Mandar una semana el 100% a `/lp/terrenos-playa-del-carmen` prueba que un lead de formulario llega hasta Zoho desde tráfico pagado —nunca demostrado— y da la tasa con la que sí se puede dimensionar el test. Detalle en [[project_google_ads_campana_lotes_pdc_estado]].
- [ ] ⚠️ **9 de los 11 forms del sitio siguen expuestos al bug de pre-hidratación** — solo `LeadFormLotes` y `FormTerrenos` llevan el rescate. En cualquier form controlado servido por SSR, lo que se rellene antes de que React hidrate se pierde: el campo SE VE lleno y al enviar dice que falta. Lo dispara el autocompletado del navegador. Ver [[feedback_input_controlado_pierde_lo_prehidratado]].
- [ ] **Capturar la licencia de fraccionamiento en el Hub** — medido: **0 de 22** desarrollos la tienen. Es la prueba antifraude más fuerte que podrían llevar las dos landings, y ambas ya tienen el hueco hecho: la ficha crece sola en cuanto `licencia_numero` deje de estar vacío. Trabajo de datos, no de código.
- [ ] **Prunear ~20 ramas remotas en GitHub ya contenidas en `main`** — la limpieza local (21→10 ramas, 8→6 worktrees) se hizo el 2026-08-21; las remotas se dejaron porque afectan a todo el equipo. Comprobar cada una con `git diff origin/main...origin/<rama> --shortstat` antes de borrar.
- [ ] **Decidir qué pasa con `fix/mercado-ttm-ocupacion`** — 19 commits, 3.791 líneas, lista y verde, y **ya respaldada en `origin`** desde el 2026-08-21. Sigue sin mergear; el orden obligatorio es migración → pipeline → web.
- [ ] **`Next_Propyte_web-contenido-felipe` tiene 7 archivos sin commitear** — trabajo de Felipe. Por eso no se retiró ese worktree en la limpieza. Conviene que él los commitee o los descarte.
- [ ] 🐛 **`/desarrollos/tipo/<cualquier-basura>` devuelve 200, no 404** — con el título genérico. Soft-404 indexable en cualquier slug inventado. Preexistente, pero más relevante ahora que `villa` y `comercial` son tipos canónicos que alguien podría enlazar sin que exista la faceta.
- [ ] 🐛 **`getSimilarUnits` (`src/lib/supabase/queries.ts:851`) nunca acierta su bucket L1** — hace `.eq('unit_type', seed.unit_type)` con un canónico en minúscula contra una columna que guarda grafías crudas (`Departamento`, `Lote`). Misma familia canónico-vs-crudo; preexistente.
- [ ] **Abrir facetas SEO para `villa` y `comercial`** cuando haya inventario que las llene — hoy `TYPE_SLUGS` tiene 5 y abrirlas sin producto publica páginas vacías.

### LP Lotes PdC — el asesor y el árbol sucio (sesión 2026-08-20, 2ª)

- [ ] 🔴 **Decisión de Luis, preguntada y sin respuesta: ¿se quita al asesor también del bloque del final?** `PruebaDeQueExistimos.tsx:48-83` sigue mostrando foto de 48px, nombre y cargo, y ya trae su enlace «Ve al equipo completo». No se tocó porque ahí el argumento entero es *«una persona con nombre y cargo, no “un asesor”»*: quitarle la persona deja la tarjeta sin razón de existir. Es cambio de contenido, no de maquetado.
- [ ] 🔴 **Decidir qué se hace con los cambios sin commitear del árbol principal** — `LeadFormLotes.tsx` (reescritura de +495/−264), `page.tsx`, `consent.ts` + `Analytics.tsx` + `CookieBanner.tsx` (parece el arreglo del banner de cookies, a medias) y `tests/lp-lotes-form.mjs` sin rastrear. Importa: **sin aceptar cookies la conversión de lead no se dispara** en Google Ads. Mientras siga sin commitear, un `git checkout` de rama se lo lleva.
- [ ] ♻️ **Decidir el destino del rediseño de la LP (`fe189db` en `~/Projects/_lp-rediseno`)** — nunca pusheado, la rama no existe en `origin` y ya va ~30 commits por detrás de `main`. O se rebasa y se decide, o se tira. Ver [[project_lp_lotes_rediseno_estado]].


### SEO local / Maps (sesión 2026-08-20)

- [ ] 🔴 **Luis: corregir el horario en la ficha de Google Business Profile** — la oficina abre los SIETE días de 10:00 a 19:00, pero la ficha declaraba Lun–Vie 9:00–18:00. **Maps muestra lo de la ficha, no el JSON-LD**: hasta que se cambie, Propyte sale cerrado los domingos aunque el sitio ya diga lo correcto. Un minuto de trabajo y es lo más rentable pendiente.
- [ ] 🔴 **Luis: pedir reseñas.** La ficha está verificada y hay oficina física atendida, pero con **0–5 reseñas** el ranking en Maps está bloqueado por prominencia y **ningún cambio de código lo desbloquea** — vale más que los cuatro commits de la sesión. Enlace y QR listos en `~/Projects/references/qr-resenas-google/` (SVG + PNG 1200/2400 px). Mecánica acordada: pedir en el pico emocional (firma/entrega, en persona, no por correo masivo), responder el 100%, nunca incentivar. Datos de la ficha en [[reference_propyte_ficha_google_business]].
- [ ] **Pasar `test:prerender` a las plantillas de desarrollos y propiedades** — ofrecido y no ejecutado. Son las que llevan el `RealEstateListing` y el tráfico transaccional; si alguna cae en la trampa de `useSearchParams`, su schema tampoco está llegando a Google. Hoy el chequeo solo cubre home, contacto, faq, quienes-somos y financiamiento.
- [ ] **Techo de proximidad de Maps, decisión de negocio** — el pin está en Playa del Carmen, así que solo se rankea cerca de ahí. La demanda medida en Google Ads está en **Cancún**, no en PdC. Cubrir Cancún exige una segunda ficha con oficina real y personal; no hay atajo y las fichas falsas se suspenden.
- [x] ✅ **Test intermitente de `nap.test.ts` — la parte del TIMEOUT, arreglada** (2026-08-24, `646cae6`). El modo que sí se reprodujo era `Test timed out in 5000ms`: los escaneos hacían toda la E/S dentro del `it` (un `statSync` por entrada, ~695 syscalls, y nap releía los ~525 archivos **una vez por patrón** = ~2.625 lecturas). Ahora el árbol se lee una sola vez a nivel de módulo y la región cronometrada quedó libre de E/S. Umbral de ruptura: de 100 ms a 20 ms.
- [ ] ⚠️ **Queda SIN explicar el otro síntoma del mismo test** — la ejecución de `e164680` no dio timeout: **reportó `77710` como hallazgo real** y tardó 15 s donde tarda 400 ms. Eso es una aserción que falla, no un reloj, así que el arreglo de arriba **no lo cubre**. Hipótesis viva: un archivo apareció y desapareció dentro de `src` durante el barrido (dev server escribiendo tipos, o un `checkout` de otra sesión). El fix reduce la ventana de exposición —una pasada de lectura en vez de cinco— pero no la cierra. Si vuelve a reportar un valor muerto que no está en el árbol, sospechar de eso primero.

### Pixel de OpenAI Ads — instalado en prod, falta cerrarlo fuera del código (2026-08-18)

- [ ] ⏳ **Confirmar que Ads Manager registra los eventos.** El panel de Conversiones marcaba **0 eventos y 0% de cobertura de identificadores**. El pixel está verificado en el sitio vivo (12/12 peticiones) y el SDK manda su ping a `bzr.openai.com/v1/sdk/events?pid=GGwkPvXutsXVZwtbnju2u4`, pero **nadie ha visto el panel llenarse**. Hasta entonces la instalación no está confirmada de punta a punta.
- [ ] **Dar de alta `whatsapp_click` en Ads Manager** con ese nombre exacto. El sitio ya lo emite como evento a medida; sin el alta no cuenta como conversión ni optimiza. En Google Ads ya es conversión secundaria.
- [ ] 🚫 **Completar la cuenta de OpenAI Ads: facturación y logotipo.** Sin eso los anuncios no pueden publicarse (aviso en el propio panel).
- [ ] **Valorar la Conversions API server-side de OpenAI.** Los eventos ya viajan con `event_id`, que es la mitad del trabajo de deduplicación. El equivalente de Meta vive en `/api/track` + `src/lib/meta/capi.ts`. Subiría el match quality; hoy tampoco se manda `user.email_sha256` en el `init`.

### Medición — fallo preexistente detectado, NO corregido (2026-08-18)

- [ ] 🚨 **El banner de cookies solo aplica el consentimiento al GUARDAR.** `applyConsentToGtag()` y `applyConsentToMetaPixel()` se llaman únicamente desde `writeConsent()`. El visitante que aceptó en una visita anterior vuelve, no ve el banner y **nadie comunica su consentimiento a los scripts**: GA4 se queda en `denied` y Meta en `revoke` toda la sesión. Es medición perdida justo con los usuarios recurrentes. El pixel de OpenAI lo esquiva leyendo `localStorage` en su propio script de arranque; **GA4 y Meta siguen con el fallo**. Ver [[feedback_banner_cookies_no_reaplica_consentimiento]].

### Higiene de la máquina (2026-08-18)

- [ ] 🧟 **Matar los dos `next start` zombis de este repo**: PID 37680 en `:3000` (del 11-ago) y PID 50488 en `:3123` (del 15-ago). Comparten el directorio `.next` y **reescriben el build nuevo con el código que tienen en memoria**, así que cualquier verificación en localhost miente de forma intermitente. No se mataron por ser procesos de Luis. Ver [[feedback_next_start_zombi_pisa_el_build]].
- [ ] **Decidir qué versión de este `task_manager.md` gana.** Al 2026-08-18 el archivo está modificado sin commitear en el worktree principal con un encabezado ANTERIOR al de `HEAD` (revierte la nota del barrido de Dependabot). Hubo tres sesiones en paralelo ese día.

### LP Lotes PdC — reverificación tras el avance de `main` (2026-08-18)

- [ ] 🚨 **Reverificar la LP de lotes contra el `main` actual.** El 6/6 contra producción se midió sobre `2172695`; después entraron `f5d75d8`…`21848a6`, y dos de esos commits tocan `src/components/shared/Analytics.tsx` y `src/lib/cookies/consent.ts` — que es exactamente lo que usa `ConsentBannerLp`, cuyo posicionamiento es el que arreglamos. Más el bump de `next-intl`/`framer-motion` y el `package-lock` reescrito. Comando: `PLAYWRIGHT_BASE_URL=https://propyte.com npx playwright test tests/e2e/lp-lotes-qs.spec.ts`. Si el aserto del banner falla, el culpable más probable es un cambio de altura, no de lógica.
- [ ] **Vigilar CTR y `search_rank_lost_impression_share`, no el QS.** El Quality Score se recalcula sobre tráfico nuevo y tarda; la señal temprana es el CTR y la caída del 90% de pérdida por rango. **Y medir conversión aparte**: subir el comparador revirtió una decisión deliberada de conversión del equipo, así que puede subir el QS y bajar la conversión de quien ya venía decidido.
- [ ] **Limpiar el worktree `~/Projects/_lp-lotes-qs`** (`git worktree remove`) y matar el dev server de `:3030` cuando ya no se necesiten.

### Workstream PropyteIcons — pendientes futuros

> Nueva arquitectura (2026-05-20): `src/lib/icons.tsx` registro central con 62 Propyte (de `propyte-icons.tsx` auto-generado) + lucide-react wrappeado con `strokeWidth=1.5` default. Librería legacy `src/components/icons/PropyteIcons.tsx` ELIMINADA. Para más SVGs: drop en `public/img/icons/propyte/` + `node scripts/build-propyte-icons.js` + mover nombre del bloque "Lucide fallback" al bloque "Propyte direct-match" en `src/lib/icons.tsx`.

- [ ] **Cuando diseñadora entregue más iconos:** seguir el flujo descrito arriba. Top prioritarios (alta frecuencia, aún en lucide fallback): `BarChart3` (16 archivos), `Sparkles` (8), `ShieldCheck` (7), `Loader2` (4), `Truck` (4), `Award` (4), `Info` (4), `SlidersHorizontal` (4), `Calculator` (3). Sociales: `Instagram`, `Facebook`, `Youtube`, `Linkedin`, `Twitter` (5 archivos).

### Workstream Zoho — QA + pulido post-merge

- [ ] **QA manual F3/F4/F5/F10** — 8 leads no automatizados por selectores stale del Playwright spec. Pruebas manuales desde `dev.propyte.com/{es,en}/desarrolladores` (F3 hero + F4 #registro), `/corredores#registro` (F5), homepage scroll a "Descargar reporte" (F10). Validar Tipo_de_Contacto + Nombre_anuncio + Account (F3/F4 → Desarrollador + Industry=Desarrolladora; F5 → Broker; F10 → Lead).
- [ ] **Arreglar selectores stale en `tests/e2e/zoho-forms.spec.ts`** (opcional, para 22/22 verde): F3 `#b2b-name` no espera carga lazy, F4 `select[name="projectType"]` strict mode dialog, F5 `select[name="brokerType"]` location below fold, F10 button "Descargar reporte" está a 9668px de scroll.
- [ ] **Cron retry no persiste `page` en BD** — si quieres `Nombre_anuncio` también en retries, requiere agregar columna `nombre_anuncio` (o `page`) a `public.leads` + actualizar INSERT en `route.ts:419` + `rebuildPayload` en cron retry. Primer intento (99%) ya funciona.

### Branches en limbo

- [ ] **Revisar branch `feat/content-audit-seo-recovery`** (local-only, commit `cac2249 wip: copy/SEO audit i18n recovered from stash`) — decidir si los cambios sobre **SOP-3.2** / "Manejo de Datos" / "Plan de Carrera" siguen aplicando. La branch original `feat/content-audit-seo-2026` fue borrada del remoto en algún punto.
- [ ] **`infografia` branch (stand by)** — Luis dejó pruebas en pausa. `stash@{0}` tiene rediseño grande de `ProcessInfographic.tsx` (+774 líneas) preservado. Retomar cuando se quiera continuar.

### Spec: Auditoría Contenido SEO 2026 + Tono Propyte — `specs/content-audit-seo-2026.md`

> Rama: `feat/content-audit-seo-2026` (desde develop). Fuentes canónicas: Manual UX/UI v1.0 (§4.1, §4.2, §6.3.2, §7.3), Playbook Comercial Mar-2026, MASTER SOP v1.0. Alcance: contenido + estructura + schema + SEO técnico. **NO** rediseño visual — screenshot diff obligatorio antes de cerrar cada bloque.

**Bloque A — Limpieza de credibilidad (~1-2 días)**

- [x] **A0.** Q1, Q6, Q8, Q9 resueltas con Luis (2026-05-11): solo 2 desarrollos reales → mostrar cifras reales tal cual; ninguna fuente comercial externa → eliminar 4 cifras del simulador. **Bloque A totalmente desbloqueado.**
- [ ] **A1.** Eliminar `FLOORS` de `Hero.tsx:23` y pasar `stats.developments/units/cities/zones` directos. Render condicional por pill (omitir si `=== 0`). `StatCounter` sin suffix `+` si `cifra < 10`. Verificar que `getGlobalStats()` filtre por `ext_publicado=true`. Sin cambio visual.
- [ ] **A2.** `whyPropyte` 6→3 features con links de evidencia (`/metodologia`, `/equipo`, `/aviso-legal-inversion`). Edita `WhyPropyte.tsx` + `src/i18n/messages/{es,en}.json`.
- [ ] **A3a.** Disclaimer YMYL canónico (Manual §6.3.2 — literal) en `roiSimulator.footnote` + Footer + `AppDownloadBanner.tsx`.
- [ ] **A3b.** Eliminar las 4 cards numéricas del `AppDownloadBanner` (12%/35%/$200K/6sem — sin sustitución por rangos hasta tener fuente verificada). Reescribir copy banner: título → `"Calcula tu rendimiento"`, subtitle → `"Simula enganche, mensualidades y rendimiento proyectado con tus propios supuestos."`. Eliminar 8 keys `roiSimulator.metric1Value..metric4Label` de ES y EN (incluir en grep A.QA).
- [ ] **A4.** Typo `"Inversiónistas"` → `"Inversionistas"` en `src/i18n/messages/es.json:~191`.
- [ ] **A5.** Eliminar vestigial keys `hero.tab_comprar/rentar/preventa` de ES y EN.
- [ ] **A6.** Eyebrow + H1 a i18n con copy canónico Manual §4.1: `hero.title` ES = `"Real estate en modo inteligente."` / EN = `"Real estate, powered by intelligence."`. `hero.eyebrow` ES = `"Bienes raíces · Riviera Maya"` / EN = `"Real Estate · Riviera Maya"`. Reemplazar string hardcoded `"REAL ESTATE"` de `Hero.tsx:95`.
- [ ] **A7.** Fix `href="#"` en `ValueProposition.tsx` (→ `/desarrolladores`) y `MarketData.tsx` CTA (→ `/blog?category=analisis-mercado`).
- [ ] **A.QA.** `npm run typecheck` + Playwright e2e + screenshot diff manual (Hero/Footer/banners sin regresión) + grep frases prohibidas (`plusvalía garantizada`, `inversión segura`, `oportunidad única`, `se vende solo`, `rendimientos asegurados`) = 0 matches.
- [ ] **A.PR.** Commit + push a `feat/content-audit-seo-2026`, Vercel preview, revisión Luis del bloque A.

**Bloque B — Reorganización mensajes (~1 semana, bloqueado por A.PR aprobado)**

- [ ] **B0.** Confirmar con Luis Q11 (destino final de `ExploreCategories`, `LeadMagnet`, `AppDownloadBanner` migrados fuera del Home).
- [ ] **B1. Home rebuild — Manual §4.2 + ampliación E-E-A-T** (decisión Luis 2026-05-11). El Manual §4.2 es base estructural pero se amplía con 4 secciones nuevas porque el Bloque A dejó el Home delgado en certidumbre. **Sin tocar paleta — solo slots por sección**. Orden final: Hero → NosotrosTeaser → FeaturedProperties → MetodologiaTeaser → ProcessInfographicPlaceholder → HowItWorks → WhyPropyte → TrendingMarket → DondeEstamos → DeveloperLogos → HomeFAQ → DeveloperBanner → JoinTeamBanner → RecentBlog (condicional). Retirar: Testimonials, LeadMagnet, ExploreCategories, AppDownloadBanner, ValueProposition.
  - [ ] **B1.1** Crear `src/components/home/NosotrosTeaser.tsx` (slot claro, 3 mini-stats verificables, CTA → /equipo).
  - [ ] **B1.2** Crear `src/components/home/MetodologiaTeaser.tsx` (slot dark, 5 criterios SOP-3.2, CTA → /metodologia).
  - [ ] **B1.3** Crear `src/components/home/ProcessInfographic.tsx` como placeholder (espacio reservado para infografía Propyte; copy de Luis pendiente próxima sesión).
  - [ ] **B1.4** Crear `src/components/home/DondeEstamos.tsx` (slot claro, Real Estate Lab + zonas cubiertas con conteo real si Supabase devuelve >0; sin mapa interactivo).
  - [ ] **B1.5** Reactivar `HowItWorks` existente (revisar copy, conectar en page.tsx).
  - [ ] **B1.6** Crear `src/components/home/HomeFAQ.tsx` con 4 Q&A + JSON-LD FAQPage (adelanto Bloque C2).
  - [ ] **B1.7** Reordenar `src/app/[locale]/page.tsx` con el orden completo arriba.
- [ ] **B2.** Microcopy CTAs: `hero.searchCta` → `"Buscar propiedad"`, `joinTeam.cta` → `"Conoce el Plan de Carrera"`, `developerBanner.cta` → `"Solicitar Propuesta Comercial"`, `roiSimulator.ctaPrimary` → `"Calcular mi rendimiento"`, `featuredProperties.cta` → `"Ver Todas las Propiedades"`. Sync ES + EN.
- [ ] **B3.** Retirar `Testimonials` del Home (Manual §7.1 — no hay casos hasta dic-2026). Migrar a `/equipo` si hay consentimiento, o archivar.
- [ ] **B4.** Crear `/metodologia` (Scorecard SOP-3.2), `/equipo` (bios + credenciales + redirect 301 desde `/nosotros/equipo-comercial`), `/aviso-legal-inversion`. Schema `WebPage` + breadcrumb. Linkear desde Footer "Legal/Transparencia".
- [ ] **B5.** H1/H2 keyword-rich (tabla en spec B5): FeaturedProperties, HowItWorks, WhyPropyte, TrendingMarket, RecentBlog.
- [ ] **B6.** Tono Propyte pass: replacements masivos según tabla B6 + Footer tagline `"Real estate en modo inteligente."` + brand cierre `"PROPYTE™ — Property + Byte. Sin humo. Sin improvisación. Sin promesas vacías."`. Re-grep frases prohibidas.
- [ ] **B7.** `RecentBlog` condicional: `posts.length >= 3` render normal; `< 3` card placeholder `"Próximamente: análisis mensual…"` + CTA newsletter. No esconder sección.
- [ ] **B.QA.** typecheck + e2e + screenshot diff + manual review `dev.propyte.com` + Lighthouse comparativo pre/post.

**Bloque C — SEO técnico profundo (~2-3 días, bloqueado por B.QA aprobado)**

- [ ] **C1.a.** `case 'website'` en `SchemaMarkup.tsx` con `potentialAction: SearchAction` → `/propiedades?search={search_term_string}`. Inyectar en `src/app/[locale]/layout.tsx`. Activa Sitelinks Search Box.
- [ ] **C1.b.** `realEstateListing` shape real (Apartment/House/Residence según `property_type`, `floorSize`, `numberOfRooms`, `price`, `priceCurrency`, `offers`, `geo`, `brand: "Nativa Tulum"` cuando aplique) en `src/app/[locale]/propiedades/[slug]/page.tsx`. Fallback: omitir si faltan campos críticos. Solo `LISTO PARA VENTA` (SOP-3.2).
- [ ] **C1.c.** `AggregateRating` + `Review` schema — **BLOQUEADA hasta dic-2026** (primer MasterBroker firmado, Manual §7.1). Tarea registrada para no perderse.
- [ ] **C1.d.** Crear `src/components/shared/Breadcrumb.tsx` (UI + JSON-LD `BreadcrumbList`). Aplicar en páginas principales.
- [ ] **C1.e.** `LocalBusiness` schema con `address: "Calle 5 Norte 95, Playa del Carmen, Q. Roo"` (Real Estate Lab — SOP Hostess §2.1), `parentOrganization: Organization`, `legalName: "Nativa Tulum"`.
- [ ] **C1.f.** `BlogPosting` schema en plantilla de blog (preparado aunque no haya posts).
- [ ] **C2.** Crear `src/components/home/HomeFAQ.tsx` con 4 Q&A (spec C2) + JSON-LD `FAQPage`. Acordeón visible. Ubicación: después de `TrendingMarket`, antes de `DeveloperBanner`.
- [ ] **C3.** Extender `src/app/[locale]/opengraph-image.tsx` con `ImageResponse` por-ruta (home + `/propiedades/[slug]` + `/zonas/[slug]` + `/blog/[slug]`). Estilo consistente.
- [ ] **C4.** Hero performance: `<link rel="preload" as="video">` + `poster` siempre. Medir LCP con `npx lighthouse https://dev.propyte.com/es --view`. Objetivo: LCP < 2.5s mobile. Sin cambio visual.
- [ ] **C5.** Validar Sitelinks Search Box en Rich Results Test.
- [ ] **C6.** Agregar `/metodologia`, `/equipo`, `/aviso-legal-inversion` a `src/app/sitemap.ts`. Verificar `hreflang` simétrico ES/EN con `x-default` ES.
- [ ] **C.QA.** Rich Results Test pasa los 7 schemas (Organization, WebSite, RealEstateListing, BreadcrumbList, FAQPage, LocalBusiness, BlogPosting). Lighthouse SEO ≥ 95 en 4 rutas principales. typecheck + e2e.

**Cierre del spec**

- [ ] PR `feat/content-audit-seo-2026` → `develop` con descripción + link a `specs/content-audit-seo-2026.md`.
- [ ] Signoff de Luis en el PR.
- [ ] Merge a `develop` → Vercel staging → validación 48h en `dev.propyte.com`.
- [ ] Merge `develop` → `main` → Hostinger prod (auto-deploy GitHub Actions).
- [ ] Actualizar `project_next_propyte_web_estado.md` con cierre del proyecto.

---

### Decisiones del usuario (no código)

- [ ] **Más ajustes estéticos pre-merge develop→main** — Luis 2026-05-15: "hay cosas que aún no me convencen, debemos mejorar". Esperando que indique cuáles componentes/secciones. El Hero ya quedó OK con HeroAtmosphere.
- [ ] **Decidir destino branch `prueba-liquid-glass`** — commit `7524c2b` (Hero + Q11) está local-only en esta rama. Posibilidades: (a) cherry-pick a develop, (b) push y mergear como PR, (c) rebase a develop. Untracked `src/components/ui/glass/` es WIP paralelo de Luis (liquid-glass experiment), NO mezclar.
- [ ] **Merge `develop → main`** — ⚠️ NO ejecutar sin autorización Luis. 320 commits ahead. Dispara Hostinger pull-on-main → `propyte.com` prod.
- [ ] **Validación cluster filter "+N"** — requiere ≥2 propiedades con coords en Supabase staging para que se active el clustering. Hoy hay solo 1 con coords válidas.
- [x] **Validación visual humana en `dev.propyte.com`** (2026-05-15) — Hero + Q11 migrations + Tier 1 Lenis validados en producción.
- [x] **Hacer público el video Drive** (2026-05-15) — Luis lo hizo público.

### Brand Identity Oficial — extensiones futuras

- [ ] **Plan migración Adobe Fonts kit** (Neue Haas Display + Normalidad VF) cuando Luis tenga acceso al kit. Swap de 2 líneas en `layout.tsx` (Inter→Neue Haas, DM Sans→Normalidad). Vars `--font-display` / `--font-text` ya tienen el contrato listo.
- [ ] **Eventual limpieza fallback i18n** — cuando B.1 site_config esté validado en prod ≥30 días, eliminar fallback i18n de contact info en `messages/{es,en}.json` (Fase D speckit dynamic-content).
- [ ] **Considerar glass-light en otros bloques light**: `DeveloperLogos`, sticky header sobre scroll. Decisión visual con Luis (parcialmente cubierto por Pass 0/1).

---

### Spec: Tier 1 Quick Wins de Optimización — `specs/tier-1-perf-optimization-quick-wins.md`

> Rama: `feat/perf-optimization-tier-1` (desde develop, post-merge Zoho). Alcance: 5 quick wins simultáneos — Lenis, bundle-analyzer, plaiceholder, next/og audit+uplift, Sentry. Aditivo, reversible, sin rediseño UI. Defaults documentados en sesión de aprobación (sección "Open Questions" del spec).
>
> **Solapamiento detectado con `content-audit-seo-2026` Bloque C3:** ambas specs tocan `opengraph-image.tsx` por ruta. **Coordinación:** si C3 se mergea antes que Tier 1, QW-5 (next/og audit + uplift) consume el trabajo de C3 y solo agrega las rutas faltantes. Si Tier 1 mergea antes, C3 se reduce a verificación.

**Bloque QW-1 — Setup y baseline**
- [ ] **QW-1.1** Crear branch `feat/perf-optimization-tier-1` desde `develop` ✅ (creada 2026-05-14).
- [ ] **QW-1.2** Documentar baseline pre-cambios → `docs/bundle-baseline-2026-05-14.md` (Lighthouse + bundle size + lista rutas con OG existente).

**Bloque QW-2 — Lenis (smooth scroll)**
- [ ] **QW-2.1** Instalar `lenis@^1.3`. Crear `src/components/providers/SmoothScrollProvider.tsx` (Client Component) con guard `prefers-reduced-motion` + env flag `NEXT_PUBLIC_LENIS=0`.
- [ ] **QW-2.2** Envolver `src/app/[locale]/layout.tsx` con el provider.
- [ ] **QW-2.3** Crear `useLenisAnchor()` y aplicar en FAQ + Glosario + footer anchors.
- [ ] **QW-2.4** Smoke Playwright `tests/e2e/smooth-scroll.spec.ts` + toggle reduced-motion.

**Bloque QW-3 — Bundle analyzer**
- [ ] **QW-3.1** Instalar `@next/bundle-analyzer` (devDep), wrapper en `next.config.ts`. Script `npm run analyze`.
- [ ] **QW-3.2** Run inicial. Top-3 oportunidades documentadas en `docs/bundle-baseline-2026-05-14.md` (candidatos: `recharts`, `@react-pdf/renderer`, `html2canvas`, `lucide-react` barrel).
- [ ] **QW-3.3** Implementar 2 quick fixes (lazy-load + tree-shake).
- [ ] **QW-3.4** Re-run analyzer. Documentar delta. AC4: bundle cliente NO crece neto.

**Bloque QW-4 — plaiceholder (blur placeholders)**
- [ ] **QW-4.1** Instalar `plaiceholder` + `@plaiceholder/next`. Helper `withBlurDataURL()` en `src/lib/supabase/`.
- [ ] **QW-4.2** **SQL entregable a Luis** (harness no ejecuta DDL prod): `ALTER TABLE Propyte_desarrolladores ADD COLUMN blur_data_url TEXT;` + idem `Propyte_unidades`.
- [ ] **QW-4.3** Aplicar `withBlurDataURL` a queries: `getDevelopers`, `getDeveloperBySlug`, `getUnits`, `getUnitById`.
- [ ] **QW-4.4** Actualizar `<Image>` cards/hero: `placeholder="blur" blurDataURL={...}`.
- [ ] **QW-4.5** Script backfill `scripts/backfill-blur-placeholders.ts` para imágenes existentes.

**Bloque QW-5 — next/og audit + uplift**
- [ ] **QW-5.1** Auditoría rutas indexables (sitemap.ts) vs rutas con `opengraph-image.tsx`. Gap → `docs/og-audit-2026-05-14.md`. **Cruzar con C3 antes de duplicar.**
- [ ] **QW-5.2** Mejorar `src/lib/og/OGFrame.tsx` con variantes: `entity` (foto hero + datos reales), `marketing` (gradient teal→aztec + título), `default`.
- [ ] **QW-5.3** Crear `opengraph-image.tsx` para top-7 faltantes (home, /desarrollos índice, /propiedades/[id], 4 ciudades). **Si C3 ya cubre alguna, skip y enfocar en uplift visual.**
- [ ] **QW-5.4** Playwright `tests/e2e/og-images.spec.ts`: validar `Content-Type: image/*` en 12+ rutas.

**Bloque QW-6 — Sentry**
- [ ] **QW-6.1** **Luis ejecuta:** crear proyecto Sentry `propyte-web` en org Propyte. Compartir DSN + auth token.
- [ ] **QW-6.2** Run `npx @sentry/wizard -i nextjs`. Revisar generados: `sentry.{client,server,edge}.config.ts`, `instrumentation.ts`, `app/global-error.tsx`, wrapper en `next.config.ts`.
- [ ] **QW-6.3** Custom config: `tracesSampleRate: 0.1` (prod), `replaysSessionSampleRate: 0.05`, `replaysOnErrorSampleRate: 1.0`, `sendDefaultPii: false`, `beforeSend` sanitiza query params, `ignoreErrors` whitelist.
- [ ] **QW-6.4** Update CSP en `next.config.ts`: `connect-src` agregar `https://*.ingest.sentry.io`.
- [ ] **QW-6.5** GitHub Actions deploy Hostinger: paso `sentry-cli releases files ... upload-sourcemaps`. Secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- [ ] **QW-6.6** Vercel env: `vercel env add SENTRY_AUTH_TOKEN` (preview + prod).
- [ ] **QW-6.7** Deploy a `dev.propyte.com`. Forzar error de prueba. Verificar evento + source map en dashboard Sentry.

**Bloque QW-7 — Cierre**
- [ ] **QW-7.1** Verificar AC1-AC12 del spec. Marcar checklist en spec.
- [ ] **QW-7.2** Actualizar `project_next_propyte_web_estado.md` con Tier 1 completado.
- [ ] **QW-7.3** PR `feat/perf-optimization-tier-1` → `develop`. Smoke staging.
- [ ] **QW-7.4** Merge a `develop` → cherry-pick/merge a `main` → deploy Hostinger.

---

## Bloqueadas

- [ ] 🚫 **Aplicar la ola de arreglos con revisión independiente** — se agotó el límite de gasto mensual de la organización a mitad de la ola final, así que los 9 hallazgos quedaron sin aplicar. **Desbloquea:** subir el límite (`/usage-credits`), o aceptar aplicarlos sin revisor independiente — y esa revisión es la que encontró los 3 Critical que el plan traía.

- [ ] 🚫 **Cambiar el asesor de la LP de lotes: Conrad Alvarado → Victor Sanfilippo** — es un cambio de DATO, no de código. `Propyte_unidades` id `ca6fffe4-3a0d-4ab2-82f7-5789fcb8bdc7`, columna `id_agente`: `null` → `e6345892-909c-4597-acee-d8a84c5b660a`. **Bloqueado:** el clasificador del harness deniega la escritura en el Hub vía MCP. Lo tiene que hacer Luis desde la UI. Verificar que el UPDATE escribió de verdad (ver `locked_fields`) y dar hasta 5 min de ISR. ⚠️ **Actualizado 2026-08-20: ya solo afecta a `PruebaDeQueExistimos`** — `TrustBar` dejó de mostrar asesor, así que el dato solo se ve en el bloque del final. Y si Luis decide quitar también al asesor de ahí (ver «Pendientes»), esta tarea **muere sola**: no habría dónde mostrarlo. Detalle en la memoria `reference_lotes_publicados_pdc`.
- [ ] 🚫 **Reescribir los 5 RSA de la campaña Lotes PDC en plural** — 0 de 15 titulares contienen «terrenos»; AG-P4 y AG-P5 con eficacia POOR (12 titulares y un pin); el anuncio dice «un lote de 129.6 m²» cuando hay 670 lotes publicados en PdC. **Bloqueado por dos cosas:** la MCP `google-ads-write` apunta a un binario que no existe (memoria `feedback_google_ads_write_mcp_binario_inexistente`) y crear RSA es operación de creación, que el clasificador deniega. Rutas vivas: Google Ads Editor o Scripts (`AdsApp`).
- [ ] 🚫 **Depurar las negativas de la campaña Lotes PDC** — ya NO es «añadir 60»: es quitar las de nombres de desarrollo, que niegan el propio mercado siendo comercializadora. **Bloqueado además por una anomalía sin resolver:** hay negativas `ENABLED` y correctas que no bloquean sus términos (memoria `feedback_negativas_campana_no_disparan`). Añadir más antes de saber por qué es trabajo sin efecto. Requiere que Luis mire el diagnóstico de conflictos en la UI.

---

## Completadas recientes

- [x] 🚨 **La variante A de la LP de lotes servía CERO formularios en producción** (2026-08-24) — Se iba a arreglar un bug menor y la medición contra el sitio vivo dio `querySelectorAll("form").length === 0` **incluso tras hidratar**: la compuerta «¿Qué estás buscando?» seguía viva. Es el mismo fallo ya diagnosticado que costó **991.40 MXN en 72 clics con cero envíos**. La reescritura a un paso existía **desde el 2026-08-20 sin pushear** en el árbol de otra sesión: cuatro días de tráfico pagado contra una página sin formulario. PR #54 trae esa reescritura —aplicada con `git apply --3way` de un parche sobre `origin/main`, no copiando archivos, y revisada línea a línea: POST, honeypot y `trackGenerateLead` intactos— **más el rescate de pre-hidratación que quitar la compuerta hacía necesario**. Verificado contra producción y repetido 4 veces para descartar CDN mezclada. Ver [[feedback_verificado_en_local_no_es_desplegado]].

- [x] **Nueva landing de conversión `/lp/terrenos-playa-del-carmen` EN PROD** (2026-08-24) — Variante B del A/B: **3.6 pantallas contra 12.3**, 4 secciones, formulario en el primer viewport en móvil y escritorio. Sistema visual propio bajo `.lpt-root` sin compartir un token con la A (dos variantes parecidas miden ruido); carril «hoja de topógrafo», `Archivo` con eje `wdth` + `Azeret Mono`, rechazados a propósito el turquesa de playa y el crema+serif editorial. Medición **idéntica** a la A a propósito —misma acción de conversión, mismo `source: lp_lotes_pdc`, mismo valor— para que la diferencia sea atribuible al diseño; se separan por `form_type` en GA4 y por `page`→`Nombre_anuncio` en Zoho. Verificado contra producción: POST correcto, `generate_lead`, **conversión de Ads con su `send_to` AW-** y Consent Mode en `denied`. PRs #39 y #53. Decisión de negocio de Luis: la nota «HOY NO ES ESCRITURABLE» **no se publica en la B**, y va documentada en el código para que nadie la reponga.

- [x] **Bug de pre-hidratación encontrado y cerrado en las dos landings** (2026-08-24) — En un form React controlado servido por SSR, lo que se rellena antes de hidratar queda en el DOM con el estado vacío: **el campo se ve lleno y al enviar dice que falta**, sin error de consola, sin POST y sin lead. Medido en propyte.com: el form se ve a ~600 ms, React responde a ~2.2 s. El disparador habitual es el **autocompletado del navegador**. Casi se descarta como fallo del test; lo que lo confirmó fue ver que el valor **sí** sobrevivía en el DOM y aun así no salía POST. Cubierto por `tests/lp-lotes-prehidratacion.mjs` y el escenario B de `tests/lp-terrenos-conversion.mjs`, ambos validados con **control negativo** contra el build viejo. Ver [[feedback_input_controlado_pierde_lo_prehidratado]].

- [x] Auditoría completa de `/es/mercado` contra la base de producción: 13 hallazgos + el P0 de la ocupación (2026-08-20)
- [x] Arreglo TTM en las 8 superficies web, incluido el PDF que se envía a leads (2026-08-20)
- [x] Pipeline: mediana TTM real en ocupación y tarifa, motivo de omisión persistido, `status=empty` cuando un scraper trae 0 filas (2026-08-20)

- [x] **La barra de confianza de la LP de lotes dejó de nombrar a un asesor** (2026-08-20) — Luis vio la tarjeta «Quién te atiende» con la cara de Conrad Alvarado y pidió *dejar una opción de conocer al equipo completo y quitar al asesor de ahí*. En `TrustBar.tsx` la celda pasa a icono `Users` + «Conoce al equipo completo» → `/es/nosotros/equipo-comercial` (200, `target="_blank"`); con ello **desaparece la única imagen de la barra** (fuera el `import Image` y la rama `foto` del render) y la celda deja de ser condicional a que el Hub traiga asesor. El razonamiento va escrito en el comentario de cabecera del componente: quien atiende un lead depende de la asignación, así que una cara concreta promete a una persona que puede no ser la que conteste. `tsc --noEmit` + `eslint` + `npm run build` verdes; commit `4169425` (**solo ese archivo**), rebasado sobre el PR #35 que entró en medio. **Verificado 12/12 contra el HTML de producción con `Cache-Control: no-cache`**, 0 lecturas del build viejo. «Conrad Alvarado» bajó de 6 a 4 ocurrencias — que son 3 y 2 *lugares*, porque **el payload RSC duplica cada string** ([[feedback_validar_el_medidor_antes_de_confiar]]). El deploy de Hostinger tardó ~1–2 min, no los 3–6 anotados. Edición hecha con script de node con guardas de match único, no con `sed`: el archivo es CRLF ([[feedback_crlf_rompe_replace_en_silencio]]).

- [x] **SEO local: NAP unificado y el sitio atado a la ficha de Maps** (2026-08-20) — Arrancó como "¿cómo mejoramos el ranking en Maps?" y el hallazgo fue que el sitio le contaba a Google una historia contradictoria: **cinco fuentes de dirección con tres calles distintas**, ninguna coincidiendo con la ficha verificada (5ta Avenida esq. Calle 40 Norte, **CP 77720**). El JSON-LD llegaba a contradecirse dentro del mismo objeto: `description` decía "5ta Avenida" y `address` decía "Calle 5 Norte 95". Fuente única nueva en `src/lib/seo/nap.ts`; `SchemaMarkup` pasa de `LocalBusiness` genérico a **`RealEstateAgent`** con `geo`, `hasMap` y `sameAs` → ficha por CID `8644542860614705024`, más `areaServed`; el embed de `/contacto` deja de ser búsqueda de texto (`?q=`) y pasa a incrustar la ficha por CID, con enlace visible; Hub `Propyte_site_config` actualizado. `nap.test.ts` escanea `.ts`, `.tsx` **y los JSON de i18n** buscando valores muertos — incluir JSON fue lo que delató las dos direcciones escondidas que mi primer escaneo de solo TypeScript dejó pasar. Commit `4dad93c`. Ver [[feedback_nap_vivia_en_cinco_lugares]], [[reference_propyte_ficha_google_business]].
- [x] **Horario corregido: abre los siete días 10:00–19:00** (2026-08-20) — El sitio declaraba Lun–Vie 9:00–18:00 y Sáb 10:00–14:00 en cuatro capas. Luis confirmó que abre **todos los días de 10 a 19**, así que estaban mal la apertura, el cierre y el domingo salía **cerrado**. Es el error más caro de los tres: quien consulta en domingo ve "cerrado" y no viene. Corregido en `NAP_OPENING_HOURS`, en `dondeEstamos.labHours` (home) y `contact.info.hours` de ambos idiomas, y en el Hub; el test fija los 7 días. Commit `018cea1`. **Pendiente fuera del repo: la ficha de Google.**
- [x] **`/contacto` rescatada del client-side rendering + fix del CSP** (2026-08-20) — `useSearchParams()` en `ContactPageContent` sin `<Suspense>` sacaba del prerender la **página entera**: 1539 chars de texto, `h1=0`, una sola etiqueta JSON-LD frente a las 3 de `/faq`. Diagnosticado por contraste (el hook está en `/contacto` y en ninguna de las cinco páginas sanas). El `?asunto=` se lee ahora de `window.location.search` dentro del mismo `useEffect` — solo se necesita tras hidratar, así que es equivalente y no arrastra el árbol. Envolver en `<Suspense>` habría arreglado a los hermanos pero **no** el contenido (queda el fallback, inservible para SEO). Guardia nuevo `tests/prerender-seo.mjs` + `npm run test:prerender`, sin umbrales de caracteres (`/contacto` es corta de verdad y cualquier número redondo da falsos positivos). **De paso, regresión propia:** el embed que había introducido apuntaba a `maps.google.com`, host que el CSP no lista en `frame-src`. Commit `86fb066`. ⚠️ Falso positivo que me costó tiempo: `grep RealEstateAgent` da match aunque no exista la etiqueta, porque aparece escapado en el payload RSC — hay que exigir `<script type="application/ld+json"` literal. Ver [[feedback_usesearchparams_vacia_el_html]].
- [x] **`info@propyte.com` devuelto al aviso de cumplimiento** (2026-08-20) — Al unificar el NAP lo cambié a `contacto@` en el aviso legal; Luis confirmó que `info@` **existe** como buzón alternativo y ahí era correcto. Revertido. Lo relevante es cómo: **el guardia no se aflojó, se hizo más preciso** — prohibir el string a secas lo bloqueaba también donde sí corresponde, así que el test comprueba la **ruta exacta** (`avisoLegalPage.section7Body` en ambos idiomas, y nunca en TypeScript). Si se cuela como correo de contacto general, falla igual que antes. Commit `e164680`.

- [x] **Comentarios de versión de los pins de Actions corregidos + `sharp` 0.35.3 verificado en prod** (2026-08-18) — Cierre del barrido de Dependabot. **(1)** Los workflows pinean por SHA (correcto: un tag se puede mover, un SHA no) con la versión en un comentario al lado; Dependabot actualizó el SHA en #25/#26 sin tocar el comentario, así que `ci.yml` y `playwright.yml` decían `# v5`/`# v6` cuando los SHA son **v7.0.1** y **v7.0.0** — verificado contra los tags reales de cada repo de action, no de memoria. PR #34 (4 líneas, SHA intactos), CI y Playwright verdes, squash `7b4802e`. Cero `# v5`/`# v6` en `main`. **(2)** El push de #34 hizo recompilar Hostinger y ahí se cerró el único riesgo abierto: `/_next/image?…&w=32&q=75` devuelve **200 con `image/avif`**, o sea `sharp` 0.35.3 transcodificando en Linux, no solo mi validación en Windows. 🔑 **Dos correcciones a lo que yo mismo había afirmado, ambas desmontadas probando en vez de razonando:** el 403 «without workflow scope» de los merges era **la base desfasada** (`@dependabot rebase` y entraron los cuatro), y el arreglo de los comentarios **no requería reautenticar** — `git push` de workflows sí pasa con este token; el scope solo limita la API de OAuth App. Memorias: [[feedback_dependabot_workflow_scope_se_cura_con_rebase]]. Estado final: `main`=`7b4802e`, CI+Playwright verdes, 0 alertas de Dependabot, sitio 200, único PR abierto el #32 (de una persona).
- [x] **Pixel de OpenAI Ads instalado en propyte.com, EN PROD y verificado** (2026-08-18) — Luis pasó ID, snippet y llamada de evento desde Ads Manager (fuente de datos "Propyte.com", pixel `GGwkPvXutsXVZwtbnju2u4`). Tercer destino junto a GA4/Google Ads y Meta, disparado desde el mismo `src/lib/analytics/track.ts`. Archivos nuevos `src/lib/analytics/openai-ads.ts` y `src/components/shared/OpenAiPageView.tsx`; modificados `Analytics.tsx`, `track.ts`, `consent.ts`, `.env.example`. Eventos: `page_viewed` (carga + navegación de cliente), `contents_viewed` (fichas), **`lead_created`** (única conversión dada de alta en Ads Manager) y custom `whatsapp_click`. **Tres decisiones no obvias:** (1) el consentimiento del SDK **arranca CONCEDIDO**, así que el snippet fija `oaiq("consent", <bool>)` antes del `init` leyendo el mismo `localStorage` del banner — de paso el visitante recurrente sí queda cubierto, cosa que GA4 y Meta no hacen; (2) `page_viewed` **no se auto-dispara** ni observa el History API, de ahí el componente de navegación; (3) el ID va como **default en código**, no solo en env, porque Hostinger compila en el servidor y una `NEXT_PUBLIC_*` sin dar de alta dejaría el pixel apagado en silencio (se apaga con el literal `off`). Commit `21848a6`, merge directo a `main` autorizado por Luis; CI y Playwright verdes; **12/12 peticiones a propyte.com traen el pixel**. Los 4 eventos verificados en navegador contra el build de producción, y `lead_created` probado interceptando `/api/leads` para **no crear un lead real**. ⚠️ Lo caro no fue el código: la verificación local mentía por dos `next start` zombis que pisan `.next` y porque con `output: standalone` **`next start` no sirve el build**. Ver [[project_openai_ads_pixel_propyte]], [[reference_openai_ads_pixel_api]], [[feedback_next_start_zombi_pisa_el_build]], [[feedback_next_output_standalone_next_start_no_sirve]].
- [x] **LP Lotes PdC — fixes de Quality Score, EN PROD y verificados contra el sitio vivo** (2026-08-18) — La campaña perdía ~90% de impresiones por RANGO con la puja topada en 14 MXN y `post_click_quality_score = BELOW_AVERAGE` en las 5 keywords. Medido: **no era velocidad** (LCP 3,088 ms, CLS 0.0000) **ni transparencia**, era **relevancia de contenido** — la página vendía UN lote y las búsquedas son en plural sobre un mercado con **670 lotes publicados** de Propyte. Cambios: `title`/H1/vocabulario en plural («terrenos» 1→20, «residencial» 0→33); `<ComparadorLotes>` subido de la pantalla 8.9 a la 2.2; línea de comercializadora; **el banner de cookies tapaba los DOS CTA del hero** en 390×844 (banner y 616–764 vs CTA y 636–692 y WhatsApp y 704–756) → `bottom-0` + copy recortado, ahora 51 px de aire; fuerza visual de los 3 CTA a 16px/600 con elevación y el paso 1 del wizard rescatado de `14px/400 blanco sobre blanco con borde al 14%`; `WhatsAppCta` propaga `gclid`/`wbraid`/`gbraid`/`fbclid` (el canal primario no llevaba NADA de atribución). Spec nuevo `tests/e2e/lp-lotes-qs.spec.ts` con 6 asertos, uno de ellos convierte en test la regla de marca de que el nombre interno del desarrollo nunca es público. Commits `83f7afd` + `dacfe82` + `2172695`, fast-forward a `main`. **6/6 verificados con `PLAYWRIGHT_BASE_URL=https://propyte.com`.** ⚠️ Dos diagnósticos del brief NO se sostuvieron: el DSA no es riesgo (acotado por criterio de página, `landing_page_view` confirma una sola URL) y el Consent Mode no toca el QS. ⚠️ **Revertí una decisión deliberada documentada en la línea ~260 de este archivo** (el comparador iba después del cierre para no desviar a quien ya venía decidido): el QS pesa más, pero hay que medir conversión, no solo QS.
- [x] **Barrido completo de los 12 PRs de Dependabot** (2026-08-18) — Luis preguntó qué eran los 12 PRs abiertos y pidió descartar los innecesarios. Revisión de cada uno contra `origin/main` **real** (worktree aislado, no el repo principal, que tenía otra sesión dentro), no contra sus checks. **Mergeados (6):** #26 setup-node v7.0.0 · #9 @types/node 26.2.0 · #25 checkout v7.0.1 · **#33** (propio) · #22 cache v6.1.0 · #7 upload-artifact v7.0.1. **Cerrados (7)** con justificación escrita en cada uno: #30 eslint 10 (bloqueado aguas arriba por `eslint-plugin-react`, no por nuestro código) · #20/#19/#18/#17 (los cuatro `CONFLICTING` y pidiendo versiones ya obsoletas → sustituidos por #33) · #16 typescript 6 (en conflicto, dos majors atrás) · #15 bundle-analyzer (en conflicto y sin sentido suelto). **Ninguno era de seguridad**: cero alertas abiertas de Dependabot, nada urgente. Tres hallazgos no obvios, cada uno en su memoria: los ❌ fósiles de junio ([[feedback_dependabot_checks_fosiles]]), el 403 de scope que era base desfasada ([[feedback_dependabot_workflow_scope_se_cura_con_rebase]]) y el techo real del tooling ([[feedback_eslint10_typescript7_bloqueados_por_next]]). Se corrigió además la memoria que afirmaba que no hay `jq` en este git-bash — sí hay, v1.8.2.
- [x] **PR #33 — subida de las 4 dependencias de app en un solo lockfile** (2026-08-18) — Creado para sustituir los 4 PRs de Dependabot en conflicto, con las versiones de HOY en vez de las de junio: `sharp` 0.34.5→**0.35.3**, `react-hook-form` 7.72.1→**7.85.0**, `next-intl` 4.11.2→**4.13.7**, `framer-motion` 12.38.0→**12.40.0** (nos quedamos en 12.x; la 13.1.0 es major y se evalúa aparte). Verificado en worktree limpio sobre `origin/main` antes de subir: `npx tsc --noEmit` exit 0, `npm run lint` 0 errores (21 warnings preexistentes de código de app), `npm run build` exit 0 y `sharp` procesando imágenes con libvips 8.18.3. **Verde en `CI` + `Playwright` sobre `main`.** El lockfile se reescribió limpio (−720/+254 líneas). Nota: `sharp` 0.35 eliminó `./package.json` de sus `exports`; nada en el código lo importaba. Squash `f5d75d8`, con los blobs de `package.json` y `package-lock.json` verificados idénticos al commit original antes de borrar la rama.

## Notas

- **Sistema de utilities cristalino en `globals.css:736-915`** — todas las clases `.propyte-*` viven ahí (regla del usuario "todo en CSS global"). Cero hex brand-cyan sueltos en `src/app/[locale]/**`.
- **Validación headless gotcha:** Playwright headless puede renderizar mal `backdrop-filter` en glass cards. Memoria: `feedback_playwright_glass_screenshots.md`. Validar con navegador real para rutas con glass crítico.
- **Deploy actual staging:** `dpl_EhFYpkBqKuYCum1VNvASsEkcuAhw` (Glass system Tanda 1 + perf WIP, 2026-05-15) aliased a `https://dev.propyte.com`. Rollback: `vercel alias set dpl_7ctuQhFEEhorQ6srqvgC1vfsFjVn dev.propyte.com` (Hero atmosphere + Q11 previo). PR abierto: https://github.com/Propyte-Team/Next_Propyte_web/pull/4 (`feat/glass-system-propagation` → `develop`).
- **Vercel CLI inline obligatorio:** `cd <repo> && vercel --prod` siempre en una línea. Memoria `feedback_vercel_cli_cwd.md`.
- **Brand identity rule:** `#A2F9FF` solo en dark bg; light bg → `#0D9488` (teal-a11y WCAG AA). Memoria `project_next_propyte_brand_identity.md`.
- **Naranja allowlist:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator` (semantic warnings), `playground/*`, `design-playground/*`, token `--color-amber` legacy.
- **Cluster filter mecanismo** (`/propiedades`): WeakMap `markerToIdRef` + `onClusterClickRef` (ref-mirror para evitar re-suscripción) + state `clusterFilter` en MarketplaceContent que filtra `displayed = filtered ∩ clusterFilter`. Auto-clear con cualquier filter change.
