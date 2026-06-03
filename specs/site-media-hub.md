# Spec: Gestión de materiales audiovisuales del sitio vía Propyte Hub (Fase 2)

> Estado: **draft** | Fecha: 2026-06-03 | Proyecto: Next_Propyte_web + Propyte_hub (cross-repo)

## 1. Overview

El sitio público (Next_Propyte_web) tiene ~15 slots de imagen marcados con el componente `ImagePlaceholder` (cajas de marca con label tipo "Foto de Tulum", "Screenshot: dashboard…"). Hoy son estáticos: cambiar una foto requiere editar código y desplegar.

Esta fase construye un **registro unificado de materiales del sitio** gestionable desde el admin del Hub: Luis sube/edita cada foto o video desde una sola pantalla ("Materiales del sitio"), y la web los consume automáticamente. Si un slot no tiene material cargado, la web cae al `ImagePlaceholder` de marca actual (degradación elegante, cero páginas rotas).

Reutiliza el patrón ya probado de `Propyte_explore_categories` (colección de media gestionada por Hub + consumida por la web con fallback) y la infra de `Propyte_site_config` (key/value + `/api/public/*`).

## 2. Goals

- Una tabla `Propyte_site_media` (Supabase, schema `real_estate_hub`) como fuente de verdad de los materiales por slot.
- Una pantalla única en el Hub (`/configuracion/materiales`) que lista TODOS los slots agrupados por página, cada uno con preview + subir/quitar, soportando **imagen y video** según el slot.
- Componente `<SiteMedia>` en la web que renderiza el material real (imagen/video) o el placeholder de marca como fallback.
- Swap de los ~15 `ImagePlaceholder` ya colocados por `<SiteMedia mediaKey=…>`.
- Unificar en la misma pantalla los materiales ya gestionados (explore-categorías, videos de hero home/únete) — sin migrar su data, surfaceando sus editores actuales.
- Accesibilidad: `alt` (ES/EN) obligatorio por slot; `prefers-reduced-motion` respetado en video autoplay.

## 3. Non-Goals

- NO migrar la data de `Propyte_explore_categories` ni de los videos de hero a `Propyte_site_media` (solo se surfacean/enlazan en la pantalla; siguen con su editor actual).
- NO media por idioma (la foto/video es única por slot; solo el `alt` es ES/EN). Excepción puntual si un slot lo requiere → se documenta aparte.
- NO galería multi-imagen por slot (un material por slot). Las galerías de fichas (desarrollo/unidad) siguen con su flujo actual.
- NO CDN/transformaciones nuevas (se usa Supabase Storage + next/Image como hoy).
- NO promover a producción (`develop → main`) en esta fase: todo queda en staging.

## 4. Context y constraints

**Estado actual relevante:**
- Web consume el Hub vía `src/lib/hub-content.ts` → `fetchJson()` con `PROPYTE_HUB_URL`, helpers `getSiteConfig()`, `getExploreCategories()`, `getFaqs()`, con `withTag()` (cache + revalidate).
- `ImagePlaceholder` ya existe en `src/components/shared/ImagePlaceholder.tsx` (tone light/dark, icon, label). Los slots ya están colocados con comentarios `TODO(media)`.
- Hub: config en tabla `Propyte_site_config` (key/value), expuesta por `src/app/api/public/site-config/route.ts` → `{ config: {key:value} }`; editada en `(dashboard)/configuracion/sitio/`.
- Hub: subida a Storage vía `api/images/sign` + `api/images/upload` (con `bucketForEntity`), patrón firmado replicado en `api/admin/explore-categories/image-sign`.
- Hub: precedente completo `Propyte_explore_categories` → `api/admin/explore-categories` (POST/PATCH) + `api/public/explore-categories` + web `getExploreCategories()` con fallback a Unsplash.
- Tablas del Hub usan prefijo `Propyte_*` en schema `real_estate_hub`.

**Dependencias:** Supabase (oaijxdpevakashxshhvm), Storage; Next.js 16 (ambos repos); next-intl; next/Image (requiere host del bucket en `images.remotePatterns`).

**Constraints:**
- Migraciones DDL en prod las gatea el harness → entregar SQL al usuario o aplicar con frase exacta `autorizado: aplicar <name> a prod`.
- Schema nuevo/tabla nueva requiere `GRANT USAGE`+tabla a `anon` y a `service_role` (+ DEFAULT PRIVILEGES) — ver feedback de grants previos.
- Buckets requieren mime whitelist por bucket.
- Web staging: `vercel --prod`. Hub: deploy propio (git pull + PM2 / Hostinger) — NO Vercel.
- `next/Image` necesita el dominio público del bucket Supabase en `next.config.ts` `images.remotePatterns` (verificar si ya está).

**Stakeholders:** Luis (uploader/admin), Nacho (aprobación de contenido).

## 5. Requirements

### 5.1 Funcionales
- [ ] Tabla `Propyte_site_media(key text PK, kind text check in ('image','video'), url text, alt_es text, alt_en text, updated_at timestamptz default now())` en `real_estate_hub`.
- [ ] Bucket Storage `site-media` (público, mime whitelist `image/jpeg,image/png,image/webp,video/mp4`).
- [ ] Catálogo de slots como constante compartida en la web `src/lib/site-media/slots.ts` (`SITE_MEDIA_SLOTS`: `{ key, kind, group, labelEs, labelEn, recommendedAspect }`). El Hub consume el mismo catálogo (copia o endpoint) para saber qué slots listar.
- [ ] Hub `GET /api/public/site-media` → `{ media: { [key]: { url, kind, alt_es, alt_en } } }`.
- [ ] Hub `POST/PATCH/DELETE /api/admin/site-media` (auth admin) para upsert/limpiar un slot; valida `key ∈ catálogo` y `kind`.
- [ ] Hub `(dashboard)/configuracion/materiales/`: lista slots agrupados por página; cada slot con preview, uploader (imagen: sign+upload a `site-media`; video: upload mp4 O input URL YouTube/Drive), campos `alt_es`/`alt_en`, botón quitar.
- [ ] La pantalla incluye accesos a los editores existentes de explore-categorías y videos de hero (enlace/panel embebido), sin moverlos.
- [ ] Web `getSiteMedia()` en `hub-content.ts` (fetchJson + `withTag('hub:site-media')`).
- [ ] Componente web `<SiteMedia mediaKey kind label className tone fallbackIcon>`: resuelve la url del slot; si existe → `next/Image` (image) o `<video muted playsInline>`/iframe (video); si no → `<ImagePlaceholder>`.
- [ ] Swap de los ~15 `ImagePlaceholder` por `<SiteMedia>` con su `mediaKey`.
- [ ] Páginas client (`brokers`, `desarrolladores`): su `page.tsx` (server) llama `getSiteMedia()` y pasa el mapa por props al content client; `<SiteMedia>` acepta el mapa por prop/context para no fetchear en cliente.
- [ ] Revalidación: el Hub dispara `/api/revalidate` (tag `hub:site-media`) al guardar, como otros editores.

### 5.2 No funcionales
- **Accesibilidad:** `alt` obligatorio (ES/EN); si falta, el admin avisa. Video decorativo → `muted` + sin audio crítico; respetar `prefers-reduced-motion` (no autoplay si el usuario lo pide).
- **Performance:** `next/Image` con `sizes` correctos; video `preload="metadata"`/`poster`; lazy donde no sea LCP.
- **SEO:** no romper LCP del hero; mantener dimensiones reservadas (sin layout shift) — `SiteMedia` conserva el `aspect/className` del placeholder.
- **Seguridad:** escritura solo service_role / admin auth del Hub; bucket con mime whitelist; validar `key` contra catálogo (no escritura arbitraria).
- **Marca:** tokens Propyte; fallback idéntico al placeholder actual (cero regresión visual cuando no hay media).

## 6. Approach / Arquitectura propuesta

```
Hub admin (configuracion/materiales)
  → upload a Storage bucket `site-media` (sign+upload)  ── Supabase Storage
  → upsert Propyte_site_media (api/admin/site-media)    ── Supabase DB (real_estate_hub)
  → POST /api/revalidate (tag hub:site-media)
        │
        ▼ (API pública)
Hub  GET /api/public/site-media → { media: {key:{url,kind,alt}} }
        │
        ▼ (fetchJson + withTag, revalidate)
Web  getSiteMedia()  → mapa
        │
        ▼
Web  <SiteMedia mediaKey> → Image/video real  | fallback <ImagePlaceholder>
```

**Archivos nuevos (web):** `src/lib/site-media/slots.ts` (catálogo), `src/components/shared/SiteMedia.tsx`, helper `getSiteMedia()` en `src/lib/hub-content.ts`.
**Archivos tocados (web):** las ~15 páginas con `ImagePlaceholder` (swap a `<SiteMedia>`); `next.config.ts` (remotePatterns del bucket si falta); `brokers/page.tsx` + `desarrolladores/page.tsx` (fetch + pasar mapa).
**Archivos nuevos (Hub):** `src/app/(dashboard)/configuracion/materiales/page.tsx` + client; `src/app/api/admin/site-media/route.ts`; `src/app/api/public/site-media/route.ts`; reuso de `images/sign`+`images/upload` con bucket `site-media`.
**Migración (Supabase):** tabla + RLS (SELECT anon, escritura service_role) + GRANTs + bucket + policy de Storage.

**Decisiones clave:**
- Tabla dedicada (no `site_config` key/value): modela `kind`/`alt`/preview y escala; mismo patrón que `Propyte_explore_categories`. *(Alt. descartada: keys en `Propyte_site_config` — UX y modelo pobres para media.)*
- Catálogo en código (no en BD): el set de slots lo define el código de la web (donde viven los `<SiteMedia>`); la tabla solo guarda lo subido → no hay drift entre slots renderizados y editables.
- Fallback en el componente (no en query): si la web no alcanza el Hub o el slot está vacío, se ve el placeholder (resiliente).

## 7. Acceptance Criteria
- [ ] Subir una foto a `city.tulum` en el Hub → aparece en `/es/desarrollos/tulum` (tras revalidate) reemplazando el placeholder; en `/en/` con su `alt_en`.
- [ ] Subir un video (mp4 o URL) a un slot `kind=video` → se reproduce (muted/inline) o embebe; respeta reduced-motion.
- [ ] Quitar el material de un slot → la web vuelve al placeholder sin error.
- [ ] Un slot sin material nunca rompe la página (fallback siempre).
- [ ] La pantalla "Materiales del sitio" lista los ~15 slots agrupados por página + accesos a explore-categorías y videos de hero.
- [ ] `tsc` + `eslint` limpios en ambos repos; build Vercel (web) y build Hub OK.
- [ ] `alt` faltante → el admin lo señala antes de permitir guardar (o guarda con aviso).
- [ ] Sin layout shift: el slot reserva el mismo espacio que el placeholder.

## 8. Riesgos y mitigaciones
| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| `next/Image` rechaza el host del bucket | M | M | Agregar dominio Supabase a `images.remotePatterns` en `next.config.ts` (verificar si ya está por las galerías) |
| Migración prod gateada por harness | A | B | Entregar SQL al usuario o aplicar con frase exacta de autorización |
| Subida de video grande excede límite Storage | M | M | Límite de tamaño + permitir URL externa (YouTube/Drive) como alternativa |
| Deploy Hub separado del web (desincronización) | M | M | Coordinar: API pública del Hub debe existir antes del swap web; fallback cubre el intervalo |
| Páginas client no pueden fetchear server-side | M | B | `page.tsx` server pasa el mapa por props/context a los content client |
| `key` arbitraria escrita en BD | B | M | Validar contra catálogo en `api/admin/site-media` |

## 9. Open Questions
- ¿Bucket `site-media` nuevo o reutilizar uno existente con whitelist ampliada? (propuesta: nuevo, dedicado).
- ¿Límite de tamaño para subida de video directo, o forzar URL externa arriba de cierto peso? (propuesta: ~50 MB mp4, sino URL).
- ¿`zona.*` es un slot genérico (una foto para todas las zonas) o por-slug (foto por zona)? (propuesta inicial: genérico; por-slug si se requiere).
- ¿La copia del catálogo en el Hub se mantiene a mano o se expone un `/api/public/site-media-slots` desde la web? (propuesta: constante duplicada simple; endpoint si crece).
- ¿Orden de deploy preferido (Hub primero, luego web)? (propuesta: Hub API → web swap).

## 10. Plan de tareas (preliminar)

**Supabase (migración — gateada):**
- [ ] T1 — SQL: tabla `Propyte_site_media` + RLS + GRANTs (anon SELECT, service_role full) + DEFAULT PRIVILEGES.
- [ ] T2 — SQL/Storage: bucket `site-media` + policy + mime whitelist; verificar `images.remotePatterns` en web `next.config.ts`.

**Hub (Propyte_hub):**
- [ ] T3 — `api/public/site-media/route.ts` (GET → `{media}`).
- [ ] T4 — `api/admin/site-media/route.ts` (POST/PATCH/DELETE, auth, valida key/kind) + revalidate tag.
- [ ] T5 — `(dashboard)/configuracion/materiales/` pantalla: lista catálogo agrupado, uploader imagen (sign+upload a `site-media`), video (mp4/URL), alt ES/EN, quitar. Reusa componentes de subida existentes.
- [ ] T6 — Surface en la pantalla: accesos a explore-categorías + videos de hero (enlaces/paneles), sin migrar data. Entrada en nav de `configuracion`.

**Web (Next_Propyte_web):**
- [ ] T7 — `src/lib/site-media/slots.ts` (catálogo `SITE_MEDIA_SLOTS`).
- [ ] T8 — `getSiteMedia()` en `hub-content.ts` (fetchJson + withTag).
- [ ] T9 — `src/components/shared/SiteMedia.tsx` (image/video + fallback `ImagePlaceholder`; acepta mapa por prop para páginas client).
- [ ] T10 — Swap `ImagePlaceholder` → `<SiteMedia>` en páginas server (city, zona, quienes-somos, estructura, metodologia, como-comprar, como-invertir, contacto, built).
- [ ] T11 — `brokers/page.tsx` + `desarrolladores/page.tsx`: fetch `getSiteMedia()` + pasar mapa a content client; swap sus placeholders.
- [ ] T12 — `next.config.ts` remotePatterns si falta; verificar tsc/eslint.

**Verificación/deploy:**
- [ ] T13 — Deploy Hub (API + admin) → smoke. Deploy web staging (`vercel --prod`) → subir 1 foto de prueba, verificar render + fallback. Screenshots.
