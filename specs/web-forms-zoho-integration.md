# Spec: Web Forms → Zoho CRM Integration

> Estado: **draft v1.5** | Fecha: 2026-05-12 | Proyecto: Next_Propyte_web

> **Changelog v1.5 (2026-05-12 — post 4th audit, scope/correctness):**
> - **N1.** `findLeadByEmail` es **wrapper de 5 líneas sobre `searchRecords()` existente** en `propyte-crm/src/lib/zoho/client.ts:297`. REQ-F-20 y Z5.4 reformulados (de "½ día" a "10 min").
> - **N2.** Bloque E reordenado: `Z5.0` wrapper `findLeadByEmail` ANTES de `Z5.1` handler que lo consume.
> - **N3.** Z3.1 usa `enforceRateLimit(request, LEAD_RATE_LIMIT)` (ya existe en `rateLimit.ts:83-100`) — no patrón verbose.
> - **IC1.** REQ-F-16 firma actualizada a `parseName(name, fallback?)` con ejemplo Newsletter `parseName(name, 'Suscriptor')`.
> - **IC2.** Curva retry UPDATE local especificada: `[200, 600, 1500] ms` (3 intentos). REQ-F-08 + §8.
> - **IC3.** Nueva tarea **Z7.2b** — forzar `PENDING_SYNC` + correr cron 2x + verificar 1 solo Lead en Zoho (regression test del bug v1.2).
> - **M1.** Apéndice F runbook: reset manual `UPDATE leads SET zoho_retry_count=0 WHERE id=...` cuando agota intentos.
> - **M2.** Nuevo **REQ-F-04b** — INSERT Supabase falla → 500 al cliente. NO push a Zoho sin row local (audit-first invariant).
> - **M3.** Helper `truncateError(msg, 1000)` para cap `zoho_sync_error`. Apéndice E + REQ-F-21.
> - **M4.** Z6.6 nota fixture (development real conocido + UUID arbitrario para no-match).
> - **M5.** Z0.6 nueva — Luis confirma valores exactos picklist `Idioma` en Zoho UI (mayúsculas/tildes).
> - Apéndice F: nota sobre `RATE_LIMIT_TRUSTED_PROXY_HOPS` (Hostinger+Nginx default 1; +CDN = 2).
>
> **Changelog v1.4 (2026-05-12 — security hardening pass):**
> - **PII redacción** en `zoho_sync_error` + stdout logs vía helper `sanitizeErrorMessage(err)` (regex strip email/teléfono/RFC/CURP antes de persistir). Cierra gap LFPDPPP — la columna de error puede recibir el body de Zoho con PII del lead si la API hace eco. (REQ-S-02)
> - **`claim_zoho_retry_batch` endurecida:** `p_limit` clamped a 1..500 dentro de la función; `SET search_path = pg_catalog, public` explícito (mitiga function-hijacking vía search_path en SECURITY DEFINER); `REVOKE EXECUTE ... FROM PUBLIC` antes del GRANT al service_role. (REQ-S-03)
> - **Cron secret timing-safe:** `verifyCronSecret(authHeader)` usa `crypto.timingSafeEqual` con buffers de longitud igualada. La comparación `===` queda prohibida en el route handler de cron. (REQ-S-04)
> - **Cron endpoint con rate limit propio** (10/min/IP, bucket `cron-zoho-retry`) — defense-in-depth por si `CRON_SECRET` se filtra. (REQ-S-05)
> - **Honeypot constant-time:** path silencioso espera `crypto.randomInt(180, 420)` ms antes del 200, igualando el perfil de latencia del path real. Anti-fingerprinting de bots sofisticados. (REQ-S-06)
> - **Honeypot `autocomplete="off"`** agregado al input hidden para evitar que password managers lo llenen y disparen falsos positivos. (apéndice D, REQ-F-14 ampliado)
> - **Quota global volumétrica:** 1000 leads/hora/proceso PM2 — además del rate limit por IP. Mitiga DoS distribuido desde botnet con muchas IPs. Helper `enforceGlobalQuota()`. (REQ-S-07)
> - **Zod estricto:** `propertyId` validado como UUID (`.uuid()` no `.string()`); `gclid` y `utm_*` con regex `^[A-Za-z0-9._~-]{0,200}$`. `email.max(254)` ya respeta RFC 5321 — mantener. (REQ-S-08)
> - **Sin payload eco** en respuestas de error del endpoint — los mensajes nunca incluyen campos del request. El código actual ya cumple; lo elevamos a requirement explícito. (REQ-S-09)
> - **Cron secret via archivo `-K`** con permisos 600 (apéndice C actualizado) — evita que el secret aparezca en `ps aux` y `~/.bash_history`. (REQ-S-04 nota operativa)
> - **Origin policy lenient mantenida** como decisión consciente (v1.3): rate limit + honeypot + auditoría Supabase cubren el caso de spam de creación de leads. Threat model explícito en §5.3. **No** se cambia el comportamiento.
> - Nueva sección §5.3 "Hardening de seguridad" con threat model breve y REQ-S-01..09.
> - Apéndice E ampliado: `sanitizeErrorMessage`, `verifyCronSecret`, `enforceGlobalQuota`.
> - Bloque H' (security hardening tasks) agregado a §10.
>
> **Changelog v1.3 (2026-05-12 — post 3rd audit):**
> - **Bug lógico v1.2 corregido:** retry diferenciado por tipo de error. PENDING_SYNC → search por email primero (evita duplicar si Zoho recibió el lead pero el server crasheó). ORPHAN → solo UPDATE local. Otros → POST normal.
> - Nuevo método cliente Zoho: `findLeadByEmail(email)` (REQ-F-20)
> - Diagrama §6.1 eliminado (redundante con REQs y se desincronizaba)
> - §7 contador columnas corregido: 14 nuevas (7 intake/UTM + 7 zoho)
> - §8 mitigación menciona explícitamente función `claim_zoho_retry_batch`
> - Crontab unificado a `5 * * * *` (no duplicar :00 vs :05)
> - Cron endpoint = **GET** `/api/cron/zoho-retry` (alineado con `curl` default, idempotente)
> - `parseName(raw, fallback)` con override (Newsletter pasa `'Suscriptor'`)
> - `parseFirstNameFromEmail`: strip dígitos finales (`juan42@` → `'Juan'`)
> - Tabla §6.3 Form 8: marcado como tentativo pendiente Q6 + Mobile (no Phone, es whatsapp)
> - `LEADS_ALLOWED_ORIGINS` agregada a tabla env vars + Z0.3
> - Umbral §7 con ventana: `≥98% success en leads ≥24h post-creación`
> - Nota apéndice E: `if (!origin) return true` es decisión consciente, OK porque rate-limit + honeypot lo cubren
> - Apéndice F doc: `zoho_retry_count = "attempts started"`, no "attempts that hit Zoho"
> - Z5.4 nueva: implementar `findLeadByEmail` + integrarlo en retry de PENDING_SYNC
>
> **Changelog v1.2 (2026-05-12 — post 2nd audit):**
> - Source de unit lookup: **`real_estate_hub.v_units`** (con `development_id`), no `Propyte_unidades` raw — por consistencia con regla del proyecto ("usar views públicas, no tablas raw")
> - FQN explícitos: `real_estate_hub."Propyte_zoho_id_map"` (con comillas dobles por CamelCase)
> - **Cast crítico**: `supabase_id` es `text`, no uuid → query requiere `::text`
> - **Race condition mitigada**: insertar con `zoho_sync_error = 'PENDING_SYNC'` antes del fetch Zoho. Cron también recoge huérfanos con `created_at < now() - interval '5 minutes'` aunque `zoho_sync_error IS NULL`
> - Allowlist origins parametrizada via env var `LEADS_ALLOWED_ORIGINS` (extensible a Nativa)
> - Zod schema ampliado: `gclid`, `utm_content`, `utm_term`, `website` (honeypot)
> - Helper `parseName(name)` con tests (split First/Last)
> - Helper `parseFirstNameFromEmail` con whitelist de buzones genéricos (info|contact|sales|hola|admin|mkt|ventas)
> - Función SQL `claim_zoho_retry_batch(int)` en migración (FOR UPDATE SKIP LOCKED desde RPC, supabase-js no lo soporta nativo)
> - `status` renombrado a `intake_status` (Zoho es source of truth de pipeline; el campo en `public.leads` es "estado al ingresar")
> - Cap Description ≤ 32KB en Zoho — truncar en `field-maps.ts`
> - Apéndice D: matriz de campos requeridos por form
> - Apéndice E: pseudo-código de helpers
> - Nueva Q6: `Tipo_de_Contacto` para Form 8 (afiliados) — ¿`Lead`, `Broker`, o valor nuevo "Afiliado"?
>
> **Changelog v1.1 (2026-05-12 — post 1st audit):**
> - Schema corregido: `public.leads` (no `real_estate_hub.leads`)
> - Migración expandida: incluye `status`, `utm_*` faltantes y `ALTER property_id DROP NOT NULL`
> - Env vars Zoho corregidas: 7 vars totales con nombres reales del cliente OAuth
> - Cron en Hostinger Linux (no Vercel)
> - Form 6, 8, 11 requieren refactor real del payload
> - Honeypot server-side es nuevo
> - Firma única `submitLead(source, data)`
> - `form_type` eliminado → usar columna `source` existente
> - Dedup eliminado del riesgo
> - Q1-Q4 cerradas
> - Mapping `categorySlug → Industry` whitelisted

## 1. Overview

Hoy `dev.propyte.com` (Next_Propyte_web) tiene **11 formularios** que capturan leads de tipos heterogéneos (compradores, brokers, desarrolladores, proveedores, candidatos, suscriptores). Estos forms están fragmentados en **dos pipelines distintos** — 8 envían a un webhook genérico vía `submitForm()` y 2 a `/api/leads` (Supabase directo) — y **ninguno alcanza Zoho CRM**, donde vive el equipo comercial (20,915 leads históricos).

Adicionalmente, la auditoría de mayo 2026 confirmó que **el endpoint actual `/api/leads` está roto en producción**: la tabla `public.leads` tiene 0 filas, no tiene las columnas `status` ni `utm_*` que el endpoint intenta escribir, y su columna `property_id` es NOT NULL (rompiendo cualquier form que no sea Property Inquiry). Este spec arregla incidentalmente esa rotura.

El rediseño del pipeline: **un único endpoint server-side `/api/leads`** que (a) audita en Supabase, (b) clasifica por valor de columna `source` existente, (c) mapea al esquema canónico Zoho (`Lead_Source: "Sitio web"` + `Nombre_de_Campa_a: "Propyte web - <slug>"` + `Tipo_de_Contacto` + ~30 campos custom), (d) hace push a Zoho con doble llamada cuando aplica (Form 6 Proveedores → Lead + Account), y (e) tiene fallback robusto para no perder leads si Zoho cae.

El owner de cada lead lo asigna Zoho vía **Assignment Rule nativa** (configurada manualmente por Luis con flag *Apply to records created via API*). El código no implementa rotación.

## 2. Goals

- **Unificar** los 11 forms en un solo endpoint `/api/leads` que reemplaza `submitForm.ts` + el endpoint actual.
- **Arreglar** el insert a `public.leads` (columnas faltantes + `property_id` nullable) para que efectivamente persistan los leads.
- **Empujar todos los leads a Zoho** con los 3 identificadores clave (`Lead_Source`, `Nombre_de_Campa_a`, `Nombre_del_formulario`) consistentes con la convención existente en Zoho.
- **No perder leads** si Zoho falla: persistencia previa en Supabase + cron de reintento a 24h.
- **Implementar el Form 8 (Únete)** que hoy es mock.
- **Resolver `Proyecto_de_Interes` automáticamente** para Form 2 (ficha propiedad) vía `Propyte_zoho_id_map`.
- **Honeypot server-side** + extensión client-side a los 8 forms que no lo tienen.
- **Auditoría completa**: la tabla `public.leads` queda como source of truth con `zoho_lead_id` / `zoho_account_id` / `zoho_sync_error`.
- **Diseño extensible** para que Nativa Tulum (`Nativa web -`) reuse el mismo cliente.

## 3. Non-Goals

- **No** modificar UI/UX visual de ningún formulario (paleta, layout, tipografía intactos).
- **No** rediseñar pipelines Zoho ↔ Supabase ya existentes en `propyte-crm`.
- **No** implementar rotación de owners en código (Zoho lo maneja).
- **No** sincronizar leads históricos hacia atrás — solo aplica a leads nuevos a partir del deploy.
- **No** tocar campos custom de Zoho ni picklists (Luis los administra desde Zoho UI).
- **No** migrar `public.leads` a `real_estate_hub.leads` en este spec (sería otro spec separado si Luis decide unificar schemas más tarde).

## 4. Context y constraints

### Estado real del sistema (post-audit 2026-05-12)

- **Tabla destino:** `public.leads` (verificado contra `information_schema`). NO existe `real_estate_hub.leads`. Adicionalmente existe `nativa_tulum.leads` para el otro proyecto.
- **Columnas actuales de `public.leads`:**
  ```
  id (uuid, NOT NULL)
  property_id (uuid, NOT NULL)  ← CRÍTICO: bloquea 9 de 11 forms
  source (text, NOT NULL)
  name, email, phone, message (text, nullable)
  locale (text, NOT NULL)
  created_at (timestamptz, NOT NULL)
  ```
- **Total filas:** 0. Confirma que ningún lead se ha persistido nunca por este pipeline.
- **8 forms** → `submitForm(data, formType)` → `process.env.NEXT_PUBLIC_WEBHOOK_URL`. Si la env var no está, hace `console.warn` y abandona ([src/lib/submitForm.ts:5-9](../src/lib/submitForm.ts#L5-L9)). **Estado actual en Hostinger desconocido** (ver Q5).
- **2 forms** (Proveedores, Glosario) → `/api/leads/route.ts` → intenta insertar columnas inexistentes (`status`, `utm_*`) y `property_id` siempre NULL para los que no son ficha → fallo silencioso 500.
- **1 form** (Únete) → mock con `setTimeout(1500ms)`. Sin backend.

### Inventario real de schemas Supabase usados (FQN explícito)

| Uso | Tabla / View | Notas |
|-----|-------------|-------|
| Target de persist | `public.leads` | service role bypass RLS. Migración additive. |
| Lookup unidad → desarrollo (Form 2) | `real_estate_hub.v_units` (view) | Columnas: `id` (uuid), `development_id` (uuid), `development_name`, `development_slug`. **NO usar `Propyte_unidades` raw** (regla del proyecto, igual que `v_developers`). |
| Lookup desarrollo → Zoho id | `real_estate_hub."Propyte_zoho_id_map"` | **CamelCase requiere comillas dobles**. Columnas: `entity_type` (text), `supabase_id` (text — **no uuid**, requiere `::text` cast), `zoho_module`, `zoho_record_id`. |

Query canónico para Form 2 lookup:
```sql
SELECT m.zoho_record_id
FROM real_estate_hub.v_units u
LEFT JOIN real_estate_hub."Propyte_zoho_id_map" m
  ON m.supabase_id = u.development_id::text
 AND m.entity_type = 'development'
WHERE u.id = $1
```

### Forms con RHF + Zod vs raw HTML

- **RHF + Zod (5):** `ContactPageContent.tsx`, `property/ContactForm.tsx`, `ProviderForm.tsx`, `GlossaryLeadGateModal.tsx`, `B2BForm.tsx`.
- **Raw HTML + FormData (6):** `DevelopersPageContent.tsx` registro, `BrokersPageContent.tsx`, `BuiltPageContent.tsx`, `UnetePageContent.tsx`, `NewsletterCTA.tsx`, `LeadMagnet.tsx`.
- **Honeypot client-side (3):** `B2BForm.tsx`, `BrokersPageContent.tsx`, `NewsletterCTA.tsx`. Los 8 restantes **no tienen honeypot** y hay que agregárselos.

### Infraestructura Zoho existente (reusar, no reescribir)

- `propyte-crm/src/lib/zoho/client.ts` — OAuth2 + refresh + rate limiter. Probado en producción con 20K records sincronizados.
- `propyte-crm/src/lib/zoho/types.ts` — interfaces ZohoLead, ZohoAccount, etc.
- App OAuth `SupabaseSync` (Client ID `1000.GDXMX394CUWVGMJ1LNY78JTSMUHJRT`, datacenter US, scopes `ZohoCRM.modules.ALL`).
- Refresh token permanente vive en env vars de Hostinger (propyte-crm). Hay que replicar las **6 vars Zoho + CRON_SECRET** (7 totales) en Hostinger de Next_Propyte_web.

### Env vars correctas (verificadas en `propyte-crm/src/lib/zoho/client.ts:61-66`)

| Variable | Default si ausente | Necesario |
|----------|-------------------|-----------|
| `ZOHO_CLIENT_ID` | — | sí |
| `ZOHO_CLIENT_SECRET` | — | sí |
| `ZOHO_REFRESH_TOKEN` | — | sí |
| `ZOHO_API_BASE_URL` | `https://www.zohoapis.com/crm/v2` | opcional |
| `ZOHO_ACCOUNTS_URL` | `https://accounts.zoho.com` | opcional |
| `ZOHO_DAILY_API_LIMIT` | `2000` | **subir a 10000** si el plan lo permite |
| `CRON_SECRET` | — | nuevo |
| `LEADS_ALLOWED_ORIGINS` | (vacío → 3 dominios Propyte hardcoded) | opcional. CSV extra para extender (`https://nativatulum.mx,https://www.nativatulum.mx`) |

### Convenciones Zoho ya establecidas

- `Lead_Source` = picklist con valores definidos. **Web siempre = `"Sitio web"`**. Cualquier otro valor es rechazado por Zoho.
- `Nombre_de_Campa_a` = texto libre. Para web introducimos prefijo nuevo `"Propyte web - <slug>"` para no chocar con Meta Ads. Reserva `"Nativa web -"` para futuro.
- `Nombre_del_formulario` = texto libre. Convención: `"Formulario Propyte web ES/EN - <Descripción>"`.
- `Tipo_de_Contacto` = picklist. Valores actuales: Lead, Broker, Empleo, Interno, Cliente, **Proveedor** (Luis agregó 2026-05-12).
- `Etapa_interna_de_contacto` = multi-picklist. Default web: `["Sin Contactar"]`.
- `Lead_Status` = picklist. Default web: `"Nuevo"`.
- `Idioma` = picklist con dirty data. Normalizamos a `"Español"` / `"Ingles"` desde `locale`.
- `Industry` (rótulo "Sector" en UI Zoho) en Accounts = picklist. Luis confirmó que ya quedaron las 13 categorías.
- `Fuente_de_Empresa` en Accounts = `"Sitio web"` para proveedores web.
- `Estado_de_Empresa` en Accounts = `"NUEVO"` para proveedores web.
- `Owner` = omitir del payload. Zoho Assignment Rule nativa rota (Luis configura con flag *Apply to records created via API*).

### Constraints técnicos

- Next.js 16 + standalone (Hostinger VPS + PM2 + Nginx).
- TypeScript estricto.
- Supabase MCP project ref: `oaijxdpevakashxshhvm` (production).
- No mockear DB en tests de integración.
- `cd <repo> && vercel --prod` inline en Bash (cwd no persiste) — solo para staging dev.propyte.com.
- UI/UX intacto: loading state "responde en <5min" se mantiene.
- **Cron de reintento corre en Hostinger Linux, NO en Vercel** (Vercel cron no se dispara en deploys de Vercel, solo prod corre en Hostinger).

### Stakeholders

- **Luis Flores** (Marketing Coordinator, owner del proyecto) — toma decisiones de mapeo + configura Zoho.
- **Equipo comercial Propyte** (Felipe Luksic, Alejandro Zamudio, Maricela Diaz, Filiberto Arias, Conrad Alvarado, etc.) — consumidores de los leads.
- **Equipo Zoho** (administrador de la app SupabaseSync) — propietario de las Assignment Rules.

## 5. Requirements

### 5.1 Funcionales

- [ ] **REQ-F-01.** Existe un único endpoint `POST /api/leads` que acepta payloads de los 11 forms identificándose vía columna `source` existente (`'contact'`, `'property_inquiry'`, `'broker_registration'`, etc.).
- [ ] **REQ-F-02.** El endpoint introduce honeypot server-side: si `website` viene con valor → responde `200 success: true` sin persistir nada (bots no sospechan).
- [ ] **REQ-F-03.** El endpoint mantiene rate limit 5 submissions/IP/minuto. Excedido → `429 Retry-After`.
- [ ] **REQ-F-04.** El endpoint persiste en `public.leads` **antes** de intentar Zoho, con `zoho_sync_error = 'PENDING_SYNC'` como marcador. Esto cierra la race condition donde un crash entre INSERT y fetch dejaría el lead invisible al cron.
- [ ] **REQ-F-04b.** **INSERT Supabase falla → 500 al cliente, sin intento Zoho.** Audit-first invariant: nunca se hace POST a Zoho sin row local previa. El cliente decide si reintenta. Mensaje de error genérico (`"Failed to save lead"`) sin eco de payload (REQ-S-09).
- [ ] **REQ-F-05.** El endpoint genera payload Zoho según el valor de `source` recibido (ver tabla §6.3) y hace POST a `/crm/v2/Leads`.
- [ ] **REQ-F-06.** Para `source === 'provider_form'`, el endpoint hace una **segunda llamada** a `/crm/v2/Accounts` después de la primera. Si falla la segunda, el Lead ya quedó capturado (no rollback). Log dentro de `zoho_sync_error` con prefijo `"ACCOUNT: ..."`.
- [ ] **REQ-F-07.** Para `source === 'property_inquiry'` (Form 2), el endpoint resuelve `Proyecto_de_Interes` con el query canónico documentado en §4 ("Inventario real"):
  - JOIN `real_estate_hub.v_units` con `real_estate_hub."Propyte_zoho_id_map"` usando `supabase_id = v_units.development_id::text AND entity_type = 'development'`.
  - Si match → `Proyecto_de_Interes: [{ id: zoho_record_id }]`.
  - Si no match → omitir field y agregar `\nPropiedad: ${propertyName} (sin mapeo Zoho)` a `Description`.
- [ ] **REQ-F-08.** Tras llamada Zoho exitosa, el endpoint hace UPDATE en `leads` con `zoho_lead_id`, `zoho_account_id` (si aplica), `zoho_synced_at = now()`, **`zoho_sync_error = NULL`** (limpiar el marker 'PENDING_SYNC'). Retry curva exponencial **`[200, 600, 1500] ms`** (3 intentos) para errores transient. Si los 3 fallan → log estructurado con `ORPHAN: zoho_id=<id>` en `zoho_sync_error` (sanitizado por REQ-S-02) — el cron retomará por la rama ORPHAN.
- [ ] **REQ-F-09.** Tras llamada Zoho fallida, el endpoint hace UPDATE en `leads` con `zoho_sync_error = <error message>` (sobrescribe 'PENDING_SYNC'). Devuelve al cliente `success: true` igualmente.
- [ ] **REQ-F-10.** Endpoint `GET /api/cron/zoho-retry` (protegido con header `Authorization: Bearer $CRON_SECRET`) llama función SQL `claim_zoho_retry_batch(50)` que hace `FOR UPDATE SKIP LOCKED` (supabase-js no expone FOR UPDATE → vía RPC). Filtro en SQL: `zoho_lead_id IS NULL AND (zoho_sync_error IS NOT NULL OR created_at < now() - interval '5 minutes') AND zoho_retry_count < 3 AND created_at > now() - interval '24 hours'`. **Disparado por crontab Linux en Hostinger** cada hora.

  **Retry diferenciado por `zoho_sync_error`:**
  - `'PENDING_SYNC'` → crash entre INSERT y fetch. Hacer `findLeadByEmail(email)` **primero** para evitar duplicar. Si match → solo UPDATE local con id encontrado. Si no → POST normal.
  - `LIKE 'ORPHAN: zoho_id=%'` → Zoho recibió pero UPDATE local falló. Extraer id del mensaje, solo UPDATE local.
  - Cualquier otro (`'Zoho 503...'`, `'Validation failed:...'`, etc.) → POST normal.
- [ ] **REQ-F-20.** Cliente Zoho expone método `findLeadByEmail(email: string): Promise<{ id: string } | null>` — **wrapper de 5 líneas sobre `searchRecords()` que ya existe** en `propyte-crm/src/lib/zoho/client.ts:297` (maneja 204 → null nativo). Body: `const r = await this.searchRecords('Leads', '(Email:equals:' + encodeURIComponent(email) + ')'); return r.data?.[0]?.id ? { id: r.data[0].id } : null;`. Usado por el cron retry para PENDING_SYNC.
- [ ] **REQ-F-11.** Form 8 (Únete) deja de ser mock — se conecta al nuevo `/api/leads` con `source: 'affiliate_request'`. Como usa raw HTML, se migra a RHF + Zod para consistencia con los 5 forms que ya lo usan.
- [ ] **REQ-F-12.** Los 8 forms que hoy usan `submitForm()` migran a `submitLead(source, data)`. Firma única en todo el codebase: `submitLead(source: string, data: Record<string, unknown>): Promise<{ ok: boolean; id?: string }>`. La función `submitForm()` se mantiene como shim de 1 semana.
- [ ] **REQ-F-13.** Form 6 (Proveedores) refactoriza el payload del cliente: `company`, `category`, `city`, `website` salen del `message` concatenado y van top-level. Categorías mapean a `Industry` picklist según whitelist en apéndice.
- [ ] **REQ-F-14.** Form 11 (Glosario) y los 8 forms sin honeypot ganan el campo oculto `website` (input hidden con `tabindex={-1}`, no visible).
- [ ] **REQ-F-15.** Newsletter (Form 9) sin nombre → `Last_Name: "Suscriptor"` SIEMPRE. `First_Name` parsed con `parseFirstNameFromEmail()` (apéndice E) que excluye buzones genéricos. Si parse falla, `First_Name` omitido.
- [ ] **REQ-F-16.** Helper `parseName(raw, fallback = 'Anónimo')` (apéndice E) splittea el campo único `name` del form en `First_Name` + `Last_Name` para Zoho. Edge cases: trim, single-word → solo Last_Name, multi-word → primer token First_Name + resto Last_Name. Newsletter llama con override: `parseName(name, 'Suscriptor')`.
- [ ] **REQ-F-17.** Allowlist de origins parametrizada via env var `LEADS_ALLOWED_ORIGINS` (CSV) — extensible para que `nativatulum.mx` y subdominios pasen el check sin tocar código.
- [ ] **REQ-F-18.** Description truncada a ≤ 32,000 caracteres antes de enviar a Zoho (cap del campo en API v2). Helper en `field-maps.ts`.
- [ ] **REQ-F-19.** `submitForm()` se elimina del codebase tras cumplir umbral de validación (§7).
- [ ] **REQ-F-21.** Helper `truncateError(msg, max = 1000)` (apéndice E) cap el contenido de `zoho_sync_error` a ≤ 1KB. Combinado con `sanitizeErrorMessage` (REQ-S-02), el orden es: `truncateError(sanitizeErrorMessage(err))` — sanitiza primero (para no truncar regex patterns a la mitad) y trunca después.

### 5.2 No funcionales

- **Performance:** latencia de submit ≤ 2s p95.
- **Disponibilidad de captura:** 99.9% (incluso con Zoho caído, Supabase persiste → captura no se pierde).
- **Seguridad:**
  - Rate limit existente se mantiene.
  - **Honeypot server-side se introduce** (es nuevo, no maintenance). Aplicado en endpoint + client en los 8 forms que no lo tienen.
  - `ZOHO_*` secrets en env vars Hostinger, jamás en el cliente.
  - `SUPABASE_SERVICE_ROLE_KEY` solo en route handlers (server-side).
  - Cron endpoint protegido con `Authorization: Bearer $CRON_SECRET` header.
- **Observabilidad:** logs estructurados con `console.log(JSON.stringify({ source, zoho_lead_id, error }))` para que `pm2 logs` en Hostinger sean grepables. **El campo `error` se pasa por `sanitizeErrorMessage()` antes de loggear** (PII redacción — ver REQ-S-02).
- **i18n:** los `Nombre_del_formulario` cambian con locale (`ES` / `EN`). El `Idioma` Zoho también.

### 5.3 Hardening de seguridad

#### Threat model breve

El endpoint `/api/leads` no acepta credenciales ni money operations — su impacto máximo bajo abuso es **creación de leads basura** en Zoho CRM (nuisance para el equipo comercial, posible consumo de quota Zoho 2K/10K diaria). El cron endpoint sí toca PII en `public.leads` y puede disparar llamadas Zoho — su compromiso es más grave.

| Actor | Capacidad | Mitigación primaria | Defensas en profundidad |
|-------|-----------|---------------------|-------------------------|
| Bot scraper genérico | Submit masivo del form web | Rate limit 5/min/IP + honeypot client | Quota global 1000/h/proceso (REQ-S-07) |
| Atacante distribuido (botnet) | Submits desde N IPs únicas | Quota global (REQ-S-07) | Honeypot constant-time (REQ-S-06) anti-fingerprinting |
| Atacante con conocimiento de `CRON_SECRET` filtrado | Disparar cron loop infinito | `claim_zoho_retry_batch` clampea filas a 500 (REQ-S-03) | Rate limit cron 10/min/IP (REQ-S-05); `crypto.timingSafeEqual` mientras el secret no se filtra |
| Atacante con acceso a logs PM2 | Lectura de PII en stdout | `sanitizeErrorMessage` redacta antes de loggear (REQ-S-02) | Service role key fuera de logs |
| Atacante con SQL injection en otra ruta | Hijack de SECURITY DEFINER vía search_path | `SET search_path` explícito en la función (REQ-S-03) | `REVOKE FROM PUBLIC` + GRANT solo a `service_role` |
| Cross-origin CSRF desde otra pestaña | Crear leads desde el browser de la víctima | Allowlist origins (decisión lenient — sin Origin pasa, justificado abajo) | Rate limit + honeypot + audit trail en `public.leads.created_at` |

> **Trade-off Origin policy lenient (decisión consciente, sin cambio en v1.4):** `isAllowedOrigin` retorna `true` si la request no tiene header `Origin`. Esto es CSRF-friendly por diseño porque (a) el endpoint no autoriza acciones ligadas a sesión del usuario, (b) el peor caso del abuso es spam de leads, ya mitigado por rate limit + honeypot, (c) bloquear requests sin Origin rompe tests de QA con curl/Postman. El campo `Origin` se sigue validando contra allowlist cuando está presente.

#### Requirements de seguridad

- [ ] **REQ-S-01.** Las 7 env vars Zoho + `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` viven **exclusivamente** en el environment del proceso PM2 server-side. Nunca se exponen al bundle del cliente (verificar que ninguna empieza con `NEXT_PUBLIC_`). El `.env.example` documenta los nombres pero no valores reales.
- [ ] **REQ-S-02.** **PII redacción.** Antes de persistir `zoho_sync_error` o pasarlo a `console.log`, ejecutarlo por `sanitizeErrorMessage(err)` (apéndice E) — redacta email, teléfono (E.164 y formatos MX), RFC, CURP. Aplica también al body que Zoho devuelve en errores (Zoho hace eco del payload en algunos 4xx).
- [ ] **REQ-S-03.** **Función `claim_zoho_retry_batch` endurecida.** Dentro de la función: `p_limit := least(greatest(p_limit, 1), 500)` antes del SELECT. La función declara `SET search_path = pg_catalog, public`. Permisos: `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC` antes del `GRANT EXECUTE ... TO service_role`.
- [ ] **REQ-S-04.** **Cron secret timing-safe.** El handler de `/api/cron/zoho-retry` usa `verifyCronSecret(authHeader)` (apéndice E) con `crypto.timingSafeEqual`. Buffers de longitud igualada (pad antes de comparar). Comparación `===` en este path queda prohibida (Z6.8 test).
- [ ] **REQ-S-05.** **Rate limit en cron endpoint.** Antes del `verifyCronSecret`, ejecutar `rateLimit(request, { bucket: 'cron-zoho-retry', limit: 10, windowMs: 60_000 })`. Si excede → 429. Esto limita el blast radius si el secret se filtra.
- [ ] **REQ-S-06.** **Honeypot constant-time.** Path silencioso (`website` populado) espera `crypto.randomInt(180, 420)` ms antes de retornar 200. Anti-timing-fingerprinting: el path real persiste en Supabase (≈200ms p50) + Zoho async, por lo que el jitter cubre el rango p10-p90 del path real.
- [ ] **REQ-S-07.** **Quota global volumétrica.** Helper `enforceGlobalQuota({ bucket: 'leads-global', limit: 1000, windowMs: 3_600_000 })` ejecuta antes del rate limit por IP. Si excede → 429 con `Retry-After: 3600`. Defense-in-depth contra DoS distribuido (botnet con muchas IPs).
- [ ] **REQ-S-08.** **Zod estricto.** `propertyId: z.string().uuid().optional().nullable().or(z.literal(''))`. `gclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`: `z.string().regex(/^[A-Za-z0-9._~-]{0,200}$/).optional()...`. Email mantiene `.max(254)` (RFC 5321).
- [ ] **REQ-S-09.** **Sin payload eco.** Las respuestas de error del endpoint nunca incluyen campos del request body. Mensajes genéricos: `"Invalid request"`, `"Validation failed"`, `"Too many requests"`, `"Failed to save lead"`. Tests Playwright verifican que un payload con email único no aparece en el body de la respuesta de error.

## 6. Approach / Arquitectura propuesta

> El diagrama de flujo de v1.1/v1.2 se eliminó en v1.3 — se desincronizaba con cada cambio en los REQs. La descripción canónica del flujo vive en los REQ-F-01 a REQ-F-20 (§5.1) + la migración SQL (§6.5).

### 6.2 Estructura de archivos

**Nuevos:**
- `src/lib/zoho/client.ts` — copia de `propyte-crm/src/lib/zoho/client.ts`. Commit header anota origen.
- `src/lib/zoho/types.ts` — copia.
- `src/lib/zoho/field-maps.ts` — **nuevo**, mapea `source` → payload Zoho + whitelist `categorySlug → Industry`.
- `src/lib/zoho/resolve-proyecto-interes.ts` — helper lookup unit → development → zoho_id.
- `src/lib/leads/submit-lead.ts` — helper compartido client-side (sustituye `submitForm.ts`).
- `src/app/api/cron/zoho-retry/route.ts` — endpoint cron de reintento (auth con `CRON_SECRET`).
- `supabase/migrations/<timestamp>_leads_zoho_columns.sql` — migración tabla leads (entregar SQL a Luis).
- `tests/api/leads-zoho.spec.ts` — Playwright e2e por form.

**Modificados:**
- `src/app/api/leads/route.ts` — refactor para aceptar `source` + insertar todos los campos + llamar Zoho + manejar Account.
- `src/lib/submitForm.ts` — convertir en shim que llama al nuevo `submit-lead.ts`.
- 8 componentes form sin honeypot — agregar `<input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />`.
- `ProviderForm.tsx` — refactor payload: `company`, `category`, `city`, `website` top-level.
- `UnetePageContent.tsx` — migrar a RHF + Zod, eliminar mock setTimeout, llamar `submitLead('affiliate_request', data)`.
- `GlossaryLeadGateModal.tsx` — usar `submitLead()` en vez de fetch directo.
- `crontab` en Hostinger (NO `vercel.json`) — agregar entry hourly.
- `.env.example` — documentar las 7 vars Zoho + cron.

**Eliminados (tras umbral §7 cumplido):**
- `src/lib/submitForm.ts` — `NEXT_PUBLIC_WEBHOOK_URL` deja de ser necesario.

### 6.3 Mapeo completo por form

#### Reglas globales aplicadas a TODOS

```typescript
{
  Module: "Leads",
  Lead_Source: "Sitio web",
  Lead_Status: "Nuevo",
  Etapa_interna_de_contacto: ["Sin Contactar"],
  Idioma: locale === 'es' ? 'Español' : 'Ingles',
  GCLID: utm.gclid ?? undefined,
  Ad_Campaign_Name: utm.utm_campaign ?? undefined,
  AdGroup_Name: utm.utm_content ?? undefined,
  // Owner: OMITIDO — Zoho Assignment Rule decide
}
```

#### Tabla mapeo (11 forms)

| # | source | Nombre_de_Campa_a | Nombre_del_formulario (ES/EN) | Tipo_de_Contacto | Extras específicos |
|---|--------|-------------------|-------------------------------|------------------|--------------------|
| 1 | `contact` | `Propyte web - contacto` | `Formulario Propyte web {ES/EN} - Contacto general` | `Lead` | `Description: "Asunto: ${subject}\n${message}"` |
| 2 | `property_inquiry` | `Propyte web - propiedades/ficha` | `Formulario Propyte web {ES/EN} - Ficha de propiedad` | `Lead` | `Proyecto_de_Interes: [{id}]` (lookup) + `Description: "Tipo inversión: ${investmentType}\nPropiedad: ${propertyName}"` |
| 3 | `b2b_request` | `Propyte web - desarrolladores/hero` | `Formulario Propyte web {ES/EN} - Desarrolladores B2B (hero)` | `Lead` | `Company`, `Phone`, `City: location` |
| 4 | `developer_request` | `Propyte web - desarrolladores/registro` | `Formulario Propyte web {ES/EN} - Desarrolladores B2B (registro)` | `Lead` | + `Description: "Tipo proyecto: ${projectType}\nUnidades: ${unitCount}\n${message}"` |
| 5 | `broker_registration` | `Propyte web - corredores/registro` | `Formulario Propyte web {ES/EN} - Registro de Broker` | `Broker` | `Broker: true`, `Inmobiliaria: company`, `Description: "Tipo: ${brokerType}\nExperiencia: ${experience}\nZona: ${focusArea}\n${message}"` |
| 6 | `provider_form` | `Propyte web - proveedores` | `Formulario Propyte web {ES/EN} - Registro de Proveedor` | `Proveedor` | **Doble llamada** Lead+Account (ver §6.4). Payload top-level: `company, category, city, website` |
| 7 | `built_consultation` | `Propyte web - built/contacto` | `Formulario Propyte web {ES/EN} - Built construcción` | `Lead` | `Company`, `Phone`, `Presupuesto: budget` (text libre), `Description: "Tipo proyecto: ${projectType}\n${message}"` |
| 8 | `affiliate_request` | `Propyte web - unete/aplicar` | `Formulario Propyte web {ES/EN} - Únete (afiliados)` | `Lead` *(tentativo — Q6 abierta)* | `Mobile: whatsapp` (no Phone, es WhatsApp por definición), `Description: "Experiencia: ${experience}\nInterés: ${interest}"` |
| 9 | `newsletter` | `Propyte web - blog/newsletter` | `Formulario Propyte web {ES/EN} - Newsletter Blog` | `Lead` | `Last_Name: "Suscriptor"` SIEMPRE + `First_Name` parsed desde email si posible |
| 10 | `lead_magnet` | `Propyte web - home/lead-magnet` | `Formulario Propyte web {ES/EN} - Lead Magnet Home` | `Lead` | `Description: "Descargó reporte gratuito"` |
| 11 | `glossary_pdf` | `Propyte web - glosario/pdf-gate` | `Formulario Propyte web {ES/EN} - Glosario PDF` | `Lead` | `Description: "Descargó glosario inmobiliario"` |

#### Ejemplo payload Form 5 (Broker, ES)

```json
{
  "Last_Name": "Pérez",
  "First_Name": "Juan",
  "Email": "juan@inmobiliaria-x.mx",
  "Phone": "+52 55 1234 5678",
  "Inmobiliaria": "Inmobiliaria X",
  "City": "Playa del Carmen",
  "Country": "Mexico",
  "Lead_Source": "Sitio web",
  "Lead_Status": "Nuevo",
  "Etapa_interna_de_contacto": ["Sin Contactar"],
  "Idioma": "Español",
  "Nombre_de_Campa_a": "Propyte web - corredores/registro",
  "Nombre_del_formulario": "Formulario Propyte web ES - Registro de Broker",
  "Tipo_de_Contacto": "Broker",
  "Broker": true,
  "Description": "Tipo: smallAgency\nExperiencia: 3-5\nZona enfoque: rivieraMaya\nMensaje: Quiero comercializar Nativa Tulum"
}
```

### 6.4 Form 6 — Doble llamada (Proveedores)

**Paso 1: POST `/crm/v2/Leads`**
```json
{
  "Last_Name": "García",
  "First_Name": "Ana",
  "Email": "ana@notaria-xyz.mx",
  "Phone": "+52 998 123 4567",
  "Company": "Notaría XYZ",
  "City": "Cancún",
  "Country": "Mexico",
  "Lead_Source": "Sitio web",
  "Lead_Status": "Nuevo",
  "Etapa_interna_de_contacto": ["Sin Contactar"],
  "Idioma": "Español",
  "Nombre_de_Campa_a": "Propyte web - proveedores",
  "Nombre_del_formulario": "Formulario Propyte web ES - Registro de Proveedor",
  "Tipo_de_Contacto": "Proveedor",
  "Description": "Categoría: Notaría / Legal\nSitio web: https://notaria-xyz.mx\nMensaje: Ofrecemos cierres de compraventa."
}
```

**Paso 2: POST `/crm/v2/Accounts`** (solo si Paso 1 exitoso)
```json
{
  "Account_Name": "Notaría XYZ",
  "Phone": "+52 998 123 4567",
  "Website": "https://notaria-xyz.mx",
  "Industry": "Notaría / Legal",
  "Billing_City": "Cancún",
  "Billing_Country": "Mexico",
  "Fuente_de_Empresa": "Sitio web",
  "Estado_de_Empresa": "NUEVO",
  "Description": "Proveedor registrado vía formulario web. Mensaje: Ofrecemos cierres de compraventa."
}
```

Si Paso 2 falla, el Lead ya está creado. Logueamos `zoho_sync_error = "ACCOUNT: <error>"` y continuamos. El cron de reintento incluye lógica para retomar el Account si falta.

### 6.5 Migración tabla `public.leads`

```sql
-- 1. Hacer property_id nullable (CRÍTICO — sin esto 9 de 11 forms fallan)
ALTER TABLE public.leads
  ALTER COLUMN property_id DROP NOT NULL;

-- 2. Agregar columnas de UTM/intake faltantes
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS intake_status text DEFAULT 'nuevo',  -- estado al ingresar; Zoho es source of truth del pipeline real
  ADD COLUMN IF NOT EXISTS utm_source    text,
  ADD COLUMN IF NOT EXISTS utm_medium    text,
  ADD COLUMN IF NOT EXISTS utm_campaign  text,
  ADD COLUMN IF NOT EXISTS utm_content   text,
  ADD COLUMN IF NOT EXISTS utm_term      text,
  ADD COLUMN IF NOT EXISTS gclid         text;

-- 3. Agregar columnas para integración Zoho
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS zoho_lead_id       text,
  ADD COLUMN IF NOT EXISTS zoho_account_id    text,
  ADD COLUMN IF NOT EXISTS zoho_sync_error    text,
  ADD COLUMN IF NOT EXISTS zoho_synced_at     timestamptz,
  ADD COLUMN IF NOT EXISTS zoho_retry_count   smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nombre_campana     text,
  ADD COLUMN IF NOT EXISTS nombre_formulario  text;

-- 4. Index parcial para reintento eficiente (incluye huérfanos viejos sin sync_error)
CREATE INDEX IF NOT EXISTS idx_leads_zoho_retry
  ON public.leads (created_at)
  WHERE zoho_lead_id IS NULL
    AND zoho_retry_count < 3;

-- 5. Función RPC para claim atómico del batch de reintento (FOR UPDATE SKIP LOCKED)
-- supabase-js no expone FOR UPDATE → necesitamos function callable vía .rpc()
-- HARDENING (v1.4):
--   * p_limit clamped 1..500 dentro del cuerpo (mitiga DoS por lock masivo si un actor con role
--     service_role llama con limit gigante)
--   * SET search_path explícito → mitiga function-hijacking vía search_path en SECURITY DEFINER
--     (atacante con CREATE en otro schema no puede plantar pg_catalog.now() falso)
--   * REVOKE FROM PUBLIC antes del GRANT → defensa contra exposición accidental
CREATE OR REPLACE FUNCTION public.claim_zoho_retry_batch(p_limit int DEFAULT 50)
RETURNS SETOF public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_limit int;
BEGIN
  -- Clamp 1..500 (REQ-S-03). NULL → default 50.
  v_limit := least(greatest(coalesce(p_limit, 50), 1), 500);

  RETURN QUERY
  UPDATE public.leads l
  SET zoho_retry_count = l.zoho_retry_count + 1
  WHERE l.id IN (
    SELECT id FROM public.leads
    WHERE zoho_lead_id IS NULL
      AND (zoho_sync_error IS NOT NULL OR created_at < now() - interval '5 minutes')
      AND zoho_retry_count < 3
      AND created_at > now() - interval '24 hours'
    ORDER BY created_at
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING l.*;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_zoho_retry_batch(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_zoho_retry_batch(int) TO service_role;

-- 6. Comentario PII en zoho_sync_error (REQ-S-02 — la columna no debe contener PII; el código
--    debe pasar todo error por sanitizeErrorMessage antes de persistirlo aquí)
COMMENT ON COLUMN public.leads.zoho_sync_error IS
  'Error message from Zoho sync attempt. MUST be passed through sanitizeErrorMessage() before insert — strips email/phone/RFC/CURP (REQ-S-02 in spec web-forms-zoho-integration.md). Do NOT store raw Zoho response bodies; they echo PII.';
```

> ⚠️ Migración se entrega a Luis para aplicar en Supabase SQL Editor (regla del proyecto: DDL en prod requiere autorización explícita).

### 6.6 Alternativas descartadas

- **Workflow Zoho para auto-create Account.** Descartado: menos control de errores. Luis confirmó "el que tenga más control" → doble llamada desde Next.js.
- **Owner rotation en código.** Descartado: Luis confirmó "que lo haga Zoho".
- **Migrar tabla a `real_estate_hub.leads`.** Fuera de scope: otro spec si Luis decide unificar.
- **`form_type` como columna nueva.** Descartado tras audit: `source` ya existe NOT NULL → usar esa columna en vez de duplicar nombres.
- **Dedup `?duplicate_check_fields=Email`.** Descartado: perdería el first-touchpoint si un usuario llena 2 forms distintos. Cada submission es evento independiente; mergeo manual desde Zoho UI.
- **Vercel cron.** Descartado: no se dispara en prod (Hostinger). Usar crontab Linux.

## 7. Acceptance Criteria

### Funcionales
- [ ] Los 11 forms envían al nuevo endpoint `/api/leads` y reciben `200 success: true` en happy path.
- [ ] Para cada uno de los 11 forms, se crea un Lead en Zoho con los 3 identificadores correctos.
- [ ] Form 5 marca `Broker: true` y `Tipo_de_Contacto: "Broker"`.
- [ ] Form 6 crea Lead **y** Account, ambos vinculados por `Account_Name`.
- [ ] Form 6 envía `company`, `category`, `city`, `website` top-level (no embebidos en `message`).
- [ ] Form 2 con propiedad mapeada → Lead con `Proyecto_de_Interes` poblado. Sin mapeo → nota en Description.
- [ ] Form 8 (Únete) usa RHF + Zod, deja de ser mock; lead llega a Zoho.
- [ ] Form 9 (Newsletter) sin nombre → `Last_Name: "Suscriptor"` y `First_Name` parsed si email permite.
- [ ] Si Zoho responde 4xx/5xx, el lead queda en Supabase con `zoho_sync_error` y el usuario ve success.
- [ ] Cron `/api/cron/zoho-retry` (vía crontab Hostinger) reintenta y limpia `zoho_sync_error` cuando logra sync.
- [ ] Rate limit funciona: 6º submit en <1 min responde 429.
- [ ] Honeypot funciona: payload con `website` populado responde 200 silencioso, 0 rows persistidos.
- [ ] Los 8 forms sin honeypot ahora lo tienen (campo hidden `website`).
- [ ] Owner asignado por Assignment Rule en Zoho (verificación manual con Luis).
- [ ] Tests Playwright pasan en CI.
- [ ] Typecheck pasa (`npm run typecheck`).

### Seguridad (REQ-S-01..09)
- [ ] `sanitizeErrorMessage` aplicado en TODOS los `update({ zoho_sync_error })` y `console.error` del code-path leads/cron. Test unit prueba redacción de email/phone/RFC/CURP.
- [ ] `claim_zoho_retry_batch` aplicada con clamp 1..500, `search_path` explícito y `REVOKE...GRANT`. Verificación: `SELECT prosecdef, proconfig FROM pg_proc WHERE proname = 'claim_zoho_retry_batch'` muestra `search_path=pg_catalog,public`.
- [ ] `verifyCronSecret` usado en `/api/cron/zoho-retry`. ESLint regex (o grep CI) confirma 0 ocurrencias de `=== process.env.CRON_SECRET` en `src/`.
- [ ] Cron endpoint con rate limit propio (`cron-zoho-retry` bucket). Test envía 11 requests con secret válido → 11ª devuelve 429.
- [ ] Honeypot path mide latencia ≥150ms en 100% de tests (timing constant).
- [ ] Honeypot HTML tiene `autocomplete="off"` además de `tabindex={-1}` y `sr-only`.
- [ ] Quota global 1000/h aplicada antes del rate limit por IP. Test simula 1001 requests desde IPs distintas → 1001ª devuelve 503.
- [ ] Zod `propertyId: z.string().uuid()` rechaza strings no-UUID con 400.
- [ ] Tests verifican que NINGÚN field del request body aparece en respuestas de error (REQ-S-09).
- [ ] Crontab Hostinger usa `curl -K /home/propyte/.zoho-retry.curlrc`; archivo es `-rw-------`.

### Tabla base
- [ ] `public.leads.property_id` es NULLABLE.
- [ ] `public.leads` tiene las **14 columnas nuevas** (7 intake/UTM: `intake_status`, `utm_source/medium/campaign/content/term`, `gclid` + 7 zoho/auditoría: `zoho_lead_id/account_id/sync_error/synced_at/retry_count`, `nombre_campana/formulario`).
- [ ] Index parcial `idx_leads_zoho_retry` existe.
- [ ] Función `public.claim_zoho_retry_batch(int)` ejecutable por `service_role`.

### Umbral de cleanup (Z7.7)
- [ ] **Cleanup** `submitForm.ts` solo cuando se cumpla TODO:
  - ≥100 leads procesados desde deploy
  - tasa `zoho_lead_id IS NOT NULL` **≥ 98% medido sobre leads con `created_at ≥ 24h` (post-creación, para dar tiempo al cron de reintento)**
  - ≥1 lead exitoso por cada uno de los 11 forms

## 8. Riesgos y mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|
| Zoho rechaza payload por picklist value inválido | M | M | Whitelist hardcoded en `field-maps.ts` con valores válidos. Tests verifican mapping `categorySlug → Industry`. Error en runtime → `zoho_sync_error` + reintento. |
| Refresh token Zoho expira o se revoca | L | H | Cliente OAuth ya tiene auto-refresh probado. Si falla → alerta + leads en Supabase para reintento manual. |
| Assignment Rule no se activa para records vía API | M | M | Luis marca flag "Apply to records created via API". Si no se ejecuta → leads asignados al user del OAuth, visibles en "Mis leads sin asignar". |
| Doble llamada Form 6: Lead OK, Account falla | M | L | Aceptable: Lead en Zoho con `Tipo_de_Contacto: Proveedor` + `Description` rica → comercial crea Account manualmente. Cron reintenta. |
| Property `propertyId` no tiene mapping en `Propyte_zoho_id_map` | H | L | Fallback: omitir field + agregar nota en Description. |
| Cron concurrente crea duplicados | L | M | Vía función SQL `claim_zoho_retry_batch` (apéndice §6.5) que hace `UPDATE ... FOR UPDATE SKIP LOCKED RETURNING *` atómico. Cada worker recibe filas disjuntas. Max 3 intentos por lead (columna `zoho_retry_count`). |
| Cron re-POST duplica Lead en Zoho si el server crasheó después de un fetch exitoso | M | M | Estado `'PENDING_SYNC'` distingue ese caso. Retry usa `findLeadByEmail(email)` ANTES de POST (REQ-F-10/F-20). Si match en Zoho → solo UPDATE local; si no → POST normal. |
| Rate limit Zoho API (2000 default, subir a 10K) saturado | L | M | Volumen estimado: 660 calls/día (11 forms × 50 × 1.2). Margen 15x sobre 10K, 3x sobre 2000. Cron monitorea `getCallsToday()` y alerta si >80%. |
| Migración aplicada antes que deploy → endpoint viejo intenta insertar columnas nuevas | L | L | Migración es additive con `IF NOT EXISTS`. El endpoint viejo seguía roto antes, sigue roto después — pero ya no peor. |
| **UPDATE post-Zoho falla → huérfano en Zoho sin mapping local** | M | M | **Retry exponencial 3 intentos del UPDATE local**. Si fallan los 3 → log estructurado + agregar a `zoho_sync_error = "ORPHAN: zoho_id={id}"` (zoho_lead_id queda NULL pero el id real está en el log). Cron también puede recoger huérfanos buscando en Zoho por email. |
| Logs de Hostinger no soportan structured logging | L | L | `console.log(JSON.stringify(...))` es grepable con `pm2 logs`. Si necesario, agregar Better Stack más tarde. |
| Migración de Form 8 a RHF rompe el form en producción | M | M | Implementar en branch + smoke test en staging Vercel antes de merge. Tests Playwright atrapan regresiones. |
| `NEXT_PUBLIC_WEBHOOK_URL` apuntaba a sistema activo que no conocíamos → al borrarlo perdemos integración legítima | L | H | Pre-rollout verificar con Luis (Q5) si llegan leads a algún sistema hoy. Mantener `submitForm.ts` como shim 1 semana antes de borrar. |
| **PII en `zoho_sync_error` o `pm2 logs`** (LFPDPPP/GDPR) | M | M | `sanitizeErrorMessage()` (REQ-S-02) redacta email/teléfono/RFC/CURP antes de persistir o loggear. Tests unitarios validan los 4 patrones. `COMMENT ON COLUMN` recuerda al implementador. |
| **`CRON_SECRET` filtrado (env vars, git, screenshare)** | L | H | (1) Rate limit cron 10/min/IP (REQ-S-05) — atacante no puede hacer spam ilimitado. (2) `claim_zoho_retry_batch` clampea a 500 filas (REQ-S-03). (3) Rotación documentada en Apéndice F. (4) Timing-safe compare (REQ-S-04) impide bruteforce por timing. |
| **Function-hijacking en `claim_zoho_retry_batch`** (SECURITY DEFINER + search_path) | L | H | `SET search_path = pg_catalog, public` explícito en la función (REQ-S-03). `REVOKE FROM PUBLIC` antes del `GRANT TO service_role`. Atacante con CREATE en schema arbitrario no puede plantar `now()`/`coalesce()` maliciosos. |
| **DoS distribuido (botnet con muchas IPs)** | L | M | Rate limit per-IP no escala; quota global 1000/h/proceso (REQ-S-07) actúa como segundo límite. 503 a partir de ahí; respeta el flujo natural ~660 leads/día estimado (margen 36x). |
| **Honeypot fingerprinting por timing** | L | L | Path silencioso espera `randomInt(180, 421)` ms (REQ-S-06) cubriendo p10-p90 del path real. Bots simples no analizan timing; bots avanzados pierden la pista. |
| **Bot llena el campo `website` porque password manager lo autocompletó** | L | L | Atributo `autocomplete="off"` + `tabindex="-1"` + clase `sr-only` + `aria-hidden="true"`. Falsos positivos esperados: < 0.1% (REQ-F-14 ampliado). |
| **Atacante envía `propertyId` malformado para causar error PostgreSQL filtrable** | L | L | Zod `.uuid()` (REQ-S-08) rechaza antes de tocar la DB. Test unit confirma rechazo de strings no-UUID. |

## 9. Open Questions

> **Resueltas pre-spec por Luis (registradas como contexto):**
>
> - ✅ Lead_Source siempre "Sitio web"
> - ✅ Routing en Zoho vive en Nombre_de_Campa_a + Nombre_del_formulario
> - ✅ Proveedores → Lead + Account (doble llamada desde Next.js)
> - ✅ Owner = Zoho Assignment Rule
> - ✅ Prefijo "Propyte web -"
> - ✅ Lead_Status siempre "Nuevo" / Etapa_interna siempre ["Sin Contactar"]
> - ✅ `Industry`, `Fuente_de_Empresa = "Sitio web"`, `Estado_de_Empresa = "NUEVO"`
> - ✅ `Presupuesto` = text libre

> **Resueltas en v1.1 (post-audit):**
>
> - ✅ **Q1 (ventana cleanup):** flexible — umbral §7 manda (no calendario fijo)
> - ✅ **Q2 (cron host):** Hostinger crontab Linux, NO Vercel
> - ✅ **Q3 (alertas):** email vía SMTP existente a `marketing@nativatulum.mx` si `zoho_sync_error > 10` en 1h
> - ✅ **Q4 (Newsletter sin nombre):** `Last_Name: "Suscriptor"` SIEMPRE, `First_Name` parsed desde email local-part si formato `nombre.apellido@`

> **Nuevas abiertas — pre-rollout:**
>
> - **Q5.** ¿Está activo `NEXT_PUBLIC_WEBHOOK_URL` en Hostinger? ¿Llegaron leads a Zoho desde la web (no Meta Ads / WhatsApp / Llamada) en las últimas 2 semanas? Si sí — investigar canal alternativo antes de borrar `submitForm.ts`. Si no — confirma que `public.leads` con 0 filas refleja el estado real del pipeline.
> - **Q6.** Form 8 (Únete = afiliados / asesores externos que comercializan, no candidatos a empleo). `Tipo_de_Contacto` correcto: ¿`Lead` (genérico), `Broker` (más cercano semánticamente), o agregar valor nuevo `"Afiliado"` al picklist? Memoria muestra que `Empleo` ya existe para candidatos a trabajar en Propyte (≠ Únete).

## 10. Plan de tareas (preliminar)

### Bloque 0 — Setup (pre-código)

- [ ] **Z0.1** Luis: crear Assignment Rule en Zoho con flag *Apply to records created via API* + definir comerciales activos (Felipe + Alejandro + Maricela, expandir según necesidad).
- [ ] **Z0.2** Luis: confirmar picklist `Industry` (Sector) con los 13 valores agregados.
- [ ] **Z0.3** Replicar 6 env vars Zoho (`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_API_BASE_URL`, `ZOHO_ACCOUNTS_URL`, `ZOHO_DAILY_API_LIMIT=10000`) de Hostinger propyte-crm a Hostinger Next_Propyte_web. Generar `CRON_SECRET` nuevo. Setear `LEADS_ALLOWED_ORIGINS=""` (vacío para Propyte solo; agregar Nativa cuando aplique). **Verificar con admin Zoho que el plan permite 10K calls/día**. Total: 8 vars (6 Zoho + CRON_SECRET + LEADS_ALLOWED_ORIGINS).
- [ ] **Z0.4** Luis: responder Q5 (estado actual del webhook + leads recientes en Zoho desde web).
- [ ] **Z0.5** Crear branch `feat/zoho-forms-integration` desde `develop`.
- [ ] **Z0.6** Luis: confirmar en Zoho UI los valores exactos del picklist `Idioma` (mayúsculas/tildes). El spec asume `"Español"` y `"Ingles"` (sin tilde). Si difiere, ajustar en `field-maps.ts` antes de Z3.1 — Zoho rechaza valores que no estén en el picklist.

### Bloque A — Cliente Zoho + tipos (1 día)

- [ ] **Z1.1** Copiar `propyte-crm/src/lib/zoho/client.ts` → `Next_Propyte_web/src/lib/zoho/client.ts` (commit header anota origen).
- [ ] **Z1.2** Copiar `types.ts`.
- [ ] **Z1.3** Crear `src/lib/zoho/field-maps.ts`:
  - Función `sourceToZohoPayload(source, data, locale, utms)`.
  - Whitelist mapping `categorySlug → IndustryPicklistValue` (10 entradas, ver apéndice).
  - Función `parseFirstNameFromEmail(email)` para Newsletter.
- [ ] **Z1.4** Crear `src/lib/zoho/resolve-proyecto-interes.ts`.
- [ ] **Z1.5** Test unit: cada uno de los 11 source values genera payload correcto + mapping Industry válido para los 10 slugs.

### Bloque B — Migración Supabase (Luis ejecuta)

- [ ] **Z2.1** Generar SQL en `supabase/migrations/20260512_leads_zoho_columns.sql` con los 5 pasos del §6.5 (ALTER property_id + 7 cols intake/UTM + 7 cols Zoho + index + función `claim_zoho_retry_batch`).
- [ ] **Z2.2** Entregar SQL a Luis para aplicar en Supabase SQL Editor.
- [ ] **Z2.3** Verificar (via MCP `execute_sql`) que (a) columnas existen, (b) `property_id` es nullable, (c) index funcional, (d) `SELECT claim_zoho_retry_batch(0)` ejecuta sin error.

### Bloque C — Refactor endpoint `/api/leads` (1-2 días)

- [ ] **Z3.1** Refactor `src/app/api/leads/route.ts`:
  - **Rate limit:** usar `enforceRateLimit(request, LEAD_RATE_LIMIT)` (helper one-call existente en [rateLimit.ts:83-100](../src/lib/rateLimit.ts#L83-L100)). Devuelve `NextResponse | null` — no patrón verbose.
  - Allowlist origins via env (`LEADS_ALLOWED_ORIGINS`) — helper apéndice E.
  - Ampliar LeadSchema con `gclid`, `utm_content`, `utm_term`, `website` (honeypot) + `propertyId.uuid()` (REQ-S-08).
  - Honeypot check server-side (`website` populado → 200 silencioso constant-time REQ-S-06, 0 persistencia).
  - Insertar primero en `public.leads` con TODOS los campos + `zoho_sync_error = 'PENDING_SYNC'` (marker antirace). **Si INSERT falla → 500 + abort, NO Zoho call (REQ-F-04b).**
  - Aplicar `parseName(name)` para split First_Name / Last_Name. Newsletter usa fallback `'Suscriptor'`.
  - Generar payload Zoho vía `field-maps.ts` (incluye `truncateDescription` para Description ≤32KB).
  - Llamar Zoho (con resolución de Proyecto_de_Interes si form 2 — JOIN canónico §4).
  - Llamar Zoho Account (si form 6).
  - Update Supabase: success → `zoho_lead_id`, `zoho_account_id`, `zoho_synced_at`, **`zoho_sync_error = NULL`**. Error → sobrescribir `zoho_sync_error` con `truncateError(sanitizeErrorMessage(err))`. **Retry curva `[200, 600, 1500] ms`**.
  - Return 200 success siempre que Supabase haya persistido.
- [ ] **Z3.2** Crear `src/lib/leads/submit-lead.ts` con firma `submitLead(source: string, data: Record<string, unknown>): Promise<{ ok: boolean; id?: string }>`.
- [ ] **Z3.3** Convertir `src/lib/submitForm.ts` en shim que llama a `submit-lead.ts` traduciendo la firma vieja `(data, formType)` → `(source, data)`.

### Bloque D — Refactor forms client-side (1.5 días)

- [ ] **Z4.1** Form 6 (Proveedores) — refactor payload: top-level `company`, `category`, `city`, `website`. Mapear category slug → IndustryValue en cliente o en server (preferir server para single source of truth).
- [ ] **Z4.2** Form 11 (Glosario) — migrar de `fetch('/api/leads')` directo a `submitLead('glossary_pdf', data)`.
- [ ] **Z4.3** Form 8 (Únete) — migrar de raw HTML a RHF + Zod (esquema similar a Form 5). Eliminar mock setTimeout, llamar `submitLead('affiliate_request', data)`.
- [ ] **Z4.4** Los 8 forms sin honeypot — agregar `<input type="text" name="website" tabIndex={-1} className="sr-only" aria-hidden="true" />` (visualmente oculto pero capturable por bots).
- [ ] **Z4.5** Verificar que los 5 forms con RHF + Zod ya validan correctamente con el nuevo helper.

### Bloque E — Cron de reintento Hostinger (medio día)

> **Orden corregido v1.5:** el wrapper `findLeadByEmail` (Z5.0) debe existir antes del handler (Z5.1) que lo consume.

- [ ] **Z5.0** Agregar wrapper `findLeadByEmail(email)` en `src/lib/zoho/client.ts` (5 líneas — usa `searchRecords()` que ya existe en la copia desde propyte-crm). Body: `const r = await this.searchRecords('Leads', '(Email:equals:' + encodeURIComponent(email) + ')'); return r.data?.[0]?.id ? { id: r.data[0].id } : null;`. Test unit: email existente → `{ id }`; no existente → `null`; email malformado lanza error.
- [ ] **Z5.1** Crear `src/app/api/cron/zoho-retry/route.ts` (export **`GET`**, auth `Authorization: Bearer $CRON_SECRET` vía `verifyCronSecret` REQ-S-04). Internamente: rate limit (REQ-S-05) → `claim_zoho_retry_batch(50)` → para cada lead, aplica retry diferenciado según `zoho_sync_error` (PENDING_SYNC usa `findLeadByEmail` antes de POST / ORPHAN extrae id del mensaje y solo UPDATE local / otros → POST normal).
- [ ] **Z5.2** Configurar crontab en Hostinger VPS (entry unificada con apéndice C — usa `curl -K /home/propyte/.zoho-retry.curlrc` perms 600 para no exponer secret en `ps aux` ni `~/.bash_history`):
  ```
  5 * * * * curl -K /home/propyte/.zoho-retry.curlrc https://propyte.com/api/cron/zoho-retry >> /home/propyte/logs/zoho-retry.log 2>&1
  ```
- [ ] **Z5.3** Test manual: insertar lead con `zoho_sync_error = 'PENDING_SYNC'` forzado → ejecutar endpoint → verificar `findLeadByEmail` ejecuta + no duplica si ya existe en Zoho.

### Bloque F — Tests Playwright (1 día)

- [ ] **Z6.1** Crear `tests/api/leads-zoho.spec.ts` con 11 sub-tests (1 por source).
- [ ] **Z6.2** Mock del endpoint Zoho con MSW o fetch interception.
- [ ] **Z6.3** Test rate limit (6 submissions seguidas → 429).
- [ ] **Z6.4** Test honeypot (campo `website` poblado → 200 silencioso, 0 rows en Supabase).
- [ ] **Z6.5** Test fallback Supabase (Zoho mock devuelve 500 → lead persistido con `zoho_sync_error`).
- [ ] **Z6.6** Test Proyecto_de_Interes lookup (match + no-match cases). **Fixture:** usar un `entity_type='development'` real conocido en prod (verificado vía MCP: hay 103 mappings, ej. seleccionar uno de Avica Inmobiliaria). Para no-match: UUID arbitrario `00000000-0000-0000-0000-000000000000`. NO crear seeds — los integration tests apuntan a la BD real (regla del proyecto).
- [ ] **Z6.7** Test whitelist Industry: cada uno de los 10 categorySlug genera IndustryValue válido.

### Bloque G — Rollout (1+ semana validación)

- [ ] **Z7.1** Push `feat/zoho-forms-integration` → Vercel preview (staging).
- [ ] **Z7.2** Manualmente submit 1 lead desde cada uno de los 11 forms en staging.
- [ ] **Z7.2b** **Regression test anti-duplicado (bug v1.2):** forzar un lead con `zoho_sync_error = 'PENDING_SYNC'` y crear el mismo Lead en Zoho UI manualmente (mismo email). Correr el cron 2 veces. **Aceptación: 1 solo Lead en Zoho** (`findLeadByEmail` debe detectar el preexistente y solo hacer UPDATE local, no POST nuevo).
- [ ] **Z7.3** Verificar en Zoho UI: 11 Leads + 1 Account creados, identificadores correctos, owner asignado por Rule.
- [ ] **Z7.4** Merge `feat/zoho-forms-integration` → `develop`.
- [ ] **Z7.5** Push `develop` → `main` (Hostinger auto-deploy).
- [ ] **Z7.6** Monitor con dashboard manual: revisar `public.leads` para `zoho_sync_error` y tasa de éxito.
- [ ] **Z7.7** Cleanup `submitForm.ts` SOLO cuando se cumpla umbral §7 (≥100 leads, ≥98% success, ≥1 por form). PR separado.

### Bloque H — Rollback plan

Si en producción detectamos que >10% leads tienen `zoho_sync_error`:

- [ ] **Z8.1** Revert commits del bloque C.
- [ ] **Z8.2** Restore `submitForm.ts` con env `NEXT_PUBLIC_WEBHOOK_URL` apuntando a webhook fallback.
- [ ] **Z8.3** Los leads ya capturados en Supabase con `zoho_sync_error` se reprocesan manualmente.
- [ ] **Z8.4** Columnas SQL se mantienen (additive, no se reversan).

### Bloque H' — Security hardening (paralelo a A-F, integra antes de Z7)

- [ ] **ZS.1** Crear `src/lib/security/sanitize-error.ts` con `sanitizeErrorMessage`. Tests unit (4 patrones PII + caso unicode + cap 2KB).
- [ ] **ZS.2** Crear `src/lib/security/cron-auth.ts` con `verifyCronSecret`. Tests unit (timing-safe, fail-closed sin secret, fail-closed con secret < 32).
- [ ] **ZS.3** Crear `src/lib/security/global-quota.ts` con `enforceGlobalQuota`. Test integration: 1001 requests con IPs distintas → 1001ª recibe 503.
- [ ] **ZS.4** Aplicar `sanitizeErrorMessage` en `/api/leads/route.ts` y `/api/cron/zoho-retry/route.ts`. Grep CI: 0 ocurrencias de `update({ zoho_sync_error: ` sin `sanitizeErrorMessage`.
- [ ] **ZS.5** Aplicar `verifyCronSecret` en `/api/cron/zoho-retry/route.ts`. Grep CI: 0 ocurrencias de `=== process.env.CRON_SECRET`.
- [ ] **ZS.6** Aplicar `enforceGlobalQuota` antes del rate limit por IP en `/api/leads/route.ts`.
- [ ] **ZS.7** Aplicar timing-uniform en honeypot path de `/api/leads/route.ts` (`randomInt(180, 421)`).
- [ ] **ZS.8** Actualizar `LeadSchema` con `propertyId.uuid()` y regex en `gclid`/`utm_*` (REQ-S-08). Test: enviar `propertyId: 'not-a-uuid'` → 400.
- [ ] **ZS.9** Actualizar migración SQL §6.5 con el clamp `least(greatest(...))`, `SET search_path`, `REVOKE...GRANT`, `COMMENT ON COLUMN`. Re-verificar con `SELECT prosecdef, proconfig FROM pg_proc WHERE proname = 'claim_zoho_retry_batch'`.
- [ ] **ZS.10** Configurar `/home/propyte/.zoho-retry.curlrc` en VPS Hostinger con permisos `600`. Actualizar crontab a la versión con `-K`. Confirmar: `grep -r "Bearer" /home/propyte/.bash_history` está vacío.
- [ ] **ZS.11** En los 8 forms con honeypot nuevo, agregar `autocomplete="off"` al input hidden (REQ-F-14 ampliado).
- [ ] **ZS.12** Tests Playwright: (a) payload con email único nunca aparece en respuesta de error (REQ-S-09); (b) cron endpoint sin auth → 401; cron endpoint con auth válido pero 11 requests rápidas → 11ª = 429.

---

## Apéndice A — Inventario de campos Zoho usados

| Campo Zoho (API name) | Rótulo UI | Tipo | Forms que lo usan |
|----------------------|-----------|------|-------------------|
| `First_Name`, `Last_Name` | Nombre / Apellidos | text | Todos |
| `Email` | Correo | email | Todos |
| `Phone` | Teléfono | phone | 2-8 |
| `Mobile` | Celular | phone | Form 8 (whatsapp) |
| `Company` | Empresa | text | 3, 4, 6, 7 |
| `Inmobiliaria` | Inmobiliaria | text | Form 5 |
| `City`, `Country` | Ciudad / País | text | Mayoría |
| `Lead_Source` | Origen | picklist | Todos = "Sitio web" |
| `Lead_Status` | Estado lead | picklist | Todos = "Nuevo" |
| `Etapa_interna_de_contacto` | Etapa interna | multi-picklist | Todos = ["Sin Contactar"] |
| `Idioma` | Idioma | picklist | Todos |
| `Tipo_de_Contacto` | Tipo contacto | picklist | Todos (Lead/Broker/Proveedor) |
| `Broker` | Es broker | boolean | Form 5 (=true) |
| `Nombre_de_Campa_a` | Nombre de campaña | text | Todos |
| `Nombre_del_formulario` | Nombre del formulario | text | Todos |
| `Proyecto_de_Interes` | Proyecto de interés | multi-lookup | Form 2 |
| `Description` | Descripción | textarea | Todos (catch-all extras) |
| `GCLID`, `Ad_Campaign_Name`, `AdGroup_Name` | Google Ads tracking | text | Si UTM presente |
| `Presupuesto` | Presupuesto | text libre | Form 7 |

**Accounts (Form 6):**

| Campo | Valor |
|-------|-------|
| `Account_Name` | `company` del form |
| `Phone`, `Website`, `Billing_City`, `Billing_Country` | del form |
| `Industry` (rótulo "Sector") | mapeado por whitelist (apéndice B) |
| `Fuente_de_Empresa` | `"Sitio web"` |
| `Estado_de_Empresa` | `"NUEVO"` |
| `Description` | Mensaje del form |

## Apéndice B — Whitelist `categorySlug → Industry`

Form 6 (ProviderForm.tsx) envía `category` como uno de 10 slugs en inglés. Mapping canónico:

```typescript
export const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  'Notary':       'Notaría / Legal',
  'Legal':        'Notaría / Legal',
  'Finance':      'Finanzas',
  'Architecture': 'Arquitectura',
  'Construction': 'Construcción',
  'Moving':       'Mudanzas',
  'Furniture':    'Mobiliario',
  'Insurance':    'Seguros',
  'Marketing':    'Marketing',
  'Other':        'Otro',
};
```

> Test obligatorio: cada uno de los 10 valores del select `CATEGORIES` en `ProviderForm.tsx:10-21` debe tener entrada en este map. Si Luis agrega categorías al form, el test falla en CI.

## Apéndice C — Crontab Hostinger

**Hardening v1.4:** el secret NO se pasa en línea de comando (apareceria en `ps aux` durante los 200ms de vida del proceso curl, y en `~/.bash_history` si alguien edita el crontab interactivamente). Usar `-K config_file` con permisos 600.

**Paso 1.** Crear archivo de configuración curl:

```bash
install -m 600 /dev/null /home/propyte/.zoho-retry.curlrc
cat > /home/propyte/.zoho-retry.curlrc <<'EOF'
header = "Authorization: Bearer <PASTE_CRON_SECRET_HERE>"
silent
fail-with-body
EOF
chmod 600 /home/propyte/.zoho-retry.curlrc
chown propyte:propyte /home/propyte/.zoho-retry.curlrc
```

**Paso 2.** Entrada crontab del usuario `propyte` (`crontab -e -u propyte`):

```cron
# Reintento Zoho cada hora a los :05 — auth via curl config file (REQ-S-04 nota operativa)
5 * * * * /usr/bin/curl -K /home/propyte/.zoho-retry.curlrc https://propyte.com/api/cron/zoho-retry >> /home/propyte/logs/zoho-retry.log 2>&1
```

**Verificación:**
- `ls -la /home/propyte/.zoho-retry.curlrc` → debe ser `-rw------- propyte propyte`
- `grep -r "Bearer" /home/propyte/.bash_history /home/propyte/.zsh_history 2>/dev/null` → vacío
- Tras correr el cron una vez: `grep "401\|403" /home/propyte/logs/zoho-retry.log` debe estar vacío

## Apéndice D — Matriz de campos requeridos por form

| # | source | name | email | phone | property_id | message | extras requeridos |
|---|--------|------|-------|-------|-------------|---------|-------------------|
| 1 | `contact` | ✓ req | ✓ req | — | — | ✓ req | subject |
| 2 | `property_inquiry` | ✓ req | ✓ req | opc | ✓ req | opc | investmentType, propertyName |
| 3 | `b2b_request` | ✓ req | ✓ req | ✓ req | — | opc | company, location |
| 4 | `developer_request` | ✓ req | ✓ req | ✓ req | — | opc | company, location, projectType, unitCount |
| 5 | `broker_registration` | ✓ req | ✓ req | ✓ req | — | opc | company, brokerType, experience, focusArea |
| 6 | `provider_form` | ✓ req | ✓ req | ✓ req | — | ✓ req | company, category, city, website (opc) |
| 7 | `built_consultation` | ✓ req | ✓ req | ✓ req | — | opc | company, projectType, budget, location |
| 8 | `affiliate_request` | ✓ req | ✓ req | ✓ req (whatsapp) | — | opc | city, experience, interest |
| 9 | `newsletter` | — | ✓ req | — | — | — | — (Last_Name = "Suscriptor" en server) |
| 10 | `lead_magnet` | ✓ req | ✓ req | — | — | — | — |
| 11 | `glossary_pdf` | ✓ req | ✓ req | — | — | — | consent (boolean check) |

> ✓ req = Zod rechaza si vacío. opc = aceptado vacío/null. — = no presente en el form.

## Apéndice E — Pseudo-código de helpers críticos

### `parseName(raw, fallback = 'Anónimo'): { firstName?: string; lastName: string }`

```typescript
export function parseName(
  raw: string | null | undefined,
  fallback = 'Anónimo'
): { firstName?: string; lastName: string } {
  const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return { lastName: fallback };  // Zoho requires Last_Name non-empty

  const tokens = trimmed.split(' ');
  if (tokens.length === 1) {
    return { lastName: tokens[0] };  // single word → Last_Name only
  }
  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(' '),
  };
}
```

Tests:
- `parseName(' Juan ')` → `{ lastName: 'Juan' }`
- `parseName('Juan Pérez')` → `{ firstName: 'Juan', lastName: 'Pérez' }`
- `parseName('Juan Pérez García')` → `{ firstName: 'Juan', lastName: 'Pérez García' }`
- `parseName('')` → `{ lastName: 'Anónimo' }`
- `parseName(null)` → `{ lastName: 'Anónimo' }`
- `parseName('', 'Suscriptor')` → `{ lastName: 'Suscriptor' }` (uso desde Newsletter)
- `parseName(null, 'Anonymous')` → `{ lastName: 'Anonymous' }` (locale EN — el caller pasa el fallback localizado)

### `parseFirstNameFromEmail(email: string): string | undefined`

```typescript
const GENERIC_MAILBOXES = new Set([
  'info', 'contact', 'contacto', 'sales', 'ventas', 'hello', 'hola', 'hi',
  'admin', 'support', 'soporte', 'mkt', 'marketing', 'noreply', 'no-reply',
  'team', 'equipo', 'office', 'oficina',
]);

export function parseFirstNameFromEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  const localPart = email.split('@')[0]?.toLowerCase().trim();
  if (!localPart) return undefined;

  const tokens = localPart.split(/[._-]/);
  let candidate = tokens[0];
  if (!candidate) return undefined;

  // Strip trailing digits (juan42 → juan)
  candidate = candidate.replace(/\d+$/, '');

  if (candidate.length < 2) return undefined;
  if (GENERIC_MAILBOXES.has(candidate)) return undefined;
  if (/^\d+$/.test(candidate)) return undefined;  // pure numbers → omit

  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}
```

Tests:
- `parseFirstNameFromEmail('juan@dominio.mx')` → `'Juan'`
- `parseFirstNameFromEmail('juan.perez@dominio.mx')` → `'Juan'`
- `parseFirstNameFromEmail('juan_perez@dominio.mx')` → `'Juan'`
- `parseFirstNameFromEmail('juan42@dominio.mx')` → `'Juan'` (dígitos finales removidos)
- `parseFirstNameFromEmail('info@empresa.com')` → `undefined`
- `parseFirstNameFromEmail('contacto@nativatulum.mx')` → `undefined`
- `parseFirstNameFromEmail('123@dominio.mx')` → `undefined`
- `parseFirstNameFromEmail('2024@dominio.mx')` → `undefined` (queda vacío post-strip)

### `truncateDescription(text: string, max = 32000): string`

```typescript
export function truncateDescription(text: string | null | undefined, max = 32_000): string | undefined {
  if (!text) return undefined;
  if (text.length <= max) return text;
  return text.slice(0, max - 20) + '… [truncado]';
}
```

### `truncateError(msg: string, max = 1000): string` (REQ-F-21)

Mismo patrón, distinto cap. Aplicado a `zoho_sync_error` para evitar que la columna text crezca indefinidamente si Zoho devuelve stack traces o si retries concatenan errores.

```typescript
export function truncateError(msg: string | null | undefined, max = 1000): string | undefined {
  if (!msg) return undefined;
  if (msg.length <= max) return msg;
  return msg.slice(0, max - 14) + '… [truncado]';
}
```

> **Orden de composición:** siempre `truncateError(sanitizeErrorMessage(err))` — sanitizar primero (los regex matchean patterns completos) y truncar después (no cortamos un patrón a la mitad).

### `isAllowedOriginExtensible(origin, env)`

```typescript
function isAllowedOrigin(origin: string | null): boolean {
  // Decisión consciente: aceptamos request sin Origin header (same-origin browser
  // form posts a veces lo omiten). Riesgo de bots POSTeando sin Origin se cubre con
  // rate limit (5/min/IP) + honeypot (campo `website`) + validación Zod estricta.
  if (!origin) return true;

  const envList = (process.env.LEADS_ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const baseList = [
    'https://propyte.com',
    'https://www.propyte.com',
    'https://dev.propyte.com',
  ];
  const allowed = new Set([...baseList, ...envList]);
  if (allowed.has(origin)) return true;

  if (process.env.NODE_ENV !== 'production') {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    } catch { return false; }
  }
  return false;
}
```

Para Nativa Tulum: `LEADS_ALLOWED_ORIGINS=https://nativatulum.mx,https://www.nativatulum.mx` (cuando aplique).

### `sanitizeErrorMessage(err: unknown): string` (REQ-S-02)

```typescript
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
const RFC_RE   = /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/gi;        // RFC (MX)
const CURP_RE  = /\b[A-Z]\d{2}[A-Z]{2}\d{2}[HM][A-Z]{5}[A-Z0-9]\d\b/g; // CURP (MX)
const NAME_KV  = /"(?:first_?name|last_?name|full_?name|nombre)"\s*:\s*"[^"]*"/gi;

export function sanitizeErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  let raw: string;
  if (err instanceof Error) raw = `${err.name}: ${err.message}`;
  else if (typeof err === 'string') raw = err;
  else { try { raw = JSON.stringify(err); } catch { raw = fallback; } }

  return raw
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(RFC_RE,   '[rfc]')
    .replace(CURP_RE,  '[curp]')
    .replace(NAME_KV,  (m) => m.replace(/:\s*"[^"]*"/, ': "[name]"'))
    .slice(0, 2000);  // cap para no llenar la columna
}
```

Tests obligatorios:
- `sanitizeErrorMessage({ data: [{ details: { api_name: 'Email', expected_data_type: 'email' }, message: 'duplicate data for juan@x.mx' }] })` → no contiene `juan@x.mx`.
- `sanitizeErrorMessage('teléfono +52 55 1234 5678 inválido')` → no contiene los dígitos del teléfono.
- `sanitizeErrorMessage(new Error('429 Too Many Requests'))` → conserva el mensaje útil sin alterar.
- Caracteres unicode (acentos en RFC/nombre) se manejan correctamente.

> ⚠️ **Regla operativa:** todo `.update({ zoho_sync_error: X })` y todo `console.error(X)` en code-path lead/cron pasa por `sanitizeErrorMessage(X)`. ESLint custom rule sugerida para enforcement (no obligatorio en v1, sí en v2).

### `verifyCronSecret(authHeader: string | null): boolean` (REQ-S-04)

```typescript
import { timingSafeEqual } from 'node:crypto';

export function verifyCronSecret(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) {
    // Fail-closed: si el server no tiene secret config, NO autorizar.
    console.error('CRON_SECRET unset or too short (<32 chars)');
    return false;
  }

  // Authorization: Bearer <secret>
  const prefix = 'Bearer ';
  if (!authHeader || !authHeader.startsWith(prefix)) return false;
  const provided = authHeader.slice(prefix.length).trim();
  if (!provided) return false;

  // timingSafeEqual exige buffers de igual longitud. Pad ambos al len máximo.
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  const len = Math.max(a.length, b.length);
  const aPad = Buffer.alloc(len, 0); a.copy(aPad);
  const bPad = Buffer.alloc(len, 0); b.copy(bPad);

  // timingSafeEqual SOLO con buffers de igual longitud — si los originales difieren en longitud,
  // siempre falla (a propósito) sin filtrar la longitud del secret.
  return a.length === b.length && timingSafeEqual(aPad, bPad);
}
```

Tests:
- Secret correcto → `true`.
- Secret prefijo correcto pero un caracter distinto al final → `false` (verificar tiempo similar a fallar al principio).
- Sin header `Authorization` → `false`.
- `CRON_SECRET` no seteado → `false` (fail-closed) + log error.
- `CRON_SECRET` < 32 chars → `false` + log error.

### `enforceGlobalQuota(): NextResponse | null` (REQ-S-07)

```typescript
import { rateLimit, type RateLimitOptions } from '@/lib/rateLimit';
import { NextResponse, type NextRequest } from 'next/server';

const GLOBAL_QUOTA: RateLimitOptions = {
  bucket: 'leads-global',
  limit: 1000,
  windowMs: 60 * 60 * 1000,  // 1 hora
};

// El rate limiter usa client key (IP). Para quota global, pasamos un request sintético con
// header `x-real-ip: 'global'` para que TODAS las requests caigan en el mismo bucket.
export function enforceGlobalQuota(): NextResponse | null {
  const fake = new Request('http://internal/quota', {
    headers: { 'x-real-ip': 'global' },
  }) as unknown as NextRequest;
  const result = rateLimit(fake, GLOBAL_QUOTA);
  if (result.ok) return null;
  // 503 (no 429) — el cliente individual no excedió SU quota; el servidor se está protegiendo.
  return NextResponse.json(
    { error: 'Service temporarily at capacity. Please retry shortly.' },
    { status: 503, headers: { 'Retry-After': String(result.retryAfterSec) } },
  );
}
```

> **Nota:** la quota es per-process. Si Hostinger PM2 corre con cluster mode (N workers), la quota efectiva = `1000 × N`. Tolerable para defense-in-depth — el dimensionamiento real lo da `getCallsToday()` en cron monitor (§8).

### Honeypot constant-time (REQ-S-06) — patrón en route handler

```typescript
import { randomInt } from 'node:crypto';

if (parsed.data.website) {
  // Honeypot triggered: wait jitter then return success-shaped 200 (anti-fingerprinting).
  await new Promise((r) => setTimeout(r, randomInt(180, 421)));
  return NextResponse.json({ success: true, id: crypto.randomUUID() }, { status: 200 });
}
```

> El `id` que se devuelve es un UUID aleatorio (no persistido) para que el bot reciba la misma forma de respuesta que el path real. No se persiste nada en Supabase ni se llama a Zoho.

## Apéndice F — Notas operativas

- **PM2 multi-worker:** el cliente Zoho usa singleton `cachedClient`. Cada worker PM2 mantiene su propio token cacheado (no shared memory) — es comportamiento esperado, multiplica el refresh count 4-8x si PM2 corre con cluster mode. Tolerable dado que `expires_in` es 3600s.
- **Path de logs cron:** unificado a `/home/propyte/logs/zoho-retry.log` (no `/var/log/` que requiere root).
- **Semántica `zoho_retry_count`:** se incrementa **al claim** (dentro del `UPDATE ... RETURNING` de la función SQL), no al recibir respuesta de Zoho. Significa "attempts started" — incluye intentos donde el lead fue reclamado pero el handler crasheó antes de llegar a Zoho. Es conservador (max 3 garantiza ceiling), no exacto.
- **Origen sin header:** ver decisión en apéndice E (`if (!origin) return true` + razones).
- **`RATE_LIMIT_TRUSTED_PROXY_HOPS`:** env var documentada en [rateLimit.ts:54-75](../src/lib/rateLimit.ts#L54-L75). Default `1` ajusta a Hostinger+Nginx (Nginx pone una IP en `x-forwarded-for`). Si en el futuro se agrega Cloudflare/CDN delante, subir a `2`. Setear mal este valor permite spoofing del client IP en el rate limiter.

### Runbook — leads atascados con `zoho_retry_count = 3`

Tras 3 fallos consecutivos un lead queda invisible al cron (la función `claim_zoho_retry_batch` lo excluye). Si Zoho recuperó disponibilidad después, hay que resetear manualmente.

**Detectar:**
```sql
SELECT id, email, source, zoho_sync_error, zoho_retry_count, created_at
FROM public.leads
WHERE zoho_lead_id IS NULL
  AND zoho_retry_count >= 3
ORDER BY created_at DESC;
```

**Reset selectivo (verificado caso por caso):**
```sql
UPDATE public.leads
SET zoho_retry_count = 0,
    zoho_sync_error = 'MANUAL_RESET_' || to_char(now(), 'YYYY-MM-DD')
WHERE id IN ('<uuid1>', '<uuid2>', ...);
```

El cron los recoge en la próxima corrida y dispara `findLeadByEmail` antes de POST (rama PENDING_SYNC-like, conservador).

**Reset masivo (solo tras incidente confirmado de Zoho caído):**
```sql
UPDATE public.leads
SET zoho_retry_count = 0,
    zoho_sync_error = 'MANUAL_RESET_BULK_' || to_char(now(), 'YYYY-MM-DD')
WHERE zoho_lead_id IS NULL
  AND zoho_retry_count >= 3
  AND created_at > now() - interval '7 days';
```

> ⚠️ No resetear sin investigar — si el error es **estructural** (picklist value inválido, payload malformado), reintentar 3 veces más no ayuda. Mirar el contenido de `zoho_sync_error` antes.
