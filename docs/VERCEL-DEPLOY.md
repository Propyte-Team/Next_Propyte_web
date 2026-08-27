# [OBSOLETO] Deploy a Vercel (staging — `dev.propyte.com`)

> **⛔ DOCUMENTO OBSOLETO — no seguir estas instrucciones**
>
> **Este staging ya no existe.** El Vercel de `dev.propyte.com` se eliminó el
> **2026-06-17**; la fuente en el repo es `next.config.ts:25`. Nada de lo que
> hay debajo describe la infraestructura actual: no hay proyecto en Vercel al
> que linkear, ni entorno al que hacer `vercel --prod`, ni variables que
> `vercel env pull` pueda traer.
>
> **La topología real, hoy:** `main` → Hostinger VPS (`propyte.com`). El VPS
> tiene el repo Git conectado y compila en su propio servidor al detectar el
> push. **No hay ningún otro entorno desplegado.** Ver la sección *Deploy* de
> `CLAUDE.md` y el §23.1 del SPECKIT.
>
> Se conserva el archivo como registro histórico de cómo estuvo montado el
> staging entre su creación y el 2026-06-17, por si algún día se vuelve a
> levantar uno. Los scripts `vercel:*` de `package.json` son residuo de la
> misma etapa.

**Topología del proyecto:**
- `main` → **Hostinger VPS** (productivo `propyte.com`). Hostinger tiene el
  repo Git conectado: push a `main` deploya solo.
- `develop` → **Vercel staging (`dev.propyte.com`)**. Vercel **NO** tiene
  el repo Git conectado. Cada deploy a staging es **manual desde el CLI**.

Push a `develop` en GitHub no hace nada en Vercel — hay que correr el CLI.

## Setup inicial (una sola vez)

```powershell
# 1. Login (abre browser)
vercel login

# 2. Linkear el repo a un proyecto Vercel
vercel link
#   ? Set up "C:\Users\ptoral\Projects\Next_Propyte_web"?  Y
#   ? Which scope?                          propyte
#   ? Link to existing project?             Y
#   ? What's the name?                      next-propyte-web
```

`vercel link` crea `.vercel/project.json` (gitignored).

## Variables de entorno

Pulleas desde el dashboard a tu `.env.local`:

```powershell
vercel env pull .env.local --environment=preview
# Para production de Vercel (= dev.propyte.com):
vercel env pull .env.local --environment=production
```

Setear nuevas variables:

```powershell
vercel env add NEXT_PUBLIC_GA4_ID production
vercel env add NEXT_PUBLIC_META_PIXEL_ID production
# etc.
```

Lista completa de vars: ver `.env.example`.

## Deploy

| Comando | Qué hace | URL resultante |
|---|---|---|
| `npm run vercel:dev` (`vercel deploy`) | Preview deploy desde local | URL única `next-propyte-XXX-propyte.vercel.app` |
| `npm run vercel:prod` (`vercel deploy --prod`) | Promueve a "Production" del proyecto Vercel | Actualiza alias **`dev.propyte.com`** |

**Importante — terminología confusa:** "Production" de Vercel = staging real
del proyecto Propyte (`dev.propyte.com`). El productivo de verdad
(`propyte.com`) corre en Hostinger, no en Vercel. Por lo tanto
`vercel deploy --prod` NO toca `propyte.com`; solo refresca staging.

## Workflow típico de staging

```powershell
# 1. Trabajar en develop
git checkout develop
# ... cambios ...
git commit -m "..."
git push origin develop          # push GitHub — pero Vercel NO se entera

# 2. Subir a staging Vercel
vercel deploy --prod              # actualiza dev.propyte.com
```

## Promote sin re-build

Si ya hiciste un preview y querés promoverlo sin re-buildear:

```powershell
vercel promote next-propyte-brkh0l251-propyte.vercel.app
```

## Rollback

```powershell
vercel rollback [deployment-url]
# o desde el dashboard → Deployments → Promote to Production
```
