import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static assets, Design Playground (/admin/*),
  // y rutas de metadata de Next (icon/apple-icon/manifest/sitemap/robots).
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname === '/icon' ||
    pathname === '/apple-icon' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Normalización de slugs de zona con acento → sin acento (308).
  // Solo quita diacríticos del segmento, preservando guiones (no reconstruye
  // desde el nombre, para no romper slugs como "aqua---cumbres").
  const zonaMatch = pathname.match(/^\/(es|en)\/zonas\/([^/]+)\/?$/);
  if (zonaMatch) {
    const [, loc, rawSeg] = zonaMatch;
    let seg = rawSeg;
    try {
      seg = decodeURIComponent(rawSeg);
    } catch {
      /* segmento malformado: usar tal cual */
    }
    const deAccented = seg
      .toLowerCase()
      .replace(/[áàä]/g, 'a')
      .replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o')
      .replace(/[úùü]/g, 'u')
      .replace(/ñ/g, 'n');
    if (deAccented !== seg) {
      const url = request.nextUrl.clone();
      url.pathname = `/${loc}/zonas/${deAccented}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // Check for slug redirects (old WP URLs → new Next.js paths)
  // Strips locale prefix to get the bare slug for lookup
  const bareSlug = pathname.replace(/^\/(es|en)\//, '').replace(/\/$/, '');
  if (bareSlug && !bareSlug.includes('/')) {
    // Single-segment path that could be an old WP slug
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/slug_redirects?old_slug=eq.${encodeURIComponent(bareSlug)}&select=new_path,redirect_type&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            next: { revalidate: 3600 }, // Cache redirect lookups for 1 hour
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            const { new_path, redirect_type } = data[0];
            // Defense: only follow rows that look like a safe internal redirect.
            // Reject protocol-relative ('//evil.com'), absolute URLs, and non-path values
            // — even if the Hub editor (or a compromised account) inserts hostile data.
            const isSafePath =
              typeof new_path === 'string' &&
              new_path.startsWith('/') &&
              !new_path.startsWith('//');
            const ALLOWED_REDIRECT_STATUS = new Set([301, 302, 307, 308]);
            const status = ALLOWED_REDIRECT_STATUS.has(redirect_type)
              ? redirect_type
              : 301;
            if (isSafePath) {
              const url = request.nextUrl.clone();
              url.pathname = new_path;
              return NextResponse.redirect(url, status);
            }
          }
        }
      }
    } catch {
      // Supabase unavailable — continue to intl middleware
    }
  }

  // Default: next-intl locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/((?!api|_next|_vercel|icon|apple-icon|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
};
