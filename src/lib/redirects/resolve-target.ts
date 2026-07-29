import type { EntityType } from './match-entity-path';

/**
 * Resuelve el destino final de un slug retirado, siguiendo cadenas.
 *
 * Pura: recibe el mapa ya cargado. La carga y el cacheo viven aparte, para que
 * esta lógica —que es donde están los casos peligrosos— se pueda probar sola.
 *
 * Por qué sigue la cadena: un desarrollo renombrado dos veces deja dos filas
 * (v1→v2 y v2→v3). Mandar un 308 a v2, que a su vez redirige, diluye la señal y
 * suma un salto. Con 3,569 filas de renombrados repetidos, las cadenas existen.
 *
 * Por qué hay tope de saltos y registro de visitados: un ciclo en la tabla
 * colgaría el middleware en CADA request de esa URL. Nada justifica ese riesgo.
 */
export type RedirectEntry = { newSlug: string | null; kind: 'redirect' | 'gone' };

/** Llave: `${entityType}:${slug}`. */
export type RedirectMap = Map<string, RedirectEntry>;

export type RedirectTarget = { kind: 'redirect'; slug: string } | { kind: 'gone' };

const MAX_SALTOS = 10;

export function resolveTarget(
  map: RedirectMap,
  entityType: EntityType,
  slug: string,
): RedirectTarget | null {
  const visitados = new Set<string>([slug]);
  let actual = slug;
  let ultimoDestino: string | null = null;

  for (let salto = 0; salto < MAX_SALTOS; salto++) {
    const entry = map.get(`${entityType}:${actual}`);
    if (!entry) break;

    if (entry.kind === 'gone') return { kind: 'gone' };
    if (!entry.newSlug) break;

    // Auto-referencia: la fila no aporta nada y redirigir sería un bucle de un salto.
    if (entry.newSlug === actual) break;
    // Ciclo: ya pasamos por aquí. Cortar y no redirigir a ninguna parte.
    if (visitados.has(entry.newSlug)) return null;

    visitados.add(entry.newSlug);
    ultimoDestino = entry.newSlug;
    actual = entry.newSlug;
  }

  // Si se agotaron los saltos, `ultimoDestino` es un intermedio válido: un 308 a
  // mitad de cadena sigue siendo mejor que dejar la URL sin destino.
  if (!ultimoDestino || ultimoDestino === slug) return null;
  return { kind: 'redirect', slug: ultimoDestino };
}
