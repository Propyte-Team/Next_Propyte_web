export function formatDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}
