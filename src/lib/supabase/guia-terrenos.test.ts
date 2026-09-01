import { describe, expect, it } from 'vitest';
import { agruparPorProyecto, type DatosDesarrollo } from './guia-terrenos';
import type { LoteComparable } from './lp-lotes-comparador';

function comparable(over: Partial<LoteComparable> & { id: string }): LoteComparable {
  return {
    etiqueta: 'x', ciudad: 'Tulum', superficieM2: 100, precioListaMxn: 1_000_000,
    esDeEstaLanding: false, fuente: 'ext_planos', plazos: [], contado: null,
    apartadoMxn: null, motivoSinPlan: null, developmentId: null,
    ...over,
  } as LoteComparable;
}

const DESARROLLOS: Record<string, DatosDesarrollo> = {
  tulum: {
    id: 'tulum', slug: 'lotes-residenciales-en-la-region-11-de-tulum',
    tituloEditorial: 'Lotes residenciales en la Región 11 de Tulum',
    ciudad: 'Tulum', zona: 'Región 11', amenidades: [], imagenes: ['/a.webp'],
    totalUnidades: 221, entregaTexto: 'Entrega y escrituración inmediata',
  },
  pdc: {
    id: 'pdc', slug: 'lotes-residenciales-en-playa-del-carmen-2',
    tituloEditorial: 'Lotes residenciales en Playa del Carmen',
    ciudad: 'Playa del Carmen', zona: null, amenidades: [], imagenes: [],
    totalUnidades: 40, entregaTexto: null,
  },
};

describe('agruparPorProyecto', () => {
  it('colapsa las 5 unidades de Tulum en un solo proyecto', () => {
    const unidades = [123, 160, 166, 173.97, 276.6].map((m2, i) =>
      comparable({ id: `u${i}`, developmentId: 'tulum', superficieM2: m2, precioListaMxn: 299_000 + i * 1000 }),
    );
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos).toHaveLength(1);
    expect(proyectos[0].slug).toBe('lotes-residenciales-en-la-region-11-de-tulum');
  });

  it('la fila representa el lote MAS BARATO, que es el "desde" de la guia', () => {
    const unidades = [
      comparable({ id: 'caro', developmentId: 'tulum', precioListaMxn: 720_448.96, superficieM2: 276.6 }),
      comparable({ id: 'barato', developmentId: 'tulum', precioListaMxn: 299_000, superficieM2: 123 }),
    ];
    const [p] = agruparPorProyecto(unidades, DESARROLLOS);
    expect(p.precioDesdeMxn).toBe(299_000);
    expect(p.superficieDesdeM2).toBe(123);
  });

  it('NO calcula precio por m2 cuando la superficie viene en 0', () => {
    // `lotes-residenciales-en-playa-del-carmen-2` publica area_m2 = "0.00".
    // Dividir entre eso da Infinity, y una tabla comparativa con "$Infinity/m2"
    // es peor que una celda vacía.
    const [p] = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum', superficieM2: 0, precioListaMxn: 1_720_094 })],
      DESARROLLOS,
    );
    expect(p.precioPorM2Mxn).toBeNull();
  });

  it('ordena los proyectos por precio desde ascendente', () => {
    // El desarrollo MAS CARO se agrega primero al Map interno (aparece primero
    // en `unidades`): sin el `.sort()` final, el orden de salida seria el de
    // insercion (caro, barato) en vez del que promete la guia (barato, caro).
    const unidades = [
      comparable({ id: 'caro', developmentId: 'tulum', precioListaMxn: 720_448.96 }),
      comparable({ id: 'barato', developmentId: 'pdc', precioListaMxn: 299_000 }),
    ];
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos.map((p) => p.id)).toEqual(['pdc', 'tulum']);
  });

  it('descarta el proyecto cuyo desarrollo no trae titulo editorial', () => {
    // Sin `publication_title` el unico nombre disponible seria el interno, y ese
    // no sale en publico jamas. Antes que filtrarlo, el proyecto no aparece.
    const sinTitulo = { ...DESARROLLOS.tulum, tituloEditorial: '' };
    const proyectos = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum' })],
      { tulum: sinTitulo },
    );
    expect(proyectos).toHaveLength(0);
  });
});
