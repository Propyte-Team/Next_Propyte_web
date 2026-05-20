import { NextRequest, NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { expandCompactId, type ResourceType } from '@/lib/images/proxyUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VIEW_BY_TYPE: Record<ResourceType, string> = {
  u: 'v_units',
  d: 'v_developments',
};

const ONE_YEAR_SECONDS = 31_536_000;

function isValidType(t: string): t is ResourceType {
  return t === 'u' || t === 'd';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string; idx: string }> },
) {
  const { type, id, idx: idxRaw } = await params;

  if (!isValidType(type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  const uuid = expandCompactId(id);
  if (!uuid) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const idxNum = parseInt(idxRaw.replace(/\.[a-z0-9]+$/i, ''), 10);
  if (!Number.isInteger(idxNum) || idxNum < 0 || idxNum > 199) {
    return NextResponse.json({ error: 'invalid_idx' }, { status: 400 });
  }

  const client = createPublicSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: 'supabase_unavailable' }, { status: 503 });
  }

  const { data, error } = await client
    .schema('real_estate_hub' as 'public')
    .from(VIEW_BY_TYPE[type])
    .select('images')
    .eq('id', uuid)
    .not('approved_at', 'is', null)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const images = (data as { images?: string[] | null }).images;
  if (!Array.isArray(images) || idxNum >= images.length) {
    return NextResponse.json({ error: 'image_not_found' }, { status: 404 });
  }

  const upstreamUrl = images[idxNum];
  if (!upstreamUrl || !upstreamUrl.includes('/storage/v1/object/public/')) {
    return NextResponse.json({ error: 'invalid_upstream' }, { status: 502 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'upstream_fetch_failed' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'upstream_status' }, { status: 502 });
  }

  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const len = upstream.headers.get('content-length');
  if (len) headers.set('content-length', len);
  const etag = upstream.headers.get('etag');
  if (etag) headers.set('etag', etag);
  headers.set('cache-control', `public, max-age=${ONE_YEAR_SECONDS}, s-maxage=${ONE_YEAR_SECONDS}, immutable`);
  headers.set('x-content-type-options', 'nosniff');

  return new Response(upstream.body, { status: 200, headers });
}
