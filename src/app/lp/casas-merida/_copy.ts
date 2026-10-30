import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de casas en Mérida. Cadenas planas: lo que interpola usa
// marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Ficha de {total} {total|casa|casas}',
  titulo: 'Recibe precio, enganche y disponibilidad',
  cuerpo: 'Te llega por correo la ficha de la casa y un asesor te escribe por WhatsApp el mismo día hábil.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Casa de interés',
  verTodas: 'Quiero ver todas',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $2.5 M MXN', '$2.5 M a $4 M MXN', 'Más de $4 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la ficha',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} el precio, el enganche y la disponibilidad de {total|la casa|las {total} casas}. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Mérida (sin casa específica)',
  whatsappGenerico: 'Hola, vi las casas en venta en Mérida en su página. ¿Me pasan precio y disponibilidad?',
  whatsappPorPropiedad: 'Hola, me interesa esta casa: {titulo}. ¿Me pasan precio y disponibilidad?',
};

export const PASOS: { titulo: string; cuerpo: string }[] = [
  {
    titulo: 'Recibes la ficha completa',
    cuerpo: 'Precio cerrado, enganche, esquema de pago y qué incluye la entrega, por correo.',
  },
  {
    titulo: 'Visitas o la ves por videollamada',
    cuerpo: 'Un asesor con nombre y cargo te acompaña a la casa, o te la muestra en vivo si no estás en Mérida.',
  },
  {
    titulo: 'Apartas con los documentos a la vista',
    cuerpo: 'Antes de entregar dinero te mandamos el contrato y el paquete documental para que lo revise tu abogado.',
  },
];

export const CIERRE_PUNTOS: [string, string][] = [
  ['Precio cerrado', 'En la moneda en que se vende.'],
  ['Enganche y esquema', 'Lo que pide el desarrollador para apartar.'],
  ['Qué incluye', 'Equipada, llave en mano o en obra.'],
  ['Disponibilidad', 'Si sigue libre al día de tu solicitud.'],
];

export const OTRA_OPCION = {
  titulo: '¿Buscas algo distinto en Mérida?',
  cuerpo:
    'Somos comercializadora, no desarrolladora: si esta casa no encaja con tu presupuesto o tu zona, dínoslo y te buscamos otra en Mérida.',
  cta: 'Pedir otra opción',
};

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles.';
