# Frente B+C — rutas rotas y atribución de fuentes

**Fecha:** 2026-08-06
**Autor:** Luis Flores + Claude
**Estado:** Aprobado
**Roadmap:** `2026-08-06-auditoria-roadmap-7-frentes.md`

Primer frente de la remediación de la auditoría de diseño. Agrupa las cuatro piezas
mecánicas —las que no piden criterio de diseño, se verifican objetivamente y hoy están
costando catálogo y exposición legal cada día.

## Problema

Cuatro defectos independientes, verificados en producción el 6-ago-2026.

### B1 — El sitemap anuncia páginas que el sitio 404ea a propósito

`src/lib/page-visibility.ts` expone `assertPageVisible(key)`, que llama `notFound()` cuando
el Hub marca la clave como no visible. Quince `page.tsx` la usan. `page.built` y
`page.destacados` están apagadas hoy, así que `/es/built`, `/es/destacados` y
`/en/destacados` responden **HTTP 200 con la página de error en el cuerpo** — comportamiento
correcto y deliberado del gate.

`src/app/sitemap.ts` construye `staticPages` (línea 31) como un array literal de rutas y
**no tiene ninguna referencia a visibilidad**: `grep -c 'visib\|VISIBILITY\|isVisible'`
devuelve 0. Publica `/destacados` (prioridad 0,85) y `/built` (0,7) aunque el sitio las
oculte. El vínculo que falta es el mapeo ruta → clave de visibilidad, que hoy no existe en
ninguna parte del código.

No es un problema de contenido ni una decisión de negocio: es una integración ausente entre
dos mecanismos que ya existen.

### B2 — Ocho facetas de desarrollo devuelven cero resultados

`/es/desarrollos/etapa/{preventa, construccion, entrega-inmediata}` y
`/es/desarrollos/tipo/{casa, departamento, penthouse, terreno, macrolote}` no renderizan
una sola tarjeta, ni en el HTML de servidor ni tras la hidratación. Medición: 0 tarjetas,
3 imágenes y 77-84 palabras por página, contra 19 tarjetas, 506 imágenes y 485 palabras en
`/es/desarrollos`. El HTML servido de `/es/desarrollos/etapa/preventa` contiene cero
`href="/es/desarrollos/<slug>"`; el del índice contiene 19.

No es escasez de inventario: «Preventa» y «Departamento» son el negocio central. Las ocho
están en el sitemap.

Las rutas funcionan. `tipo/[type]/page.tsx` valida el slug contra `TYPE_MAP`, llama
`notFound()` solo si no existe, y delega en `TaxonomyDevelopmentsPage` con
`filter={{ type: info.slug }}`; `etapa/[stage]/page.tsx` hace lo equivalente. El fallo está
aguas abajo: el valor que se filtra no coincide con lo que guarda el inventario. De qué
lado está el desajuste —configuración o dato— es la incógnita abierta de este frente.

### B3 — El listado de `/propiedades` se ve por una ventana de 571 px en móvil

> **Corrección respecto al informe publicado.** El informe lo calificó P0 diciendo que el
> catálogo era «inalcanzable». No lo es: al investigar el código apareció un scroller
> anidado, y recorriéndolo programáticamente se alcanzan 47 de las 49 tarjetas. Se rebaja a
> **P1**. Sigue siendo un problema real de UX móvil, pero no un bloqueo de catálogo.

`MarketplaceContent.tsx:196` envuelve el marketplace en
`h-[calc(100dvh-96px)] lg:h-[calc(100dvh-100px)]`, con `flex-1 flex overflow-hidden`
(línea 250) y un `overflow-y-auto` interno (línea 281). Es el shell de mapa+lista: en
escritorio la lista scrollea al lado del mapa, que es la intención.

En móvil se aplica el mismo shell. Medido a 390×844: el scroller interno tiene
`clientHeight` 571 y `scrollHeight` 12.691, con `overscroll-contain`, de modo que el
scroll de la página no encadena hacia él. Además el documento exterior sigue desplazando
1.851 px, lo que produce el síntoma visible en la captura del informe: segunda tarjeta
cortada a media altura, hueco en blanco y pie.

Efecto para el usuario: 49 resultados vistos por una ventana de 571 px en una pantalla de
844 px, con dos regiones de scroll compitiendo y sin señal de cuál mueve qué.

### C1 — Nombres de proveedores de datos visibles al usuario

Existe una regla de negocio explícita: en cualquier texto visible nunca se nombran los
proveedores externos de datos; la atribución es «Análisis de mercado Propyte» y lo derivado
es «Estimación Propyte». La excepción es «Airbnb» como nombre de la categoría de renta
vacacional. Nombrarlos y describir cómo se obtienen expone a Propyte legal y
relacionalmente frente a esas empresas.

Dos incumplimientos, de origen distinto:

- **`src/app/[locale]/zonas/[slug]/page.tsx:254-256`** tiene «AirDNA» hardcodeado en las dos
  ramas de un ternario: `based on AirDNA market data` en inglés y `con datos de mercado de
  AirDNA` en español. Se sirve en el HTML. Medido en 7 de 10 fichas de zona muestreadas;
  las 3 restantes —Palmaris, Residencial Río y Selvamar— no lo muestran, y todas ellas son
  zonas sin bloque de renta vacacional, aunque no se comprobó que esa sea la causa. Al
  arreglarse en el componente, la cobertura es de las 45 fichas.
- **`source_stats`** viaja con los nombres crudos de la base y se pinta en **dos** páginas,
  no en una. Se construye en `src/lib/rental-data/analysis.ts:161-170` agrupando por
  `r.source_portal`, se declara en `analysis-types.ts:53` y se emite tanto por
  `/api/rental-analysis` como por el server component de `/mercado`. Consumidores:
  `RentalAnalysisDashboard.tsx:509-516` en `/es/rentas` y
  `mercado/components/tradicional/TradicionalTab.tsx:396-399` en `/es/mercado`. Verificado
  el 6-ago-2026: la pestaña «Renta tradicional (largo plazo)» de `/es/mercado` muestra
  «properstar», «lamudi», «mercadolibre» e «inmuebles24»; la de renta vacacional está
  limpia. No hay ninguna coincidencia de esas cadenas en `src` ni en `public` —vienen del
  dato— y tampoco aparecen en el HTML de servidor, porque ambas vistas las piden en cliente.

El resto de apariciones de `airdna` en el repo son identificadores internos —nombres de
variable, props, la tabla `investment_analytics.airdna_metrics`, comentarios— y no son
incumplimientos.

## Diseño de la solución

### B1

Cada entrada de `staticPages` gana un campo opcional `visibilityKey`. El sitemap resuelve
`getVisibility()` una vez y descarta las entradas cuya clave no pase `isVisible()`.

Se conserva el criterio **fail-open** que ya tiene `assertPageVisible`: si el Hub no
responde o la clave no existe, la página cuenta como visible. Un sitemap de más ante un
parpadeo del Hub es preferible a un sitemap mutilado, que Google interpretaría como
desindexación masiva.

El filtro se aplica solo a las entradas que declaren clave. Las rutas sin compuerta
—`/propiedades`, `/desarrollos`, la home— no cambian de comportamiento.

### B2

**Causa raíz ya diagnosticada** (consulta a `real_estate_hub.v_developments`, 6-ago-2026).
Es un desajuste de forma entre configuración y dato, del lado de la configuración:

| | El código filtra por | La base almacena |
|---|---|---|
| `stage` (`.eq`) | `preventa`, `construccion`, `entrega_inmediata` | `Preventa`, `En construcción`, `Entrega inmediata`, `Entregado` |
| `property_types` (`.contains`) | `departamento`, `casa`, `penthouse`, `terreno`, `macrolote` | `Departamento`, `Casa`, `Penthouse`, `Villa`, `Lotes`, `Terrenos`, `Local comercial` |

`.eq('stage','preventa')` nunca iguala `'Preventa'`. Cero resultados, exactamente lo
observado. **El arreglo vive en este repo**; no hay que escalar nada.

La corrección no es reescribir los slugs canónicos con la grafía de la base —eso ata la URL
a un texto editable—, sino introducir un mapa explícito de slug canónico → valores
aceptados en el dato, exportado desde la capa de datos y consumido por el filtro y por la
prueba. Eso además resuelve las variantes plurales: `terreno` debe casar con `Terrenos` y
con `Lotes`.

`getDevelopments` pasa de `.eq('stage', v)` a `.in('stage', valores)` y de
`.contains('property_types', [v])` a `.overlaps('property_types', valores)`.

Conteos esperados tras el arreglo, sobre los 19 desarrollos publicados
(`approved_at is not null and deleted_at is null`):

| Faceta | Esperado |
|---|---|
| `/etapa/preventa` | 6 |
| `/etapa/construccion` | 5 |
| `/etapa/entrega-inmediata` | 5 |
| `/tipo/departamento` | 6 |
| `/tipo/casa` | 3 |
| `/tipo/penthouse` | 2 |
| `/tipo/terreno` | 2 (`Terrenos` + `Lotes`) |
| `/tipo/macrolote` | **0 — ese valor no existe en el inventario** |

`macrolote` queda legítimamente vacía. No se arregla con código: o se retira la faceta y su
entrada del sitemap, o se acepta como vacía declarada. Es decisión de negocio y se plantea
al cerrar la pieza, no se decide aquí. Existe además `Entregado` (1 desarrollo) sin faceta,
y `Villa` (2) y `Local comercial` (2) sin faceta; añadirlas es alcance nuevo, fuera de este
frente.

### B3

En el punto de ruptura móvil la lista debe fluir en el documento en vez de vivir en un
scroller anidado: se elimina la altura fija del shell y el `overflow-y-auto` interno por
debajo de `lg`, dejando el comportamiento de escritorio intacto. El repo ya tiene
`src/components/marketplace/MobileBottomSheet.tsx`, lo que sugiere que el patrón previsto
para el mapa en móvil es una hoja inferior y no la columna fija.

La paginación del listado —que también convendría— pertenece al frente F de rendimiento y
no se toca aquí, para que la prueba de B3 mida una sola cosa.

### C1

- **Zonas:** se sustituye el nombre del proveedor por la atribución aprobada en las dos
  ramas del ternario, conservando el sufijo de actualización que ya lleva
  (`(actualizado a ${summaryUpdated})`).
- **Rentas y mercado:** el arreglo va **en la capa de datos**, no en los dos componentes.
  `analysis.ts` deja de emitir `source_stats` y el campo se elimina de `AnalysisData`; el
  total agregado ya existe en la respuesta (`total_comparables` y
  `data_quality.clean_count`), así que no hace falta un campo nuevo. Los dos consumidores
  sustituyen la fila de chips por una sola atribución: «Análisis de mercado Propyte ·
  N registros», con la misma cifra que hoy suman los chips por separado.

  Arreglarlo en los componentes dejaría los nombres viajando en el JSON, visibles en la
  pestaña de red, que sigue siendo exposición. Y hacerlo en la capa de datos cubre las dos
  páginas de una vez, que es la razón por la que se eligió este punto de corte.

## Red de seguridad

Cuatro pruebas, cada una escrita **antes** del arreglo y observada en rojo. Una prueba verde
que también pasaría con el bug presente no protege nada.

| | Prueba | Runner | Aserciones |
|---|---|---|---|
| B1 | `sitemap-visibility` | vitest | Con `page.built: false` en el mapa de visibilidad, el sitemap no contiene `/es/built` ni `/en/built`. Con el Hub inalcanzable, el sitemap sale completo. **Guardarraíl:** análisis estático que recorre `src/app/[locale]/**/page.tsx`, extrae cada `assertPageVisible(VISIBILITY_KEYS.X)`, deriva la ruta del archivo, y falla si esa ruta figura en `staticPages` sin `visibilityKey`. Esto es lo que atrapa la próxima página con compuerta. |
| C1 | `provider-names` | vitest | Cero formas de display —`AirDNA`, `Properstar`, `Lamudi`, `Inmuebles24`, `Mercado Libre`— en `src/**`, **tras quitar comentarios**. Permitidos: los identificadores en snake_case y camelCase (`airdna_metrics`, `airdnaOccupancy`, `AirdnaMarketSummary`), «Airbnb» como categoría, y el nombre del proveedor dentro de comentarios. Esto último es deliberado: de las 17 apariciones de `AirDNA` en `src`, 15 son comentarios que documentan la procedencia del dato y nunca llegan al usuario; prohibirlos habría borrado contexto de mantenimiento sin reducir exposición. Las 2 violaciones reales son plantillas en `zonas/[slug]/page.tsx:255-256`. |
| B2 | `taxonomy-filter-contract` | vitest | Todo slug de faceta resuelve a al menos un valor del mapa, y todo valor del mapa existe en el conjunto de valores conocidos del inventario. Ese mapa no existe hoy: **crearlo es parte del arreglo**, exportado desde la capa de datos y consumido por el filtro y por la prueba, de modo que configuración y dato tengan una sola fuente de verdad. Prueba el mapeo, no el inventario: no se vuelve roja el día que una faceta legítimamente se quede sin existencias. Segunda aserción: `getDevelopments` emite `in`/`overlaps` con los valores del mapa, no con el slug crudo. |
| B3 | `listado-movil-sin-scroll-anidado` | playwright | A 390 px en `/propiedades`, ningún contenedor con `overflow-y` auto o scroll que contenga las tarjetas tiene `scrollHeight` mayor que su `clientHeight`. Hoy falla: 12.691 px dentro de 571 px. A 1440 px la prueba afirma lo contrario —el scroller sigue existiendo—, para que el arreglo no se lleve por delante el comportamiento de escritorio. |

Las dos pruebas de vitest de B1 y C1 son estáticas y baratas: corren en cada `test:unit`
sin red ni base de datos.

## Fuera de alcance

- Publicar el contenido de `built` y `destacados`. Es decisión de negocio y pertenece al
  frente G. Este frente solo hace que el sitemap deje de anunciarlas mientras estén ocultas.
- El resto de páginas con compuerta que hoy están correctamente ocultas.
- Paginar `/es/desarrollos` y `/es/propiedades` — frente F.
- Los demás hallazgos de accesibilidad, tokens, rendimiento y contenido.

## Secuencia y criterio de «hecho»

Rama propia por pieza, desde `main` actualizado. `feat/meta-capi-rebased` no se toca; hoy
está 6 commits por delante y 5 por detrás de `main` y tiene trabajo ajeno sin commitear.

1. **C1** — cierra la exposición legal, no depende de nadie, cubre dos páginas de una vez.
2. **B1** — mecánica y acotada.
3. **B2** — causa raíz ya diagnosticada; restaura 8 páginas hoy vacías.
4. **B3** — última: es la única que cambia maqueta y la única con riesgo de regresión en
   escritorio, así que va cuando las otras tres ya estén verificadas en producción.

> Este orden cambió respecto a la primera versión del spec, donde B2 iba último por tener
> causa raíz desconocida y B3 antes por ser P0. Al diagnosticar B2 (desajuste de grafía,
> arreglo local) y rebajar B3 a P1 (la lista sí es alcanzable), los dos intercambian sitio.

Cada rama se cierra en este orden y no antes:

1. Prueba nueva en rojo, con la salida del fallo a la vista.
2. Arreglo.
3. Prueba nueva en verde.
4. `npm run test:unit` y `npm run test:e2e` completos, sin regresión.
5. `tsc` y `npm run build` limpios.
6. Merge a `main`.
7. Esperar el pull del cron.
8. **Verificación contra propyte.com** con el mismo arnés de la auditoría. Una pieza no está
   hecha hasta que su comprobación pasa en producción, no en local.

## Riesgos e incógnitas

- **El gate de lint puede no morder.** `npm run lint` es `eslint` sin ruta. Antes de
  apoyarse en él como criterio de cierre hay que comprobar que efectivamente recorre `src`
  y falla ante un error introducido a propósito.
- **Fail-open de B1 y verificación.** Como el sitemap sale completo cuando el Hub no
  responde, la verificación en producción debe confirmar que el Hub sí respondía en el
  momento de la comprobación; si no, el sitemap correcto y el sitemap por fallback son
  indistinguibles.
- **B2 depende de datos que pueden cambiar.** El mapa slug → valores se construye contra la
  grafía que hoy tiene el inventario. Si alguien renombra `Entrega inmediata` en el Hub, la
  faceta vuelve a cero en silencio. La prueba de contrato no lo detecta porque valida el
  mapa contra sí mismo. Mitigación mínima: dejar constancia en el mapa de que sus valores
  son grafías del dato y que editarlas en el Hub exige tocar este archivo.
- **B3 puede regresionar escritorio.** El shell de altura fija es intencional en `lg`. La
  prueba afirma explícitamente el comportamiento de escritorio para que el arreglo móvil no
  lo destruya.
- **`macrolote` seguirá vacía tras B2.** No es un fallo del arreglo. Requiere decisión de
  negocio: retirar la faceta o aceptarla vacía.
