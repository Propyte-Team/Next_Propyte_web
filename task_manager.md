# Next_Propyte_web — Task Manager

> Última actualización: 2026-05-09

Plan de trabajo en el sitio público `propyte.com` (Next.js 16 + i18n + Supabase reads vía anon).

---

## En progreso

_Ninguna tarea activa._

---

## Pendiente — Push

- [ ] `git push origin develop` desde terminal local — 3 commits míos encolados:
  - `59e36e5 feat(estructura): organigrama desde Supabase + page_content (i18n)`
  - `b220487 fix(estructura): clicks defensivos en acordeones`
  - `a97341d fix(i18n): renombrar CSO a CCO en stat2Label`
- (Plus 2 commits previos del usuario: `ece05d0 feat(uiux): tap targets`, `54c0ecc feat(uiux-global)`)

---

## Pendientes (verificación post-deploy)

- [ ] Tras push, verificar `propyte.com/es/nosotros/estructura` — organigrama debe leer de Supabase, vacantes mostrar "Contratando", Felipe = CCO
- [ ] Verificar `propyte.com/es/nosotros/equipo-comercial` — debe seguir funcionando con el nuevo filtro `show_in_team_page=true` (vista lo aplica)
- [ ] Si hay 2 acordeones que no abren todavía tras el fix defensivo, identificar cuáles dos específicos y abrir issue

---

## Bloqueadas

_Nada bloqueado._

---

## Completadas recientes

- [x] Refactor `EstructuraPageContent.tsx` para consumir `v_org_structure` desde Supabase (2026-05-09)
- [x] Helpers `getOrgStructure()` y `getPageContent()` en `src/lib/supabase/queries.ts` (2026-05-09)
- [x] `getTeamMembers` filtra `is_vacant=false` (2026-05-09)
- [x] Fix click defensivo en DeptAccordion (`type="button"`, `cursor-pointer`, setOpen function form) (2026-05-09)
- [x] Rename CSO→CCO en `messages/es.json` y `messages/en.json` (2026-05-09)

---

## Notas

- ISR de `/nosotros/estructura` es 600s. Para forzar revalidate sin esperar, edita y guarda algo en Hub `/contenido/nosotros/estructura` — dispara on-demand revalidate.
- El sitio lee con `createPublicSupabaseClient` (anon key). Cualquier vista nueva en `real_estate_hub` necesita `GRANT SELECT TO anon` antes de ser usable.
- i18n actúa como fallback si `page_content` no devuelve la fila — mantener ambos en sync.
