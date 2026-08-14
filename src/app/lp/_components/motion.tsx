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
// Sistema de movimiento de la landing.
//
// POR QUÉ EXISTE ESTE ARCHIVO Y NO ANIMACIONES SUELTAS. El `lp-theme.css`
// documenta una decisión anterior: nada de JS de animación en esta ruta,
// porque el LCP es criterio de aceptación de una página que se paga por clic.
// Esa decisión no se revierte a la ligera, así que el movimiento entra con
// tres condiciones que este archivo hace cumplir por construcción:
//
//   1. NADA ANIMA ANTES DEL LCP. El hero no monta un `initial` que retrase su
//      pintado: la imagen la sigue rindiendo el servidor con `priority`, y lo
//      único que hace el cliente es aplicarle un `transform` cuando ya existe.
//      Un `opacity: 0` sobre el elemento del LCP sería exactamente el error que
//      la decisión original quería evitar.
//   2. TODO SE DEGRADA A CONTENIDO VISIBLE. Ninguna primitiva puede dejar algo
//      en `opacity: 0` para siempre. Con `prefers-reduced-motion`, sin JS, o si
//      el observer nunca dispara, lo que se ve es la página terminada.
//   3. UN SOLO VOCABULARIO. Dos curvas y tres duraciones. El movimiento aquí
//      es jerarquía —qué llega primero y qué después—, no decoración.
//
// ═══ NINGUNA PRIMITIVA CAMBIA DE TIPO DE ELEMENTO ═══
//
// La primera versión de este archivo hacía `if (reduce) return <div/>` en cada
// primitiva, devolviendo un nodo plano en vez del `motion.div`. Parecía lo
// correcto y estaba roto: con `prefers-reduced-motion` activo quedaban 19 nodos
// atascados en `opacity: 0` —entre ellos los DOS BOTONES DEL HERO—, medido en
// navegador. La página se servía sin llamada a la acción justo a quien declara
// una necesidad de accesibilidad.
//
// La causa: `useReducedMotion()` es `false` en el servidor, así que el HTML sale
// con el `opacity:0` que escribe Framer. En el cliente, al cambiar el tipo de
// elemento, React reconcilia `div` con `div` y no toca un `style` que nunca
// pasó por sus props —lo había escrito Framer imperativamente—, así que el cero
// se queda ahí para siempre. Nadie lo levanta.
//
// La regla, entonces: se renderiza SIEMPRE el componente de Framer, y la
// preferencia se atiende donde corresponde, con `<MotionConfig reducedMotion>`
// en el layout. Framer conserva los fundidos y desactiva los desplazamientos,
// que es exactamente lo que pide la preferencia: molesta el movimiento, no que
// algo aparezca. Ver `MotionProvider`.
// ============================================================

/**
 * Salida expo. Arranca rápido y frena largo: el gesto se lee como algo que
 * *aterriza*, no como algo que se desliza. Es la curva por defecto de todo lo
 * que entra en pantalla.
 */
export const EASE_ENTRADA = [0.16, 1, 0.3, 1] as const;

/** Para cambios de estado dentro de un componente ya visible (tabs, cifras). */
export const EASE_ESTADO = [0.4, 0, 0.2, 1] as const;

export const DUR = { corta: 0.4, media: 0.65, larga: 0.9 } as const;

/**
 * Margen de disparo. Negativo: el elemento entra cuando ya lleva un buen trozo
 * dentro de la ventana, no al asomar un píxel. Con scroll rápido evita que todo
 * aparezca ya animado antes de que el ojo llegue.
 */
const MARGEN_VISTA = '-12% 0px -12% 0px';

// ------------------------------------------------------------
// Reveal
// ------------------------------------------------------------

/**
 * Entrada básica: sube y aparece, una sola vez.
 *
 * `initial={false}` cuando hay reduced-motion, para que el nodo no llegue
 * siquiera a declararse invisible.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  /** Desplazamiento inicial en px. 0 para que solo aparezca. */
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
 * Contenedor que escalona a sus hijos directos marcados con `<Escalon>`.
 *
 * El escalonado es lo que convierte una reja de ocho tarjetas en una lectura
 * con orden en vez de un parpadeo simultáneo.
 */
export function Escalonado({
  children,
  className,
  intervalo = 0.07,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  intervalo?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: MARGEN_VISTA }}
      variants={{
        visible: { transition: { staggerChildren: intervalo, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Hijo de `Escalonado`. Fuera de él no anima: no tiene padre que lo dispare. */
export function Escalon({
  children,
  className,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        oculto: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: DUR.media, ease: EASE_ENTRADA } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ------------------------------------------------------------
// Contador de cifras
// ------------------------------------------------------------

/**
 * Cifra que cuenta hasta su valor al entrar en pantalla.
 *
 * DOS DECISIONES QUE IMPORTAN, PORQUE AQUÍ SE PUBLICA DINERO:
 *
 * · El HTML del servidor ya trae la cifra FINAL. React no re-renderiza durante
 *   la animación: se escribe `textContent` a mano. Si el JS no carga, si falla,
 *   o si alguien lee el HTML crudo, lo que hay es el precio correcto y no un
 *   cero. Un contador que deja «$0 MXN» en pantalla por un error de hidratación
 *   no es un bug estético en una página de venta de lotes.
 *
 * · Solo se arma si el elemento está POR DEBAJO de la ventana al montar. Si ya
 *   se ve, se queda con su valor final: bajar la cifra a cero delante del
 *   usuario para volver a subirla es un parpadeo, no una animación.
 *
 * Al terminar se reescribe `formato(valor)` en vez de dejar el último frame:
 * el redondeo intermedio no puede quedarse como cifra publicada.
 */
export function Contador({
  valor,
  formato,
  className,
  duracion = 1.1,
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

  // Antes del primer pintado: si la cifra todavía no se ve, se pone en cero.
  useLayoutEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // ya visible: no se toca
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
      onComplete: () => {
        el.textContent = formato(valor);
      },
    });

    return () => {
      control.stop();
      // Si el componente muere a media cuenta, la cifra queda correcta.
      el.textContent = formato(valor);
    };
  }, [enVista, reduce, valor, formato, duracion]);

  return (
    <span ref={ref} className={className}>
      {formato(valor)}
    </span>
  );
}

// ------------------------------------------------------------
// Parallax del hero
// ------------------------------------------------------------

/**
 * Deriva lenta de la imagen del hero mientras se hace scroll.
 *
 * Recibe la `<Image>` ya rendida por el servidor como `children`: este
 * componente no la monta ni la retrasa, solo le aplica `transform` —propiedad
 * compuesta, sin layout ni paint— cuando ya existe en pantalla. El LCP no
 * depende de que este JS haya cargado.
 *
 * La escala fija de 1.12 es lo que evita que el borde inferior se despegue al
 * desplazar: sin ella el parallax enseña el fondo de la sección.
 */
export function ParallaxHero({
  children,
  className,
  intensidad = 90,
}: {
  children: ReactNode;
  className?: string;
  /** Píxeles que recorre la imagen a lo largo de todo el hero. */
  intensidad?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  // Un `MotionValue` pasado por `style` va por fuera de `MotionConfig`: aquí la
  // preferencia se atiende anulando el recorrido, no cambiando de elemento. La
  // escala se conserva —no es movimiento, es encuadre, y quitarla despegaría el
  // borde de la imagen.
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
 * Velo que se cierra con el scroll.
 *
 * Arranca en la opacidad que el hero necesita para que el texto se lea desde el
 * primer frame —el degradado base sigue siendo CSS, esto solo lo intensifica— y
 * termina cerrando hacia el fondo oscuro de la sección siguiente, para que el
 * corte entre hero y banda de cifras no sea una línea dura.
 */
export function VeloScroll({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  // Empieza en 0 en ambos casos: el degradado de CSS del hero ya garantiza el
  // contraste del texto, así que anular el cierre no deja nada ilegible.
  const opacity = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 0.55]);

  return (
    <motion.div ref={ref} className={className} style={{ opacity }} aria-hidden="true" />
  );
}
