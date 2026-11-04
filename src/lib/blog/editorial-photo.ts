import type { SupabaseClient } from '@supabase/supabase-js';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Foto real de desarrollo para la nota destacada del blog.
 *
 * Las portadas de los artículos son ilustraciones generadas; en el rediseño v3
 * la pieza destacada lleva una foto de inventario publicado. Si el artículo
 * tiene `related_city`, se toma un desarrollo de esa ciudad; si no, el más
 * reciente con fotos. Se usa la segunda foto cuando existe (la primera suele ser
 * la misma de la tarjeta del listado). Fail-soft: cualquier error → null y la
 * nota se pinta sin foto.
 */
export async function pickEditorialPhoto(supabase: SupabaseClient | null, city: string | null): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .schema('real_estate_hub' as 'public')
      .from('v_developments')
      .select('city, images')
      .not('approved_at', 'is', null)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(40);
    if (error || !data) return null;
    const rows = (data as Array<{ city: string | null; images: string[] | null }>).filter((r) => r.images && r.images.length > 0);
    const match = city ? rows.find((r) => r.city && norm(r.city) === norm(city)) : undefined;
    const row = match ?? rows[0];
    if (!row?.images) return null;
    return row.images[1] ?? row.images[0];
  } catch {
    return null;
  }
}
