-- ============================================================
-- Propyte — Vacacional Financial Metrics (Independent)
-- Adds separate financial metrics for vacation rentals so
-- residencial and vacacional are never mixed/averaged.
-- ============================================================

-- Add vacacional-specific financial columns to development_financials
ALTER TABLE public.development_financials
  ADD COLUMN IF NOT EXISTS roi_annual_pct_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS irr_5yr_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS irr_10yr_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS cash_on_cash_pct_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS breakeven_months_vac SMALLINT,
  ADD COLUMN IF NOT EXISTS monthly_net_flow_vac BIGINT,
  ADD COLUMN IF NOT EXISTS cap_rate_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS rent_yield_gross_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS rent_yield_net_vac NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS occupancy_rate_res NUMERIC(4,2) DEFAULT 0.95,
  ADD COLUMN IF NOT EXISTS occupancy_rate_vac NUMERIC(4,2) DEFAULT 0.70;

-- Add comment for documentation
COMMENT ON COLUMN development_financials.roi_annual_pct IS 'ROI anual — renta RESIDENCIAL';
COMMENT ON COLUMN development_financials.roi_annual_pct_vac IS 'ROI anual — renta VACACIONAL (Airbnb)';
COMMENT ON COLUMN development_financials.irr_5yr IS 'IRR 5 años — renta RESIDENCIAL';
COMMENT ON COLUMN development_financials.irr_5yr_vac IS 'IRR 5 años — renta VACACIONAL';
COMMENT ON COLUMN development_financials.cap_rate IS 'Cap rate — renta RESIDENCIAL';
COMMENT ON COLUMN development_financials.cap_rate_vac IS 'Cap rate — renta VACACIONAL';
COMMENT ON COLUMN development_financials.occupancy_rate_res IS 'Tasa de ocupación residencial (default 95%)';
COMMENT ON COLUMN development_financials.occupancy_rate_vac IS 'Tasa de ocupación vacacional (default 70%)';
