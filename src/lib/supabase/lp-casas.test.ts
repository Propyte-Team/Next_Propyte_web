import { describe, expect, it } from 'vitest';
import { construirInventario, resumenInventario, type FilaUnidad } from './lp-casas';

// ============================================================
// Fixture REAL. Son las filas que `v_units` devolvía en producción el
// 2026-08-27 para el filtro de la landing (Casa/Villa en Playa del Carmen y
// Tulum, aprobadas y publicadas), recortadas a las columnas que el módulo
// selecciona y a tres imágenes por unidad.
//
// Real y no sintético a propósito: los tres casos que de verdad pueden hacer
// que la página publique una cifra equivocada son rarezas de ESTOS datos —dos
// casas vendidas en dólares, una sin enganche declarado, y portadas de
// desarrollo compartidas entre unidades hermanas—. Un fixture inventado
// tendría los casos que uno se acuerda de inventar.
// ============================================================
const FILAS: FilaUnidad[] = [
  {
    id: 'f3b60059-aa26-410a-bc3d-e1baa3f48769',
    slug: 'casa-2-recamaras-en-preventa-comunidad-privada',
    title: 'Casa 2 Recámaras en Preventa | Comunidad Privada',
    city: 'Playa del Carmen', zone: 'Maroma',
    bedrooms: 2, bathrooms: 2, built_area_m2: 106.65, lot_area_m2: 200,
    price_mxn: 4404750, price_usd: null, currency: 'MXN',
    down_payment_pct: 10, down_payment_mxn: 440475, fin_enganche_pct: 10,
    parking_spots: 2, has_pool: false, tipo_entrega: 'Equipada', is_presale: true,
    cover_image: 'https://x.supabase.co/storage/v1/object/public/property-images/desarrollo/e539ee7c/portada.webp',
    images: ['https://x.supabase.co/storage/v1/object/public/property-images/unidad/f3b60059/1.webp'],
  },
  {
    // Vendida en DÓLARES. El caso que rompe cualquier formateo ingenuo.
    id: 'e9ba2589-ab36-499d-9c81-26dbd9438131',
    slug: 'casa-2-recamaras-con-alberca-en-comunidad-privada-riviera',
    title: 'Casa 2 Recámaras con Alberca en Comunidad Privada, Riviera',
    city: 'Playa del Carmen', zone: 'Puerto Aventuras',
    bedrooms: 2, bathrooms: 2, built_area_m2: 163.69, lot_area_m2: 665.28,
    price_mxn: null, price_usd: 412800, currency: 'USD',
    down_payment_pct: null, down_payment_mxn: null, fin_enganche_pct: null,
    parking_spots: 2, has_pool: true, tipo_entrega: 'Equipada', is_presale: true,
    cover_image: 'https://x.supabase.co/storage/v1/object/public/property-images/desarrollo/06ea760e/portada.webp',
    images: ['https://x.supabase.co/storage/v1/object/public/property-images/unidad/e9ba2589/1.webp'],
  },
  {
    // Sin enganche declarado y SIN fotos de unidad: cae a la portada.
    id: '011217b1-c24c-4aab-84dd-9aff687077f5',
    slug: 'tu-hogar-entre-la-selva-casa-de-3-rec',
    title: 'Tu hogar entre la selva Casa de 3 Rec',
    city: 'Tulum', zone: 'Tulum Sur',
    bedrooms: 3, bathrooms: 3, built_area_m2: 130, lot_area_m2: 194,
    price_mxn: 5211926, price_usd: null, currency: 'MXN',
    down_payment_pct: null, down_payment_mxn: null, fin_enganche_pct: null,
    parking_spots: 1, has_pool: false, tipo_entrega: null, is_presale: false,
    cover_image: 'https://x.supabase.co/storage/v1/object/public/property-images/desarrollo/ef05cd3a/portada.webp',
    images: null,
  },
  {
    id: 'ae1f12de-999d-4d40-bfde-62fc55e08ed9',
    slug: 'casa-pucte', title: 'Casa Pucte',
    city: 'Tulum', zone: 'Aldea Zamá',
    bedrooms: 5, bathrooms: 5, built_area_m2: 475, lot_area_m2: 370.19,
    price_mxn: 14689501, price_usd: null, currency: 'MXN',
    down_payment_pct: 30, down_payment_mxn: 4406850.3, fin_enganche_pct: 30,
    parking_spots: 2, has_pool: false, tipo_entrega: 'Equipada (turnkey)', is_presale: false,
    cover_image: 'https://x.supabase.co/storage/v1/object/public/property-images/desarrollo/52b7fe7a/portada.webp',
    images: ['https://x.supabase.co/storage/v1/object/public/property-images/unidad/ae1f12de/1.webp'],
  },
];

describe('construirInventario', () => {
  it('ordena ascendente por valor comparable, normalizando USD', () => {
    const inv = construirInventario(FILAS);
    expect(inv.map((c) => c.slug)).toEqual([
      'casa-2-recamaras-en-preventa-comunidad-privada', // 4.40 M MXN
      'tu-hogar-entre-la-selva-casa-de-3-rec',          // 5.21 M MXN
      'casa-2-recamaras-con-alberca-en-comunidad-privada-riviera', // 412.8 K USD ≈ 7.6 M
      'casa-pucte',                                     // 14.69 M MXN
    ]);
  });

  it('respeta la moneda declarada y NO convierte el precio publicado', () => {
    const inv = construirInventario(FILAS);
    const enDolares = inv.find((c) => c.slug.includes('comunidad-privada-riviera'));

    // El precio se publica tal cual lo declaró el desarrollador. Si esto
    // cambiara a pesos, la tarjeta anunciaría una casa de medio millón de
    // dólares como si costara 412,800 pesos.
    expect(enDolares?.precio).toEqual({ monto: 412800, moneda: 'USD' });

    const enPesos = inv.find((c) => c.slug === 'casa-pucte');
    expect(enPesos?.precio).toEqual({ monto: 14689501, moneda: 'MXN' });
  });

  it('deja el enganche en null cuando el registro no lo declara', () => {
    const inv = construirInventario(FILAS);
    const sinEnganche = inv.find((c) => c.slug === 'tu-hogar-entre-la-selva-casa-de-3-rec');

    // null ⇒ la UI publica el chip «Confirmar». Nunca un 0 ni un estimado.
    expect(sinEnganche?.enganchePct).toBeNull();
    expect(sinEnganche?.engancheMxn).toBeNull();
  });

  it('el enganche declarado cuadra contra el precio', () => {
    const inv = construirInventario(FILAS);
    for (const casa of inv) {
      if (casa.enganchePct === null || casa.engancheMxn === null) continue;
      if (casa.precio?.moneda !== 'MXN') continue;
      const esperado = casa.precio.monto * (casa.enganchePct / 100);
      // 1 peso de tolerancia: el registro guarda centavos (4,406,850.30).
      expect(Math.abs(esperado - casa.engancheMxn)).toBeLessThan(1);
    }
  });

  it('prefiere la foto de la unidad sobre la portada del desarrollo', () => {
    const inv = construirInventario(FILAS);
    const conFoto = inv.find((c) => c.slug === 'casa-pucte');
    // Portadas compartidas entre unidades hermanas producirían una cuadrícula
    // con la misma imagen repetida — se lee como inventario inflado.
    expect(conFoto?.imagen).toContain('/unidad/');
  });

  it('cae a la portada del desarrollo cuando la unidad no tiene fotos', () => {
    const inv = construirInventario(FILAS);
    const sinFotos = inv.find((c) => c.slug === 'tu-hogar-entre-la-selva-casa-de-3-rec');
    expect(sinFotos?.imagen).toContain('/desarrollo/');
  });

  it('descarta filas sin precio en vez de renderizar una tarjeta sin cifra', () => {
    const sinPrecio: FilaUnidad = {
      ...FILAS[0], id: 'x', slug: 'sin-precio',
      price_mxn: null, price_usd: null, currency: null,
    };
    const inv = construirInventario([...FILAS, sinPrecio]);
    expect(inv.map((c) => c.slug)).not.toContain('sin-precio');
    expect(inv).toHaveLength(4);
  });

  it('descarta filas sin slug o sin título', () => {
    const anonima: FilaUnidad = { ...FILAS[0], id: 'y', slug: null, title: 'Sin slug' };
    expect(construirInventario([anonima])).toHaveLength(0);
  });
});

describe('resumenInventario', () => {
  it('deriva el titular del inventario, sin cifras escritas a mano', () => {
    const resumen = resumenInventario(construirInventario(FILAS));

    expect(resumen.total).toBe(4);
    // «Desde» es el más barato, en su moneda original.
    expect(resumen.desde).toEqual({ monto: 4404750, moneda: 'MXN' });
    // Playa del Carmen (2) va antes que Tulum (2) por orden de inserción
    // estable en empate; lo que importa es que estén las dos.
    expect(resumen.ciudades).toContain('Playa del Carmen');
    expect(resumen.ciudades).toContain('Tulum');
    expect(resumen.engancheMinimoPct).toBe(10);
  });

  it('no revienta con inventario vacío', () => {
    const resumen = resumenInventario([]);
    expect(resumen.total).toBe(0);
    expect(resumen.desde).toBeNull();
    expect(resumen.engancheMinimoPct).toBeNull();
  });
});
