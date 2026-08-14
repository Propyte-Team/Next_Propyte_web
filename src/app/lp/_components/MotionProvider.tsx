'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

// ============================================================
// Dónde se atiende `prefers-reduced-motion` en esta landing. Aquí, y en un solo
// sitio.
//
// `reducedMotion="user"` hace que Framer, para quien declara la preferencia,
// descarte las animaciones de `transform` —desplazamientos, escalas, parallax—
// y conserve las de `opacity`. No es un atajo: es la lectura correcta de la
// preferencia. Lo que provoca mareo y molestia vestibular es el MOVIMIENTO, no
// que un bloque aparezca. Matar también los fundidos dejaría la página idéntica
// a la anterior para quien pidió menos movimiento, sin ganancia para nadie.
//
// POR QUÉ NO SE RESUELVE EN CADA COMPONENTE. Se intentó, con un
// `if (useReducedMotion()) return <div/>` en cada primitiva, y produjo un fallo
// peor que el problema: 19 nodos servidos con `opacity: 0` que ya nadie
// levantaba, incluidos los dos botones del hero. El hook vale `false` en el
// servidor, así que el cero viaja en el HTML; al cambiar el tipo de elemento en
// el cliente, React reconcilia `div` contra `div` y deja intacto un `style`
// que escribió Framer y que él nunca gestionó. Centralizarlo aquí elimina esa
// clase de error por completo: los componentes no deciden, solo animan.
// ============================================================

export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
