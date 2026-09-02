# Guía de Inversión en Terrenos Residenciales — Riviera Maya

**Fecha:** 2026-09-01 · **Repo:** Next_Propyte_web · **Rama:** `feat/guia-terrenos-residenciales`
**Base:** `origin/main` = `981594f`

## Objetivo

Llevar a propyte.com la guía comparativa de terrenos residenciales que hoy vive en
Gamma, con una diferencia de fondo: **los datos salen del inventario del sitio**, no
de una tabla escrita a mano. La página se actualiza sola cuando el Hub publica o
cambia un desarrollo. Cierra con formulario de captura y agenda de videollamada.

Fuente de referencia: `gamma.app/docs/…-33w7n7ipyx07d0o`. Los dos links que compartió
Luis (ES/EN) apuntan al **mismo documento**, que renderiza en inglés.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Nombre de los proyectos | **Título editorial + link a su ficha.** `publication_title` vía `applyDisplayName`, nunca `nombre_desarrollo`. No se replican los códigos de Gamma. |
| Quién entra en la guía | **Automático, con filtros — no una puerta compuesta.** Precio y desarrollo válido (título editorial + slug) descartan el proyecto; la superficie NUNCA lo hace (sin ella solo se anulan las dos cifras que dependen de m²) y el financiamiento tampoco (sin plan, `motivoSinPlan` redacta el motivo en vez de dejar la celda muda). |
| Cierre | **Formulario primero, agenda después.** Al enviar OK, la misma tarjeta revela el calendario. El lead entra a CRM/Zoho sí o sí. |
| Alcance de contenido | **Réplica fiel de Gamma**, con las fichas y la tabla alimentadas del inventario. |
| Ruta e idiomas | `/{locale}/guias/terrenos-residenciales`, **ES + EN**, con hreflang. |
| Autoría del cierre | **El equipo Propyte**, no un asesor. Se retira la firma personal del Gamma. |

## Hallazgos verificados contra la base

Consultas ejecutadas sobre `real_estate_hub` el 2026-09-01.

**Inventario real: 7 desarrollos de terreno/lote publicados** (24 publicados en total).
Seis en Playa del Carmen, uno en Tulum.

**La aritmética de Gamma es reproducible desde el Hub.** Tres de los seis proyectos
del Gamma existen como desarrollo publicado y su precio por m² calculado coincide:

| Gamma | En el inventario | $/m² Gamma | $/m² calculado |
|---|---|---|---|
| ANT-MAR-2027-29 | `lotes-residenciales-y-comerciales-en-playa-del-carmen` | $8,000 | $7,999 |
| MATE-NTE-2027 | `lotes-residenciales-en-arrecifes-playa-del-carmen` | $8,095 | $8,095 |
| GCRL-NT2027 | `terrenos-residenciales-con-amenidades-en-playa-del-carmen` | $7,820 | $7,800 |

**La mensualidad también.** Con la fórmula
`precio_lista × (1 − enganche% − contraentrega%) ÷ meses` sobre `esquemas_pago`:
`1,854,518 × (1 − 0.20 − 0.40) ÷ 48 = $15,454.32`, que es exactamente la cifra que
publica Gamma para MATE-NTE-2027. Confirma de paso que `price_min_mxn` del desarrollo
es el precio del plazo **más largo** y que el `price_mxn` de la unidad trae ya el
descuento del plazo más corto.

**Tres proyectos del Gamma NO están en el inventario publicado:** `MO-SUR2027`
(482 lotes), `AMXP-EI` (2,000 lotes, 200 ha, cenotes) y `NTSUR-30` (90 ha, dic-2030).
No aparecerán en la guía hasta que se publiquen en el Hub. **Es un efecto deseado de
la decisión de alimentarla del inventario, no un defecto a compensar.**

**Cobertura del dato de financiamiento.** Cifra final, medida **ejecutando
`getTerrenosGuia()` contra producción**, no infiriéndola de qué columnas están pobladas:

| Desarrollo | Plazos que produce | Por qué |
|---|---|---|
| `lotes-residenciales-en-arrecifes-playa-del-carmen` | **4** | `esquemas_jsonb` con 12/24/36/48 meses |
| `terrenos-residenciales-con-amenidades-en-playa-del-carmen` | **2** | `ext_planos`: tasa 0 + esquema en prosa parseable |
| `lotes-residenciales-y-comerciales-en-playa-del-carmen` | **1** | prosa del desarrollo: «60% durante obra en 36 meses» |
| `lotes-residenciales-en-la-region-11-de-tulum` | 0 | tiene los meses, pero `fin_tasa` es `null` |
| `lotes-residenciales-en-playa-del-carmen-2` | 0 | idem |
| `club-residencial-con-amenidades` | 0 | solo contado 90/10 — se muestra el motivo |
| `amares-riviera-maya` | — | fuera de la puerta: sin precio |

**Son 3 de los 6 que entran.** Las dos mediciones previas fueron ambas erróneas y por la
misma razón: contaban columnas pobladas en vez de ejecutar el código. La primera («1 de
7») miró `Propyte_desarrollos.esquemas_pago`, donde solo vive una de las tres fuentes. La
segunda («4 y 1 probable») supuso que un `fin_meses_opciones` poblado bastaba para la
fuente `ext_planos`; no basta — `plazosDesdeExtPlanos` retorna vacío en la primera línea
si `fin_tasa` no es exactamente `0`, y además exige un texto de esquema parseable con los
porcentajes. Tener los meses no es tener el plan.

**Los tres desarrollos que faltan necesitan captura en el Hub**, no código: basta
declarar la tasa (0 si no hay interés) y el esquema de pago.

## El precio que se publica

Un mismo lote tiene dos precios legítimos y hay que elegir cuál encabeza la tabla. Para
el de Arrecifes:

| | Precio | $/m² |
|---|---|---|
| Lista (48 meses, sin descuento) | $1,854,518 | $10,303 |
| A 12 meses (21.4% de descuento) | $1,457,122 | $8,095 |

**Decisión: el «desde» y el $/m² usan el precio más bajo alcanzable.** Es lo que ya
muestra la ficha de ese lote en propyte.com y lo que publica la guía de Gamma; encabezar
con el precio de lista pondría en la guía una cifra 27 % más alta que la de su propia
ficha.

**Y la mensualidad se publica rotulada con su plazo y su precio**, porque no se puede
mezclar: a 48 meses el precio ya no es $1,457,122 sino $1,854,518. Calcular la
mensualidad de 48 meses sobre el precio de 12 sería, en palabras del propio módulo, «la
cifra falsa más fácil de publicar en toda la página».

**Dos columnas de Gamma no tienen origen en el Hub:** hectáreas totales del proyecto
(no existe la columna) y la mensualidad de los proyectos que se venden solo de contado
—para esos, `motivoSinPlan` ya redacta la explicación en lenguaje de comprador.

**Medido contra el inventario de hoy: pasan 6 de 7.** El único que queda fuera es
`amares-riviera-maya`, y por una sola razón: no tiene precio (`price_min_mxn` nulo,
moneda USD) — el filtro de precio de `construirComparables`, no una puerta compuesta.
Ni la superficie ni el financiamiento sacan a nadie: un desarrollo sin superficie
utilizable se publica igual, sin `precioPorM2Mxn`; uno sin ninguna de las tres fuentes
de financiamiento se publica igual, con `motivoSinPlan` en vez de mensualidad. Si mañana
se le captura el precio a `amares-riviera-maya`, entra solo — no hay lista que
actualizar.

## Arquitectura

### Se reusa la capa de datos que ya existe

`src/lib/supabase/lp-lotes-comparador.ts` (587 líneas) ya resuelve el problema difícil:
normaliza **las tres** fuentes de financiamiento del Hub a un tipo único `PlazoOpcion`,
reconstruye el precio de lista cuando el descuento varía por plazo, y calcula
`mensualidadMxn`. Es la lógica que se validó contra Gamma arriba. **No se reescribe.**

Tres cambios acotados sobre ese módulo:

1. `getLotesComparables()` tiene `.eq('city', 'Playa del Carmen')` en duro. Se
   parametriza la ciudad, dejando el default actual para no tocar las landings en
   producción.
2. El tipo se filtra con `TYPE_DB_VALUES['terreno']` de `taxonomy-values.ts`, que
   deriva de `PRODUCT_TYPE_SPELLINGS` — única fuente de grafías. No se escriben
   `'Terreno'` / `'Lote'` a mano.
3. `LoteComparable` gana `developmentId`, para poder agrupar por proyecto. **El título
   editorial y el slug NO se añaden a este módulo:** la LP omite los nombres a propósito
   (Camino A, sin rutas de salida) y meterlos ahí rompería esa garantía. La guía hace su
   propia consulta a `v_developments` para el dato editorial, y así el módulo de la LP
   sigue sin poder nombrar nada.

Con eso, la guía **reusa `getLotesComparables(CIUDADES_GUIA)` tal cual** en lugar de
duplicar la consulta a `v_units`: el rescate de superficie y el control de precio de
lista viven en un solo sitio.

### Archivos

**Nuevos**

- `src/app/[locale]/guias/terrenos-residenciales/page.tsx` — RSC. Carpeta **estática**,
  no segmento dinámico: está documentado en `guias/costa/page.tsx` que un `[slug]`
  suelta un 200 con el shell antes de resolver el `notFound()`.
- `src/app/[locale]/guias/terrenos-residenciales/_components/` — secciones de la página.
- `src/lib/supabase/guia-terrenos.ts` — orquestador: llama al comparador generalizado,
  aplica la puerta de calidad y ordena.
- `src/components/forms/GuiaTerrenosForm.tsx` — formulario + revelado de la agenda.

**Modificados**

- `src/lib/supabase/lp-lotes-comparador.ts` — los 3 cambios de arriba.
- `src/lib/zoho/field-maps.ts` — nuevo `LeadSource` `"guia_terrenos"` + los 6 `switch` sobre `source`.
- `src/app/api/leads/route.ts` — `KNOWN_SOURCES` y `LeadSchema`.
- `src/components/layout/Footer.tsx` — link en la columna *Recursos*.
- `src/i18n/messages/es.json` y `en.json` — namespace `guias.terrenosResidenciales`.
- `src/app/sitemap.ts` — entrada en `staticPages` (hay test guardián).
- `src/lib/visibility.ts` — `PAGE_GUIAS_TERRENOS: "page.guias-terrenos"`.

## Secciones de la página

En el orden del Gamma:

1. **Hero** — título, bajada, edición 2026.
2. **Por qué esta guía** — los 4 criterios: precio y financiamiento, ubicación,
   plusvalía, certeza jurídica. Copy estático en i18n.
3. **Nota de moneda** — precios en MXN; USD referencial y sujeto al tipo de cambio.
4. **Fichas por proyecto** — una por desarrollo que pase la puerta. Foto, título
   editorial enlazado a `/desarrollos/{slug}`, amenidades y los datos duros que existan.
   Se adapta `FichaLote.tsx`.
5. **Tabla comparativa** — `ComparadorLotes` generalizado. Columnas: precio desde,
   superficie, $/m², enganche, mensualidad, financiamiento, entrega. **Celda omitida
   donde no hay dato, nunca calculada a la fuerza.**
6. **Cómo leer esta comparación** — 3 perfiles de lectura. Copy estático.
7. **Por qué crece Riviera Maya** — 4 motores: infraestructura (Tren Maya, aeropuerto
   de Tulum), crecimiento poblacional, turismo, inversión. Copy estático.
8. **No hay un mejor proyecto** — 4 perfiles de inversionista. Copy estático.
9. **Cierre** — formulario y, tras enviarlo, la agenda.
10. **Disclaimers** — precios y disponibilidad sujetos a cambio; se reusa
    `DisclaimerCifras`.

## Formulario y agenda

**Campos:** nombre, correo, teléfono (`PhoneInput`, E.164, default MX) + honeypot
`website`. Los tres obligatorios, igual que los otros 18 formularios del sitio, y el
guardia del servidor `faltanDatosDeContacto()` ya los exige.

**Envío:** `submitLead('guia_terrenos', {...})`, que adjunta UTMs, locale, `event_id`
de Meta y dispara `trackGenerateLead`.

**Agenda:** al recibir `ok: true`, la tarjeta reemplaza el formulario por el iframe de
Google Appointments. URL detrás de variable de entorno, mismo patrón que el botón de
`/contacto`:

```
NEXT_PUBLIC_GUIA_TERRENOS_AGENDA_URL=https://calendar.google.com/calendar/appointments/schedules/AcZssZ3g3bkzvlKcEERiywhxy_GrfaOmw4pRuKJI7lzMgB4FrF5MF0bS3KYtuWLqErGJgKy7bkbwaxFi
```

Se embebe añadiendo `?gv=true`. **Si la variable está vacía, el bloque no se muestra y
el formulario funciona igual** — nunca un iframe roto. En este repo las variables de
entorno solo entran por deploy: hay que ponerla en el servidor antes de que la agenda
aparezca.

## Fuera de alcance

- **PDF descargable de la guía.** El Gamma se comparte por link; la página web es el
  entregable. Si después se quiere, `/api/generate-pdf` ya existe.
- **Índice `/guias`.** Hoy `/es/guias` da 404 y las otras dos guías tampoco están
  enlazadas en el footer. No se arregla aquí.
- **Capturar en el Hub los datos que faltan** (hectáreas totales, el precio de
  `amares-riviera-maya`, el plan de pagos de `club-residencial-con-amenidades`). Es
  trabajo de datos, no de código; se reporta aparte.
- **Publicar los 3 desarrollos del Gamma que faltan.** Igual: trabajo de Hub.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Un proyecto sin plan de pagos se lee como «no financia» | `motivoSinPlan` ya distingue los cuatro casos (contado puro, 90/10, tasa por confirmar, condiciones cambiando) y redacta cada uno. No se deja la celda muda. |
| Un desarrollo se despublica y la guía encoge sin avisar | La página declara cuántos proyectos compara; el test verifica que haya al menos 2 — una comparativa de uno no es comparativa. |
| Fuga de `nombre_desarrollo` | Se usa `publication_title` vía `applyDisplayName`. Test que barre el HTML renderizado contra los nombres internos. |
| Se publica una mensualidad falsa | El cálculo sale del módulo ya validado, que respeta el precio por plazo. Test con el caso de Arrecifes: debe dar $15,454.32. |
| `v_units` es un subconjunto del inventario real | No se presentan conteos de unidades como totales del proyecto; el total sale de `total_units` del desarrollo. |

## Verificación

- Unitarias del cálculo de mensualidad y de la puerta de calidad, con el caso de
  Arrecifes fijado al valor conocido.
- Test de fuga de nombres internos sobre el HTML renderizado.
- Test guardián del sitemap (ya existe el patrón para las otras guías).
- e2e del formulario: incompleto no envía, completo envía en E.164 y revela la agenda.
- `tsc` limpio, build compila, suite completa verde (baseline: 444 tests).
