import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CATEGORIA_A_HUB, HUBS_RELACIONADOS, HUB_LABEL_KEY,
  hubDeCategoria, categoriasDeHub, hubHref,
} from './hub-relacionado';

/** Las 7 categorías publicadas en BD (locale es, status published) al 2026-07-28. */
const CATEGORIAS_EN_BD = [
  'Estilo de vida', 'Guías de compra', 'Inversión', 'Legal y fiscal',
  'Mercado', 'Para Asesores', 'Para Inversionistas',
];

afterEach(() => vi.restoreAllMocks());

describe('mapa de afinidad de superficie', () => {
  it('cubre TODAS las categorías que existen en BD', () => {
    const sinMapear = CATEGORIAS_EN_BD.filter((c) => !(c in CATEGORIA_A_HUB));
    expect(sinMapear).toEqual([]);
  });

  it('"Arquitectura y diseño" ya está mapeada aunque todavía no tenga artículos', () => {
    expect('Arquitectura y diseño' in CATEGORIA_A_HUB).toBe(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Arquitectura y diseño')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('cada hub declarado es una ruta válida', () => {
    for (const h of Object.values(CATEGORIA_A_HUB)) {
      if (h !== null) expect(HUBS_RELACIONADOS).toContain(h);
    }
  });

  it('todo hub tiene clave de etiqueta i18n', () => {
    for (const h of HUBS_RELACIONADOS) expect(HUB_LABEL_KEY[h]).toBeTruthy();
  });

  it('resuelve el mapa acordado', () => {
    expect(hubDeCategoria('Inversión')).toBe('como-invertir');
    expect(hubDeCategoria('Para Inversionistas')).toBe('como-invertir');
    expect(hubDeCategoria('Guías de compra')).toBe('como-comprar');
    expect(hubDeCategoria('Legal y fiscal')).toBe('como-comprar');
    expect(hubDeCategoria('Mercado')).toBe('mercado');
    expect(hubDeCategoria('Para Asesores')).toBe('brokers');
  });

  it('"Estilo de vida" no tiene hub y NO avisa (es deliberado)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Estilo de vida')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('una categoría nueva sin mapear avisa en vez de fallar en silencio', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(hubDeCategoria('Fiscalidad avanzada')).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('la vuelta agrupa las categorías de cada hub', () => {
    expect(categoriasDeHub('como-invertir').sort()).toEqual(['Inversión', 'Para Inversionistas']);
    expect(categoriasDeHub('como-comprar').sort()).toEqual(['Guías de compra', 'Legal y fiscal']);
    expect(categoriasDeHub('brokers')).toEqual(['Para Asesores']);
    // Sin categorías hoy: su módulo no debe ni consultar la BD.
    expect(categoriasDeHub('financiamiento')).toEqual([]);
    expect(categoriasDeHub('desarrolladores')).toEqual([]);
  });

  it('hubHref respeta el locale', () => {
    expect(hubHref('es', 'como-invertir')).toBe('/es/como-invertir');
    expect(hubHref('en', 'brokers')).toBe('/en/brokers');
  });
});
