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
-- PARTE 2 · REPARTO — EJECUTADA 2026-08-04 ~23:50 UTC · 18 filas
-- ═══════════════════════════════════════════════════════════════════════
--
-- CORTE: las 18 filas vivas que NO son ISAI. Decisión de Luis.
--
-- Por qué se excluye ISAI: es la única parte móvil de la tabla. En una hora del
-- 2026-08-04, dos duplicados de ISAI se fueron a la papelera, apareció uno nuevo
-- y ese nuevo se publicó. Clasificar filas que están en plena deduplicación es
-- trabajo tirado, y excluir ISAI es el corte PRECISO — excluir todos los drafts
-- sería un proxy más grueso que además dejaría abierto el bloqueo #8, porque sus
-- tres piezas son draft.
--
-- Las dos filas ISAI vivas quedan en NULL A PROPÓSITO, no por olvido:
--   isai-quintana-roo-yucatan-2026                         (draft, slug canónico del maestro)
--   isai-isabi-2026-tulum-cancun-playa-merida-1785884402690 (PUBLICADO 23:46, duplicado)
-- Se clasifican cuando Luis decida cuál es el P1-02 canónico.
--
-- La lista es explícita de (slug, locale) a propósito. La alternativa —match por
-- patrón, `where slug not like '%isai%'`— clasificaría en silencio lo que
-- aparezca después.
--
-- Conteos verificados DESPUÉS de ejecutar:
--   pilar     → P1=10, P5=5, P7=3 · sin clasificar=2 (las ISAI)
--   audiencia → inversionistas=15, asesores=3
--   filas en papelera clasificadas por error → 0
--   publicadas sin pilar → 1 (el duplicado ISAI publicado a media migración)

update public.blog_posts p
set pilar = v.pilar, audiencia = v.audiencia
from (values
  -- ── P1 · Fiscal y Legal (10) ──────────────────────────────────────────
  ('isr-venta-propiedad-extranjero-mexico',           'es', 'P1', 'inversionistas'), -- P1-01 publicado
  ('isr-venta-propiedad-extranjero-mexico',           'en', 'P1', 'inversionistas'), -- P1-01 publicado
  ('fiscal-legalcfdi-compra-inmueble',                'es', 'P1', 'inversionistas'), -- P1-03
  ('rfc-extranjero-curp-biometrica-2026',             'es', 'P1', 'inversionistas'), -- P1-04
  ('fideicomiso-extranjeros-guia-2026',               'es', 'P1', 'inversionistas'), -- P1-05 publicado
  ('fideicomiso-extranjeros-guia-2026',               'en', 'P1', 'inversionistas'), -- P1-05 draft (misma pieza, otro locale)
  ('residencia-comprar-mexico-playa-del-carmen',      'es', 'P1', 'inversionistas'), -- P1-06
  ('ejido-vs-propiedad-privada-tulum',                'es', 'P1', 'inversionistas'), -- P1-07 publicado
  ('ejido-vs-propiedad-privada-tulum',                'en', 'P1', 'inversionistas'), -- P1-07 publicado
  ('due-diligence-inmuebles-mexico-17-puntos',        'es', 'P1', 'inversionistas'), -- P1-08
  -- ── P5 · Mercado y Zonas (5) ──────────────────────────────────────────
  -- Las tres marcadas cierran el bloqueo #8: están como "Estilo de vida" y son
  -- Mercado. Se les mueve el PILAR, no la categoría: `category` es el eje que
  -- gobierna UI viva, y ahí "Estilo de vida" → sin hub sigue siendo correcto.
  ('guia-inversion-tulum-precios-zonas-plusvalia',    'es', 'P5', 'inversionistas'), -- P5-01
  ('tulum-correccion-2025-2026',                      'es', 'P5', 'inversionistas'), -- P5-02 <- bloqueo #8
  ('playa-del-carmen-inversion-2026',                 'es', 'P5', 'inversionistas'), -- P5-03 <- bloqueo #8
  ('cancun-zona-residencial-lujo',                    'es', 'P5', 'inversionistas'), -- P5-04 <- bloqueo #8
  ('caribbean-pulse-reporte-trimestral-riviera-maya', 'es', 'P5', 'inversionistas'), -- P5-10
  -- ── P7 · Canal (3) ────────────────────────────────────────────────────
  ('que-es-un-master-broker-inmobiliario',            'es', 'P7', 'asesores'),       -- P7-01
  ('compartir-comision-sin-que-te-brinquen',          'es', 'P7', 'asesores'),       -- P7-02
  ('cerrar-con-comprador-extranjero',                 'es', 'P7', 'asesores')        -- P7-03
) as v(slug, locale, pilar, audiencia)
where p.slug = v.slug and p.locale = v.locale and p.deleted_at is null;

-- Las filas en papelera quedan en NULL: son duplicados borrados, y clasificarlos
-- afirmaría que forman parte de la taxonomía.
--
-- PENDIENTE al cerrar: las 2 filas ISAI. Cuando se resuelva cuál es el P1-02
-- canónico, clasificarla como ('P1','inversionistas') y resolver la otra URL.


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
