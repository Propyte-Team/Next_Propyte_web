export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Slug de zona. Quita acentos (sin afectar el resto) y reemplaza espacios y "/"
 * por guiones, preservando el patrón histórico de las URLs de zona ya indexadas.
 * Única fuente de verdad para todos los puntos que generan el slug de zona.
 */
export function zoneSlug(zone: string): string {
  return zone
    .toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');
}

/**
 * Extract a human-readable filename from a URL. Strips query strings and
 * path, decodes URL encoding. Falls back to a generic name if the URL
 * is malformed.
 */
export function deriveFilenameFromUrl(url: string, fallback = 'document.pdf'): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (!last) return fallback;
    return decodeURIComponent(last);
  } catch {
    const tail = url.split('?')[0].split('#')[0].split('/').filter(Boolean).pop();
    return tail ? decodeURIComponent(tail) : fallback;
  }
}
