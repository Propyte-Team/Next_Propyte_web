/**
 * Blog category constants — module sin 'use client' para que se puedan
 * importar tanto desde Server Components como Client Components.
 *
 * Si se importan desde un módulo `'use client'` (ej. BlogHero), Next.js 16
 * RSC convierte el const en proxy function en el server side y `===` siempre
 * devuelve false. Por eso este archivo es neutro.
 */
export const CAT_ASESORES = 'Para Asesores';
export const CAT_INVERSIONISTAS = 'Para Inversionistas';
