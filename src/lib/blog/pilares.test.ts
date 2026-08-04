import { describe, it, expect } from 'vitest';
import {
  PILARES, PILAR_CODES, AUDIENCIAS,
  pilarPorCodigo, pilarPorSlug, esAudiencia, esPilarCode, pilarHubHref,
} from './pilares';
import es from '../../i18n/messages/es.json';
import en from '../../i18n/messages/en.json';

describe('catálogo canónico de pilares', () => {
  it('tiene los siete pilares del maestro', () => {
    expect(PILARES).toHaveLength(7);
    expect(PILARES.map((p) => p.code)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']);
  });

  it('códigos y slugs son únicos', () => {
    expect(new Set(PILARES.map((p) => p.code)).size).toBe(7);
    expect(new Set(PILARES.map((p) => p.slug)).size).toBe(7);
  });

  it('PILAR_CODES cubre exactamente los códigos del catálogo', () => {
    expect([...PILAR_CODES].sort()).toEqual(PILARES.map((p) => p.code).sort());
  });

  it('resuelve por código y por slug, y da null a lo desconocido', () => {
    expect(pilarPorCodigo('P1')?.slug).toBe('fiscal-legal');
    expect(pilarPorSlug('fiscal-legal')?.code).toBe('P1');
    expect(pilarPorCodigo('P9')).toBeNull();
    expect(pilarPorSlug('inventado')).toBeNull();
    // El slug NO es el código: pasar uno donde va el otro no debe colar.
    expect(pilarPorSlug('P1')).toBeNull();
    expect(pilarPorCodigo('fiscal-legal')).toBeNull();
  });

  it('el roundtrip código↔slug cierra para los siete', () => {
    for (const p of PILARES) {
      expect(pilarPorSlug(p.slug)?.code).toBe(p.code);
      expect(pilarPorCodigo(p.code)?.slug).toBe(p.slug);
    }
  });

  it('P7 tiene dos hubs (asesores y desarrolladores); el resto uno', () => {
    for (const p of PILARES) {
      expect(p.hubs.length).toBe(p.code === 'P7' ? 2 : 1);
    }
    expect(pilarPorCodigo('P7')?.hubs).toEqual(['/brokers', '/desarrolladores']);
  });

  it('los hubs son rutas relativas sin prefijo de locale', () => {
    for (const p of PILARES) {
      for (const h of p.hubs) {
        expect(h.startsWith('/')).toBe(true);
        expect(h).not.toMatch(/^\/(es|en)\//);
      }
    }
  });

  it('los dos hubs que este trabajo construye están declarados', () => {
    expect(pilarPorCodigo('P1')?.hubs).toEqual(['/guias/fiscal-legal']);
    expect(pilarPorCodigo('P6')?.hubs).toEqual(['/guias/costa']);
  });

  it('toda audiencia del catálogo está en AUDIENCIAS', () => {
    for (const p of PILARES) expect(AUDIENCIAS).toContain(p.audiencia);
  });

  it('el reparto de audiencia es el acordado: solo P7 es de asesores', () => {
    const asesores = PILARES.filter((p) => p.audiencia === 'asesores').map((p) => p.code);
    expect(asesores).toEqual(['P7']);
  });

  it('los guards discriminan', () => {
    expect(esAudiencia('asesores')).toBe(true);
    expect(esAudiencia('Asesores')).toBe(false);
    expect(esAudiencia('')).toBe(false);
    expect(esPilarCode('P1')).toBe(true);
    expect(esPilarCode('P8')).toBe(false);
  });

  it('pilarHubHref prefija el locale al hub primario', () => {
    expect(pilarHubHref('es', pilarPorCodigo('P1')!)).toBe('/es/guias/fiscal-legal');
    expect(pilarHubHref('en', pilarPorCodigo('P6')!)).toBe('/en/guias/costa');
    expect(pilarHubHref('es', pilarPorCodigo('P7')!)).toBe('/es/brokers');
  });

  it('todo pilar tiene label en español Y en inglés', () => {
    // Hay 2 posts publicados en `en`: un catálogo con labels solo en español
    // haría que el filtro de /en/blog saliera en español.
    for (const p of PILARES) {
      expect((es.pilares as Record<string, string>)[p.code]).toBeTruthy();
      expect((en.pilares as Record<string, string>)[p.code]).toBeTruthy();
    }
  });

  it('toda audiencia tiene label en español Y en inglés', () => {
    for (const a of AUDIENCIAS) {
      expect((es.audiencias as Record<string, string>)[a]).toBeTruthy();
      expect((en.audiencias as Record<string, string>)[a]).toBeTruthy();
    }
  });
});
