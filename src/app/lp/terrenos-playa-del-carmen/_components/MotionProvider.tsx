'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

// ============================================================
// Dónde se atiende `prefers-reduced-motion` en esta landing: aquí, y en un solo
// sitio.
//
// `reducedMotion="user"` descarta las animaciones de `transform` y conserva las
// de `opacity` para quien declara la preferencia. Es la lectura correcta: lo que
// provoca malestar vestibular es el MOVIMIENTO, no que un bloque aparezca.
//
// POR QUÉ NO SE RESUELVE COMPONENTE POR COMPONENTE. Ya se intentó en la otra
// landing, con un `if (useReducedMotion()) return <div/>` en cada primitiva, y
// produjo un fallo peor que el problema: 19 nodos servidos con `opacity: 0` que
// ya nadie levantaba, incluidos los dos botones del hero. El hook vale `false`
// en el servidor, así que el cero viaja en el HTML; al cambiar el tipo de
// elemento en el cliente, React reconcilia `div` contra `div` y deja intacto un
// `style` que escribió Framer imperativamente y que nunca gestionó. Centralizar
// aquí elimina esa clase de error: los componentes no deciden, solo animan.
// ============================================================

export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
