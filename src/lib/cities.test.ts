import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CITY_MAP, CITY_SLUGS, cityMatchTerms, cityMatchFilter, cityMediaKey } from './cities';
import { SITE_MEDIA_SLOTS } from './site-media/slots';

describe('cityMatchTerms', () => {
  // ILIKE es accent-SENSITIVE: '%Cancun%' NO matchea 'Cancún'. Las variantes se
  // derivan del nombre para que una ciudad nueva con acento no nazca vacía.
  it('deriva la variante sin acento además de la exacta', () => {
    expect(cityMatchTerms('Cancún')).toEqual(['Cancún', 'Cancun']);
    expect(cityMatchTerms('Mérida')).toEqual(['Mérida', 'Merida']);
  });

  it('un nombre sin acentos produce un solo término', () => {
    expect(cityMatchTerms('Tulum')).toEqual(['Tulum']);
    expect(cityMatchTerms('Playa del Carmen')).toEqual(['Playa del Carmen']);
  });

  it('el filtro siempre incluye la forma exacta del nombre', () => {
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      expect(cityMatchFilter(info.name), slug).toContain(`city.ilike.%${info.name}%`);
    }
  });
});

describe('CITY_MAP — consistencia con el resto del sitio', () => {
  // Los tres guardias de abajo existen porque el slug estaba copiado en tres
  // listas a mano: CITY_MAP, SITE_MEDIA_SLOTS y el array del sitemap. Olvidar
  // una dejaba la ciudad a medias sin que nada fallara.
  it('cada ciudad tiene su slot de foto registrado', () => {
    const keys = new Set(SITE_MEDIA_SLOTS.map((s) => s.key));
    for (const slug of CITY_SLUGS) {
      expect(keys.has(cityMediaKey(slug)), `falta el slot ${cityMediaKey(slug)}`).toBe(true);
    }
  });

  it('no hay slots de ciudad huérfanos (sin entrada en CITY_MAP)', () => {
    const orphans = SITE_MEDIA_SLOTS
      .filter((s) => s.key.startsWith('city.'))
      .map((s) => s.key.slice('city.'.length))
      .filter((slug) => !CITY_SLUGS.includes(slug));
    expect(orphans).toEqual([]);
  });

  it('cada ciudad tiene su ruta en app/[locale]/desarrollos/{slug}/page.tsx', () => {
    for (const slug of CITY_SLUGS) {
      const route = join(process.cwd(), 'src', 'app', '[locale]', 'desarrollos', slug, 'page.tsx');
      expect(existsSync(route), `falta la ruta de ${slug}: ${route}`).toBe(true);
    }
  });

  it('cada ciudad trae nombre, estado y descripción en ambos idiomas', () => {
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      expect(info.name, slug).toBeTruthy();
      expect(info.state, slug).toBeTruthy();
      expect(info.descEs.length, slug).toBeGreaterThan(40);
      expect(info.descEn.length, slug).toBeGreaterThan(40);
    }
  });
});

describe('region del eyebrow', () => {
  // marketplace.heroEyebrow está fijo en "Riviera Maya"; decirlo en Mérida o
  // Telchac es falso. Cada ciudad declara su región.
  it('cada ciudad declara región', () => {
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      expect(info.region, slug).toBeTruthy();
    }
  });

  it('las ciudades de Yucatán no dicen Riviera Maya', () => {
    for (const [slug, info] of Object.entries(CITY_MAP)) {
      if (info.state === 'Yucatán') {
        expect(info.region, slug).not.toMatch(/Riviera/i);
      }
    }
  });
});
