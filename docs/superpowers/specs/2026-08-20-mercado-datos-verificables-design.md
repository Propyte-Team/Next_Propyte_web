# Datos verificables en /mercado: de "último punto" a ciclo TTM

**Fecha:** 2026-08-20
**Estado:** propuesta, pendiente de revisión
**Alcance:** arreglar + endurecer. Sin features nuevas.
**Repos:** `Next_Propyte_web` (web) + `propyte-monorepo/crawlers/glowing-spork` (pipeline)

---

## 1. El problema

`zone_scores.median_occupancy` no contiene una mediana. Contiene **el último punto de la serie**, y para las 16 zonas del ranking ese punto es **2026-02-01**: el pico de temporada alta del Caribe.

La prueba está en el pipeline, `analytics/compute_derived.py`:

```python
def fetch_airdna_occupancy(market: str) -> pd.DataFrame:
    """Fetch latest occupancy per submarket."""          # ← "latest", no "median"
    rows = supabase_fetch(
        "airdna_metrics",
        filters=f"...&order=metric_date.desc&limit=500", # ← sin filtro de fecha
    )
    df = df.sort_values("metric_date", ascending=False).drop_duplicates("submarket")
```

y en la línea 600 ese valor único se persiste con nombre de agregado:

```python
"median_occupancy": float(row["occupancy"]) if pd.notna(row.get("occupancy")) else None,
"computed_at": date.today().isoformat(),                # ← siempre hoy, sin importar la edad del dato
```

La página lo muestra como "Ocupación" y como KPI **"Ocupación Prom."**, y lo multiplica por el ADR × 30 para publicar un "Ingreso bruto mensual est." en pesos.

### 1.1 Impacto medido (16/16 zonas del ranking)

Ingreso bruto publicado contra el que sale de la mediana real de 12 meses:

| Zona | Ocup. publicada | Ocup. real TTM | Ingreso publicado | Ingreso honesto | Sesgo |
|---|---|---|---|---|---|
| Zona de Resorts | 66% | 39.7% | $97,343 | $58,768 | **+66%** |
| Bahía de Akumal | 72% | 47.4% | $114,364 | $74,867 | **+53%** |
| Zazil-Ha | 86% | 57.0% | $44,252 | $29,438 | **+50%** |
| Tulum Country Club | 69% | 46.9% | $38,336 | $26,119 | **+47%** |
| Bahía Príncipe | 64% | 46.5% | $50,749 | $37,159 | **+37%** |
| Ejidal | 72% | 53.1% | $22,415 | $16,448 | **+36%** |
| 28 de Junio | 69% | 54.0% | $26,016 | $20,259 | +28% |
| Aqua / Cumbres | 71% | 60.7% | $13,715 | $11,790 | +16% |
| Zona Hotelera | 64% | 55.5% | $20,123 | $17,518 | +15% |
| Aldea Zamá | 52% | 48.7% | $28,752 | $26,993 | +7% |
| SM 11-17 | 65% | 60.8% | $10,221 | $9,552 | +7% |
| Tulum Centro | 50% | 47.2% | $36,732 | $34,568 | +6% |
| Los Olivos | 42% | 39.9% | $11,498 | $10,836 | +6% |
| Lagos del Sol | 56% | 53.0% | $13,323 | $12,695 | +5% |
| CP 97314 | 52% | 54.7% | $9,769 | $10,281 | −5% |
| Arbolada | 53% | 60.6% | $10,464 | $11,949 | −12% |

Dos zonas quedan **sub**estimadas. No es inflación deliberada: es un bug de "último valor" cuyo signo sigue la estacionalidad de febrero.

### 1.2 Por qué el sesgo es peor de lo que parece

La amplitud estacional del Caribe es enorme (Bahía de Akumal: 20.6% en mayo → 75.4% en febrero). La de CDMX es plana (+4 a +9 pts de sesgo). La página invita explícitamente a "contrastar los rendimientos del Caribe mexicano contra un mercado urbano maduro" — y **exagera precisamente esa comparación**.

Y **reordena el ranking**: el top-3 completo es "Akumal" porque son las zonas de mayor pico de febrero, no las de mejor rendimiento anual.

### 1.3 Radio de impacto

El dato no vive solo en /mercado. Consumen `median_occupancy` / `median_adr`:

| Superficie | Archivo |
|---|---|
| /mercado tabla + KPIs | `src/app/[locale]/mercado/components/vacacional/{ComparisonTable,VacacionalTab}.tsx` |
| /zonas | `src/app/[locale]/zonas/ZonasExplorer.tsx` |
| /zonas/[slug] | `src/app/[locale]/zonas/[slug]/{page,ZoneAnalytics}.tsx` |
| Tarjeta compartida | `src/components/analytics/ZoneScoreCard.tsx` |
| **Portada** | `src/components/home/TrendingMarket.tsx` |
| **Ficha de propiedad** | `src/components/property/GeoAnalysis.tsx` |
| **Lead magnet (PDF a leads)** | `src/lib/lead-magnet/edition-data.ts` |

El lead magnet es el más grave: sale del sitio por correo y queda en manos del cliente.

### 1.4 Causa raíz de que nadie lo notara

`investment_analytics.pipeline_health` **ya detectó todo** y nadie lee esa tabla:

| source | status | último dato | edad | umbral |
|---|---|---|---|---|
| `airroi_str_zonal` | **STALE** | 2026-03-22 | 151 d | 35 d |
| `airroi_str` | OK | 2026-07-17 | 34 d | 35 d |
| `zone_scores` | **STALE** | 2026-07-29 | 22 d | 3 d |
| `dev_financials_plausibility` | **ERROR** | hoy | — | 2 `model_version` conviviendo |

`airroi_str_zonal` —el scraper de series por submercado, el que alimenta `occupancy` y `average_daily_rate`— murió el 22 de marzo. A diferencia de los otros cinco scrapers, **no tiene fila en `scraper_config`**: sin `enabled`, sin `cap`, sin dueño.

Y `scraper_jobs` explica el silencio:

```
apify_ltr/playa_del_carmen   status=done   rows_affected=0   "rc=0, 0 filas"
airroi_listings/merida       status=done   rows_affected=0   "rc=0, 0 filas"
airroi_listings/pdc          status=done   rows_affected=0   "rc=0, 0 filas"
```

**Cero filas sale con `rc=0` y se registra como `done`.** Éxito y silencio total son indistinguibles.

### 1.5 El segundo frente: `development_financials` — trampa latente, no incendio

`pipeline_health` marca `dev_financials_plausibility` en **ERROR** con dos `model_version` conviviendo. Medido:

| `model_version` | filas | `roi_annual_pct=0` | `monthly_net_flow=0` | `irr_5yr` no-null | `breakeven` no-null | `cap_rate` máx |
|---|---|---|---|---|---|---|
| `gbr_v2_2026-07-15` | **182** (92%) | **182/182** | **182/182** | **0** | **0** | **891.1** |
| `v1.1-realtime` | 16 | 0 | 0 | 0 | 16 | 3.8 |

`gbr_v2` produjo, para los 182 desarrollos: ROI y flujo neto en **cero exacto**, IRR y breakeven en **NULL**, y `cap_rate` llegando a **891%** contra un máximo de 3.8% en el modelo sano. No es una corrida contradictoria: es una corrida que devolvió basura o nada en toda métrica que importa.

Las escalas tampoco son comparables entre versiones: `estimated_rent_vacacional` promedia **$35,539** en `gbr_v2` contra **$13,283** en `v1.1-realtime` (2.7×), y `occupancy_rate_vac` 0.6 contra 0.3.

**Por qué esto NO es un incendio.** Dos hechos, ambos verificados:

1. **Los 182 registros de `gbr_v2` no tocan ni un desarrollo publicado.** Cruzando contra `real_estate_hub.v_developments` (`approved_at` no nulo, `deleted_at` nulo): `gbr_v2` = 182 filas, **0 de publicados**. Los 8 financials de desarrollos publicados vienen todos de `v1.1-realtime`.
2. **`resolve.ts` ya excluye los campos envenenados, deliberadamente.** El comentario de `DevFinancialsSlice` (fechado 2026-07-27) documenta este mismo diagnóstico y deja la interfaz con **un solo campo**, `estimated_rent_residencial`. `roi_annual_pct`, `cap_rate` e `irr_5yr` no entran. Y siendo `irr_5yr` NULL, el `??` de `InvestmentSummary.tsx:161` cae correctamente al cálculo local.

**Lo que sí queda como riesgo real:** que dos versiones con escalas 2.7× distintas convivan en la misma tabla sin que el esquema lo impida, y que un `cap_rate` de 891% siga ahí esperando al siguiente que amplíe `DevFinancialsSlice`. La defensa actual es un comentario y una interfaz angosta — disciplina, no estructura.

`resolve.ts:48-54` (la guardia de `> 0`) y la interfaz angosta de `DevFinancialsSlice` **no se tocan**: son lo que contuvo esto.

Consumidores de la tabla: `src/app/api/generate-pdf/route.ts`, `DevelopmentDetailPage.tsx`, `InvestmentSummary.tsx`, `RentalAnalysisDashboard.tsx` (este no pasa por `resolve.ts`), y la pestaña tradicional de /mercado.

### 1.5b Cobertura de inversión en el catálogo publicado

Salió al verificar lo anterior y toca directamente el objetivo de la página:

| | n |
|---|---|
| Desarrollos publicados | **22** |
| …con financials del modelo sano | 8 |
| …con estimación ML | 4 |
| …con al menos una de las dos | **10** |

**12 de 22 desarrollos publicados no tienen financials propios ni estimación ML.** Sus métricas de inversión dependen enteramente de los caminos `manual` o `market` de `resolveUnitInvestment`. No tracé cuánto cubre cada uno — queda como pregunta abierta, no como afirmación.

Importa porque el propósito de la página es ayudar a elegir inversión, y poco más de la mitad del catálogo publicado no tiene una fuente de inversión a nivel desarrollo.

### 1.6 Lo que hace viable arreglarlo hoy

La serie `occupancy` de las zonas del ranking va de **2025-03 a 2026-02**: un ciclo estacional completo y cerrado. No hace falta dato fresco para publicar algo honesto — hace falta dejar de tomar el último punto y tomar el ciclo, rotulado por lo que es.

---

## 2. Decisiones tomadas

| Decisión | Elegido |
|---|---|
| Qué hacer ahora | Corregir en caliente con el dato existente, republicar con corte real |
| Métrica principal | Mediana TTM + rango estacional (temporada baja / alta) |
| Alcance | Arreglar y endurecer. Sin features nuevas |
| Dónde se arregla | En el pipeline, con columnas nuevas; la web no puede caer a las viejas |
| `development_financials` | **Incluido** (decisión 2026-08-20). Entró después de la auditoría inicial, al confirmar que el modelo dominante escribe ceros y que el PDF al cliente lo consume |

Enfoque descartado: derivar en la capa web desde `airdna_metrics`. Sale más rápido pero duplica la estadística en TypeScript y deja `/zonas`, la portada, la ficha de propiedad y el lead magnet leyendo la columna mentirosa. *Derivar en un lugar no evita divergir.*

---

## 3. Diseño

### 3.1 Contrato de datos nuevo

`zone_scores` gana columnas cuyo nombre no puede mentir:

| Columna | Tipo | Significado |
|---|---|---|
| `occupancy_p50_ttm` | numeric | Mediana de ocupación de los últimos 12 meses de `metric_date`. **Cifra principal.** |
| `occupancy_low_season` | numeric | p10 del ciclo |
| `occupancy_high_season` | numeric | p90 del ciclo |
| `adr_p50_ttm` | numeric | Mediana de ADR del ciclo |
| `data_through` | date | `max(metric_date)` real de la serie. **Separado de `computed_at`.** |
| `ttm_months_observed` | int | Cuántos meses distintos entraron en la mediana |
| `index_omission_reason` | text | El motivo que `publication_gates.gate_zone()` **ya emite**: `'sample_below_15'`, `'sample_below_30'`, `'missing:<componente>'`, más `'thin_cycle'` (nuevo). O `null`. |

`median_occupancy` / `median_adr` se marcan deprecadas en `types.ts` y se borran al cerrar la Fase 3. No se reutilizan: un rename dejaría consumidores leyendo el viejo significado.

**La convención no se inventa: ya existe en el repo.** `getAirdnaMarketData` (`src/lib/supabase/queries.ts:1790-1875`) hace exactamente lo correcto para el nivel *mercado*: distingue `current_occupancy` (último punto) de `avg_occupancy_12m` (ventana de 12 meses, `.gte('metric_date', since).limit(12)`) y expone `latest_date` aparte. Nombres honestos, conceptos separados.

La diferencia entre el camino sano y el enfermo es una sola cláusula:

| | Filtro | Agregación | Nombre |
|---|---|---|---|
| Web, nivel mercado (sano) | `.is('submarket', null)` | promedio de 12 puntos | `avg_occupancy_12m` ✓ |
| Pipeline, nivel submercado (roto) | `submarket=not.is.null` | `drop_duplicates` → 1 punto | `median_occupancy` ✗ |

Dos caminos sobre la misma tabla; el del pipeline nunca recibió la corrección. Las columnas nuevas siguen la convención del camino sano, con `p50` en vez de `avg` porque la mediana resiste mejor los meses atípicos.

**`data_through` es la columna que mata la mentira más visible.** Hoy la página dice "Corte julio de 2026" porque lee `computed_at = date.today()`. Con `data_through` dirá lo que es: ciclo cerrado a febrero de 2026.

### 3.2 Cambios en el pipeline

`analytics/compute_derived.py`:

1. `fetch_airdna_occupancy` deja de hacer `drop_duplicates("submarket")`. Trae los últimos 12 meses de `metric_date` por submercado y devuelve p10/p50/p90 + `max(metric_date)` + conteo de meses.
2. Igual para `fetch_airdna_adr` (que además ya calcula crecimiento — su ventana no se toca, solo se separa del valor publicado).
3. Constante nueva `TTM_MONTHS = 12` y `MIN_MONTHS_FOR_TTM = 6`: con menos de 6 meses observados no se publica ocupación, se publica `index_omission_reason = 'thin_cycle'`. Un ciclo incompleto no representa un año.
4. **Compuerta de frescura — dos ejes separados, no uno.** Este es el punto fino del diseño:

   - **Suficiencia del ciclo** decide *si se publica*. Una mediana estacional sobre un ciclo de 12 meses cerrado sigue siendo estadísticamente válida aunque el ciclo cerrara hace medio año: la estacionalidad del Caribe no cambia de forma en seis meses. Por eso el criterio de publicación es `ttm_months_observed >= MIN_MONTHS_FOR_TTM`, **no** la antigüedad.
   - **Antigüedad** decide *cómo se rotula*. `data_through` viaja siempre con la cifra. Si `current_date - data_through > MAX_DATA_AGE_DAYS` (35, el mismo umbral que `pipeline_health` ya usa para `airroi_str_zonal`), la superficie muestra un aviso explícito de que la serie no se ha actualizado desde `data_through`.

   Colapsar los dos ejes en una sola compuerta es el error a evitar: con el dato de hoy (feb-2026, ~200 días) una compuerta única por antigüedad dejaría la pestaña en blanco, que es justo la opción descartada. Lo que se prohíbe no es publicar dato viejo — es publicar dato viejo **sin decir que lo es**, que es exactamente lo que hace hoy `computed_at = date.today()`.
5. `index_omission_reason` se alimenta de `publication_gates.gate_zone()`, que **ya devuelve el motivo** (`sample_below_15`, `sample_below_30`, `missing:<componente>`) y cuyos umbrales `MIN_SAMPLE_OCCUPANCY = 15` / `MIN_SAMPLE_INDEX = 30` ya implementan la regla publicada. `apply_gates` ya lo pone en el DataFrame como `gate_reason` — y `build_zone_score_rows` no lo lee, así que **el motivo se calcula y se tira**. Persistirlo es todo el cambio. El umbral nuevo (`MIN_MONTHS_FOR_TTM`) va dentro de ese mismo módulo: su docstring exige que los umbrales vivan en un solo lugar.

   *(Corrección 2026-08-20: la auditoría inicial afirmó que la regla de 30 anuncios no estaba implementada y que `publication_gates.py` no existía. Ambas cosas eran falsas — se inspeccionó una rama atrasada.)*

El `occupancy_component` del índice pasa a derivarse de `occupancy_p50_ttm`. Eso **recalcula los scores y reordena el ranking** — es el efecto buscado, no un daño colateral.

### 3.3 Cambios en la web

Regla dura: **la web lee solo las columnas nuevas.** Si faltan, estado explícito "sin dato". Nunca fallback a las viejas — un fallback silencioso es exactamente cómo llegamos aquí.

- **`ComparisonTable.tsx`**: `Ocupación` pasa a mostrar `occupancy_p50_ttm` con el rango `low–high` al lado. El cálculo de ingreso (líneas 72-73 y 147) usa `adr_p50_ttm × occupancy_p50_ttm / 100 × 30`.
- **Badge de índice ausente** (líneas 172-180): deja de ser siempre "muestra baja". Renderiza por `index_omission_reason`. Esto arregla Playacar (922 anuncios rotulados "muestra baja").
- **`VacacionalTab.tsx`**: el KPI "Ocupación Prom." promedia `occupancy_p50_ttm`. La línea de procedencia usa `data_through`, no `computed_at`.
- **`ZoneScoreCard.tsx:104`**: los umbrales de tendencia (`> 58` sube, `< 40` baja) están calibrados a la escala inflada. Con medianas TTM casi todo caería a "flat". Se recalibran contra la distribución nueva.
- **`TrendingMarket.tsx`, `GeoAnalysis.tsx`, `ZonasExplorer.tsx`, `zonas/[slug]`**: mismo cambio de columna.
- **`lead-magnet/edition-data.ts`**: el `Pick<ZoneScore, …>` pasa a las columnas nuevas. Entra en Fase 1 por ser material que sale del sitio.

### 3.4 Manejo de errores

Cuatro estados distinguibles, nunca colapsados en uno. Hoy los cuatro se renderizan como "muestra baja":

| Estado | Causa | Qué ve el usuario |
|---|---|---|
| Con índice | Ciclo suficiente, todo presente | Score + ocupación TTM + rango estacional |
| Sin índice, con métricas | `sample_below_30` | "muestra baja (N anuncios)" + métricas |
| Sin índice, sin tarifa | `missing:adr` | "sin tarifa publicada" — **no** "muestra baja" |
| Sin índice, falta otro componente | `missing:revpar`, `missing:adr_growth_pct`, `missing:occupancy` | "dato incompleto" |
| Ciclo insuficiente | `thin_cycle` | "serie incompleta ({n} de 12 meses)" |

La zona con `sample_below_15` no aparece: `gate_zone` la descarta (`drop`) y no llega a la tabla.

Ortogonal a los cuatro: el rótulo de antigüedad. Cualquier estado que muestre cifras las acompaña de `data_through`, y si supera `MAX_DATA_AGE_DAYS` agrega el aviso de serie sin actualizar. La antigüedad nunca oculta la cifra — la califica.

### 3.5 `development_financials`: una sola versión de modelo a la vez

Nada aquí está llegando a un cliente hoy (§1.5). El objetivo no es apagar un fuego: es convertir en estructura la disciplina que hoy sostiene un comentario.

1. **Declarar la versión publicada en el esquema.** Los consumidores leen una versión declarada, no la tabla entera. Hoy es `v1.1-realtime`. Costo verificado: **cero desarrollos publicados** — `gbr_v2` no cubre ninguno.
2. **Prohibir la convivencia.** `dev_financials_plausibility` pasa de reportar `MIXED` a impedirlo. Hoy detecta y no bloquea: el mismo patrón de `pipeline_health`, una señal que nadie consume.
3. **Guardias de plausibilidad por rango, no por coherencia interna.** Un `cap_rate` de 891% debe rechazarse en la escritura. (La guardia de coherencia que había propuesto antes —`irr_5yr != 0` con flujo cero— no aplica: `irr_5yr` es NULL en las 198 filas.)
4. **Diagnosticar `gbr_v2`** para decidir si se repara o se descarta. Antes de eso hay que resolver cuál de las dos escalas de renta es la correcta: 2.7× de diferencia significa que **uno de los dos modelos está mal calibrado**, y no es evidente que el sano sea el viejo solo porque no tiene ceros.

**No se toca** `resolve.ts:48-54` (la guardia de `> 0`) ni la interfaz angosta de `DevFinancialsSlice`. Son lo que contuvo esto, y funcionaron.

---

## 4. Fases

### Fase 1 — Parar la hemorragia
Migración de columnas. Pipeline calcula TTM + rango + `data_through` + compuerta de frescura + `index_omission_reason`. Correr una vez contra producción. Web lee columnas nuevas en las 8 superficies, **incluido el lead magnet**.

Efecto visible: los ingresos bajan entre −5% y −40%, y la página pasa a decir "ciclo cerrado feb-2026" en vez de "Corte julio de 2026".

**Requisito no técnico:** avisar a los asesores antes de publicar. Hay cifras ya cotizadas que van a cambiar.

### Fase 2 — Que no vuelva a pasar
- `rows_affected = 0` deja de ser `done`: status `empty` y falla ruidosa.
- Alta de `airroi_str_zonal` en `scraper_config` con dueño y `enabled`.
- `pipeline_health` deja de ser una tabla que nadie lee: alerta en STALE/ERROR.
- ~~Meter `zone_sample_gate` y `airroi_str_zonal` al monorepo.~~ **Ya están** (`analytics/observer.py`, `notifier.py`, con tests). Corrección 2026-08-20: se inspeccionó una rama atrasada.
- Igual el monitoreo y la alerta: `observer.py:25` vigila `airroi_str_zonal` con umbral de 35 días, y `observer.py:323-338` llama a `should_alert` → `notify` (WhatsApp + SMTP). **Queda una pregunta operativa, no de código:** si la alerta está conectada, ¿por qué 151 días STALE no produjeron acción? Revisar `OBSERVER_ENABLED`, el cron y a quién llegan los avisos.
- Lo único que sobrevive de esta fase como cambio de código: `scraper_runner.py:89` `status = "done" if rc == 0 else "error"` — cero filas se registra como éxito.

### Fase 3 — Los 13 hallazgos de la auditoría
- **P1** `+2M registros` → `+385K` (real: 385,720 filas sumando las 5 tablas de analítica). Hero ×2 + meta description.
- **P4** separar oferta de benchmark en el hero: `21,115` es 67.6% CDMX, mercado que la página desconoce dos párrafos abajo.
- **P5** `strFooter` ("portales inmobiliarios") es texto de la pestaña tradicional mal colocado en la vacacional.
- **P6** `ltrStats` no se calcula nunca → la pestaña tradicional muestra "Actualizando datos…" sobre 10,695 resultados ya cargados.
- **P7** `ltrSourceUpdated: "Actualización: hoy"` es un string fijo; 93% de los comparables tienen +30 días.
- **P8** el piso publicado ($5,000) no es el del código ($2,000 en `analysis.ts`, $1,000 en la query). 81 comparables entre $2k y $5k.
- **P9** "62+ ciudades en México": son 63 distintas pero incluyen `Yucatán`, `Quintana Roo`, `Solidaridad`, `Yucatán Country Club`, `Gran Bahía Príncipe` y casi-duplicados.
- **P10** "Competencia" usa conteo crudo: Zona Hotelera Cancún con 174 anuncios sale "Moderada".
- **P12** `tulum_country_club` bajo Akumal — ya marcado en el código como *needs manual confirmation*. Confirmar o corregir.

### Fase 4 — `development_financials`
Los cuatro pasos de §3.5. **Prioridad baja a propósito:** nada de esto está llegando a un cliente (0 desarrollos publicados afectados, campos ya excluidos en `resolve.ts`). Va después de las fases 1-3, no antes.

Los pasos 1-3 son acotados. El paso 4 (diagnosticar `gbr_v2`) es lo único de este spec cuyo alcance no puedo estimar: el modelo no está en este repo, y antes de repararlo hay que decidir cuál de las dos calibraciones de renta es la correcta. Si desborda, sale a su propio ciclo sin bloquear nada.

**Decisión pendiente, no incluida:** la cobertura de §1.5b (12 de 22 publicados sin fuente de inversión a nivel desarrollo). Es un hueco de producto, no un bug, y merece su propia conversación.

### Fase 5 — Endurecer
Tests que habrían cazado esto:

1. **Ningún valor publicado es un punto único**: falla si `occupancy_p50_ttm` == el último punto de la serie del submercado. El bug exacto, con guardia propia.
2. **El índice se reproduce**: recalcular el score desde sus componentes y comparar contra el publicado.
3. **La metodología publicada coincide con las constantes del código**: el "≥30 anuncios" que la página afirmaba y `compute_derived.py` no tenía habría fallado aquí.
4. **`data_through` nunca es `computed_at`** por construcción en el test de esquema.
5. **Plausibilidad por rango en financials**: ningún `cap_rate` fuera de un rango defendible (hoy llega a 891%).
6. **Una sola `model_version` publicada** en `development_financials`.

Los seis comparten una forma: verifican que **lo que se afirma coincide con lo que se calcula**. Los dos bugs de este spec —el punto único vendido como mediana, y el cero exacto vendido como ROI— son la misma clase de fallo, y ninguna prueba de las que existen hoy los toca.

---

## 5. Fuera de alcance

Por decisión de alcance: estacionalidad como feature visual, ingreso neto (comisiones/admin/predial/ISR), comparador de zonas, proyecciones a 5 años. La base primero.

Único punto con alcance abierto: la reparación interna del modelo `gbr_v2` (Fase 4, paso 3), que se acota tras el diagnóstico.

---

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Correr el pipeline escribe en producción | Correr primero en modo dry-run que solo imprima el diff de scores |
| El ranking se reordena y contradice material comercial ya emitido | Aviso a asesores antes de publicar (Fase 1) |
| `airroi_str_zonal` sigue muerto: el dato quedará congelado en feb-2026 | La compuerta de frescura lo hace visible en vez de silencioso. Reactivarlo es Fase 2 |
| Los umbrales de "Competencia" y de tendencia están calibrados a la escala inflada | Recalibrar contra la distribución nueva, no portarlos tal cual |
| El pipeline y el gate viven fuera de control de versiones | Fase 2 los mete al monorepo antes de depender más de ellos |
| `gbr_v2` no está en este repo y su reparación puede desbordar | Fase 4 tiene prioridad baja y no bloquea nada; si el diagnóstico desborda, sale a su propio ciclo |
| Las dos escalas de `estimated_rent_vacacional` ($35.5k vs $13.3k) sugieren que uno de los dos modelos está mal calibrado, no solo con ceros | Decidir cuál es el correcto **antes** de declarar la versión publicada. No asumir que el sano es el viejo solo porque no tiene ceros |
| La contención actual de `development_financials` es un comentario y una interfaz angosta, no el esquema | Fase 4 pasos 1-3 la vuelven estructura. Mientras tanto: no ampliar `DevFinancialsSlice` sin leer §1.5 |
