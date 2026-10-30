import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de casas en Playa del Carmen. Cadenas planas: todo lo que
// interpola usa marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Las {total} casas, con sus números',
  titulo: 'Te mandamos precio, enganche y disponibilidad de cada una',
  cuerpo: 'Llega por correo el mismo día y un asesor te escribe por WhatsApp.',
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

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles. Las imágenes las proporciona cada desarrollador y pueden incluir renders.';
