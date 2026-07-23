# Lead Magnet "Top 10 Oportunidades" — Edición mensual con descarga directa

**Fecha:** 2026-07-23 · **Estado:** aprobado por Luis (diseño) · **Repo:** Next_Propyte_web (+ vista mínima en Propyte_hub)

## Problema

El Lead Magnet del Home (`src/components/home/LeadMagnet.tsx`) promete "Top 10 Desarrollos con Mayor ROI 2026" y tras el submit muestra "¡Revisa tu correo! Te hemos enviado el reporte" — pero el submit solo crea el lead en Zoho (`source=lead_magnet` vía `/api/leads`). **El reporte no existe y no se envía nada.** La promesa es incumplible hoy.

## Decisiones (Luis, 2026-07-23)

| Decisión | Elección |
|---|---|
| Contenido | **A+B**: Top 10 unidades + 1-2 páginas de panorama de mercado |
| Ranking | **Score compuesto** con reglas de diversidad |
| Entrega | **Descarga directa tras el submit** (URL firmada de corta vida; sin email — se descartó Nodemailer/SMTP) |
| Generación | **Edición mensual pre-generada** por cron, con gate humano de aprobación |
| Top N flexible (2026-07-23, post-implementación) | La BD real solo tenía 1/54 unidades con renta en `v_units` → se agregó **cruce con `rental_ml_estimates`** (fill por development_id+bedrooms, valor nativo gana) y la promesa pasó de "Top 10" fijo a **"Top Oportunidades" (mínimo 6, hasta 10)**; el cron hace 422 bajo el mínimo |

## 1. El PDF (edición es + en, generadas juntas)

- **Portada:** "Top 10 Oportunidades de Inversión en el Caribe Mexicano — Edición \<Mes Año\>", branding Propyte.
- **Top 10:** una tarjeta por unidad — desarrollo, ciudad/zona, tipología (recámaras/m²), precio, renta estimada mensual, yield, ROI proyectado, descuento si aplica, y link a la ficha en propyte.com (regresa tráfico al sitio).
- **Panorama de mercado (1-2 págs):** ocupación/ADR/RevPAR por ciudad (benchmark STR real, 4 ciudades), renta larga promedio por ciudad (comparables frescos ≤12m), top 5 zonas por score. Atribución: **"Análisis de mercado Propyte"** — nunca nombrar proveedores de datos (Airbnb solo como categoría STR). Ref: `feedback_no_nombrar_proveedores_datos`.
- **Cierre:** metodología breve, disclaimer ("estimaciones referenciales, no asesoría financiera"), CTA de contacto.
- **Restricciones:** tamaño objetivo **<1.5MB**; ROI siempre rotulado "proyectado/estimado"; sin totales lifetime de financiamiento; renderizado con `@react-pdf/renderer` reutilizando patrones de `CotizacionPDFDocument.tsx` (gotchas conocidos: sin `gap`, usar margin; `minPresenceAhead`; `wrap` page-break; `paddingBottom` suficiente para footer fijo).

## 2. Ranking — score compuesto

Lib pura `src/lib/lead-magnet/score.ts` + tests unitarios (patrón `calculator.ts`).

- **Inputs:** `real_estate_hub.v_units` (precio, `roi_annual`, `estimated_rent_mxn`, `appreciation_annual`, descuento), `public.zone_scores`, benchmark STR ciudad. Todo vía helpers en `queries.ts` con `coerceNumericFields` (Supabase serializa NUMERIC como string).
- **Score 0-100 ponderado:** yield de renta (renta ML anual ÷ precio) ~35% · ROI proyectado ~30% · descuento real ~20% · score de zona ~15%. Pesos como constantes afinables en un solo lugar.
- **Elegibilidad:** solo inventario público (mismo gate `approved_at` del listado — no exponer no-aprobados), excluir unidades sin precio o sin renta estimada.
- **Diversidad:** máx 2 unidades por desarrollo; ≥3 ciudades si el inventario elegible lo permite.
- **Dato débil asumido:** `appreciation_annual` null (~42 unidades) cae al default 8% del sitio → por eso el rótulo "proyectado".

## 3. Generación — cron mensual con gate humano

- **Route handler** `src/app/api/cron/lead-magnet-edition/route.ts`, protegido con header **`x-cron-secret`** (patrón existente de `/api/cron/zoho-retry`; Hostinger cron NO manda Bearer).
- Flujo: computa ranking → renderiza PDF **es** y **en** → sube a **Supabase Storage bucket privado `lead-magnets`** → inserta fila en `real_estate_hub.lead_magnet_editions`.
- **Tabla nueva** (DDL additivo; ⚠️ requiere frase de autorización explícita de Luis antes de aplicar migración — `feedback_autorizacion_explicita_infra`):

```sql
create table real_estate_hub.lead_magnet_editions (
  id uuid primary key default gen_random_uuid(),
  edition text not null,              -- '2026-08'
  locale text not null check (locale in ('es','en')),
  storage_path text not null,         -- 'lead-magnets/2026-08-es.pdf'
  status text not null default 'pending' check (status in ('pending','active','archived')),
  units jsonb,                        -- snapshot del top 10 (auditoría)
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (edition, locale)
);
```

- **Aprobación (humano-en-loop):** la edición nace `pending`. Al aprobar → `active` y la anterior del mismo locale pasa a `archived`. Mientras no haya aprobación, **se sigue sirviendo la última `active`** — la entrega nunca se rompe por una edición mala.
  - v1 de la aprobación: **vista mínima en Propyte_hub** (lista de ediciones + preview del PDF + botón Aprobar). Interim hasta que exista: flip de `status` en Supabase Studio.
- **Programación:** cron Hostinger mensual (día 1, madrugada). El endpoint también acepta invocación manual (mismo secret) para regenerar a media quincena.
- **Regeneración = upsert** sobre `(edition, locale)`: reemplaza la fila y sobreescribe el archivo en Storage; si la edición estaba `active`, vuelve a `pending` (re-aprobación) y la `active` anterior por locale se restaura como vigente para la descarga.

## 4. Entrega — descarga directa tras el submit

- `/api/leads` con `source=lead_magnet`: tras crear el lead en Zoho (comportamiento actual intacto), genera una **URL firmada de Supabase Storage (~10 min de vida)** de la edición `active` en el locale del request y la devuelve en la respuesta (`downloadUrl`).
- **Gates:** la URL solo se emite en submit válido; si el honeypot detecta bot → sin URL. Nadie descarga sin dejar datos; el link no es compartible a largo plazo.
- **Fallback seguro:** si no hay edición `active` (o falla Storage), la respuesta va sin `downloadUrl` y el frontend muestra el success genérico actual — el submit nunca se rompe.
- El form del sidebar del blog (`BlogSidebarLeadForm.tsx`, mismo `source`) recibe el mismo beneficio; actualizar su success UI también.

## 5. Frontend

- `LeadMagnet.tsx`: pantalla de éxito pasa de "¡Revisa tu correo!" a **"Tu reporte está listo"** + botón de descarga con `downloadUrl`. Sin URL → success genérico (sin promesa de correo).
- i18n: nuevas keys en namespace `leadMagnet` (es/en, mantener paridad); retirar/reemplazar `checkEmail`/`checkEmailDesc` de la ruta de éxito con URL.
- Copy del CTA en Hub (`home_lead_magnet`) actualizable a "Edición \<Mes\>" cuando Luis quiera — sin cambio de código.
- WebMCP: el form ya expone `toolname="descargar_guia_inversion"`; conservar atributos tal cual (no duplicar toolnames — gotcha renderer).

## 6. Fuera de alcance v1 (fase 2 si funciona)

- Re-envío de la nueva edición a leads anteriores (requeriría email).
- Tracking de apertura/descarga por lead.
- Personalización por presupuesto/objetivo (idea D del brainstorm).

## 7. Verificación

- Gates estándar: `tsc --noEmit` + `next build` (vitest no typechea).
- Tests unitarios del score (elegibilidad, pesos, diversidad, coerción numérica).
- **Auditar el PDF por render** (pymupdf → PNG), no por HTTP 200/tamaño (`feedback_pdf_audit_render_not_curl`): footer no encima filas, 10 tarjetas presentes, es/en.
- Flujo E2E en standalone local: submit → lead → `downloadUrl` firmada → PDF descarga; submit con honeypot → sin URL; sin edición activa → success genérico.
- Verificar tamaño <1.5MB y que el bucket sea privado (URL directa sin firma → 400/404).

## 8. Rollout (sin ventana rota)

1. Migración tabla + bucket (con autorización explícita de Luis).
2. Deploy cron route + generar primera edición → Luis la revisa y aprueba.
3. Deploy frontend (con fallback: sin edición activa se comporta como hoy).
4. Programar el cron mensual en Hostinger.
