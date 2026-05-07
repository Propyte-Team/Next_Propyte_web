# Deploy a Vercel (staging — `develop`)

`propyte.com` corre en Hostinger; `dev.propyte.com` en Vercel desde la rama
`develop`. Esta guía cubre la primera configuración del CLI.

## Setup inicial (una sola vez)

```powershell
# 1. Login (abre browser)
vercel login

# 2. Linkear el repo a un proyecto Vercel
vercel link
#   ? Set up "C:\Users\ptoral\Projects\Next_Propyte_web"?  Y
#   ? Which scope?                          Propyte-Team
#   ? Link to existing project?             Y / N
#       Si Y → seleccionar "next-propyte-web" (o el nombre que tengas)
#       Si N → crear nuevo, framework Next.js, branch develop
```

`vercel link` crea `.vercel/project.json` (gitignore). Esto NO se commitea.

## Variables de entorno

Las pulleas desde el dashboard de Vercel a tu `.env.local`:

```powershell
vercel env pull .env.local
# por defecto pulls el environment "development"
# para staging:
vercel env pull .env.local --environment=preview
```

Si vas a setear nuevas variables en Vercel:

```powershell
# Sin valor → te pregunta interactivamente
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
# etc
```

Lista completa de vars que el proyecto necesita: ver `.env.example`.

## Deploy

| Comando | Qué hace |
|---|---|
| `npm run vercel:dev` (`vercel deploy`) | Crea un preview con URL única |
| `npm run vercel:preview` (`vercel deploy --prebuilt`) | Deploy del último build local |
| `npm run vercel:prod` (`vercel deploy --prod`) | Deploy a propyte.com (NO usar — prod va a Hostinger) |

**Importante:** `--prod` apunta al dominio principal del proyecto Vercel, que
para Propyte es `dev.propyte.com` (alias). Si quieres deployar a producción
real (propyte.com en Hostinger), usar el workflow de GitHub Actions, no Vercel.

## Auto-deploy desde Git

Configurado en `vercel.json`:
- Push a `main` → deploy a producción Vercel (alias: `dev.propyte.com`)
- Push a `develop` → deploy a preview Vercel
- PRs → preview con URL única por commit

Si solo querés auto-deploy y no manual, no necesitas `vercel deploy` — basta
con `git push origin develop`.

## Rollback

```powershell
vercel rollback [deployment-url]
# o desde el dashboard → Deployments → Promote to Production
```
