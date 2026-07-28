/**
 * Fechas de publicación y actualización de un artículo, saneadas.
 *
 * Motivo: en la BD de prod (jul-2026) **8 artículos ES y 6 EN tienen `updated_at`
 * ANTERIOR a `published_at`** — son posts redactados días antes y publicados
 * después, sin tocar el contenido en medio. Publicarlo tal cual da un
 * `dateModified` < `datePublished`, que es una señal inválida, y mostraría
 * "Actualizado" con una fecha más vieja que la de publicación.
 *
 * Reglas:
 *  - `modified` nunca es anterior a `published` (se aplana a `published`).
 *  - `showModified` solo si la actualización cae en un día calendario POSTERIOR.
 *    Un `updated_at` unas horas después del publish es el mismo acto editorial,
 *    no una actualización de contenido que merezca fecha propia.
 *
 * La comparación es por fecha UTC del ISO, no por la zona del proceso: el mismo
 * artículo no debe cambiar de estado según dónde corra el render.
 */

export interface PostDateInput {
  published_at?: string | null;
  updated_at?: string | null;
  created_at: string;
}

export interface PostDates {
  /** ISO para `datePublished` y el `dateTime` del `<time>`. */
  published: string;
  /** ISO para `dateModified`; nunca anterior a `published`. */
  modified: string;
  /** Si la fecha de actualización merece renderizarse aparte. */
  showModified: boolean;
}

/** Día calendario UTC (`YYYY-MM-DD`) de un ISO. */
function utcDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function resolvePostDates(post: PostDateInput): PostDates {
  const published = post.published_at ?? post.created_at;
  const rawModified = post.updated_at ?? post.created_at;

  const clamped =
    new Date(rawModified).getTime() < new Date(published).getTime() ? published : rawModified;

  return {
    published,
    modified: clamped,
    showModified: utcDay(clamped) > utcDay(published),
  };
}
