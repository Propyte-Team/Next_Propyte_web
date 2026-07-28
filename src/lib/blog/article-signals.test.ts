import { describe, it, expect } from 'vitest';
import { hasMarketFigures, needsInvestmentDisclaimer } from './article-signals';

describe('hasMarketFigures', () => {
  it('detecta porcentajes sueltos y en rango', () => {
    expect(hasMarketFigures('<p>El yield ronda el 8% anual.</p>')).toBe(true);
    expect(hasMarketFigures('<p>Tasas de 9.5-12% según el banco.</p>')).toBe(true);
    expect(hasMarketFigures('<p>Ocupación del 60 % en temporada baja.</p>')).toBe(true);
  });

  it('detecta montos en MXN y USD', () => {
    expect(hasMarketFigures('<p>Desde $4.2M MXN.</p>')).toBe(true);
    expect(hasMarketFigures('<p>Renta de $25,000 MXN al mes.</p>')).toBe(true);
    expect(hasMarketFigures('<p>USD 300,000 de entrada.</p>')).toBe(true);
  });

  it('NO cuenta años ni conteos sin unidad', () => {
    expect(hasMarketFigures('<p>El mercado de Tulum en 2026 maduró.</p>')).toBe(false);
    expect(hasMarketFigures('<p>17 puntos de due diligence antes de firmar.</p>')).toBe(false);
    expect(hasMarketFigures('<p>Entre 2021 y 2026 cambió la oferta.</p>')).toBe(false);
  });

  it('NO lee números de atributos, URLs ni clases', () => {
    expect(hasMarketFigures('<img width="100" height="50" src="/a-100.webp">')).toBe(false);
    expect(hasMarketFigures('<div class="mt-8 w-1/2"><p>Sin cifras.</p></div>')).toBe(false);
    expect(hasMarketFigures('<a href="https://x.com/p?v=50%25">enlace</a>')).toBe(false);
  });

  it('tolera contenido vacío o ausente', () => {
    expect(hasMarketFigures(null)).toBe(false);
    expect(hasMarketFigures(undefined)).toBe(false);
    expect(hasMarketFigures('')).toBe(false);
  });

  it('el disclaimer sigue al mismo criterio', () => {
    expect(needsInvestmentDisclaimer('<p>Rendimiento estimado de 10% anual.</p>')).toBe(true);
    expect(needsInvestmentDisclaimer('<p>Cómo elegir notario en Quintana Roo.</p>')).toBe(false);
  });
});
