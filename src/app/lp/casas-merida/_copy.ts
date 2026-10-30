import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de casas en Mérida. Cadenas planas: lo que interpola usa
// marcadores `{total}` que resuelve el componente.

/** El gancho de la página: crédito. Solo se usa si el Hub lo declara. */
export const HOOK = {
  tituloCredito: 'Casas en Mérida que puedes comprar con tu crédito Infonavit o Fovissste',
  tituloBase: 'Casas en venta en Mérida con precio y enganche publicados',
  comoPagar: 'Elige cómo quieres pagar y te mandamos solo lo que aplica',
  otras: 'Otras casas en Mérida',
  unaCoincide: 'Esta es la que coincide con lo que elegiste',
  sinCoincidencias:
    'Ninguna casa publicada cumple con todo lo que elegiste. Quita un filtro, o mándanos el formulario y te decimos qué hay cerca.',
  quitarFiltros: 'Quitar filtros',
  otraOpcion:
    'Si esta casa no encaja con tu presupuesto o tu zona, dínoslo: somos comercializadora, no desarrolladora, y te buscamos otra en Mérida.',
} as const;

export const FORM: CopyForm = {
  etiqueta: 'La ficha completa de esta casa',
  titulo: 'Te mandamos precio, enganche y planos',
  cuerpo: 'Dinos cómo quieres pagar y lo que buscas. Llega por correo el mismo día y un asesor te escribe por WhatsApp.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Casa de interés',
  verTodas: 'Quiero ver todas',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $2.5 M MXN', '$2.5 M a $4 M MXN', 'Más de $4 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la ficha',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  coinciden: '{n} {n|casa coincide|casas coinciden} con lo que elegiste.',
  exitoCuerpo:
    'Te enviamos a {email} el precio, el enganche y los planos de {total|la casa|las {total} casas}. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Mérida (sin casa específica)',
  whatsappGenerico: 'Hola, vi la casa en venta en Mérida en su página. ¿Me pasan precio, enganche y planos?',
  whatsappPorPropiedad: 'Hola, me interesa esta casa: {titulo}. ¿Me pasan precio, enganche y planos?',
};

export const PIE_AVISO =
  'Precio y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de este inmueble. Las imágenes las proporciona el desarrollador y pueden incluir renders.';
