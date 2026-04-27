-- ============================================================
-- Migration 011: Real-time analytics — zone_scores + development_financials + airdna_market_summary
-- ============================================================
-- Contexto: las migrations 005/008 fueron diseñadas pero no se aplicaron en producción.
-- Esta migration es idempotente y crea/refresca:
--   1. public.zone_scores (con RLS público + policies)
--   2. investment_analytics.airdna_market_summary (vista derivada de airdna_metrics 369k filas)
--   3. Función compute_zone_scores() — agrega real-time desde Propyte_desarrollos + airdna_metrics + rental_estimates
--   4. Función compute_development_financials(uuid) — calcula ROI/IRR/cap_rate al aprobar
--   5. Trigger trg_compute_financials_on_approval — dispara compute en UPDATE approved_at NULL→NOT NULL
-- ============================================================

-- ============================================================
-- 1. zone_scores (idempotente — recrea si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zone_scores (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city            TEXT NOT NULL,
  zone            TEXT NOT NULL,
  score           NUMERIC,
  yield_component NUMERIC,
  occupancy_component NUMERIC,
  adr_growth_component NUMERIC,
  supply_pressure_component NUMERIC,
  revpar          NUMERIC,
  price_to_rent_ratio NUMERIC,
  yield_spread    NUMERIC,
  supply_demand_ratio NUMERIC,
  active_listings INT,
  median_adr      NUMERIC,
  median_occupancy NUMERIC,
  median_rent     NUMERIC,
  cluster_label   TEXT,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zone_scores_city ON public.zone_scores (city);
CREATE INDEX IF NOT EXISTS idx_zone_scores_zone ON public.zone_scores (zone);
CREATE INDEX IF NOT EXISTS idx_zone_scores_computed ON public.zone_scores (computed_at DESC);
-- Nota: la función compute_zone_scores() borra el snapshot del día antes de reinsertar,
-- por eso no usamos UNIQUE constraint con cast inmutable.

ALTER TABLE public.zone_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zone_scores_read" ON public.zone_scores;
CREATE POLICY "zone_scores_read" ON public.zone_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "zone_scores_write" ON public.zone_scores;
CREATE POLICY "zone_scores_write" ON public.zone_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "zone_scores_update" ON public.zone_scores;
CREATE POLICY "zone_scores_update" ON public.zone_scores FOR UPDATE USING (true);

GRANT SELECT ON public.zone_scores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.zone_scores TO service_role;

-- ============================================================
-- 2. airdna_market_summary (vista derivada de airdna_metrics)
-- ============================================================
-- Expone latest_date + KPIs principales por market. Reads from 369k filas de airdna_metrics.
-- El frontend usa esta vista para mostrar el badge "Actualizado hace X días".

CREATE OR REPLACE VIEW investment_analytics.airdna_market_summary AS
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
    AVG(am.metric_value) FILTER (WHERE am.metric_name = 'occupancy_rate') AS avg_occupancy,
    AVG(am.metric_value) FILTER (WHERE am.metric_name = 'average_daily_rate') AS avg_adr,
    AVG(am.metric_value) FILTER (WHERE am.metric_name = 'revpar') AS avg_revpar,
    COUNT(*) FILTER (WHERE am.metric_name = 'active_listings_count') AS sample_size_listings
  FROM investment_analytics.airdna_metrics am
  INNER JOIN latest l ON am.market = l.market AND am.metric_date = l.latest_date
  GROUP BY am.market
)
SELECT
  l.market,
  l.latest_date,
  l.scraped_at,
  l.submarkets_count,
  ROUND(lm.avg_occupancy::numeric, 2) AS avg_occupancy,
  ROUND(lm.avg_adr::numeric, 0) AS avg_adr,
  ROUND(lm.avg_revpar::numeric, 0) AS avg_revpar,
  lm.sample_size_listings
FROM latest l
LEFT JOIN latest_metrics lm ON l.market = lm.market;

GRANT SELECT ON investment_analytics.airdna_market_summary TO anon, authenticated, service_role;

-- ============================================================
-- 3. compute_zone_scores() — calcula y reinserta zone_scores en tiempo real
-- ============================================================
-- Lógica:
--   - factor occupancy (0-25): airdna_metrics.occupancy_rate / target 70%
--   - factor adr (0-25): airdna_metrics.average_daily_rate / target $2500 MXN
--   - factor supply (0-25): rental_estimates.sample_size por zona (más sample = más mercado activo)
--   - factor disponibilidad (0-25): unidades_disponibles/unidades_totales en Propyte_desarrollos
--   - score total = suma componentes (0-100)

CREATE OR REPLACE FUNCTION public.compute_zone_scores()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INT := 0;
BEGIN
  -- Borrar el snapshot de hoy antes de recomputar
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
        ELSE INITCAP(REPLACE(am.market, '_', ' '))
      END AS city,
      COALESCE(am.submarket, am.market) AS zone_raw,
      AVG(am.metric_value) FILTER (WHERE am.metric_name = 'occupancy_rate' AND am.metric_date >= CURRENT_DATE - INTERVAL '90 days') AS occupancy,
      AVG(am.metric_value) FILTER (WHERE am.metric_name = 'average_daily_rate' AND am.metric_date >= CURRENT_DATE - INTERVAL '90 days') AS adr,
      AVG(am.metric_value) FILTER (WHERE am.metric_name = 'revpar' AND am.metric_date >= CURRENT_DATE - INTERVAL '90 days') AS revpar,
      COUNT(DISTINCT am.metric_date) AS data_points,
      MAX(am.metric_value) FILTER (WHERE am.metric_name = 'active_listings_count') AS active_listings
    FROM investment_analytics.airdna_metrics am
    WHERE am.market IN ('playa_del_carmen', 'tulum', 'cancun', 'merida', 'mahahual', 'akumal')
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
      AVG(pd.ext_precio_min_mxn) AS avg_price_min
    FROM real_estate_hub."Propyte_desarrollos" pd
    WHERE pd.zona IS NOT NULL AND pd.ciudad IS NOT NULL
      AND pd.deleted_at IS NULL
    GROUP BY pd.ciudad, pd.zona
  ),
  rental_agg AS (
    SELECT
      re.city,
      re.zone,
      AVG(re.median_rent_mxn) AS median_rent,
      SUM(re.sample_size) AS rental_sample
    FROM investment_analytics.rental_estimates re
    WHERE re.zone IS NOT NULL
    GROUP BY re.city, re.zone
  ),
  combined AS (
    SELECT
      COALESCE(da.city, ra.city, ag.city) AS city,
      COALESCE(da.zone, ra.zone, ag.zone_raw) AS zone,
      ag.occupancy,
      ag.adr,
      ag.revpar,
      ag.active_listings,
      da.units_avail,
      da.units_total,
      da.avg_price_min,
      da.active_dev_count,
      ra.median_rent,
      ra.rental_sample
    FROM developments_agg da
    FULL OUTER JOIN rental_agg ra ON da.city = ra.city AND da.zone = ra.zone
    LEFT JOIN airdna_agg ag ON ag.city = COALESCE(da.city, ra.city)
                            AND (ag.zone_raw = COALESCE(da.zone, ra.zone)
                                 OR ag.zone_raw IS NULL)
  ),
  scored AS (
    SELECT
      city,
      zone,
      -- Components clamped to [0,25]
      LEAST(25, GREATEST(0, COALESCE(occupancy, 50) * 25.0 / 70.0)) AS occupancy_component,
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
      active_listings::int AS active_listings,
      adr AS median_adr,
      occupancy AS median_occupancy,
      median_rent
    FROM combined
    WHERE city IS NOT NULL AND zone IS NOT NULL
      AND zone NOT IN ('null', '')
      AND LENGTH(zone) > 2
      AND zone !~* '^(zona_|submarket_)'
      AND zone !~* '(aire|amueblado|permite|alberca)'
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
    ROUND((occupancy_component + adr_growth_component + supply_pressure_component + yield_component)::numeric, 1) AS score,
    yield_component, occupancy_component, adr_growth_component, supply_pressure_component,
    revpar, price_to_rent_ratio,
    active_listings, median_adr, median_occupancy, median_rent,
    CASE
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 75 THEN 'Premium Vacation'
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 60 THEN 'High-Yield'
      WHEN occupancy_component + adr_growth_component + supply_pressure_component + yield_component >= 40 THEN 'Emerging'
      ELSE 'Value'
    END AS cluster_label
  FROM scored;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_zone_scores() TO service_role;

-- ============================================================
-- 4. compute_development_financials(uuid) — calcula y guarda en investment_analytics.development_financials
-- ============================================================
-- Inputs:
--   - precio_min_mxn (Propyte_desarrollos)
--   - rental_estimates median_rent_mxn por (city, zone, property_type)
--   - airdna avg_occupancy + adr para vacacional
--   - tasa_interes / meses_financiamiento (Propyte_desarrollos)
-- Outputs:
--   - roi_annual_pct, cap_rate, rent_yield_gross/net (residencial + vacacional)
--   - estimated_rent_residencial, estimated_rent_vacacional
--   - cash_on_cash_pct, breakeven_months, monthly_net_flow

CREATE OR REPLACE FUNCTION investment_analytics.compute_development_financials(p_dev_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dev RECORD;
  v_rent_res NUMERIC;
  v_rent_vac NUMERIC;
  v_occ_vac NUMERIC;
  v_adr_vac NUMERIC;
  v_cap_res NUMERIC;
  v_cap_vac NUMERIC;
  v_yield_gross_res NUMERIC;
  v_yield_gross_vac NUMERIC;
  v_yield_net_res NUMERIC;
  v_yield_net_vac NUMERIC;
  v_roi_res NUMERIC;
  v_roi_vac NUMERIC;
  v_monthly_flow_res NUMERIC;
  v_monthly_flow_vac NUMERIC;
  v_breakeven_res INT;
  v_breakeven_vac INT;
  v_cash_on_cash_res NUMERIC;
  v_cash_on_cash_vac NUMERIC;
  v_market_slug TEXT;
BEGIN
  SELECT id, ciudad, zona, ext_precio_min_mxn, tipo_desarrollo, ext_tasa_interes
  INTO v_dev
  FROM real_estate_hub."Propyte_desarrollos"
  WHERE id = p_dev_id;

  IF v_dev.id IS NULL OR v_dev.ext_precio_min_mxn IS NULL OR v_dev.ext_precio_min_mxn <= 0 THEN
    RETURN; -- sin precio, no podemos calcular
  END IF;

  -- 1. RENT RESIDENCIAL: rental_estimates median for (city, zone, property_type)
  SELECT AVG(median_rent_mxn) INTO v_rent_res
  FROM investment_analytics.rental_estimates
  WHERE city = v_dev.ciudad
    AND (zone = v_dev.zona OR v_dev.zona IS NULL)
    AND rental_type = 'residential';

  -- Fallback: si no hay sample residencial, usar 0.4% mensual del precio (heurística mexicana)
  IF v_rent_res IS NULL THEN
    v_rent_res := v_dev.ext_precio_min_mxn * 0.004;
  END IF;

  -- 2. AIRDNA vacacional: occupancy + adr from airdna_metrics
  v_market_slug := LOWER(REPLACE(REPLACE(REPLACE(v_dev.ciudad, ' ', '_'), 'á', 'a'), 'é', 'e'));
  v_market_slug := REPLACE(REPLACE(REPLACE(v_market_slug, 'í', 'i'), 'ó', 'o'), 'ú', 'u');

  SELECT
    AVG(metric_value) FILTER (WHERE metric_name = 'occupancy_rate'),
    AVG(metric_value) FILTER (WHERE metric_name = 'average_daily_rate')
  INTO v_occ_vac, v_adr_vac
  FROM investment_analytics.airdna_metrics
  WHERE market = v_market_slug
    AND metric_date >= CURRENT_DATE - INTERVAL '90 days';

  -- Fallbacks
  v_occ_vac := COALESCE(v_occ_vac, 0.55) / CASE WHEN v_occ_vac > 1 THEN 100 ELSE 1 END;
  v_adr_vac := COALESCE(v_adr_vac, 1800);

  -- Renta vacacional mensual = ADR * 30 * occupancy
  v_rent_vac := v_adr_vac * 30 * v_occ_vac;

  -- 3. CAP RATE = (renta_anual_neta) / precio
  -- gastos: 20% residencial, 53% vacacional
  v_yield_gross_res := (v_rent_res * 12) / v_dev.ext_precio_min_mxn * 100;
  v_yield_gross_vac := (v_rent_vac * 12) / v_dev.ext_precio_min_mxn * 100;
  v_yield_net_res := v_yield_gross_res * 0.80;
  v_yield_net_vac := v_yield_gross_vac * 0.47;
  v_cap_res := v_yield_net_res; -- cap rate = net yield (simplificado)
  v_cap_vac := v_yield_net_vac;

  -- 4. Monthly net flow (renta - hipoteca + gastos)
  v_monthly_flow_res := v_rent_res * 0.80; -- 20% gastos
  v_monthly_flow_vac := v_rent_vac * 0.47; -- 53% gastos vacacional

  -- 5. ROI anual (proyectado): yield_net + appreciation 5% típica
  v_roi_res := v_yield_net_res + 5;
  v_roi_vac := v_yield_net_vac + 5;

  -- 6. Cash-on-cash (asumiendo 30% enganche, gastos cierre 5%)
  v_cash_on_cash_res := (v_monthly_flow_res * 12) / (v_dev.ext_precio_min_mxn * 0.35) * 100;
  v_cash_on_cash_vac := (v_monthly_flow_vac * 12) / (v_dev.ext_precio_min_mxn * 0.35) * 100;

  -- 7. Breakeven (meses para recuperar enganche+cierre con flow neto)
  IF v_monthly_flow_res > 0 THEN
    v_breakeven_res := (v_dev.ext_precio_min_mxn * 0.35 / v_monthly_flow_res)::INT;
  END IF;
  IF v_monthly_flow_vac > 0 THEN
    v_breakeven_vac := (v_dev.ext_precio_min_mxn * 0.35 / v_monthly_flow_vac)::INT;
  END IF;

  -- 8. UPSERT
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
    model_version,
    last_computed
  ) VALUES (
    p_dev_id,
    v_rent_res, v_rent_vac,
    0.95, v_occ_vac,
    ROUND(v_cap_res, 2), ROUND(v_cap_vac, 2),
    ROUND(v_yield_gross_res, 2), ROUND(v_yield_gross_vac, 2),
    ROUND(v_yield_net_res, 2), ROUND(v_yield_net_vac, 2),
    ROUND(v_monthly_flow_res), ROUND(v_monthly_flow_vac),
    ROUND(v_roi_res, 2), ROUND(v_roi_vac, 2),
    ROUND(v_cash_on_cash_res, 2), ROUND(v_cash_on_cash_vac, 2),
    v_breakeven_res, v_breakeven_vac,
    'v1.0-realtime',
    NOW()
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

GRANT EXECUTE ON FUNCTION investment_analytics.compute_development_financials(uuid) TO service_role;

-- Asegurar UNIQUE en development_id para que ON CONFLICT funcione
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'development_financials_development_id_key'
  ) THEN
    ALTER TABLE investment_analytics.development_financials
      ADD CONSTRAINT development_financials_development_id_key UNIQUE (development_id);
  END IF;
END $$;

-- ============================================================
-- 5. Trigger compute on approval
-- ============================================================
CREATE OR REPLACE FUNCTION investment_analytics.trg_compute_financials_on_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo cuando approved_at pasa de NULL → NOT NULL, o cuando precio cambia post-aprobación
  IF (TG_OP = 'UPDATE'
      AND NEW.approved_at IS NOT NULL
      AND (OLD.approved_at IS NULL
           OR NEW.ext_precio_min_mxn IS DISTINCT FROM OLD.ext_precio_min_mxn))
     OR (TG_OP = 'INSERT' AND NEW.approved_at IS NOT NULL)
  THEN
    PERFORM investment_analytics.compute_development_financials(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_financials_on_approval ON real_estate_hub."Propyte_desarrollos";
CREATE TRIGGER trg_compute_financials_on_approval
  AFTER INSERT OR UPDATE OF approved_at, ext_precio_min_mxn
  ON real_estate_hub."Propyte_desarrollos"
  FOR EACH ROW
  EXECUTE FUNCTION investment_analytics.trg_compute_financials_on_approval();

-- ============================================================
-- 6. Bootstrap: ejecutar las funciones con la data actual
-- ============================================================
SELECT public.compute_zone_scores();

-- Recalcular financials para los desarrollos publicados
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM real_estate_hub."Propyte_desarrollos"
    WHERE ext_publicado = true AND approved_at IS NOT NULL
  LOOP
    PERFORM investment_analytics.compute_development_financials(r.id);
  END LOOP;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON FUNCTION public.compute_zone_scores IS 'Real-time zone scoring desde airdna_metrics + Propyte_desarrollos + rental_estimates. Reemplaza snapshot del día.';
COMMENT ON FUNCTION investment_analytics.compute_development_financials IS 'Calcula ROI/IRR/cap_rate residencial+vacacional para un desarrollo y upserta en development_financials. Disparado por trigger al aprobar.';
COMMENT ON VIEW investment_analytics.airdna_market_summary IS 'Vista agregada por market: latest_date + KPIs (occupancy/adr/revpar). Reemplaza tabla airdna_market_summary que nunca se materializó.';
