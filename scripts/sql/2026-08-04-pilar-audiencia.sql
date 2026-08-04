-- Taxonomía canónica de pilares en blog_posts.
-- Fuente: docs-editorial/07_Sistema-Pilares_MAESTRO_corte-30jul2026.md §4-§10.
-- Cierra los bloqueos #7 y #8 de su §14.
--
-- Se ejecuta en DOS PARTES a propósito. La parte 1 es aditiva y ya está
-- aplicada; la parte 2 espera a que termine la deduplicación de ISAI, porque
-- clasificar filas que están por borrarse es trabajo tirado.

-- ═══════════════════════════════════════════════════════════════════════
-- PARTE 1 · DDL — APLICADA 2026-08-04 (migración `2026-08-04-pilar-audiencia-ddl`)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Nullable y sin default a propósito: NULL = "sin clasificar", que es honesto.
-- Un default metería cada fila nueva en un pilar que nadie eligió.
--
-- Verificado antes de aplicar (riesgo de sombreado 42702 y de vista congelada):
-- blog_posts tiene UN solo trigger (`set_blog_updated_at`, el de updated_at),
-- CERO vistas que la referencien y CERO funciones plpgsql que la mencionen.
-- Verificado después: los dos CHECK rechazan valores fuera del catálogo.
--
-- Idempotente: `add constraint` no acepta `if not exists`, de ahí el DO block.

alter table public.blog_posts
  add column if not exists pilar text,
  add column if not exists audiencia text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_pilar_chk') then
    alter table public.blog_posts
      add constraint blog_posts_pilar_chk
        check (pilar is null or pilar in ('P1','P2','P3','P4','P5','P6','P7'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'blog_posts_audiencia_chk') then
    alter table public.blog_posts
      add constraint blog_posts_audiencia_chk
        check (audiencia is null or audiencia in ('asesores','inversionistas'));
  end if;
end $$;

create index if not exists blog_posts_pilar_idx
  on public.blog_posts (pilar) where deleted_at is null;
create index if not exists blog_posts_audiencia_idx
  on public.blog_posts (audiencia) where deleted_at is null;


-- ═══════════════════════════════════════════════════════════════════════
-- PARTE 2 · REPARTO — PENDIENTE, requiere autorización y remedición
-- ═══════════════════════════════════════════════════════════════════════
--
-- POR QUÉ ESPERA: el 2026-08-04 la tabla cambió mientras se preparaba esta
-- migración. En una hora, dos duplicados de ISAI se fueron a la papelera y
-- apareció una fila ISAI nueva. La tabla es un blanco móvil mientras se trabaja
-- en el Hub, así que esta lista se REMIDE justo antes de ejecutarse.
--
-- El reparto es una lista explícita de (slug, locale) a propósito. La
-- alternativa —hacer match por patrón, `where slug like 'isai%'`— clasificaría
-- en silencio lo que aparezca después y no debería.
--
-- ANTES DE EJECUTAR:
--   1. Correr el bloque de verificación del final de este archivo.
--   2. Si `hacen_match` no es igual al total de la lista, o si
--      `vivas_fuera_del_plan` no es 0, esta lista está vieja: rehacerla.
--   3. Pedir autorización explícita.
--
-- Conteos esperados con la lista de abajo (medida 2026-08-04 ~23:05 UTC):
--   pilar     → P1=12, P5=5, P7=3   · total 20
--   audiencia → inversionistas=17, asesores=3
--   filas vivas con pilar IS NULL → 0

update public.blog_posts p
set pilar = v.pilar, audiencia = v.audiencia
from (values
  -- ── P1 · Fiscal y Legal (12) ──────────────────────────────────────────
  ('isr-venta-propiedad-extranjero-mexico',                 'es', 'P1', 'inversionistas'), -- P1-01
  ('isr-venta-propiedad-extranjero-mexico',                 'en', 'P1', 'inversionistas'), -- P1-01
  ('isai-quintana-roo-yucatan-2026',                        'es', 'P1', 'inversionistas'), -- P1-02 · slug canónico del maestro
  ('isai-isabi-2026-tulum-cancun-playa-merida-1785884402690','es', 'P1', 'inversionistas'), -- P1-02 · duplicado creado 2026-08-04 23:00
  ('fiscal-legalcfdi-compra-inmueble',                      'es', 'P1', 'inversionistas'), -- P1-03
  ('rfc-extranjero-curp-biometrica-2026',                   'es', 'P1', 'inversionistas'), -- P1-04
  ('fideicomiso-extranjeros-guia-2026',                     'es', 'P1', 'inversionistas'), -- P1-05
  ('fideicomiso-extranjeros-guia-2026',                     'en', 'P1', 'inversionistas'), -- P1-05
  ('residencia-comprar-mexico-playa-del-carmen',            'es', 'P1', 'inversionistas'), -- P1-06
  ('ejido-vs-propiedad-privada-tulum',                      'es', 'P1', 'inversionistas'), -- P1-07
  ('ejido-vs-propiedad-privada-tulum',                      'en', 'P1', 'inversionistas'), -- P1-07
  ('due-diligence-inmuebles-mexico-17-puntos',              'es', 'P1', 'inversionistas'), -- P1-08
  -- ── P5 · Mercado y Zonas (5) ──────────────────────────────────────────
  -- Las tres marcadas son el bloqueo #8: están como "Estilo de vida" y son
  -- Mercado. Se les mueve el PILAR, no la categoría: `category` es el eje que
  -- gobierna UI viva, y ahí "Estilo de vida" → sin hub sigue siendo correcto.
  ('guia-inversion-tulum-precios-zonas-plusvalia',          'es', 'P5', 'inversionistas'), -- P5-01
  ('tulum-correccion-2025-2026',                            'es', 'P5', 'inversionistas'), -- P5-02 <- bloqueo #8
  ('playa-del-carmen-inversion-2026',                       'es', 'P5', 'inversionistas'), -- P5-03 <- bloqueo #8
  ('cancun-zona-residencial-lujo',                          'es', 'P5', 'inversionistas'), -- P5-04 <- bloqueo #8
  ('caribbean-pulse-reporte-trimestral-riviera-maya',       'es', 'P5', 'inversionistas'), -- P5-10
  -- ── P7 · Canal (3) ────────────────────────────────────────────────────
  ('que-es-un-master-broker-inmobiliario',                  'es', 'P7', 'asesores'),       -- P7-01
  ('compartir-comision-sin-que-te-brinquen',                'es', 'P7', 'asesores'),       -- P7-02
  ('cerrar-con-comprador-extranjero',                       'es', 'P7', 'asesores')        -- P7-03
) as v(slug, locale, pilar, audiencia)
where p.slug = v.slug and p.locale = v.locale and p.deleted_at is null;

-- Las filas en papelera quedan en NULL: son duplicados borrados, y clasificarlos
-- afirmaría que forman parte de la taxonomía.


-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN · correr ANTES (paso 1) y DESPUÉS del reparto
-- ═══════════════════════════════════════════════════════════════════════

-- Antes: ¿la lista de arriba sigue describiendo la tabla?
--   hacen_match debe ser igual a en_el_plan, y vivas_fuera_del_plan debe ser 0.
--
-- with plan(slug, locale) as (values ... la misma lista de arriba ...)
-- select
--   (select count(*) from plan) as en_el_plan,
--   (select count(*) from plan pl join public.blog_posts b
--      on b.slug = pl.slug and b.locale = pl.locale and b.deleted_at is null) as hacen_match,
--   (select count(*) from public.blog_posts b where b.deleted_at is null
--      and not exists (select 1 from plan pl
--                      where pl.slug = b.slug and pl.locale = b.locale)) as vivas_fuera_del_plan;

-- Después: el reparto y que no quede nada sin clasificar.
--
-- select pilar, audiencia, count(*) from public.blog_posts
-- where deleted_at is null group by pilar, audiencia order by pilar, audiencia;
--
-- select count(*) as vivas_sin_clasificar from public.blog_posts
-- where deleted_at is null and pilar is null;
