/**
 * Iconos de marca — vendorizados desde lucide-react 0.577.0 (ISC).
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * lucide-react v1 eliminó los iconos de marca del paquete (Facebook, Instagram,
 * Linkedin, Twitter, Youtube). Sin esto, subir a v1 rompe el build: el Footer
 * los usa en el pie de TODAS las páginas y ShareDownloadModal en los botones de
 * compartir.
 *
 * Los `iconNode` de abajo son copia literal de lucide-react 0.577.0, así que el
 * render es idéntico pixel a pixel a lo que ya está en producción. Se construyen
 * con el `createLucideIcon` del propio paquete, de modo que aceptan exactamente
 * las mismas props (`size`, `color`, `strokeWidth`, `className`, ref…) y siguen
 * pasando por `withDefaultStroke` en `@/lib/icons` sin ningún caso especial.
 *
 * Los 5 se mantienen aunque hoy solo 3 estén en uso: son un set coherente y
 * volver a añadir LinkedIn o YouTube no debería volver a chocar contra v1.
 *
 * Consumir desde `@/lib/icons`, no desde aquí.
 *
 * lucide-react — ISC License, Copyright (c) for portions of Lucide are held by
 * Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for
 * Lucide are held by Lucide Contributors 2022.
 */
import { createLucideIcon, type IconNode } from 'lucide-react';

const facebookNode: IconNode = [
  ['path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', key: '1jg4f8' }],
];

const instagramNode: IconNode = [
  ['rect', { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5', key: '2e1cvw' }],
  ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', key: '9exkf1' }],
  ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5', key: 'r4j83e' }],
];

const linkedinNode: IconNode = [
  ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z', key: 'c2jq9f' }],
  ['rect', { width: '4', height: '12', x: '2', y: '9', key: 'mk3on5' }],
  ['circle', { cx: '4', cy: '4', r: '2', key: 'bt5ra8' }],
];

const twitterNode: IconNode = [
  ['path', { d: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z', key: 'pff0z6' }],
];

const youtubeNode: IconNode = [
  ['path', { d: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17', key: '1q2vi4' }],
  ['path', { d: 'm10 15 5-3-5-3z', key: '1jp15x' }],
];

export const Facebook = createLucideIcon('facebook', facebookNode);
export const Instagram = createLucideIcon('instagram', instagramNode);
export const Linkedin = createLucideIcon('linkedin', linkedinNode);
export const Twitter = createLucideIcon('twitter', twitterNode);
export const Youtube = createLucideIcon('youtube', youtubeNode);
