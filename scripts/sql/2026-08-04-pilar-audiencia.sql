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
-- ═══════════════════════════════════════════════════════════════════════
-- PARTE 3 · CIERRE DE ISAI Y PIEZAS NUEVAS — EJECUTADA 2026-08-05
-- ═══════════════════════════════════════════════════════════════════════
--
-- Decisión de Luis: queda el ISAI publicado, el que siguió en draft se va.
--
-- Contexto de lo que pasó entre la Parte 2 y esta: Luis renombró el duplicado
-- con timestamp al slug canónico del maestro y lo publicó en es y en, y movió el
-- draft viejo a `...-version-junio`. Eso conserva la URL indexada
-- `isai-quintana-roo-yucatan-2026` sin necesidad de 301, porque ahora la sirve la
-- pieza publicada. También apareció `cfdi-compra-inmueble` publicado en es y en:
-- es P1-03 en el slug nuevo que el maestro recomienda.

-- 1) Clasificar las 4 publicadas que quedaban sin pilar.
update public.blog_posts p
set pilar = v.pilar, audiencia = v.audiencia
from (values
  ('isai-quintana-roo-yucatan-2026', 'es', 'P1', 'inversionistas'), -- P1-02 canónico
  ('isai-quintana-roo-yucatan-2026', 'en', 'P1', 'inversionistas'), -- P1-02 canónico
  ('cfdi-compra-inmueble',           'es', 'P1', 'inversionistas'), -- P1-03
  ('cfdi-compra-inmueble',           'en', 'P1', 'inversionistas')  -- P1-03
) as v(slug, locale, pilar, audiencia)
where p.slug = v.slug and p.locale = v.locale and p.deleted_at is null;

-- 2) El ISAI que siguió en draft, a la papelera. Borrado SUAVE (deleted_at),
--    recuperable. Su slug `...-version-junio` nunca estuvo indexado, así que no
--    necesita 301.
update public.blog_posts
set deleted_at = now(),
    deleted_by = 'marketing@nativatulum.mx via claude-code (dedup ISAI 2026-08-05)'
where slug = 'isai-quintana-roo-yucatan-2026-version-junio'
  and locale = 'es' and deleted_at is null;

-- Verificado después:
--   vivas=22 · publicadas=9 · papelera=11
--   vivas sin pilar → 0 · publicadas sin pilar → 0
--   papelera clasificada por error → 0
--   P1=14 (9 publicadas + 5 draft) · P5=5 (0+5) · P7=3 (0+3)
--   filtro público: es → P1 con 5 piezas · en → P1 con 4
--   la pieza en papelera resuelve al not-found de Next y NO filtra su contenido
--
-- ═══════════════════════════════════════════════════════════════════════
-- PARTE 4 · CIERRE DE CFDI — EJECUTADA 2026-08-05
-- ═══════════════════════════════════════════════════════════════════════
--
-- Decisión de Luis: mismo criterio que ISAI, el draft se va y el publicado queda.
--
-- DIFERENCIA con ISAI, y por eso este caso sí necesitó 301: en ISAI los dos slugs
-- terminaron siendo el mismo (Luis renombró la pieza publicada al slug canónico),
-- así que la URL indexada quedó servida. Aquí los slugs son DISTINTOS
-- —`fiscal-legalcfdi-compra-inmueble` vs `cfdi-compra-inmueble`— así que archivar
-- sin redirect dejaba un 404 en una URL con published_at del 18-jun-2026.
-- El maestro §1 pide exactamente este 301.
--
-- ORDEN IMPORTANTE: primero el redirect, después la papelera. Al revés hay una
-- ventana en la que la URL vieja devuelve 404.

-- 1) El 301. entity_id null es CORRECTO para blog_post: `resolve-target.ts` solo
--    resuelve por entidad los `development` (RESUELTOS_POR_ENTIDAD); para blog
--    respeta `new_slug`, porque esas filas las escribe una persona.
insert into real_estate_hub.slug_redirects
  (entity_type, entity_id, old_slug, new_slug, kind, reason, created_by)
select 'blog_post', null,
       'fiscal-legalcfdi-compra-inmueble', 'cfdi-compra-inmueble', 'redirect',
       'P1-03 CFDI. Slug viejo malformado al migrar de carpeta a plana; maestro §1.',
       'claude-code (autorizado por Luis 2026-08-05)'
where not exists (
  select 1 from real_estate_hub.slug_redirects
  where entity_type = 'blog_post' and old_slug = 'fiscal-legalcfdi-compra-inmueble'
);

-- 2) La pieza superada, a la papelera (borrado suave).
update public.blog_posts
set deleted_at = now(),
    deleted_by = 'marketing@nativatulum.mx via claude-code (superado por cfdi-compra-inmueble, 301 creado antes)'
where slug = 'fiscal-legalcfdi-compra-inmueble' and locale = 'es' and deleted_at is null;

-- Verificado con el servidor de producción, no solo en la tabla:
--   /es/blog/fiscal-legalcfdi-compra-inmueble → 308 → /es/blog/cfdi-compra-inmueble
--   /en/... → 308 → /en/blog/cfdi-compra-inmueble  (el redirect no lleva locale)
--   el destino renderiza con <h1> real y 200 en los dos idiomas: no es un 308
--   hacia un soft-404, que es el fallo que documenta resolve-target.ts
--   el 308 sigue vivo DESPUÉS de mandar la pieza a la papelera
--
-- Estado final: vivas=21 (9 publicadas, 12 draft) · sin pilar=0 · papelera=12
--   P1=13 (9+4) · P5=5 (0+5) · P7=3 (0+3)
--   los 2 redirects de blog apuntan a destinos publicados en 2 locales cada uno
--
-- Nota: 1 fila de la papelera conserva su pilar (este CFDI, clasificado cuando
-- estaba vivo). No es un error: toda consulta pública filtra `deleted_at is null`,
-- y si alguien la restaura vuelve ya clasificada.


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
