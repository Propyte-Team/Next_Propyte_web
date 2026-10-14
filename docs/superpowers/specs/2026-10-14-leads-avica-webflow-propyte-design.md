# Leads del sitio de Avica → Zoho de Propyte — diseño

> Fecha: 2026-10-14 · Estado: diseño aprobado por secciones, pendiente de revisión escrita
> Repo: `Next_Propyte_web` · Rama: `feat/leads-avica-webflow`

## 1. Contexto y objetivo

**Decisión de Luis (2026-10-14):** los formularios del sitio de **Avica**
(avicainmobiliaria.com.mx, Webflow) van al **Zoho de Propyte**. Los formularios
de **Yaxnáh** van al Zoho de Yaxnáh («Aspire Vivendi»).

**Hoy** (en producción desde el 2026-10-14) el formulario de contacto de Avica
viaja así:

```
Webflow  ──webhook 6acfba5ad7370a9f2e6a3af5 (form_submission, filtro «Email Footer», ?token=)──▶
brokers-yaxnah.propyte.com/api/sitio/lead  ──▶  Zoho de Yaxnáh (Aspire Vivendi)
```

Es el destino equivocado según la decisión anterior. El newsletter («Email
Form») no llega a ningún CRM.

**Objetivo:** que los dos formularios de Avica entren al Zoho de Propyte con
las mismas garantías que los de propyte.com: guardado previo en
`public.leads`, nota en duplicados y reintento por cron. Además, que no se
mezclen en el Pixel de Meta de Propyte.

**Criterio de éxito:**
- Un envío real del formulario de Avica crea un Lead en el Zoho de Propyte
  con campaña, formulario, proyecto y asesor asignado correctos.
- El webhook de Meta CAPI no se dispara para ese lead.
- El spam no llega ni a la base ni a Zoho.
- Ningún envío entra a los dos Zoho.

## 2. Alcance

**Dentro**
- Los dos formularios reales de Avica en Webflow:
  - «Email Footer»: contacto, incluido en el pie de todas las páginas.
  - «Email Form»: newsletter, solo correo.

**Fuera**
- **yaxnah.com.mx.** Su formulario lo procesa el servidor de la agencia Marker
  (`/api` en su Vercel). Sacarlo de ahí es un proyecto aparte («independizar
  yaxnah.com.mx»). Ese proyecto reaprovechará el flujo hacia el Zoho de Yaxnáh
  que ya existe en la app de brokers.
- **La publicación de Webflow.** Está pendiente y bloqueada por el
  clasificador de permisos. El webhook funciona sin publicar.
- El registro de brokers de Yaxnáh no cambia.

## 3. Decisiones tomadas

| Decisión | Valor | Origen |
|---|---|---|
| Destino de Avica | Zoho de Propyte | Luis, 2026-10-14 |
| Brokers de Avica (casilla o «Soy Broker») | Brokers de Propyte (Tipo «Broker», etiqueta `[BROKERS]`) | Luis, 2026-10-14 |
| Dónde vive el receptor | Ruta nueva en `Next_Propyte_web` que reusa el flujo de `/api/leads` (opción A) | Luis, 2026-10-14 |
| «Invertir en un departamento» sin página de desarrollo | Proyecto Nativa Tulum (único departamento publicado en Avica) | Diseño, modificable |
| «Comprar una casa» sin página de desarrollo | Proyecto Yaxnáh Caucel | Diseño, modificable |
| Conversions API de Meta | **No** para Avica: ni desde el endpoint ni desde Zoho | Luis, 2026-10-14 |
| Spam | Se descarta sin guardar en `public.leads` (Webflow conserva todos los envíos) | Diseño |

**Ya hecho en Zoho (2026-10-14):** la regla «Enviar Lead a Meta CAPI»
(`6040986000091354021`) corría sin condición. Ahora solo se dispara si
`Nombre_de_Campa_a` está vacío **o** no contiene «Sitio Avica».

## 4. Arquitectura

```
Webflow (Email Footer / Email Form)
   │  webhook form_submission SIN filtro, ?token=<WEBFLOW_AVICA_WEBHOOK_TOKEN>
   ▼
POST /api/webhooks/webflow-avica                  (Next_Propyte_web)
   1. token (timingSafeEqual) ── falla → 401 · sin configurar → 503
   2. leer envío de Webflow (zod) ── no es form_submission / JSON roto → 200 «ignorado»
   3. formulario desconocido → 200 «ignorado»
   4. spam (trampa o enlaces/HTML) → 200 «descartado», NO se guarda
   5. decidir fuente: avica_contacto | avica_broker | avica_newsletter
   6. ─────────── mismo motor que /api/leads ───────────
      faltanDatosDeContacto → guardar SKIPPED, 200
      resolverProyectoZoho(fuente, datos)
      sourceToZohoPayload → INSERT public.leads (form_data, PENDING_SYNC)
         └ INSERT falla → 500 (Webflow reintenta)
      pushToZoho (duplicado → nota) ── Zoho falla → queda para el cron, 200
   7. NO sendCAPIEvents
```

### Componentes

| Archivo | Qué hace | Cambio |
|---|---|---|
| `src/lib/webflow-avica/envio.ts` | Lee el payload de Webflow; detecta spam; arma `{ source, formData }`. Porta la lógica probada de `yaxnah-registro-brokers/src/lib/sitio/envio.ts` | Nuevo |
| `src/lib/leads/registrar-lead.ts` + `src/lib/leads/compact-form-data.ts` | `updateLeadLocal` y `pushToZoho` (y `compactFormData`, puro), **movidos** de `src/app/api/leads/route.ts` sin cambiar su conducta. Cada llamador hace su propio INSERT: las columnas difieren (UTM, QR, `property_id`) | Extraído |
| `src/app/api/leads/route.ts` | Importa lo extraído. Mismo contrato, mismos códigos | Refactor sin cambio de conducta |
| `src/lib/webflow-avica/manejador.ts` | Decide la respuesta a Webflow (token, ignorado, descartado, 500). Recibe `procesar` inyectado: se prueba sin Supabase ni Zoho | Nuevo |
| `src/lib/webflow-avica/procesar.ts` | INSERT + `resolverProyectoZoho` + `pushToZoho`. No importa nada de Meta | Nuevo |
| `src/app/api/webhooks/webflow-avica/route.ts` | Conecta cuota global, token del entorno y `procesar` | Nuevo |
| `src/lib/zoho/resolve-proyecto-interes.ts` | Nueva `resolverProyectoZoho(supabase, source, formData)`. Para `property_inquiry` delega en la función actual; para las fuentes de Avica aplica la §5.3 | Ampliado |
| `src/app/api/cron/zoho-retry/route.ts` | Usa `resolverProyectoZoho` en lugar del `if (source === 'property_inquiry')` | Una línea de decisión menos |
| `src/lib/zoho/field-maps.ts` | 3 fuentes nuevas en `LeadSource`, campaña, formulario, tipo, descripción, mensaje; exención de newsletter extendida | Ampliado |
| `src/lib/lead-sources.ts` | Las 3 fuentes en `KNOWN_SOURCES` (el chequeo de tipos ya obliga) | Ampliado |

**Por qué una sola `resolverProyectoZoho`:** el cron reconstruye el payload
desde `form_data`. Si la decisión del proyecto viviera solo en la ruta nueva,
todo lead rescatado por el cron llegaría sin proyecto. Es el mismo hueco que
ya mordió en `/unete` con el teléfono.

`/api/webhooks/*` no pasa por el middleware de idioma: el matcher excluye
`api`.

## 5. Mapeo

### 5.1 Campos de Webflow → `FormData`

| Webflow | `FormData` | Nota |
|---|---|---|
| `nombre` | `name` | |
| `tel` | `phone` | Va a `Phone`, como el resto de fuentes que no son `/unete` |
| `correo` (contacto) / `correo_newsletter` (newsletter) | `email` | En minúsculas; inválido → null |
| `correo` con formato inválido (`ana@gmail`) | `invalidEmail` *(campo nuevo)* | Solo evidencia en `form_data`: el lead queda SKIPPED por la regla de los tres datos y se registra el motivo |
| `ciudad` | `city` | `City` en Zoho y en la descripción (ver §9, riesgo 1) |
| `mensaje` | `message` | Va a `Mensaje` |
| `interes_en` | `interestOption` *(campo nuevo)* | Clave cruda: `asesor` / `casa` / `departamento` / `broker` |
| `nos_encontro_en` | `heardFrom` *(campo nuevo)* | Clave cruda: `busqueda_google`, `publicidad_meta`, `referencias`, `medio_impreso` |
| `es_broker` o, sin publicar, `Field 8` | `isBroker` *(campo nuevo, boolean)* | `"true"` → true |
| La ruta de `pageUrl` (o `publishedPath` si no viene) | `page` | URL absoluta `https://www.avicainmobiliaria.com.mx<ruta>` → `Nombre_anuncio`. `pageUrl` manda: en una ficha del CMS, `publishedPath` trae la ruta de la plantilla (`/desarrollos`, medido en 4 envíos reales) |
| `campo_extra_hp` | — | Solo para detectar spam; nunca se guarda |

Los tres campos nuevos son opcionales en `FormData`. `compactFormData` los
persiste en `form_data`, y el cron ya hace `...form_data`, así que los
reintentos los conservan sin código extra.

### 5.2 Fuente

| Condición | Fuente |
|---|---|
| Formulario «Email Form» | `avica_newsletter` |
| «Email Footer» con `interes_en = broker` **o** casilla marcada | `avica_broker` |
| «Email Footer», resto | `avica_contacto` |
| Cualquier otro nombre de formulario | Se ignora (200) |

### 5.3 Proyecto de interés

La página manda sobre el interés. El código guarda solo **UUIDs del Hub**. El
id de Zoho se resuelve en tiempo de ejecución con
`real_estate_hub."Propyte_zoho_id_map"` (`entity_type = 'development'`), igual
que `resolveProyectoDeInteres`.

| Página / interés | Desarrollo del Hub | Zoho (medido 2026-10-14) |
|---|---|---|
| `/desarrollos/yaxnah` | `76dfb7d5-78a7-47cd-b316-faadd97f4c9e` (Yaxnáh Caucel) | `6040986000097746005` |
| `/desarrollos/nativa-tulum` | `5c171eb4-ef42-444c-9a81-6d61a5b20813` (Nativa Tulum) | `6040986000000864137` |
| `/desarrollos/real-caucel` | No existe en el Hub | Sin proyecto |
| Otra página + `casa` | Yaxnáh Caucel | — |
| Otra página + `departamento` | Nativa Tulum | — |
| `asesor`, `broker`, newsletter | — | Sin proyecto |

Si el mapa no da un id, el lead entra sin `Proyecto_de_Interes` y el nombre
del desarrollo va en la descripción. Nunca se falla por esto.

### 5.4 Payload de Zoho (módulo Leads de Propyte)

Igual que el resto de propyte.com: `Lead_Source` y `Plataforma_de_llegada`
«Sitio web», `Lead_Status` «Nuevo», `Etapa_interna_de_contacto` «Sin
Contactar», `Idioma` «Español», `Country` «Mexico» y sin `Owner`. El dueño lo
asigna la regla «NUEVAS REGLAS DE INGRESO» por la etiqueta de la campaña.

| | `avica_contacto` | `avica_broker` | `avica_newsletter` |
|---|---|---|---|
| `Nombre_de_Campa_a` | `Sitio Avica - contacto - [LEADS]` | `Sitio Avica - broker - [BROKERS]` | `Sitio Avica - newsletter - [LEADS]` |
| `Nombre_del_formulario` | `Formulario sitio Avica ES - Contacto` | `Formulario sitio Avica ES - Broker` | `Formulario sitio Avica ES - Newsletter` |
| `Tipo_de_Contacto` | Lead | Broker | Lead |
| `Broker` | — | `true` (como `broker_registration`) | — |
| `Last_Name` sin nombre | (no ocurre: el formulario lo exige) | (ídem) | «Suscriptor», nombre de pila desde el correo (como `newsletter`) |
| `Proyecto_de_Interes` | Según §5.3 | — | — |

**`Description`** (contexto estructurado, una línea por dato presente):
- `Sitio: avicainmobiliaria.com.mx<ruta>`
- `Interés: …`, `Cómo nos conoció: …` y `Ciudad: …`
- `Marcó «¿Eres broker inmobiliario?»` si aplica
- `Desarrollo: …` cuando hay desarrollo sin id de Zoho

Las etiquetas legibles («Comprar una casa», «Búsqueda en Google», «Soy
Broker»…) se copian de `yaxnah-registro-brokers/src/lib/sitio/mapeo.ts`. Una
clave desconocida se escribe tal cual.

**`Mensaje`:** el texto libre (`message`). Para el newsletter no hay.

**Duplicados:** sin cambios. `DUPLICATE_DATA` → nota en el Lead existente con
`composeDuplicateNote`.

**`faltanDatosDeContacto`:** la exención de `newsletter` es una lista cerrada
de uno. Se amplía **explícitamente** a `avica_newsletter`, con su comentario,
no con un `default` permisivo.

## 6. Spam, errores y respuestas a Webflow

Webflow reintenta hasta 3 veces (cada 10 min) cualquier respuesta distinta de
200, y desactiva el webhook si los fallos se repiten. Por eso solo se responde
error cuando un reintento puede servir.

| Caso | Respuesta | `public.leads` | Zoho |
|---|---|---|---|
| Token ausente o incorrecto | 401 | — | — |
| Token no configurado en el servidor | 503 | — | — |
| JSON roto, otro evento u otro formulario | 200 `ignorado` | — | — |
| Campo trampa lleno, o enlace/HTML en nombre, ciudad o mensaje | 200 `descartado` + motivo | **No** | — |
| Sin datos de contacto (`faltanDatosDeContacto`) | 200 `omitido` | Sí, `SKIPPED: sin datos de contacto` | — |
| INSERT falla | **500** | — | — |
| Zoho falla o tarda más de 10 s | 200 `guardado` | Sí, con el error o en `PENDING_SYNC`; lo cierra el push en vuelo o el cron | Pendiente |
| Éxito / duplicado | 200 `guardado` (el resultado de Zoho queda en `zoho_lead_id` / `zoho_sync_error`) | Sí | Lead / nota |

- **Spam:** regla medida el 2026-10-14. «Trae enlace o HTML» atrapó 35/35
  envíos spam y 0/10 legítimos; sin filtro por idioma. Se registra una línea
  `[webflow-avica] descartado motivo=…` sin datos personales.
- **Logs:** una línea por envío, sin nombre, teléfono ni correo.
- **Sin límite por IP.** Webflow manda desde pocas IP, y un 429 dispararía sus
  reintentos. El token es la barrera; se mantiene la cuota global.
- **Sin firma HMAC.** Un webhook creado con el conector MCP lo firma la app
  OAuth de Webflow con su propio secreto, y no se puede verificar. Si algún día
  se crea con un token de sitio, se puede agregar la firma como en la app de
  brokers.

## 7. Corte del receptor viejo al nuevo

1. Merge a `main` de `Next_Propyte_web`. Hostinger despliega solo (no hay
   GitHub Actions de deploy).
2. **Luis** agrega `WEBFLOW_AVICA_WEBHOOK_TOKEN` en el panel de Hostinger de
   propyte.com (Node.js → Variables de entorno → Agregar).
   - propyte.com es una app Node.js de Hostinger en la cuenta `u585458211`,
     el mismo panel que brokers-yaxnah (verificado el 2026-10-14). El
     CLAUDE.md del repo, que habla de VPS + PM2, está desactualizado.
   - La herramienta de reemplazo **no** se usa: es reemplazo total y
     borraría las demás variables.
   - La ruta lee el token en tiempo de ejecución (no es `NEXT_PUBLIC_*`), así
     que basta reiniciar la app (`hosting_nodejs_restart-application`), sin
     recompilar.
   - Verificación: sin token → 401; spam con token → 200 `descartado` y nada
     nuevo en `public.leads`.
3. Crear el webhook nuevo (form_submission, **sin filtro**) hacia
   `https://propyte.com/api/webhooks/webflow-avica?token=…` y **borrar en el
   mismo paso** el `6acfba5ad7370a9f2e6a3af5`. No queda ventana en que un
   envío entre a los dos Zoho. `propyte.com` responde los POST de `/api` sin
   redirigir (verificado el 2026-10-14); un 301 haría fallar el webhook.
4. El endpoint `/api/sitio/lead` de la app de brokers **no se borra**: queda
   sin webhook. Se reaprovecha en el proyecto «independizar yaxnah.com.mx»,
   con el formulario de yaxnah.com.mx → Zoho de Yaxnáh.

**Vuelta atrás:** recrear el webhook hacia brokers-yaxnah (un minuto; su token
sigue en Hostinger) y borrar el nuevo.

## 8. Pruebas y verificación

**TDD en el repo**, rojo antes de cada verde:
1. `webflow-avica/envio`:
   - Lectura de los dos formularios.
   - Limpieza de vacíos.
   - `publishedPath` y `pageUrl`.
   - Casilla con `Field 8` y con `es_broker`.
   - Spam por trampa y por enlaces, sin confundir un correo con un enlace.
   - Formulario desconocido → ignorado.
2. `field-maps`, para las 3 fuentes:
   - Campaña, formulario, tipo y `Broker`.
   - Descripción con etiquetas, `Mensaje` y `Nombre_anuncio`.
   - Exención de newsletter.
   - `KNOWN_SOURCES` completo.
3. `resolverProyectoZoho`:
   - Página → proyecto; interés como respaldo; Real Caucel sin proyecto.
   - Mapa vacío → sin lookup.
   - `property_inquiry` idéntico a hoy.
4. Ruta del webhook: 401, 503, ignorado, descartado sin INSERT, omitido, 500
   con INSERT fallido, 200 con Zoho caído, nunca llama `sendCAPIEvents`.
5. Cron: un lead `avica_*` reconstruido desde `form_data` conserva proyecto,
   ciudad, interés y casilla.
6. `/api/leads` sin regresiones después de la extracción a `registrar-lead`.

**Antes del PR:** suite completa, `typecheck`, `lint` y **`build`**. CI verde
no garantiza que compile.

**En producción** (después del paso 2 del corte):
- Spam con token → 200 `descartado`.
- **Un lead PRUEBA de punta a punta**, con permiso explícito de Luis en el
  momento, porque «AVISO - Lead nuevo» notifica a un asesor:
  - Leer el Lead y revisar campaña, formulario, proyecto, `City` y el asesor
    asignado por la regla.
  - Confirmar que el webhook de Meta CAPI no se disparó.
  - Mandarlo a la papelera.
- Tras el corte: la primera entrega real de Webflow en los logs de Hostinger
  de propyte.com.

## 9. Riesgos y pendientes

1. **`City` en el layout de Leads de Propyte.** En el Zoho de Yaxnáh, `City` se
   aceptaba y se descartaba sin avisar. En Propyte se manda desde hace meses,
   pero se confirma en la prueba real. La ciudad va también en la descripción.
2. **El merge a `main` lo puede bloquear el clasificador** (como
   `gh pr merge`). En ese caso Luis hace el merge desde GitHub.
3. **Webflow sin publicar:** mientras tanto, la casilla llega como `Field 8` y
   no hay campo trampa. El adaptador acepta ambas formas y la regla de enlaces
   sigue atrapando el spam medido.
4. **Newsletter → Lead en Zoho:** igual que el newsletter de propyte.com, cada
   suscriptor crea un Lead «Suscriptor» y dispara el aviso al asesor. Si no se
   quiere, se apaga quitando `avica_newsletter` del adaptador (una línea).
