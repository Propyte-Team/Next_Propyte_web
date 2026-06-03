/**
 * Resuelve la trayectoria (bio larga) según el locale.
 * @param locale - locale de la ruta ('es' | 'en'); tolera subtags ('en-US').
 * EN: usa bio_long_en y cae a bio_long (ES) si está vacío.
 * ES: usa solo bio_long (sin fallback a EN).
 * Devuelve null si no hay contenido → no se ofrece pop-up.
 */
export function pickBio(
  locale: string,
  bioLong: string | null | undefined,
  bioLongEn: string | null | undefined,
): string | null {
  const es = (bioLong ?? '').trim();
  const en = (bioLongEn ?? '').trim();
  if (locale.startsWith('en')) return en || es || null;
  return es || null;
}

const FALLBACK_AVATAR_COLORS = ['#1A2F3F', '#0F1923', '#0E7490', '#0E7490', '#134E4A'];

/** Iniciales (máx 2 palabras) de un nombre, para el avatar fallback sin foto. */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Color de fondo determinista (por nombre) del avatar fallback. Consistente card↔modal. */
export function pickAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return FALLBACK_AVATAR_COLORS[Math.abs(hash) % FALLBACK_AVATAR_COLORS.length];
}

/** Datos que consume <TeamBioModal>. El caller resuelve bio + whatsappLink. */
export interface TeamBioPerson {
  name: string;
  role: string;
  city?: string | null;
  photoUrl?: string | null;
  bio: string;
  whatsappLink?: string | null;
}
