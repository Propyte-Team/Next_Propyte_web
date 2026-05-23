// Detecta si el deploy actual debe emitir noindex/nofollow.
// Único punto de verdad para staging vs producción a efectos de SEO.
//
// Reglas (en orden):
//   1. NEXT_PUBLIC_NOINDEX === 'true' → override explícito (configurable en Vercel).
//   2. NEXT_PUBLIC_SITE_URL apunta a un host distinto de propyte.com / www.propyte.com.
//   3. Sin señales → asumir producción (no noindex).
export function shouldNoIndex(): boolean {
  if (process.env.NEXT_PUBLIC_NOINDEX === 'true') return true;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return false;
  try {
    const host = new URL(siteUrl).host.toLowerCase();
    return host !== 'propyte.com' && host !== 'www.propyte.com';
  } catch {
    return false;
  }
}
