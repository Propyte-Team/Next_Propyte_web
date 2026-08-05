-- Borrado de briefs con archivo previo · EJECUTADO 2026-08-05
-- Migración de la tabla: `2026-08-05-blog-briefs-archivados`
--
-- ── Por qué el borrado es REAL y no suave ─────────────────────────────────────
-- `blog_briefs` no tiene borrado suave (ni `deleted_at`, ni estado de archivado:
-- su CHECK solo admite draft | ready | used). Añadirle un borrado suave desde la
-- BD no habría servido, porque el Hub no sabría filtrarlo y los briefs seguirían
-- apareciendo en su lista: creerías que se fueron y seguirían ahí. Para que
-- desaparezcan del Hub sin tocar su repo, el borrado tiene que ser real.
--
-- El precio de eso es la irreversibilidad, y por eso existe
-- `blog_briefs_archivados`: la fila completa se copia antes, así que el borrado
-- sigue siendo recuperable aunque el Hub ya no la vea.
--
-- Verificado que nada referencia a blog_briefs por FK, así que borrar no
-- huerfaniza nada. El trigger `trg_estampar_pilar_desde_brief` dispara en INSERT
-- y UPDATE, no en DELETE: borrar un brief no toca el pilar ya estampado.

-- 1) Copiar al archivo.
insert into real_estate_hub.blog_briefs_archivados
select b.*, now(), 'claude-code (autorizado por Luis 2026-08-05)',
       'Brief sin codigo canonico y sin post generado. Limpieza previa a asignar codigos.'
from real_estate_hub.blog_briefs b
where b.code is null
  and b.generated_post_id is null
  and not exists (
    select 1 from real_estate_hub.blog_briefs_archivados a where a.id = b.id
  );

-- 2) Verificar la copia ANTES de borrar. Debe dar 2 y 2: comparación campo por
--    campo con to_jsonb, no un conteo de filas que no prueba nada.
--
-- select
--   (select count(*) from real_estate_hub.blog_briefs where code is null) as vivos_sin_codigo,
--   (select count(*) from real_estate_hub.blog_briefs b
--      join real_estate_hub.blog_briefs_archivados a on a.id = b.id
--      where to_jsonb(b) = (to_jsonb(a) - 'archivado_at' - 'archivado_por' - 'motivo')
--   ) as copias_identicas;

-- 3) Borrar, con cinturón: nada que no esté ya en el archivo.
delete from real_estate_hub.blog_briefs b
where b.code is null
  and b.generated_post_id is null
  and exists (select 1 from real_estate_hub.blog_briefs_archivados a where a.id = b.id);

-- Borrados (2):
--   de7efcce  "Brief sin título"           · keyword "por definir", vacío
--   4cc3f7e8  "Comprar departamento en Tulum 2026: guía completa de precios"
--             · su tema es P5-01, que ya tiene draft en
--               `guia-inversion-tulum-precios-zonas-plusvalia`
--
-- Estado después: 3 briefs vivos (P1-01, P1-02, P1-03, todos used y con post),
-- 0 sin código, 2 archivados recuperables. Los 21 posts vivos y sus pilares
-- intactos.


-- ── RESTAURAR uno archivado ───────────────────────────────────────────────────
-- Devuelve la fila a blog_briefs tal como estaba. Ojo: al reinsertar con su
-- `code` y `generated_post_id`, el trigger de pilar dispara — lo cual es correcto,
-- pero solo rellena posts que tengan `pilar` en NULL.
--
-- insert into real_estate_hub.blog_briefs
-- select (to_jsonb(a) - 'archivado_at' - 'archivado_por' - 'motivo')::text::jsonb
--          #>> '{}' -- placeholder: en la práctica listar las columnas explícitamente
-- from real_estate_hub.blog_briefs_archivados a
-- where left(a.id::text, 8) = 'de7efcce';
--
-- Más simple y sin acrobacias de jsonb, nombrando las columnas:
--
-- insert into real_estate_hub.blog_briefs (id, code, working_title, primary_keyword,
--        intent, profile, status, generated_post_id, created_at, updated_at)
-- select id, code, working_title, primary_keyword, intent, profile, status,
--        generated_post_id, created_at, updated_at
-- from real_estate_hub.blog_briefs_archivados
-- where left(id::text, 8) = 'de7efcce';
--   -- (añadir el resto de columnas que interesen; el archivo las conserva todas)
