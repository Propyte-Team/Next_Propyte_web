-- ============================================================
-- Propyte — Rental Estimates Schema
-- Stores scraped rental listings and pre-computed averages
-- for the rental price estimator feature.
-- ============================================================

-- Rental type enum
CREATE TYPE rental_type AS ENUM ('residencial', 'vacacional');

-- ============================================================
-- TABLE: rental_comparables (individual scraped rental listings)
-- ============================================================

CREATE TABLE public.rental_comparables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_portal TEXT NOT NULL,             -- 'inmuebles24', 'airbnb', etc.
  source_url TEXT,                         -- original listing URL
  source_id TEXT,                          -- portal's internal ID (for dedup)
  city TEXT NOT NULL,                      -- normalized: 'Playa del Carmen', 'Cancun', etc.
  zone TEXT,                               -- barrio/colonia
  state TEXT NOT NULL DEFAULT 'Quintana Roo',
  property_type prop_type NOT NULL,        -- reuses existing enum
  rental_type rental_type NOT NULL DEFAULT 'residencial',
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  area_m2 NUMERIC(8,2),
  monthly_rent_mxn BIGINT NOT NULL,        -- consistent with price storage convention
  is_furnished BOOLEAN,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  listing_date DATE,                       -- when the listing was posted
  active BOOLEAN NOT NULL DEFAULT TRUE,    -- mark stale listings
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dedup constraint: same portal + same source_id = same listing
  CONSTRAINT uq_rental_source UNIQUE (source_portal, source_id)
);

-- Primary query pattern index
CREATE INDEX idx_rental_city_type_beds ON rental_comparables (city, property_type, bedrooms)
  WHERE active = TRUE;
CREATE INDEX idx_rental_zone ON rental_comparables (city, zone)
  WHERE active = TRUE;
CREATE INDEX idx_rental_scraped ON rental_comparables (scraped_at DESC);
CREATE INDEX idx_rental_type ON rental_comparables (rental_type)
  WHERE active = TRUE;

-- RLS: public read, service role write
ALTER TABLE rental_comparables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read rental_comparables"
  ON rental_comparables FOR SELECT USING (TRUE);

-- Service role can do everything (no policy needed, bypasses RLS)

-- ============================================================
-- MATERIALIZED VIEW: rental_estimates (pre-computed averages)
-- ============================================================

CREATE MATERIALIZED VIEW public.rental_estimates AS
SELECT
  city,
  zone,
  property_type,
  bedrooms,
  rental_type,
  COUNT(*) AS sample_size,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monthly_rent_mxn)::BIGINT AS median_rent_mxn,
  AVG(monthly_rent_mxn)::BIGINT AS avg_rent_mxn,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_rent_mxn)::BIGINT AS p25_rent_mxn,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_rent_mxn)::BIGINT AS p75_rent_mxn,
  MIN(monthly_rent_mxn) AS min_rent_mxn,
  MAX(monthly_rent_mxn) AS max_rent_mxn,
  AVG(CASE WHEN area_m2 > 0 THEN monthly_rent_mxn::NUMERIC / area_m2 END)::NUMERIC(10,2) AS avg_rent_per_m2,
  MAX(scraped_at) AS last_updated
FROM rental_comparables
WHERE active = TRUE
  AND scraped_at > NOW() - INTERVAL '90 days'
GROUP BY city, zone, property_type, bedrooms, rental_type;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_rental_est_pk
  ON rental_estimates (city, COALESCE(zone, '___null___'), property_type, COALESCE(bedrooms, -1), rental_type);

-- Schedule weekly refresh (Monday 6 AM UTC = Monday midnight CST)
-- Requires pg_cron extension (already enabled in 002_centralized_schema.sql)
SELECT cron.schedule(
  'refresh_rental_estimates',
  '0 6 * * 1',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY rental_estimates'
);
