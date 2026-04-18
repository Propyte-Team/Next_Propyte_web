-- ============================================================
-- Propyte — ML Rental Estimates & Development Financials
-- Stores ML-predicted rental values and pre-computed financial
-- metrics (ROI, IRR, cap rate, yield, breakeven) per development.
-- ============================================================

-- ============================================================
-- TABLE: rental_ml_estimates
-- Per (development, unit_type, bedrooms) ML predictions
-- ============================================================

CREATE TABLE public.rental_ml_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  development_id UUID NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  unit_type prop_type NOT NULL,
  bedrooms SMALLINT,
  estimated_rent_residencial BIGINT NOT NULL,
  estimated_rent_vacacional BIGINT,
  confidence_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  model_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ml_est_dev_type_beds UNIQUE (development_id, unit_type, bedrooms)
);

CREATE INDEX idx_ml_est_dev ON rental_ml_estimates (development_id);
CREATE INDEX idx_ml_est_computed ON rental_ml_estimates (computed_at DESC);

-- RLS: public read, service role write
ALTER TABLE rental_ml_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read rental_ml_estimates"
  ON rental_ml_estimates FOR SELECT USING (TRUE);

-- ============================================================
-- TABLE: development_financials
-- Headline financial metrics per development (1:1)
-- ============================================================

CREATE TABLE public.development_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  development_id UUID NOT NULL UNIQUE REFERENCES developments(id) ON DELETE CASCADE,
  roi_annual_pct NUMERIC(6,2),
  irr_5yr NUMERIC(6,2),
  irr_10yr NUMERIC(6,2),
  cash_on_cash_pct NUMERIC(6,2),
  breakeven_months SMALLINT,
  monthly_net_flow BIGINT,
  cap_rate NUMERIC(6,2),
  rent_yield_gross NUMERIC(6,2),
  rent_yield_net NUMERIC(6,2),
  estimated_rent_residencial BIGINT,
  estimated_rent_vacacional BIGINT,
  model_version TEXT,
  last_computed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dev_fin_dev ON development_financials (development_id);

-- RLS: public read, service role write
ALTER TABLE development_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read development_financials"
  ON development_financials FOR SELECT USING (TRUE);
