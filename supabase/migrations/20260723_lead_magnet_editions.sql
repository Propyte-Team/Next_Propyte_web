-- Migration: lead magnet Top 10 — ediciones mensuales + bucket privado
-- Aplicar en Supabase (proyecto oaijxdpevakashxshhvm) SQL Editor o MCP.
-- Spec: docs/superpowers/specs/2026-07-23-lead-magnet-top10-design.md §3

create table if not exists real_estate_hub.lead_magnet_editions (
  id uuid primary key default gen_random_uuid(),
  edition text not null,              -- 'YYYY-MM'
  locale text not null check (locale in ('es','en')),
  storage_path text not null,         -- p.ej. 'editions/2026-08-es.pdf'
  status text not null default 'pending' check (status in ('pending','active','archived')),
  units jsonb,                        -- snapshot del top 10 (auditoría)
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (edition, locale)
);

-- Solo service_role lee/escribe (RLS on, sin policies → anon/authenticated bloqueados).
alter table real_estate_hub.lead_magnet_editions enable row level security;

-- Consulta rápida de la edición activa por locale.
create index if not exists idx_lme_active
  on real_estate_hub.lead_magnet_editions (locale, status);

-- Bucket PRIVADO (public=false; sin policy de SELECT en storage.objects →
-- solo el service role puede leer/firmar). Patrón: 013_blog_images_bucket.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lead-magnets', 'lead-magnets', false, 3145728, array['application/pdf'])
on conflict (id) do nothing;

-- Aprobación atómica: archiva la activa del locale y activa la edición dada.
-- Luis la corre desde el SQL Editor (interim) o el Hub la llamará (fase 2):
--   select real_estate_hub.approve_lead_magnet_edition('2026-08', 'es');
create or replace function real_estate_hub.approve_lead_magnet_edition(
  p_edition text, p_locale text
) returns void language plpgsql as $$
begin
  update real_estate_hub.lead_magnet_editions
     set status = 'archived'
   where locale = p_locale and status = 'active';
  update real_estate_hub.lead_magnet_editions
     set status = 'active', approved_at = now()
   where edition = p_edition and locale = p_locale;
  if not found then
    raise exception 'No existe edición % (%)', p_edition, p_locale;
  end if;
end;
$$;
