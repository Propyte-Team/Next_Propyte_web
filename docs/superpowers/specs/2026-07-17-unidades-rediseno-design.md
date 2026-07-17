# Rediseño de la página de Unidades — Rentabilidad, Esquemas de Pago y Calculadora de Financiamientos

**Fecha:** 2026-07-17
**Alcance:** Solo la ficha de **Unidad** (`/[locale]/propiedades/[slug]`). La ficha de **Desarrollo** NO se toca en este trabajo.
**Repos:** `Next_Propyte_web` (público, propyte.com) + `Propyte_hub` (admin, hub.propyte.com).
**Base:** `origin/main` en ambos repos (ya incluye esquemas_pago v2 + `CorridaFinanciera` + ventana de datos 12 meses).

---

## 1. Contexto y objetivo

Tras revisar mercado/rentabilidad se concluyó que hoy todo se compara contra el financiamiento y se percibe como negativo. Se **separa y reorganiza** la información:

- La pestaña actual **"Rentabilidad"** se parte en dos: **Rentabilidad** (solo ganancias/proyección, nunca en negativo) y **Esquemas de pago** (pagos + calculadoras + cotización + PDF).
- Se elimina toda resta de mensualidad de financiamiento del cálculo de rendimiento.

---

## 2. Estado actual (código relevante, verificado)

- Ficha de unidad: `src/app/[locale]/propiedades/_components/UnitDetailPage.tsx` arma los tabs; la pestaña `rentabilidad` (gated por `VISIBILITY_KEYS.PROPIEDADES_DETAIL_RENTABILIDAD`) renderiza `UnitInvestmentCalculator.tsx`.
- `UnitInvestmentCalculator.tsx` tiene sub-tabs internos: `residencial`, `vacacional`, `corrida` (gated), `proyeccion`. **Aquí está lo que hay que cambiar.**
  - **Resta de mensualidad a eliminar:** `monthlyNet = netMonthly - monthlyPayment` (objetos `res` y `vac`); label `− Mensualidad préstamo` (`minusMonthlyLoan`).
  - **"Flujo Anual" a eliminar:** `CashflowTable` + `annualCashflow` ("Flujo anual (horizonte 10 años)").
- `CorridaFinanciera.tsx`: hoy corrida de un solo plazo; en la base ya existe `esquemas-pago.ts` (`parseEsquemas`, `computeEsquema`) y el selector de esquemas.
- `src/lib/calculator.ts`: `buildAmortizationSchedule(principal, annualRatePct, months)` (francesa), `engancheMxn`, `CLOSING_COSTS_BY_STATE` (Q.Roo 8%, Yucatán 6%), `RES`/`VAC` ratios, `MARKET_SUBMARKET_TO_ZONE/CITY`.
- Mapper `src/lib/mappers/unit-to-property.ts` lee columnas `fin_*` de `v_units` → `property.financing` (`PropertyFinancing`: `downPaymentMin, months, interestRate, directo, mesesNota, esquema, aceptaHipotecario, aceptaInfonavit, aceptaFovissste, esquemas`).
- PDF: `src/lib/pdf/PropertyPDFDocument.tsx` + `src/app/api/generate-pdf/route.ts`. Hoy exporta un snapshot de la propiedad; **NO** exporta corrida/cotización/esquemas → hay que construir el PDF de cotización.
- Hub: `esquemas_pago` (JSONB) por desarrollo + override por unidad ya en `origin/main`. `tipo_entrega` (select: Obra gris / Con acabados / Llave en mano / Amueblada / Equipada (turnkey)), `estado_unidad` (Disponible/Preventa/Entrega inmediata/Reservada/Vendida/Renta), `financiamiento_directo`.

---

## 3. Pestaña RENTABILIDAD (rediseñada)

Mantiene **3 sub-pestañas** (como hoy). Todo se muestra **más desglosado**, con la **percepción real de los últimos 12 meses** vía **gráficas de línea** de datos actuales, bien formateado. **Sin restar la mensualidad del financiamiento en ninguna.**

### 3.1 Sub-pestaña Residencial
- Solo datos residenciales: renta larga estimada (mensual/anual), yield bruto.
- **Comparativa simple con zonas similares** (barras).
- Charts de línea de últimos 12 meses (renta/indicadores) cuando haya serie.

### 3.2 Sub-pestaña Vacacional (Airbnb)
- Solo datos vacacionales, con **lenguaje propio de renta vacacional** (ADR, ocupación, temporada) — dejar claro que es un concepto distinto al residencial.
- KPIs: **ADR**, ocupación, RevPAR, ingreso mensual/anual estimado.
- **Comparación de ADR/ocupación con zonas similares**.
- Charts de línea de **últimos 12 meses** de ADR y ocupación (datos reales).

### 3.3 Sub-pestaña Proyección de ROI
- Apreciación anual **igual que hoy**.
- Cambios: **quitar "Flujo Anual"**; el ROI proyecta **plusvalía + rentas** comparando **Vacacional vs Residencial** (el resultado de cada uno), **no** contra un financiamiento.

### 3.4 Datos 12 meses (dependencia)
La serie mensual de 12 meses la produce **otra iniciativa ya mergeada en `origin/main`** (`769ea3e feat(analista): ventana de 12 meses`). Slice 1 **consume** esa serie; no la construye. Al implementar se alinea el shape exacto (nombres de campos) con lo que expone la query/mapper de esa ventana.

---

## 4. Pestaña ESQUEMAS DE PAGO (nueva)

### 4.1 Estructura
- **Parte superior (siempre visible): Calculadora de inversión** = Precio + Inversión inicial, **sin financiamiento**. Contiene: enganche, **escrituración**, **mobiliario**, **decoración** (mobiliario y decoración separados).
- **Parte inferior: 3 sub-pestañas** que resuelven el **financiamiento del saldo**:
  1. **Preventa** — solo si `estado_unidad = "Preventa"`.
  2. **Financiamiento Interno** — solo si `financiamiento_directo` activo.
  3. **Financiamiento Hipotecario** — siempre.
- Decisión de estructura: **opción B** — cada sub-pestaña muestra la **cotización de 3 bloques completa** (el precio/descuento se recalcula según el esquema elegido). La calculadora de arriba comparte Precio + Inversión inicial.

### 4.2 Cotización en 3 bloques (por esquema elegido)
- **Bloque 1 — Precio:** Precio · Descuento % (si aplica) · Precio de venta (con descuento).
- **Bloque 2 — Inversión inicial:** % Enganche → Enganche · Gasto de escrituración · Mobiliario · Decoración · **Inversión Inicial (total)**.
- **Bloque 3 — Financiamiento del saldo:** Saldo · Mensualidades (ej. 12/120/240) · Interés (ej. 0%/10.50%) · Mensualidad resultante.

### 4.3 Sub-pestaña Preventa
Aparece solo si `estado_unidad = "Preventa"`. Dos modos:
- **Modo A (configurada en Hub):** plan fijo con etapas: **enganche inicial + pagos durante obra (cuotas en meses fijos) + contraentrega**. El enganche puede ir en 1 o 2 partes (inicial + diferido). Config **por desarrollo con override por unidad** (mismo patrón que esquemas_pago). Extensible a más hitos en el futuro; por ahora esas 3 etapas.
- **Modo B (fallback, sin config):** "Ajusta cómo pagar tu preventa" — barra de enganche, barra de pagos a meses (durante obra), barra de contraentrega + summary abajo.
- **Contraentrega → nueva corrida:** el saldo de contraentrega puede pagarse vía **Hipotecario (Nac/Ext)** o **Interno**, y eso **genera la corrida** correspondiente de ese saldo.

### 4.4 Sub-pestaña Financiamiento Interno
- Muestra **únicamente las opciones configuradas en el Hub** (sin barras ajustables), usando las corridas financieras existentes.
- Nuevo en Hub: **timing de intereses** (`al inicio` / `prorrateado` / `al final`) — se decide **en el Hub**, la web **no nombra la opción**; el timing se **visualiza en la gráfica de barras** interés vs capital.
  - **Al inicio:** al principio se paga mayor % de interés que capital; el interés decrece pero sigue dominando → se terminan de pagar **primero los intereses** y el capital al final.
  - **Prorrateado:** amortización francesa (cuota fija; interés decreciente, capital creciente balanceado). Ya existe.
  - **Al final:** menor % de interés al principio (más capital); el interés **crece y se concentra al final**.
  - "Al inicio" y "al final" son **2 fórmulas de amortización nuevas** además de la francesa.

### 4.5 Sub-pestaña Financiamiento Hipotecario
- Calculadora estándar con corrida. **Selector Nacional / Extranjero** (una opción a la vez, no ambas): cada una con su tasa; al cambiar de perfil se recalcula todo.

---

## 5. Modelo de costos — dónde vive cada dato (locked, ajustable después)

| Dato | Valor de arranque | Dónde vive |
|---|---|---|
| Escrituración Nacional | **8%** del precio | Config global (código) |
| Escrituración Extranjero | 8% + **fideicomiso** ~$60,000 MXN (constitución banco + permiso SRE $21,650); mantenimiento ~$10,500/año (nota) | Config global |
| Mobiliario (MXN/m²) | Standard $3,000 · Alto $6,000 · Premium $10,000 | Config global |
| Decoración (MXN/m²) | Standard $1,000 · Alto $2,200 · Premium $4,000 | Config global |
| Factor ubicación | Premium 1.15 · Estándar 1.00 · Emergente 0.90 (por zona/estado) | Config global |
| Tasa hipotecario Nacional | **10.5%** anual (MXN), 20 años | Config global |
| Tasa hipotecario Extranjero | **9.5%** anual (USD, cross-border), 30 años, enganche 35%; aviso de riesgo cambiario | Config global |
| Timing intereses interno | al inicio / prorrateado / al final | **Hub** (nuevo campo) |
| Config Preventa | enganche inicial / obra % / obra meses / contraentrega % / contraentrega vía | **Hub** (JSONB, desarrollo + override unidad) |

**Fórmula mobiliario/decoración:** `costo = m² × tarifa[categoría][nivel] × factorUbicación`.

**Estimado por `tipo_entrega`** (qué viene incluido → dropdown desactivado pero mencionado):

| tipo_entrega | Mobiliario | Decoración |
|---|---|---|
| Obra gris | Cobra | Cobra |
| Con acabados | Cobra | Cobra |
| **Equipada** (cocina, calentador, bomba — equipo indispensable, sin muebles) | Cobra | Cobra |
| **Amueblada** (con mobiliario) | Incluido | Cobra |
| **Llave en mano / turnkey** | Incluido | Incluido |

- **Llave en mano** se **deriva de `tipo_entrega`** (no requiere flag nuevo).
- Ajuste de datos recomendado: relabelar el valor `"Equipada (turnkey)"` → `"Equipada"` (turnkey = llave en mano) para no confundir; migración de datos pequeña.

---

## 6. Corrida compacta + Exportación PDF

### 6.1 Reducir impacto visual de corridas largas (hasta 240 meses)
- **Por defecto: tabla por AÑO** (~20 filas), cada año **expande sus 12 meses** al clic.
- **Gráfica de barras integrada** interés vs capital (como la actual) arriba; el timing se lee en la forma de las barras.
- Toggle **"Ver por año / Ver por mes"**; summary (mensualidad, total intereses, total pagado).
- Aplica a Hipotecario, Interno y contraentrega de Preventa.

### 6.2 PDF (aplica a todos los esquemas)
- Todos los esquemas de financiamiento se **descargan en PDF como cotización**, **espejo de lo que se ve en pantalla** (los 3 bloques + resumen de corrida).
- En el PDF la corrida va como **resumen por año** (no las 240 filas).
- Se extiende `PropertyPDFDocument`/`generate-pdf` (o un documento nuevo de cotización).

---

## 7. Hoja de ruta — 5 rebanadas (cada una spec→plan→deploy)

**Slice 0 — Prep (hecho en este documento):** base = `origin/main` (esquemas_pago + corrida + 12m confirmados); worktrees aislados (`Next_Propyte_web_unidades`, y uno del Hub cuando toque); coordinar con sesiones activas (`Arreglos_Mercado_rentabilidad` web, `feat/blog-auto-translate` hub) — **no** tocar esas ramas; merge a main vía `git push origin HEAD:main` (FF).

1. **Rentabilidad rediseño (web).** Separar la pestaña; quitar Flujo Anual + resta de mensualidad; 3 sub-pestañas desglosadas + charts 12m + comparativa de zonas.
   - *Aceptación:* pestaña Rentabilidad sin resta ni Flujo Anual; 3 sub-pestañas con desglose y charts; nueva pestaña "Esquemas de pago" existe (aunque sea shell); i18n es/en en paridad; `tsc` + `next build` + standalone runtime OK.
   - *Dependencia:* serie 12m (ya en `origin/main`).

2. **Esquemas de pago — estructura + Inversión inicial (web + config global).** Nueva pestaña; calculadora arriba (Precio + Inversión inicial); escrituración Nac/Ext; mobiliario/decoración auto (fórmula); llave-en-mano desde `tipo_entrega`; cotización 3 bloques (skeleton) + shell de las 3 sub-pestañas con sus gates.
   - *Aceptación:* inversión inicial calcula con las constantes; dropdowns Std/Alto/Premium; desactivación por tipo_entrega; gates de sub-pestañas correctos.

3. **Hipotecario + corrida compacta + PDF (web + config global).** Selector Nac/Ext con sus tasas; corrida compacta (tabla por año + barras); export **PDF de cotización** (base reutilizable).
   - *Aceptación:* corrida 240 meses sin saturar; PDF espejo con 3 bloques + resumen por año; Nac/Ext recalcula.

4. **Preventa (Hub + web).** Hub: config JSONB (desarrollo + override unidad) + editor. Web: sub-pestaña Preventa modo A/B + contraentrega→corrida.
   - *Aceptación:* con config → plan fijo; sin config → fallback ajustable; contraentrega enlaza a corrida (hipotecario/interno).

5. **Financiamiento Interno + timings (Hub + web).** Hub: campo timing (al inicio/prorrateado/al final). Web: 2 fórmulas nuevas de amortización + render solo-lectura vía barras (sin nombrar opción).
   - *Aceptación:* las 3 mecánicas producen corridas distintas visibles en las barras; web no nombra la opción.

---

## 8. Dependencias, riesgos y coordinación

- **Worktree compartido (gotcha conocido):** verificar `git rev-parse --abbrev-ref HEAD` antes de cada commit; stagear rutas explícitas (no `git add -A`); merge a main vía `git push origin HEAD:main` (FF, sin `checkout main`). Autor git: `-c user.email=marketing@propyte.com` (el repo puede tener email de webkoi).
- **Validación runtime:** `next build` verde ≠ runtime-safe. Validar en **standalone local** antes de push a main (lección de los 500 de ISR).
- **12m:** alinear shape de datos con la ventana ya mergeada.
- **Datos de zona:** comparativas de zona pueden caer a nivel ciudad por infra preexistente (`fetchSubmarketZones .limit`, `MARKET_SUBMARKET_TO_ZONE` incompleto). Nota honesta "* nivel ciudad" cuando no haya desglose de zona.
- **Tasa extranjero en USD:** la corrida hipotecaria extranjera es en USD → aviso de riesgo cambiario en pantalla.

## 9. Decisiones abiertas / a afinar después

- Valores exactos de las constantes globales (tarifas mobiliario/deco, factor, fideicomiso, tasas) — arranque puesto, se ajustan después.
- Si las constantes globales deben migrar a UI del Hub más adelante (por ahora viven en config del repo).
- Detalle de "más hitos" de preventa (hoy 3 etapas).
- Si el timing de intereses vive por esquema o a nivel desarrollo (se decide en Slice 5).
