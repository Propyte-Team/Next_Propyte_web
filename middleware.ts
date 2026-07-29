import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { matchEntityPath } from './src/lib/redirects/match-entity-path';
import { resolveTarget } from './src/lib/redirects/resolve-target';
import { loadRedirectMap } from './src/lib/redirects/load-map';

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

  // ── Redirecciones de entidades retiradas: blog, desarrollos y unidades ──────
  //
  // Este bloque REEMPLAZA un lookup que no podía funcionar: pedía
  // `/rest/v1/slug_redirects?select=new_path,redirect_type` — tabla y columnas
  // que no existen. `slug_redirects` vive en el schema `real_estate_hub` y sus
  // columnas son `new_slug` y `kind`; sin el header `Accept-Profile`, PostgREST
  // resolvía al schema `public`, devolvía error, `if (res.ok)` lo descartaba y el
  // `catch {}` se lo comía. Los redirects de slugs legacy de WP nunca corrieron,
  // y tampoco hay filas de WP en la tabla: si alguna vez se necesitan, necesitan
  // diseño y datos propios, no este bloque.
  //
  // Y es el único lugar donde el status se puede fijar. `permanentRedirect()`
  // desde un componente de página no emite un 3xx: con la cadena de loading.tsx
  // el 200 ya está comprometido cuando el componente corre. Medido el 29-jul
  // sobre cuatro desarrollos con fila en la tabla — 200 sin header Location en
  // los cuatro, de 3,569 filas creadas para "preservar SEO de URLs indexadas".
  // Ver el frente D del spec en Propyte_hub.
  const entityMatch = matchEntityPath(pathname);
  if (entityMatch) {
    const target = resolveTarget(
      await loadRedirectMap(),
      entityMatch.entityType,
      entityMatch.slug
    );
    if (target?.kind === 'redirect') {
      const url = request.nextUrl.clone();
      // Se reemplaza sólo el último segmento: matchEntityPath ya garantizó la
      // forma /{locale}/{sección}/{slug}, así que la sección se preserva tal cual
      // sin que el middleware tenga que conocer su nombre.
      url.pathname = pathname.replace(/\/+$/, '').replace(/[^/]+$/, target.slug);
      return NextResponse.redirect(url, 308);
    }
    if (target?.kind === 'gone') {
      // 410 y no 404: le dice a Google que la URL existió y ya no, y la retira
      // del índice más rápido.
      return new NextResponse('Gone', {
        status: 410,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
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
