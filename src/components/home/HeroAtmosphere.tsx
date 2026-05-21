'use client';

import { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Home } from '@/lib/icons';

// Multiplicador máximo en píxeles para cada capa de profundidad.
// La capa más "lejana" (orb1) se mueve menos para sugerir distancia.
// Mantener sutil pero perceptible — los orbs llevan blur 24px y necesitan
// desplazamiento mayor para que el movimiento se note.
const PARALLAX = {
  orb1: 18,
  orb2: 28,
  orb3: 42,
  watermark: 26,
  grid: 14,
} as const;

const SPRING = { stiffness: 70, damping: 22, mass: 0.5 } as const;

function useShift(axis: MotionValue<number>, max: number) {
  return useSpring(useTransform(axis, [-0.5, 0.5], [-max, max]), SPRING);
}

export default function HeroAtmosphere() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // [-0.5, 0.5] desde el centro de la sección. Se usa con useTransform por capa.
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const orb1X = useShift(x, PARALLAX.orb1);
  const orb1Y = useShift(y, PARALLAX.orb1);
  const orb2X = useShift(x, -PARALLAX.orb2);
  const orb2Y = useShift(y, -PARALLAX.orb2);
  const orb3X = useShift(x, PARALLAX.orb3);
  const orb3Y = useShift(y, PARALLAX.orb3);
  const wmX = useShift(x, -PARALLAX.watermark);
  const wmY = useShift(y, -PARALLAX.watermark);
  const gridX = useShift(x, -PARALLAX.grid);
  const gridY = useShift(y, -PARALLAX.grid);

  useEffect(() => {
    if (reducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    // El listener vive en la <section> padre, NO en `container`: este último
    // tiene `pointer-events-none` y nunca recibiría eventos. La sección sí
    // recibe pointermove sobre cualquier zona (incluso bubbling de los inputs).
    const section = container.parentElement;
    if (!section) return;

    // (hover: none) cubre touch devices — evita parallax al tocar.
    const canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover) return;

    let rect = section.getBoundingClientRect();
    let raf = 0;

    const updateRect = () => {
      rect = section.getBoundingClientRect();
    };

    const handlePointer = (e: PointerEvent) => {
      // Normaliza a [-0.5, 0.5] desde el centro de la sección.
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        x.set(Math.max(-0.5, Math.min(0.5, nx)));
        y.set(Math.max(-0.5, Math.min(0.5, ny)));
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        x.set(0);
        y.set(0);
      });
    };

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });
    section.addEventListener('pointermove', handlePointer);
    section.addEventListener('pointerleave', handleLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      section.removeEventListener('pointermove', handlePointer);
      section.removeEventListener('pointerleave', handleLeave);
    };
  }, [reducedMotion, x, y]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
    >
      {/* Grid blueprint con parallax — duplica el grid CSS pero animado. La
          intensidad es baja (white/3) para que se sienta como una "rejilla
          arquitectónica" detrás del contenido, no como wallpaper. */}
      <motion.div
        style={{ x: gridX, y: gridY }}
        className="absolute -inset-8 opacity-60 [mask-image:radial-gradient(ellipse_75%_75%_at_center,black_30%,transparent_100%)]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </motion.div>

      {/* Orb 1 — halo grande teal, esquina superior derecha. Capa "lejana". */}
      <motion.div
        style={{ x: orb1X, y: orb1Y }}
        className="absolute -top-32 -right-24 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(92,224,210,0.20),transparent_60%)] blur-2xl"
      />

      {/* Orb 2 — halo cyan brand inferior izquierda. Capa media. */}
      <motion.div
        style={{ x: orb2X, y: orb2Y }}
        className="absolute -bottom-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(162,249,255,0.14),transparent_65%)] blur-2xl"
      />

      {/* Orb 3 — punto cyan pequeño y nítido, derecha media. Capa "cercana"
          que reacciona más al mouse y da sensación de profundidad. */}
      <motion.div
        style={{ x: orb3X, y: orb3Y }}
        className="absolute top-[42%] right-[8%] h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(162,249,255,0.18),transparent_60%)] blur-xl"
      />

      {/* Watermark Home icon — detalle editorial como en /nosotros/quienes-somos. */}
      <motion.div
        style={{ x: wmX, y: wmY }}
        className="absolute -right-32 -bottom-40 hidden md:block"
      >
        <Home
          size={520}
          strokeWidth={0.5}
          className="text-white/[0.05] select-none"
        />
      </motion.div>

      {/* Coordinate marker — estático. Detalle arquitectónico/editorial. */}
      <div className="hidden md:flex absolute bottom-6 left-6 items-center gap-3 opacity-70">
        <span className="block h-px w-6 bg-[#A2F9FF]" />
        <span
          className="text-[10px] tracking-[0.18em] uppercase text-white/65"
          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' }}
        >
          20.62°N · 87.07°W
        </span>
      </div>
    </div>
  );
}
