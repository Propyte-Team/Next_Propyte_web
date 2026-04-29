/**
 * Legal contact emails — extraídos para que un cambio de cuenta de
 * correo no requiera tocar 6+ archivos. Override per env disponible
 * (útil para staging vs prod).
 */
export const PRIVACY_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'privacidad@propyte.com';

export const LEGAL_EMAIL =
  process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? 'legal@propyte.com';
