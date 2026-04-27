-- ============================================================
-- Migration 011a: Fix metric_name mapping y outliers de precio
-- ============================================================
-- Hallazgos post-011:
--   1. airdna_metrics usa metric_name 'daily_rate' (no 'average_daily_rate')
--      y 'booked_listings' (no 'occupancy_rate' ni 'active_listings_count')
--   2. Edificio Cumbres tiene ext_precio_min=23000 (parece renta) → cap_vac 455%
--      Hay que filtrar precios < $500K MXN como outliers de venta
-- ============================================================

-- Fix 1: airdna_market_summary con metric_names correctos
DROP VIEW IF EXISTS investment_analytics.airdna_market_summary;
CREATE VIEW investment_analytics.airdna_market_summary AS
WITH latest AS (
  SELECT
    market,
    MAX(metric_date) AS latest_date,
    MAX(scraped_at) AS scraped_at,
    COUNT(DISTINCT submarket) FILTER (WHERE submarket IS NOT NULL) AS submarkets_count
  FROM investment_analytics.airdna_metrics
  GROUP BY market
),
latest_metrics AS (
  SELECT
    am.market,
    AVG(am.metric_value) FILTER (WHERE am.metric_name = 'daily_rate'
                                  AND am.metric_date >= CURRENT_DATE - INTERVAL '120 days')
                                  AS avg_adr,
    AVG(am.metric_value) FILTER (WHERE am.metric_name = 'booked_listings'
                                  AND am.metric_date >= CURRENT_DATE - INTERVAL '120 days')
                                  AS avg_booked,
    MAX(am.metric_value) FILTER (WHERE am.metric_name = 'booked_listings')
                                  AS max_booked,
    COUNT(*) FILTER (WHERE am.metric_name = 'booked_listings') AS sample_size_listings
  FROM investment_analytics.airdna_metrics am
  GROUP BY am.market
)
SELECT
  l.market,
  l.latest_date,
  l.scraped_at,
  l.submarkets_count,
  -- avg_occupancy: booked / max_booked como proxy normalizado [0-1]
  ROUND(
    CASE WHEN lm.max_booked > 0
         THEN (lm.avg_booked / lm.max_booked)
         ELSE NULL
    END::numeric, 2
  ) AS avg_occupancy,
  ROUND(lm.avg_adr::numeric, 0) AS avg_adr,
  ROUND((lm.avg_adr * lm.avg_booked / NULLIF(lm.max_booked, 0))::numeric, 0) AS avg_revpar,
  lm.sample_size_listings::INT AS sample_size_listings
FROM latest l
LEFT JOIN latest_metrics lm ON l.market = lm.market;

GRANT SELECT ON investment_analytics.airdna_market_summary TO anon, authenticated, service_role;

-- Fix 2: compute_zone_scores con metric_names correctos
CREATE OR REPLACE FUNCTION public.compute_zone_scores()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INT := 0;
BEGIN
  DELETE FROM public.zone_scores WHERE computed_at::date = CURRENT_DATE;

  WITH airdna_agg AS (
    SELECT
      CASE am.market
        WHEN 'playa_del_carmen' THEN 'Playa del Carmen'
        WHEN 'tulum' THEN 'Tulum'
        WHEN 'cancun' THEN 'Cancún'
        WHEN 'merida' THEN 'Mérida'
        WHEN 'mahahual' THEN 'Mahahual'
        WHEN 'akumal' THEN 'Akumal'
        WHEN 'cozumel' THEN 'Cozumel'
        WHEN 'bacalar' THEN 'Bacalar'
        WHEN 'holbox' THEN 'Holbox'
        WHEN 'puerto_morelos' THEN 'Puerto Morelos'
        ELSE INITCAP(REPLACE(am.market, '_', ' '))
      END AS city,
      COALESCE(am.submarket, am.market) AS zone_raw,
      AVG(am.metric_value) FILTER (WHERE am.metric_name = 'daily_rate'
                                    AND am.metric_date >= CURRENT_DATE - INTERVAL '120 days') AS adr,
      AVG(am.metric_value) FILTER (WHERE am.metric_name = 'booked_listings'
                                    AND am.metric_date >= CURRENT_DATE - INTERVAL '120 days') AS booked_avg,
      MAX(am.metric_value) FILTER (WHERE am.metric_name = 'booked_listings') AS booked_max,
      COUNT(DISTINCT am.metric_date) AS data_points
    FROM investment_analytics.airdna_metrics am
    WHERE am.market IN ('playa_del_carmen', 'tulum', 'cancun', 'merida', 'mahahual', 'akumal',
                        'cozumel', 'bacalar', 'holbox', 'puerto_morelos')
    GROUP BY am.market, am.submarket
    HAVING COUNT(*) > 5
  ),
  developments_agg AS (
    SELECT
      pd.ciudad AS city,
      pd.zona AS zone,
      COUNT(*) FILTER (WHERE pd.ext_publicado = true) AS active_dev_count,
      SUM(pd.unidades_disponibles) AS units_avail,
      SUM(pd.unidades_totales) AS units_total,
      AVG(pd.ext_precio_min_mxn) FILTER (WHERE pd.ext_precio_min_mxn >= 500000) AS avg_price_min
    FROM real_estate_hub."Propyte_desarrollos" pd
    WHERE pd.zona IS NOT NULL AND pd.ciudad IS NOT NULL AND pd.deleted_at IS NULL
    GROUP BY pd.ciudad, pd.zona
  ),
  rental_agg AS (
    SELECT
      re.city, re.zone,
      AVG(re.median_rent_mxn) AS median_rent,
      SUM(re.sample_size) AS rental_sample
    FROM investment_analytics.rental_estimates re
    WHERE re.zone IS NOT NULL
    GROUP BY re.city, re.zone
  ),
  combined AS (
    SELECT
      COALESCE(da.city, ra.city) AS city,
      COALESCE(da.zone, ra.zone) AS zone,
      ag.adr,
      CASE WHEN ag.booked_max > 0 THEN ag.booked_avg / ag.booked_max ELSE NULL END AS occupancy,
      ag.adr * ag.booked_avg / NULLIF(ag.booked_max, 0) AS revpar,
      ag.booked_max::INT AS active_listings,
      da.units_avail, da.units_total, da.avg_price_min, da.active_dev_count,
      ra.median_rent, ra.rental_sample
    FROM developments_agg da
    FULL OUTER JOIN rental_agg ra ON da.city = ra.city AND da.zone = ra.zone
    LEFT JOIN airdna_agg ag ON ag.city = COALESCE(da.city, ra.city)
  ),
  scored AS (
    SELECT
      city, zone,
      LEAST(25, GREATEST(0, COALESCE(occupancy, 0.5) * 25.0 / 0.7)) AS occupancy_component,
      LEAST(25, GREATEST(0, COALESCE(adr, 1500) * 25.0 / 2500.0)) AS adr_growth_component,
      LEAST(25, GREATEST(0,
        CASE WHEN units_total > 0 THEN (units_avail::numeric / units_total) * 25
             ELSE 12.5
        END
      )) AS supply_pressure_component,
      LEAST(25, GREATEST(0,
        CASE WHEN rental_sample > 0 THEN LN(rental_sample + 1) * 5
             ELSE 5
        END
      )) AS yield_component,
      revpar,
      CASE WHEN avg_price_min > 0 AND median_rent > 0
           THEN avg_price_min / (median_rent * 12)
           ELSE NULL
      END AS price_to_rent_ratio,
      active_listings, adr AS median_adr, occupancy AS median_occupancy, median_rent
    FROM combined
    WHERE city IS NOT NULL AND zone IS NOT NULL
      AND zone NOT IN ('null', '')
      AND LENGTH(zone) > 2
      AND zone !~* '^(zona_|submarket_)'
      AND zone !~* '(aire|amueblado|permite|alberca acond)'
  )
  INSERT INTO public.zone_scores (
    city, zone, score,
    yield_component, occupancy_component, adr_growth_component, supply_pressure_component,
    revpar, price_to_rent_ratio,
    active_listings, median_adr, median_occupancy, median_rent,
    cluster_label
  )
  SELECT
    city, zone,
    ROUND((occupancy_component + adr_growth_component + supply_pressure_component + yield_component)::numeric, 1),
    yield_component, occupancy_component, adr_growth_component, supply_pressure_component,
    revpar, price_to_rent_ratio,
    active_listings, median_adr, median_occupancy, median_rent,
    CASE
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 75 THEN 'Premium Vacation'
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 60 THEN 'High-Yield'
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 40 THEN 'Emerging'
      ELSE 'Value'
    END
  FROM scored;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Fix 3: compute_development_financials filtra precios outlier (< 500K MXN)
CREATE OR REPLACE FUNCTION investment_analytics.compute_development_financials(p_dev_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dev RECORD;
  v_rent_res NUMERIC; v_rent_vac NUMERIC;
  v_occ_vac NUMERIC; v_adr_vac NUMERIC; v_booked_avg NUMERIC; v_booked_max NUMERIC;
  v_cap_res NUMERIC; v_cap_vac NUMERIC;
  v_yield_gross_res NUMERIC; v_yield_gross_vac NUMERIC;
  v_yield_net_res NUMERIC; v_yield_net_vac NUMERIC;
  v_roi_res NUMERIC; v_roi_vac NUMERIC;
  v_monthly_flow_res NUMERIC; v_monthly_flow_vac NUMERIC;
  v_breakeven_res INT; v_breakeven_vac INT;
  v_cash_on_cash_res NUMERIC; v_cash_on_cash_vac NUMERIC;
  v_market_slug TEXT;
BEGIN
  SELECT id, ciudad, zona, ext_precio_min_mxn
  INTO v_dev
  FROM real_estate_hub."Propyte_desarrollos"
  WHERE id = p_dev_id;

  -- Filtro outlier: precios < 500K MXN son rentas, no ventas → no calcular
  IF v_dev.id IS NULL OR v_dev.ext_precio_min_mxn IS NULL OR v_dev.ext_precio_min_mxn < 500000 THEN
    DELETE FROM investment_analytics.development_financials WHERE development_id = p_dev_id::text;
    RETURN;
  END IF;

  SELECT AVG(median_rent_mxn) INTO v_rent_res
  FROM investment_analytics.rental_estimates
  WHERE city = v_dev.ciudad
    AND (zone = v_dev.zona OR v_dev.zona IS NULL)
    AND rental_type = 'residential';
  IF v_rent_res IS NULL THEN
    v_rent_res := v_dev.ext_precio_min_mxn * 0.004;
  END IF;

  v_market_slug := LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_dev.ciudad, ' ', '_'), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'));

  SELECT
    AVG(metric_value) FILTER (WHERE metric_name = 'daily_rate' AND metric_date >= CURRENT_DATE - INTERVAL '120 days'),
    AVG(metric_value) FILTER (WHERE metric_name = 'booked_listings' AND metric_date >= CURRENT_DATE - INTERVAL '120 days'),
    MAX(metric_value) FILTER (WHERE metric_name = 'booked_listings')
  INTO v_adr_vac, v_booked_avg, v_booked_max
  FROM investment_analytics.airdna_metrics
  WHERE market = v_market_slug;

  v_adr_vac := COALESCE(v_adr_vac, 1800);
  v_occ_vac := CASE WHEN v_booked_max > 0 THEN v_booked_avg / v_booked_max ELSE 0.55 END;
  v_occ_vac := LEAST(0.95, GREATEST(0.30, v_occ_vac));

  v_rent_vac := v_adr_vac * 30 * v_occ_vac;

  v_yield_gross_res := (v_rent_res * 12) / v_dev.ext_precio_min_mxn * 100;
  v_yield_gross_vac := (v_rent_vac * 12) / v_dev.ext_precio_min_mxn * 100;
  v_yield_net_res := v_yield_gross_res * 0.80;
  v_yield_net_vac := v_yield_gross_vac * 0.47;
  v_cap_res := v_yield_net_res;
  v_cap_vac := v_yield_net_vac;

  v_monthly_flow_res := v_rent_res * 0.80;
  v_monthly_flow_vac := v_rent_vac * 0.47;

  v_roi_res := v_yield_net_res + 5;
  v_roi_vac := v_yield_net_vac + 5;

  v_cash_on_cash_res := (v_monthly_flow_res * 12) / (v_dev.ext_precio_min_mxn * 0.35) * 100;
  v_cash_on_cash_vac := (v_monthly_flow_vac * 12) / (v_dev.ext_precio_min_mxn * 0.35) * 100;

  IF v_monthly_flow_res > 0 THEN v_breakeven_res := (v_dev.ext_precio_min_mxn * 0.35 / v_monthly_flow_res)::INT; END IF;
  IF v_monthly_flow_vac > 0 THEN v_breakeven_vac := (v_dev.ext_precio_min_mxn * 0.35 / v_monthly_flow_vac)::INT; END IF;

  -- Nota: development_id es TEXT en DB; casteamos uuid → text al insertar
  INSERT INTO investment_analytics.development_financials (
    development_id,
    estimated_rent_residencial, estimated_rent_vacacional,
    occupancy_rate_res, occupancy_rate_vac,
    cap_rate, cap_rate_vac,
    rent_yield_gross, rent_yield_gross_vac,
    rent_yield_net, rent_yield_net_vac,
    monthly_net_flow, monthly_net_flow_vac,
    roi_annual_pct, roi_annual_pct_vac,
    cash_on_cash_pct, cash_on_cash_pct_vac,
    breakeven_months, breakeven_months_vac,
    model_version, last_computed
  ) VALUES (
    p_dev_id::text,
    ROUND(v_rent_res), ROUND(v_rent_vac),
    0.95, ROUND(v_occ_vac, 2),
    ROUND(v_cap_res, 2), ROUND(v_cap_vac, 2),
    ROUND(v_yield_gross_res, 2), ROUND(v_yield_gross_vac, 2),
    ROUND(v_yield_net_res, 2), ROUND(v_yield_net_vac, 2),
    ROUND(v_monthly_flow_res), ROUND(v_monthly_flow_vac),
    ROUND(v_roi_res, 2), ROUND(v_roi_vac, 2),
    ROUND(v_cash_on_cash_res, 2), ROUND(v_cash_on_cash_vac, 2),
    v_breakeven_res, v_breakeven_vac,
    'v1.1-realtime', NOW()
  )
  ON CONFLICT (development_id) DO UPDATE SET
    estimated_rent_residencial = EXCLUDED.estimated_rent_residencial,
    estimated_rent_vacacional = EXCLUDED.estimated_rent_vacacional,
    occupancy_rate_res = EXCLUDED.occupancy_rate_res,
    occupancy_rate_vac = EXCLUDED.occupancy_rate_vac,
    cap_rate = EXCLUDED.cap_rate,
    cap_rate_vac = EXCLUDED.cap_rate_vac,
    rent_yield_gross = EXCLUDED.rent_yield_gross,
    rent_yield_gross_vac = EXCLUDED.rent_yield_gross_vac,
    rent_yield_net = EXCLUDED.rent_yield_net,
    rent_yield_net_vac = EXCLUDED.rent_yield_net_vac,
    monthly_net_flow = EXCLUDED.monthly_net_flow,
    monthly_net_flow_vac = EXCLUDED.monthly_net_flow_vac,
    roi_annual_pct = EXCLUDED.roi_annual_pct,
    roi_annual_pct_vac = EXCLUDED.roi_annual_pct_vac,
    cash_on_cash_pct = EXCLUDED.cash_on_cash_pct,
    cash_on_cash_pct_vac = EXCLUDED.cash_on_cash_pct_vac,
    breakeven_months = EXCLUDED.breakeven_months,
    breakeven_months_vac = EXCLUDED.breakeven_months_vac,
    model_version = EXCLUDED.model_version,
    last_computed = NOW();
END;
$$;

-- Re-bootstrap con la versión corregida
SELECT public.compute_zone_scores();

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM real_estate_hub."Propyte_desarrollos" WHERE ext_publicado = true AND approved_at IS NOT NULL
  LOOP
    PERFORM investment_analytics.compute_development_financials(r.id);
  END LOOP;
END $$;
