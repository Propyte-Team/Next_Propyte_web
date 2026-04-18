-- ============================================================
-- Analytics Intelligence System
-- Tablas para zone scores, forecasts, estacionalidad, alertas
-- y tracking de performance de modelos ML
-- ============================================================

-- Zone Intelligence Scores (snapshots semanales)
CREATE TABLE IF NOT EXISTS public.zone_scores (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city            TEXT NOT NULL,
  zone            TEXT NOT NULL,
  score           NUMERIC,                    -- 0-100 compuesto
  yield_component NUMERIC,
  occupancy_component NUMERIC,
  adr_growth_component NUMERIC,
  supply_pressure_component NUMERIC,
  revpar          NUMERIC,                    -- ADR * occupancy
  price_to_rent_ratio NUMERIC,               -- precio_venta / (renta_mensual * 12)
  yield_spread    NUMERIC,                    -- yield_vac - yield_res
  supply_demand_ratio NUMERIC,
  active_listings INT,
  median_adr      NUMERIC,
  median_occupancy NUMERIC,
  median_rent     NUMERIC,
  cluster_label   TEXT,                       -- 'Premium Vacation', 'High-Yield', 'Emerging', 'Value'
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zone_scores_daily
  ON public.zone_scores (city, zone, (computed_at::date));

CREATE INDEX IF NOT EXISTS idx_zone_scores_city ON public.zone_scores (city);
CREATE INDEX IF NOT EXISTS idx_zone_scores_computed ON public.zone_scores (computed_at);

-- Forecasts de series de tiempo
CREATE TABLE IF NOT EXISTS public.metric_forecasts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market          TEXT NOT NULL,
  submarket       TEXT,
  metric_name     TEXT NOT NULL,              -- 'occupancy', 'daily_rate', 'revpar'
  forecast_date   DATE NOT NULL,
  predicted_value NUMERIC,
  ci_lower        NUMERIC,                    -- confidence interval lower bound
  ci_upper        NUMERIC,                    -- confidence interval upper bound
  model_type      TEXT,                       -- 'AutoARIMA', 'AutoETS', 'ExponentialSmoothing'
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_metric_forecast UNIQUE (market, submarket, metric_name, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_market ON public.metric_forecasts (market);
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON public.metric_forecasts (forecast_date);

-- Índices estacionales (factores multiplicativos por mes)
CREATE TABLE IF NOT EXISTS public.seasonal_indices (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market          TEXT NOT NULL,
  submarket       TEXT,
  metric_name     TEXT NOT NULL,              -- 'occupancy', 'daily_rate'
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  seasonal_factor NUMERIC,                    -- multiplicador vs promedio anual
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_seasonal_index UNIQUE (market, submarket, metric_name, month)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_market ON public.seasonal_indices (market);

-- Alertas de mercado
CREATE TABLE IF NOT EXISTS public.market_alerts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alert_type      TEXT NOT NULL,              -- 'anomaly', 'trend_change', 'supply_shock', 'opportunity'
  city            TEXT,
  zone            TEXT,
  market          TEXT,
  submarket       TEXT,
  metric_name     TEXT,
  current_value   NUMERIC,
  expected_value  NUMERIC,
  deviation_pct   NUMERIC,                    -- % deviation from expected
  severity        TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  message         TEXT,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  acknowledged    BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON public.market_alerts (detected_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_city ON public.market_alerts (city);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.market_alerts (severity);

-- Tracking de performance de modelos ML
CREATE TABLE IF NOT EXISTS public.model_performance_log (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_name      TEXT NOT NULL,              -- 'rent_residencial', 'rent_vacacional', 'forecast_occupancy'
  model_version   TEXT,
  metric_name     TEXT NOT NULL,              -- 'r2', 'mae', 'mape', 'rmse'
  metric_value    NUMERIC,
  sample_size     INT,
  training_date   DATE NOT NULL,
  feature_importances JSONB,                  -- {feature_name: importance_value}
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_perf_name ON public.model_performance_log (model_name);
CREATE INDEX IF NOT EXISTS idx_model_perf_date ON public.model_performance_log (training_date);

-- Data quality checks log
CREATE TABLE IF NOT EXISTS public.data_quality_checks (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  check_name      TEXT NOT NULL,              -- 'null_rate', 'price_outliers', 'freshness', 'coverage'
  status          TEXT NOT NULL,              -- 'pass', 'warn', 'fail'
  details         JSONB,                      -- check-specific details
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dq_checks_name ON public.data_quality_checks (check_name);
CREATE INDEX IF NOT EXISTS idx_dq_checks_date ON public.data_quality_checks (checked_at);

-- ============================================================
-- RLS: lectura pública, escritura solo service role
-- ============================================================

ALTER TABLE public.zone_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_checks ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "zone_scores_read" ON public.zone_scores FOR SELECT USING (true);
CREATE POLICY "forecasts_read" ON public.metric_forecasts FOR SELECT USING (true);
CREATE POLICY "seasonal_read" ON public.seasonal_indices FOR SELECT USING (true);
CREATE POLICY "alerts_read" ON public.market_alerts FOR SELECT USING (true);
CREATE POLICY "model_perf_read" ON public.model_performance_log FOR SELECT USING (true);
CREATE POLICY "dq_checks_read" ON public.data_quality_checks FOR SELECT USING (true);

-- Service role write
CREATE POLICY "zone_scores_write" ON public.zone_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "zone_scores_update" ON public.zone_scores FOR UPDATE USING (true);
CREATE POLICY "forecasts_write" ON public.metric_forecasts FOR INSERT WITH CHECK (true);
CREATE POLICY "forecasts_update" ON public.metric_forecasts FOR UPDATE USING (true);
CREATE POLICY "seasonal_write" ON public.seasonal_indices FOR INSERT WITH CHECK (true);
CREATE POLICY "seasonal_update" ON public.seasonal_indices FOR UPDATE USING (true);
CREATE POLICY "alerts_write" ON public.market_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_update" ON public.market_alerts FOR UPDATE USING (true);
CREATE POLICY "model_perf_write" ON public.model_performance_log FOR INSERT WITH CHECK (true);
CREATE POLICY "dq_checks_write" ON public.data_quality_checks FOR INSERT WITH CHECK (true);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.zone_scores IS 'Snapshots semanales del Zone Intelligence Score por zona — combina yield, ocupación, ADR, oferta';
COMMENT ON TABLE public.metric_forecasts IS 'Predicciones de series de tiempo (AutoARIMA) para ocupación, ADR y RevPAR';
COMMENT ON TABLE public.seasonal_indices IS 'Factores estacionales multiplicativos por mes — resultado de descomposición estacional';
COMMENT ON TABLE public.market_alerts IS 'Alertas automáticas de anomalías, cambios de tendencia y oportunidades de mercado';
COMMENT ON TABLE public.model_performance_log IS 'Log de métricas de performance de modelos ML (R², MAE, MAPE) por versión';
COMMENT ON TABLE public.data_quality_checks IS 'Resultados de checks automáticos de calidad de datos';
