# Etiquetado honesto en "Origen de los datos" + /financiamiento con corrida real — Diseño

**Fecha:** 2026-07-23 · **Aprobado por:** Luis (diseño conversacional) · **Rama:** `feat/financiamiento-corrida` (off `origin/main` `0942d6f`)

## Contexto

1. En la ficha de unidad (tab Rentabilidad), la tabla "Origen de los datos" muestra `—` en la columna Periodo para las filas cuya fuente es "Estimación Propyte" o "Cálculo Propyte". No es un dato faltante: la ocupación residencial 95% es una **constante fija** (`RES.OCCUPANCY`, `src/lib/calculator.ts`) y los rendimientos son **aritmética derivada** de las otras filas. Hoy no existe fuente de ocupación residencial de renta larga en el pipeline (AirROI = solo vacacional; Track C Apify = rentas, no ocupación). Decisión: **etiquetar honesto**, no inventar dato.
2. `/[locale]/financiamiento` usa `MortgageCalculator` genérica (precio/tasa/plazo libres + pie chart), anterior a las libs reales del hipotecario (`HIPOTECARIO_CONFIG` + `computeHipotecario`) y a `CorridaCompacta` que ya viven en las fichas. Decisión: reemplazarla por la corrida real con perfiles + agregar ejemplos con propiedades reales del catálogo (selección automática).

## Parte 1 — Etiquetado honesto en `DataSourceTable`

- Keys i18n nuevas en namespace `simulator` (es/en):
  - `periodAssumption`: "Supuesto fijo" / "Fixed assumption"
  - `periodDerived`: "Derivado de los datos anteriores" / "Derived from the data above"
- `RentabilidadTab.tsx`:
  - Panel Residencial: fila `rowOccupancyAssumed` → `period: t('periodAssumption')`; fila `rowYields` → `period: t('periodDerived')`.
  - Panel Vacacional: fila `rowRevpar` → `period: t('periodDerived')`; fila `rowEstIncome` → `period: t('periodDerived')`.
- `DataSourceTable.tsx` no cambia (sigue el fallback `period ?? '—'`, que queda solo para casos futuros sin etiqueta).

## Parte 2 — /financiamiento

### 2.1 Calculadora nueva: `FinanciamientoSimulator`

- `src/components/financiamiento/FinanciamientoSimulator.tsx` (client) + wrapper lazy `FinanciamientoSimulatorLazy.tsx` (mismo patrón del actual: `CorridaCompacta` monta recharts, debe ir en `dynamic()`).
- **Inputs:** precio (campo formateado + slider; default $4,000,000; rango $500,000–$30,000,000) y perfil **Nacional/Extranjero** (pills, mismo patrón visual de la ficha).
- **Parámetros NO editables**, leídos de `HIPOTECARIO_CONFIG` (fuente única — el spec no fija tasas/plazos/enganches; hoy: nacional 10.5%/240m/20%, extranjero 9.5%/360m/35%): se muestran como chips informativos (tasa, plazo, enganche).
- **Output:** Enganche (monto), Monto a financiar, **Mensualidad destacada**, y `CorridaCompacta` (`schedule`, `currency="MXN"`). Regla vigente: **solo mensualidad — NUNCA totales lifetime de intereses/total pagado** (decisión Luis 2026-07-20, percepción negativa).
- **Extranjero:** montos en MXN + aviso cambiario (gateado por `config.avisoCambiario`), texto consistente con la ficha.
- **Cálculo:** `computeHipotecario(precio, perfil)`. Cero fórmulas nuevas; formateo con `formatPrice` compartido (paridad por formateadores).
- Reemplaza a `<MortgageCalculator />` en `financiamiento/page.tsx`. Tras el reemplazo, `MortgageCalculator.tsx` y `MortgageCalculatorLazy.tsx` quedan **sin importadores** (verificado por grep) → **se eliminan ambos archivos**. La aprobación de este spec cubre el borrado.

### 2.2 Sección "Ejemplos con propiedades reales"

- Server-side en `financiamiento/page.tsx`: `getUnits(client, { orderBy: 'newest', limit: 30 })` → filtrar `price_mxn > 0` y con imagen → ordenar por precio → partir en **terciles** → 1 unidad por tercil (la más reciente de cada uno) = hasta 3 ejemplos (rango bajo/medio/alto). La selección vive en un **helper puro** (`src/lib/financiamiento-ejemplos.ts`) con unit test.
- Card por unidad: imagen (`next/image` con dimensiones reservadas — evitar CLS), nombre + recámaras/m², precio, **enganche y mensualidad Nacional** (calculados server-side con `computeHipotecario`), CTA → `/${locale}/propiedades/${slug}`.
- **Fail-closed:** 0 unidades válidas → la sección no se renderiza. Con 1–2, renderiza las que haya.
- Nota breve al pie de la sección: cifras informativas con perfil nacional, sujeto a aprobación bancaria.

### 2.3 Orden de página

Hero → BankLogos → **FinanciamientoSimulator** → **Ejemplos reales** → 4 métodos → tabla comparativa → pre-qualify → CTA → disclaimer. JSON-LD, metadata SEO y gate `assertPageVisible` intactos.

### 2.4 i18n

Keys nuevas en namespace `financiamiento` (título/labels de la calculadora nueva, sección ejemplos, CTA de card, nota) con **paridad es/en**. `CorridaCompacta` ya trae sus propias keys (`esquemas`), disponibles globalmente.

## Fuera de alcance

- No tocar los 4 métodos, tabla comparativa, CTAs ni metadata.
- No modificar `HIPOTECARIO_CONFIG`, `calculator.ts` ni ninguna fórmula.
- No hay deploy en este trabajo: push/merge a `main` solo con autorización explícita de Luis.

## Verificación

- `tsc --noEmit` = 0, eslint sin errores en archivos tocados, `next build` verde, paridad i18n es/en.
- Unit test (vitest) del helper de selección por terciles (TDD).
- Probe visual local de `/es/financiamiento` (calculadora + ejemplos + corrida) y del tab Rentabilidad (etiquetas nuevas en la tabla de origen).

## Riesgos y mitigaciones

- **Peso JS:** recharts ya cargaba lazy en esta página; el wrapper `dynamic()` se conserva para la calculadora nueva.
- **Datos de unidades incompletos:** el helper filtra precio/imagen y es fail-closed; nunca muestra tarjetas rotas.
- **Plazos/tasas cambiantes:** todo se lee de `HIPOTECARIO_CONFIG` en runtime; el spec no congela valores (el plazo extranjero ya cambió 360→240→360 en julio).
