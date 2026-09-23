# Next_Propyte_web — Task Manager

> Última actualización: 2026-09-02 (tarde) — **la guía de terrenos está EN PRODUCCIÓN** (PR #85 mergeado, agenda funcionando). **PR #86 abierto** con tres arreglos vistos ya en vivo: la agenda pasa a capa con el scroll bloqueado, la CSP no permitía calendar.google.com, y las fotos iban lazy y sin proxy. Sigue pendiente curar 2 portadas en el Hub. Ver «En progreso → Guía de terrenos».
>
> Anterior: 2026-09-02 (mañana) — guía terminada en rama, sin PR. 38 commits, 521 tests, `tsc`/`eslint`/build limpios, 3 e2e, revisión visual hecha. Faltan dos cosas de Luis antes de que sirva: la variable de la agenda en Hostinger (antes del build) y curar dos portadas en el Hub. Ver «En progreso → Guía de terrenos». Entrada previa: 2026-09-01 (tarde), los 18 formularios.
>
> Anterior: 2026-09-01 (tarde) — **los 18 formularios exigen nombre + correo + teléfono con selector de lada; todo en producción y verificado.** Entrada previa: lote del tablero de mejoras, PRs #75 y #76 (ya mergeados). Entrada previa: 2026-08-18 (barrido de los 12 PRs de Dependabot).
>
> 🚨 **Este archivo está DIVERGIDO, no atrasado.** Medido el 2026-09-01: esta versión (la de
> `origin/main`) pesa 74 KB y la copia del árbol principal —parada en `feat/meta-capi-rebased`,
> sin commitear— pesa 45 KB y **no contiene lo de aquí**. No es que una vaya por delante: son
> dos documentos distintos, y la corta se llevó ~29 KB. Es la tarjeta **#252** («decidir qué
> versión gana») y sigue sin decidirse: no la resuelvo por mi cuenta. Escribir en la copia del
> árbol principal es escribir en arena mientras esa rama no sea `main`.
>
> Entrada del 2026-08-18 — **barrido de los 12 PRs de Dependabot**. `origin/main` = `21848a6`. 6 mergeados, 7 cerrados, 1 PR propio (#33) creado y mergeado con las dependencias de app a versiones de hoy. Ver «En progreso → Dependabot / tooling».
>
> 🚨 **3 de los 4 ❌ que se veían en la lista de PRs eran fósiles del 16 de junio**, de cuando `main` tenía 11 errores de lint ya corregidos. El PR #7 solo tocaba `playwright.yml` y aun así «fallaba» el job de `ci.yml` — imposible. El campo que lo delata es `completedAt` de cada check, que la UI de GitHub no pone delante. Ver [[feedback_dependabot_checks_fosiles]].
>
> 🚨 **El 403 «without workflow scope» al mergear los PRs de Actions NO era falta de permisos: era la base desfasada.** `@dependabot rebase` y entraron los cuatro. Cada merge desfasa a los siguientes, así que hay que rebasear uno por uno. Cuando `gh pr merge` (GraphQL) insiste, la API REST (`gh api -X PUT .../pulls/<n>/merge`) aceptó lo que GraphQL rechazaba. Ver [[feedback_dependabot_workflow_scope_se_cura_con_rebase]].
>
> **ESLint 10 es imposible hoy y TypeScript 7 rompe el lint; TypeScript 6 compila limpio.** `eslint-plugin-react@7.37.5` (la última) solo declara peer hasta `eslint ^9.7`, y `eslint-config-next@16.3.1` (la última) depende de ella. Nada que arreglar en nuestro código. Ver [[feedback_eslint10_typescript7_bloqueados_por_next]].
>
> ✅ **`jq` SÍ existe** en este git-bash (`/c/Users/ptoral/bin/jq`, v1.8.2) — se corrigió la memoria que afirmaba lo contrario y que llevaba a evitarlo.
>
> Anterior: 2026-08-13 — **atribución de leads al QR + 🚨 fix de UTMs que destruían leads**. `main` = `9d9c772`. Trabajado en el worktree `Next_Propyte_web-qr`, en paralelo a la sesión de la LP.
>
> 🚨 **`/api/leads` estaba perdiendo leads COMPLETOS.** Validaba los UTMs con `.regex(/^[A-Za-z0-9._~-]{0,200}$/)` dentro del `z.object`: un valor con espacio o acento no se descartaba, tumbaba el `safeParse` entero y devolvía `400` **antes de cualquier escritura**. Sin fila en Supabase, sin push a Zoho, sin nada que reintentar. Una campaña «Restaurante Corazón» borraba todos sus propios leads, y aplica igual a cualquier campaña de Ads con acentos. **El daño histórico no se puede medir**: nunca tocó la base. Fix en `src/lib/leads/utm-sanitize.ts` — sanear, nunca rechazar. Ver [[feedback_zod_regex_en_objeto_tumba_el_parse]].
>
> **Atribución QR (verificada end-to-end en prod con un lead real):** el `short_code` viaja como `?qr=` desde `/q/[code]` del Hub hasta `public.leads.qr_code` y el campo `QR_de_origen` de Zoho. Capturado en `useUTMCapture` **y** en `LeadFormLotes` — duplicados a propósito, la LP vive fuera de `[locale]`, así que **toda mejora de atribución va por duplicado**. También en `zoho-retry`, o el reintento perdía la atribución.
>
> **Asesor fijo del QR → `Owner` de Zoho** vía `resolveQrOwner()` (`src/lib/leads/qr-owner.ts`). Es **opt-in**: sin asesor en el QR no se toca `Owner`, porque el test demostró que **Zoho ya asigna dueño solo**. ⚠️ Usa **cliente dedicado** al schema `qr` — `.schema()` sobre el cliente compartido deja sticky `Accept-Profile` y revienta los INSERT a `public.leads` con 500.
>
> **`wbraid` ya se persiste** (columna creada en `public.leads`). Antes se capturaba y llegaba a Zoho, pero se descartaba al guardar: solo se veía abriendo el lead uno por uno, inservible para importar conversiones offline en bloque.
>
> ⚠️ **Lección de proceso:** la primera versión de esta nota la escribí en el worktree principal, que estaba en la rama de otra sesión. `task_manager.md` es un archivo versionado, así que un cambio de rama se la llevó completa. Editarlo **solo desde un worktree cuya rama vaya a `main`, y commitearlo**.
>
> **LP Lotes PdC — handoff de arquitectura de persuasión, 14 de 15 puntos.** Rama
> `feat/lp-lotes-trustbar`, rebasada sobre este `main`. TrustBar, badge que ya no miente
> («Uno disponible» → `229 disponibles según el desarrollador`), acordeón «Antes de firmar»
> (−62.7% de scroll en la zona de riesgo), formulario de 2 pasos, `Figure` con caption
> obligatorio, y la prosa que se leía a 34 caracteres por línea. Ver «En progreso».
>
> Anterior: 2026-08-12. **LP Lotes PDC DESPLEGADA a producción** (`8b87115` en `origin/main`, fast-forward de 7 commits, GHA→Hostinger en ~20s): rediseño terracota, chips de plazo y comparador de los 4 lotes de PdC. Ver primera entrada de «En progreso».
>
> ⚠️ Al medir el alcance del deploy comparé contra `main` **local** (parado en junio) y reporté 699 commits; contra `origin/main` eran **7**. Medir divergencias siempre contra el remoto tras `fetch`. Anterior: 2026-06-01 (sesión iconos infografía + rediseño tags descuento). **✅ Deployado a `dev.propyte.com` (`dpl_62pk2AkUjF3`) y aprobado visualmente por Luis.** Iconos infografía Home → `@/lib/icons`; tag galería cyan brillante #5CE0D2; tag precio → `tag_2_2` ancho; chip descuento junto al precio + nueva fila Descuento en DATOS CLAVE. Pendiente: commit del bundle (uncommitted en `feat/editorial-markdown-render`).

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

## Guía de terrenos residenciales — 🟢 EN PRODUCCIÓN · 🟡 PR #86 abierto

Rama `feat/guia-terrenos-residenciales`, worktree `Next_Propyte_web-guiaterrenos`,
rebasada sobre `origin/main` = `4ef7387`. Página `/{locale}/guias/terrenos-residenciales`
en ES y EN, alimentada del inventario, enlazada desde *Recursos* en el footer.

- [x] **PR #85 abierto, mergeado y desplegado** (2026-09-02)
- [x] **`NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL` puesta en Hostinger antes del build** (2026-09-02) — verificada incrustada en el chunk de producción.
- [ ] 🟡 **Mergear el PR #86** — tres arreglos vistos con la página ya en vivo. Ojo: mergear es desplegar (~4 min). Next incrusta las `NEXT_PUBLIC_*` al compilar y aquí compila el servidor: `git pull` o reiniciar PM2 no la incorporan. Va al lado de las que ya emite el sitio (`AW-18124069969`, `G-H4VD5TVEKM`). Sin ella el formulario funciona y la agenda no aparece.
- [ ] 🔴 **Curar dos portadas en el Hub** (decisión de Luis): dos de las seis fotos llevan el nombre del desarrollo rotulado DENTRO de la imagen. Las segundas de cada galería están limpias y verificadas a ojo — `club-residencial-con-amenidades` → `…/44b0c506-…/1785790029985-vkwkn5.webp`; `lotes-residenciales-en-playa-del-carmen-2` → `…/09d27fcb-…/1785274768534-h4vp93.webp`.
- [ ] **Poner también `NEXT_PUBLIC_CALENDLY_URL`** apuntando al mismo link de Google: enciende de paso el botón de agendar de `/contacto`, que **nunca se ha renderizado**. Ver [[feedback_calendly_url_nunca_estuvo_puesta]].

**Lo que salió de mirar la página en producción (PR #86):**

- [x] La agenda se llevaba el scroll: 250 px por gesto de rueda. Pasa a capa con el body bloqueado; medido después, 0 px. `overscroll-behavior: contain` **no** lo arregla — se probó y se midió (2026-09-02).
- [x] La CSP nunca permitió `calendar.google.com` en `frame-src`: la agenda funcionaba porque la política va en report-only (2026-09-02).
- [x] Las fotos: `loading="lazy"` en las visibles al abrir, y URLs crudas del storage porque la guía se saltaba `maskRows` (2026-09-02).
- [ ] 🟡 **`NEXT_PUBLIC_CALENDLY_URL` sigue sin poner.** El botón de agendar de `/contacto` no se ha renderizado jamás. Apuntarla al mismo link de Google lo enciende en el mismo deploy.
- [ ] Extraer una cáscara de modal común: hay **cuatro copias** de la misma lógica (`TeamBioModal`, `ShareDownloadModal`, `GlossaryLeadGateModal`, `AgendaModal`).

**Captura pendiente en el Hub** (se ve en la página; es dato, no código):

- [ ] `amares-riviera-maya` **no aparece en la guía**: sin precio capturado. Se lo ponen y entra solo.
- [ ] **3 de 6 proyectos no publican mensualidad.** Tener `fin_meses_opciones` no basta: hace falta `fin_tasa` en `0` **y** un esquema de pago parseable. Les falta a `lotes-residenciales-en-la-region-11-de-tulum` y a `lotes-residenciales-en-playa-del-carmen-2`.
- [ ] `delivery_text` con typo: «Primera quincena de novi**rm**bre».
- [ ] Los 3 proyectos del Gamma que no existen publicados (`MO-SUR2027`, `AMXP-EI`, `NTSUR-30`) seguirán ausentes hasta que se den de alta.

**Deuda que quedó anotada y NO se arregló:**

- [ ] Cuatro sombras **latentes** en el catálogo de amenidades (`spa` caza «esparcimiento» y «Espacios verdes», `pet` caza «petanca», y `pool table` en `game_room` es código muerto). Ninguna aparece hoy en el inventario publicado. Ver [[feedback_regex_de_amenidades_alternativa_desnuda]].
- [ ] El test de fuga de nombres **contra el inventario real está SKIPPED**: vitest no carga `.env.local` (fija `NODE_ENV=test`). Los otros dos sí corren, incluido el estructural que verifica que el `.select()` nunca pide `name`.
- [ ] `formatPrice`/`formatArea` fijan locale `es-MX`, así que en `/en` los separadores de millar salen en formato mexicano. Es del repo entero, no de esta página.

## Formularios: los tres datos obligatorios (sesión 2026-09-01 tarde) — ✅ CERRADO Y VERIFICADO

> ✅ `origin/main` = **`92f28e4`**, desplegado y **verificado contra producción**: 36/36 e2e de los
> 18 formularios, 4/4 del banner en cuatro viewports, 436 unitarias, y **0 leads creados** por las
> pruebas. Los 2 leads reales de esa hora llegaron con teléfono y sincronizaron a Zoho.
>
> Nombre, correo y teléfono son obligatorios en los 18 forms de captación; el teléfono se captura
> con selector de lada de ~247 países y viaja en **E.164**. `faltanDatosDeContacto()` lo respalda en
> el servidor. `NewsletterCTA` queda exento a propósito. Commits: `d9f97c6`, `ea9857b`, `92f28e4`.
> Memorias: `feedback_selector_lada_react_phone_number_input`,
> `feedback_banner_fijo_tapa_sticky_no_se_recupera`.

- [ ] **`/es/built` devuelve 404 en producción** — la página ENTERA de Propyte Built, no solo su
      formulario. Es previo a esta sesión y sin diagnosticar. El `ConsultationForm` ya tiene el
      campo de teléfono, pero nadie puede verlo. **Prioridad: es una sección de servicio caída.**
- [ ] **`B2BForm` es código muerto** — ningún componente lo importa (`src/components/developers/`).
      Decidir si se borra o si debía estar montado en `/desarrolladores` y se perdió.
- [ ] **`BlogSidebarBrokerForm` no se monta hoy** — solo aparece en posts de categoría «Para
      Asesores» y no hay ninguno publicado. Comprobado en `que-es-un-master-broker`: sale la
      variante de inversionista. Funcionará en cuanto se publique uno; no hay nada que arreglar.
- [ ] **Vigilar la conversión de las dos LP de lotes** — ahora piden un campo más en tráfico
      pagado: `/lp/lotes-playa-del-carmen` tenía el correo colapsado y opcional, y
      `/lp/terrenos-playa-del-carmen` no tenía campo de correo (su rótulo decía «2 campos», ahora
      3). Si cae, se revierte solo ese campo sin tocar el resto.
- [ ] **En `/es/contacto` el banner de cookies tapa el campo *Nombre* a scroll 0** — molestia
      recuperable bajando, aceptada a cambio de desbloquear tres formularios que quedaban sin
      salida. Si molesta, la salida limpia es acortar el banner (mide 227 px; con ≤173 px libraría).
- [ ] **Retirar el worktree `Next_Propyte_web-phonefield`** (rama `feat/forms-telefono-obligatorio`,
      ya en `main`). Ojo: tiene una copia de `.env.local`.

## Lote del tablero de mejoras (sesión 2026-09-01) — ✅ #75 y #76 YA MERGEADOS (junto a #74 y #77)

> El tablero (`hub.propyte.com/mejoras`, tools `mejoras_*`) es la fuente de verdad de estas
> tareas; aquí queda la bitácora para que la cosecha no vuelva a levantar lo ya hecho —
> que es exactamente la tarjeta #641.

**[PR #75](https://github.com/Propyte-Team/Next_Propyte_web/pull/75) — tarjeta #230, CI 4/4.**
El autocompletado del navegador rellena sin disparar `change`: el campo se ve lleno, el
estado de React sigue vacío y al enviar o sale «falta tu nombre» o —en `/built` y el lead
magnet— no pasa nada en absoluto. Se extrajo el patrón de `FormCasas` (leer el `<form>` en
el ENVÍO con `FormData`, no un `useEffect` de montaje) a
`src/lib/leads/rescate-prehidratacion.ts` y se aplicó a los 7 que faltaban. 25/25 corridas
fallaban contra propyte.com; 25/25 pasan en la rama.

**[PR #76](https://github.com/Propyte-Team/Next_Propyte_web/pull/76) — tarjetas #235 y #199, CI 4/4.**
`/es/desarrollos/tipo/<basura>` devolvía 200 con el cuerpo del 404 → `dynamicParams = false`.
Y los tres paquetes de Next a 16.3.4.

### Pendiente de Luis

- [ ] **Mergear #75 y #76.** Mergear = desplegar (Hostinger compila en el servidor); la CDN
      sirve mezclado ~5 min. Sonda del #235: `curl -s -o /dev/null -w "%{http_code}" https://propyte.com/es/desarrollos/tipo/basura-inventada-xyz` → 404.
- [ ] **#215** — una palabra: quitar o dejar la instrumentación de depuración de
      `useFilters`. Recomendado **dejarla**: no cuesta nada en prod y ese hook ya dio un bug.
- [ ] **#200** — `@types/node ^26` contra Node 22 del CI. Recomendado **bajar los tipos a
      `^22`**: tipos más nuevos que el motor dejan compilar lo que revienta en ejecución.
- [ ] **#252** — decidir qué versión de este archivo gana (ver el aviso de la cabecera).

### Abierto, con tarjeta

- [ ] **#676 — el soft-404 es de CLASE.** `/desarrollos/<slug>`, `/zonas/<slug>` y
      `/blog/<slug>` siguen en 200 con cuerpo de 404, y esas sí tienen direcciones
      ilimitadas. No se arreglan con `dynamicParams` (su slug resuelve contra Supabase).
      Dos hipótesis YA descartadas por medición, no repetirlas: no falta el `notFound()`
      (se ejecuta), y **añadir `src/app/[locale]/not-found.tsx` no cambia el status** —
      se probó y se recompiló.
- [ ] **#226 bloqueada por #677 (hub).** Los testimonios guardan la liga a su publicación
      original, pero el sitio no lee de Supabase: se los pide a
      `hub.propyte.com/api/public/testimonials`, y ese endpoint no la devuelve. Primero el
      Hub, luego la web.
- [ ] **#645 no es «simple»** — no existe negociación de markdown en el repo. Poner
      `Vary: Accept` sin servir markdown fragmenta la caché de la CDN sin beneficio.
- [ ] **Los forms con react-hook-form no se midieron** (`/contacto`, `/proveedores`,
      `/unete`, `B2BForm`, `ContactForm`, `GlossaryLeadGateModal`): son inputs no
      controlados, otra arquitectura. No suponerlos inmunes sin medir.

### Trampas de esta sesión

- 🚨 **`TaskStop` no mata el `next start`**: 5 huérfanos retuvieron los binarios nativos
      (`next-swc…node`, `libvips-42.dll`) y reventaron un `npm ci` a mitad, dejando
      `node_modules` en 35 entradas de 639. Se leen como permisos o antivirus y no lo son.
      Matar por PID tras parar; `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*<worktree>*' }"` sí funciona en este equipo.
- 🚨 **`zoho-forms.spec.ts` crea leads REALES.** No correrlo. Las suites nuevas
      (`forms-prehidratacion`, `soft-404-taxonomia`, `lp-casas-validacion`) interceptan el
      POST y pueden correr contra producción.
- 🧪 Los tests nuevos miran el **estado** de la respuesta, no el texto: el cuerpo ya decía
      «404» con el fallo vivo, así que un test sobre el markup pasaba en verde con el bug.

---


### Dependabot / tooling (sesión 2026-08-18)

Los 12 PRs de Dependabot quedaron resueltos; el único abierto es **#32**, que es de una
persona. Lo que sigue pendiente de ese barrido:

- [ ] 🚨 **Mirar el primer build de Hostinger con `sharp` 0.35.3** — es el único riesgo que la
      verificación local NO cubre: `sharp` es binario nativo, se validó en Windows y el
      servidor compila en Linux. Ya está en `main` (`f5d75d8`).
- [ ] **Arreglar los comentarios de versión de los workflows, que mienten** —
      `actions/checkout@3d3c42e5… # v5` es en realidad **v7.0.1**, y
      `actions/setup-node@82076278… # v6` es **v7.0.0** (verificado contra los tags del repo
      de cada action). Dependabot actualizó el SHA y no el comentario en #25 y #26; en #22 y
      #7 sí lo hizo. Los pins son correctos, es cosmético pero engaña al que lea el archivo.
      **Requiere scope `workflow`**: `gh auth refresh -s workflow`.
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

_Ninguna._

---

## Completadas recientes

- [x] **Barrido completo de los 12 PRs de Dependabot** (2026-08-18) — Luis preguntó qué eran los 12 PRs abiertos y pidió descartar los innecesarios. Revisión de cada uno contra `origin/main` **real** (worktree aislado, no el repo principal, que tenía otra sesión dentro), no contra sus checks. **Mergeados (6):** #26 setup-node v7.0.0 · #9 @types/node 26.2.0 · #25 checkout v7.0.1 · **#33** (propio) · #22 cache v6.1.0 · #7 upload-artifact v7.0.1. **Cerrados (7)** con justificación escrita en cada uno: #30 eslint 10 (bloqueado aguas arriba por `eslint-plugin-react`, no por nuestro código) · #20/#19/#18/#17 (los cuatro `CONFLICTING` y pidiendo versiones ya obsoletas → sustituidos por #33) · #16 typescript 6 (en conflicto, dos majors atrás) · #15 bundle-analyzer (en conflicto y sin sentido suelto). **Ninguno era de seguridad**: cero alertas abiertas de Dependabot, nada urgente. Tres hallazgos no obvios, cada uno en su memoria: los ❌ fósiles de junio ([[feedback_dependabot_checks_fosiles]]), el 403 de scope que era base desfasada ([[feedback_dependabot_workflow_scope_se_cura_con_rebase]]) y el techo real del tooling ([[feedback_eslint10_typescript7_bloqueados_por_next]]). Se corrigió además la memoria que afirmaba que no hay `jq` en este git-bash — sí hay, v1.8.2.
- [x] **PR #33 — subida de las 4 dependencias de app en un solo lockfile** (2026-08-18) — Creado para sustituir los 4 PRs de Dependabot en conflicto, con las versiones de HOY en vez de las de junio: `sharp` 0.34.5→**0.35.3**, `react-hook-form` 7.72.1→**7.85.0**, `next-intl` 4.11.2→**4.13.7**, `framer-motion` 12.38.0→**12.40.0** (nos quedamos en 12.x; la 13.1.0 es major y se evalúa aparte). Verificado en worktree limpio sobre `origin/main` antes de subir: `npx tsc --noEmit` exit 0, `npm run lint` 0 errores (21 warnings preexistentes de código de app), `npm run build` exit 0 y `sharp` procesando imágenes con libvips 8.18.3. **Verde en `CI` + `Playwright` sobre `main`.** El lockfile se reescribió limpio (−720/+254 líneas). Nota: `sharp` 0.35 eliminó `./package.json` de sus `exports`; nada en el código lo importaba. Squash `f5d75d8`, con los blobs de `package.json` y `package-lock.json` verificados idénticos al commit original antes de borrar la rama.
- [x] **Meta Pixel instalado en propyte.com** (2026-06-01) — Código base del Píxel de Meta `808922354003079` (PageView) agregado a `src/app/layout.tsx` vía `next/script` + `<noscript>` fallback (ID público hardcodeado, no es secreto). Aplica a todas las rutas. Trabajado en **worktree aislado** sobre `main` para no tocar el WIP de `feat/editorial-markdown-render`. Commit `0c50f22` → push `main` → GitHub Actions → SCP Hostinger → PM2. **Verificado en vivo**: `window.fbq` ok, `#meta-pixel` presente, `fbevents.js` 200, request `facebook.com/tr?id=808922354003079&ev=PageView` → 200. Contexto: propyte.com sirve coming-soon (`page.tsx`→`ComingSoon.tsx`), solo PageView hasta que haya conversiones reales. Origen: revisión de píxeles/datasets del MCP de Meta (el píxel no estaba instalado en el sitio). Memory: `project_next_propyte_web_pixel_comingsoon`.
- [x] **DiscountBadge: iconos descuento tag_3/tag_2_1 + fix bug ESM upstream dompurify** (2026-05-28) — Nuevo componente `src/components/ui/DiscountBadge.tsx` con 2 variants (`corner` para tag_3 inclinado sin número, `inline` para tag_2_1 horizontal con `−N%` cyan via span absolute encima del SVG). Icono `DiscountTagInclined` agregado a `src/lib/propyte-icons.tsx` con stroke-width strippeado (hereda 1.5 default del wrapper). tag_2_1 vive inline en DiscountBadge con viewBox crop `2 7 20 10` para forma horizontal. 6 puntos de reemplazo: `MarketplaceCard` (corner bottom-left + inline), `UnitDetailPage` (badgeTopRight + inline), `DevelopmentDetailPage` (badgeTopRight + rollup), `FloatingKeyData` (fila descuento), `UnitModelsTable` (columna + cards mobile). **Bug crítico no relacionado descubierto y fixeado**: TODAS las fichas SSR estaban en 500 latente (incluso desde 3 días atrás) por bug ESM upstream — `isomorphic-dompurify@3.12` → `jsdom@29` → `html-encoding-sniffer@6` → `require()` de `@exodus/bytes@1.x` (ESM-only). Fix: pin `isomorphic-dompurify` a `2.20.0` (usa `jsdom@26` + `html-encoding-sniffer@4` CJS-safe). API compatible, sin cambio de código. Deploy final `dpl_2swyj6274-propyte` → fichas 200 verificadas via curl. Memory: `feedback_exodus_bytes_esm_break.md`.
- [x] **UI Fixes Bundle 2026-05-23** (2026-05-23) — Spec `specs/ui-fixes-bundle-2026-05-23.md` ejecutado 7 fixes + 1 bonus en branch `develop`, 3 deploys CLI a Vercel prod (`dev.propyte.com`), verificado por Luis. **F**: `PriceDisplay` prop `tone:'light'|'dark'` con texto referencial `text-white/75` y `(Referencial)` `text-white/55` sobre fondo `#1A2F3F` (WCAG AA). **E**: `/promociones` threshold `< 2` → `< 1` con schema gate ≥2 preservado + ICU plural en `countLabel`. **C**: `CurrencyToggle` eliminado del UI (archivo borrado), `CurrencyContext` API slim `{rate, rateUpdatedAt, formatMxn}`, refactor 5 consumers (MarketplaceCard usa `<PriceDisplay variant='dual'>` para precio de propiedad; MortgageCalculator/InvestmentComparison/ComparisonTable usan `formatMxn`). **B**: ComparePanel filas condicionales — devs 5 filas (Precio desde/hasta, Ubicación, # Amenidades, Tipo desarrollo), units 4 filas (Precio, Ubicación, # Amenidades, Tipo), mixto 5 con `—` en "Precio hasta". 7 i18n keys nuevas. **D**: WhatsApp `scrollY > 100` (antes 300) + `handleScroll()` se dispara al montar + `trackWhatsAppClick` en try/catch. **A**: `useFilters` instrumentado con debug logging gated por `localStorage.debug_filters==='1'` (zero-cost en prod). **Dropdown filtros — root cause encontrado**: el contenedor `overflow-x-auto no-scrollbar` del FilterBar forzaba `overflow-y` a clip por CSS spec, recortando el panel `absolute top-12`. Fix: `createPortal` a `document.body` con `position:fixed` computado via `getBoundingClientRect()` + `useLayoutEffect`, scroll/resize cierra dropdown, ESC también, outside-click chequea ambos refs. **Bonus CookieBanner**: `<AnimatePresence>` exterior retenía banner con opacity 0 pero pointer-events activos en esquina inferior derecha bloqueando WhatsApp + Comparar. Fix: `motion.aside` siempre montado, `pointer-events:none` vía `style` controlado por `open` (salta inmediato porque no es animable). Deploys: `dpl_ArH8yj7stB8tWVQBe5af2vJpyuD6` → `dpl_F4QWbEcww4qsxkNHZtcFw1YHiR3G` → `dpl_7Lt94nKJnryRPduxnzfMcNjZ5h9s`. Working tree uncommitted en develop.
- [x] **Sistema de descuentos end-to-end** (2026-05-23) — Feature completa: BD migration aplicada en Supabase prod (`add_discount_fields_to_unidades` + rebuild v_units/v_developments con `discount_price_mxn`, `discount_pct` GENERATED, `discount_valid_until`, `is_discount_active`, `discounted_units_count`). Property type extendido con `PropertyDiscount` + `discountedUnitsCount`. Mappers leen discount_* con Number() defensive. Query nueva `getDiscountedUnits()`. **5 touchpoints visuales**: Home (`DiscountedUnitsSection` post-Featured), MarketplaceCard (strikethrough brand cyan `decoration-[#0E7490]` + badge `−N%` + corner badge "Con descuento" en cards de development con rollup), `/desarrollos/[slug]` (badge top-right galería "Hasta −N%" + chip al lado de "Desde" + `UnitModelsTable` con columna nueva "Desc." conditional + filas resaltadas cyan), `/propiedades/[slug]` (badge galería + precio lista tachado encima + post-descuento + chip + `FloatingKeyData` sidebar con discount row), `/promociones` (pivot de getFeaturedDevelopments a getDiscountedUnits + Schema.org Offer real). i18n keys ES+EN. Commits `e1ccb40` (feat principal), `ecafcfa` (UnitModelsTable Desc. + padding reducido para evitar scroll lateral), `169359f` (fix NUMERIC-as-string), `fe37c73` (fix badge duplicado). Deploys Vercel `dpl_6SX...`, `dpl_2Ja...`, `dpl_3mo...`, `dpl_HJA...`.
- [x] **Bug fixes en cascada del sistema de descuentos** (2026-05-22/23): (1) CookieBanner Mac tapaba botón Comparar — fix offset `useCompare()` + modal z-60 + sticky thead Safari. (2) `estado_unidad` Hub form mandaba lowercase pero CHECK BD + Zoho usan Capitalized → fix Hub `status-canonical.ts` a Capitalized + helper `capitalizeEstatusVenta()`. (3) Mapper `typeof === 'number'` fallaba con NUMERIC-as-string → fix `Number()` defensive (descubierto al verificar con Playwright que badge aparecía pero precio post-descuento no). (4) Badge "Entrega Inmediata" duplicado en `UnitDetailPage` (span + Badge component ambos con `stageLabel`) — fix: skip Badge si type='nuevo', label vía `badge_{type}` i18n. Hub commits `b7bba6b` + `167c38c`. Next commits `169359f` + `fe37c73`.
- [x] **Blog detail rediseño: fondo blanco + sidebar form sticky** (2026-05-22) — Detail page `/blog/[slug]` migrada de dark heredado a `bg-white text-slate-900`. Grid 2 cols en lg+ (1fr + 360px sticky `top-24`); mobile colapsa con form al final del artículo antes del share bar. 3 componentes nuevos en `src/components/blog/`: `BlogSidebarLeadForm` (source `lead_magnet` para todas las categorías excepto Asesores), `BlogSidebarBrokerForm` (source `affiliate_request` con campos name/email/whatsapp/city, igual a `/unete`), `BlogSidebarForm` wrapper que rutea por `post.category`. i18n namespace nuevo `blogSidebar` en `es/en.json`. Bug fix tangencial: fecha solo se muestra si `published_at` no es null (antes mostraba "Invalid Date" en staged posts). Commit `6dad9d4` en `develop`, deploy via `vercel --prod --yes` (deployment `dpl_9LPBg6tT1Jfbo55GRGB3yDK8hcdv`, aliased `dev.propyte.com`).
- [x] **Ajustes estéticos cards Home + ficha precio** (2026-05-22) — Cards `FeaturedProperties` Home: título `text-sm line-clamp-1` → `text-xs leading-snug line-clamp-2 break-words` (nunca se corta, fluye a 2ª línea). Ficha desarrollo: label "Desde" pasa a block uppercase encima del precio (no rompe alineación con Share/Ficha). `PriceDisplay` dual: sufijo "(Original)" eliminado de arriba (basta "(Referencial)" abajo). Deploys `dpl_8YksvDBWaMz...` + `dpl_8FSpq2pcKuJk...`. Pendiente commit/deploy: PriceDisclaimer.tsx también limpiado para no mencionar el label "(Original)" que ya no existe.
- [x] **Audit Playwright PDF "NOTAS ICONOS" + image proxy** (2026-05-22) — Script `tests/audit-pdf-items.mjs` corrido contra `dev.propyte.com`. 6 PASS confirmados: image proxy (440 URLs, 0 leaks Supabase), logo Propyte infografía visible, brochure icon en Ficha, cards Home título no truncado, (Original) removido en home, Desde label block. 4 items que el audit flag-eó como FAIL (burbuja search, WhatsApp color, titulares acento) confirmados como **OK por revisión manual del usuario** — el script tenía falsos positivos por selectores demasiado genéricos. Cierre del bloque PDF visual completo.
- [x] **Listados refactor profundo + Banxico FX + filtros nuevos + UI/UX iter 4** (2026-05-20 noche-2) — /desarrollos y /propiedades: heroHidden=true (H1 sr-only), loader fullscreen lg:left-[72px], scroll defensivo, min-h grid canvas. Cards: rango precio "Desde X" + currency, chip tipo desarrollo, rango bedrooms agregado v_units, Heart+Brochure removidos, aspect 16/9 (grid) y 5/2 (compact). Split mapa 60/40 → 40/60 (mapa angosto). Hover sync card↔pin (ring cyan brand + scale). Banxico SF43718 FX rate auto (cache 12h). Filtros: Ciudad+Zona dinámicas, Recámaras 1/2/3/4+, Etapa, Tipo desarrollo. Fix bug PREVENTA en mapper unit (`status`+`is_presale` en lugar de `row.stage`). Home FeaturedProperties paridad. UI rhythm `flex flex-col gap-1.5`. Deploy final `dpl_2qmSyY1WbRSDQrZG3UB2zEGhLNrr`.
- [x] **Migración SQL `tipo_desarrollo` unificado** (2026-05-20 noche-2, autorizado MCP) — vertical/Residencial vertical (404) → 'Residencial vertical', mixto (1) → 'Mixto', preventa misplaced (227) → NULL. Backup `Propyte_desarrollos_backup_tipo_desarrollo_20260520`. 231 rows quedaron sin clasificar (legacy scraper).
- [x] **[SAMPLE] AZUL VIVO Residences borrado + soft-delete gate fix** (2026-05-20 noche-2) — Hard delete 6 unidades + 1 desarrollo. Bug subyacente: view `v_developments` expone soft-deleted rows; queries solo filtraban `approved_at`. Fix global: 13 queries en lib/supabase/queries.ts + 5 inline pages ahora filtran `deleted_at IS NULL`. Backups en `*_backup_sample_azulvivo_20260520`.
- [x] **11 iconos custom nuevos + stroke 1.5 fix** (2026-05-20 noche-2) — svgs_mas.zip: bike, car, cook, ghost (refresh), headset, parking, plant, spa, sun, utensils, wifi. Registry actualizado en `lib/icons.tsx`. AmenityList: jardín ahora Plant (era TreePine), spa ahora Spa (era Flower2). **Fix crítico**: generator `build-propyte-icons.js` strippea ahora `strokeWidth="[\d.]+"` generalizado (antes solo `="1"`). Los nuevos SVGs traían `="2"` hardcoded que pisaba el default 1.5 del wrapper. Net: 72 iconos a stroke 1.5 uniforme.
- [x] **Botón "Ver perfil" removido** (2026-05-20) — DevelopmentDetailPage line 678-685. Card Desarrolladora ya no tiene CTA al perfil. `viewProfile` i18n key sigue en uso por UnitDetailPage.
- [x] **Iconografía Propyte v3 + lucide unificadas a strokeWidth=1.5** (2026-05-20 noche) — 61 SVGs custom Propyte v3 + generador `scripts/build-propyte-icons.js` → `src/lib/propyte-icons.tsx` auto-gen (62 componentes incl. ChevronRight flip). `src/lib/icons.tsx` (renamed de .ts) con `withDefaultStroke()` HOC envolviendo cada lucide. Codemod en 127 archivos `from 'lucide-react'` → `from '@/lib/icons'`. Librería legacy `src/components/icons/PropyteIcons.tsx` (47 iconos viewBox custom) ELIMINADA + 7 consumers migrados. Removidos 46 `strokeWidth={2}` heredados. Deploy chain final `dpl_cdmxpp9ps`.
- [x] **"| MPgenesis" cleanup BD + view fixes** (2026-05-20 noche) — 2 migrations: `v_units.title` y `v_developments.publication_title` COALESCE invertido (campo editable Hub gana sobre JSON legacy). UPDATE masivo: 59 unidades + 37 desarrollos limpiados. Bug: Hub edits no se reflejaban porque view priorizaba JSON `ext_content_es.metaTitle` sobre `titulo_unidad`/`ext_meta_title_desarrollo`. Feedback memory: [[supabase-view-coalesce-json-priority]].
- [x] **Rich content JSON surfaced en detail pages** (2026-05-20 noche) — Property type + mappers extendidos con `richContent?: { features, location, lifestyle, faqs }` (8 campos JSON + 2 arrays FAQ ES+EN). Nuevo `RichContentSections.tsx` renderiza Características/Ubicación/Estilo de Vida en Description tab. `UnitFAQs` ahora lee de BD con fallback hardcoded. ~440 palabras adicionales visibles por unidad. Feedback memory: [[propyte-rich-content-json-pipeline]].
- [x] **Mocks unit-fixtures.ts eliminados** (2026-05-20) — Borrado `src/lib/mocks/unit-fixtures.ts` + carpeta. 5 consumers limpiados (UnitDetailPage data+similares fallback, buildPropertyMetadata, opengraph-image, generate-pdf, generateStaticParams). URLs sample (Akora A-301, Nativa Jungla T-12, Playacar Residencias B-205, etc.) ahora 404. Feedback: [[mock-fixtures-indexed-prod]].
- [x] **UI detail-page mejorada (Propiedades + Desarrollos)** (2026-05-20) — FloatingKeyData + DevelopmentKeyData icons 13→18, labels text-2xs→sm, values sm→md. ContactForm sin "Tipo de inversión", Enviar+WhatsApp `grid-cols-2`. UnitDetailPage H1 smaller en flex con Share/Ficha; SpecChips bigger; Highlights+Proximity en Description. Bug badge `STAGES.X` literal arreglado (next-intl path-fallback). WhatsApp en desarrollos siempre presente (fallback global).
- [x] **Home swap Infografía ↔ Destacados** (2026-05-20) — `src/app/[locale]/page.tsx` orden: Hero → FeaturedProperties → LeadMagnet → ProcessInfographic → DeveloperBanner → resto.

---

## Notas

- **Sistema de utilities cristalino en `globals.css:736-915`** — todas las clases `.propyte-*` viven ahí (regla del usuario "todo en CSS global"). Cero hex brand-cyan sueltos en `src/app/[locale]/**`.
- **Validación headless gotcha:** Playwright headless puede renderizar mal `backdrop-filter` en glass cards. Memoria: `feedback_playwright_glass_screenshots.md`. Validar con navegador real para rutas con glass crítico.
- **Deploy actual staging:** `dpl_EhFYpkBqKuYCum1VNvASsEkcuAhw` (Glass system Tanda 1 + perf WIP, 2026-05-15) aliased a `https://dev.propyte.com`. Rollback: `vercel alias set dpl_7ctuQhFEEhorQ6srqvgC1vfsFjVn dev.propyte.com` (Hero atmosphere + Q11 previo). PR abierto: https://github.com/Propyte-Team/Next_Propyte_web/pull/4 (`feat/glass-system-propagation` → `develop`).
- **Vercel CLI inline obligatorio:** `cd <repo> && vercel --prod` siempre en una línea. Memoria `feedback_vercel_cli_cwd.md`.
- **Brand identity rule:** `#A2F9FF` solo en dark bg; light bg → `#0D9488` (teal-a11y WCAG AA). Memoria `project_next_propyte_brand_identity.md`.
- **Naranja allowlist:** `analytics/*`, `InvestmentDisclaimer`, `GeoAnalysis`, `MarketIndicator` (semantic warnings), `playground/*`, `design-playground/*`, token `--color-amber` legacy.
- **Cluster filter mecanismo** (`/propiedades`): WeakMap `markerToIdRef` + `onClusterClickRef` (ref-mirror para evitar re-suscripción) + state `clusterFilter` en MarketplaceContent que filtra `displayed = filtered ∩ clusterFilter`. Auto-clear con cualquier filter change.
