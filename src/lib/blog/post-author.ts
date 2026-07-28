/**
 * Autor de un artículo, resuelto contra el equipo real del Hub.
 *
 * La spec de A-5 pedía "extender el modelo del artículo" con cargo, credenciales,
 * foto y url de perfil. No hace falta esquema nuevo: `v_team_members` ya tiene
 * nombre, cargo (`role`) y foto, y `/nosotros/equipo-comercial` ya publica a esa
 * gente. Se resuelve por nombre — así **asignar un autor es escribir su nombre en
 * `blog_posts.author_name`**, un cambio de dato, no de esquema.
 *
 * Transición sin romper nada: los 18 artículos existentes dicen "Propyte", que no
 * matchea a nadie, así que caen al byline genérico de hoy, idéntico.
 *
 * Si dos miembros normalizan al mismo nombre no se enlaza a ninguno: un perfil
 * equivocado firma a una persona real con texto que no escribió.
 */

export interface TeamAuthorSource {
  name: string;
  role: string | null;
  photo_url: string | null;
  /** Línea de credenciales. Hoy `bio_short` viene NULL para los 12 miembros. */
  bio_short?: string | null;
}

export interface ResolvedAuthor {
  name: string;
  /** Cargo, solo si el autor es una persona del equipo. */
  role: string | null;
  /** Credenciales; `null` mientras el Hub no las tenga. */
  credentials: string | null;
  photo: string | null;
  /** Perfil enlazable, o `null` para el autor genérico. */
  profileUrl: string | null;
  isTeamMember: boolean;
}

/** Normaliza para comparar nombres: sin acentos, sin caso, sin espacios dobles. */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ancla estable de un miembro dentro de /nosotros/equipo-comercial.
 * Derivada del nombre, así que no requiere columna nueva; si algún día hay slug
 * propio en el Hub, este es el único punto a cambiar.
 */
export function teamAnchorId(name: string): string {
  return normalizeName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function resolvePostAuthor(
  post: { author_name: string; author_image?: string | null },
  team: TeamAuthorSource[],
  locale: string
): ResolvedAuthor {
  const target = normalizeName(post.author_name);
  const matches = team.filter((m) => normalizeName(m.name) === target);
  const member = matches.length === 1 ? matches[0] : null;

  if (!member) {
    return {
      name: post.author_name,
      role: null,
      credentials: null,
      photo: post.author_image ?? null,
      profileUrl: null,
      isTeamMember: false,
    };
  }

  return {
    name: member.name,
    role: member.role,
    credentials: member.bio_short ?? null,
    // La foto de la fila del artículo gana: permite una foto editorial distinta
    // a la del directorio sin tocar el Hub.
    photo: post.author_image ?? member.photo_url,
    profileUrl: `/${locale}/nosotros/equipo-comercial#${teamAnchorId(member.name)}`,
    isTeamMember: true,
  };
}
