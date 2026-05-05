-- Migration 012: add 'staged' to blog_posts status + RLS for staging preview
-- Run in Supabase SQL Editor (proyecto oaijxdpevakashxshhvm)
-- Idempotente.

-- 1. Ampliar el CHECK constraint para incluir 'staged'
ALTER TABLE public.blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'staged', 'published', 'archived'));

-- 2. Actualizar RLS: anon puede leer published (con published_at) Y staged (sin publicar aún)
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;

CREATE POLICY "blog_posts_public_read"
  ON public.blog_posts FOR SELECT
  USING (
    (status = 'published' AND published_at <= NOW())
    OR
    (status = 'staged')
  );
