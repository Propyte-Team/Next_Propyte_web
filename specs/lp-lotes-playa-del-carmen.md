# LP Lotes · Playa del Carmen (Google Ads)

Landing de pago para el inventario de lotes de Playa del Carmen.
Derivada del handoff externo del 11-ago-2026, corregida contra el esquema real.
Alcance de esta iteración: **una ruta, un lote**.

- Ruta: `/lp/lotes-playa-del-carmen`
- Estado: construida, build limpio, **no desplegada**
- Rama: `develop`

---

## 1. Desviaciones respecto al brief original, con su razón

| # | El brief pedía | Se implementó | Por qué |
|---|---|---|---|
| D-1 | `/es/lp/...` | `/lp/...` | Los route groups de Next no permiten saltarse un layout padre. Cualquier ruta bajo `app/[locale]/` hereda `[locale]/layout.tsx`, que monta Header, Footer y MainPadding. Colgarla de `app/lp/` la deja heredando solo el root layout. Para una página `noindex` sin variante EN, el prefijo de locale no aporta nada. |
| D-2 | Query `type='terreno' AND status='disponible'` | `slug` exacto + `approved_at IS NOT NULL AND published` | Los valores reales están capitalizados (`'Terreno'`, `'Disponible'`) y **este lote es `unit_type='Lote'`, `status='Preventa'`**: la query del brief devolvía cero filas para PDC. Además sin el gate de publicación salían ~100 terrenos sin aprobar. |
| D-3 | Tabla comparativa ordenable por MXN/m² | Ficha de especificaciones de un lote | Con una sola unidad disponible no hay nada que ordenar. Se conserva lo que sí diferencia: precio por m² publicado y estatus real de urbanización. |
| D-4 | MXN/m² leído del registro | MXN/m² **calculado** | `v_units.price_per_m2_mxn` es columna almacenada y puede desincronizarse del precio. Se deriva de `price_mxn / area_m2`. |
| D-5 | Campo `tasa_anual` | `fin_tasa` | El campo `tasa_anual` no existe. Y `fin_tasa` se resuelve por CASE: si `financiamiento_propio` es false, hereda del **desarrollo**, no de la unidad. |
| D-6 | Prohibido localStorage/sessionStorage | Prohibido, salvo la preferencia de consentimiento | Consent Mode v2 —que el propio brief exige— necesita persistir la decisión. Lo que no se persiste es atribución ni datos de lead: `gclid`/`wbraid` viven en estado React hasta el POST. **No se reusa `useUTMCapture`**, que sí escribe en sessionStorage. |
| D-7 | Reusar el CookieBanner del sitio | `ConsentBannerLp` propio | El del sitio depende de `useTranslations` (NextIntlClientProvider) y `useCompare` (UnitsProvider), ambos en `[locale]/layout`. Montarlos aquí arrastraría next-intl y framer-motion contra el presupuesto de JS. El banner nuevo escribe en la misma clave `propyte:cookies` con el mismo `writeConsent`, así que el consentimiento es consistente en ambos sentidos. |
| D-8 | Hero: "Lotes escriturables… desde {{precio_min}}" | Sin "escriturable", precio único | El registro dice `escritura_disponible = false` y `fecha_escrituracion_estimada = "Finales de 2026 (declarado). HOY NO ES ESCRITURABLE: titulo en fideicomiso."` Anunciarlo como escriturable sería tergiversación. Y con un solo lote, "desde" es engañoso. |

---

## 2. Hallazgos del registro que cambiaron el copy

Datos que el brief no tenía y que están en `Propyte_unidades` de este lote:

1. **`escritura_disponible = false`, título en fideicomiso.** Hoy no es escriturable. La fecha de finales de 2026 es declarada por el desarrollador, no contractual.
2. **`servicios._nota`: "Ningun servicio esta disponible hoy."** Ni agua, ni drenaje, ni electricidad, ni alumbrado. Todos proyectados a oct–nov 2027.
3. **La etapa de este lote no está confirmada.** Las fechas proyectadas corresponden a otra etapa del desarrollo. Se publica como gate abierto.
4. **`costos_adicionales` sí tiene datos**, con fuente: cierre 8–10% del valor de venta (excluye predial), mantenimiento $1,500–$2,500 mensual por definir, y tres cargos únicos que el brief no mencionaba (Fondo de Administración = 6 cuotas al escriturar, reembolsable; Cuota del Comité de Arquitectura al iniciar obra; Fondo de garantía de obra = 465 salarios mínimos, reembolsable). Esto **cierra el gate C-12 para PDC**.
5. **Los JSONB contienen nombres prohibidos** en sus claves meta (`_fuente`: "Aztro Desarrollos"; `_nota`: nombres de etapas). Renderizarlos crudos rompe Camino A. El mapper hace whitelist y descarta toda clave `_*`.

---

## 3. Cambios de esquema aplicados

```sql
-- ✅ APLICADO: add_licencia_autorizacion_venta_desarrollos
alter table real_estate_hub."Propyte_desarrollos"
  add column if not exists licencia_desarrollo_numero   text,
  add column if not exists licencia_desarrollo_fecha    date,
  add column if not exists autorizacion_venta_numero    text,
  add column if not exists autorizacion_venta_fecha     date;

create or replace view real_estate_hub.v_development_licencias as
select d.id as development_id, d.ext_slug_desarrollo as development_slug,
       d.licencia_desarrollo_numero as licencia_numero,
       d.licencia_desarrollo_fecha  as licencia_fecha,
       d.autorizacion_venta_numero  as autorizacion_numero,
       d.autorizacion_venta_fecha   as autorizacion_fecha
from real_estate_hub."Propyte_desarrollos" d
where d.deleted_at is null and d.approved_at is not null;

grant select on real_estate_hub.v_development_licencias to anon, authenticated;
```

`v_developments` **no se tocó** a propósito: son 200+ líneas y la consume todo el
sitio. La view nueva es aditiva y de riesgo cero.

También aplicado por MCP del Hub: `superficie_total_m2 = 129.6` en la unidad
`lote-residencial-en-comunidad-privada`, que es lo que habilita el MXN/m².

### DDL pendiente (bloqueado, requiere que lo apliques tú)

El clasificador de permisos bloqueó esta migración. Sin ella, `wbraid` viaja a
Zoho en la nota UTM pero **no se persiste** en `public.leads`.

```sql
alter table public.leads add column if not exists wbraid text;

comment on column public.leads.wbraid is
  'Google Ads click ID alternativo (sin consentimiento de cookies). Par de gclid para importación de conversiones offline.';
```

Al aplicarla, añadir `wbraid: data.wbraid || null` a los dos payloads de insert
de `src/app/api/leads/route.ts` (líneas ~330 y ~450).

---

## 4. Gates abiertos que bloquean el deploy a producción

| Gate | Qué falta | Quién |
|---|---|---|
| **G-LIC** | Número y fecha de licencia del desarrollo + número y fecha de autorización de venta municipal. Columnas ya existen, vacías. | Dirección / desarrollador |
| **G-TASA** | `fin_tasa` del financiamiento. Sin ella la mensualidad no se publica. Cerrarlo es cambio de dato, no de código. | Desarrollador, por escrito |
| **G-ETAPA** | A qué etapa pertenece este lote, para saber si las fechas de servicios le aplican. | Desarrollador |
| **G-LEGAL** | Confirmar con abogado si la obligación del art. 69 recae en desarrollador, comercializador o ambos, y si aplica a publicidad digital. Supuesto operativo: aplica y Propyte la asume. | Dirección |

---

## 5. Criterios de aceptación · estado

Verificados sobre `.next/server/app/lp/lotes-playa-del-carmen.html`.

- [x] La ruta responde y renderiza `noindex, follow`
- [x] `robots.txt` no bloquea AdsBot-Google (no hay regla que lo afecte)
- [x] Cero nombres de desarrollo o desarrollador en el DOM renderizado (grep sobre el HTML de salida)
- [x] Precio, superficie y disponibilidad vienen de Supabase; cero literales numéricos de precio en el código
- [x] MXN/m² calculado, no capturado: $7,800.00 = 1,010,880 / 129.6
- [x] Todo dato bajo gate renderiza chip `[CONFIRMAR]` en ámbar (7 chips distintos)
- [x] `<LicenciaDesarrollo>` presente con los cuatro campos
- [x] Sin navegación, sin footer de sitio, un CTA primario
- [x] Atribución sin storage: `gclid`/`wbraid` en estado React
- [x] Ninguna frase de la lista prohibida ("certeza jurídica absoluta", "plusvalía garantizada", etc.)
- [x] Sin tiempos de traslado publicados (solo 4.2 km, que sí es publicable)
- [ ] **LCP < 2.0s / INP < 200ms / CLS < 0.05 en Lighthouse móvil, 3 corridas** — sin medir
- [ ] **JS < 120 KB gzip en la ruta** — sin medir. Medir el baseline antes de tratarlo como criterio
- [ ] **Tabla legible en 360px sin scroll horizontal** — sin verificar en navegador
- [ ] **Formulario en móvil real + `gclid` verificado en el payload** — sin verificar e2e
- [ ] El build de producción **no** falla si un chip `[CONFIRMAR]` persiste — decidido así: un build que se rompe por un dato faltante deja la landing inservible en lugar de honesta. El bloqueo es de proceso (esta tabla), no de compilación.

---

## 6. Medición

- Conversión primaria: `generate_lead` con `form_type: lp_lotes_pdc`, vía
  `trackGenerateLead()`, que ya dispara la conversión de Google Ads con
  `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LEAD`.
- Secundarias de observación: `paso_1_completado`, `paso_2_completado`,
  `whatsapp_click` (surface `lp-lotes-pdc-sticky`).
- Handoff a CRM: `source: 'lp_lotes_pdc'`, añadido a `LeadSource`,
  a `KNOWN_SOURCES` de `/api/leads` **y** a la de `/api/cron/zoho-retry` (sin
  esto último, un lead que falle el push queda sin reintento).
- `composeDescription` manda Objetivo + Presupuesto + Lote de interés a Zoho.

---

## 7. Fuera de alcance

Rutas de Tulum y genérica de Riviera Maya, variante en inglés, mapa del
masterplan, framework de A/B testing.
