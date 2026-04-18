-- Slug redirects for WP → Next.js migration
-- Maps old WordPress slugs to new hierarchical URLs
-- Used by Next.js middleware for 301 permanent redirects

CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  old_slug text NOT NULL UNIQUE,
  new_path text NOT NULL,
  redirect_type smallint DEFAULT 301,
  hits integer DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Index for fast lookup by old_slug (middleware hits this on every request)
CREATE INDEX IF NOT EXISTS idx_slug_redirects_old_slug ON public.slug_redirects (old_slug);

-- RLS: public read, no write from anon
ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read redirects"
  ON public.slug_redirects
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed common WP → Next.js redirects
-- Format: old flat WP slug → new hierarchical path
INSERT INTO public.slug_redirects (old_slug, new_path, notes) VALUES
  -- Example: WP had flat /desarrollo-name, Next.js has /desarrollos/desarrollo-name
  -- Add actual redirects as they are identified during migration
  ('sample-old-slug', '/es/desarrollos/sample-new-slug', 'Template — replace with real redirects')
ON CONFLICT (old_slug) DO NOTHING;

COMMENT ON TABLE public.slug_redirects IS 'Maps old WordPress URLs to new Next.js paths for 301 redirects during migration';
