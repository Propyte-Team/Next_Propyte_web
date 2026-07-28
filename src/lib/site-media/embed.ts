/**
 * Conversión de URLs de video "para compartir" a URLs embebibles en un iframe.
 *
 * Los slots de Materiales del sitio guardan la URL tal como la pega el usuario
 * desde YouTube/Vimeo/Drive (`youtu.be/ID`, `youtube.com/watch?v=ID`, ...).
 * Ninguna de esas formas se puede embeber: YouTube responde `X-Frame-Options`
 * y el iframe queda en blanco. Toda ruta que termine en un `<iframe src>` debe
 * pasar por aquí — es la única implementación, para que no vuelva a divergir.
 */

/** True si la URL apunta a un proveedor externo que se embebe por iframe. */
export function isExternalVideo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com/i.test(url);
}

/**
 * Devuelve la URL embebible. Si no reconoce el proveedor la devuelve intacta
 * (un mp4 propio se sirve con `<video>`, no con iframe).
 */
export function toEmbedUrl(url: string): string {
  // Ya viene en forma embebible → no tocar.
  if (/youtube\.com\/embed\/|player\.vimeo\.com\/video\/|drive\.google\.com\/file\/d\/[\w-]+\/preview/i.test(url)) {
    return url;
  }

  // youtu.be/ID  ·  youtube.com/shorts/ID  ·  youtube.com/live/ID  ·  youtube.com/v/ID
  const ytPath = url.match(/(?:youtu\.be|youtube\.com\/(?:shorts|live|v|embed))\/([\w-]{6,})/i);
  if (ytPath) return `https://www.youtube.com/embed/${ytPath[1]}`;

  // youtube.com/watch?...v=ID — `v` puede no ser el primer parámetro.
  const ytWatch = url.match(/youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,})/i);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

  return url;
}
