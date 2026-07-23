// src/lib/lead-magnet/editions.ts
// Persistencia de ediciones del lead magnet (tabla + Storage). Server-only.
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>;
const BUCKET = 'lead-magnets';
const TABLE = 'lead_magnet_editions';
const hub = (c: Client) => c.schema('real_estate_hub' as 'public');

export interface EditionRow {
  id: string;
  edition: string;
  locale: 'es' | 'en';
  storage_path: string;
  status: 'pending' | 'active' | 'archived';
  generated_at: string;
  approved_at: string | null;
}

export function editionStoragePath(edition: string, locale: string): string {
  return `editions/${edition}-${locale}.pdf`;
}

export async function uploadEditionPdf(
  client: Client, path: string, pdf: Buffer,
): Promise<{ error: string | null }> {
  const { error } = await client.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  return { error: error ? error.message : null };
}

/** Upsert de edición → SIEMPRE termina en 'pending' (spec §3 Regeneración).
 *  Si la fila (edition,locale) existente estaba 'active', se demota a pending
 *  y se restaura como 'active' la archivada más reciente del locale (para no
 *  dejar hueco en la descarga mientras Luis re-aprueba). */
export async function upsertEditionPending(
  client: Client,
  args: { edition: string; locale: 'es' | 'en'; storagePath: string; units: unknown },
): Promise<{ error: string | null }> {
  const { data: existing } = await hub(client)
    .from(TABLE)
    .select('id, status')
    .eq('edition', args.edition)
    .eq('locale', args.locale)
    .maybeSingle();

  const wasActive = existing?.status === 'active';

  const { error } = await hub(client)
    .from(TABLE)
    .upsert(
      {
        edition: args.edition,
        locale: args.locale,
        storage_path: args.storagePath,
        status: 'pending',
        units: args.units,
        generated_at: new Date().toISOString(),
        approved_at: null,
      },
      { onConflict: 'edition,locale' },
    );
  if (error) return { error: error.message };

  if (wasActive) {
    const { data: lastArchived } = await hub(client)
      .from(TABLE)
      .select('id')
      .eq('locale', args.locale)
      .eq('status', 'archived')
      .neq('edition', args.edition)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastArchived) {
      await hub(client).from(TABLE).update({ status: 'active' }).eq('id', lastArchived.id);
    }
  }
  return { error: null };
}

export async function getActiveEdition(
  client: Client, locale: 'es' | 'en',
): Promise<EditionRow | null> {
  const { data, error } = await hub(client)
    .from(TABLE)
    .select('id, edition, locale, storage_path, status, generated_at, approved_at')
    .eq('locale', locale)
    .eq('status', 'active')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as EditionRow;
}

/** URL firmada de descarga (~10 min). null si falla (fail-soft). */
export async function signEditionUrl(
  client: Client, storagePath: string,
): Promise<string | null> {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 600, {
      download: 'propyte-top10-oportunidades.pdf',
    });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
