import 'server-only';
import { notFound } from 'next/navigation';
import { getVisibility, isVisible } from './visibility';

/**
 * Gate de página completa controlado por el Hub. Si el Hub marca la key como
 * `false`, la página devuelve 404 (notFound). Fail-open: si el Hub no responde
 * o la key no existe, la página se muestra (mismo criterio que isVisible).
 *
 * Uso (Server Component, al inicio del page.tsx tras setRequestLocale):
 *   await assertPageVisible(VISIBILITY_KEYS.PAGE_ZONAS);
 *
 * `server-only` evita que este helper (que importa next/navigation) se cuele
 * en bundles de cliente.
 */
export async function assertPageVisible(key: string): Promise<void> {
  const visibility = await getVisibility();
  if (!isVisible(visibility, key)) {
    notFound();
  }
}
