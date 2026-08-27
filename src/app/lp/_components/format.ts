// Formateadores compartidos de la landing. Locale fijo es-MX: la página no
// tiene variante en inglés en esta iteración.
//
// TODA CIFRA DE DINERO LLEVA «MXN», Y NO ES REDUNDANCIA. `Intl` con locale
// es-MX rinde `$1,010,880`: el mismo símbolo que el dólar. Playa del Carmen
// vende a compradores de Estados Unidos y Canadá —la propia página explica el
// fideicomiso para extranjeros en zona restringida—, así que un `$` desnudo en
// un lote de siete cifras es una ambigüedad de 20× a favor nuestro. Nadie que
// lea «$1,010,880» pensando en dólares llega contento a la primera llamada.
//
// Va en el formateador y no en cada llamada a propósito: estaba escrito a mano
// en 7 sitios y faltaba en el hero, en el plan de pagos, en el comparador y en
// la barra fija. Aquí es imposible olvidarlo.

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const MXN_CENTAVOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const M2 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

export function mxn(valor: number): string {
  return `${MXN.format(valor)} MXN`;
}

/** Para precio por m², donde los centavos sí distinguen dos lotes. */
export function mxnExacto(valor: number): string {
  return `${MXN_CENTAVOS.format(valor)} MXN`;
}

/**
 * Sin moneda. Solo donde la unidad ya está dicha en la etiqueta de al lado y
 * repetirla sería ruido — la columna derecha de una tabla cuyo encabezado ya
 * dice MXN, por ejemplo. Úsese con cuidado: el default debe ser `mxn()`.
 */
export function mxnDesnudo(valor: number): string {
  return MXN.format(valor);
}

export function m2(valor: number): string {
  return `${M2.format(valor)} m²`;
}

/** 'YYYY-MM' → 'octubre de 2027'. Devuelve null si no parsea. */
export function mesAnio(valor: string | null): string | null {
  if (!valor) return null;
  const m = /^(\d{4})-(\d{2})/.exec(valor);
  if (!m) return null;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const mes = meses[Number(m[2]) - 1];
  return mes ? `${mes} de ${m[1]}` : null;
}

/** 'YYYY-MM-DD' → '11 de agosto de 2026'. */
export function fechaLarga(valor: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!m) return null;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const mes = meses[Number(m[2]) - 1];
  return mes ? `${Number(m[3])} de ${mes} de ${m[1]}` : null;
}

// ------------------------------------------------------------
// Moneda explícita para inventario mixto.
//
// Añadido por la landing de casas, donde conviven precios en pesos y en
// dólares en la MISMA cuadrícula: dos casas de Puerto Aventuras se publican en
// USD y las otras nueve en MXN. `mxn()` ya resolvía la ambigüedad del `$`
// cuando toda la página iba en pesos; aquí la ambigüedad es peor, porque el
// visitante compara dos tarjetas contiguas y la diferencia entre 412,800 y
// 4,404,750 solo tiene sentido si la moneda está impresa en ambas.
//
// No hay conversión. Cada precio se publica en la moneda en que el
// desarrollador lo declaró. Un tipo de cambio en una página de conversión es
// una cifra que el asesor tiene que desmentir en la primera llamada.
// ------------------------------------------------------------

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function usd(valor: number): string {
  return `${USD.format(valor)} USD`;
}

/** Formatea respetando la moneda declarada. Siempre imprime el código. */
export function dinero(precio: { monto: number; moneda: 'MXN' | 'USD' }): string {
  return precio.moneda === 'USD' ? usd(precio.monto) : mxn(precio.monto);
}

/**
 * Versión compacta para titulares: «$4.4 M MXN», «$419.8 K USD».
 *
 * Solo para el titular y la barra fija, donde la cifra exacta compite con el
 * mensaje. En tarjetas y ficha va SIEMPRE `dinero()` completo: el precio exacto
 * es la promesa central de la página.
 */
export function dineroCompacto(precio: { monto: number; moneda: 'MXN' | 'USD' }): string {
  const { monto, moneda } = precio;
  if (moneda === 'USD') {
    return monto >= 1_000_000
      ? `$${(monto / 1_000_000).toFixed(1).replace(/\.0$/, '')} M USD`
      : `$${Math.round(monto / 1000)} K USD`;
  }
  return `$${(monto / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} M MXN`;
}
