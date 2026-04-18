-- ============================================================
-- Propyte — Centralized Schema v2
-- Unifies: propyte-web (Supabase) + propyte-crm (Prisma) + CSV data + Analytics
-- ============================================================
-- Run AFTER 001_initial_schema.sql on existing instances,
-- or standalone on a fresh Supabase project.
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- for scheduled materialized view refresh
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- for fuzzy text search

-- ============================================================
-- PHASE 1: DROP OLD SCHEMA (from 001_initial_schema.sql)
-- ============================================================

-- Drop old views first
DROP VIEW IF EXISTS public.properties_with_developer CASCADE;
DROP VIEW IF EXISTS public.lead_stats CASCADE;

-- Drop old triggers (wrapped in DO block to handle missing tables)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop old tables (order matters for FK deps)
DROP TABLE IF EXISTS public.property_views CASCADE;
DROP TABLE IF EXISTS public.lead_notes CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;

-- Drop old types (safe: only if not used by new schema)
DROP TYPE IF EXISTS property_badge CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;

-- Keep: property_stage, property_type, user_role (will be replaced below)
DROP TYPE IF EXISTS property_stage CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================================
-- PHASE 2: ENUMS
-- ============================================================

-- Stages for developments
CREATE TYPE development_stage AS ENUM (
  'proximamente',
  'preventa',
  'construccion',
  'entrega_inmediata',
  'vendido',
  'suspendido'
);

-- Property/unit types
CREATE TYPE prop_type AS ENUM (
  'departamento',
  'penthouse',
  'casa',
  'terreno',
  'macrolote',
  'local_comercial',
  'townhouse',
  'studio'
);

-- Unit status
CREATE TYPE unit_status AS ENUM (
  'disponible',
  'apartada',
  'vendida',
  'no_disponible'
);

-- CRM user roles (superset: web admin + CRM hierarchy)
CREATE TYPE crm_role AS ENUM (
  'admin',
  'director',
  'gerente',
  'team_leader',
  'asesor_sr',
  'asesor_jr',
  'hostess',
  'marketing',
  'developer_ext'
);

-- Deal pipeline stages
CREATE TYPE deal_stage AS ENUM (
  'new_lead',
  'contacted',
  'discovery',
  'discovery_done',
  'tour_scheduled',
  'tour_done',
  'proposal',
  'negotiation',
  'reserved',
  'contract',
  'closing',
  'won',
  'lost',
  'frozen'
);

-- CRM development relationship type
CREATE TYPE dev_relationship AS ENUM (
  'propio',
  'masterbroker',
  'corretaje'
);

-- Deal type (determines commission table)
CREATE TYPE deal_type AS ENUM (
  'nativa_contado',
  'nativa_financiamiento',
  'macrolote',
  'corretaje',
  'masterbroker'
);

-- Commission payment status
CREATE TYPE commission_status AS ENUM (
  'pendiente',
  'facturada',
  'pagada'
);

-- Plaza
CREATE TYPE plaza_type AS ENUM ('PDC', 'TULUM', 'MERIDA', 'CANCUN', 'OTRO');

-- ============================================================
-- PHASE 3: DIMENSION TABLES (for analytics)
-- ============================================================

CREATE TABLE public.dim_time (
  id              DATE PRIMARY KEY,
  year            SMALLINT NOT NULL,
  quarter         SMALLINT NOT NULL,
  month           SMALLINT NOT NULL,
  week_of_year    SMALLINT NOT NULL,
  week_start      DATE NOT NULL,
  day_of_week     SMALLINT NOT NULL,
  is_weekend      BOOLEAN NOT NULL,
  month_name_es   TEXT NOT NULL,
  quarter_label   TEXT NOT NULL
);

-- Populate 2020-01-01 to 2030-12-31
INSERT INTO public.dim_time
SELECT
  d::date AS id,
  EXTRACT(YEAR FROM d)::smallint,
  EXTRACT(QUARTER FROM d)::smallint,
  EXTRACT(MONTH FROM d)::smallint,
  EXTRACT(WEEK FROM d)::smallint,
  date_trunc('week', d)::date,
  EXTRACT(DOW FROM d)::smallint,
  EXTRACT(DOW FROM d) IN (0, 6),
  TO_CHAR(d, 'TMMonth'),
  EXTRACT(YEAR FROM d) || '-Q' || EXTRACT(QUARTER FROM d)
FROM generate_series('2020-01-01'::date, '2030-12-31'::date, '1 day') AS d;

CREATE TABLE public.dim_channel (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,    -- paid, organic, direct, referral, offline
  platform        TEXT,             -- meta, google, tiktok, website, showroom
  is_paid         BOOLEAN DEFAULT FALSE
);

INSERT INTO public.dim_channel (id, name, category, platform, is_paid) VALUES
  ('facebook_ads',       'Facebook Ads',         'paid',     'meta',     true),
  ('instagram_ads',      'Instagram Ads',        'paid',     'meta',     true),
  ('google_ads',         'Google Ads',           'paid',     'google',   true),
  ('google_pmax',        'Google PMax',          'paid',     'google',   true),
  ('tiktok_ads',         'TikTok Ads',           'paid',     'tiktok',   true),
  ('portal_inmobiliario','Portal Inmobiliario',  'paid',     'portal',   true),
  ('organic_search',     'Búsqueda Orgánica',    'organic',  'google',   false),
  ('organic_social',     'Social Orgánico',      'organic',  'social',   false),
  ('direct',             'Directo',              'direct',   'website',  false),
  ('referral',           'Referido',             'referral',  null,      false),
  ('referido_cliente',   'Referido de Cliente',  'referral',  null,      false),
  ('referido_broker',    'Referido de Broker',   'referral',  null,      false),
  ('walk_in',            'Walk-in',              'offline',  'showroom', false),
  ('evento',             'Evento',               'offline',  'event',    false),
  ('llamada_fria',       'Llamada en frío',      'offline',  'phone',    false),
  ('whatsapp_organic',   'WhatsApp Orgánico',    'direct',   'whatsapp', false),
  ('website_form',       'Formulario Web',       'organic',  'website',  false),
  ('espectacular',       'Espectacular/OOH',     'offline',  'ooh',      true),
  ('flyer',              'Flyer/Print',          'offline',  'print',    true),
  ('email_marketing',    'Email Marketing',      'direct',   'email',    false);

CREATE TABLE public.dim_zone (
  id              TEXT PRIMARY KEY,
  city            TEXT NOT NULL,
  zone            TEXT NOT NULL,
  state           TEXT NOT NULL,
  plaza           plaza_type,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION
);

-- Seed known zones (Riviera Maya + Merida)
INSERT INTO public.dim_zone (id, city, zone, state, plaza) VALUES
  -- Playa del Carmen
  ('pdc-cocobeach',         'Playa del Carmen', 'Coco Beach',          'Quintana Roo', 'PDC'),
  ('pdc-playacar',          'Playa del Carmen', 'Playacar',            'Quintana Roo', 'PDC'),
  ('pdc-centro',            'Playa del Carmen', 'Centro',              'Quintana Roo', 'PDC'),
  ('pdc-gonzaloGuerrero',   'Playa del Carmen', 'Gonzalo Guerrero',    'Quintana Roo', 'PDC'),
  ('pdc-ejidal',            'Playa del Carmen', 'Ejidal',              'Quintana Roo', 'PDC'),
  ('pdc-selvática',         'Playa del Carmen', 'Selvática',           'Quintana Roo', 'PDC'),
  ('pdc-other',             'Playa del Carmen', 'Otra',                'Quintana Roo', 'PDC'),
  -- Tulum
  ('tulum-centro',          'Tulum',            'Centro',              'Quintana Roo', 'TULUM'),
  ('tulum-aldea-zama',      'Tulum',            'Aldea Zamá',          'Quintana Roo', 'TULUM'),
  ('tulum-region15',        'Tulum',            'Región 15',           'Quintana Roo', 'TULUM'),
  ('tulum-hotelera',        'Tulum',            'Zona Hotelera',       'Quintana Roo', 'TULUM'),
  ('tulum-other',           'Tulum',            'Otra',                'Quintana Roo', 'TULUM'),
  -- Cancún
  ('cancun-puertoCancun',   'Cancún',           'Puerto Cancún',       'Quintana Roo', 'CANCUN'),
  ('cancun-zonaHotelera',   'Cancún',           'Zona Hotelera',       'Quintana Roo', 'CANCUN'),
  ('cancun-smz',            'Cancún',           'Supermanzanas',       'Quintana Roo', 'CANCUN'),
  ('cancun-other',          'Cancún',           'Otra',                'Quintana Roo', 'CANCUN'),
  -- Mérida
  ('merida-norte',          'Mérida',           'Norte',               'Yucatán',      'MERIDA'),
  ('merida-centro',         'Mérida',           'Centro',              'Yucatán',      'MERIDA'),
  ('merida-other',          'Mérida',           'Otra',                'Yucatán',      'MERIDA'),
  -- Catch-all
  ('other-other',           'Otra',             'Otra',                'Otro',          'OTRO');

CREATE TABLE public.dim_campaign (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  channel_id      TEXT REFERENCES public.dim_channel(id),
  development_id  UUID,                         -- FK added after developments table
  zone_id         TEXT REFERENCES public.dim_zone(id),
  start_date      DATE,
  end_date        DATE,
  objective       TEXT,
  audience_desc   TEXT,
  budget_mxn      BIGINT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 4: OPERATIONAL TABLES
-- ============================================================

-- -----------------------------------------------
-- 4.1 DEVELOPERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.developers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  website         TEXT,
  phone           TEXT,
  email           TEXT,
  description_es  TEXT,
  description_en  TEXT,
  city            TEXT,
  state           TEXT DEFAULT 'Quintana Roo',
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- -----------------------------------------------
-- 4.2 DEVELOPMENTS (replaces old properties table)
-- The core entity: a real estate development/project
-- -----------------------------------------------
CREATE TABLE public.developments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  developer_id    UUID REFERENCES public.developers(id) ON DELETE SET NULL,

  -- Location
  city            TEXT NOT NULL,
  zone            TEXT,
  state           TEXT NOT NULL DEFAULT 'Quintana Roo',
  address         TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  zone_id         TEXT REFERENCES public.dim_zone(id),
  plaza           plaza_type,

  -- Type & stage
  development_type TEXT,                        -- Residencial, Turístico, Premium, Mixto
  property_types  TEXT[],                       -- {departamento,penthouse,casa}
  stage           development_stage NOT NULL DEFAULT 'preventa',
  badge           TEXT,

  -- Prices (range for the development)
  price_min_mxn   BIGINT,
  price_max_mxn   BIGINT,
  currency        TEXT DEFAULT 'MXN',

  -- Inventory counters (denormalized, updated via triggers)
  total_units       INT,
  available_units   INT,
  reserved_units    INT DEFAULT 0,
  sold_units        INT DEFAULT 0,

  -- ROI & financing
  roi_projected          NUMERIC(5,2),
  roi_rental_monthly     NUMERIC(5,2),
  roi_appreciation       NUMERIC(5,2),
  financing_down_payment NUMERIC(5,2),
  financing_months       INT[],
  financing_interest     NUMERIC(5,2),

  -- CRM-specific
  crm_relationship dev_relationship,
  commission_rate  NUMERIC(5,2),
  construction_progress INT DEFAULT 0,
  status           TEXT DEFAULT 'ACTIVO',

  -- Content (bilingual for SEO)
  description_es  TEXT,
  description_en  TEXT,
  images          TEXT[] DEFAULT '{}',
  amenities       TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  video_url       TEXT,
  brochure_url    TEXT,
  usage           TEXT[] DEFAULT '{}',

  -- Key dates
  sales_start_date DATE,
  estimated_delivery DATE,
  delivery_text    TEXT,
  contract_start   DATE,
  contract_end     DATE,

  -- Detection (from scrapers)
  detection_source TEXT,
  source_url      TEXT,
  drive_url       TEXT,
  contact_name    TEXT,
  contact_phone   TEXT,
  detected_at     TIMESTAMPTZ,

  -- SEO flags
  featured        BOOLEAN DEFAULT FALSE,
  published       BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Full-text search (Spanish)
ALTER TABLE public.developments ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description_es, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(zone, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(city, '')), 'C')
  ) STORED;

-- Indexes
CREATE INDEX idx_dev_city ON public.developments(city) WHERE published = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_dev_stage ON public.developments(stage) WHERE published = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_dev_slug ON public.developments(slug);
CREATE INDEX idx_dev_featured ON public.developments(featured) WHERE featured = TRUE AND published = TRUE;
CREATE INDEX idx_dev_price ON public.developments(price_min_mxn) WHERE published = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_dev_zone_id ON public.developments(zone_id);
CREATE INDEX idx_dev_plaza ON public.developments(plaza);
CREATE INDEX idx_dev_fts ON public.developments USING gin(fts);
CREATE INDEX idx_dev_name_trgm ON public.developments USING gin(name gin_trgm_ops);

-- Add FK for dim_campaign.development_id now
ALTER TABLE public.dim_campaign
  ADD CONSTRAINT fk_campaign_development FOREIGN KEY (development_id) REFERENCES public.developments(id);

-- -----------------------------------------------
-- 4.3 UNITS (individual sellable units within a development)
-- -----------------------------------------------
CREATE TABLE public.units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id  UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE,

  -- Identification
  unit_number     TEXT,
  unit_type       prop_type NOT NULL DEFAULT 'departamento',
  typology        TEXT,                         -- "Studio", "1BR", "2BR+Lock-off"
  floor           INT,

  -- Specs
  bedrooms        SMALLINT DEFAULT 0,
  bathrooms       NUMERIC(3,1) DEFAULT 0,
  area_m2         NUMERIC(10,2),
  has_pool        BOOLEAN DEFAULT FALSE,

  -- Pricing
  price_mxn       BIGINT,
  price_usd       BIGINT,

  -- Status
  status          unit_status DEFAULT 'disponible',
  reserved_by_contact_id UUID,                  -- FK added after contacts table
  reserved_at     TIMESTAMPTZ,
  sold_at         TIMESTAMPTZ,
  sale_price      BIGINT,

  -- Content (for web detail pages)
  description_es  TEXT,
  description_en  TEXT,
  images          TEXT[] DEFAULT '{}',

  -- SEO
  published       BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_units_dev ON public.units(development_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_status ON public.units(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_units_slug ON public.units(slug);
CREATE INDEX idx_units_type ON public.units(unit_type);

-- -----------------------------------------------
-- 4.4 PROFILES (CRM users — extends auth.users for web admin)
-- Replaces old profiles table + CRM User model
-- -----------------------------------------------
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY,             -- references auth.users(id) when available
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT,
  avatar_url      TEXT,
  role            crm_role NOT NULL DEFAULT 'asesor_jr',
  career_level    TEXT,
  plaza           plaza_type,
  team_leader_id  UUID REFERENCES public.profiles(id),
  developer_id    UUID REFERENCES public.developers(id),
  is_active       BOOLEAN DEFAULT TRUE,
  sedetus_number  TEXT,
  sedetus_expiry  DATE,
  password_hash   TEXT,                         -- CRM auth (bcrypt)
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- -----------------------------------------------
-- 4.5 CONTACTS (unified: web leads + CRM contacts)
-- -----------------------------------------------
CREATE TABLE public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  email           TEXT,
  phone           TEXT,
  secondary_phone TEXT,

  -- Classification
  contact_type    TEXT DEFAULT 'lead',          -- lead, prospecto, cliente, inversionista, broker_ext
  lead_source     TEXT,                         -- maps to dim_channel.id
  lead_source_detail TEXT,
  temperature     TEXT DEFAULT 'warm',          -- hot, warm, cold, dead
  score           INT DEFAULT 0,
  tags            TEXT[] DEFAULT '{}',

  -- Investment profile (CRM enriches via discovery)
  investment_profile TEXT,                      -- end_user, investor_rental, investor_flip, investor_land, mixed
  property_type   TEXT,
  purchase_timeline TEXT,
  budget_min      BIGINT,
  budget_max      BIGINT,
  payment_method  TEXT,
  preferred_zone  TEXT,
  purchase_modality TEXT,
  rental_strategy TEXT,

  -- Personal
  residence_city  TEXT,
  residence_country TEXT,
  nationality     TEXT,
  preferred_language TEXT DEFAULT 'es',

  -- Web attribution (from lead form)
  locale          TEXT DEFAULT 'es',
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  referrer_url    TEXT,
  landing_page    TEXT,
  message         TEXT,                         -- message from web form
  source_development_id UUID REFERENCES public.developments(id),

  -- CRM assignment
  assigned_to_id  UUID REFERENCES public.profiles(id),
  status          TEXT DEFAULT 'new',           -- new, contacted, qualified, nurturing, converted, lost

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_contacts_assigned ON public.contacts(assigned_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_status ON public.contacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_source ON public.contacts(lead_source);
CREATE INDEX idx_contacts_temp ON public.contacts(temperature);
CREATE INDEX idx_contacts_created ON public.contacts(created_at DESC);
CREATE INDEX idx_contacts_phone ON public.contacts(phone);

-- Now add FK for units.reserved_by_contact_id
ALTER TABLE public.units
  ADD CONSTRAINT fk_unit_reserved_contact FOREIGN KEY (reserved_by_contact_id) REFERENCES public.contacts(id);

-- -----------------------------------------------
-- 4.6 DEALS (sales pipeline)
-- -----------------------------------------------
CREATE TABLE public.deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES public.contacts(id),
  assigned_to_id  UUID REFERENCES public.profiles(id),
  development_id  UUID REFERENCES public.developments(id),
  unit_id         UUID REFERENCES public.units(id),

  -- Pipeline
  stage           deal_stage NOT NULL DEFAULT 'new_lead',
  deal_type       deal_type,
  estimated_value BIGINT,
  currency        TEXT DEFAULT 'MXN',
  probability     INT DEFAULT 5,
  expected_close  DATE,
  actual_close    DATE,

  -- Lead attribution snapshot
  lead_source_at_deal TEXT,

  -- Loss
  lost_reason     TEXT,
  lost_detail     TEXT,
  won_notes       TEXT,

  -- Commissions (calculated on WON)
  commission_total      BIGINT DEFAULT 0,
  commission_advisor    BIGINT DEFAULT 0,
  commission_tl         BIGINT DEFAULT 0,
  commission_gerente    BIGINT DEFAULT 0,
  commission_director   BIGINT DEFAULT 0,
  commission_broker_ext BIGINT DEFAULT 0,
  commission_status     commission_status DEFAULT 'pendiente',

  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_deals_contact ON public.deals(contact_id);
CREATE INDEX idx_deals_stage ON public.deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_assigned ON public.deals(assigned_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_dev ON public.deals(development_id);

-- -----------------------------------------------
-- 4.7 ACTIVITIES (calls, messages, tours, tasks)
-- -----------------------------------------------
CREATE TABLE public.activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID REFERENCES public.contacts(id),
  deal_id         UUID REFERENCES public.deals(id),
  user_id         UUID REFERENCES public.profiles(id),
  activity_type   TEXT NOT NULL,
  subject         TEXT,
  description     TEXT,
  outcome         TEXT,
  duration_minutes INT,
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'pendiente',     -- pendiente, completada, vencida, cancelada
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_activities_contact ON public.activities(contact_id);
CREATE INDEX idx_activities_deal ON public.activities(deal_id);
CREATE INDEX idx_activities_user ON public.activities(user_id);
CREATE INDEX idx_activities_due ON public.activities(due_date) WHERE status = 'pendiente';

-- -----------------------------------------------
-- 4.8 MESSAGES (Twilio: SMS + WhatsApp)
-- -----------------------------------------------
CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID REFERENCES public.contacts(id),
  user_id         UUID REFERENCES public.profiles(id),
  channel         TEXT NOT NULL,                -- whatsapp, sms
  direction       TEXT NOT NULL,                -- inbound, outbound
  body            TEXT,
  media_url       TEXT,
  external_phone  TEXT,
  template_name   TEXT,
  status          TEXT DEFAULT 'queued',        -- queued, sent, delivered, read, failed
  twilio_sid      TEXT UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_contact ON public.messages(contact_id, created_at);

-- -----------------------------------------------
-- 4.9 WALK-INS
-- -----------------------------------------------
CREATE TABLE public.walk_ins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostess_id      UUID REFERENCES public.profiles(id),
  contact_id      UUID REFERENCES public.contacts(id),
  arrival_time    TIMESTAMPTZ DEFAULT now(),
  departure_time  TIMESTAMPTZ,
  visit_purpose   TEXT,
  assigned_advisor_id UUID REFERENCES public.profiles(id),
  converted_to_deal BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- -----------------------------------------------
-- 4.10 COMMISSION RULES
-- -----------------------------------------------
CREATE TABLE public.commission_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_type       deal_type,
  lead_source_category TEXT,                    -- propyte_lead, broker_lead, asesor_lead
  role            crm_role,
  percentage      NUMERIC(5,2) NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 4.11 NOTIFICATIONS
-- -----------------------------------------------
CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  title           TEXT NOT NULL,
  message         TEXT,
  type            TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  link            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- -----------------------------------------------
-- 4.12 AUDIT LOGS
-- -----------------------------------------------
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id),
  action          TEXT NOT NULL,
  entity          TEXT NOT NULL,
  entity_id       UUID,
  changes         JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- -----------------------------------------------
-- 4.13 WEBHOOK CONFIGS
-- -----------------------------------------------
CREATE TABLE public.webhook_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event           TEXT NOT NULL,
  url             TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  secret          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 4.14 SYSTEM CONFIG
-- -----------------------------------------------
CREATE TABLE public.system_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             TEXT UNIQUE NOT NULL,
  value           JSONB NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------
-- 4.15 SYNC INFRASTRUCTURE
-- -----------------------------------------------

CREATE TABLE public.monitored_folders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,                -- google_drive, dropbox
  external_folder_id TEXT NOT NULL,
  folder_name     TEXT NOT NULL,
  folder_url      TEXT,
  development_id  UUID REFERENCES public.developments(id),
  plaza           plaza_type DEFAULT 'PDC',
  dev_relationship dev_relationship DEFAULT 'propio',
  is_active       BOOLEAN DEFAULT TRUE,
  sync_interval   INT DEFAULT 15,
  last_sync_at    TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, external_folder_id)
);

CREATE TABLE public.sync_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_folder_id UUID NOT NULL REFERENCES public.monitored_folders(id),
  external_file_id TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  mime_type       TEXT,
  file_size       INT,
  category        TEXT,                         -- PRICE_LIST, BROCHURE, RENDER
  external_modified_at TIMESTAMPTZ,
  last_processed_at TIMESTAMPTZ,
  checksum        TEXT,
  processed_data  JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(monitored_folder_id, external_file_id)
);

CREATE TABLE public.sync_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitored_folder_id UUID REFERENCES public.monitored_folders(id),
  source          TEXT NOT NULL,                -- redsearch, lahaus, drive_folder, manual_csv
  status          TEXT DEFAULT 'pending',       -- pending, running, completed, failed
  triggered_by    TEXT,                         -- cron, webhook, manual
  development_id  UUID REFERENCES public.developments(id),
  files_discovered INT DEFAULT 0,
  files_new       INT DEFAULT 0,
  files_modified  INT DEFAULT 0,
  units_created   INT DEFAULT 0,
  units_updated   INT DEFAULT 0,
  error           TEXT,
  crawl_data      JSONB,
  parse_data      JSONB,
  map_data        JSONB,
  upload_data     JSONB,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id     UUID NOT NULL REFERENCES public.sync_jobs(id),
  step            TEXT NOT NULL,
  level           TEXT NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_job ON public.sync_logs(sync_job_id, created_at);

-- API keys for scrapers and external integrations
CREATE TABLE public.api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  key_hash        TEXT UNIQUE NOT NULL,
  prefix          TEXT,
  permissions     TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 5: ANALYTICAL FACT TABLES (append-only, never UPDATE/DELETE)
-- ============================================================

-- -----------------------------------------------
-- F1: Weekly inventory snapshot per development
-- -----------------------------------------------
CREATE TABLE public.fact_inventory_weekly (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL,
  development_id  UUID NOT NULL REFERENCES public.developments(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),

  -- Inventory snapshot
  total_units       INT,
  available_units   INT,
  reserved_units    INT,
  sold_units        INT,

  -- Weekly deltas
  units_sold_this_week      INT DEFAULT 0,
  units_reserved_this_week  INT DEFAULT 0,
  units_released_this_week  INT DEFAULT 0,

  -- Price snapshot
  price_min_mxn     BIGINT,
  price_max_mxn     BIGINT,
  price_avg_mxn     BIGINT,
  price_per_m2_avg  BIGINT,

  -- Derived metrics
  absorption_rate   NUMERIC(5,2),
  weekly_velocity   NUMERIC(5,2),
  months_to_sellout NUMERIC(5,1),
  days_on_market    INT,

  recorded_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_start, development_id)
);

CREATE INDEX idx_fiw_week ON public.fact_inventory_weekly(week_start);
CREATE INDEX idx_fiw_dev ON public.fact_inventory_weekly(development_id);

-- -----------------------------------------------
-- F2: Individual lead events (one row per lead)
-- -----------------------------------------------
CREATE TABLE public.fact_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,

  contact_id      UUID REFERENCES public.contacts(id),
  development_id  UUID REFERENCES public.developments(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),
  channel_id      TEXT REFERENCES public.dim_channel(id),
  campaign_id     UUID REFERENCES public.dim_campaign(id),

  -- Attribution
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  referrer_url    TEXT,
  landing_page    TEXT,
  locale          TEXT,
  device_type     TEXT,

  -- Qualification (enriched later by CRM)
  temperature     TEXT,
  budget_min      BIGINT,
  budget_max      BIGINT,
  investment_profile TEXT,
  qualified       BOOLEAN,
  converted       BOOLEAN DEFAULT FALSE,

  -- Response metrics (CRM enriches)
  first_response_minutes INT,
  total_touches   INT DEFAULT 0
);

CREATE INDEX idx_fl_week ON public.fact_leads(week_start);
CREATE INDEX idx_fl_channel ON public.fact_leads(channel_id);
CREATE INDEX idx_fl_zone ON public.fact_leads(zone_id);
CREATE INDEX idx_fl_dev ON public.fact_leads(development_id);

-- -----------------------------------------------
-- F3: Deal pipeline events
-- -----------------------------------------------
CREATE TABLE public.fact_deal_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,

  deal_id         UUID NOT NULL REFERENCES public.deals(id),
  contact_id      UUID REFERENCES public.contacts(id),
  development_id  UUID REFERENCES public.developments(id),
  unit_id         UUID REFERENCES public.units(id),
  assigned_to_id  UUID REFERENCES public.profiles(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),
  channel_id      TEXT REFERENCES public.dim_channel(id),

  -- Event
  event_type      TEXT NOT NULL,                -- stage_change, value_change, assignment, won, lost
  from_stage      deal_stage,
  to_stage        deal_stage,
  deal_value      BIGINT,
  commission_value BIGINT,

  -- Context
  deal_type       deal_type,
  lost_reason     TEXT,
  days_in_prev_stage INT,
  total_days_in_pipeline INT
);

CREATE INDEX idx_fde_week ON public.fact_deal_events(week_start);
CREATE INDEX idx_fde_deal ON public.fact_deal_events(deal_id);
CREATE INDEX idx_fde_type ON public.fact_deal_events(event_type);

-- -----------------------------------------------
-- F4: Marketing spend per channel/campaign/week
-- -----------------------------------------------
CREATE TABLE public.fact_marketing_spend (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start      DATE NOT NULL,
  channel_id      TEXT NOT NULL REFERENCES public.dim_channel(id),
  campaign_id     UUID REFERENCES public.dim_campaign(id),
  development_id  UUID REFERENCES public.developments(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),

  -- Spend
  spend_mxn       BIGINT NOT NULL DEFAULT 0,
  spend_usd       BIGINT DEFAULT 0,

  -- Platform metrics
  impressions     INT,
  clicks          INT,
  reach           INT,
  cpm_mxn         NUMERIC(10,2),
  cpc_mxn         NUMERIC(10,2),
  ctr             NUMERIC(5,4),

  -- Platform-reported results
  platform_leads  INT,
  platform_cost_per_lead NUMERIC(10,2),

  recorded_at     TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_fms_unique ON public.fact_marketing_spend(week_start, channel_id, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_fms_week ON public.fact_marketing_spend(week_start);
CREATE INDEX idx_fms_channel ON public.fact_marketing_spend(channel_id);

-- -----------------------------------------------
-- F5: Web events aggregated per development per day
-- -----------------------------------------------
CREATE TABLE public.fact_web_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date      DATE NOT NULL,
  week_start      DATE NOT NULL,

  development_id  UUID REFERENCES public.developments(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),
  page_type       TEXT,                         -- listing, detail, unit, guide, blog

  -- Counts
  page_views        INT DEFAULT 0,
  unique_visitors   INT DEFAULT 0,
  whatsapp_clicks   INT DEFAULT 0,
  call_clicks       INT DEFAULT 0,
  form_submissions  INT DEFAULT 0,
  shares            INT DEFAULT 0,
  saves             INT DEFAULT 0,
  time_on_page_avg  INT,

  -- Traffic by source
  organic_views     INT DEFAULT 0,
  paid_views        INT DEFAULT 0,
  direct_views      INT DEFAULT 0,
  referral_views    INT DEFAULT 0,
  social_views      INT DEFAULT 0,

  -- SEO (from Search Console)
  avg_position      NUMERIC(5,1),
  impressions_serp  INT,
  clicks_serp       INT,
  ctr_serp          NUMERIC(5,4),

  recorded_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_date, development_id, page_type)
);

CREATE INDEX idx_fwe_week ON public.fact_web_events(week_start);
CREATE INDEX idx_fwe_dev ON public.fact_web_events(development_id);

-- -----------------------------------------------
-- F6: CRM communications aggregated per user per day
-- -----------------------------------------------
CREATE TABLE public.fact_comms_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date      DATE NOT NULL,
  week_start      DATE NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  zone_id         TEXT REFERENCES public.dim_zone(id),

  -- Volume
  calls_outbound    INT DEFAULT 0,
  calls_inbound     INT DEFAULT 0,
  call_minutes      INT DEFAULT 0,
  whatsapps_sent    INT DEFAULT 0,
  whatsapps_received INT DEFAULT 0,
  sms_sent          INT DEFAULT 0,
  emails_sent       INT DEFAULT 0,
  tours_given       INT DEFAULT 0,
  walk_ins_attended INT DEFAULT 0,

  -- Results
  contacts_created  INT DEFAULT 0,
  deals_created     INT DEFAULT 0,
  deals_won         INT DEFAULT 0,
  deals_lost        INT DEFAULT 0,
  revenue_won       BIGINT DEFAULT 0,

  recorded_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_date, user_id)
);

-- -----------------------------------------------
-- F7: Market signals (detections, competition, macro)
-- -----------------------------------------------
CREATE TABLE public.fact_market_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,

  signal_type     TEXT NOT NULL,
  -- Types: new_launch, price_increase, price_decrease, sellout, delivery,
  --        competitor_launch, interest_rate, exchange_rate, tourism_data

  zone_id         TEXT REFERENCES public.dim_zone(id),
  development_id  UUID REFERENCES public.developments(id),
  source          TEXT,

  -- Signal data
  value_numeric   NUMERIC(15,4),
  value_text      TEXT,
  value_json      JSONB,
  previous_value  NUMERIC(15,4),
  change_pct      NUMERIC(5,2),
  confidence      NUMERIC(3,2) DEFAULT 1.0
);

CREATE INDEX idx_fms_signal_week ON public.fact_market_signals(week_start);
CREATE INDEX idx_fms_signal_type ON public.fact_market_signals(signal_type);

-- -----------------------------------------------
-- F8: Agent/scraper execution log
-- -----------------------------------------------
CREATE TABLE public.fact_agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,

  agent_type      TEXT NOT NULL,
  source          TEXT,
  status          TEXT NOT NULL,                -- success, partial, failed

  records_scanned   INT DEFAULT 0,
  records_new       INT DEFAULT 0,
  records_updated   INT DEFAULT 0,
  records_failed    INT DEFAULT 0,
  duration_seconds  INT,

  completeness_score NUMERIC(3,2),
  error_log         JSONB
);

-- -----------------------------------------------
-- F9: Price history (unit-level price changes)
-- -----------------------------------------------
CREATE TABLE public.fact_price_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,
  unit_id         UUID REFERENCES public.units(id),
  development_id  UUID REFERENCES public.developments(id),
  old_price_mxn   BIGINT,
  new_price_mxn   BIGINT,
  change_pct      NUMERIC(5,2),
  source          TEXT                          -- manual, sync, scraper
);

CREATE INDEX idx_fpc_dev ON public.fact_price_changes(development_id);
CREATE INDEX idx_fpc_week ON public.fact_price_changes(week_start);

-- -----------------------------------------------
-- F10: Inventory movements (unit status changes)
-- -----------------------------------------------
CREATE TABLE public.fact_inventory_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start      DATE NOT NULL,
  unit_id         UUID NOT NULL REFERENCES public.units(id),
  development_id  UUID NOT NULL REFERENCES public.developments(id),
  old_status      unit_status,
  new_status      unit_status NOT NULL,
  changed_by      UUID REFERENCES public.profiles(id),
  source          TEXT,                         -- crm, sync, manual
  notes           TEXT
);

CREATE INDEX idx_fim_dev ON public.fact_inventory_movements(development_id);
CREATE INDEX idx_fim_week ON public.fact_inventory_movements(week_start);

-- -----------------------------------------------
-- F11: Detection sources (multi-source per development)
-- -----------------------------------------------
CREATE TABLE public.detection_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id  UUID NOT NULL REFERENCES public.developments(id),
  source_portal   TEXT NOT NULL,
  source_url      TEXT,
  raw_data        JSONB,
  detected_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(development_id, source_portal)
);

-- ============================================================
-- PHASE 6: TRIGGERS (operational → analytical auto-population)
-- ============================================================

-- Helper: compute week_start for any timestamp
CREATE OR REPLACE FUNCTION public.week_start(ts TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT date_trunc('week', ts)::date;
$$ LANGUAGE sql IMMUTABLE;

-- 6.1 Auto-update updated_at on all operational tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'developments', 'units', 'profiles', 'contacts', 'deals',
    'activities', 'walk_ins', 'commission_rules', 'monitored_folders',
    'sync_files', 'webhook_configs'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Keep developers trigger from 001
DROP TRIGGER IF EXISTS developers_updated_at ON public.developers;
CREATE TRIGGER developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6.2 Auto-create profile on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (may already exist from 001)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.3 Contact → fact_leads (auto-track every new lead)
CREATE OR REPLACE FUNCTION public.fn_track_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fact_leads (
    occurred_at, week_start, contact_id, development_id,
    zone_id, channel_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    referrer_url, landing_page, locale,
    temperature, budget_min, budget_max, investment_profile
  ) VALUES (
    NEW.created_at,
    public.week_start(NEW.created_at),
    NEW.id,
    NEW.source_development_id,
    (SELECT zone_id FROM public.developments WHERE id = NEW.source_development_id LIMIT 1),
    COALESCE(NEW.lead_source, 'website_form'),
    NEW.utm_source, NEW.utm_medium, NEW.utm_campaign, NEW.utm_content, NEW.utm_term,
    NEW.referrer_url, NEW.landing_page, NEW.locale,
    NEW.temperature, NEW.budget_min, NEW.budget_max, NEW.investment_profile
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contact_to_fact_lead
  AFTER INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_lead();

-- 6.4 Deal stage change → fact_deal_events
CREATE OR REPLACE FUNCTION public.fn_track_deal_event()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.fact_deal_events (
      occurred_at, week_start,
      deal_id, contact_id, development_id, unit_id, assigned_to_id,
      zone_id, channel_id,
      event_type, from_stage, to_stage, deal_value,
      deal_type, lost_reason,
      days_in_prev_stage,
      total_days_in_pipeline
    ) VALUES (
      now(), public.week_start(now()),
      NEW.id, NEW.contact_id, NEW.development_id, NEW.unit_id, NEW.assigned_to_id,
      (SELECT zone_id FROM public.developments WHERE id = NEW.development_id LIMIT 1),
      NEW.lead_source_at_deal,
      CASE NEW.stage
        WHEN 'won' THEN 'won'
        WHEN 'lost' THEN 'lost'
        ELSE 'stage_change'
      END,
      OLD.stage, NEW.stage, NEW.estimated_value,
      NEW.deal_type, NEW.lost_reason,
      EXTRACT(DAY FROM now() - OLD.updated_at)::int,
      EXTRACT(DAY FROM now() - NEW.created_at)::int
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_stage_to_fact
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_deal_event();

-- Also track new deal creation
CREATE OR REPLACE FUNCTION public.fn_track_deal_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fact_deal_events (
    occurred_at, week_start,
    deal_id, contact_id, development_id, unit_id, assigned_to_id,
    zone_id, event_type, to_stage, deal_value, deal_type
  ) VALUES (
    NEW.created_at, public.week_start(NEW.created_at),
    NEW.id, NEW.contact_id, NEW.development_id, NEW.unit_id, NEW.assigned_to_id,
    (SELECT zone_id FROM public.developments WHERE id = NEW.development_id LIMIT 1),
    'created', NEW.stage, NEW.estimated_value, NEW.deal_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_created_to_fact
  AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_deal_created();

-- 6.5 Unit status change → fact_inventory_movements + update development counters
CREATE OR REPLACE FUNCTION public.fn_track_unit_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log the movement
    INSERT INTO public.fact_inventory_movements (
      occurred_at, week_start,
      unit_id, development_id,
      old_status, new_status, source
    ) VALUES (
      now(), public.week_start(now()),
      NEW.id, NEW.development_id,
      OLD.status, NEW.status, 'crm'
    );

    -- Update development counters
    UPDATE public.developments SET
      available_units = (SELECT count(*) FROM public.units WHERE development_id = NEW.development_id AND status = 'disponible' AND deleted_at IS NULL),
      reserved_units  = (SELECT count(*) FROM public.units WHERE development_id = NEW.development_id AND status = 'apartada' AND deleted_at IS NULL),
      sold_units      = (SELECT count(*) FROM public.units WHERE development_id = NEW.development_id AND status = 'vendida' AND deleted_at IS NULL),
      updated_at = now()
    WHERE id = NEW.development_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_unit_status_to_fact
  AFTER UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_unit_movement();

-- 6.6 Unit price change → fact_price_changes
CREATE OR REPLACE FUNCTION public.fn_track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_mxn IS DISTINCT FROM NEW.price_mxn AND OLD.price_mxn IS NOT NULL AND NEW.price_mxn IS NOT NULL THEN
    INSERT INTO public.fact_price_changes (
      occurred_at, week_start,
      unit_id, development_id,
      old_price_mxn, new_price_mxn,
      change_pct, source
    ) VALUES (
      now(), public.week_start(now()),
      NEW.id, NEW.development_id,
      OLD.price_mxn, NEW.price_mxn,
      ROUND(((NEW.price_mxn - OLD.price_mxn)::numeric / OLD.price_mxn) * 100, 2),
      'crm'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_unit_price_to_fact
  AFTER UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_price_change();

-- ============================================================
-- PHASE 7: MATERIALIZED VIEWS (for ML/analytics)
-- ============================================================

-- V1: MMM dataset — one row per zone per week
CREATE MATERIALIZED VIEW public.mv_mmm_weekly AS
SELECT
  dt.week_start,
  dz.id AS zone_id,
  dz.city,
  dz.zone,
  dz.plaza,

  -- Y: leads
  COUNT(DISTINCT fl.id) AS total_leads,
  COUNT(DISTINCT fl.id) FILTER (WHERE fl.qualified = TRUE) AS qualified_leads,

  -- Y2: deals
  COUNT(DISTINCT fde.id) FILTER (WHERE fde.event_type = 'won') AS deals_won,
  COALESCE(SUM(fde.deal_value) FILTER (WHERE fde.event_type = 'won'), 0) AS revenue_won,

  -- X1: spend by channel
  COALESCE(SUM(fms.spend_mxn), 0) AS total_spend,
  COALESCE(SUM(fms.spend_mxn) FILTER (WHERE fms.channel_id = 'facebook_ads'), 0) AS fb_spend,
  COALESCE(SUM(fms.spend_mxn) FILTER (WHERE fms.channel_id = 'instagram_ads'), 0) AS ig_spend,
  COALESCE(SUM(fms.spend_mxn) FILTER (WHERE fms.channel_id = 'google_ads'), 0) AS google_spend,
  COALESCE(SUM(fms.spend_mxn) FILTER (WHERE fms.channel_id = 'tiktok_ads'), 0) AS tiktok_spend,
  COALESCE(SUM(fms.spend_mxn) FILTER (WHERE fms.channel_id = 'portal_inmobiliario'), 0) AS portal_spend,

  -- X2: web traffic
  COALESCE(SUM(fwe.page_views), 0) AS total_pageviews,
  COALESCE(SUM(fwe.organic_views), 0) AS organic_views,
  COALESCE(SUM(fwe.paid_views), 0) AS paid_views,
  COALESCE(SUM(fwe.whatsapp_clicks), 0) AS whatsapp_clicks,
  COALESCE(SUM(fwe.form_submissions), 0) AS form_submissions,

  -- X3: inventory
  AVG(fiw.available_units) AS avg_available_units,
  AVG(fiw.price_avg_mxn) AS avg_price,
  AVG(fiw.price_per_m2_avg) AS avg_price_m2,
  AVG(fiw.weekly_velocity) AS avg_velocity,
  COALESCE(SUM(fiw.units_sold_this_week), 0) AS units_sold,

  -- X4: CRM activity
  COALESCE(SUM(fcd.calls_outbound), 0) AS crm_calls,
  COALESCE(SUM(fcd.whatsapps_sent), 0) AS crm_whatsapps,
  COALESCE(SUM(fcd.tours_given), 0) AS crm_tours,
  COALESCE(SUM(fcd.walk_ins_attended), 0) AS crm_walkins,

  -- X5: market signals
  COUNT(DISTINCT fmks.id) FILTER (WHERE fmks.signal_type = 'new_launch') AS new_launches,
  COUNT(DISTINCT fmks.id) FILTER (WHERE fmks.signal_type = 'price_increase') AS price_increases,
  COUNT(DISTINCT fmks.id) FILTER (WHERE fmks.signal_type = 'sellout') AS sellouts

FROM (SELECT DISTINCT week_start FROM public.dim_time) dt
CROSS JOIN public.dim_zone dz
LEFT JOIN public.fact_leads fl
  ON fl.week_start = dt.week_start AND fl.zone_id = dz.id
LEFT JOIN public.fact_deal_events fde
  ON fde.week_start = dt.week_start AND fde.zone_id = dz.id
LEFT JOIN public.fact_marketing_spend fms
  ON fms.week_start = dt.week_start AND fms.zone_id = dz.id
LEFT JOIN public.fact_web_events fwe
  ON fwe.week_start = dt.week_start AND fwe.zone_id = dz.id
LEFT JOIN public.fact_inventory_weekly fiw
  ON fiw.week_start = dt.week_start AND fiw.zone_id = dz.id
LEFT JOIN public.fact_comms_daily fcd
  ON fcd.week_start = dt.week_start AND fcd.zone_id = dz.id
LEFT JOIN public.fact_market_signals fmks
  ON fmks.week_start = dt.week_start AND fmks.zone_id = dz.id
WHERE dt.week_start >= '2024-01-01'
GROUP BY dt.week_start, dz.id, dz.city, dz.zone, dz.plaza
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_mmm ON public.mv_mmm_weekly(week_start, zone_id);

-- V2: Funnel conversion by weekly cohort
CREATE MATERIALIZED VIEW public.mv_funnel_weekly AS
SELECT
  fl.week_start AS cohort_week,
  fl.channel_id,
  fl.zone_id,
  COUNT(*) AS leads,
  COUNT(*) FILTER (WHERE fl.first_response_minutes IS NOT NULL AND fl.first_response_minutes <= 5) AS responded_5min,
  COUNT(*) FILTER (WHERE fl.first_response_minutes IS NOT NULL AND fl.first_response_minutes <= 30) AS responded_30min,
  COUNT(*) FILTER (WHERE fl.qualified = TRUE) AS qualified,
  COUNT(*) FILTER (WHERE fl.converted = TRUE) AS converted,
  AVG(fl.first_response_minutes) FILTER (WHERE fl.first_response_minutes IS NOT NULL) AS avg_response_min,
  AVG(fl.total_touches) AS avg_touches,
  AVG(fl.budget_max) AS avg_budget
FROM public.fact_leads fl
GROUP BY fl.week_start, fl.channel_id, fl.zone_id
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_funnel ON public.mv_funnel_weekly(cohort_week, channel_id, zone_id);

-- V3: Absorption forecast per development
CREATE MATERIALIZED VIEW public.mv_absorption_forecast AS
SELECT
  fiw.development_id,
  d.name,
  d.city,
  d.zone,
  d.zone_id,
  fiw.week_start,
  fiw.total_units,
  fiw.sold_units,
  fiw.available_units,
  fiw.absorption_rate,
  fiw.weekly_velocity,
  fiw.months_to_sellout,
  fiw.price_avg_mxn,
  AVG(fiw.weekly_velocity) OVER (
    PARTITION BY fiw.development_id
    ORDER BY fiw.week_start
    ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
  ) AS velocity_4w_avg,
  AVG(fiw.weekly_velocity) OVER (
    PARTITION BY fiw.development_id
    ORDER BY fiw.week_start
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) AS velocity_12w_avg
FROM public.fact_inventory_weekly fiw
JOIN public.developments d ON d.id = fiw.development_id
WITH NO DATA;

-- ============================================================
-- PHASE 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Developers: public read
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developers_public_read" ON public.developers
  FOR SELECT USING (TRUE);

CREATE POLICY "developers_admin_write" ON public.developers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Developments: public read (published), admin/dev write
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developments_public_read" ON public.developments
  FOR SELECT USING (published = TRUE AND deleted_at IS NULL);

CREATE POLICY "developments_admin_write" ON public.developments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

CREATE POLICY "developments_service_role" ON public.developments
  FOR ALL USING (auth.role() = 'service_role');

-- Units: public read (published), admin write
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_public_read" ON public.units
  FOR SELECT USING (published = TRUE AND deleted_at IS NULL);

CREATE POLICY "units_admin_write" ON public.units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

CREATE POLICY "units_service_role" ON public.units
  FOR ALL USING (auth.role() = 'service_role');

-- Contacts: public insert (web leads), CRM RBAC for read/write
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_public_insert" ON public.contacts
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "contacts_auth_read" ON public.contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "contacts_admin_manage" ON public.contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente'))
  );

CREATE POLICY "contacts_service_role" ON public.contacts
  FOR ALL USING (auth.role() = 'service_role');

-- Deals: authenticated only
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_auth_read" ON public.deals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "deals_admin_manage" ON public.deals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'gerente'))
  );

CREATE POLICY "deals_service_role" ON public.deals
  FOR ALL USING (auth.role() = 'service_role');

-- Profiles: auth read, own update
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_auth_read" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_manage" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "profiles_service_role" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Activities: authenticated
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_auth_all" ON public.activities
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "activities_service_role" ON public.activities
  FOR ALL USING (auth.role() = 'service_role');

-- Messages: authenticated
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_auth_all" ON public.messages
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Walk-ins: authenticated
ALTER TABLE public.walk_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "walk_ins_auth_all" ON public.walk_ins
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Notifications: own only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs: admin read
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
  );

-- Fact tables: service role write, admin read
-- (Fact tables are written by triggers/agents, read by analytics)
DO $$
DECLARE
  fact_tbl TEXT;
BEGIN
  FOREACH fact_tbl IN ARRAY ARRAY[
    'fact_inventory_weekly', 'fact_leads', 'fact_deal_events',
    'fact_marketing_spend', 'fact_web_events', 'fact_comms_daily',
    'fact_market_signals', 'fact_agent_runs', 'fact_price_changes',
    'fact_inventory_movements', 'detection_sources'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', fact_tbl);
    EXECUTE format(
      'CREATE POLICY "%s_service_write" ON public.%I FOR ALL USING (auth.role() = ''service_role'')',
      fact_tbl, fact_tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_admin_read" ON public.%I FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''director'', ''gerente'', ''marketing''))
      )',
      fact_tbl, fact_tbl
    );
  END LOOP;
END;
$$;

-- Dimension tables: public read
DO $$
DECLARE
  dim_tbl TEXT;
BEGIN
  FOREACH dim_tbl IN ARRAY ARRAY['dim_time', 'dim_channel', 'dim_zone', 'dim_campaign'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', dim_tbl);
    EXECUTE format(
      'CREATE POLICY "%s_public_read" ON public.%I FOR SELECT USING (TRUE)',
      dim_tbl, dim_tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_admin_write" ON public.%I FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
      )',
      dim_tbl, dim_tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_service_write" ON public.%I FOR ALL USING (auth.role() = ''service_role'')',
      dim_tbl, dim_tbl
    );
  END LOOP;
END;
$$;

-- Sync tables: admin/service role
DO $$
DECLARE
  sync_tbl TEXT;
BEGIN
  FOREACH sync_tbl IN ARRAY ARRAY[
    'monitored_folders', 'sync_files', 'sync_jobs', 'sync_logs', 'api_keys'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', sync_tbl);
    EXECUTE format(
      'CREATE POLICY "%s_admin_all" ON public.%I FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''director''))
      )',
      sync_tbl, sync_tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_service_role" ON public.%I FOR ALL USING (auth.role() = ''service_role'')',
      sync_tbl, sync_tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- PHASE 9: VIEWS (convenience queries)
-- ============================================================

CREATE OR REPLACE VIEW public.developments_with_developer AS
SELECT
  d.*,
  dev.name AS developer_name,
  dev.logo_url AS developer_logo,
  dev.verified AS developer_verified
FROM public.developments d
LEFT JOIN public.developers dev ON d.developer_id = dev.id
WHERE d.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.lead_stats_by_development AS
SELECT
  c.source_development_id AS development_id,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE c.status = 'new') AS new_leads,
  COUNT(*) FILTER (WHERE c.status = 'converted') AS converted_leads,
  COUNT(*) FILTER (WHERE c.temperature = 'hot') AS hot_leads,
  MIN(c.created_at) AS first_lead_at,
  MAX(c.created_at) AS last_lead_at
FROM public.contacts c
WHERE c.source_development_id IS NOT NULL AND c.deleted_at IS NULL
GROUP BY c.source_development_id;

-- ============================================================
-- PHASE 10: CRON JOBS (pg_cron — run inside Supabase)
-- ============================================================

-- Weekly inventory snapshot: every Monday at 6am UTC
-- This function should be called by an Edge Function or cron
CREATE OR REPLACE FUNCTION public.fn_snapshot_inventory_weekly()
RETURNS void AS $$
DECLARE
  ws DATE := public.week_start(now());
BEGIN
  INSERT INTO public.fact_inventory_weekly (
    week_start, development_id, zone_id,
    total_units, available_units, reserved_units, sold_units,
    price_min_mxn, price_max_mxn, price_avg_mxn, price_per_m2_avg,
    absorption_rate, weekly_velocity, months_to_sellout, days_on_market
  )
  SELECT
    ws,
    d.id,
    d.zone_id,
    d.total_units,
    d.available_units,
    d.reserved_units,
    d.sold_units,
    d.price_min_mxn,
    d.price_max_mxn,
    (SELECT AVG(u.price_mxn) FROM public.units u WHERE u.development_id = d.id AND u.deleted_at IS NULL AND u.price_mxn > 0),
    (SELECT AVG(u.price_mxn / NULLIF(u.area_m2, 0)) FROM public.units u WHERE u.development_id = d.id AND u.deleted_at IS NULL AND u.price_mxn > 0 AND u.area_m2 > 0),
    CASE WHEN d.total_units > 0 THEN ROUND((d.sold_units::numeric / d.total_units) * 100, 2) ELSE 0 END,
    -- velocity: sold this week (delta from last week)
    d.sold_units - COALESCE((
      SELECT fiw.sold_units FROM public.fact_inventory_weekly fiw
      WHERE fiw.development_id = d.id AND fiw.week_start = ws - 7
    ), 0),
    -- months to sellout
    CASE
      WHEN d.available_units <= 0 THEN 0
      WHEN d.sold_units > 0 AND d.sales_start_date IS NOT NULL
        THEN ROUND(
          d.available_units::numeric / NULLIF(
            d.sold_units::numeric / GREATEST(EXTRACT(EPOCH FROM now() - d.sales_start_date) / 2592000, 1),
          0), 1)
      ELSE NULL
    END,
    CASE
      WHEN d.sales_start_date IS NOT NULL THEN (now()::date - d.sales_start_date)
      ELSE NULL
    END
  FROM public.developments d
  WHERE d.deleted_at IS NULL AND d.total_units > 0
  ON CONFLICT (week_start, development_id) DO UPDATE SET
    available_units = EXCLUDED.available_units,
    reserved_units = EXCLUDED.reserved_units,
    sold_units = EXCLUDED.sold_units,
    price_min_mxn = EXCLUDED.price_min_mxn,
    price_max_mxn = EXCLUDED.price_max_mxn,
    price_avg_mxn = EXCLUDED.price_avg_mxn,
    price_per_m2_avg = EXCLUDED.price_per_m2_avg,
    absorption_rate = EXCLUDED.absorption_rate,
    weekly_velocity = EXCLUDED.weekly_velocity,
    months_to_sellout = EXCLUDED.months_to_sellout,
    days_on_market = EXCLUDED.days_on_market,
    recorded_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh materialized views weekly
CREATE OR REPLACE FUNCTION public.fn_refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_mmm_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_funnel_weekly;
  REFRESH MATERIALIZED VIEW public.mv_absorption_forecast;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (if available)
-- SELECT cron.schedule('inventory-snapshot', '0 6 * * 1', 'SELECT public.fn_snapshot_inventory_weekly()');
-- SELECT cron.schedule('refresh-views', '30 6 * * 1', 'SELECT public.fn_refresh_materialized_views()');

-- ============================================================
-- DONE — Schema v2 centralized
-- ============================================================
