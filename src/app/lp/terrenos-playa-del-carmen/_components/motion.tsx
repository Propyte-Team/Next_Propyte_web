'use client';

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionProps,
} from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

// ============================================================
// Vocabulario de movimiento de la LP corta.
//
// Dos curvas y tres duraciones, y nada más. El movimiento aquí es JERARQUÍA
// —qué llega primero y qué después—, no decoración. Una landing de conversión
// que anima ocho cosas a la vez no dirige la atención: la reparte.
//
// TRES REGLAS QUE ESTE ARCHIVO HACE CUMPLIR POR CONSTRUCCIÓN:
//
//   1. Nada del primer pliegue anima con JS. El titular y el formulario entran
//      con `.lpt-entra`, que es CSS y solo mueve. El LCP no espera a Framer.
//   2. Ninguna primitiva puede dejar algo invisible para siempre. Sin JS, con
//      reduced-motion, o si el observer nunca dispara, lo que se ve es la
//      página terminada.
//   3. El dinero se sirve ya escrito. Ver `Contador`.
// ============================================================

/** Salida expo: arranca rápido y frena largo. Lo que entra, aterriza. */
export const EASE_ENTRADA = [0.16, 1, 0.3, 1] as const;

/** Cambios de estado dentro de algo ya visible (el selector de plazo). */
export const EASE_ESTADO = [0.4, 0, 0.2, 1] as const;

export const DUR = { corta: 0.4, media: 0.62, larga: 0.9 } as const;

/**
 * Margen de disparo negativo: el bloque entra cuando ya lleva un trozo dentro
 * de la ventana, no al asomar un píxel. Con scroll rápido evita que todo
 * aparezca ya animado antes de que el ojo llegue.
 */
const MARGEN_VISTA = '-12% 0px -12% 0px';

/** Entrada básica: sube y aparece, una sola vez. */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'p' | 'span';
}) {
  const Comp = motion[as] as React.ComponentType<MotionProps & { className?: string }>;

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: MARGEN_VISTA }}
      transition={{ duration: DUR.media, ease: EASE_ENTRADA, delay }}
    >
      {children}
    </Comp>
  );
}

/**
 * Escalona a sus hijos marcados con `<Escalon>`. Es lo que convierte una lista
 * de cuatro pruebas en una lectura con orden, en vez de un parpadeo simultáneo.
 */
export function Escalonado({
  children,
  className,
  intervalo = 0.08,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  intervalo?: number;
  delay?: number;
  as?: 'div' | 'ul';
}) {
  const Comp = motion[as] as React.ComponentType<MotionProps & { className?: string }>;

  return (
    <Comp
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: MARGEN_VISTA }}
      variants={{
        visible: { transition: { staggerChildren: intervalo, delayChildren: delay } },
      }}
    >
      {children}
    </Comp>
  );
}

/** Hijo de `Escalonado`. Fuera de él no anima: no tiene padre que lo dispare. */
export function Escalon({
  children,
  className,
  y = 14,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: 'div' | 'li';
}) {
  const Comp = motion[as] as React.ComponentType<MotionProps & { className?: string }>;

  return (
    <Comp
      className={className}
      variants={{
        oculto: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: DUR.media, ease: EASE_ENTRADA } },
      }}
    >
      {children}
    </Comp>
  );
}

/**
 * Cifra que cuenta hasta su valor al entrar en pantalla.
 *
 * DOS DECISIONES QUE IMPORTAN, PORQUE AQUÍ SE PUBLICA DINERO:
 *
 * · El HTML del servidor ya trae la cifra FINAL. React no re-renderiza durante
 *   la animación: se escribe `textContent` a mano. Si el JS no carga, si falla,
 *   o si alguien lee el HTML crudo, lo que hay es el precio correcto y no un
 *   cero. Dejar «MXN 0» en pantalla por un error de hidratación no es un fallo
 *   estético en una página que vende terrenos.
 *
 * · Solo se arma si el elemento está POR DEBAJO de la ventana al montar. Si ya
 *   se ve, se queda con su valor final: bajarlo a cero delante del usuario para
 *   volver a subirlo es un parpadeo, no una animación.
 */
export function Contador({
  valor,
  formato,
  className,
  duracion = 1,
}: {
  valor: number;
  formato: (n: number) => string;
  className?: string;
  duracion?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const armado = useRef(false);
  const enVista = useInView(ref, { once: true, margin: MARGEN_VISTA });
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    armado.current = true;
    el.textContent = formato(0);
  }, [reduce, formato]);

  useEffect(() => {
    if (!enVista || reduce || !armado.current) return;
    const el = ref.current;
    if (!el) return;

    const control = animate(0, valor, {
      duration: duracion,
      ease: EASE_ENTRADA,
      onUpdate: (n) => {
        el.textContent = formato(n);
      },
      // El redondeo del último frame no puede quedarse como cifra publicada.
      onComplete: () => {
        el.textContent = formato(valor);
      },
    });

    return () => {
      control.stop();
      el.textContent = formato(valor);
    };
  }, [enVista, reduce, valor, formato, duracion]);

  return (
    <span ref={ref} className={className}>
      {formato(valor)}
    </span>
  );
}

/**
 * Deriva lenta de la foto del hero con el scroll.
 *
 * Recibe la `<Image>` ya rendida por el servidor como `children`: no la monta
 * ni la retrasa, solo le aplica `transform` —propiedad compuesta, sin layout ni
 * paint— cuando ya existe. El LCP no depende de que este JS haya cargado.
 *
 * La escala fija de 1.12 evita que el borde inferior se despegue al desplazar.
 */
export function ParallaxHero({
  children,
  className,
  intensidad = 80,
}: {
  children: ReactNode;
  className?: string;
  intensidad?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Un MotionValue pasado por `style` va por fuera de `MotionConfig`: aquí la
  // preferencia se atiende anulando el recorrido, no cambiando de elemento. La
  // escala se conserva: no es movimiento, es encuadre.
  const recorrido = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : intensidad]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y: recorrido, scale: 1.12, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Barra a escala que se dibuja al entrar en pantalla. `pct` es la proporción
 * respecto a la mayor distancia del grupo, no un porcentaje absoluto.
 */
export function BarraEscala({ pct, className }: { pct: number; className?: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className={className}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: Math.max(0.04, Math.min(1, pct)) }}
      viewport={{ once: true, margin: MARGEN_VISTA }}
      transition={{ duration: DUR.larga, ease: EASE_ENTRADA }}
      style={{ transformOrigin: 'left center', display: 'block' }}
    />
  );
}
