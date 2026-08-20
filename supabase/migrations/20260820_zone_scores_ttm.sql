-- Columnas TTM en zone_scores.
--
-- median_occupancy y median_adr NO contienen medianas: contienen el ultimo punto
-- de la serie (compute_derived.py hacia drop_duplicates sobre metric_date desc).
-- Para las 16 zonas del ranking ese punto era feb-2026, el pico de temporada alta.
--
-- Se agregan columnas nuevas en vez de corregir las viejas para que el despliegue
-- no tenga una ventana en la que la web lea una columna con semantica cambiada.
-- Las viejas se borran en una migracion posterior, cuando nadie las lea.

alter table public.zone_scores
  add column if not exists occupancy_p50_ttm      numeric,
  add column if not exists occupancy_low_season   numeric,
  add column if not exists occupancy_high_season  numeric,
  add column if not exists adr_p50_ttm            numeric,
  add column if not exists data_through           date,
  add column if not exists ttm_months_observed    integer,
  add column if not exists index_omission_reason  text;

alter table public.zone_scores
  drop constraint if exists zone_scores_index_omission_reason_check;

-- Vocabulario real de analytics/publication_gates.py:gate_zone(). El componente
-- faltante se codifica como 'missing:<component>' (dos puntos, no guion bajo)
-- para cada uno de REQUIRED_COMPONENTS = ("occupancy", "adr", "adr_growth_pct",
-- "revpar"). 'sample_below_15' NO esta en esta lista a proposito: gate_zone lo
-- resuelve a "drop" y la fila nunca se escribe, asi que si algun dia aparece
-- aqui, el CHECK debe fallar ruidosamente en vez de dejar publicar una zona
-- que debio descartarse.
alter table public.zone_scores
  add constraint zone_scores_index_omission_reason_check
  check (index_omission_reason is null
         or index_omission_reason in (
           'sample_below_30',
           'missing:occupancy',
           'missing:adr',
           'missing:adr_growth_pct',
           'missing:revpar',
           'thin_cycle'
         ));

comment on column public.zone_scores.occupancy_p50_ttm is
  'Mediana de ocupacion sobre los ultimos 12 meses de metric_date. Cifra principal.';
comment on column public.zone_scores.data_through is
  'Ultimo metric_date real de la serie. Distinto de computed_at, que es la fecha de la corrida.';
comment on column public.zone_scores.median_occupancy is
  'DEPRECADA: no es una mediana, es el ultimo punto de la serie. Usar occupancy_p50_ttm.';
comment on column public.zone_scores.median_adr is
  'DEPRECADA: ultimo punto de la serie. Usar adr_p50_ttm.';
