# Rentabilidad — desglose analítico + origen de datos ("Análisis de mercado Propyte")

**Fecha:** 2026-07-20
**Alcance:** Pestaña **Rentabilidad** de la ficha de Unidad (`/[locale]/propiedades/[slug]`), sus 3 sub-pestañas (Residencial, Vacacional, Proyección ROI). Es un **fast-follow / Slice 6** del rediseño de unidades (spec paraguas `2026-07-17-unidades-rediseno-design.md`, §3). NO toca Esquemas de pago (Slices 2-5) ni la ficha de Desarrollo.
**Repo:** `Next_Propyte_web` (rama `feat/unidades-rediseno`). Solo **presentación** — no cambia ningún cálculo.

---

## 1. Contexto y objetivo

La pestaña Rentabilidad hoy muestra **salidas** (KPIs, gráfica de retorno acumulado, hitos 5/10a, valor proyectado) pero **no explica**: (a) el **desglose analítico año-a-año** de plusvalía + retorno, ni (b) **de dónde vienen los datos**. Luis: *"esa es la funcionalidad de esa pestaña — explicar y desarrollar para cada propiedad"*. Objetivo: convertir la pestaña en la superficie que **explica y desarrolla** el análisis por unidad, con desglose y origen de datos **visibles** (no colapsados).

## 2. RESTRICCIÓN FIRME — atribución de fuentes (legal/relaciones con proveedores)

**Nunca** se nombran los proveedores de datos externos (AirDNA, AirROI, Apify, Inmuebles24, ni ningún vendor) en NINGÚN texto visible: tablas de origen, tooltips, disclaimers, PDF, ni comentarios que puedan filtrarse a UI. Motivo (Luis): evitar problemas con las empresas de las que se obtienen los datos.

- Toda fuente se atribuye a **"Análisis de mercado Propyte"** + **periodo** (ej. "últimos 12 meses").
- Datos estimados/derivados → **"Estimación Propyte"**.
- Cuando un dato no baja a nivel zona y usa el agregado de ciudad → nota discreta **"referencia a nivel ciudad"** (sin explicar el mecanismo interno).
- Esta regla se valida en el spec-review y en el review de código (grep de nombres de proveedores en `messages/*.json` + componentes nuevos → debe dar 0).

## 3. Estado actual (código verificado)

- `src/app/[locale]/propiedades/_components/RentabilidadTab.tsx` arma las 3 sub-pestañas vía `Tabs` (pill). Props: `price, totalPropertyCost, monthlyRentRes, monthlyRentVac, airdna: AirdnaMarketSummary|null, appreciationDefault, locale`.
  - `ResidencialPanel`: renta bruta/efectiva/neta, grossYield/netYield/capRate, ingreso anual neto, `ZoneComparison metric="occupancy"`.
  - `VacacionalPanel`: ADR, ocupación (+ `avg_occupancy_12m`), RevPAR, ingreso mensual est., `TrendChart` ocupación 12m, yields, `ZoneComparison metric="adr"`.
  - `ProyeccionPanel`: slider apreciación (default 8%), gráfica `projectedTotalReturn(price, appreciation, annualNet, yr)` (líneas Res/Vac, año 1-10), hitos 5/10a, `calculateProjectedValue(price, appreciation, 10)`, disclaimer.
- **Origen real de cada dato** (en `UnitDetailPage.tsx`):
  - `monthlyRentRes` = `getRentalEstimate(city, type, bedrooms, zone, 'residencial').median_rent_mxn` → fallback `property.roi.rentalMonthly` (metadata) → 0.
  - `monthlyRentVac` = `getRentalEstimate(..., 'vacacional').median_rent_mxn` → fallback `monthlyRentRes × 1.35` (estimación).
  - `airdna` (ADR, ocupación, avg 12m, tendencia, zonas) = `getAirdnaMarketSummary(cityMarketCode)` (agregado por ciudad → caveat nivel ciudad; puede no bajar a zona).
  - `appreciationDefault` = apreciación de la unidad / default (supuesto ajustable con el slider).
- Cálculos en `src/lib/calculator.ts` (`calculateGrossYield/NetYield/CapRate`, `calculateVac*`, `projectedTotalReturn`, `calculateProjectedValue`, ratios `RES`/`VAC`). **No se modifican.**

## 4. Diseño (todo VISIBLE y desarrollado; sin colapsar)

### 4.1 Proyección ROI — desglose año-a-año
Debajo de la gráfica + hitos + valor proyectado actuales (se conservan), agregar una **tabla año-a-año (1..10) siempre visible**:

| Año | Valor propiedad (plusvalía) | Rentas netas acumuladas | Retorno total | Retorno % |
|---|---|---|---|---|

- Dos escenarios: un **toggle Residencial / Vacacional** encima de la tabla (una tabla a la vez para no saturar), default Vacacional.
- **Paridad obligatoria con la gráfica (leer el cuerpo de las funciones, no asumir):** el implementador DEBE abrir `projectedTotalReturn` y `calculateProjectedValue` en `calculator.ts` y **descomponer exactamente** su cálculo en las columnas, de modo que:
  - `Retorno % (columna) === projectedTotalReturn(price, appreciation, annualNet, año)` (idéntico a la línea de la gráfica).
  - `Valor propiedad === calculateProjectedValue(price, appreciation, año)` (idéntico al "valor proyectado 10a" en el año 10).
  - `Plusvalía + Rentas netas acumuladas` (las dos columnas de composición) **suman** el `Retorno total`, y `Retorno total === Retorno % × price / 100` (reconciliar redondeo en la última cifra). Las dos sub-columnas deben derivarse de la MISMA descomposición interna que usa `projectedTotalReturn` (ej. si acumula rentas de forma distinta a `annualNet × año`, se usa esa forma real — NO una fórmula paralela).
  - **Aceptación:** el año 5 y 10 de la tabla == hitos 5a/10a; el Valor propiedad año 10 == "Valor proyectado (10 años)" ya mostrado. Si no cuadran, es bug de este slice.
- Breve línea explicativa arriba de la tabla: cómo se compone el retorno (plusvalía + rentas, sin financiamiento) — reusa/expande el disclaimer existente. **Solo mensualidad/rentas netas** (coherente con la regla financiera; sin restar mensualidad de préstamo).

### 4.2 Residencial — tabla de origen de datos (compacta, siempre visible)
Tabla "Origen de los datos" con filas por dato mostrado en el panel:

| Dato | Valor | Fuente | Periodo |
|---|---|---|---|
| Renta mensual (mediana) | `$…` | Análisis de mercado Propyte | (periodo) |
| Ocupación asumida | `…%` | Estimación Propyte | — |
| Rendimiento bruto/neto, cap rate | (fórmula) | Cálculo Propyte s/ renta y costo total | — |

- Si `monthlyRentRes` vino del fallback de metadata (no del estimate) → Fuente = "Estimación Propyte".
- Nota al pie discreta "referencia a nivel ciudad" cuando el estimate no tiene desglose de zona.

### 4.3 Vacacional — tabla de origen de datos (siempre visible)
| Dato | Valor | Fuente | Periodo |
|---|---|---|---|
| ADR | `$…` | Análisis de mercado Propyte | últimos 12 meses |
| Ocupación (+ promedio 12m) | `…%` | Análisis de mercado Propyte | últimos 12 meses |
| RevPAR | `$…` | Cálculo Propyte (ADR × ocupación) | — |
| Ingreso mensual estimado | `$…` | Estimación Propyte | — |

- Nota "referencia a nivel ciudad" cuando el dato no baja a zona.
- Si `monthlyRentVac` fue `res × 1.35` (fallback) → esa fila marca "Estimación Propyte".

### 4.4 Componente de tabla de origen (reutilizable)
- Nuevo `src/app/[locale]/propiedades/_components/rentabilidad/DataSourceTable.tsx` — presentacional puro: recibe `rows: { label; value; source; period? }[]` + `footnote?`. Lo consumen Residencial y Vacacional. Sin lógica de datos (los strings de fuente/periodo se arman en `RentabilidadTab` con las claves i18n).
- El desglose año-a-año puede vivir inline en `ProyeccionPanel` o en `rentabilidad/ProjectionBreakdown.tsx` (decisión del plan; preferir archivo aparte si `RentabilidadTab` crece).

## 5. Sin cambios de cálculo
Reusa `calculator.ts` tal cual. Ningún número nuevo; solo se **exponen y explican** los que ya se calculan. Prohibido introducir constantes/fórmulas nuevas de rendimiento en este slice.

## 6. i18n
Namespace `simulator` (el que ya usa `RentabilidadTab`). Nuevas claves es/en en paridad: encabezados de columnas (año/valor/rentas acum./retorno/retorno %), toggle Res/Vac del desglose, título "Origen de los datos", etiquetas de filas, `Fuente`, `Periodo`, "Análisis de mercado Propyte", "Estimación Propyte", "Cálculo Propyte", "últimos 12 meses", nota "referencia a nivel ciudad", línea explicativa del desglose. **Ningún string nombra un proveedor externo.**

## 7. Verificación (repo sin vitest)
- `tsc --noEmit` + `next build`.
- **Probe SSR** del panel (carpeta sin guion bajo; `Tabs` renderiza solo el panel activo → montar `ProyeccionPanel`/`ResidencialPanel`/`VacacionalPanel` directo). Confirmar que el año 10 de la tabla de desglose == hito 10a == valor proyectado ya mostrados (paridad con la gráfica).
- Paridad i18n es/en del namespace `simulator` (node script).
- **Grep anti-proveedor:** `grep -riE 'airdna|airroi|apify|inmuebles24' messages/*.json <componentes nuevos>` → 0 resultados.

## 8. Fuera de alcance
- Cambiar la matemática de proyección o los ratios RES/VAC.
- Traer datos nuevos de zona (si el agregado es de ciudad, se etiqueta como tal — no se resuelve el desglose de zona aquí).
- PDF de la pestaña Rentabilidad (el PDF de cotización es de Esquemas; si se quiere PDF de Rentabilidad es otro slice).
- Tocar la visibilidad en prod (`site_visibility`) — sigue gateada; este slice solo mejora el contenido.

## 9. Decisiones abiertas / a afinar
- Formato exacto de "Periodo" para renta residencial (el estimate puede no traer ventana temporal explícita) — usar "análisis reciente" si no hay periodo fiable, en vez de inventar una fecha.
- Si el toggle Res/Vac del desglose debe recordar la sub-pestaña activa (Residencial/Vacacional) o ser independiente — default independiente, Vacacional primero.
