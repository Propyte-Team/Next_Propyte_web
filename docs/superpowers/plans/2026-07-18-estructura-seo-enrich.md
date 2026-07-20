# Enriquecer `/nosotros/estructura` — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `/nosotros/estructura` tenga contenido único visible en el SSR (14 miembros + descripciones de depto + resúmenes de líder + filosofía sin duplicado), para que Google la indexe con su propia canónica.

**Architecture:** Copy nueva se guarda en Supabase (sin DDL): filosofía en `real_estate_hub.page_content` (UPDATE a filas existentes); descripciones de depto y resúmenes de líder en `bio_long`/`bio_long_en` de `real_estate_hub.team_members`. El componente `EstructuraPageContent.tsx` se ajusta para renderizar los miembros siempre (no colapsados), la descripción bajo cada departamento y el resumen bajo cada tarjeta de líder.

**Tech Stack:** Next.js 16 (App Router, ISR), next-intl, Supabase (`@supabase/supabase-js`, cliente público anon), Tailwind. Verificación: `tsc --noEmit` + `next build` + curl del SSR. (El proyecto no tiene tests de componente; se siguen sus gates establecidos.)

**Datos de referencia (verificados en prod, 2026-07-18):**
- Vista `real_estate_hub.v_org_structure` = `SELECT … FROM real_estate_hub.team_members WHERE active AND (level='department' OR show_in_org_chart)`.
- Nodos: CEO `role_code='CEO'` (José Benjamín Paredes); directores `CCO`/`COO`/`CFO`; 6 departamentos `level='department'` name ∈ {Marketing, Ventas — PDC y Tulum, Tecnología, Capital Humano, Finanzas y Contabilidad, Administración}; 14 miembros.
- `OrgNodeRow` incluye `bio_long` y `bio_long_en` (usados hoy en `leaderSelect`).

---

### Task 0: Rama de trabajo

**Files:** ninguno (git).

- [ ] **Step 1: Crear rama dedicada desde `main` actualizado**

Confirmar con Luis la base. Comandos (desde `C:/Users/Luis/Projects/Propyte/Next_Propyte_web`):

```bash
git fetch origin main
git checkout -b feat/estructura-seo-enrich origin/main
```

Expected: nueva rama basada en `origin/main` (no sobre `Arreglos_Mercado_rentabilidad`).

- [ ] **Step 2: Mover el spec a esta rama y commitear**

```bash
git add docs/superpowers/specs/2026-07-18-estructura-seo-enrich-design.md docs/superpowers/plans/2026-07-18-estructura-seo-enrich.md
git commit -m "docs(estructura): spec + plan enriquecimiento SEO"
```

---

### Task 1: Cambios de datos en prod Supabase (GATE: autorización explícita)

**⚠️ Requiere que Luis autorice con objetivo nombrado antes de ejecutar (`feedback_autorizacion_explicita_infra`). Todo es aditivo/UPDATE — sin DDL.** Ejecutar vía MCP `execute_sql` en project `oaijxdpevakashxshhvm`.

**Files:** ninguno (datos).

- [ ] **Step 1: Pre-check — confirmar que cada llave matchea exactamente 1 fila**

```sql
select 'philosophy' as k, count(*) from real_estate_hub.page_content
  where page_key='nosotros/estructura' and section_key='philosophy' and field_key in ('text','highlight')
union all select 'leaders', count(*) from real_estate_hub.team_members where role_code in ('CEO','CCO','COO','CFO')
union all select 'depts', count(*) from real_estate_hub.team_members
  where level='department' and name in ('Marketing','Ventas — PDC y Tulum','Tecnología','Capital Humano','Finanzas y Contabilidad','Administración');
```
Expected: philosophy=4 (2 campos × 2 locales), leaders=4, depts=6.

- [ ] **Step 2: Filosofía — UPDATE (elimina el duplicado con `/nosotros`)**

```sql
update real_estate_hub.page_content set value='Propyte se organiza en tres direcciones —Comercial, Operaciones y Finanzas— que responden a la Dirección General. Cada área tiene un dueño claro, un objetivo medible y procesos documentados. El corporativo (Tecnología, Capital Humano y Finanzas) da soporte transversal para que la operación comercial funcione igual en cada plaza. No es un organigrama decorativo: es el mapa de quién responde por qué.'
 where page_key='nosotros/estructura' and section_key='philosophy' and field_key='text' and locale='es';
update real_estate_hub.page_content set value='Cada área tiene un dueño, un objetivo y una forma de medirse. Así crece Propyte: con orden, no con improvisación.'
 where page_key='nosotros/estructura' and section_key='philosophy' and field_key='highlight' and locale='es';
update real_estate_hub.page_content set value='Propyte is organized into three directions —Commercial, Operations, and Finance— reporting to General Management. Each area has a clear owner, a measurable objective, and documented processes. The corporate functions (Technology, Human Resources, and Finance) provide cross-functional support so the commercial operation runs the same way in every location. This isn''t a decorative org chart: it''s the map of who answers for what.'
 where page_key='nosotros/estructura' and section_key='philosophy' and field_key='text' and locale='en';
update real_estate_hub.page_content set value='Every area has an owner, an objective, and a way to measure itself. That''s how Propyte grows: with order, not improvisation.'
 where page_key='nosotros/estructura' and section_key='philosophy' and field_key='highlight' and locale='en';
```

- [ ] **Step 3: Descripciones de departamento — UPDATE `bio_long`/`bio_long_en`**

```sql
update real_estate_hub.team_members set bio_long='Genera demanda y posiciona cada desarrollo: contenido, campañas, fotografía y video, y los materiales con los que el asesor llega preparado a cada conversación.', bio_long_en='Generates demand and positions each development: content, campaigns, photography and video, and the materials advisors bring — ready — to every conversation.'
 where level='department' and name='Marketing';
update real_estate_hub.team_members set bio_long='Acompaña al inversionista de principio a fin. Organizada por plaza —Playa del Carmen y Tulum— con Team Leaders al frente de cada zona y una gerencia que coordina la operación comercial.', bio_long_en='Guides the investor from start to finish. Organized by location —Playa del Carmen and Tulum— with Team Leaders heading each zone and a management layer coordinating the commercial operation.'
 where level='department' and name='Ventas — PDC y Tulum';
update real_estate_hub.team_members set bio_long='Construye y mantiene las herramientas internas: CRM, dashboards, simuladores financieros y la infraestructura de datos que respalda cada recomendación.', bio_long_en='Builds and maintains the internal tools: CRM, dashboards, financial simulators, and the data infrastructure that backs every recommendation.'
 where level='department' and name='Tecnología';
update real_estate_hub.team_members set bio_long='Atrae, forma y desarrolla al talento comercial. Define los estándares de capacitación que permiten crecer sin perder calidad.', bio_long_en='Attracts, trains, and develops commercial talent. Sets the training standards that let us grow without losing quality.'
 where level='department' and name='Capital Humano';
update real_estate_hub.team_members set bio_long='Ordena los números de la operación —tesorería, contabilidad y control— para que cada decisión se tome sobre información real.', bio_long_en='Keeps the operation''s numbers in order —treasury, accounting, and control— so every decision rests on real information.'
 where level='department' and name='Finanzas y Contabilidad';
update real_estate_hub.team_members set bio_long='Sostiene el día a día operativo, jurídico y de postventa: gestión administrativa y acompañamiento legal de cada operación.', bio_long_en='Sustains the day-to-day operational, legal, and after-sales work: administrative management and legal support for every transaction.'
 where level='department' and name='Administración';
```

- [ ] **Step 4: Resúmenes de rol de liderazgo — UPDATE `bio_long`/`bio_long_en` por `role_code`**

```sql
update real_estate_hub.team_members set bio_long='Marca el rumbo estratégico y alinea las tres direcciones hacia un mismo objetivo.', bio_long_en='Sets the strategic direction and aligns the three directions toward a single objective.' where role_code='CEO';
update real_estate_hub.team_members set bio_long='Lidera la generación de negocio: Ventas (PDC y Tulum) y Marketing.', bio_long_en='Leads business generation: Sales (PDC & Tulum) and Marketing.' where role_code='CCO';
update real_estate_hub.team_members set bio_long='Responsable de que la maquinaria interna funcione: Tecnología y Capital Humano.', bio_long_en='Responsible for keeping the internal machinery running: Technology and Human Resources.' where role_code='COO';
update real_estate_hub.team_members set bio_long='Cuida la salud financiera: Finanzas y Contabilidad, y Administración.', bio_long_en='Safeguards financial health: Finance & Accounting, and Administration.' where role_code='CFO';
```

- [ ] **Step 5: Post-check — verificar valores escritos**

```sql
select level, coalesce(role_code, name) as k, left(bio_long,40) es, left(bio_long_en,40) en
 from real_estate_hub.team_members
 where role_code in ('CEO','CCO','COO','CFO') or (level='department')
 order by level, sort_order;
select field_key, locale, left(value,45) from real_estate_hub.page_content
 where page_key='nosotros/estructura' and section_key='philosophy' and field_key in ('text','highlight') order by field_key, locale;
```
Expected: los 4 líderes y 6 departamentos con bio_long es+en no nulos; filosofía text/highlight con el copy nuevo (sin "Team Leader… manual").

---

### Task 2: Código — `EstructuraPageContent.tsx`

**Files:**
- Modify: `src/app/[locale]/nosotros/estructura/EstructuraPageContent.tsx`

- [ ] **Step 1: `OrgCard` — soportar `summary` opcional**

En la firma de `OrgCard`, añadir `summary` y renderizarlo dentro de `content`:

```tsx
function OrgCard({
  role, title, name, color, summary, onSelect,
}: {
  role: string; title: string; name: string; color: string;
  summary?: string;
  onSelect?: () => void;
}) {
  const base = 'bg-white rounded-xl shadow-md p-5 text-center min-w-[180px]';
  const content = (
    <>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{role}</span>
      <p className="text-xs text-gray-600 mt-1">{title}</p>
      <p className="font-semibold text-gray-900 mt-1 text-sm">{name}</p>
      {summary && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{summary}</p>}
    </>
  );
  // …resto igual (button/div wrappers)…
}
```

- [ ] **Step 2: `DeptView` + `buildView` — cargar la descripción del nodo departamento**

Añadir a la interface `DeptView`:
```tsx
  bioLong: string | null;
  bioLongEn: string | null;
```
En el `.map((d) => ({ … }))` de `buildView`, añadir:
```tsx
      bioLong: d.bio_long,
      bioLongEn: d.bio_long_en,
```

- [ ] **Step 3: Reemplazar `DeptAccordion` (colapsado) por `DeptSection` (miembros siempre visibles + descripción)**

```tsx
function DeptSection({ dept }: { dept: DeptView }) {
  const Icon = resolveIcon(dept.iconName);
  const t = useTranslations('about');
  const locale = useLocale();
  const description = pickBio(locale, dept.bioLong, dept.bioLongEn);

  return (
    <div className="bg-[#F4F6F8] rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-2">
        <Icon size={18} className="text-[#1A2F3F]" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-[#1A2F3F]">
          {dept.name}
          {dept.isCorporate && <span className="ml-2 text-xs font-normal text-gray-600">(Corp.)</span>}
        </h3>
      </div>
      {description && (
        <p className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">{description}</p>
      )}
      <div className="px-4 pb-4 space-y-2">
        {dept.members.length === 0 && (
          <p className="text-xs text-gray-500 italic py-2">{t('hiring')}</p>
        )}
        {dept.members.map((m) => (
          <div key={m.id} className="flex justify-between text-sm py-1">
            <span className="text-gray-600">{m.role}</span>
            {m.is_vacant ? (
              <span className="text-[#0E7490] text-xs font-medium">{t('hiring')}</span>
            ) : (
              <span className="font-medium text-gray-900">
                {m.name}
                {m.is_corporate && <span className="ml-1 text-xs text-gray-600">(Corp.)</span>}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Actualizar referencias `DeptAccordion` → `DeptSection`**

En `EstructuraPageContent` hay 2 usos (grid desktop y stack mobile). Reemplazar ambos `<DeptAccordion key={dept.id} dept={dept} />` por `<DeptSection key={dept.id} dept={dept} />`.

- [ ] **Step 5: Resumen inline en tarjetas de líder (CEO + directores)**

Dentro de `EstructuraPageContent`, tras `const t = …`, añadir helper:
```tsx
  const leaderSummary = (n: OrgNodeRow) => pickBio(locale, n.bio_long, n.bio_long_en) ?? undefined;
```
Añadir `summary={leaderSummary(ceo)}` al `OrgCard` del CEO (desktop y mobile) y `summary={leaderSummary(d)}` a los `OrgCard` de directores (desktop y mobile). 4 sitios en total (2 CEO, 2 loops de directores).

- [ ] **Step 6: Limpiar imports sin uso**

`ChevronDown`/`ChevronUp` ya no se usan (eran del acordeón). Quitarlos del import de `@/lib/icons`. `useState` sigue en uso (estado `selected` del modal) — no tocar.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

---

### Task 3: Verificación local (build + SSR)

**Files:** ninguno.

- [ ] **Step 1: Build de producción**

Run: `npm run build`
Expected: build verde (sin errores de tipos ni de ISR).

- [ ] **Step 2: Levantar y verificar SSR (con datos ya aplicados en Task 1)**

```bash
npm run start &
# esperar a que levante en :3000
curl -s http://localhost:3000/es/nosotros/estructura > /tmp/estructura.html
```

- [ ] **Step 3: Assert de contenido en el HTML SSR (sin JS)**

Verificar presencia de: los 14 nombres de miembro (p.ej. "Conrad Alvarado", "Zyanya Martineau", "Kenny Mex", "Luis Flores", "Dana Marisol", "Montserrat Alonso"), las 6 descripciones (p.ej. "Genera demanda y posiciona"), los 4 resúmenes de líder (p.ej. "Marca el rumbo estratégico"), y el nuevo highlight ("con orden, no con improvisación"). Y **ausencia** de "podría replicar esta estructura en otra ciudad con solo el manual".

```bash
grep -c "Conrad Alvarado\|Genera demanda\|Marca el rumbo\|con orden, no con improvisación" /tmp/estructura.html   # > 0
grep -c "replicar esta estructura en otra ciudad" /tmp/estructura.html                                             # == 0
```
Expected: primer grep ≥ 4; segundo grep = 0. Repetir con `/en/nosotros/estructura` para paridad EN.

---

### Task 4: Commit, PR y deploy (GATE: deploy solo cuando Luis lo indique)

**Files:** ninguno.

- [ ] **Step 1: Commit del código**

```bash
git add src/app/[locale]/nosotros/estructura/EstructuraPageContent.tsx
git commit -m "feat(estructura): miembros visibles en SSR + descripciones depto + resúmenes de líder"
```

- [ ] **Step 2: Push + PR**

```bash
git push -u origin feat/estructura-seo-enrich
gh pr create --title "Enriquecer /nosotros/estructura para indexación SEO" --body "Ver docs/superpowers/specs/2026-07-18-estructura-seo-enrich-design.md"
```

- [ ] **Step 3: Merge a `main` (auto-deploy Hostinger) — SOLO con OK explícito de Luis** (`feedback_deploy_permission`).

- [ ] **Step 4: Post-deploy — revalidar ISR y verificar prod**

Esperar ≤10 min (`revalidate=600`) u on-demand desde Hub. Luego:
```bash
curl -s https://propyte.com/es/nosotros/estructura | grep -c "Conrad Alvarado\|Genera demanda\|con orden, no con improvisación"   # > 0
```

- [ ] **Step 5: GSC — solicitar reindexación**

En Search Console → Inspección de URLs → `https://propyte.com/es/nosotros/estructura` → "Solicitar indexación". Repetir con `/en/…`. Dar seguimiento días después a que la canónica seleccionada por Google pase a ser la propia.

---

## Notas de verificación del plan (self-review)

- **Cobertura del spec:** filosofía (Task 1.2), descripciones depto (1.3 + 2.2/2.3), resúmenes líder (1.4 + 2.5), miembros visibles (2.3), sin DDL (todo UPDATE), stats sin tocar ✓, paridad EN (SQL bilingüe + verificación 3.3) ✓.
- **Sin placeholders:** SQL y TSX completos e íntegros.
- **Consistencia de tipos:** `DeptView.bioLong/bioLongEn` (2.2) consumidos en `DeptSection` (2.3); `OrgCard.summary` (2.1) provisto en 2.5; `pickBio(locale, …)` ya existe e importado.
- **Riesgo modal líder:** al poner `bio_long` en los 4 líderes, `leaderSelect` los vuelve clickeables → el modal mostrará el mismo resumen corto (redundante pero inofensivo). Aceptado; no requiere cambio.
