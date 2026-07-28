/**
 * Re-export del catálogo de ciudades, que vive en `@/lib/cities` para que el
 * sitemap y el catálogo de slots de materiales puedan leerlo sin importar desde
 * `app/`. Se conserva este módulo porque las páginas de ciudad ya importaban de
 * aquí; para agregar una ciudad, edita `src/lib/cities.ts`.
 */
export {
  CITY_MAP,
  CITY_SLUGS,
  cityMatchTerms,
  cityMatchFilter,
  cityMediaKey,
  type CityInfo,
} from '@/lib/cities';
