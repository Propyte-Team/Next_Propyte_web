-- Blog posts table for propyte.com
-- Content is AI-generated via hub.propyte.com and manually approved before publish

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  locale          TEXT NOT NULL DEFAULT 'es' CHECK (locale IN ('es', 'en')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Content
  title           TEXT NOT NULL,
  excerpt         TEXT,
  content         TEXT,                          -- HTML generado por hub.propyte.com Blog AI (no Markdown raw)
  category        TEXT NOT NULL DEFAULT 'General',
  tags            TEXT[] DEFAULT '{}',
  featured_image  TEXT,                          -- URL from Supabase Storage or external CDN
  author_name     TEXT DEFAULT 'Propyte',
  author_image    TEXT,
  read_time_min   INTEGER GENERATED ALWAYS AS (
    GREATEST(1, ROUND(array_length(string_to_array(COALESCE(content,''), ' '), 1)::numeric / 200))
  ) STORED,

  -- SEO
  meta_title      TEXT,
  meta_description TEXT,
  canonical_url   TEXT,

  -- Linking (optional — for AI-generated posts referencing a development)
  related_development_id UUID,
  related_city    TEXT,

  -- Timestamps
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_locale      ON public.blog_posts(status, locale, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category           ON public.blog_posts(category, status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug               ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags               ON public.blog_posts USING gin(tags);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_blog_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_updated_at();

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "blog_posts_public_read"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

-- Service role bypasses RLS for hub writes
-- (service_role key has BYPASSRLS privilege by default in Supabase)
