/**
 * Lectura del precio de un desarrollo según su moneda.
 *
 * Contraparte de `src/lib/precio-moneda.ts` en Propyte_hub, lado lectura. El Hub
 * guarda el precio del desarrollo en el par de columnas de su moneda —
 * `ext_precio_min_mxn`/`ext_precio_max_mxn` o `ext_precio_min_usd`/`ext_precio_max_usd`
 * — y `v_developments` los expone como `price_min_mxn`/`price_max_mxn` y
 * `price_min_usd`/`price_max_usd`, con `currency` diciendo cuál par es el bueno.
 *
 * Regla dura: si `currency` dice USD, el par en pesos NO se lee, aunque traiga un
 * número. Antes había una sola columna, denominada en pesos, y `currency` no se
 * usaba para nada: un desarrollo cotizado en dólares se publicaba como
 * "$145,000 MXN · $8,550 USD (Referencial)" — el monto correcto con la moneda
 * equivocada y una conversión inventada encima.
 */

export type Moneda = 'MXN' | 'USD';

/** Todo lo que no sea USD cae a MXN: el catálogo del Hub sólo tiene esas dos. */
export function normalizaMoneda(valor: unknown): Moneda {
  return String(valor ?? '').trim().toUpperCase() === 'USD' ? 'USD' : 'MXN';
}

/** Fila de `v_developments` (o de la tabla, con los nombres físicos). */
export type FilaPrecioDesarrollo = {
  currency?: string | null;
  price_min_mxn?: number | string | null;
  price_max_mxn?: number | string | null;
  price_min_usd?: number | string | null;
  price_max_usd?: number | string | null;
  ext_moneda?: string | null;
  ext_precio_min_mxn?: number | string | null;
  ext_precio_max_mxn?: number | string | null;
  ext_precio_min_usd?: number | string | null;
  ext_precio_max_usd?: number | string | null;
};

export type PrecioDesarrollo = {
  /** Moneda en que están `min` y `max`. Nunca es una conversión. */
  moneda: Moneda;
  min: number | null;
  max: number | null;
  /** La columna de la otra moneda trae dato: fila inconsistente, no se adivina. */
  desalineado: boolean;
};

/** Un precio sólo cuenta si es número finito y positivo (NUMERIC llega como string). */
function monto(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Monto cotizado de un `Property.price`, en la moneda que declara `currency`.
 *
 * `price.mxn` lleva SÓLO pesos (lo usan orden y filtros) y `price.usd` el monto en
 * dólares cuando así se cotizó. Leer `price.mxn` a secas daba 0 en una unidad en
 * dólares — `precio_mxn` está NULL — y la ficha mostraba "—" con el precio ahí al
 * lado, en la otra columna.
 */
export function montoCotizado(price: {
  mxn: number;
  usd?: number;
  currency: Moneda;
}): number | null {
  const n = price.currency === 'USD' ? price.usd : price.mxn;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Las dos caras de un precio: la cotizada (tal cual) y la referencial (calculada).
 *
 * Vive acá y no dentro de PriceDisplay porque ESTA es la fórmula que estaba mal.
 * Antes el componente asumía que el monto siempre venía en pesos y sacaba la otra
 * cara dividiendo por el TC; con un monto en dólares eso daba dos cifras falsas a
 * la vez: 145,000 rotulado MXN y 8,550 rotulado USD. Sacarla a función pura la
 * hace testeable sin montar el contexto de React.
 *
 * @param rate Pesos por dólar (TC Banxico).
 */
export function carasDelPrecio(
  monto: number,
  moneda: Moneda,
  rate: number,
): { original: number; originalMoneda: Moneda; referencial: number; referencialMoneda: Moneda } {
  return moneda === 'MXN'
    ? {
        original: monto,
        originalMoneda: 'MXN',
        referencial: Math.round(monto / rate),
        referencialMoneda: 'USD',
      }
    : {
        original: monto,
        originalMoneda: 'USD',
        referencial: Math.round(monto * rate),
        referencialMoneda: 'MXN',
      };
}

export function precioDesarrollo(fila: FilaPrecioDesarrollo): PrecioDesarrollo {
  const moneda = normalizaMoneda(fila.currency ?? fila.ext_moneda);

  const mxn = {
    min: monto(fila.price_min_mxn ?? fila.ext_precio_min_mxn),
    max: monto(fila.price_max_mxn ?? fila.ext_precio_max_mxn),
  };
  const usd = {
    min: monto(fila.price_min_usd ?? fila.ext_precio_min_usd),
    max: monto(fila.price_max_usd ?? fila.ext_precio_max_usd),
  };

  const propio = moneda === 'USD' ? usd : mxn;
  const ajeno = moneda === 'USD' ? mxn : usd;

  return {
    moneda,
    min: propio.min,
    max: propio.max,
    desalineado: ajeno.min != null || ajeno.max != null,
  };
}
