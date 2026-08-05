-- Asignación automática del pilar desde el brief · APLICADA 2026-08-05
-- Migración: `2026-08-05-trigger-pilar-desde-brief`
--
-- Resuelve el pendiente de que toda pieza generada nacía con `pilar = NULL` y
-- había que clasificarla a mano.
--
-- ── Por qué sobre blog_briefs y no sobre blog_posts ───────────────────────────
-- El enlace va brief → post (`blog_briefs.generated_post_id`). Cuando el Hub
-- inserta el post, el brief todavía no lo apunta, así que un trigger sobre
-- blog_posts no encontraría su brief. Dispara al llenarse `generated_post_id`.
-- Efecto secundario bueno: blog_briefs se escribe mucho menos que blog_posts.
--
-- ── Por qué del `code` y NUNCA del `pillar_url` ───────────────────────────────
-- Medido el 2026-08-05: el brief P1-02 tiene `pillar_url = '/es/como-comprar'`
-- como parche temporal puesto mientras el hub de P1 no existía. Derivar de la URL
-- habría clasificado esa pieza como P2 en vez de P1. El `code` es el
-- identificador canónico del maestro y el que el Hub usa para emparejar briefs.
--
-- ── Las dos salvaguardas ──────────────────────────────────────────────────────
-- 1. `pilar is null` en el WHERE: rellena huecos, NUNCA pisa una clasificación
--    hecha a mano. Reclasificar es un acto explícito.
-- 2. `security definer` + `search_path = ''`: si el rol que escribe el brief no
--    pudiera actualizar blog_posts, el trigger fallaría y bloquearía el guardado
--    del Hub. Con definer eso no puede pasar. Todo va calificado por schema.
--
-- ── Verificado ejercitándolo, no solo creándolo ───────────────────────────────
--   · Positivo: se vació el pilar de cfdi-compra-inmueble (es+en), se tocó el
--     brief P1-03 y las DOS filas volvieron a P1/inversionistas solas. El hermano
--     `en` hereda por slug, que es lo que hace falta porque el brief enlaza una
--     sola fila y las piezas viven en dos locales.
--   · No pisa: con cfdi/es puesto a mano en P5/asesores, disparar el brief (que
--     dice P1) lo dejó en P5. El hermano `en` se quedó en P1.
--   · No bloquea: se insertó un brief con `code = 'P9-99'` apuntando a un post
--     real. NO lanzó error y no tocó el pilar (antes=P1, despues=P1). Sin el
--     guard del catálogo ese insert habría reventado con check_violation y
--     habría bloqueado el guardado del brief en el Hub. La prueba se revirtió
--     sola con un RAISE al final: 0 filas de residuo.
--
-- ── Lo que este trigger NO hace ───────────────────────────────────────────────
-- Un brief sin `code` (hoy 2 de 5) o sin post enlazado no estampa nada: la pieza
-- se queda en NULL, que es honesto. Tampoco cubre piezas creadas fuera del flujo
-- de briefs; esas siguen necesitando clasificación manual.

create or replace function real_estate_hub.fn_estampar_pilar_desde_brief()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pilar     text;
  v_audiencia text;
  v_slug      text;
begin
  if new.generated_post_id is null or new.code is null then
    return new;
  end if;

  v_pilar := upper(left(btrim(new.code), 2));
  if v_pilar not in ('P1','P2','P3','P4','P5','P6','P7') then
    return new;
  end if;

  v_audiencia := case when v_pilar = 'P7' then 'asesores' else 'inversionistas' end;

  select b.slug into v_slug
  from public.blog_posts b
  where b.id = new.generated_post_id;

  if v_slug is null then
    return new;
  end if;

  update public.blog_posts p
  set pilar     = v_pilar,
      audiencia = coalesce(p.audiencia, v_audiencia)
  where p.slug = v_slug
    and p.deleted_at is null
    and p.pilar is null;

  return new;
end;
$$;

drop trigger if exists trg_estampar_pilar_desde_brief on real_estate_hub.blog_briefs;

create trigger trg_estampar_pilar_desde_brief
after insert or update of generated_post_id, code
on real_estate_hub.blog_briefs
for each row
execute function real_estate_hub.fn_estampar_pilar_desde_brief();


-- ── Reconciliación manual, por si hace falta ──────────────────────────────────
-- El trigger cubre lo que pase de aquí en adelante. Para barrer piezas que ya
-- existan sin pilar y tengan brief con código:
--
-- update public.blog_posts p
-- set pilar = upper(left(btrim(b.code), 2)),
--     audiencia = coalesce(p.audiencia,
--       case when upper(left(btrim(b.code),2)) = 'P7' then 'asesores'
--            else 'inversionistas' end)
-- from real_estate_hub.blog_briefs b
-- join public.blog_posts enlazado on enlazado.id = b.generated_post_id
-- where p.slug = enlazado.slug
--   and p.deleted_at is null
--   and p.pilar is null
--   and b.code is not null
--   and upper(left(btrim(b.code),2)) in ('P1','P2','P3','P4','P5','P6','P7');
