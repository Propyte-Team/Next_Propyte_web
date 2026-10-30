import type { CopyForm } from '../_components/v2/FormInventario';

// Copy de la landing de propiedades frente al mar. Cadenas planas: lo que
// interpola usa marcadores `{total}` que resuelve el componente.

export const FORM: CopyForm = {
  etiqueta: 'Información de {total} propiedades',
  titulo: 'Recibe precios, enganche y disponibilidad',
  cuerpo:
    'Te llega por correo la ficha de cada propiedad y un asesor te escribe por WhatsApp el mismo día hábil.',
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
    'Te enviamos a {email} los precios, el enganche y la disponibilidad de las {total} propiedades. Un asesor te escribe por WhatsApp el mismo día hábil.',
  exitoCta: 'Escribir ahora por WhatsApp',
  sinEspecifica: 'Frente al mar (sin propiedad específica)',
  whatsappGenerico:
    'Hola, vi las propiedades frente al mar en su página. ¿Me pasan precios y disponibilidad?',
  whatsappPorPropiedad: 'Hola, me interesa esta propiedad: {titulo}. ¿Me pasan precio y disponibilidad?',
};

export const VISTA_TEXTO: Record<string, string> = {
  Mar: 'Frente al mar',
  'Mar lateral': 'Vista lateral al mar',
};

export const CIERRE_PUNTOS: [string, string][] = [
  ['Precio cerrado', 'De cada propiedad, en su moneda de venta.'],
  ['Enganche y esquema', 'Lo que pide cada desarrollador para apartar.'],
  ['Qué incluye', 'Equipada, llave en mano o en obra.'],
  ['Disponibilidad', 'Cuáles siguen libres al día de tu solicitud.'],
];

export const PIE_AVISO =
  'Precios y disponibilidad vigentes al momento de la consulta y sujetos a confirmación con el desarrollador. La vista al mar es la declarada por el desarrollador para cada unidad. Propyte no es la desarrolladora de estos inmuebles.';
