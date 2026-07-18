# Handoff — Rediseño ficha de Unidad · continuar en Slice 3

Pega el bloque de abajo como primer mensaje en la nueva sesión.

---

Continúa el rediseño de la ficha de Unidad de propyte.com. Usa Superpowers (writing-plans → subagent-driven-development). El diseño ya está aprobado y hay 2 rebanadas hechas; te toca **Slice 3**.

## Dónde está todo
- **Worktree de trabajo:** `C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades`, rama **`feat/unidades-rediseno`** (basada en origin/main). node_modules ya está enlazado (junction) y `.env*` copiado — corre `npx tsc --noEmit` y `npm run build` ahí. NO cambies de rama. NO hagas push sin OK explícito de Luis.
- **Spec paraguas (en main):** `docs/superpowers/specs/2026-07-17-unidades-rediseno-design.md` — léelo (secciones §4.4-4.5, §6 son Slice 3).
- **Planes previos:** `docs/superpowers/plans/2026-07-17-slice1-*` (Rentabilidad, DEPLOYADA) y `-slice2-*` (Esquemas estructura+Inversión inicial, HECHA sin merge).
- **Memoria:** `~/.claude/projects/c--Users-Luis/memory/project_next_propyte_web.md` (changelog 2026-07-18) y `project_propyte_hub.md`.

## Estado (verifícalo con `git -C <worktree> log --oneline -8`)
- **Slice 1 (Rentabilidad):** DEPLOYADA a main. 3 sub-tabs sin resta de mensualidad ni Flujo Anual; Proyección Vac vs Res; charts 12m; comparativa zonas. `UnitInvestmentCalculator.tsx` borrado.
- **Slice 2 (Esquemas de pago · estructura + Inversión inicial):** HECHA, en la rama hasta commit `af221c1`, **sin merge**. `EsquemasDePagoTab.tsx` = calculadora de Inversión inicial (Nac/Ext + Mobiliario/Decoración) arriba + `Tabs` con 3 sub-pestañas (Preventa/Interno/Hipotecario) con gates + `CotizacionBloques.tsx` (3 bloques; **bloque 3 = skeleton**). Calc pura en `src/lib/inversion-inicial.ts`.
- Ambos tabs **ocultos en prod** por `site_visibility` (`propiedades.detail.rentabilidad=false`, `propiedades.detail.esquemas=false` en Supabase `oaijxdpevakashxshhvm`).

## Tu tarea — Slice 3: Financiamiento Hipotecario + corrida compacta + PDF
1. **Sub-pestaña Hipotecario:** selector **Nacional / Extranjero** (una a la vez). Tasas de arranque (config global, ajustables): **Nacional 10.5% / 20 años (MXN)**; **Extranjero 9.5% / 30 años (USD, enganche 35%)** + aviso de riesgo cambiario. Reusa `buildAmortizationSchedule` de `src/lib/calculator.ts`.
2. **Corrida compacta** (hasta 240 meses sin saturar): tabla **por año** (~20 filas) expandible a meses + **gráfica de barras interés/capital** (recharts, como la de `CorridaFinanciera.tsx`) + resumen (mensualidad/total intereses/total pagado). Aplica también a la corrida existente.
3. **Bloque 3 de la cotización EN VIVO:** rellenar `CotizacionBloques bloque3` (hoy skeleton) con saldo/mensualidades/interés/mensualidad del esquema hipotecario elegido.
4. **PDF de cotización** (react-pdf, ya hay infra en `src/lib/pdf/PropertyPDFDocument.tsx` + `api/generate-pdf`): **espejo de los 3 bloques en pantalla** + corrida como **resumen por año** (no las 240 filas). Botón "Descargar cotización PDF".

## Reglas / gotchas
- Autor git: `git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit ...`. Stagea rutas explícitas (nunca `git add -A`; hay un `.env.example` sin trackear).
- Deploy = `git push origin HEAD:main` (FF; rebasa sobre origin/main antes — otras sesiones avanzan main). **Solo con OK explícito de Luis.**
- Verificación (repo sin vitest): `tsc --noEmit` + `next build` + runtime sobre el HTML prerenderizado (build fail-open con `HUB_API_URL=http://127.0.0.1:1/ npm run build` para que el tab gateado se renderice y puedas grepear). Paridad i18n es/en obligatoria (namespace `esquemas`).
- **Subagentes se mueren en teardown de sesión sin commitear** → verifica `git log`/`status` antes de re-despachar; commitea el WIP tú si quedó a medias. Cambios triviales: inline.
- Datos: `v_units` NO expone `tipo_entrega` (fast-follow aparte); ADR no tiene serie mensual (solo `occupancy_trend`).
- Al terminar Slice 3: reporta a Luis y NO hagas push sin su OK. Slices 4 (Preventa, Hub+web) y 5 (Interno+timings, Hub+web) quedan después.
