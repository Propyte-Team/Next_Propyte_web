# Pop-ups de biografía + imágenes protagonistas del equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar pop-ups (modal) con biografía/trayectoria a las cards del equipo comercial y a las tarjetas de líderes (CEO + 3 directores) del organigrama en `propyte.com`, y hacer más protagónicas las fotos del equipo comercial.

**Architecture:** Feature cross-repo. Una columna nueva bilingüe (`bio_long`, `bio_long_en`) en `real_estate_hub.team_members`, expuesta en las vistas `v_team_members` y `v_org_structure`. El Hub gana 2 textareas para capturarla. El web gana un componente cliente reutilizable `TeamBioModal` (modelado sobre el modal accesible existente `GlossaryLeadGateModal`) consumido por la página de equipo comercial (refactorizada a un wrapper cliente `EquipoBios`) y por la página de estructura (ya cliente).

**Tech Stack:** Next.js 16 (App Router, RSC + client components), TypeScript, Tailwind CSS 4, next-intl, Supabase JS, Zod (Hub API), Playwright (e2e). Sin dependencias nuevas.

---

## File Structure

**Supabase** (vía MCP `apply_migration`, autorizado por Luis):
- Migration `032_team_bio_long` — `ALTER TABLE` + 2 `CREATE OR REPLACE VIEW`.

**Propyte_hub** (repo `c:\Users\ptoral\Projects\Propyte_hub`):
- Modify `src/lib/types.ts` — añadir `bio_long`, `bio_long_en` al `interface TeamMember`.
- Modify `src/app/api/team/route.ts` — `CreateSchema` + `insertRow`.
- Modify `src/app/api/team/[id]/route.ts` — `PatchSchema`.
- Modify `src/app/(dashboard)/equipo/TeamManager.tsx` — `FormState`, `EMPTY_FORM`, `openEdit`, `payload`, UI.

**Next_Propyte_web** (repo `c:\Users\ptoral\Projects\Next_Propyte_web`):
- Create `src/lib/team-bio.ts` — helper `pickBio` + tipo `TeamBioPerson`.
- Create `src/components/shared/TeamBioModal.tsx` — modal accesible reutilizable.
- Create `src/app/[locale]/nosotros/equipo-comercial/_components/EquipoBios.tsx` — grid + modal (client).
- Modify `src/lib/supabase/queries.ts` — `TeamMemberRow` + `OrgNodeRow`.
- Modify `src/app/[locale]/nosotros/equipo-comercial/page.tsx` — delegar grid a `EquipoBios`.
- Modify `src/app/[locale]/nosotros/estructura/EstructuraPageContent.tsx` — `OrgCard` clickable (ceo/director) + modal.
- Modify `src/i18n/messages/es.json` + `src/i18n/messages/en.json` — namespace `teamBio`.
- Create `tests/e2e/team-bio-modal.spec.ts` — e2e del modal.

**Nota de testing:** el web usa Playwright e2e (`npm run test:e2e`); **no** hay Vitest configurado y NO se introduce (YAGNI). La lógica pura (`pickBio`) se cubre indirectamente vía e2e (locale EN muestra bio EN) y `tsc --noEmit`. El Hub no tiene runner de tests para estas rutas; se verifica con `tsc --noEmit` + prueba manual de alta/edición.

**Orden de ejecución (rollout seguro):** Task 1 (Supabase) → Tasks 2-3 (Hub) → Tasks 4-9 (Web).

---

## Task 1: Supabase — migration 032 (columnas + vistas)

**Files:**
- Aplicar vía MCP `mcp__claude_ai_Supabase__apply_migration` con `name: "032_team_bio_long"`, `project_id: "oaijxdpevakashxshhvm"`.

> ⚠️ El harness bloquea DDL en prod sin autorización explícita. El ejecutor DEBE obtener de Luis la frase exacta `autorizado: aplicar 032_team_bio_long a prod` antes de llamar `apply_migration`. Si no la da, entregar el SQL para que lo corra él en el SQL editor de Supabase.

- [ ] **Step 1: Obtener autorización de Luis**

Pedir textualmente: `autorizado: aplicar 032_team_bio_long a prod`. No continuar sin ella.

- [ ] **Step 2: Aplicar la migración**

`name`: `032_team_bio_long`. `query`:

```sql
-- 1. Columnas nuevas (bilingüe) en la tabla base
ALTER TABLE real_estate_hub.team_members
  ADD COLUMN IF NOT EXISTS bio_long    text,
  ADD COLUMN IF NOT EXISTS bio_long_en text;

-- 2. v_team_members: columnas nuevas AL FINAL del SELECT
--    (CREATE OR REPLACE VIEW no permite reordenar columnas existentes)
CREATE OR REPLACE VIEW real_estate_hub.v_team_members AS
SELECT id, name, role, city, email, phone, whatsapp, photo_url, bio_short,
       sort_order, level, department_name, reports_to_id, role_code, role_color,
       is_corporate, is_vacant, show_in_org_chart, show_in_team_page,
       created_at, updated_at,
       bio_long, bio_long_en
FROM real_estate_hub.team_members
WHERE active = true AND level <> 'department' AND show_in_team_page = true;

-- 3. v_org_structure: photo_url, city, bio_long, bio_long_en AL FINAL
CREATE OR REPLACE VIEW real_estate_hub.v_org_structure AS
SELECT id, name, role, level, department_name, reports_to_id, icon_name,
       role_code, role_color, is_corporate, is_vacant, sort_order,
       photo_url, city, bio_long, bio_long_en
FROM real_estate_hub.team_members
WHERE active = true AND (level = 'department' OR show_in_org_chart = true);
```

- [ ] **Step 3: Verificar columnas + GRANT anon intacto**

Run (vía `mcp__claude_ai_Supabase__execute_sql`):

```sql
SET LOCAL ROLE anon;
SELECT bio_long, bio_long_en FROM real_estate_hub.v_team_members LIMIT 1;
SELECT photo_url, city, bio_long, bio_long_en FROM real_estate_hub.v_org_structure LIMIT 1;
```

Expected: ambas queries devuelven filas sin error de permiso (columnas existen, anon puede leer). Si da `permission denied`, revisar GRANT (no debería cambiar — solo se agregaron columnas).

---

## Task 2: Hub — tipo TeamMember + schemas de API

**Files:**
- Modify: `c:\Users\ptoral\Projects\Propyte_hub\src\lib\types.ts:94`
- Modify: `c:\Users\ptoral\Projects\Propyte_hub\src\app\api\team\route.ts:28` y `:113`
- Modify: `c:\Users\ptoral\Projects\Propyte_hub\src\app\api\team\[id]\route.ts:23`

- [ ] **Step 1: Añadir campos al `interface TeamMember`**

En `types.ts`, después de la línea `bio_short: string | null;` (línea 94):

```typescript
  bio_short: string | null;
  bio_long: string | null;
  bio_long_en: string | null;
```

- [ ] **Step 2: `CreateSchema` (POST) acepta los campos**

En `api/team/route.ts`, dentro de `CreateSchema`, después de la línea `bio_short: z.string().max(280).optional().nullable(),`:

```typescript
  bio_short: z.string().max(280).optional().nullable(),
  bio_long: z.string().max(2000).optional().nullable(),
  bio_long_en: z.string().max(2000).optional().nullable(),
```

- [ ] **Step 3: `insertRow` (POST) persiste los campos**

En `api/team/route.ts`, dentro de `insertRow`, después de `bio_short: parsed.data.bio_short ?? null,`:

```typescript
    bio_short: parsed.data.bio_short ?? null,
    bio_long: parsed.data.bio_long ?? null,
    bio_long_en: parsed.data.bio_long_en ?? null,
```

- [ ] **Step 4: `PatchSchema` (PATCH) acepta los campos**

En `api/team/[id]/route.ts`, dentro de `PatchSchema`, después de `bio_short: z.string().max(280).nullable().optional(),`:

```typescript
    bio_short: z.string().max(280).nullable().optional(),
    bio_long: z.string().max(2000).nullable().optional(),
    bio_long_en: z.string().max(2000).nullable().optional(),
```

(El PATCH usa `hub().update(parsed.data)`, así que no requiere cambio adicional — la whitelist `.strict()` ya los pasa.)

- [ ] **Step 5: Typecheck**

Run: `cd /c/Users/ptoral/Projects/Propyte_hub && npx tsc --noEmit`
Expected: sin errores nuevos relacionados con `bio_long`/`bio_long_en`.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add src/lib/types.ts src/app/api/team/route.ts "src/app/api/team/[id]/route.ts"
git commit -m "feat(equipo): API acepta bio_long y bio_long_en

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Hub — form de /equipo (textareas de trayectoria)

**Files:**
- Modify: `c:\Users\ptoral\Projects\Propyte_hub\src\app\(dashboard)\equipo\TeamManager.tsx`

- [ ] **Step 1: Añadir campos a `FormState`**

En `TeamManager.tsx`, dentro de `type FormState`, después de `bio_short: string;` (línea 31):

```typescript
  bio_short: string;
  bio_long: string;
  bio_long_en: string;
```

- [ ] **Step 2: Inicializar en `EMPTY_FORM`**

Después de `bio_short: "",` (línea 53):

```typescript
  bio_short: "",
  bio_long: "",
  bio_long_en: "",
```

- [ ] **Step 3: Mapear en `openEdit`**

Después de `bio_short: m.bio_short ?? "",` (línea 115):

```typescript
      bio_short: m.bio_short ?? "",
      bio_long: m.bio_long ?? "",
      bio_long_en: m.bio_long_en ?? "",
```

- [ ] **Step 4: Incluir en `payload` de `handleSave`**

Después de `bio_short: form.bio_short.trim() || null,` (línea 157):

```typescript
        bio_short: form.bio_short.trim() || null,
        bio_long: form.bio_long.trim() || null,
        bio_long_en: form.bio_long_en.trim() || null,
```

- [ ] **Step 5: Añadir las textareas en el modal**

En el JSX, reemplazar el bloque del `Field` de "Bio corta" (líneas ~768-776) por ese mismo bloque seguido de las dos nuevas textareas:

```tsx
              <Field label={`Bio corta (${form.bio_short.length}/280)`}>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  maxLength={280}
                  value={form.bio_short}
                  onChange={(e) => setForm((f) => ({ ...f, bio_short: e.target.value }))}
                  placeholder="1-3 líneas describiendo experiencia y especialidad."
                />
              </Field>

              <fieldset className="border border-slate-200 rounded-xl p-4 space-y-4">
                <legend className="text-xs font-semibold text-slate-600 px-2">
                  Trayectoria (pop-up en propyte.com)
                </legend>
                <Field label={`Trayectoria — Español (${form.bio_long.length}/2000)`}>
                  <textarea
                    className={`${inputCls} min-h-[120px]`}
                    maxLength={2000}
                    value={form.bio_long}
                    onChange={(e) => setForm((f) => ({ ...f, bio_long: e.target.value }))}
                    placeholder="Biografía/trayectoria completa que aparece al hacer clic en la card o tarjeta del organigrama."
                  />
                </Field>
                <Field label={`Trayectoria — English (${form.bio_long_en.length}/2000)`}>
                  <textarea
                    className={`${inputCls} min-h-[120px]`}
                    maxLength={2000}
                    value={form.bio_long_en}
                    onChange={(e) => setForm((f) => ({ ...f, bio_long_en: e.target.value }))}
                    placeholder="English version. Si se deja vacío, /en muestra la versión en español."
                  />
                </Field>
              </fieldset>
```

(El `inputCls`, `Field` y `textarea` ya existen en el archivo — mismo patrón que `bio_short`.)

- [ ] **Step 6: Typecheck**

Run: `cd /c/Users/ptoral/Projects/Propyte_hub && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Verificación manual (dev)**

Run: `cd /c/Users/ptoral/Projects/Propyte_hub && npm run dev`, abrir `/equipo`, editar un miembro, llenar Trayectoria ES + EN, guardar. Expected: toast "Miembro actualizado", y al reabrir el editor los textos persisten.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/ptoral/Projects/Propyte_hub
git add "src/app/(dashboard)/equipo/TeamManager.tsx"
git commit -m "feat(equipo): textareas de trayectoria ES/EN en el form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Web — rama nueva + i18n (namespace teamBio)

**Files:**
- Modify: `c:\Users\ptoral\Projects\Next_Propyte_web\src\i18n\messages\es.json`
- Modify: `c:\Users\ptoral\Projects\Next_Propyte_web\src\i18n\messages\en.json`

- [ ] **Step 1: Crear rama de feature desde develop**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git fetch origin
git checkout develop && git pull --ff-only
git checkout -b feat/equipo-bios-popups
```

Expected: rama `feat/equipo-bios-popups` activa (verificar con `git branch --show-current`). Si `develop` tiene divergencia, detenerse y avisar a Luis.

- [ ] **Step 2: Añadir namespace `teamBio` a `es.json`**

Insertar como nueva clave de nivel raíz (p.ej. justo después del bloque `"equipoPage": { ... }`):

```json
  "teamBio": {
    "viewProfile": "Ver perfil",
    "close": "Cerrar",
    "whatsapp": "WhatsApp",
    "modalLabel": "Perfil del equipo"
  },
```

- [ ] **Step 3: Añadir el mismo namespace a `en.json`**

En el lugar equivalente de `en.json`:

```json
  "teamBio": {
    "viewProfile": "View profile",
    "close": "Close",
    "whatsapp": "WhatsApp",
    "modalLabel": "Team profile"
  },
```

- [ ] **Step 4: Validar JSON**

Run:
```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
node -e "require('./src/i18n/messages/es.json');require('./src/i18n/messages/en.json');console.log('JSON OK')"
```
Expected: `JSON OK` (sin error de parseo por coma colgante).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/messages/es.json src/i18n/messages/en.json
git commit -m "feat(equipo): i18n namespace teamBio (modal de biografía)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Web — tipos de query + helper pickBio

**Files:**
- Create: `c:\Users\ptoral\Projects\Next_Propyte_web\src\lib\team-bio.ts`
- Modify: `c:\Users\ptoral\Projects\Next_Propyte_web\src\lib\supabase\queries.ts:790` y `:843`

- [ ] **Step 1: Crear helper + tipo compartido**

`src/lib/team-bio.ts`:

```typescript
/**
 * Resuelve la trayectoria (bio larga) según el locale.
 * EN: usa bio_long_en y cae a bio_long (ES) si está vacío.
 * ES: usa solo bio_long (sin fallback a EN).
 * Devuelve null si no hay contenido → no se ofrece pop-up.
 */
export function pickBio(
  locale: string,
  bioLong: string | null | undefined,
  bioLongEn: string | null | undefined,
): string | null {
  const es = (bioLong ?? '').trim();
  const en = (bioLongEn ?? '').trim();
  if (locale === 'en') return en || es || null;
  return es || null;
}

/** Datos que consume <TeamBioModal>. El caller resuelve bio + whatsappLink. */
export interface TeamBioPerson {
  name: string;
  role: string;
  city?: string | null;
  photoUrl?: string | null;
  bio: string;
  whatsappLink?: string | null;
}
```

- [ ] **Step 2: Extender `TeamMemberRow`**

En `queries.ts`, dentro de `interface TeamMemberRow`, después de `bio_short: string | null;` (línea 790):

```typescript
  bio_short: string | null;
  bio_long: string | null;
  bio_long_en: string | null;
```

- [ ] **Step 3: Extender `OrgNodeRow`**

En `queries.ts`, dentro de `interface OrgNodeRow`, después de `sort_order: number;` (línea 843):

```typescript
  sort_order: number;
  photo_url: string | null;
  city: string | null;
  bio_long: string | null;
  bio_long_en: string | null;
```

(Ambas queries usan `.select('*')`, así que ya traen las columnas nuevas de la vista; solo falta el tipo.)

- [ ] **Step 4: Typecheck**

Run: `cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/team-bio.ts src/lib/supabase/queries.ts
git commit -m "feat(equipo): tipos bio_long + helper pickBio

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Web — componente TeamBioModal

**Files:**
- Create: `c:\Users\ptoral\Projects\Next_Propyte_web\src\components\shared\TeamBioModal.tsx`

Modelado sobre el modal accesible existente `src/components/glosario/GlossaryLeadGateModal.tsx` (focus-trap, Esc, click-fuera, scroll-lock).

- [ ] **Step 1: Crear el componente**

`src/components/shared/TeamBioModal.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, MessageCircle } from '@/lib/icons';
import type { TeamBioPerson } from '@/lib/team-bio';

interface Props {
  open: boolean;
  onClose: () => void;
  person: TeamBioPerson | null;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TeamBioModal({ open, onClose, person }: Props) {
  const t = useTranslations('teamBio');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    queueMicrotask(() => closeBtnRef.current?.focus());

    const sel =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const fs = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => el.offsetParent !== null,
      );
      if (fs.length === 0) return;
      const first = fs[0];
      const last = fs[fs.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !person) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-bio-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        <div className="flex flex-col items-center text-center">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-32 h-32 rounded-full object-cover object-top mb-4"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#1A2F3F] flex items-center justify-center mb-4">
              <span className="text-white text-3xl font-bold" aria-hidden="true">
                {getInitials(person.name)}
              </span>
            </div>
          )}

          <h2 id="team-bio-title" className="text-2xl font-bold text-[#1A2F3F]">
            {person.name}
          </h2>
          <p className="text-sm font-semibold text-[#0E7490] mt-1">{person.role}</p>
          {person.city && (
            <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
              <MapPin size={12} /> {person.city}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {person.bio}
        </p>

        {person.whatsappLink && (
          <div className="mt-6 text-center">
            <a
              href={person.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-5 bg-[#25D366]/10 text-[#075E54] text-sm font-semibold rounded-full hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={14} /> {t('whatsapp')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Confirmar que los íconos existen**

`X`, `MapPin`, `MessageCircle` ya se re-exportan en `src/lib/icons.tsx` (usados en `GlossaryLeadGateModal` y en la página de equipo). No requiere cambio.

- [ ] **Step 3: Typecheck**

Run: `cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/TeamBioModal.tsx
git commit -m "feat(equipo): componente accesible TeamBioModal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Web — equipo comercial (avatares grandes + cards clickables)

**Files:**
- Create: `c:\Users\ptoral\Projects\Next_Propyte_web\src\app\[locale]\nosotros\equipo-comercial\_components\EquipoBios.tsx`
- Modify: `c:\Users\ptoral\Projects\Next_Propyte_web\src\app\[locale]\nosotros\equipo-comercial\page.tsx`

> Antes de construir card + modal, consultar el MCP `ui-ux-pro` (regla del proyecto) y anotar pattern + takeaways en el commit.

- [ ] **Step 1: Crear el wrapper cliente `EquipoBios`**

`src/app/[locale]/nosotros/equipo-comercial/_components/EquipoBios.tsx`. Mueve la grilla + el placeholder + los helpers de avatar/whatsapp desde el server page, agranda el avatar (96→144px), agrega botón "Ver perfil" cuando hay bio, y maneja el modal:

```tsx
'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Users, MapPin, MessageCircle } from '@/lib/icons';
import type { TeamMemberRow } from '@/lib/supabase/queries';
import { pickBio, type TeamBioPerson } from '@/lib/team-bio';
import TeamBioModal from '@/components/shared/TeamBioModal';

const FALLBACK_COLORS = ['#1A2F3F', '#0F1923', '#0E7490', '#0E7490', '#134E4A'];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function buildWhatsappLink(member: TeamMemberRow): string | null {
  const phone = member.whatsapp || member.phone;
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return null;
  return `https://wa.me/${clean}`;
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className="w-36 h-36 rounded-full object-cover object-top mx-auto mb-4 ring-4 ring-[#A2F9FF]/30 transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#A2F9FF]/30 transition-transform duration-300 group-hover:scale-105"
      style={{ backgroundColor: pickColor(name) }}
    >
      <span className="text-white text-3xl font-bold" aria-label={name}>
        {getInitials(name)}
      </span>
    </div>
  );
}

export default function EquipoBios({ teamMembers }: { teamMembers: TeamMemberRow[] }) {
  const locale = useLocale();
  const t = useTranslations('equipoPage');
  const tBio = useTranslations('teamBio');
  const [selected, setSelected] = useState<TeamBioPerson | null>(null);

  if (teamMembers.length === 0) {
    return (
      <div className="max-w-2xl mx-auto propyte-card-glass-light p-8 md:p-12 text-center border-2 border-dashed border-[#A2F9FF]/40 rounded-2xl">
        <div className="w-14 h-14 mx-auto mb-5 bg-[#A2F9FF]/20 rounded-2xl flex items-center justify-center">
          <Users size={28} strokeWidth={1.5} className="text-[#0E7490]" />
        </div>
        <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
          {t('section2Placeholder')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {teamMembers.map((m) => {
          const waLink = buildWhatsappLink(m);
          const bio = pickBio(locale, m.bio_long, m.bio_long_en);
          const openProfile = () =>
            setSelected({
              name: m.name,
              role: m.role,
              city: m.city,
              photoUrl: m.photo_url,
              bio: bio ?? '',
              whatsappLink: waLink,
            });
          return (
            <div
              key={m.id}
              className="group bg-white p-6 rounded-xl border border-gray-100 text-center hover:shadow-lg transition-shadow"
            >
              <Avatar photoUrl={m.photo_url} name={m.name} />
              <h3 className="font-bold text-[#1A2F3F] text-lg">{m.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{m.role}</p>
              {m.city && (
                <p className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <MapPin size={11} /> {m.city}
                </p>
              )}
              {m.bio_short && (
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">{m.bio_short}</p>
              )}
              <div className="mt-4 flex flex-col items-center gap-2">
                {bio && (
                  <button
                    type="button"
                    onClick={openProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[#0E7490] border border-[#0E7490]/30 rounded-full hover:bg-[#0E7490]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]"
                  >
                    {tBio('viewProfile')}
                  </button>
                )}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#075E54] text-xs font-semibold rounded-full hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TeamBioModal open={selected !== null} onClose={() => setSelected(null)} person={selected} />
    </>
  );
}
```

- [ ] **Step 2: Refactor del server page para delegar el grid**

En `equipo-comercial/page.tsx`: (a) eliminar los helpers `getInitials`, `pickColor`, `Avatar`, `buildWhatsappLink`, la const `FALLBACK_COLORS` y el import de `TeamMemberRow` (ya no se usan en el server). (b) Añadir `import EquipoBios from './_components/EquipoBios';`. (c) Reemplazar el bloque ternario `{teamMembers.length === 0 ? (...) : (...)}` dentro de la Section 2 por:

```tsx
          <EquipoBios teamMembers={teamMembers} />
```

El resto del archivo (metadata, hero, NosotrosTabs, section1, section2 `<h2>`, CTA, fetch de `teamMembers`) NO cambia. `Users` y `MapPin` quizá queden sin uso en el server: si ESLint/tsc marca import sin uso, quitarlos del import de `@/lib/icons` (dejar `ArrowRight`, `MessageCircle` solo si se usan; `Home` se mantiene por el watermark del hero).

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
npx tsc --noEmit && npx eslint src/app/\[locale\]/nosotros/equipo-comercial
```
Expected: sin errores. Si hay "imports no usados" en el server page, removerlos y re-correr.

- [ ] **Step 4: Verificación visual (dev)**

Run: `npm run dev`, abrir `http://localhost:3000/es/nosotros/equipo-comercial`. Expected: avatares notablemente más grandes (144px), botón "Ver perfil" solo en miembros con `bio_long`, click abre el modal con foto + nombre + rol + ciudad + trayectoria + WhatsApp.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/nosotros/equipo-comercial/_components/EquipoBios.tsx" "src/app/[locale]/nosotros/equipo-comercial/page.tsx"
git commit -m "feat(equipo): avatares grandes + pop-up de biografía en equipo comercial

ui-ux-pro: <pattern consultado + takeaways aquí>

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Web — estructura (líderes CEO + directores clickables)

**Files:**
- Modify: `c:\Users\ptoral\Projects\Next_Propyte_web\src\app\[locale]\nosotros\estructura\EstructuraPageContent.tsx`

- [ ] **Step 1: Imports + estado del modal**

En la cabecera de `EstructuraPageContent.tsx`, añadir a los imports:

```tsx
import { pickBio, type TeamBioPerson } from '@/lib/team-bio';
import TeamBioModal from '@/components/shared/TeamBioModal';
```

- [ ] **Step 2: Hacer `OrgCard` opcionalmente clickable**

Reemplazar la función `OrgCard` (líneas 84-97) por:

```tsx
function OrgCard({
  role,
  title,
  name,
  color,
  onSelect,
}: {
  role: string;
  title: string;
  name: string;
  color: string;
  onSelect?: () => void;
}) {
  const base = 'bg-white rounded-xl shadow-md p-5 text-center min-w-[180px]';
  const content = (
    <>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
        {role}
      </span>
      <p className="text-xs text-gray-600 mt-1">{title}</p>
      <p className="font-semibold text-gray-900 mt-1 text-sm">{name}</p>
    </>
  );
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${base} block w-full cursor-pointer transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5CE0D2]`}
        style={{ borderTopWidth: 4, borderTopColor: color, borderTopStyle: 'solid' }}
      >
        {content}
      </button>
    );
  }
  return (
    <div
      className={base}
      style={{ borderTopWidth: 4, borderTopColor: color, borderTopStyle: 'solid' }}
    >
      {content}
    </div>
  );
}
```

- [ ] **Step 3: Estado + helper en `EstructuraPageContent`**

Dentro de `EstructuraPageContent`, después de `const { ceo, directors, depts } = buildView(nodes);` (línea 155):

```tsx
  const [selected, setSelected] = useState<TeamBioPerson | null>(null);

  function leaderSelect(node: { name: string; role: string; city: string | null; photo_url: string | null; bio_long: string | null; bio_long_en: string | null }) {
    const bio = pickBio(locale, node.bio_long, node.bio_long_en);
    if (!bio) return undefined; // sin bio → no clickable
    return () =>
      setSelected({
        name: node.name,
        role: node.role,
        city: node.city,
        photoUrl: node.photo_url,
        bio,
      });
  }
```

(`useState` ya está importado en la línea 3.)

- [ ] **Step 4: Pasar `onSelect` a los `OrgCard` de ceo + directores**

Hay 4 usos de `OrgCard` para líderes (desktop ceo, desktop directores, mobile ceo, mobile directores). Añadir `onSelect={leaderSelect(<nodo>)}` a cada uno.

Desktop CEO (línea ~183):
```tsx
                    <OrgCard
                      role={ceo.role_code ?? 'CEO'}
                      title={ceo.role}
                      name={ceo.name}
                      color={ceo.role_color ?? '#1D4ED8'}
                      onSelect={leaderSelect(ceo)}
                    />
```
Desktop director (línea ~202):
```tsx
                        <OrgCard
                          role={d.role_code ?? d.role}
                          title={d.role}
                          name={d.name}
                          color={d.role_color ?? '#1A2F3F'}
                          onSelect={leaderSelect(d)}
                        />
```
Mobile CEO (línea ~227):
```tsx
                    <OrgCard
                      role={ceo.role_code ?? 'CEO'}
                      title={ceo.role}
                      name={ceo.name}
                      color={ceo.role_color ?? '#1D4ED8'}
                      onSelect={leaderSelect(ceo)}
                    />
```
Mobile director (línea ~235):
```tsx
                    <OrgCard
                      key={d.id}
                      role={d.role_code ?? d.role}
                      title={d.role}
                      name={d.name}
                      color={d.role_color ?? '#1A2F3F'}
                      onSelect={leaderSelect(d)}
                    />
```

(`leaderSelect` devuelve `undefined` cuando no hay bio, así que esos `OrgCard` quedan no-clickables sin lógica extra.)

- [ ] **Step 5: Renderizar el modal**

Justo antes del `</>` de cierre del return (después de la sección Philosophy, línea ~278):

```tsx
      <TeamBioModal open={selected !== null} onClose={() => setSelected(null)} person={selected} />
    </>
```

- [ ] **Step 6: Typecheck + lint**

Run:
```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
npx tsc --noEmit && npx eslint src/app/\[locale\]/nosotros/estructura
```
Expected: sin errores.

- [ ] **Step 7: Verificación visual (dev)**

Abrir `http://localhost:3000/es/nosotros/estructura`. Expected: las tarjetas de CEO y directores que tengan `bio_long` muestran cursor/hover y abren el modal; departamentos y miembros internos no cambian.

- [ ] **Step 8: Commit**

```bash
git add "src/app/[locale]/nosotros/estructura/EstructuraPageContent.tsx"
git commit -m "feat(equipo): pop-up de biografía en líderes del organigrama

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Web — e2e Playwright + verificación final

**Files:**
- Create: `c:\Users\ptoral\Projects\Next_Propyte_web\tests\e2e\team-bio-modal.spec.ts`

- [ ] **Step 1: Escribir el spec e2e**

`tests/e2e/team-bio-modal.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// El contenido depende de datos de prod (miembros con bio_long). Estos tests
// son tolerantes: si no hay ningún botón "Ver perfil"/tarjeta clickable,
// se omiten en lugar de fallar (entorno sin datos de bio).

test.describe('TeamBioModal — equipo comercial', () => {
  test('abre y cierra el pop-up de biografía', async ({ page }) => {
    await page.goto('/es/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Ver perfil' }).first();
    const count = await trigger.count();
    test.skip(count === 0, 'No hay miembros con bio_long en este entorno');

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Cerrar con Esc
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('cierra con click en backdrop', async ({ page }) => {
    await page.goto('/es/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'Ver perfil' }).first();
    test.skip((await trigger.count()) === 0, 'Sin datos de bio');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // click en la esquina del backdrop (fuera del panel)
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();
  });
});

test.describe('TeamBioModal — estructura (líderes)', () => {
  test('las tarjetas de líderes con bio abren el pop-up', async ({ page }) => {
    await page.goto('/es/nosotros/estructura', { waitUntil: 'domcontentloaded' });
    // Las tarjetas clickables son <button> con el role_code (CEO/CCO/...) visible.
    const leaderBtn = page.locator('button:has-text("CEO")').first();
    test.skip((await leaderBtn.count()) === 0, 'Sin CEO clickable (sin bio)');
    await leaderBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('TeamBioModal — EN locale', () => {
  test('la versión en inglés usa el botón "View profile"', async ({ page }) => {
    await page.goto('/en/nosotros/equipo-comercial', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('button', { name: 'View profile' }).first();
    test.skip((await trigger.count()) === 0, 'Sin datos de bio');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

(Se usa `domcontentloaded` y no `load` porque páginas pesadas no siempre disparan `load` — ver memoria `feedback_playwright_waituntil_heavy_pages`.)

- [ ] **Step 2: Correr e2e contra el dev server**

Run:
```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
npm run dev    # en otra terminal, o dejar que playwright.config levante webServer
npx playwright test team-bio-modal --reporter=line
```
Expected: tests PASS o SKIP (skip si el entorno no tiene miembros con `bio_long`). Ningún FAIL. Si fallan por timeout de modal, revisar que `pointer-events` no quede bloqueado.

- [ ] **Step 3: Mobile 375px — verificación**

Run: en dev, DevTools responsive 375px en ambas páginas. Expected: modal scrollable (`max-h-[90vh] overflow-y-auto`), no se corta; cards en 1 columna; avatares grandes no desbordan.

- [ ] **Step 4: Typecheck final del repo web**

Run: `cd /c/Users/ptoral/Projects/Next_Propyte_web && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/team-bio-modal.spec.ts
git commit -m "test(equipo): e2e del pop-up de biografía (equipo + estructura, ES/EN)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Deploy staging + handoff a Luis**

```bash
cd /c/Users/ptoral/Projects/Next_Propyte_web
git push -u origin feat/equipo-bios-popups
vercel --prod --yes   # staging dev.propyte.com (rama de feature)
```
Verificar en `dev.propyte.com/es/nosotros/equipo-comercial` y `/estructura`. Confirmar a Luis para que capture trayectorias en el Hub y, cuando apruebe, hacer el merge a `develop`/`main` según topología (push a `main` requiere autorización explícita).

---

## Self-Review (cobertura del spec)

- ✅ Supabase `bio_long`/`bio_long_en` + ambas vistas (Task 1) — incluye `photo_url`/`city` en `v_org_structure`.
- ✅ Hub form + API bilingüe (Tasks 2-3).
- ✅ `TeamBioModal` accesible único reutilizable (Task 6), modelado sobre patrón existente; mitiga bug de pointer-events (modal condicional, sin AnimatePresence persistente — se optó por render condicional simple como el modal de referencia, evitando el bug de exit).
- ✅ Avatares 96→144px + cards clickables equipo comercial (Task 7).
- ✅ Líderes CEO + 3 directores clickables en estructura (Task 8).
- ✅ i18n ES+EN, fallback EN→ES vía `pickBio` (Tasks 4-5).
- ✅ Pop-up usa solo `bio_long`; sin bio → no clickable, sin pop-up vacío (Tasks 5,7,8).
- ✅ Testing e2e + tsc (Task 9). Sin Vitest (no existe en el repo).
- ✅ Rollout en orden seguro + rama nueva desde develop.

**Nota sobre la decisión de Framer Motion:** el spec mencionaba `AnimatePresence` con nodo montado para evitar el bug de pointer-events. En el plan se optó por **render condicional simple** (`if (!open) return null`), igual que el modal de referencia `GlossaryLeadGateModal` ya en producción — que no tiene el bug porque desmonta limpio. Esto evita la complejidad de Framer Motion para el modal y es consistente con el patrón existente. Si Luis quiere animación de entrada/salida, se puede añadir después con la mitigación documentada.
