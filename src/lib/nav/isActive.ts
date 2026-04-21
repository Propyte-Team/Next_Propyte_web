export function isNavActive(pathname: string, id: string, href: string, locale: string): boolean {
  const bare = pathname.replace(/^\/(es|en)/, '') || '/';
  if (id === 'home') return bare === '/' || bare === '';
  if (id === 'developments') return bare.startsWith('/desarrollos');
  if (id === 'properties') return bare.startsWith('/propiedades');
  if (id === 'nosotros') return bare.startsWith('/nosotros');
  if (id === 'mercado') return bare.startsWith('/mercado') || bare.startsWith('/zonas');
  return bare.startsWith(href.replace(`/${locale}`, ''));
}
