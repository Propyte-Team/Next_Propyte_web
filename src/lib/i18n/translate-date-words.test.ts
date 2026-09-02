import { describe, expect, it } from 'vitest';
import { translateDateWords } from './translate-date-words';

// Los valores REALES de `delivery_text` en el inventario publicado, tomados de
// `v_developments` el 2026-09-01. Reales y no inventados porque el problema de
// este helper es exactamente lo que la gente escribe a mano en el Hub, no lo
// que uno se acuerda de imaginar.
describe('translateDateWords', () => {
  it('no toca el texto en español', () => {
    expect(translateDateWords('Entrega Inmediata', 'es')).toBe('Entrega Inmediata');
    expect(translateDateWords('Otoño 2026', 'es')).toBe('Otoño 2026');
  });

  it('traduce el vocabulario de fecha palabra por palabra', () => {
    expect(translateDateWords('Otoño 2026', 'en')).toBe('Fall 2026');
    expect(translateDateWords('Invierno 2027', 'en')).toBe('Winter 2027');
    expect(translateDateWords('Marzo 2025', 'en')).toBe('March 2025');
  });

  // Las tres frases que el reemplazo palabra por palabra no puede resolver:
  // el inglés las reordena. «Entrega y escrituración inmediata» saldría como
  // «Delivery and title-transfer immediate».
  it('traduce las frases de entrega inmediata como frase, no palabra a palabra', () => {
    expect(translateDateWords('Entrega y escrituración inmediata', 'en'))
      .toBe('Immediate delivery and title transfer');
    expect(translateDateWords('Entrega Inmediata', 'en')).toBe('Immediate delivery');
    expect(translateDateWords('Inmediata', 'en')).toBe('Immediate');
  });

  it('la frase se reconoce sin importar acentos, mayúsculas ni espacios de sobra', () => {
    expect(translateDateWords('  ENTREGA   INMEDIATA  ', 'en')).toBe('Immediate delivery');
    expect(translateDateWords('entrega y escrituracion inmediata', 'en'))
      .toBe('Immediate delivery and title transfer');
  });

  // Guarda contra el falso positivo: una frase que EMPIEZA igual pero dice otra
  // cosa no debe colapsar a la traducción corta. Este valor está publicado hoy.
  it('no colapsa una frase larga que solo empieza igual', () => {
    const largo = 'Entrega inmediata o a 9 meses según la villa';
    expect(translateDateWords(largo, 'en')).not.toBe('Immediate delivery');
    expect(translateDateWords(largo, 'en')).toContain('9');
  });

  it('deja intacto lo que no sabe traducir', () => {
    expect(translateDateWords('2030', 'en')).toBe('2030');
    // Con el typo que trae el dato real ("novirmbre"), la palabra no matchea y
    // se queda como está. Es el comportamiento correcto: inventar la corrección
    // sería peor que no traducir.
    expect(translateDateWords('Primera quincena de novirmbre', 'en'))
      .toContain('novirmbre');
  });
});
