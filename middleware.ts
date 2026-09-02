import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { matchEntityPath } from './src/lib/redirects/match-entity-path';
import { resolveTarget } from './src/lib/redirects/resolve-target';
import { loadRedirectMap } from './src/lib/redirects/load-map';
import { paginaSinContenido } from './src/lib/redirects/pagina-sin-contenido';

const intlMiddleware = createIntlMiddleware(routing);

/** 90 días: la ventana de atribución más larga que ofrece Meta. */
const META_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/**
 * Persiste los identificadores de clic de Meta como cookies first-party.
 *
 * El problema que resuelve: `getBrowserContext()` sintetiza `fbc` a partir del
 * `fbclid` de la URL, pero el `fbclid` sólo existe en la página de aterrizaje.
 * En cuanto el visitante navega, Next enruta del lado del cliente y el
 * parámetro desaparece, así que todos los eventos posteriores viajan sin `fbc`.
 * `ViewContent` se dispara en la ficha del inmueble —que casi nunca es la
 * página de entrada— y por eso Events Manager reclama justo ese evento.
 *
 * Fijarlas desde el servidor también las salva del ITP de Safari, que recorta
 * a 7 días las cookies escritas por JavaScript de terceros.
 */
function persistMetaClickIds(request: NextRequest, response: NextResponse): NextResponse {
  const fbclid = request.nextUrl.searchParams.get('fbclid');
  const hasFbp = request.cookies.has('_fbp');

  // Sin señal de Meta no se toca nada: no queremos sembrarle una cookie a cada
  // crawler ni al tráfico orgánico, que no alimenta ninguna campaña.
  if (!fbclid && (hasFbp || !request.cookies.has('_fbc'))) return response;

  const isProd = request.nextUrl.hostname.endsWith('propyte.com');
  const options = {
    maxAge: META_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: isProd,
    // httpOnly NO: fbevents.js tiene que leer estas cookies. Si no las ve,
    // genera un _fbp propio distinto del que manda el CAPI y Meta cuenta dos
    // personas donde hay una — justo lo contrario de lo que se busca.
    httpOnly: false,
    ...(isProd ? { domain: '.propyte.com' } : {}),
  };

  // Último clic gana: es el comportamiento del propio pixel cuando ve un
  // fbclid nuevo, y la atribución debe seguir al anuncio más reciente.
  if (fbclid) {
    response.cookies.set('_fbc', `fb.1.${Date.now()}.${fbclid}`, options);
  }

  if (!hasFbp) {
    const random = Math.floor(Math.random() * 1e10);
    response.cookies.set('_fbp', `fb.1.${Date.now()}.${random}`, options);
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  return persistMetaClickIds(request, await handleRequest(request));
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
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
    // 410 solo para el retiro deliberado; 404 para lo inferido (la entidad dejó
    // de estar publicada, y eso se revierte desde el Hub en un clic). Ver el
    // bloque de RedirectTarget en resolve-target.ts.
    if (target?.kind === 'gone' || target?.kind === 'not-found') {
      const status = target.kind === 'gone' ? 410 : 404;
      return new NextResponse(
        paginaSinContenido({ status, locale: entityMatch.locale, seccion: entityMatch.seccion }),
        {
          status,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            // Que un CDN no se quede con el 404 más de lo necesario: republicar
            // un desarrollo debe volver a servir la página, no este cuerpo.
            'cache-control': 'public, max-age=0, s-maxage=60',
            'x-robots-tag': 'noindex, follow',
          },
        },
      );
    }
  }

  // Default: next-intl locale routing.
  //
  // next-intl emite 307 (temporal) al anteponer el prefijo de locale, y ese es el
  // status con el que Google ve `propyte.com/` → `/es`. Search Console las reporta
  // como "Página con redirección" (17 URLs al 5-ago): la raíz es la URL a la que
  // apunta cada backlink y cada mención de la marca, y un redirect temporal no
  // consolida esas señales en la versión con prefijo. Se reescribe a 308.
  //
  // Es seguro porque `localeDetection: false` en src/i18n/routing.ts fija el
  // destino: la raíz SIEMPRE va a /es. Si algún día se activa la detección de
  // idioma, ESTE BLOQUE SE REVIERTE — con destino variable un 308 es un bug, el
  // navegador cachea el permanente y clava al visitante en el primer locale que
  // le tocó.
  const response = intlMiddleware(request);
  const location = response.headers.get('location');
  if (response.status === 307 && location) {
    const permanent = NextResponse.redirect(new URL(location, request.url), 308);
    response.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      // `location` ya viaja en el redirect nuevo; las cookies se copian aparte
      // porque headers.forEach colapsa múltiples Set-Cookie en uno solo.
      if (k !== 'location' && k !== 'set-cookie') permanent.headers.set(key, value);
    });
    for (const cookie of response.cookies.getAll()) {
      permanent.cookies.set(cookie);
    }
    return permanent;
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/(es|en)/:path*',
    '/((?!api|_next|_vercel|icon|apple-icon|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
};
