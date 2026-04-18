-- ============================================================
-- RPC: update_development_images
-- Permite actualizar el campo images[] de developments
-- bypasseando triggers que puedan interferir
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_development_images(
  p_drive_url TEXT,
  p_images TEXT[]
)
RETURNS TABLE(id UUID, name TEXT, num_images INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.developments
  SET images = p_images,
      updated_at = now()
  WHERE drive_url = p_drive_url
  RETURNING developments.id, developments.name, array_length(p_images, 1);
END;
$$;

-- Grant execute to service_role and authenticated
GRANT EXECUTE ON FUNCTION public.update_development_images(TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_development_images(TEXT, TEXT[]) TO authenticated;
