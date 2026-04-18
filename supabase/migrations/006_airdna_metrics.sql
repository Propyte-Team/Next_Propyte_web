-- ============================================================
-- AirDNA Market Metrics
-- Tabla unificada para datos de mercado vacacional extraidos
-- de AirDNA (listings, occupancy, revenue, rates, seasonality)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.airdna_metrics (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market          TEXT NOT NULL,              -- 'cancun', 'playa_del_carmen', etc.
  submarket       TEXT,                       -- 'sm_23', 'smz_16', null = market level
  section         TEXT NOT NULL,              -- 'listings', 'occupancy', 'revenue', 'rates'
  chart           TEXT NOT NULL,              -- 'chart_1', 'chart_2', etc.
  metric_date     DATE NOT NULL,             -- fecha del dato
  metric_name     TEXT NOT NULL,              -- nombre de la columna: 'occupancy', '1 bedroom', 'daily_rate', etc.
  metric_value    NUMERIC,                   -- valor numérico
  scraped_at      DATE NOT NULL DEFAULT CURRENT_DATE,  -- fecha de extracción
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Evitar duplicados: misma métrica para el mismo market/submarket/fecha
  CONSTRAINT uq_airdna_metric UNIQUE (market, submarket, section, chart, metric_date, metric_name)
);

-- Indices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_airdna_market ON public.airdna_metrics (market);
CREATE INDEX IF NOT EXISTS idx_airdna_market_sub ON public.airdna_metrics (market, submarket);
CREATE INDEX IF NOT EXISTS idx_airdna_section ON public.airdna_metrics (section);
CREATE INDEX IF NOT EXISTS idx_airdna_date ON public.airdna_metrics (metric_date);
CREATE INDEX IF NOT EXISTS idx_airdna_scraped ON public.airdna_metrics (scraped_at);

-- RLS: lectura pública, escritura solo service role
ALTER TABLE public.airdna_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airdna_read_all" ON public.airdna_metrics
  FOR SELECT USING (true);

CREATE POLICY "airdna_insert_service" ON public.airdna_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "airdna_update_service" ON public.airdna_metrics
  FOR UPDATE USING (true);

COMMENT ON TABLE public.airdna_metrics IS 'Datos de mercado vacacional extraídos de AirDNA por scraper automatizado';
