import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing «frente al mar». Cadenas planas; `{total}` y `{email}`
// los resuelve el formulario.

export const FORM: CopyForm = {
  etiqueta: 'Las {total} {total|propiedad|propiedades}, con sus números',
  titulo: 'Precio, enganche y disponibilidad de cada una',
  cuerpo: 'Llega por correo el mismo día y un asesor te escribe por WhatsApp.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Propiedad de interés',
  verTodas: 'Quiero ver todas',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $6 M MXN', '$6 M a $12 M MXN', 'Más de $12 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la información',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} los precios, el enganche y la disponibilidad de {total|la propiedad|las {total} propiedades}. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Frente al mar (sin propiedad específica)',
  whatsappGenerico:
    'Hola, vi las propiedades frente al mar en su página. ¿Me pasan precios y disponibilidad?',
  whatsappPorPropiedad: 'Hola, me interesa esta propiedad: {titulo}. ¿Me pasan precio y disponibilidad?',
};

/** Texto de la vista tal como la declara el Hub. */
export const VISTA_TEXTO: Record<string, string> = {
  Mar: 'Frente al mar',
  'Mar lateral': 'Vista lateral al mar',
};

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles. Las imágenes las proporciona cada desarrollador y pueden incluir renders. La vista al mar es la declarada por el desarrollador para cada unidad.';
