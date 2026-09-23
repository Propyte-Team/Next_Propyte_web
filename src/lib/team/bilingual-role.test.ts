import { describe, it, expect } from 'vitest';
import { esCargoComercial } from './bilingual-role';

/**
 * Los valores de `role` de este archivo son los reales de
 * `real_estate_hub.v_team_members`, leídos el 2026-09-01. Si el Hub cambia el
 * formato de los cargos, estas pruebas son las que deben avisar.
 */
describe('esCargoComercial', () => {
  it('acepta los cargos comerciales tal como los guarda el Hub, en bilingüe', () => {
    // El bug: `.in('role', ['Gerente de Ventas', ...])` no empataba ninguno de
    // estos dos, porque comparaba contra la cadena completa.
    expect(esCargoComercial('Gerente de Ventas | Sales Manager')).toBe(true);
    expect(esCargoComercial('Asesor de Ventas | Sales Advisor')).toBe(true);
  });

  it('acepta el cargo que sí empataba antes, para no perderlo en el arreglo', () => {
    expect(esCargoComercial('Team Leader')).toBe(true);
  });

  it('rechaza a quien no atiende leads, aunque esté en la página de equipo', () => {
    expect(esCargoComercial('Coordinador de Marketing | Marketing Coordinator')).toBe(false);
    expect(esCargoComercial('Diseñadora Gráfica | Graphic Designer')).toBe(false);
    expect(esCargoComercial('Fotógrafo / Videógrafo | Photographer / Videographer')).toBe(false);
    expect(esCargoComercial('Software')).toBe(false);
    expect(esCargoComercial('Gestor Jurídico | Legal Administrator')).toBe(false);
    expect(esCargoComercial('Arquitecto / Postventa | Architect / After-Sales')).toBe(false);
  });

  it('rechaza al Director Comercial: dirige el área, no atiende el lead de una landing', () => {
    expect(esCargoComercial('Director Comercial | Commercial Director')).toBe(false);
  });

  it('sobrevive a que el cargo se capture en un solo idioma o al revés', () => {
    expect(esCargoComercial('Sales Manager')).toBe(true);
    expect(esCargoComercial('Sales Advisor | Asesor de Ventas')).toBe(true);
    expect(esCargoComercial('Team Leader | Líder de Equipo')).toBe(true);
  });

  it('ignora acentos, mayúsculas y espacios de más', () => {
    expect(esCargoComercial('  GERENTE  DE   VENTAS  ')).toBe(true);
    expect(esCargoComercial('Líder de Equipo')).toBe(true);
    expect(esCargoComercial('ASESOR')).toBe(true);
  });

  it('trata el cargo ausente como no comercial, sin reventar', () => {
    expect(esCargoComercial(null)).toBe(false);
    expect(esCargoComercial(undefined)).toBe(false);
    expect(esCargoComercial('')).toBe(false);
    expect(esCargoComercial('   ')).toBe(false);
    expect(esCargoComercial('|')).toBe(false);
  });

  it('no empata por coincidencia parcial: el cargo tiene que ser el cargo', () => {
    // Un `like 'Asesor%'` habría dado true en los tres. La igualdad por mitad
    // normalizada es lo que evita colar a quien no atiende.
    expect(esCargoComercial('Asesor Jurídico | Legal Advisor')).toBe(false);
    expect(esCargoComercial('Ex Asesor de Ventas')).toBe(false);
    expect(esCargoComercial('Asistente de Gerente de Ventas')).toBe(false);
  });
});
