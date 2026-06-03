# Pop-ups de biografía + imágenes protagonistas del equipo

**Fecha:** 2026-06-03
**Autor:** Luis Flores (vía Claude)
**Tipo:** Feature cross-repo (Supabase + Propyte_hub + Next_Propyte_web)
**Estado:** Aprobado — listo para plan de implementación

## Problema / objetivo

En `propyte.com` (sección Nosotros):

1. Las fotos del **equipo comercial** (`/nosotros/equipo-comercial`) se ven pequeñas y poco protagónicas (avatar 96px en una card plana).
2. No hay forma de ver una **biografía** de cada persona. Luis quiere que tanto las cards del equipo comercial como las 4 tarjetas de líderes del organigrama (`/nosotros/estructura`) abran un **pop-up** con mini-biografía: nombre, posición y trayectoria.

## Decisiones tomadas (brainstorming)

| Decisión | Elección |
|----------|----------|
| Fuente del contenido de bios | **Campo nuevo en el Hub** (editable por Luis, expuesto en Supabase) |
| Idioma de la trayectoria | **Bilingüe** — `bio_long` (ES) + `bio_long_en` (EN), fallback EN→ES |
| Contenido del pop-up | **Solo `bio_long`** (no reusa `bio_short`); si está vacío no se ofrece pop-up |
| Dirección visual de imágenes | **Avatares más grandes + card mejorada** (no full-bleed) |
| Líderes clickables en Estructura | **CEO + 3 directores** (tarjetas tope del organigrama) |
| Equipo comercial: WhatsApp en pop-up | **Sí**, dentro del modal |
| Arquitectura del modal | **Componente cliente único reutilizable** `TeamBioModal`, sin dependencias nuevas (Framer Motion ya instalado) |

## Arquitectura de datos (confirmada)

- Tabla base única: `real_estate_hub.team_members`.
- Dos vistas la consumen:
  - `v_team_members` → `WHERE active AND level <> 'department' AND show_in_team_page` (equipo comercial). Hoy expone: name, role, city, email, phone, whatsapp, photo_url, bio_short, sort_order, level, department_name, reports_to_id, role_code, role_color, is_corporate, is_vacant, show_in_org_chart, show_in_team_page, created_at, updated_at.
  - `v_org_structure` → `WHERE active AND (level = 'department' OR show_in_org_chart)` (organigrama). Hoy expone: id, name, role, level, department_name, reports_to_id, icon_name, role_code, role_color, is_corporate, is_vacant, sort_order. **No** expone photo_url, city ni bios.

## Componentes del cambio

### 1. Supabase — migration `032`

DDL (entregado a Luis para aplicar con frase autorizada; el harness bloquea DDL en prod):

```sql
-- 1. Columnas nuevas en la tabla base
ALTER TABLE real_estate_hub.team_members
  ADD COLUMN IF NOT EXISTS bio_long    text,
  ADD COLUMN IF NOT EXISTS bio_long_en text;

-- 2. v_team_members: agregar bio_long, bio_long_en AL FINAL
--    (CREATE OR REPLACE VIEW no permite reordenar columnas existentes)
CREATE OR REPLACE VIEW real_estate_hub.v_team_members AS
SELECT id, name, role, city, email, phone, whatsapp, photo_url, bio_short,
       sort_order, level, department_name, reports_to_id, role_code, role_color,
       is_corporate, is_vacant, show_in_org_chart, show_in_team_page,
       created_at, updated_at,
       bio_long, bio_long_en           -- nuevas, al final
FROM real_estate_hub.team_members
WHERE active = true AND level <> 'department' AND show_in_team_page = true;

-- 3. v_org_structure: agregar photo_url, city, bio_long, bio_long_en AL FINAL
CREATE OR REPLACE VIEW real_estate_hub.v_org_structure AS
SELECT id, name, role, level, department_name, reports_to_id, icon_name,
       role_code, role_color, is_corporate, is_vacant, sort_order,
       photo_url, city, bio_long, bio_long_en   -- nuevas, al final
FROM real_estate_hub.team_members
WHERE active = true AND (level = 'department' OR show_in_org_chart = true);
```

- Las vistas ya tienen `GRANT SELECT TO anon`; agregar columnas no cambia la postura RLS. Verificar post-apply con `SET LOCAL ROLE anon; SELECT count(*) FROM real_estate_hub.v_org_structure;`.
- Frase de autorización requerida: `autorizado: aplicar 032_team_bio_long a prod`.

### 2. Propyte_hub — form de `/equipo`

Archivos:
- `src/app/(dashboard)/equipo/TeamManager.tsx`:
  - `FormState`: agregar `bio_long: string`, `bio_long_en: string`.
  - `EMPTY_FORM`: inicializar ambos a `""`.
  - `openEdit`: mapear `m.bio_long ?? ""`, `m.bio_long_en ?? ""`.
  - `payload` en `handleSave`: agregar `bio_long: form.bio_long.trim() || null`, `bio_long_en: form.bio_long_en.trim() || null`.
  - UI: dos `<textarea>` (**Trayectoria (ES)** / **Trayectoria — English**) debajo del campo "Bio corta", agrupadas como "biografía extendida (pop-up del sitio)". Sin `maxLength` estricto (o uno generoso, p.ej. 2000).
- `src/lib/types.ts` (tipo `TeamMember`): agregar `bio_long: string | null`, `bio_long_en: string | null`.
- API `/api/team` (POST) y `/api/team/[id]` (PATCH): agregar ambos campos a la whitelist de payload aceptado/persistido.

Sin migración propia del Hub; solo pasa los campos a Supabase (service role).

### 3. Next_Propyte_web

**Componente nuevo — `src/components/shared/TeamBioModal.tsx`** (client):
- Props: `{ open, onClose, person }` donde `person` = `{ name, role, city?, photoUrl?, bio, whatsappLink? }` (bio ya resuelto al locale por el caller).
- Accesibilidad: `role="dialog"`, `aria-modal`, focus-trap, cierre con Esc, click en backdrop, `body` scroll-lock mientras abre. Animación entrada/salida con Framer Motion (`AnimatePresence`); **el nodo se mantiene montado y `pointer-events` se controla por estado** para evitar el bug de exit que bloquea clicks (ver memoria `feedback_framer_motion_exit_pointer_events`).
- Layout: foto grande arriba/lado, nombre (H), rol (eyebrow/sub), ciudad con icono, trayectoria (texto), CTA WhatsApp opcional. Tokens de marca Propyte.

**Helper de locale para bio:**
- `function pickBio(locale, bio_long, bio_long_en)` → en `en` usa `bio_long_en || bio_long`; en `es` usa `bio_long`. Devuelve `null`/`""` si no hay nada (→ no se ofrece pop-up).

**`/nosotros/equipo-comercial`:**
- `src/lib/supabase/queries.ts` → `TeamMemberRow`: agregar `bio_long: string | null`, `bio_long_en: string | null` (la query es `select('*')`, ya los traerá).
- Nuevo wrapper cliente `src/app/[locale]/nosotros/equipo-comercial/_components/EquipoBios.tsx`: recibe `teamMembers` + `locale` desde el server page y renderiza la grilla + el modal (estado `selected`).
- El server `page.tsx` deja de renderizar la grilla inline y delega en `<EquipoBios>`.
- Visual: avatar de 96px → **~144px** (`w-36 h-36`), `object-cover object-top`, card con hover/elevación más marcada y mejor jerarquía. Card clickable solo si hay bio resuelto; si no, queda como hoy (no clickable).
- El pop-up incluye botón WhatsApp (misma lógica `buildWhatsappLink`).

**`/nosotros/estructura`:**
- `src/lib/supabase/queries.ts` → `OrgNodeRow`: agregar `photo_url: string | null`, `city: string | null`, `bio_long: string | null`, `bio_long_en: string | null`. (`getOrgStructure` usa `select('*')`.)
- `EstructuraPageContent.tsx` (ya es client): `OrgCard` recibe el nodo completo; para nivel `ceo` y `director`, si hay bio resuelto, se vuelve clickable (`role="button"`, `tabIndex`, teclado Enter/Espacio, cursor/hover) → abre `TeamBioModal`. Departamentos (`DeptAccordion`) y miembros internos no cambian.
- Estado del modal a nivel de `EstructuraPageContent`.

**i18n (`src/messages/es.json` + `en.json`, en paralelo):**
- `equipoPage.viewProfile` ("Ver perfil" / "View profile") o equivalente para el affordance de la card.
- `a11y`/modal: `closeModal`, `bioModalLabel`, etc.
- Nunca dejar una key sin traducir en ambos archivos.

**ui-ux-pro:** consultar el MCP antes de construir card + modal; anotar pattern + takeaways en el commit (regla del proyecto).

## Flujo de datos

```
team_members (bio_long, bio_long_en)
  → v_team_members  → getTeamMembers → EquipoBios (client) → TeamBioModal
  → v_org_structure → getOrgStructure → EstructuraPageContent → TeamBioModal
```

## Manejo de errores / edge cases

- Sin bio (`bio_long`/`_en` vacíos): card NO clickable, sin botón "ver perfil", sin pop-up vacío.
- `photo_url` null en pop-up: fallback al avatar de iniciales (mismo patrón actual).
- Query falla: ambas queries ya devuelven `[]` suave; la página no rompe.
- Locale `en` sin `bio_long_en`: fallback a `bio_long` (ES).
- Modal exit: nodo montado + `pointerEvents` por estado (evita clicks fantasma).

## Rollout (orden seguro)

1. Aplicar migration `032` en Supabase (Luis, frase autorizada).
2. Deploy Hub (form `/equipo`) — Luis ya puede capturar trayectorias.
3. Deploy Web — rama nueva desde `develop` (hay ramas activas; verificar `git branch --show-current` antes de commitear). Staging por Vercel CLI; prod por push a `main` (con autorización).

La web nunca pide columnas inexistentes porque el orden aplica datos primero; aun si se invierte, las queries `select('*')` toleran columnas faltantes degradando suave.

## Testing

- `tsc --noEmit` limpio en Hub y Web.
- Playwright e2e en Web:
  - Abrir/cerrar modal: click en card/tarjeta, tecla Esc, click en backdrop, navegación por teclado.
  - `/es` y `/en` (bio correcto por locale + fallback).
  - Mobile 375px (modal scrollable, no clipa).
  - Verificar HTML real (no solo screenshot headless) por glass/backdrop.
- Hub: alta/edición de un miembro con `bio_long` + `bio_long_en`, confirmar persistencia.

## Fuera de alcance (YAGNI)

- Migrar `bio_short` a bilingüe (se queda mono-idioma como hoy).
- Página individual por persona / rutas `/equipo/[slug]`.
- Rich text en la trayectoria (texto plano por ahora).
- Reordenar columnas existentes de las vistas.
