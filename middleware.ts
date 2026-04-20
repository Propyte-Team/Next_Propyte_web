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
            const url = request.nextUrl.clone();
            url.pathname = new_path;
            return NextResponse.redirect(url, redirect_type || 301);
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
