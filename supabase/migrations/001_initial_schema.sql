-- ============================================================
-- Propyte CRM — Initial Database Schema
-- ============================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. DEVELOPERS (desarrolladores)
-- ============================================================
create table public.developers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  website text,
  phone text,
  email text,
  description_es text,
  description_en text,
  city text,
  state text default 'Quintana Roo',
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. PROPERTIES (propiedades)
-- ============================================================
create type property_stage as enum ('preventa', 'construccion', 'entrega_inmediata');
create type property_type as enum ('departamento', 'penthouse', 'terreno', 'macrolote', 'casa');
create type property_badge as enum ('preventa', 'nuevo', 'entrega_inmediata');

create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  developer_id uuid references public.developers(id) on delete set null,

  -- Location
  city text not null,
  zone text not null,
  state text default 'Quintana Roo',
  address text,
  lat double precision,
  lng double precision,

  -- Price
  price_mxn bigint not null,
  currency text default 'MXN',

  -- Specs
  bedrooms smallint default 0,
  bathrooms smallint default 0,
  area_m2 numeric(10,2) not null,
  property_type property_type not null,

  -- Stage & status
  stage property_stage not null,
  badge property_badge,
  usage text[] default '{}',
  featured boolean default false,
  published boolean default true,

  -- ROI & Financing
  roi_projected numeric(5,2) default 0,
  roi_rental_monthly bigint default 0,
  roi_appreciation numeric(5,2) default 0,
  financing_down_payment_min smallint default 30,
  financing_months smallint[] default '{6,12,18,24}',
  financing_interest_rate numeric(5,2) default 0,

  -- Descriptions
  description_es text,
  description_en text,

  -- Media
  images text[] default '{}',
  virtual_tour_url text,
  video_url text,

  -- Amenities (stored as text array for simplicity)
  amenities text[] default '{}',

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index idx_properties_city on public.properties(city);
create index idx_properties_stage on public.properties(stage);
create index idx_properties_type on public.properties(property_type);
create index idx_properties_price on public.properties(price_mxn);
create index idx_properties_featured on public.properties(featured) where featured = true;
create index idx_properties_published on public.properties(published) where published = true;
create index idx_properties_slug on public.properties(slug);

-- Full-text search index (Spanish)
alter table public.properties add column fts tsvector
  generated always as (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description_es, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(zone, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(city, '')), 'C')
  ) stored;

create index idx_properties_fts on public.properties using gin(fts);

-- ============================================================
-- 3. LEADS (contactos/prospectos)
-- ============================================================
create type lead_source as enum ('whatsapp', 'form', 'phone', 'schedule', 'csv_import');
create type lead_status as enum ('nuevo', 'contactado', 'en_seguimiento', 'visita_agendada', 'negociacion', 'cerrado', 'perdido');

create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete set null,

  -- Contact info
  name text not null,
  email text,
  phone text,
  message text,

  -- Tracking
  source lead_source default 'form',
  status lead_status default 'nuevo',
  assigned_to uuid,  -- references auth.users

  -- Metadata
  locale text default 'es',
  utm_source text,
  utm_medium text,
  utm_campaign text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_status on public.leads(status);
create index idx_leads_property on public.leads(property_id);
create index idx_leads_created on public.leads(created_at desc);

-- ============================================================
-- 4. LEAD NOTES (notas de seguimiento)
-- ============================================================
create table public.lead_notes (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  author_id uuid,  -- references auth.users
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. PROPERTY VIEWS (analytics)
-- ============================================================
create table public.property_views (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  event_type text not null default 'view', -- view, whatsapp_click, form_submit, share, save
  locale text default 'es',
  user_agent text,
  referrer text,
  created_at timestamptz default now()
);

create index idx_views_property on public.property_views(property_id);
create index idx_views_event on public.property_views(event_type);
create index idx_views_created on public.property_views(created_at desc);

-- ============================================================
-- 6. PROFILES (extends auth.users)
-- ============================================================
create type user_role as enum ('admin', 'asesor', 'developer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role user_role default 'asesor',
  phone text,
  developer_id uuid references public.developers(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Properties: public read, authenticated write
alter table public.properties enable row level security;

create policy "Properties are viewable by everyone"
  on public.properties for select
  using (published = true);

create policy "Admins can do everything with properties"
  on public.properties for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Developers can manage their own properties"
  on public.properties for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'developer'
        and profiles.developer_id = properties.developer_id
    )
  );

-- Leads: only authenticated users
alter table public.leads enable row level security;

create policy "Anyone can create leads"
  on public.leads for insert
  with check (true);

create policy "Authenticated users can view leads"
  on public.leads for select
  using (auth.uid() is not null);

create policy "Admins can manage leads"
  on public.leads for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Developers: public read
alter table public.developers enable row level security;

create policy "Developers are viewable by everyone"
  on public.developers for select
  using (true);

create policy "Admins can manage developers"
  on public.developers for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Profiles: users can read all, update own
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Property views: anyone can insert, admins can read
alter table public.property_views enable row level security;

create policy "Anyone can create views"
  on public.property_views for insert
  with check (true);

create policy "Admins can read views"
  on public.property_views for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Lead notes
alter table public.lead_notes enable row level security;

create policy "Authenticated users can manage lead notes"
  on public.lead_notes for all
  using (auth.uid() is not null);

-- ============================================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger developers_updated_at
  before update on public.developers
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 9. VIEWS (for common queries)
-- ============================================================

create or replace view public.properties_with_developer as
select
  p.*,
  d.name as developer_name,
  d.logo_url as developer_logo,
  d.verified as developer_verified
from public.properties p
left join public.developers d on p.developer_id = d.id;

-- Lead stats view
create or replace view public.lead_stats as
select
  property_id,
  count(*) as total_leads,
  count(*) filter (where status = 'nuevo') as new_leads,
  count(*) filter (where status = 'cerrado') as closed_leads,
  min(created_at) as first_lead_at,
  max(created_at) as last_lead_at
from public.leads
group by property_id;
