# Esquemas de pago — nombre bilingüe (es original + en)

**Fecha:** 2026-07-20
**Alcance:** El **nombre** del esquema de pago (`EsquemaPago.label`) que hoy se muestra solo en español en la pestaña "Financiamiento interno" de la ficha de Unidad. Slice 7 del rediseño de unidades, **paralelo** al desglose ROI (Slice 6). Repos: `Next_Propyte_web` (rama `feat/unidades-rediseno`) + `Propyte_hub` (worktree `Propyte_hub_preventa`, rama `feat/unidades-preventa-interno-hub`).
**Sin DDL** — el `label_en` vive dentro del JSONB `esquemas_pago` existente.

---

## 1. Objetivo
En `/en/`, el nombre del esquema (ej. "Financiamiento 60 meses") sale en español porque es texto libre del Hub de un solo idioma. Agregar una versión en inglés: **español = original (requerido)**, **inglés = opcional con fallback al español**. El sitio elige por `locale`.

## 2. Alcance
- **DENTRO:** nombre del esquema configurado en el Hub (`label` + nuevo `label_en`); nombres de fallback auto-generados (hoy hardcodeados en español); default `"Esquema N"`.
- **FUERA (decidido con Luis):**
  - Amenidades custom del desarrollo que salen en español (`AmenityList.tsx:72`) → slice futuro aparte.
  - `title_en` / `description_en`: las columnas ya existen y están cableadas (el mapper elige la inglesa si está llena); si faltan, es **captura de datos de Marketing en el Hub**, NO código. Documentado, sin trabajo en este slice.
  - No tocar cálculos, ni otras pestañas, ni visibilidad prod.

## 3. Estado actual (verificado)
- `src/lib/esquemas-pago.ts`: `EsquemaPago.label: string` (sin `label_en`); `parseEsquemas` copia `label: String(x.label ?? \`Esquema ${i+1}\`)`.
- Render único del nombre: `src/app/[locale]/propiedades/_components/CorridaFinanciera.tsx:138` → `{e.label}` (chips del selector). (Auditoría confirmó que es el único sitio en la ficha; verificar en implementación con grep por si el PDF interno lo usa.)
- Fallback en `src/lib/mappers/unit-to-property.ts:173,176`: `label: 'Financiamiento'` / `` `Financiamiento ${m} meses` `` (español hardcodeado). El mapper ya recibe `locale`.
- Hub `src/lib/esquemas-pago.ts` (`EsquemaPago`) + `src/components/common/fields/PaymentSchemesEditor.tsx` (fila con input "Nombre" = `label`).

## 4. Diseño

### 4.1 Modelo de datos (web + Hub, idéntico; dentro de esquemas_pago JSONB)
`EsquemaPago` gana un campo opcional:
```ts
label_en?: string; // traducción en inglés del nombre; vacío → fallback a `label` (es)
```
`parseEsquemas` (ambos repos) coacciona: `label_en: x.label_en != null ? String(x.label_en) : undefined` (o `''`). No DDL: persiste en el array JSONB por el save existente.

### 4.2 Hub — editor
`PaymentSchemesEditor.tsx`: junto al input "Nombre" (español, original) agregar "Nombre (EN)" que escribe `label_en` vía el `update(i, { label_en })` existente. Placeholder/hint: "opcional; si se deja vacío se usa el nombre en español". Mantener el layout de la fila (grid actual).

### 4.3 Web — selección por locale
- Helper nuevo en `src/lib/esquemas-pago.ts`:
  ```ts
  export function esquemaLabel(e: EsquemaPago, locale: string): string {
    return locale === 'en' && e.label_en ? e.label_en : e.label;
  }
  ```
- `CorridaFinanciera.tsx:138` (y cualquier otro render de `esquema.label` que aparezca en el grep): usar `esquemaLabel(e, locale)`. `CorridaFinanciera` ya recibe `locale`.
- Si el PDF interno (`generate-cotizacion-pdf`, mode=interno) llegara a mostrar el nombre del esquema, aplicar el mismo helper con el `locale` del PDF (verificar en implementación; hoy el PDF arma bloques con i18n, probablemente no muestra el nombre — si no lo muestra, no se toca).

### 4.4 Fallback bilingüe (mapper)
`buildFallbackEsquemas` produce AMBOS idiomas para que el helper funcione uniforme, independiente del locale del render:
```ts
{ id: 'v1_0', label: 'Financiamiento', label_en: 'Financing', ... }
{ id: `v1_${m}`, label: `Financiamiento ${m} meses`, label_en: `Financing ${m} months`, ... }
```
(Así el mapper no necesita ramificar por locale para los nombres; el helper decide en el render.)

## 5. Verificación (repo sin vitest)
- `tsc --noEmit` + `next build` (web) y `tsc`+`build` (Hub, salvo los 2 errores pre-existentes ajenos).
- Probe SSR: montar `CorridaFinanciera` con un esquema `{label:'Financiamiento 60 meses', label_en:'Financing 60 months'}` y confirmar que en `locale='en'` renderiza "Financing 60 months" y en `locale='es'` "Financiamiento 60 meses"; y con `label_en` vacío, cae al español en ambos. Verificar el fallback (unidad sin esquemas Hub) también.
- Round-trip Hub→web del `label_en` en JSONB (set→select→revert en `esquemas_pago`, como se validó `timing`).
- Paridad i18n no aplica (son datos, no claves i18n). Confirmar que NO se agregó ningún nombre de proveedor.

## 6. Fuera de alcance / follow-ups documentados
- **Amenidades custom bilingües** (`AmenityList` fallthrough a string crudo) — slice futuro; opciones: extender el mapa canónico de amenidades con EN, o agregar `amenities_en` a nivel desarrollo en el Hub.
- **title_en / description_en**: captura manual de Marketing en el Hub (columnas ya cableadas). Opción futura: auto-traducción IA (patrón cron del blog) — proyecto aparte si Luis lo pide.
- Este slice NO migra los campos viejos de financiamiento (deprecación pendiente, separada).
