# Next_Propyte_web — Frontend Público propyte.com

> Para contexto global lee: `~/.claude/projects/c--Users-Luis/memory/MEMORY.md`  
> Para contexto de este proyecto: `~/.claude/projects/c--Users-Luis/memory/project_next_propyte_web.md`  
> Speckit completo: `~/Projects/Propyte/SPECKIT-METAMORFOSIS-PROPYTE.md` (v3.0)

## Reglas de Seguridad (OBLIGATORIO)

- NUNCA leas ni muestres el contenido de archivos `.env`, `.env.local`, `.env.production`
- NUNCA accedas a archivos `.pem`, `.key`, ni carpetas `.ssh/` o `.aws/`
- NUNCA hagas `git push --force` a `main` o `master` sin confirmacion explicita
- NUNCA elimines archivos o carpetas sin preguntar primero
- NUNCA expongas `SUPABASE_SERVICE_ROLE_KEY` en codigo client-side
- NUNCA hardcodees credenciales — siempre usar variables de entorno
- Siempre trabaja en la rama actual — nunca cambies a `main` sin preguntar
- No commitear archivos con credenciales, tokens o secrets
- Usa `.env.example` como template para variables de entorno

## Lineamientos para evitar Fallos

- Antes de editar, lee MAXIMO 3 archivos
- No hagas grep exploratorio sin pedirlo
- Pregunta si necesitas mas contexto

## Preguntar SIEMPRE ante ambiguedad (OBLIGATORIO)

Antes de ejecutar cualquier tarea, evaluar si la instruccion es lo suficientemente especifica. Si detectas alcance indefinido, multiples interpretaciones, o impacto no obvio — preguntar antes de actuar.

## Project Context

- **Repo:** Propyte-Team/Next_Propyte_web
- **Domain:** propyte.com
- **Scaffold:** Fork limpio de HERO-SITE-ZILLOW, adaptado con diseno canonico de WordPress actual
- **Owner:** Luis Flores (Coordinador de Marketing, Propyte)
- **Brand:** Propyte — "Real estate en modo inteligente"

## Tech Stack

| Componente | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router, RSC, ISR) |
| Runtime | Node.js 22 LTS |
| Lenguaje | TypeScript 5.8+ (strict) |
| CSS | Tailwind CSS 4.2 |
| Fuente | Space Grotesk (next/font/google) |
| Animaciones | Framer Motion 12.x |
| Mapas | @vis.gl/react-google-maps |
| Charts | Recharts 3.x |
| i18n | next-intl 4.x |
| Iconos | Lucide React |
| PDF | @react-pdf/renderer |
| Forms | React Hook Form + Zod |
| Data | Supabase JS SDK 2.x |
| SEO | next/metadata + JSON-LD |
| Testing | Playwright (e2e) + Vitest (unit) |

## Design Tokens (canonicos de WP)

```
Teal:       #5CE0D2  (primary CTA)
Teal Dark:  #4BCEC0  (hover)
Teal A11y:  #0D9488  (text on white, WCAG AA)
Navy:       #1A2F3F  (primary text)
Graphite:   #2C2C2C  (body text)
Aztec:      #0F1923  (sidebar, dark BGs)
Deep Onyx:  #1A1A2E  (darker BGs)
Amber:      #F5A623  (badges, highlights)
Light Gray: #F4F6F8  (backgrounds)
Success:    #22C55E
Error:      #EF4444
WhatsApp:   #25D366
```

## Architecture

```
propyte.com (this repo)
    ↕ Supabase (source of truth)
    ↕ hub.propyte.com (Propyte_hub repo — admin backend)
    → crm.propyte.com (leads webhook)
```

- **Hosting prod:** Hostinger VPS (standalone + PM2 + Nginx) — auto-deploy via GitHub Actions en push a `main`
- **Hosting staging:** Vercel (manual CLI — `vercel --prod` desde rama `develop`) — dev.propyte.com. GitHub auto-deploy desconectado.
- **Database:** Supabase (oaijxdpevakashxshhvm)
- **Schemas:** real_estate_hub (R/W), investment_analytics (R), public (R)

## Data Flow

```
Supabase (source of truth)
    ↓ queries via lib/supabase/
Next.js ISR pages (revalidate via hub trigger)
    ↓
Hostinger (prod) / Vercel CDN (staging)
```

## Quick Reference

| Que | Donde |
|-----|-------|
| Supabase queries | `src/lib/supabase/` |
| Supabase clients | `src/lib/supabase/client.ts` (browser), `server.ts` (SSR) |
| Financial calcs | `src/lib/calculator/` |
| Schema JSON-LD | `src/lib/schema/` |
| i18n messages | `src/messages/es.json`, `en.json` |
| Design tokens | `src/styles/globals.css` + `tailwind.config.ts` |
| Shared types | `src/shared/types/` |
| Shared constants | `src/shared/constants/` |
| Components | `src/components/` |
| Layout system | `src/components/layout/` (Sidebar, SearchBubble, ActionsPill, MobileHeader, MobileMenu, Header, Footer) |
| Scroll reveal | `src/components/shared/ScrollReveal.tsx` (Framer Motion `whileInView`) |
| Icon vocabulary | `src/lib/icons.ts` (canonical Lucide re-exports) |
| Hooks | `src/hooks/` |
| Context | `src/context/` (incl. `SearchContext` — sincroniza search type toggle desktop+mobile) |

## Supabase Client Usage

```tsx
// Server Components / API routes:
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// API routes that bypass RLS (lead creation):
import { createServiceClient } from '@/lib/supabase/server';
const supabase = createServiceClient();

// Client Components (prefer server when possible):
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

## i18n Pattern

```tsx
// Server Component:
import { getTranslations } from 'next-intl/server';
const t = await getTranslations({ locale, namespace: 'property' });

// Client Component:
import { useTranslations } from 'next-intl';
const t = useTranslations('property');
```

Add new keys to BOTH `es.json` and `en.json` simultaneously. Never leave a key untranslated.

## SEO Checklist (every new page)

1. `generateMetadata()` — title + description + OG + Twitter + hreflang alternates
2. `generateStaticParams()` — for ISR (dynamic routes)
3. Schema JSON-LD component (appropriate @type)
4. Breadcrumbs (UI + JSON-LD BreadcrumbList)
5. Internal links to parent/sibling/related
6. Update `src/app/sitemap.ts`
7. Test both `/es/` and `/en/` versions
8. Mobile responsive (min 375px)

## Deploy

```bash
# Local dev
npm run dev

# Build (standalone for Hostinger)
npm run build

# Producción: push a main → GitHub Actions → SCP a Hostinger → PM2 restart
# Staging (dev.propyte.com): manual via Vercel CLI
git checkout develop
# hacer cambios, commit + push a origin/develop
vercel --prod --yes
```

## Related Repos

- **Propyte_hub** — Backend admin (hub.propyte.com) — sistema de aprobacion, sync engine, blog AI
- **propyte-web-master** — WordPress actual (se reemplaza con este repo)
- **propyte-crm** — CRM (crm.propyte.com) — se mantiene, recibe leads via webhook
- **HERO-SITE-ZILLOW-** — Referencia original Next.js (scaffold base de este repo)
