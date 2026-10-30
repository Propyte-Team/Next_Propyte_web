import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de terrenos en la Riviera Maya. Cadenas planas; lo que
// interpola usa marcadores `{total}` que resuelve el formulario.

export const FORM: CopyForm = {
  etiqueta: 'Los {total} {total|terreno|terrenos}, con sus números',
  titulo: 'Precio, plano y plan de pagos de cada lote',
  cuerpo: 'Llega por correo el mismo día y un asesor te escribe por WhatsApp.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Terreno de interés',
  verTodas: 'Quiero ver todos',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $1 M MXN', '$1 M a $2 M MXN', 'Más de $2 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir precios y planos',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} el precio, el plano y el plan de pagos de {total|el terreno|los {total} terrenos}. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Riviera Maya (sin terreno específico)',
  whatsappGenerico:
    'Hola, vi los terrenos residenciales de la Riviera Maya en su página. ¿Me pasan precios, planos y plan de pagos?',
  whatsappPorPropiedad: 'Hola, me interesa este terreno: {titulo}. ¿Me pasan precio, plano y plan de pagos?',
  coinciden: '{n} {n|terreno coincide|terrenos coinciden} con lo que elegiste.',
};

export const COMERCIALIZADORA =
  'Somos comercializadora, no desarrolladora: si ninguno encaja con tu presupuesto o tu superficie, dínoslo y te buscamos otro en la zona.';

export const NOTA_MENSUALIDAD =
  'Cifra orientativa sin intereses según el esquema declarado por el desarrollador; la tabla exacta te la mandamos por escrito.';

export const SIN_PLAN = 'Solo publicamos la mensualidad donde el desarrollador tiene el esquema declarado.';

export const PIE_AVISO =
  'Precios en pesos mexicanos, vigentes al momento de la consulta y sujetos a cambio y disponibilidad sin previo aviso. Las fechas de urbanización y escrituración son declaradas por cada desarrollador y no constituyen garantía. Propyte no es la desarrolladora de estos lotes. Las imágenes las proporciona cada desarrollador y pueden incluir renders.';
