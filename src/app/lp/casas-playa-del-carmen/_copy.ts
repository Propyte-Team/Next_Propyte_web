import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de casas en Playa del Carmen. Cadenas planas: todo lo que
// interpola usa marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Información de {total} casas',
  titulo: 'Recibe precios, enganche y disponibilidad',
  cuerpo: 'Te llega por correo la ficha de cada casa y un asesor te escribe por WhatsApp el mismo día hábil.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Casa de interés',
  verTodas: 'Quiero ver todas',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $6 M MXN', '$6 M a $11 M MXN', 'Más de $11 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la información',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} los precios, el enganche y la disponibilidad de las {total} casas. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Playa del Carmen (sin casa específica)',
  whatsappGenerico: 'Hola, vi las casas en venta en Playa del Carmen en su página. ¿Me pasan precios y disponibilidad?',
  whatsappPorPropiedad: 'Hola, me interesa esta casa: {titulo}. ¿Me pasan precio y disponibilidad?',
};

export const PASOS: { titulo: string; cuerpo: string }[] = [
  {
    titulo: 'Recibes la información completa',
    cuerpo: 'Precio cerrado, enganche, esquema de pago y qué incluye la entrega de cada casa, por correo.',
  },
  {
    titulo: 'Visitas o la ves por videollamada',
    cuerpo: 'Un asesor con nombre y cargo te acompaña a la casa, o te la muestra en vivo si no estás en Playa.',
  },
  {
    titulo: 'Apartas con los documentos a la vista',
    cuerpo: 'Antes de entregar dinero te mandamos el contrato y el paquete documental para que lo revise tu abogado.',
  },
];

export const CIERRE_PUNTOS: [string, string][] = [
  ['Precio cerrado', 'De cada una de las casas, en su moneda de venta.'],
  ['Enganche y esquema', 'Lo que pide cada desarrollador para apartar.'],
  ['Qué incluye', 'Equipada, llave en mano o en obra.'],
  ['Disponibilidad', 'Cuáles siguen libres al día de tu solicitud.'],
];

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles.';
