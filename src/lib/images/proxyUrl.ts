// Image proxy that hides Supabase storage host + filename. The browser sees
// /propyte-media/<type>/<uuid>/<idx>.<ext> and the route handler at
// app/propyte-media/[type]/[id]/[idx]/route.ts streams the real bytes from
// Supabase. Non-Supabase URLs (Unsplash, Drive, YouTube thumbs) pass through.

export type ResourceType = 'u' | 'd';

const PROXY_PREFIX = '/propyte-media';
const SUPABASE_PUBLIC_MARKER = '/storage/v1/object/public/';

function getExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const m = /\.([a-z0-9]{2,5})$/i.exec(clean);
  return m ? `.${m[1].toLowerCase()}` : '.jpg';
}

function compactId(recordId: string): string {
  return recordId.replace(/-/g, '').toLowerCase();
}

export function toProxyImage(
  originalUrl: string | null | undefined,
  type: ResourceType,
  recordId: string,
  idx: number,
): string | null {
  if (!originalUrl) return null;
  if (!originalUrl.includes(SUPABASE_PUBLIC_MARKER)) return originalUrl;
  if (!recordId) return originalUrl;
  return `${PROXY_PREFIX}/${type}/${compactId(recordId)}/${idx}${getExt(originalUrl)}`;
}

export function toProxyImages(
  urls: string[] | null | undefined,
  type: ResourceType,
  recordId: string,
): string[] {
  if (!urls || !Array.isArray(urls) || !recordId) return urls ?? [];
  return urls
    .map((u, i) => toProxyImage(u, type, recordId, i))
    .filter((x): x is string => typeof x === 'string');
}

export function expandCompactId(compact: string): string | null {
  const c = compact.toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(c)) return null;
  return `${c.slice(0, 8)}-${c.slice(8, 12)}-${c.slice(12, 16)}-${c.slice(16, 20)}-${c.slice(20, 32)}`;
}
