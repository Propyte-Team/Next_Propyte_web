# Tipos de producto múltiples por desarrollo

**Fecha:** 2026-08-20
**Repos:** `Next_Propyte_web` (filtros, tarjetas, catálogo) · `Propyte_hub` (vista SQL, formulario, whitelist de Zoho)
**Estado:** diseño aprobado, pendiente de plan de implementación

---

## El problema

Un desarrollo puede vender más de un producto: lotes y lotes-con-casa; villas y
departamentos; departamentos, penthouses y locales. Hoy, cuando un comprador filtra
por un producto en propyte.com, esos desarrollos aparecen bajo **un solo** tipo y
desaparecen de los demás — aunque la propia tarjeta anuncie los dos.

## Diagnóstico

En la pantalla `/desarrollos` conviven tres cosas distintas llamadas «tipo», y no se
hablan entre sí:

| Qué es | De dónde sale | Multivaluado |
|---|---|---|
| Chip de producto en la tarjeta (`TERRENOS`) | `unitTypes` — `tipo_unidad` distintos de las unidades cargadas, vía `attachDevelopmentUnitAggregates` | sí, ya es array |
| El filtro de tipo | `specs.type` — **escalar**: primer elemento de `ext_property_types`, con fallback a `tipo_desarrollo` | no |
| Campo «Tipo de desarrollo» del Hub | `tipo_desarrollo` — solo actúa como último recurso | no |

El resultado observable: **una tarjeta puede mostrar `CASAS · TERRENOS` y aun así
desaparecer al filtrar por Casa**, porque el predicado de
`src/hooks/useFilters.ts:201` compara contra un escalar:

```ts
if (filters.type && p.specs.type !== filters.type) return fail(...)
```

### Hallazgos secundarios, verificados contra la base el 2026-08-20

1. **Dos filtros de tipo dan respuestas distintas para la misma pregunta.**
   `/desarrollos` con el chip *Terreno* devuelve **5** resultados (filtrado en el
   navegador, con el fallback a `tipo_desarrollo`).
   `/desarrollos/tipo/terreno` devuelve **2** (filtrado en Supabase con
   `.overlaps('property_types', …)`, `src/lib/supabase/queries.ts:134`).
   La segunda ruta es la indexable.

2. **12 de los 22 desarrollos visibles tienen `ext_property_types` en NULL** →
   invisibles en cualquier faceta de tipo. `v_developments.property_types` es
   `d.ext_property_types` sin derivación alguna (verificado en `pg_get_viewdef`).

3. **Donde sí está lleno, no concuerda con el inventario.** Un desarrollo declara
   `[Departamento, Casa, Villa]` y sus unidades solo tienen Casa y Departamento: la
   web ofrece un producto que no existe. Otro declara `[Lote, Casa, Lote comercial]`
   con una sola unidad tipo `Lote`.

4. **`Oficina` y `Local comercial` se le muestran al comprador como «Departamento».**
   `normalizeUnitType` (`src/lib/mappers/unit-to-property.ts:112`) manda al cajón
   `departamento` todo lo que no reconoce, sin avisar.

5. **Las opciones del desplegable están escritas a mano**, cinco fijas en
   `src/components/marketplace/FilterBar.tsx:188`. No salen del inventario: un
   desarrollo de villas o de locales no tiene opción bajo la cual filtrarse.

6. **`tipo_desarrollo` no es un tipo.** De 861 filas: 504 dicen `vertical`, 204 dicen
   `preventa` (eso es etapa), 67 NULL, y una dice literalmente
   `"Villas y lotes residenciales"` — alguien ya intentó meter dos productos en un
   campo de opción única. El `info` del campo en
   `Propyte_hub/src/lib/fields-config.ts:179` afirma «Define cómo se filtra y muestra
   en el sitio»; es falso.

7. Los 204 desarrollos con `tipo_desarrollo = 'preventa'` quedan fuera del filtro
   «Tipo desarrollo» entero: `normalizeDevelopmentType` los descarta a propósito
   (`src/lib/mappers/development-to-property.ts:193`).

---

## Decisiones tomadas

| # | Decisión |
|---|---|
| D1 | La fuente de verdad es **derivada del inventario de unidades, con override manual**. |
| D2 | La columna canónica es **`ext_property_types`**, que ya existe, ya es array y ya tiene contraparte en Zoho (`Tipos_propiedad`). No se crea campo nuevo. |
| D3 | La regla de resolución vive **en la vista `v_developments`**, no en cada consumidor. |
| D4 | `tipo_desarrollo` se conserva y se **renombra a «Formato del desarrollo»** en Hub y sitio. Deja de llamarse «tipo». |
| D5 | **`Villa` es opción propia**, separada de Casa. |
| D6 | **`Local comercial` y `Oficina` se agrupan en una sola opción «Comercial»**. |
| D7 | Con un filtro de producto activo, la tarjeta **recalcula precio y superficie mínimos usando solo las unidades de ese tipo**. |

---

## Arquitectura

### Regla de resolución (única)

```
property_types(desarrollo) =
  1. ext_property_types                          si trae algo   → override manual / Zoho
  2. distinct(normalizar(tipo_unidad))            en otro caso  → derivado del inventario
     sobre unidades con approved_at not null y deleted_at null
  3. []                                           en otro caso  → sin dato; NO se inventa
```

Vive en `real_estate_hub.v_developments`, en la columna `property_types` que ya
existe. Mantiene nombre y tipo (`text[]`); solo gana el paso 2. Consecuencia
deliberada: **los 12 NULL se arreglan sin tocar una línea de las páginas**, y la
faceta SEO y el chip del marketplace pasan a leer el mismo dato por construcción.

Los 162 registros de unidad con `tipo_unidad` NULL **no aportan nada** al paso 2.
Nunca se rellenan con «Departamento» por defecto: la ausencia de tipo no es un
departamento.

### Catálogo cerrado de producto

Siete valores canónicos, en este orden de presentación:

```
departamento · penthouse · casa · villa · terreno · macrolote · comercial
```

Absorciones (son tipología o régimen, no producto):

| Grafía en el dato | Canónico |
|---|---|
| `Estudio`, `Loft`, `2 Recámaras`, `Studio` | `departamento` |
| `Townhouse`, `Residencia` | `casa` |
| `Villa` | `villa` |
| `Lote`, `Lotes`, `Terreno`, `Terrenos` | `terreno` |
| `Macrolote`, `Macrolotes`, `Megalote` | `macrolote` |
| `Local comercial`, `Lote comercial`, `Oficina` | `comercial` |
| `Condominio` | **fuera del catálogo** — es régimen de propiedad, no producto |
| NULL / vacío | **no aporta** — no cae a `departamento` |

El union `Property['specs']['type']` (`src/types/property.ts:25`) crece de 5 a 7
valores: se añaden `villa` y `comercial`. `TYPE_ORDER`
(`src/lib/supabase/development-aggregates.ts:29`) y `VALID_SPEC_TYPES` se alinean con
el orden de arriba, y `typeOptions` del `FilterBar` **se deriva del catálogo** en vez
de estar escrito a mano.

`normalizeUnitType` deja de tener un `return 'departamento'` como cajón final: lo que
no reconoce devuelve `undefined` y no aporta al array. Esa es la corrección del
hallazgo 4 — el cajón silencioso es lo que hacía pasar un local comercial por
departamento.

### Agregados por tipo

`attachDevelopmentUnitAggregates` ya trae `unit_types`, `bedrooms_min/max` y
`area_min_m2` en una sola consulta bulk a `v_units`. Se amplía para devolver además,
**por cada tipo de producto**, el precio mínimo y la superficie mínima. Eso es lo que
alimenta D7: cuando hay filtro activo, la tarjeta lee el agregado de ese tipo; sin
filtro, sigue leyendo el del desarrollo.

Sin este agregado, un desarrollo con lotes desde $1M y casas desde $5M mostraría
«desde $1,000,000» al filtrar Casa. Es el mismo patrón del hero que anunciaba «Uno
disponible» con 229 en inventario: nadie miente a propósito, el número simplemente no
corresponde a la pregunta que hizo el comprador.

### Hub

- Campo nuevo en la ficha del desarrollo, sección Identidad: **«Tipos de producto»**,
  multiselect atado a `ext_property_types`, con las siete opciones del catálogo.
- Cuando está vacío muestra en gris lo que el inventario derivó:
  *«Derivado de las unidades: Casa · Lote»*. Solo escribe cuando el usuario fija.
  Esto hace visible **cuál de las dos vías está mandando**, que es lo que hoy no se ve.
- `ext_property_types` se agrega a la whitelist de salida
  (`Propyte_hub/src/lib/zoho/outbound-whitelist.ts`) mapeado a `Tipos_propiedad`.
  Hoy el campo solo entra desde Zoho; no sale.
- «Tipo de desarrollo» se renombra a **«Formato del desarrollo»** y se le corrige el
  `info` que miente. La columna `tipo_desarrollo` y su mapeo a Zoho no cambian.
- En el sitio, el chip del filtro «Tipo desarrollo» se rotula **«Formato»**.

---

## Fases

Cada fase es entregable y verificable por separado.

### Fase 1 — El filtro respeta los varios tipos
Solo `Next_Propyte_web`. Sin base de datos, sin Hub.
- `useFilters.ts:201` compara contra `p.unitTypes` (con `specs.type` de respaldo
  cuando el desarrollo no tiene unidades cargadas).
- Prueba: un desarrollo con `unitTypes = ['terreno','casa']` aparece bajo ambos
  filtros; uno con `['departamento']` no aparece bajo Casa.

### Fase 2 — Una sola definición de tipo para las dos rutas
`Propyte_hub` (migración) + `Next_Propyte_web` (verificación).
- Migración que redefine `v_developments.property_types` con la regla de resolución.
- Campo «Tipos de producto» en el Hub + whitelist de salida a Zoho.
- Renombrar «Tipo de desarrollo» → «Formato del desarrollo» y corregir su `info`.
- Prueba: `/desarrollos?type=terreno` y `/desarrollos/tipo/terreno` devuelven el mismo
  conjunto. Los 12 desarrollos con NULL aparecen en la faceta que les toca.

### Fase 3 — Catálogo limpio y precios por tipo
Solo `Next_Propyte_web`.
- Catálogo cerrado, `villa` y `comercial` como canónicos, `normalizeUnitType` sin
  cajón final, `typeOptions` derivado del catálogo.
- Agregados de precio y superficie por tipo; la tarjeta los usa con filtro activo.
- Prueba: ningún desarrollo con unidades `Oficina` o `Local comercial` se rotula
  «Departamento»; con filtro Casa activo, el «desde» de la tarjeta iguala el mínimo
  de sus casas.

---

## Verificación

El chequeo de la fase 2 tiene que **dar negativo contra el estado actual** antes de
confiar en él: la comparación `/desarrollos?type=terreno` vs `/desarrollos/tipo/terreno`
debe reportar la discrepancia 5-vs-2 **antes** de aplicar la migración. Un chequeo que
solo se corre después no distingue «arreglado» de «roto en verde».

La migración se valida comparando `property_types` viejo contra nuevo, desarrollo por
desarrollo, antes de aplicarla en producción. Ningún desarrollo debe **perder** tipos;
solo ganarlos.

`taxonomy-values.test.ts` ya atrapa typos entre los slugs de URL y las grafías del
dato. Se extiende con los valores nuevos del catálogo.

---

## Riesgos

- **Redefinir una columna de `v_developments` toca a todos los consumidores a la vez**
  — web, MCP de blog, NIM, generación de PDF. Mantiene nombre y tipo, pero los
  consumidores se inventarían antes de aplicar.
- **`normalizeUnitType` sin cajón final cambia el tipo de unidades existentes.** Hay
  que revisar los consumidores que asumen que siempre hay un tipo (fichas de unidad,
  estimación de renta, comparador) — `undefined` es un estado nuevo para ellos.
- **Ampliar el union `Property['specs']['type']`** hace fallar el `tsc` en todo
  `switch` exhaustivo sobre ese tipo. Es un fallo deseable: señala exactamente qué
  consumidores necesitan una rama para `villa` y `comercial`.
- Las claves i18n de `villa` y `comercial` deben existir en `es.json` **y** `en.json`
  antes del despliegue, en `types` y en `unitTypesPlural`.

## Fuera de alcance

- Selección múltiple en el filtro (elegir Casa **y** Terreno a la vez). El filtro sigue
  siendo de opción única.
- Limpiar los 204 `tipo_desarrollo = 'preventa'`. Es dato sucio real, pero
  `normalizeDevelopmentType` ya lo descarta sin daño y no bloquea nada de esto.
- Páginas de faceta nuevas para `villa` y `comercial`. Se decide cuando haya
  inventario que las llene.
