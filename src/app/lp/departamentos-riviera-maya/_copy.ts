import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de departamentos en la Riviera Maya. Cadenas planas:
// las interpolaciones usan marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Los {total} departamentos, con sus números',
  titulo: 'Dinos qué buscas y te mandamos solo lo que encaja',
  cuerpo: 'Precio, enganche y disponibilidad por correo el mismo día hábil. Un asesor te escribe por WhatsApp.',
  coinciden: '{n} {n|departamento coincide|departamentos coinciden} con lo que elegiste.',
  nombre: 'Nombre',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  propiedadLabel: 'Departamento de interés',
  verTodas: 'Quiero ver todos',
  presupuestoLabel: 'Presupuesto',
  presupuestos: ['Hasta $3.5 M MXN', '$3.5 M a $6 M MXN', 'Más de $6 M MXN', 'Todavía lo estoy definiendo'],
  enviar: 'Recibir la información',
  preferirWhatsApp: 'Prefiero preguntar por WhatsApp',
  exitoCuerpo:
    'Te enviamos a {email} los precios, el enganche y la disponibilidad de los {total} departamentos. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Riviera Maya (sin departamento específico)',
  whatsappGenerico:
    'Hola, vi los departamentos en venta en la Riviera Maya en su página. ¿Me pasan precios y disponibilidad?',
  whatsappPorPropiedad: 'Hola, me interesa este departamento: {titulo}. ¿Me pasan precio y disponibilidad?',
};

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. Propyte no es la desarrolladora de estos inmuebles. Las imágenes las proporciona cada desarrollador y pueden incluir renders.';
