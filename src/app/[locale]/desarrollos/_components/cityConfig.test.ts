import { describe, it, expect } from 'vitest';
import { CITY_MAP, cityMatchFilter } from './cityConfig';

describe('cityMatchFilter', () => {
  it('combina las variantes en un OR de PostgREST', () => {
    expect(cityMatchFilter(['Cancún', 'Cancun'])).toBe('city.ilike.%Cancún%,city.ilike.%Cancun%');
  });

  it('una sola variante no lleva coma', () => {
    expect(cityMatchFilter(['Tulum'])).toBe('city.ilike.%Tulum%');
  });
});

describe('CITY_MAP', () => {
  // ILIKE es accent-SENSITIVE: '%Cancun%' NO matchea 'Cancún', y en prod la
  // columna solo guarda la forma acentuada. Una ciudad con acento en su nombre
  // que no liste esa forma exacta devuelve 0 resultados en silencio.
  it('toda ciudad con acento en el nombre incluye la variante acentuada', () => {
    const hasAccent = (s: string) => /[áéíóúÁÉÍÓÚñÑ]/.test(s);
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      if (!hasAccent(info.name)) continue;
      expect(info.matchTerms, `${slug} debe buscar por "${info.name}"`).toContain(info.name);
    }
  });

  it('ninguna ciudad queda sin términos de búsqueda', () => {
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      expect(info.matchTerms.length, slug).toBeGreaterThan(0);
    }
  });
});
