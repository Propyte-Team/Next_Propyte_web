// Formateadores compartidos de la landing. Locale fijo es-MX: la página no
// tiene variante en inglés en esta iteración.

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
  return MXN.format(valor);
}

/** Para precio por m², donde los centavos sí distinguen dos lotes. */
export function mxnExacto(valor: number): string {
  return MXN_CENTAVOS.format(valor);
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
