'use client';

import { motion } from 'framer-motion';
import { EASE_ENTRADA } from './motion';
import type { ReactNode } from 'react';

// ============================================================
// Entrada escalonada del hero.
//
// POR QUÉ NO USA `Reveal`. `Reveal` dispara con `whileInView`, que es lo
// correcto para todo lo que hay por debajo del pliegue. El hero ya está en
// pantalla cuando la página carga: ahí `whileInView` resuelve en el mismo
// frame y lo que se ve es un parpadeo, no una entrada. Esto anima al montar.
//
// `prefers-reduced-motion` NO se atiende aquí con un `if` que devuelva un nodo
// plano. Se intentó y dejó los dos botones de este hero invisibles: el detalle
// está en la cabecera de `motion.tsx`. La preferencia la resuelve
// `MotionConfig` en el layout.
//
// ═══ LA REGLA QUE GOBIERNA ESTE ARCHIVO ═══
//
// EL TITULAR NO CAMBIA DE OPACIDAD. NUNCA.
//
// El elemento del LCP de esta ruta es el hero —la imagen a sangre o el titular,
// según viewport— y un elemento que empieza en `opacity: 0` no cuenta como
// pintado hasta que termina de aparecer: animar el titular con un fundido de
// 600 ms es empeorar el LCP en 600 ms, medidos, en una página que se paga por
// clic. `transform` no tiene ese problema: el elemento se pinta en su frame y
// solo se desplaza. Por eso el titular usa `Titular`, que solo mueve, y todo lo
// demás usa `Secundario`, que sí puede fundir porque no es candidato a LCP.
//
// Si alguien añade aquí un `opacity` al titular «para que quede parejo», el
// coste no se ve en pantalla: se ve en la factura de Google Ads.
// ============================================================

/** Retardo base. Deja pasar el primer frame antes de mover nada. */
const BASE = 0.12;

/**
 * El titular. Solo `transform`, jamás `opacity`: es candidato a LCP.
 *
 * El desplazamiento es corto a propósito. Con 40 px el gesto se nota más, pero
 * sobre un titular de cuatro líneas a 4rem el movimiento se lee como un salto
 * de maquetación, que es justo lo que un CLS bien medido penaliza.
 */
export function TitularHero({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.h1
      className={className}
      initial={{ y: 18 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.85, ease: EASE_ENTRADA, delay: BASE }}
    >
      {children}
    </motion.h1>
  );
}

/**
 * Todo lo que acompaña al titular: cintillo, subtítulo, botones, rótulo del
 * render. Aquí sí se funde, porque ninguno es el elemento más grande de la
 * primera pantalla.
 *
 * `orden` es la posición en la secuencia, no un retardo en segundos: quien
 * añada un elemento a la mitad no tiene que recalcular los tiempos de los
 * demás.
 */
export function SecundarioHero({
  children,
  orden,
  className,
}: {
  children: ReactNode;
  orden: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: EASE_ENTRADA,
        // El cintillo entra antes que el titular; el resto, detrás de él.
        delay: BASE + orden * 0.11,
      }}
    >
      {children}
    </motion.div>
  );
}
