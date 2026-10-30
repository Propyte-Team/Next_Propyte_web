import { describe, expect, it } from 'vitest';
import type { PropiedadLanding } from '@/lib/supabase/lp-inventario';
import {
  filtrar,
  filtroCredito,
  filtroEntrega,
  filtroPlazo,
  filtroPresupuesto,
  filtroRecamaras,
  filtroUbicacion,
  filtros,
  textoLead,
} from './filtros';

function prop(sobre: Partial<PropiedadLanding> & { id: string }): PropiedadLanding {
  return {
    slug: sobre.id,
    titulo: `Propiedad ${sobre.id}`,
    tipo: 'Casa',
    ciudad: 'Mérida',
    estado: 'Yucatán',
    zona: 'Caucel',
    recamaras: 2,
    banos: 1,
    m2Construidos: 70,
    m2Terreno: 160,
    precio: { monto: 1_500_000, moneda: 'MXN' },
    precioM2Mxn: null,
    enganchePct: null,
    engancheMxn: null,
    mesesOpciones: [],
    estacionamientos: null,
    alberca: false,
    entrega: null,
    estadoComercial: 'disponible',
    vista: null,
    frenteAlMar: false,
    imagen: null,
    imagenes: [],
    creditos: { infonavit: false, fovissste: false, hipotecario: false, directo: false },
    ...sobre,
  };
}

const INVENTARIO: PropiedadLanding[] = [
  prop({ id: 'a', precio: { monto: 1_220_000, moneda: 'MXN' }, creditos: { infonavit: true, fovissste: true, hipotecario: false, directo: false } }),
  prop({ id: 'b', precio: { monto: 1_800_000, moneda: 'MXN' }, recamaras: 2, mesesOpciones: [12, 24] }),
  prop({ id: 'c', precio: { monto: 2_090_000, moneda: 'MXN' }, recamaras: 3, estadoComercial: 'entrega_inmediata', ciudad: 'Tulum', zona: 'Aldea Zamá' }),
  prop({ id: 'd', precio: { monto: 250_000, moneda: 'USD' }, recamaras: 5, estadoComercial: 'preventa', ciudad: 'Tulum', zona: null, mesesOpciones: [24, 36] }),
];

describe('filtros de inventario', () => {
  it('construye opciones solo con propiedades detrás y con conteo', () => {
    const u = filtroUbicacion(INVENTARIO, 'ciudad');
    expect(u?.opciones).toEqual([
      { valor: 'merida', etiqueta: 'Mérida', total: 2 },
      { valor: 'tulum', etiqueta: 'Tulum', total: 2 },
    ]);
    const r = filtroRecamaras(INVENTARIO);
    expect(r?.opciones.map((o) => `${o.valor}:${o.total}`)).toEqual(['2:2', '3:1', '4+:1']);
    expect(r?.opciones.find((o) => o.valor === '4+')?.etiqueta).toBe('4 o más');
  });

  it('presupuesto: rangos a partir de cortes, USD entra por tipo de cambio solo para ordenar', () => {
    const p = filtroPresupuesto(INVENTARIO, [1_500_000, 2_000_000]);
    expect(p?.opciones).toEqual([
      { valor: '-1500000', etiqueta: 'Hasta $1.5 M', total: 1 },
      { valor: '1500000-2000000', etiqueta: '$1.5 M a $2 M', total: 1 },
      { valor: '2000000-', etiqueta: 'Más de $2 M', total: 2 },
    ]);
  });

  it('un filtro con una sola opción no se publica, salvo el de crédito', () => {
    const soloMerida = INVENTARIO.filter((p) => p.ciudad === 'Mérida');
    expect(filtroUbicacion(soloMerida, 'ciudad')).toBeNull();
    expect(filtroCredito(INVENTARIO)?.opciones).toEqual([
      { valor: 'infonavit', etiqueta: 'Infonavit', total: 1 },
      { valor: 'fovissste', etiqueta: 'Fovissste', total: 1 },
    ]);
    expect(filtroCredito(INVENTARIO.slice(1))).toBeNull();
  });

  it('plazo y entrega salen de lo declarado', () => {
    expect(filtroPlazo(INVENTARIO)?.opciones.map((o) => o.etiqueta)).toEqual(['12 meses', '24 meses', '36 meses']);
    expect(filtroEntrega(INVENTARIO)?.opciones.map((o) => `${o.valor}:${o.total}`)).toEqual([
      'disponible:2',
      'preventa:1',
      'entrega_inmediata:1',
    ]);
  });

  it('filtrar aplica todos los activos a la vez', () => {
    const defs = filtros(filtroUbicacion(INVENTARIO, 'ciudad'), filtroRecamaras(INVENTARIO), filtroPlazo(INVENTARIO));
    expect(filtrar(INVENTARIO, {}, defs).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(filtrar(INVENTARIO, { ubicacion: 'tulum' }, defs).map((p) => p.id)).toEqual(['c', 'd']);
    expect(filtrar(INVENTARIO, { ubicacion: 'tulum', plazo: '24' }, defs).map((p) => p.id)).toEqual(['d']);
    expect(filtrar(INVENTARIO, { recamaras: '4+' }, defs).map((p) => p.id)).toEqual(['d']);
  });

  it('textoLead traduce la selección a lo que viaja en Zoho', () => {
    const defs = filtros(
      filtroUbicacion(INVENTARIO, 'ciudad'),
      filtroPresupuesto(INVENTARIO, [1_500_000, 2_000_000]),
      filtroRecamaras(INVENTARIO),
      filtroCredito(INVENTARIO),
    );
    expect(textoLead(defs, { ubicacion: 'merida', presupuesto: '-1500000', recamaras: '2', credito: 'infonavit' })).toEqual({
      location: 'Mérida',
      budget: 'Hasta $1.5 M',
      interestOption: '2 recámaras, Infonavit',
    });
    expect(textoLead(defs, {})).toEqual({ location: undefined, budget: undefined, interestOption: undefined });
  });
});
