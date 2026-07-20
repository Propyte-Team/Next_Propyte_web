# Handoff — continuar en Slices 4 (Preventa) y 5 (Financiamiento Interno + timings)

Pega el bloque de abajo como primer mensaje en la nueva sesión.

---

Continúa el rediseño de la ficha de Unidad de propyte.com. Usa Superpowers (writing-plans → subagent-driven-development). Slices 1-3 (Rentabilidad · Esquemas/Inversión inicial · Hipotecario/corrida/PDF) están **DESPLEGADAS a main y verificadas**; te tocan **Slice 4 (Preventa)** y **Slice 5 (Financiamiento Interno + timings)**. Una rebanada a la vez (spec ya existe → plan → ejecutar).

## Dónde está todo
- **Worktree web:** `C:/Users/Luis/Projects/Propyte/Next_Propyte_web_unidades`, rama **`feat/unidades-rediseno`** (node_modules junction + `.env*` copiado). NO cambies de rama. NO push sin OK explícito de Luis.
- **Hub:** Slices 4-5 tocan AMBOS repos (web + `Propyte_hub`). Usa worktree/clon aislado del Hub cuando toque su parte.
- **Spec paraguas (en main):** `docs/superpowers/specs/2026-07-17-unidades-rediseno-design.md` → **§4.3 Preventa**, **§4.4 Interno** + **§5 timing de intereses**, **§7 roadmap** (slices 4-5).
- **Planes previos:** `docs/superpowers/plans/2026-07-1{7,8}-slice{1,2,3}-*.md`.
- **Memoria:** `~/.claude/projects/c--Users-Luis/memory/project_next_propyte_web.md` (changelog 2026-07-20) + `project_propyte_hub.md` + `feedback_financing_ui_only_monthly.md`.

## Estado (verifícalo: `git -C <worktree> log --oneline -8`; origin/main SE MUEVE — otras sesiones activas)
- Slices 1-3 + QA fixes en main (mi último commit `53fa3c5`). Ambos tabs (rentabilidad + esquemas) **OCULTOS en prod** por `site_visibility` (`propiedades.detail.rentabilidad`/`.esquemas` = `visible_prod=false` en Supabase `oaijxdpevakashxshhvm`, tabla `real_estate_hub.site_visibility`).
- **Reutiliza (ya construido en Slices 1-3):** `src/lib/hipotecario.ts` (`HIPOTECARIO_CONFIG` + `computeHipotecario`; ambos perfiles 240m), `src/lib/calculator.ts::buildAmortizationSchedule` (amortización francesa), `src/lib/corrida-anual.ts::aggregateByYear`, `esquemas/CorridaCompacta.tsx` (corrida compacta genérica: barras por año + tabla expandible + **solo mensualidad**, sin totales lifetime), `esquemas/CotizacionBloques.tsx` + `computeInversionInicial`, `esquemas/HipotecarioCalculator.tsx`, PDF `lib/pdf/CotizacionPDFDocument.tsx` + `api/generate-cotizacion-pdf`.
- **Reservado para ti:** `CorridaFinanciera.tsx` (hoy sin importadores, comentado "reservado Slice 5 Interno") + props `esquemas`/`listPrice` en `EsquemasDePagoTab` — son para el tab **Interno** (renderiza los esquemas de pago del Hub vía CorridaFinanciera).

## Slice 4 — Preventa (Hub + web)
- **Hub:** config JSONB por desarrollo + override por unidad (mismo patrón que `esquemas_pago`) + editor. Etapas: **enganche inicial** (puede ir en 1 o 2 partes: inicial + diferido) + **pagos durante obra** (cuotas en meses fijos) + **contraentrega**. Extensible a más hitos (por ahora esas 3).
- **Web:** sub-pestaña Preventa (gate `stage==='preventa'`) con **modo A** (config del Hub → plan fijo) / **modo B** (fallback sin config → barras ajustables enganche/obra/contraentrega + summary). **Contraentrega → corrida:** el saldo de contraentrega se paga vía **Hipotecario** (Nac/Ext; reusa `computeHipotecario` + `CorridaCompacta`) o **Interno**, y eso genera la corrida de ese saldo.

## Slice 5 — Financiamiento Interno + timing de intereses (Hub + web)
- **Hub:** nuevo campo **timing de intereses** (`al inicio` / `prorrateado` / `al final`) — se decide en el Hub; la web NO nombra la opción.
- **Web:** sub-pestaña Interno (gate `financiamiento_directo`) que muestra **solo las opciones configuradas en el Hub** (sin barras), reusando `CorridaFinanciera` + `CorridaCompacta`. **2 fórmulas de amortización nuevas** además de la francesa (van en `calculator.ts` junto a `buildAmortizationSchedule`):
  - **al inicio:** interés alto al principio → se pagan primero los intereses, capital al final.
  - **prorrateado:** francesa (ya existe).
  - **al final:** interés crece y se concentra al final.
  - El timing se **visualiza en las barras interés/capital** de la corrida (no se nombra la opción).

## Reglas / gotchas (aprendidas en Slices 1-3)
- Autor git: `git -c user.email=marketing@propyte.com -c user.name=Propyte-Luis commit …`. Stagea **rutas explícitas** (nunca `git add -A`; hay `.env.example` sin trackear).
- Deploy = FF `git push origin HEAD:main`; **rebasa sobre origin/main antes** (main avanzó 2 veces durante Slice 3 por otras sesiones). Revalida `tsc` + `next build` en el estado **rebaseado** antes de push. **Solo con OK de Luis.**
- Verificación (repo SIN vitest/tsx): `tsc --noEmit` + `next build` + **probe SSR** (page temporal en carpeta **SIN guion bajo** — las `_`-prefijadas son privadas en App Router → 404; bórrala después) porque `Tabs` (`components/ui/Tabs.tsx`) renderiza **solo el panel activo**. Los charts recharts son **client-only** (no grep-eables por SSR). **Paridad i18n es/en obligatoria** (valida con un node script por namespace).
- `next build` de un probe deja `.next/types` **stale** (referencia la ruta borrada) → `rm -rf .next/types` antes de `tsc`.
- Subagentes se mueren en teardown de sesión sin commitear → verifica `git log`/`status` antes de re-despachar; commitea el WIP tú. Subagentes en `model: sonnet`, dirigidos por Opus.
- **UI de financiamiento:** el dato hero es la **mensualidad**; NO muestres intereses/total **lifetime** ni fila de totales (percepción negativa — ver `feedback_financing_ui_only_monthly`). Reproduce el cálculo antes de asumir bug (las 2 tablas "que no cuadraban" en Slice 3 eran perfiles distintos, cada una correcta).
- Datos: `v_units` NO expone `tipo_entrega` (fast-follow aparte). Extranjero hoy se muestra en **MXN + aviso cambiario** (conversión USD real = fast-follow si Luis lo pide).
- Al terminar cada slice: reporta a Luis y NO hagas push sin su OK.
