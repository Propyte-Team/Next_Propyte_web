import { describe, expect, it } from 'vitest';
import { agruparPorProyecto, type DatosDesarrollo } from './guia-terrenos';
import type { LoteComparable, PlazoOpcion } from './lp-lotes-comparador';

function comparable(over: Partial<LoteComparable> & { id: string }): LoteComparable {
  return {
    etiqueta: 'x', ciudad: 'Tulum', superficieM2: 100, precioListaMxn: 1_000_000,
    esDeEstaLanding: false, fuente: 'ext_planos', plazos: [], contado: null,
    apartadoMxn: null, motivoSinPlan: null, developmentId: null,
    ...over,
  };
}

function plazo(over: Partial<PlazoOpcion> & { meses: number; precioMxn: number }): PlazoOpcion {
  return {
    pagos: over.meses, descuentoPct: 0, engancheMxn: 0, mensualidadMxn: 0,
    contraentregaMxn: 0, contraentregaVia: null,
    ...over,
  };
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
    // Una unidad sin desarrollo (huérfana, o de un lote no publicado) no debe
    // colarse en ningún proyecto ni reventar el agrupado.
    unidades.push(comparable({ id: 'huerfana', developmentId: null }));
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos).toHaveLength(1);
    expect(proyectos[0].slug).toBe('lotes-residenciales-en-la-region-11-de-tulum');
  });

  it('la fila representa el lote MAS BARATO (por precio de lista), que es el "desde" de la guia', () => {
    // Ninguno de los dos lotes declara plazos ni contado, así que el "desde"
    // cae al último recurso: `precioListaMxn` de la unidad representativa
    // (Task 4b: `precioDesdeMxn` ya NO es siempre `precioListaMxn` — solo lo
    // es cuando no hay un plazo ni un contado más baratos, `base === 'lista'`).
    const unidades = [
      comparable({ id: 'caro', developmentId: 'tulum', precioListaMxn: 720_448.96, superficieM2: 276.6 }),
      comparable({ id: 'barato', developmentId: 'tulum', precioListaMxn: 299_000, superficieM2: 123 }),
    ];
    const [p] = agruparPorProyecto(unidades, DESARROLLOS);
    expect(p.precioDesdeMxn).toBe(299_000);
    expect(p.precioListaMxn).toBe(299_000);
    expect(p.precioDesdeBase).toBe('lista');
    expect(p.precioDesdeMeses).toBeNull();
    expect(p.superficieDesdeM2).toBe(123);
    // 299000 / 123 = 2430.89 → redondeado a 2431. Es la columna que da sentido
    // a una tabla comparativa: no basta con que el precio y la superficie
    // vengan del lote correcto, el cociente tiene que ser el correcto también.
    expect(p.precioPorM2Mxn).toBe(2431);
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
    // Publicar "0 m²" en la tabla es tan falso como "$Infinity/m2": la
    // superficie inutilizable tampoco se publica como cifra "desde".
    expect(p.superficieDesdeM2).toBeNull();
  });

  it('NO calcula precio por m2 ni superficie desde cuando la superficie viene null', () => {
    // El tipo lo permite (`superficieM2: number | null`) y la vista lo
    // produce cuando ni `area_m2` ni la superficie base tienen dato.
    const [p] = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum', superficieM2: null, precioListaMxn: 1_720_094 })],
      DESARROLLOS,
    );
    expect(p.superficieDesdeM2).toBeNull();
    expect(p.precioPorM2Mxn).toBeNull();
  });

  it('ignora la unidad cuyo desarrollo no viene en el mapa', () => {
    // En la Task 4, `unidades` sale de `getLotesComparables(CIUDADES_GUIA)`
    // (todas las publicadas de PdC y Tulum) y `desarrollos` de otra consulta
    // que ya filtra por título editorial: un desarrollo ausente del mapa va a
    // ser la norma, no la excepción. Sin el guard `!dev` esto lanza
    // TypeError al leer `dev.tituloEditorial` y se cae la guía entera.
    const proyectos = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'fantasma' })],
      DESARROLLOS,
    );
    expect(proyectos).toEqual([]);
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

  it('descarta el proyecto cuyo desarrollo no trae slug', () => {
    // Con título editorial pero sin slug el enlace a la ficha sale roto.
    // Mismo criterio que ya aplica a `tituloEditorial`: antes que publicar un
    // enlace muerto, el proyecto no aparece.
    const sinSlug = { ...DESARROLLOS.tulum, slug: '' };
    const proyectos = agruparPorProyecto(
      [comparable({ id: 'z', developmentId: 'tulum' })],
      { tulum: sinSlug },
    );
    expect(proyectos).toHaveLength(0);
  });

  it('ordena los proyectos por precio desde ascendente', () => {
    // El desarrollo MAS CARO se agrega primero al Map interno (aparece primero
    // en `unidades`): sin el `.sort()` final, el orden de salida seria el de
    // insercion (caro, barato) en vez del que promete la guia (barato, caro).
    // Sin plazos ni contado, `precioDesdeMxn` cae a `precioListaMxn` (`base ===
    // 'lista'`), así que el orden esperado no cambia con la Task 4b.
    const unidades = [
      comparable({ id: 'caro', developmentId: 'tulum', precioListaMxn: 720_448.96 }),
      comparable({ id: 'barato', developmentId: 'pdc', precioListaMxn: 299_000 }),
    ];
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos.map((p) => p.id)).toEqual(['pdc', 'tulum']);
  });

  it('desempata por slug cuando dos proyectos comparten precioDesdeMxn', () => {
    // PostgREST no garantiza orden de filas sin `.order()`, así que el orden
    // de inserción del Map no es fiable: 'pdc' entra primero aquí, pero su
    // slug ('...playa-del-carmen-2') ordena DESPUÉS que el de 'tulum'
    // ('...la-region-11-de-tulum'). Sin el desempate, un `sort` estable
    // dejaría ['pdc', 'tulum'] (el orden de inserción) y la tabla se
    // reordenaría sola entre revalidaciones cada vez que PostgREST devolviera
    // las filas en otro orden.
    const unidades = [
      comparable({ id: 'u-pdc', developmentId: 'pdc', precioListaMxn: 500_000 }),
      comparable({ id: 'u-tulum', developmentId: 'tulum', precioListaMxn: 500_000 }),
    ];
    const proyectos = agruparPorProyecto(unidades, DESARROLLOS);
    expect(proyectos.map((p) => p.id)).toEqual(['tulum', 'pdc']);
  });

  // ============================================================
  // Task 4b — el "desde" es el precio MÁS BAJO alcanzable, no `precioListaMxn`.
  //
  // Caso real: el lote de Arrecifes. `precioListaMxn` es el precio del plazo
  // de 48 meses SIN descuento (el más caro); el plazo de 12 meses trae 21.4%
  // de descuento. La ficha del mismo lote en propyte.com publica el precio de
  // 12 meses, no el de 48. Publicar `precioListaMxn` como "desde" habría
  // puesto $10,303/m² en la guía cuando la ficha (y la guía comercial en la
  // que se basa esta página) publican $8,095/m².
  // ============================================================

  const ARRECIFES_PLAZO_12 = plazo({ meses: 12, precioMxn: 1_457_121.6, descuentoPct: 21.4 });
  const ARRECIFES_PLAZO_48 = plazo({
    meses: 48, precioMxn: 1_854_518, mensualidadMxn: 15_454.32,
  });

  it('Arrecifes: precioDesdeMxn es el precio del plazo de 12 meses, NO precioListaMxn', () => {
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeMxn).toBe(1_457_121.6);
    expect(p.precioDesdeMxn).not.toBe(1_854_518);
  });

  it('Arrecifes: precioPorM2Mxn es 8095 (la cifra de la guía comercial), NO 10303', () => {
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
        }),
      ],
      DESARROLLOS,
    );
    // 1,457,121.6 / 180 = 8,095.12 → redondeado a 8,095. Control externo: es
    // el $/m² que publica la guía comercial en la que se basa esta página.
    // 1,854,518 / 180 = 10,302.87 → redondeado a 10,303, que es lo que se
    // publicaba ANTES de esta enmienda y es 27% más caro que la ficha real.
    expect(p.precioPorM2Mxn).toBe(8095);
    expect(p.precioPorM2Mxn).not.toBe(10303);
  });

  it('Arrecifes: precioDesdeBase es "plazo" y precioDesdeMeses es 12', () => {
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeBase).toBe('plazo');
    expect(p.precioDesdeMeses).toBe(12);
  });

  it('Arrecifes: la mensualidad es la del plazo de 48 meses, con SU PROPIO precio (no precioDesdeMxn)', () => {
    // Este es el test que impide publicar "la cifra falsa más fácil de
    // publicar en toda la página": calcular la mensualidad de 48 meses sobre
    // el precio de 12. `mensualidad.precioMxn` tiene que ser el precio DE ESE
    // PLAZO (1,854,518), no `precioDesdeMxn` (1,457,121.6, el de 12 meses).
    // Si algún día `mensualidad.precioMxn` colapsara a `precioDesdeMxn`, la
    // mensualidad de $15,454.32 se leería como si comprara a $1,457,121.6 —
    // una unidad que en realidad cuesta 27% más a ese plazo.
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
        }),
      ],
      DESARROLLOS,
    );
    expect(p.mensualidad).not.toBeNull();
    expect(p.mensualidad?.meses).toBe(48);
    expect(p.mensualidad?.mensualidadMxn).toBe(15_454.32);
    expect(p.mensualidad?.precioMxn).toBe(1_854_518);
    expect(p.mensualidad?.precioMxn).not.toBe(p.precioDesdeMxn);
  });

  it('un proyecto sin plazos y solo con contado toma el precio de contado como "desde"', () => {
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'solo-contado', developmentId: 'tulum', precioListaMxn: 1_000_000,
          plazos: [],
          contado: { descuentoPct: 15, precioMxn: 850_000, enganchePct: 100, contraentregaPct: 0 },
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeMxn).toBe(850_000);
    expect(p.precioDesdeBase).toBe('contado');
    expect(p.precioDesdeMeses).toBeNull();
    // Sin plazos no hay plazo más largo que rotular: no hay mensualidad que publicar.
    expect(p.mensualidad).toBeNull();
  });

  it('un proyecto sin plazos ni contado cae a precioListaMxn', () => {
    const [p] = agruparPorProyecto(
      [comparable({ id: 'sin-nada', developmentId: 'tulum', precioListaMxn: 1_000_000, plazos: [], contado: null })],
      DESARROLLOS,
    );
    expect(p.precioDesdeMxn).toBe(1_000_000);
    expect(p.precioDesdeBase).toBe('lista');
    expect(p.precioDesdeMeses).toBeNull();
    expect(p.mensualidad).toBeNull();
  });

  it('desempate: si el precio de contado iguala al de un plazo, gana "contado"', () => {
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'empate', developmentId: 'tulum', precioListaMxn: 1_000_000,
          plazos: [plazo({ meses: 12, precioMxn: 850_000 })],
          contado: { descuentoPct: 15, precioMxn: 850_000, enganchePct: 100, contraentregaPct: 0 },
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeMxn).toBe(850_000);
    expect(p.precioDesdeBase).toBe('contado');
    expect(p.precioDesdeMeses).toBeNull();
  });

  // ============================================================
  // Ronda de revisión — 4 mutantes que sobrevivieron a la Task 4b, más el
  // campo `contado` que faltaba en `ProyectoGuia`.
  // ============================================================

  it('Arrecifes: precioListaMxn se CONSERVA y es distinto de precioDesdeMxn (S4)', () => {
    // El mutante `precioListaMxn: desde.precioMxn` pasaba los 8 tests de la
    // Task 4b sin que ninguno lo notara: el único que compara ambos campos
    // entre sí es Tulum, donde por construcción lista === desde (299,000).
    // Aquí, con Arrecifes, los dos números tienen que venir DISTINTOS: el
    // campo existe justo para poder rotular esa diferencia en la UI.
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioListaMxn).toBe(1_854_518);
    expect(p.precioListaMxn).not.toBe(p.precioDesdeMxn);
  });

  it('Arrecifes: un contado MAS CARO que el plazo de 12 meses NO gana el "desde" (S2)', () => {
    // El mutante "contado gana siempre" (compara la BASE antes que el precio,
    // así que cualquier `contado` presente se queda con el "desde" sin
    // importar cuánto cueste) sobrevivía porque ningún fixture con `contado`
    // tenía a la vez un plazo más barato. `leerContado` produce exactamente
    // esta forma cuando `descuento_pct` es nulo: precio de contado == precio
    // de lista, sin descuento — y aquí SÍ hay un plazo (12 meses) más barato.
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'arrecifes', developmentId: 'tulum', superficieM2: 180,
          precioListaMxn: 1_854_518,
          plazos: [ARRECIFES_PLAZO_12, ARRECIFES_PLAZO_48],
          contado: { descuentoPct: 0, precioMxn: 1_854_518, enganchePct: 100, contraentregaPct: 0 },
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeBase).toBe('plazo');
    expect(p.precioDesdeMxn).toBe(1_457_121.6);
  });

  it('empate a tres bandas (lista = plazo 48 = plazo 60): gana "plazo" y el de MENOS meses (S1 y S3)', () => {
    // Caso real: terrenos-residenciales-en-amenidades-playa-del-carmen. Sin
    // descuento en ningún plazo, los tres candidatos (lista, plazo de 48,
    // plazo de 60) empatan al mismo precio. Qué se publica depende ENTERAMENTE
    // del desempate, y nada lo cubría:
    //   S3 — "lista gana a plazo" sobrevivía: nada distinguía `base:'lista'`
    //        de `base:'plazo'` cuando el precio es idéntico.
    //   S1 — "entre plazos empatados gana el de MÁS meses" sobrevivía: nada
    //        forzaba el plazo de MENOS meses cuando dos plazos empatan.
    const plazo48 = plazo({ meses: 48, precioMxn: 1_010_880 });
    const plazo60 = plazo({ meses: 60, precioMxn: 1_010_880, mensualidadMxn: 10_280.14 });
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'amenidades-pdc', developmentId: 'tulum', superficieM2: 129.6,
          precioListaMxn: 1_010_880,
          plazos: [plazo48, plazo60],
        }),
      ],
      DESARROLLOS,
    );
    expect(p.precioDesdeBase).toBe('plazo'); // mata S3
    expect(p.precioDesdeMeses).toBe(48); // mata S1
  });

  it('propaga `contado` con sus condiciones reales (90% al firmar, 10% contra entrega)', () => {
    // Caso real: lotes-residenciales-y-comerciales-en-playa-del-carmen, el
    // proyecto con el MAYOR descuento (-20%) y la PEOR cobertura: tiene un
    // solo plazo, así que `motivoSinPlan` sale `null` (solo se rellena cuando
    // `plazos` está vacío) y sin este campo la guía publicaría "desde
    // $1,279,872 de contado" sin decir cuánto hay que poner al firmar.
    const [p] = agruparPorProyecto(
      [
        comparable({
          id: 'comerciales-pdc', developmentId: 'tulum', precioListaMxn: 1_599_840,
          plazos: [plazo({ meses: 36, precioMxn: 1_599_840, mensualidadMxn: 26_664 })],
          contado: { descuentoPct: 20, precioMxn: 1_279_872, enganchePct: 90, contraentregaPct: 10 },
        }),
      ],
      DESARROLLOS,
    );
    expect(p.contado).not.toBeNull();
    expect(p.contado?.contraentregaPct).toBe(10);
    expect(p.contado?.precioMxn).toBe(1_279_872);
  });
});
