/**
 * Resuelve la trayectoria (bio larga) según el locale.
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
  if (locale === 'en') return en || es || null;
  return es || null;
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
