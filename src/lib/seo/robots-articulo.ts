/**
 * Directiva `robots` de un artículo del blog, combinando las dos fuentes que
 * pueden pedir noindex:
 *
 *   - el deploy entero (staging), vía `shouldNoIndex()` en ./noindex
 *   - el artículo, vía la columna `noindex` de `public.blog_posts`
 *
 * Cualquiera de las dos alcanza; ninguna puede anular a la otra. Vive aparte del
 * componente de página para poder probar ese cruce sin montar un render.
 *
 * La columna existe para retirar un artículo del índice sin borrarlo: es la
 * alternativa al 301 cuando no hay un destino equivalente al que mandar a la
 * gente. Un 301 hacia algo que no responde la misma pregunta es un soft-404 para
 * Google, y el sitio ya se llevó esa lección con el redirect del blog que apuntó
 * dos veces a un artículo despublicado.
 */
export type RobotsArticulo = { index: false; follow: true };

export function robotsDeArticulo(opts: {
  postNoindex: boolean | null | undefined;
  deployNoindex: boolean;
}): RobotsArticulo | undefined {
  if (!opts.postNoindex && !opts.deployNoindex) return undefined;

  // `follow: true` a propósito: un artículo retirado sigue enlazando a
  // desarrollos y a otros artículos. noindex lo saca del índice; nofollow además
  // desperdiciaría la autoridad que esos enlaces todavía transmiten.
  return { index: false, follow: true };
}
