# Enriquecer `/nosotros/estructura` para indexación SEO

**Fecha:** 2026-07-18
**Autor:** Luis Flores (con Claude)
**Página:** `https://propyte.com/{es,en}/nosotros/estructura`

## Problema

Google marcó la página como *"Duplicada: Google eligió una canónica diferente a la del usuario"* (GSC, jul-2026) y la excluyó del índice, prefiriendo `/es/nosotros`.

Causa verificada (no es bug técnico — el marcado canonical/hreflang está correcto):

1. **Miembros invisibles al crawler.** El organigrama existe y está poblado en Supabase (`real_estate_hub.v_org_structure`: 1 CEO, 3 directores, 6 departamentos, 14 miembros). Pero los 14 miembros se renderizan dentro de acordeones colapsados (`useState(false)` → `{open && …}`), así que **no están en el DOM del SSR**. Googlebot no hace clic → nunca ve nombres ni roles. Solo se indexan CEO + 3 directores + 6 headers de departamento.
2. **Copy único duplicado.** El único párrafo con texto sustancial es `page_content > philosophy.highlight` = *"Cada decisión organizacional pasa por un filtro: ¿un Team Leader nuevo podría replicar esta estructura en otra ciudad con solo el manual?"* — casi idéntico a una frase de `/nosotros`. Esa señal de duplicado es la que manda a Google a canonicalizar hacia `/nosotros`.
3. **Sin descripciones.** Los departamentos solo muestran su nombre; los líderes solo nombre+rol. No hay copy que describa qué hace cada área.

## Objetivo

Que `/nosotros/estructura` tenga contenido único y sustancial **visible en el SSR**, para que Google la indexe con su propia canónica en vez de descartarla como duplicado de `/nosotros`.

## Alcance aprobado (Luis, 2026-07-18)

Incluye: hacer visibles los 14 miembros (técnico) + descripciones por departamento + reescribir filosofía + resúmenes de rol de liderazgo.
**Fuera de alcance:** stats (ya son correctos: 6 deptos / 3 directores / 2 plazas / "Creciendo"); bios personales extensas de liderazgo (solo resumen de rol); cambios de esquema (DDL).

## Cambios de contenido (ES — canónico; EN se genera con paridad en implementación)

### 1. Filosofía — UPDATE a filas `page_content` existentes (`page_key='nosotros/estructura'`)
- `philosophy.title` → *se mantiene*: "Cómo está diseñada nuestra estructura"
- `philosophy.text` → **nuevo:** "Propyte se organiza en tres direcciones —Comercial, Operaciones y Finanzas— que responden a la Dirección General. Cada área tiene un dueño claro, un objetivo medible y procesos documentados. El corporativo (Tecnología, Capital Humano y Finanzas) da soporte transversal para que la operación comercial funcione igual en cada plaza. No es un organigrama decorativo: es el mapa de quién responde por qué."
- `philosophy.highlight` → **nuevo (elimina el duplicado):** "Cada área tiene un dueño, un objetivo y una forma de medirse. Así crece Propyte: con orden, no con improvisación."

### 2. Descripciones de departamento — `bio_long`/`bio_long_en` del nodo departamento
| Departamento | Descripción (ES) |
|---|---|
| Marketing | Genera demanda y posiciona cada desarrollo: contenido, campañas, fotografía y video, y los materiales con los que el asesor llega preparado a cada conversación. |
| Ventas — PDC y Tulum | Acompaña al inversionista de principio a fin. Organizada por plaza —Playa del Carmen y Tulum— con Team Leaders al frente de cada zona y una gerencia que coordina la operación comercial. |
| Tecnología | Construye y mantiene las herramientas internas: CRM, dashboards, simuladores financieros y la infraestructura de datos que respalda cada recomendación. |
| Capital Humano | Atrae, forma y desarrolla al talento comercial. Define los estándares de capacitación que permiten crecer sin perder calidad. |
| Finanzas y Contabilidad | Ordena los números de la operación —tesorería, contabilidad y control— para que cada decisión se tome sobre información real. |
| Administración | Sostiene el día a día operativo, jurídico y de postventa: gestión administrativa y acompañamiento legal de cada operación. |

### 3. Resúmenes de rol de liderazgo — `bio_long`/`bio_long_en` del nodo líder
| Líder | Rol | Resumen (ES) |
|---|---|---|
| José Benjamín Paredes | Director General (CEO) | Marca el rumbo estratégico y alinea las tres direcciones hacia un mismo objetivo. |
| Felipe Luksic | Director Comercial (CCO) | Lidera la generación de negocio: Ventas (PDC y Tulum) y Marketing. |
| Landy López | Director de Operaciones (COO) | Responsable de que la maquinaria interna funcione: Tecnología y Capital Humano. |
| Mario Caamal | Director de Finanzas (CFO) | Cuida la salud financiera: Finanzas y Contabilidad, y Administración. |

## Cambios técnicos (código — `Next_Propyte_web`)

Archivos: `src/app/[locale]/nosotros/estructura/EstructuraPageContent.tsx` (principal).

1. **Miembros visibles en SSR (Opción 1).** Renderizar los miembros de cada departamento sin depender del estado de acordeón: que estén siempre en el DOM del SSR (colapsable en cliente opcional, pero presente aunque esté cerrado). Aplica a las vistas desktop y mobile.
2. **Descripción de departamento inline.** Renderizar `dept.bio_long` (según locale, con `bio_long_en`) bajo el header del acordeón, visible en SSR.
3. **Resumen de rol de líder inline.** Renderizar el `bio_long` del CEO/directores como texto visible bajo la `OrgCard` (hoy solo aparece en modal al hacer clic → no crawlable). Revisar interacción con `leaderSelect`/`TeamBioModal` para no duplicar comportamiento.
4. La filosofía ya se lee de `page_content` vía `getPageContent` — sin cambio de código, solo datos.

## Modelo de datos / almacenamiento

- **Sin DDL.** Se reutilizan columnas existentes.
- Descripciones de depto + resúmenes de líder → `bio_long` (es) y `bio_long_en` (en) en la **tabla base** detrás de `real_estate_hub.v_org_structure` (identificar nombre exacto en el plan; `UPDATE` por `id` de nodo).
- Filosofía → `UPDATE` de `real_estate_hub.page_content` (filas es+en ya existen).
- Todo queda editable desde el Hub (editor de organigrama + editor de contenido de página).

## Riesgos y gates

- **Escrituras a prod Supabase (aditivas, no DDL).** SQL `UPDATE` listo y revisado antes de ejecutar; requiere autorización explícita de Luis con objetivo nombrado (ver `feedback_autorizacion_explicita_infra`).
- **Deploy.** `Next_Propyte_web` auto-deploya `main` a Hostinger. El cambio de código va por rama + PR; deploy solo cuando Luis lo indique (`feedback_deploy_permission`).
- **ISR.** La página es ISR (`revalidate = 600`). Tras el cambio de datos, revalidar (esperar ≤10 min u on-demand desde Hub) para ver el contenido nuevo.
- **Paridad EN.** Toda copy nueva debe tener su versión EN antes de deploy.
- **`department_name` cosmético.** Miembros con `department_name` "Ventas — Tulum"/"Ventas — PDC"/"Postventa" se muestran bien vía `reports_to_id` (no son huérfanos); no requiere fix, solo nota.

## Verificación

1. `curl -s https://propyte.com/es/nosotros/estructura` (sin JS) debe contener: los 14 nombres de miembros, las 6 descripciones de departamento, los 4 resúmenes de líder, y el nuevo `philosophy.highlight` (sin la frase "Team Leader… manual").
2. Conteo de palabras del texto visible sustancialmente mayor a las ~201 actuales.
3. Post-deploy: GSC → Inspección de URLs → "Solicitar indexación"; validar que la canónica seleccionada por Google pase a ser la propia.
