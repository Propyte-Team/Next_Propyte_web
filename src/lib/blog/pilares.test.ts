import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CATEGORIA_A_PILAR, PILARES, PILAR_LABEL_KEY,
  pilarDeCategoria, categoriasDePilar, pilarHref,
} from './pilares';

/** Las 7 categorías publicadas en BD (locale es, status published) al 2026-07-28. */
const CATEGORIAS_EN_BD = [
  'Estilo de vida', 'Guías de compra', 'Inversión', 'Legal y fiscal',
  'Mercado', 'Para Asesores', 'Para Inversionistas',
];

afterEach(() => vi.restoreAllMocks());

describe('mapa de pilares', () => {
  it('cubre TODAS las categorías que existen en BD', () => {
    const sinMapear = CATEGORIAS_EN_BD.filter((c) => !(c in CATEGORIA_A_PILAR));
    expect(sinMapear).toEqual([]);
  });

  it('"Arquitectura y diseño" ya está mapeada aunque todavía no tenga artículos', () => {
    // Creada 2026-07-29 para el contenido de Pablo Toral. Sin pilar por decisión,
    // igual que "Estilo de vida": es contenido editorial, no etapa del embudo.
    expect('Arquitectura y diseño' in CATEGORIA_A_PILAR).toBe(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pilarDeCategoria('Arquitectura y diseño')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('cada pilar declarado es una ruta válida', () => {
    for (const p of Object.values(CATEGORIA_A_PILAR)) {
      if (p !== null) expect(PILARES).toContain(p);
    }
  });

  it('todo pilar tiene clave de etiqueta i18n', () => {
    for (const p of PILARES) expect(PILAR_LABEL_KEY[p]).toBeTruthy();
  });

  it('resuelve el mapa acordado', () => {
    expect(pilarDeCategoria('Inversión')).toBe('como-invertir');
    expect(pilarDeCategoria('Para Inversionistas')).toBe('como-invertir');
    expect(pilarDeCategoria('Guías de compra')).toBe('como-comprar');
    expect(pilarDeCategoria('Legal y fiscal')).toBe('como-comprar');
    expect(pilarDeCategoria('Mercado')).toBe('mercado');
    expect(pilarDeCategoria('Para Asesores')).toBe('brokers');
  });

  it('"Estilo de vida" no tiene pilar y NO avisa (es deliberado)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pilarDeCategoria('Estilo de vida')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('una categoría nueva sin mapear avisa en vez de fallar en silencio', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pilarDeCategoria('Fiscalidad avanzada')).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('la vuelta agrupa las categorías de cada pilar', () => {
    expect(categoriasDePilar('como-invertir').sort()).toEqual(['Inversión', 'Para Inversionistas']);
    expect(categoriasDePilar('como-comprar').sort()).toEqual(['Guías de compra', 'Legal y fiscal']);
    expect(categoriasDePilar('brokers')).toEqual(['Para Asesores']);
    // Sin categorías hoy: su módulo no debe ni consultar la BD.
    expect(categoriasDePilar('financiamiento')).toEqual([]);
    expect(categoriasDePilar('desarrolladores')).toEqual([]);
  });

  it('pilarHref respeta el locale', () => {
    expect(pilarHref('es', 'como-invertir')).toBe('/es/como-invertir');
    expect(pilarHref('en', 'brokers')).toBe('/en/brokers');
  });
});
