import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de casas en Mérida. Cadenas planas: lo que interpola usa
// marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'La ficha completa de esta casa',
  titulo: 'Te mandamos precio, enganche y planos',
  cuerpo: 'Llega por correo el mismo día y un asesor te escribe por WhatsApp.',
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
    'Te enviamos a {email} el precio, el enganche y los planos de {total|la casa|las {total} casas}. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Mérida (sin casa específica)',
  whatsappGenerico: 'Hola, vi la casa en venta en Mérida en su página. ¿Me pasan precio, enganche y planos?',
  whatsappPorPropiedad: 'Hola, me interesa esta casa: {titulo}. ¿Me pasan precio, enganche y planos?',
};

export const PIE_AVISO =
  'Precio y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de este inmueble. Las imágenes las proporciona el desarrollador y pueden incluir renders.';
