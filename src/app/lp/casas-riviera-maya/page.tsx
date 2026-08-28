import type { Metadata } from 'next';
import PaginaCasas from './_pagina';
import { COPY_ES } from './_copy';

// ============================================================
// Landing de casas — ESPAÑOL. Tráfico de México.
//
// El cuerpo entero vive en `_pagina.tsx`, compartido con la variante en inglés
// de `/lp/homes-riviera-maya`. Aquí queda solo lo que Next exige que viva en el
// archivo de la ruta: `metadata` y `revalidate`. Añadir maquetación en este
// archivo la deja fuera de la versión en inglés sin que nadie se entere.
// ============================================================

// ISR: el inventario cambia sin deploy. 5 minutos es suficientemente fresco
// para que un anuncio no cite un precio que la página ya no muestra, y evita
// pegarle a Supabase en cada impresión pagada.
export const revalidate = 300;

export const metadata: Metadata = {
  title: COPY_ES.meta.title,
  description: COPY_ES.meta.description,
  // El layout de /lp ya declara noindex; se repite aquí para que la landing no
  // dependa de que nadie toque el layout compartido.
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function LandingCasasRivieraMaya() {
  return <PaginaCasas copy={COPY_ES} />;
}
