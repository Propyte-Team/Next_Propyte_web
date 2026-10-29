'use client';

// Punto único de registro de GSAP para el rediseño v3. Importar SIEMPRE desde
// aquí (no de 'gsap' directo) para que los plugins queden registrados una vez.
// Desde GSAP 3.13 todos los plugins (SplitText, Draggable, Inertia,
// ScrollTrigger) son gratuitos, también para uso comercial.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin, useGSAP);
}

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const MOTION_REDUCE = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(MOTION_REDUCE).matches;
}

export { gsap, ScrollTrigger, SplitText, Draggable, InertiaPlugin, useGSAP };
