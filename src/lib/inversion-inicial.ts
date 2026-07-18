// ── Inversión inicial: escrituración + mobiliario/decoración (config global, ajustable) ──

export type Nacionalidad = 'nacional' | 'extranjero';
export type NivelAcabado = 'standard' | 'alto' | 'premium';

export const ESCRITURACION_NACIONAL_PCT = 0.08;          // 8% del precio
export const FIDEICOMISO_EXTRANJERO_MXN = 60_000;         // constitución + permiso SRE (extranjero)

export const MOBILIARIO_TARIFA_M2: Record<NivelAcabado, number> = { standard: 3_000, alto: 6_000, premium: 10_000 };
export const DECORACION_TARIFA_M2: Record<NivelAcabado, number> = { standard: 1_000, alto: 2_200, premium: 4_000 };

const UBICACION_PREMIUM = /tulum|playa del carmen|puerto cancun|zona hotelera|aldea zama|region 15|riviera/i;
const UBICACION_EMERGENTE = /bacalar|chetumal|valladolid|jose maria morelos|felipe carrillo/i;

export function factorUbicacion(city: string | null | undefined, zone: string | null | undefined): number {
  const hay = `${city ?? ''} ${zone ?? ''}`;
  if (UBICACION_PREMIUM.test(hay)) return 1.15;
  if (UBICACION_EMERGENTE.test(hay)) return 0.90;
  return 1.0;
}

export function escrituracion(price: number, nac: Nacionalidad): number {
  const base = Math.round(price * ESCRITURACION_NACIONAL_PCT);
  return nac === 'extranjero' ? base + FIDEICOMISO_EXTRANJERO_MXN : base;
}

export function estimadoAcabado(m2: number, tarifaM2: number, factor: number): number {
  if (m2 <= 0) return 0;
  return Math.round(m2 * tarifaM2 * factor);
}

/** Normaliza el tipo_entrega (sucio/nullable) a qué acabados vienen incluidos. Default: cobra ambos. */
export function tipoEntregaIncluidos(raw: string | null | undefined): { mobiliario: boolean; decoracion: boolean } {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'llave en mano') return { mobiliario: true, decoracion: true };
  if (v === 'amueblada' || v === 'amueblado') return { mobiliario: true, decoracion: false };
  return { mobiliario: false, decoracion: false };
}

export interface InversionInicialInput {
  price: number;
  engancheMxn: number;
  nacionalidad: Nacionalidad;
  m2: number;
  city: string | null;
  zone: string | null;
  tipoEntrega: string | null;
  mobiliarioNivel: NivelAcabado;
  decoracionNivel: NivelAcabado;
}
export interface InversionInicialResult {
  escrituracion: number;
  mobiliario: number;
  decoracion: number;
  mobiliarioIncluido: boolean;
  decoracionIncluido: boolean;
  enganche: number;
  total: number;
}

export function computeInversionInicial(i: InversionInicialInput): InversionInicialResult {
  const incl = tipoEntregaIncluidos(i.tipoEntrega);
  const factor = factorUbicacion(i.city, i.zone);
  const esc = escrituracion(i.price, i.nacionalidad);
  const mobiliario = incl.mobiliario ? 0 : estimadoAcabado(i.m2, MOBILIARIO_TARIFA_M2[i.mobiliarioNivel], factor);
  const decoracion = incl.decoracion ? 0 : estimadoAcabado(i.m2, DECORACION_TARIFA_M2[i.decoracionNivel], factor);
  return {
    escrituracion: esc,
    mobiliario, decoracion,
    mobiliarioIncluido: incl.mobiliario,
    decoracionIncluido: incl.decoracion,
    enganche: i.engancheMxn,
    total: i.engancheMxn + esc + mobiliario + decoracion,
  };
}
