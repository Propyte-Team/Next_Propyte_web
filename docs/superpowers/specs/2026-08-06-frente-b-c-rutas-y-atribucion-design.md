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

### B3 — El listado de `/propiedades` es inalcanzable en móvil

A 390×844, la página declara «49 resultados» y el DOM contiene las 49 tarjetas, pero
`document.documentElement.scrollHeight` mide 2.695 px mientras la última tarjeta tiene su
borde inferior en 12.980 px. El scroll máximo alcanzable es 1.851 px. El `<footer>` empieza
en 948 px, por encima de casi todas las tarjetas.

Efecto para el usuario: la segunda tarjeta aparece cortada a media altura, sigue un hueco
en blanco y después el pie. El catálogo completo del sitio es invisible en el dispositivo
mayoritario. Medido tres veces —sin scroll, tras scroll y al volver arriba— con cifras
idénticas, así que no es un artefacto de medición.

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
- **`/api/rental-analysis`** devuelve `source_stats: {source, count}[]` con los nombres
  crudos de la base, y `src/components/rentas/RentalAnalysisDashboard.tsx:509-516` los pinta
  como chips en `/es/rentas`: «properstar», «lamudi», «mercadolibre», «inmuebles24». No hay
  ninguna coincidencia de esas cadenas en `src` ni en `public` —vienen del dato— y tampoco
  aparecen en el HTML de servidor, porque el dashboard las pide en cliente.

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

Diagnóstico dirigido antes de tocar nada: comparar los valores que producen `TYPE_SLUGS` y
`STAGE_SLUGS_URL` contra los valores que efectivamente almacena el inventario para tipo y
etapa. El resultado es binario:

- **Desajuste en la configuración** → se alinean los slugs y el arreglo vive en este repo.
- **Desajuste en el dato** → se documenta el punto exacto de corrección y se escala; el
  arreglo se sale de este repo y de este frente.

En cualquiera de los dos casos, la prueba de contrato de la red de seguridad se escribe
igual y es la que fija el resultado.

### B3

Bug de maqueta localizado en el contenedor del grid de `/propiedades` en el punto de ruptura
móvil: la altura del documento no crece con los hijos. Se corrige el contenedor. La
paginación del listado —que también convendría— pertenece al frente F de rendimiento y no
se toca aquí, para que la prueba de B3 mida una sola cosa.

### C1

- **Zonas:** se sustituye el nombre del proveedor por la atribución aprobada en las dos
  ramas del ternario, conservando el sufijo de actualización que ya lleva
  (`(actualizado a ${summaryUpdated})`).
- **Rentas:** la agregación se hace **en el API**, no en el render. `/api/rental-analysis`
  deja de emitir nombres de proveedor y devuelve el total agregado de registros; el
  dashboard sustituye la fila de chips por una sola atribución, «Análisis de mercado
  Propyte · N registros», con la misma cifra que hoy suman los chips por separado.
  Arreglarlo solo en el componente dejaría los
  nombres viajando en el JSON, visibles en la pestaña de red del navegador, que sigue siendo
  exposición.

## Red de seguridad

Cuatro pruebas, cada una escrita **antes** del arreglo y observada en rojo. Una prueba verde
que también pasaría con el bug presente no protege nada.

| | Prueba | Runner | Aserciones |
|---|---|---|---|
| B1 | `sitemap-visibility` | vitest | Con `page.built: false` en el mapa de visibilidad, el sitemap no contiene `/es/built` ni `/en/built`. Con el Hub inalcanzable, el sitemap sale completo. **Guardarraíl:** análisis estático que recorre `src/app/[locale]/**/page.tsx`, extrae cada `assertPageVisible(VISIBILITY_KEYS.X)`, deriva la ruta del archivo, y falla si esa ruta figura en `staticPages` sin `visibilityKey`. Esto es lo que atrapa la próxima página con compuerta. |
| C1 | `no-provider-names` | vitest | Cero formas de display —`AirDNA`, `Properstar`, `Lamudi`, `Inmuebles24`, `Mercado Libre`— en `src/**` y en `src/i18n/messages/*.json`. Permitidos los identificadores en snake_case y camelCase (`airdna_metrics`, `airdnaOccupancy`, `getAirdnaMarketSummary`) y «Airbnb» como categoría. Segunda aserción sobre la forma de respuesta de `/api/rental-analysis`: ningún valor de cadena coincide con la lista prohibida. |
| B2 | `taxonomy-filter-contract` | vitest | Para cada slug de `TYPE_SLUGS` y `STAGE_SLUGS_URL`, el valor de filtro que produce la configuración pertenece al conjunto de valores válidos del inventario. Ese conjunto no existe hoy como constante: **crearlo es parte del arreglo**, exportado desde la capa de datos y consumido tanto por el filtro como por la prueba, de modo que configuración y dato tengan una sola fuente de verdad. Prueba el mapeo, no el inventario: no se vuelve roja el día que una faceta legítimamente se quede sin existencias. |
| B3 | `listado-movil-alcanzable` | playwright | A 390 px en `/propiedades`, la altura del documento cubre el borde inferior de la última tarjeta renderizada. Hoy falla con 2.695 px contra 12.980 px. |

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

1. **C1** — cierra la exposición legal, es la pieza más pequeña, no depende de nadie.
2. **B1** — mecánica y acotada.
3. **B3** — bug de maqueta localizado.
4. **B2** — último: única pieza con causa raíz desconocida, y puede destapar trabajo del
   lado del dato. Ponerla al final evita que bloquee a las otras tres.

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

- **B2 puede no ser arreglable aquí.** Si el desajuste está del lado del dato, la entrega de
  esta pieza es el diagnóstico y el punto exacto de corrección, no el arreglo.
- **El gate de lint puede no morder.** `npm run lint` es `eslint` sin ruta. Antes de
  apoyarse en él como criterio de cierre hay que comprobar que efectivamente recorre `src`
  y falla ante un error introducido a propósito.
- **Fail-open de B1 y verificación.** Como el sitemap sale completo cuando el Hub no
  responde, la verificación en producción debe confirmar que el Hub sí respondía en el
  momento de la comprobación; si no, el sitemap correcto y el sitemap por fallback son
  indistinguibles.
- **C1 en rentas depende del contrato del API.** Cambiar la forma de `source_stats` afecta a
  cualquier otro consumidor de `/api/rental-analysis`. Hay que confirmar que el dashboard es
  el único antes de cambiar la firma.
