/**
 * El Hub no tiene un campo `role_en` separado: el equipo captura ambos
 * idiomas en el mismo campo `role` con el formato "Rol ES | Rol EN"
 * (ej. "Director Comercial | Commercial Director"). Sin "|" el valor es
 * el mismo en ambos idiomas (ej. "Team Leader", "Software").
 */
export function splitBilingualRole(role: string, locale: string): string {
  const parts = role.split('|').map((p) => p.trim());
  if (parts.length < 2 || !parts[1]) return parts[0];
  return locale === 'en' ? parts[1] : parts[0];
}
