import type { Faq } from './FaqAcordeon';

// ============================================================
// Preguntas de «compra» y «financiamiento» del sitio (`/es/faq`, namespace
// `faq` de `src/i18n/messages/es.json`), copiadas aquí para que la landing no
// dependa de next-intl (vive fuera de `[locale]`). Si cambian allí, cambian
// aquí: son las mismas respuestas y deben seguir diciéndolo igual.
// ============================================================

export const FAQ_COMPRA: Faq[] = [
  {
    q: '¿Puedo comprar propiedad en México siendo extranjero?',
    a: 'Sí. Los extranjeros pueden comprar propiedad en México. En zonas restringidas (50 km de la costa, 100 km de fronteras), se requiere un fideicomiso bancario que te otorga los mismos derechos que un propietario mexicano.',
  },
  {
    q: '¿Cuánto cuestan los gastos de escrituración?',
    a: 'Los gastos de escrituración varían por estado: 6-8% del valor de la propiedad en Quintana Roo (Cancún, Tulum, Playa del Carmen) y 5-7% en Yucatán (Mérida). Incluyen impuesto de adquisición, honorarios notariales y derechos de registro.',
  },
  {
    q: '¿Cuánto tiempo tarda el proceso de compra?',
    a: 'El proceso completo toma entre 30-90 días dependiendo del tipo de propiedad y financiamiento. Compras de contado son más rápidas (30-45 días). Con crédito hipotecario puede extenderse a 60-90 días.',
  },
  {
    q: '¿Qué es un fideicomiso bancario?',
    a: 'Es un instrumento legal donde un banco mexicano mantiene la propiedad a nombre del comprador extranjero. Te otorga derechos completos de uso, renta, venta y herencia. Se renueva cada 50 años automáticamente.',
  },
];

export const FAQ_FINANCIAMIENTO: Faq[] = [
  {
    q: '¿Puedo obtener un crédito hipotecario como extranjero?',
    a: 'Algunos bancos mexicanos ofrecen hipotecas a extranjeros con residencia temporal o permanente. Los requisitos suelen ser más estrictos y las tasas ligeramente más altas que para nacionales.',
  },
  {
    q: '¿Qué es el financiamiento directo del desarrollador?',
    a: 'Es un plan de pago donde pagas directamente al desarrollador en mensualidades durante la construcción, típicamente a 0% de interés. Requiere un enganche del 20-30% y el saldo se cubre en 12-36 meses.',
  },
  {
    q: '¿Propyte cobra comisión a los compradores?',
    a: 'No. Nuestro servicio es gratuito para compradores e inversionistas. Trabajamos con desarrolladores que cubren nuestros honorarios como parte de su estrategia de venta.',
  },
];

export const FAQ_COMPRA_Y_FINANCIAMIENTO: Faq[] = [...FAQ_COMPRA, ...FAQ_FINANCIAMIENTO];
